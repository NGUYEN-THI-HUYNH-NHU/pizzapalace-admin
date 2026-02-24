"use client"

import * as z from "zod";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { Category, PizzaSize, PizzaTag, Product } from "@prisma/client";

import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertModal } from "@/components/modals/alert-modal";
import ImageUpload from "@/components/ui/image-upload";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { ComboSlots, ProductForSlot, SlotState, SlotType } from "./combo-slots";
import { currencyFormatter } from "@/lib/utils";

interface ComboOptionInput {
    productId: string;
    productName: string;
    sizeRequirement?: string;
}

interface ComboSlotInput {
    name: string;
    quantity: number;
    options: ComboOptionInput[];
}

interface ComboDetailsInput {
    slots: ComboSlotInput[];
}

interface ComboInitialData extends Omit<Product, "comboDetails"> {
    comboDetails?: ComboDetailsInput | null;
}

const formSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    desc: z.string().min(1),
    img: z.string().min(1),
    price: z.number().min(1),
    isAvailable: z.boolean(),
    isNew: z.boolean(),
    isBestSeller: z.boolean()
});

type ComboFormValues = z.infer<typeof formSchema>;

interface ComboFormProps {
    initialData: ComboInitialData | null;
    products: ProductForSlot[];
    tags: PizzaTag[];
    pizzaSizes: PizzaSize[];
}

const normalizeSlug = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const createSlotId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getProductPriceRange = (product: ProductForSlot, sizeCode?: string) => {
    const rawVariants = product.pizzaDetails?.variants ?? [];
    const variants = sizeCode
        ? rawVariants.filter((variant) => variant.size === sizeCode)
        : rawVariants;
    const variantPrices = variants.map((variant) => Number(variant.price));

    if (!variantPrices.length) {
        const basePrice = Number(product.price);

        return {
            min: basePrice,
            max: basePrice
        };
    }

    return {
        min: Math.min(...variantPrices),
        max: Math.max(...variantPrices)
    };
};

export const ComboForm: React.FC<ComboFormProps> = ({
    initialData,
    products,
    tags,
    pizzaSizes
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productModalSlotId, setProductModalSlotId] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState("");

    const title = initialData ? "Edit combo" : "Create combo";
    const description = initialData ? "Edit a combo" : "Add a new combo";
    const toastMessage = initialData ? "Combo updated." : "Combo created.";
    const action = initialData ? "Save changes" : "Create";

    const productsById = useMemo(() => {
        return products.reduce<Record<string, ProductForSlot>>((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
    }, [products]);

    const tagsByCode = useMemo(() => {
        return tags.reduce<Record<string, PizzaTag>>((acc, tag) => {
            acc[tag.code] = tag;
            return acc;
        }, {});
    }, [tags]);

    const pizzaSizesByCode = useMemo(() => {
        return pizzaSizes.reduce<Record<string, PizzaSize>>((acc, size) => {
            acc[size.code] = size;
            return acc;
        }, {});
    }, [pizzaSizes]);

    const defaultPizzaSizeCode = pizzaSizes[0]?.code ?? "";

    const isProductCompatibleWithSlot = (product: ProductForSlot, slot: SlotState) => {
        const sameType = slot.type === "PIZZA"
            ? product.category === Category.PIZZA
            : product.category === Category.DRINK;

        if (!sameType) {
            return false;
        }

        if (slot.type === "PIZZA" && slot.pizzaSizeCode) {
            return (product.pizzaDetails?.variants ?? []).some((variant) => variant.size === slot.pizzaSizeCode);
        }

        return true;
    };

    const initialSlots = useMemo<SlotState[]>(() => {
        const slots = initialData?.comboDetails?.slots ?? [];

        return slots.map((slot, index) => {
            const firstOptionProduct = slot.options[0] ? productsById[slot.options[0].productId] : undefined;
            const inferredType: SlotType = firstOptionProduct?.category === Category.DRINK ? "DRINK" : "PIZZA";

            return {
                id: `${index}-${createSlotId()}`,
                name: slot.name,
                type: inferredType,
                pizzaSizeCode: inferredType === "PIZZA"
                    ? (slot.options[0]?.sizeRequirement ?? firstOptionProduct?.pizzaDetails?.variants?.[0]?.size ?? (pizzaSizes[0]?.code ?? ""))
                    : "",
                productIds: slot.options
                    .map((option) => option.productId)
                    .filter((productId) => Boolean(productsById[productId])),
                tagCodes: []
            };
        });
    }, [initialData, productsById, pizzaSizes]);

    const [slots, setSlots] = useState<SlotState[]>(initialSlots);
    const [activeSlotId, setActiveSlotId] = useState<string>(initialSlots[0]?.id ?? "");

    const form = useForm<ComboFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            slug: initialData?.slug ?? "",
            desc: initialData?.desc ?? "",
            img: initialData?.img ?? "",
            price: initialData?.price ?? 0,
            isAvailable: initialData?.isAvailable ?? true,
            isNew: initialData?.isNew ?? true,
            isBestSeller: initialData?.isBestSeller ?? false
        }
    });

    const isAvailable = form.watch("isAvailable");
    const isNew = form.watch("isNew");
    const isBestSeller = form.watch("isBestSeller");

    const selectedFlagsCount = [isAvailable, isNew, isBestSeller].filter(Boolean).length;
    const areAllFlagsSelected = selectedFlagsCount === 3;
    const areSomeFlagsSelected = selectedFlagsCount > 0 && selectedFlagsCount < 3;

    const slotForProductModal = useMemo(
        () => slots.find((slot) => slot.id === productModalSlotId) ?? null,
        [productModalSlotId, slots]
    );

    const filteredProductsForModal = useMemo(() => {
        if (!slotForProductModal) {
            return [];
        }

        return products.filter((product) => {
            if (!product.isAvailable || !isProductCompatibleWithSlot(product, slotForProductModal)) {
                return false;
            }

            if (!productSearch.trim()) {
                return true;
            }

            return product.name.toLowerCase().includes(productSearch.trim().toLowerCase());
        });
    }, [slotForProductModal, productSearch, products]);

    const addSlot = () => {
        const newSlotId = createSlotId();

        setSlots((prev) => [
            ...prev,
            {
                id: newSlotId,
                name: `Slot ${prev.length + 1}`,
                type: "PIZZA",
                pizzaSizeCode: defaultPizzaSizeCode,
                productIds: [],
                tagCodes: []
            }
        ]);

        setActiveSlotId(newSlotId);
    };

    const updateSlot = (slotId: string, updater: (slot: SlotState) => SlotState) => {
        setSlots((prev) => prev.map((slot) => slot.id === slotId ? updater(slot) : slot));
    };

    const removeSlot = (slotId: string) => {
        setSlots((prev) => {
            const nextSlots = prev.filter((slot) => slot.id !== slotId);

            if (!nextSlots.length) {
                setActiveSlotId("");
                return nextSlots;
            }

            if (activeSlotId === slotId) {
                setActiveSlotId(nextSlots[0].id);
            }

            return nextSlots;
        });
    };

    const pruneTagCodesByProducts = (productIds: string[], tagCodes: string[]) => {
        return tagCodes.filter((tagCode) => {
            return productIds.some((productId) => productsById[productId]?.tags.includes(tagCode));
        });
    };

    const addProductsByTag = (slotId: string, tagCode: string) => {
        updateSlot(slotId, (slot) => {
            const nextTagCodes = slot.tagCodes.includes(tagCode)
                ? slot.tagCodes
                : [...slot.tagCodes, tagCode];

            const matchedProducts = products.filter((product) => {
                return isProductCompatibleWithSlot(product, slot)
                    && product.isAvailable
                    && product.tags.includes(tagCode);
            });

            const mergedProductIds = Array.from(new Set([
                ...slot.productIds,
                ...matchedProducts.map((product) => product.id)
            ]));

            return {
                ...slot,
                tagCodes: nextTagCodes,
                productIds: mergedProductIds
            };
        });
    };

    const removeTagFromSlot = (slotId: string, tagCode: string) => {
        updateSlot(slotId, (slot) => {
            const nextProductIds = slot.productIds.filter((productId) => {
                const product = productsById[productId];
                return !product?.tags.includes(tagCode);
            });

            const nextTagCodes = slot.tagCodes.filter((code) => code !== tagCode);

            return {
                ...slot,
                productIds: nextProductIds,
                tagCodes: pruneTagCodesByProducts(nextProductIds, nextTagCodes)
            };
        });
    };

    const toggleProductInSlot = (slotId: string, productId: string, checked: boolean) => {
        updateSlot(slotId, (slot) => {
            if (checked) {
                const product = productsById[productId];

                if (!product || !isProductCompatibleWithSlot(product, slot)) {
                    return slot;
                }

                return {
                    ...slot,
                    productIds: Array.from(new Set([...slot.productIds, productId]))
                };
            }

            const nextProductIds = slot.productIds.filter((id) => id !== productId);

            return {
                ...slot,
                productIds: nextProductIds,
                tagCodes: pruneTagCodesByProducts(nextProductIds, slot.tagCodes)
            };
        });
    };

    const removeProductFromSlot = (slotId: string, productId: string) => {
        updateSlot(slotId, (slot) => {
            const nextProductIds = slot.productIds.filter((id) => id !== productId);

            return {
                ...slot,
                productIds: nextProductIds,
                tagCodes: pruneTagCodesByProducts(nextProductIds, slot.tagCodes)
            };
        });
    };

    const onSubmit = async (data: ComboFormValues) => {
        try {
            setLoading(true);

            const slotsPayload: ComboSlotInput[] = slots
                .filter((slot) => slot.name.trim())
                .map((slot) => ({
                    name: slot.name.trim(),
                    quantity: 1,
                    options: slot.productIds
                        .map((productId) => productsById[productId])
                        .filter((product): product is ProductForSlot => Boolean(product))
                        .map((product) => ({
                            productId: product.id,
                            productName: product.name,
                            sizeRequirement: slot.type === "PIZZA" ? (slot.pizzaSizeCode || undefined) : undefined
                        }))
                }));

            const payload = {
                name: data.name,
                slug: data.slug,
                desc: data.desc,
                img: data.img,
                price: data.price,
                isAvailable: data.isAvailable,
                isNew: data.isNew,
                isBestSeller: data.isBestSeller,
                comboDetails: {
                    slots: slotsPayload
                }
            };

            if (initialData) {
                await axios.patch(`/api/combos/${params.comboId}`, payload);
            } else {
                await axios.post(`/api/combos`, payload);
            }

            router.refresh();
            router.push(`/combos`);
            toast.success(toastMessage);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/combos/${params.comboId}`)
            router.refresh();
            router.push(`/combos`);
            toast.success("Combo deleted.");
        } catch {
            toast.error("Something went wrong.")
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <div>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />

            <Dialog
                open={Boolean(slotForProductModal)}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setProductModalSlotId(null);
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add product</DialogTitle>
                        <DialogDescription>
                            {slotForProductModal
                                ? `Available ${slotForProductModal.type} products for ${slotForProductModal.name}`
                                : "Choose products"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            value={productSearch}
                            onChange={(event) => setProductSearch(event.target.value)}
                            placeholder="Search product by name..."
                        />
                        <div className="max-h-105 overflow-y-auto space-y-2 pr-1">
                            {filteredProductsForModal.length === 0 && (
                                <p className="text-sm text-muted-foreground">No products found.</p>
                            )}

                            {slotForProductModal && filteredProductsForModal.map((product) => {
                                const checked = slotForProductModal.productIds.includes(product.id);

                                return (
                                    <label
                                        key={product.id}
                                        className="flex items-center justify-between rounded-md border p-3 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={product.img}
                                                alt={product.name}
                                                width={44}
                                                height={44}
                                                className="h-11 w-11 rounded-full object-cover border"
                                            />
                                            <div>
                                                <p className="font-medium text-sm">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{currencyFormatter.format(product.price)}</p>
                                            </div>
                                        </div>
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) => {
                                                toggleProductInSlot(slotForProductModal.id, product.id, value === true);
                                            }}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setProductModalSlotId(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <Heading
                    title={title}
                    description={description}
                />
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="icon"
                        onClick={() => setOpen(true)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Separator className="my-4" />

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8 w-full"
                >
                    <div className="space-y-3">
                        <h3 className="font-semibold">Combo Image</h3>
                        <FormField
                            control={form.control}
                            name="img"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value ? [field.value] : []}
                                            disabled={loading}
                                            onChange={(url) => field.onChange(url)}
                                            onRemove={() => field.onChange("")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold">Name, Slug, Description</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={loading}
                                                placeholder="Combo Đại Sứ Ăn Ngon"
                                                value={field.value}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    field.onChange(value);
                                                    form.setValue("slug", normalizeSlug(value), { shouldValidate: true });
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug (auto)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="combo-dai-su-an-ngon" disabled value={field.value} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="desc"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <textarea
                                            disabled={loading}
                                            placeholder="Phô mai Mozzarella, mật ong, xốt cà chua. Ngon hơn với mật ong ..."
                                            className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-semibold">Flags</h3>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={areAllFlagsSelected ? true : (areSomeFlagsSelected ? "indeterminate" : false)}
                                onCheckedChange={(checked) => {
                                    const nextValue = checked === true;
                                    form.setValue("isAvailable", nextValue);
                                    form.setValue("isNew", nextValue);
                                    form.setValue("isBestSeller", nextValue);
                                }}
                            />
                            <span className="text-sm font-medium">Select all flags</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="isAvailable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Available</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isNew"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>New</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isBestSeller"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Best Seller</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-semibold">Base Price</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem className="max-w-xs">
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2 md:col-span-2">
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    disabled={loading}
                                                    value={field.value}
                                                    onChange={(event) => {
                                                        const raw = event.target.value;
                                                        field.onChange(raw === "" ? 0 : Number(raw));
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    <ComboSlots
                        slots={slots}
                        activeSlotId={activeSlotId}
                        loading={loading}
                        tags={tags}
                        tagsByCode={tagsByCode}
                        pizzaSizes={pizzaSizes}
                        pizzaSizesByCode={pizzaSizesByCode}
                        productsById={productsById}
                        defaultPizzaSizeCode={defaultPizzaSizeCode}
                        setActiveSlotId={setActiveSlotId}
                        addSlot={addSlot}
                        removeSlot={removeSlot}
                        setProductSearch={setProductSearch}
                        setProductModalSlotId={setProductModalSlotId}
                        updateSlot={updateSlot}
                        addProductsByTag={addProductsByTag}
                        removeTagFromSlot={removeTagFromSlot}
                        removeProductFromSlot={removeProductFromSlot}
                        pruneTagCodesByProducts={pruneTagCodesByProducts}
                        isProductCompatibleWithSlot={isProductCompatibleWithSlot}
                        getProductPriceRange={getProductPriceRange}
                    />

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </div >
    );
}
