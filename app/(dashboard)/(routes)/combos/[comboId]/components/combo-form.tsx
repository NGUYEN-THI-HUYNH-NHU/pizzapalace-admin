"use client"

import * as z from "zod";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Plus, Trash, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { Category, PizzaTag, Product } from "@prisma/client";

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
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

interface ComboOptionInput {
    productId: string;
    productName: string;
}

interface ComboSlotInput {
    name: string;
    quantity: number;
    options: ComboOptionInput[];
}

interface ComboDetailsInput {
    slots: ComboSlotInput[];
}

interface ProductForSlot extends Omit<Product, "pizzaDetails" | "comboDetails" | "drinkDetails"> {
    pizzaDetails?: {
        variants?: {
            size: string;
            crust: string;
            price: number;
        }[];
    } | null;
    drinkDetails?: {
        volume?: string;
        brand?: string | null;
    } | null;
}

interface ComboInitialData extends Omit<Product, "comboDetails"> {
    comboDetails?: ComboDetailsInput | null;
}

type SlotType = "PIZZA" | "DRINK";

interface SlotState {
    id: string;
    name: string;
    type: SlotType;
    productIds: string[];
    tagCodes: string[];
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

const getReadableTextColor = (hexColor: string) => {
    const sanitized = hexColor.replace("#", "");
    const normalized = sanitized.length === 3
        ? sanitized.split("").map((char) => `${char}${char}`).join("")
        : sanitized;

    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return "#ffffff";
    }

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 160 ? "#111111" : "#ffffff";
};

const getProductPriceRange = (product: ProductForSlot) => {
    const variantPrices = product.pizzaDetails?.variants?.map((variant) => Number(variant.price)) ?? [];

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

const formatPrice = (price: number) => `${Number(price).toLocaleString("vi-VN")}đ`;

export const ComboForm: React.FC<ComboFormProps> = ({
    initialData,
    products,
    tags
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

    const initialSlots = useMemo<SlotState[]>(() => {
        const slots = initialData?.comboDetails?.slots ?? [];

        return slots.map((slot, index) => {
            const firstOptionProduct = slot.options[0] ? productsById[slot.options[0].productId] : undefined;
            const inferredType: SlotType = firstOptionProduct?.category === Category.DRINK ? "DRINK" : "PIZZA";

            return {
                id: `${index}-${createSlotId()}`,
                name: slot.name,
                type: inferredType,
                productIds: slot.options
                    .map((option) => option.productId)
                    .filter((productId) => Boolean(productsById[productId])),
                tagCodes: []
            };
        });
    }, [initialData, productsById]);

    const [slots, setSlots] = useState<SlotState[]>(initialSlots);

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
            const sameType = slotForProductModal.type === "PIZZA"
                ? product.category === Category.PIZZA
                : product.category === Category.DRINK;

            if (!sameType || !product.isAvailable) {
                return false;
            }

            if (!productSearch.trim()) {
                return true;
            }

            return product.name.toLowerCase().includes(productSearch.trim().toLowerCase());
        });
    }, [slotForProductModal, productSearch, products]);

    const addSlot = () => {
        setSlots((prev) => [
            ...prev,
            {
                id: createSlotId(),
                name: `Slot ${prev.length + 1}`,
                type: "PIZZA",
                productIds: [],
                tagCodes: []
            }
        ]);
    };

    const updateSlot = (slotId: string, updater: (slot: SlotState) => SlotState) => {
        setSlots((prev) => prev.map((slot) => slot.id === slotId ? updater(slot) : slot));
    };

    const addProductsByTag = (slotId: string, tagCode: string) => {
        updateSlot(slotId, (slot) => {
            const nextTagCodes = slot.tagCodes.includes(tagCode)
                ? slot.tagCodes
                : [...slot.tagCodes, tagCode];

            const matchedProducts = products.filter((product) => {
                const sameType = slot.type === "PIZZA"
                    ? product.category === Category.PIZZA
                    : product.category === Category.DRINK;

                return sameType && product.isAvailable && product.tags.includes(tagCode);
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
        updateSlot(slotId, (slot) => ({
            ...slot,
            tagCodes: slot.tagCodes.filter((code) => code !== tagCode)
        }));
    };

    const toggleProductInSlot = (slotId: string, productId: string, checked: boolean) => {
        updateSlot(slotId, (slot) => {
            if (checked) {
                return {
                    ...slot,
                    productIds: Array.from(new Set([...slot.productIds, productId]))
                };
            }

            return {
                ...slot,
                productIds: slot.productIds.filter((id) => id !== productId)
            };
        });
    };

    const removeProductFromSlot = (slotId: string, productId: string) => {
        updateSlot(slotId, (slot) => ({
            ...slot,
            productIds: slot.productIds.filter((id) => id !== productId)
        }));
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
                            productName: product.name
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
                                                <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
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
                                            <Input disabled value={field.value} />
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
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem className="max-w-xs">
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
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
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Combo slots</h3>
                                <p className="text-sm text-muted-foreground">Current slots: {slots.length}</p>
                            </div>
                            <Button type="button" variant="outline" onClick={addSlot}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add combo slot
                            </Button>
                        </div>

                        {!slots.length && (
                            <p className="text-sm text-muted-foreground">No slot yet. Click Add combo slot to create one.</p>
                        )}

                        <div className="space-y-6">
                            {slots.map((slot, slotIndex) => {
                                const selectedProducts = slot.productIds
                                    .map((productId) => productsById[productId])
                                    .filter((product): product is ProductForSlot => Boolean(product));

                                const slotMinPrice = selectedProducts.length
                                    ? Math.min(...selectedProducts.map((product) => getProductPriceRange(product).min))
                                    : 0;
                                const slotMaxPrice = selectedProducts.length
                                    ? Math.max(...selectedProducts.map((product) => getProductPriceRange(product).max))
                                    : 0;

                                return (
                                    <div key={slot.id} className="rounded-md border p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold">Slot {slotIndex + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSlots((prev) => prev.filter((item) => item.id !== slot.id))}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-medium">Slot info</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <FormLabel>Slot name</FormLabel>
                                                    <Input
                                                        value={slot.name}
                                                        onChange={(event) => {
                                                            const nextName = event.target.value;
                                                            updateSlot(slot.id, (current) => ({ ...current, name: nextName }));
                                                        }}
                                                        placeholder="Ví dụ: Chọn pizza"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <FormLabel>Item type</FormLabel>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                                {slot.type}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-52">
                                                            {["PIZZA", "DRINK"].map((typeOption) => (
                                                                <DropdownMenuCheckboxItem
                                                                    key={typeOption}
                                                                    checked={slot.type === typeOption}
                                                                    onSelect={(event) => event.preventDefault()}
                                                                    onCheckedChange={() => {
                                                                        updateSlot(slot.id, (current) => ({
                                                                            ...current,
                                                                            type: typeOption as SlotType,
                                                                            productIds: [],
                                                                            tagCodes: []
                                                                        }));
                                                                    }}
                                                                >
                                                                    {typeOption}
                                                                </DropdownMenuCheckboxItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-medium">Slot toolbar</h5>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setProductSearch("");
                                                        setProductModalSlotId(slot.id);
                                                    }}
                                                >
                                                    Add product
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="outline">
                                                            Add by tags
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-64">
                                                        {tags.map((tag) => (
                                                            <DropdownMenuCheckboxItem
                                                                key={tag.id}
                                                                checked={slot.tagCodes.includes(tag.code)}
                                                                onSelect={(event) => event.preventDefault()}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked === true) {
                                                                        addProductsByTag(slot.id, tag.code);
                                                                        return;
                                                                    }

                                                                    removeTagFromSlot(slot.id, tag.code);
                                                                }}
                                                            >
                                                                {tag.name}
                                                            </DropdownMenuCheckboxItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {!!slot.tagCodes.length && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {slot.tagCodes.map((code) => {
                                                        const tag = tagsByCode[code];

                                                        if (!tag) {
                                                            return null;
                                                        }

                                                        return (
                                                            <Badge
                                                                key={tag.code}
                                                                variant="outline"
                                                                style={{
                                                                    backgroundColor: tag.color,
                                                                    borderColor: tag.color,
                                                                    color: getReadableTextColor(tag.color)
                                                                }}
                                                            >
                                                                {tag.name}
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex"
                                                                    onClick={() => removeTagFromSlot(slot.id, tag.code)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-medium">Slot products</h5>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Img</TableHead>
                                                        <TableHead>Name & Slug</TableHead>
                                                        <TableHead>Variants</TableHead>
                                                        <TableHead>Tags</TableHead>
                                                        <TableHead>Badges</TableHead>
                                                        <TableHead className="w-20">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {!selectedProducts.length && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                                No products in the slot.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    {selectedProducts.map((product) => {
                                                        const range = getProductPriceRange(product);
                                                        const productTags = product.tags
                                                            .map((code) => tagsByCode[code])
                                                            .filter((tag): tag is PizzaTag => Boolean(tag));

                                                        return (
                                                            <TableRow key={product.id}>
                                                                <TableCell>
                                                                    <Image
                                                                        src={product.img}
                                                                        alt={product.name}
                                                                        width={40}
                                                                        height={40}
                                                                        className="h-10 w-10 rounded-full object-cover border"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <p className="font-medium">{product.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{product.slug}</p>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {product.category === Category.PIZZA
                                                                        ? (
                                                                            <div className="text-xs">
                                                                                <p>{product.pizzaDetails?.variants?.length ?? 0} variants</p>
                                                                                <p className="text-muted-foreground">
                                                                                    {formatPrice(range.min)} - {formatPrice(range.max)}
                                                                                </p>
                                                                            </div>
                                                                        )
                                                                        : (
                                                                            <div className="text-xs">
                                                                                <p>{product.drinkDetails?.volume ?? "No volume"}</p>
                                                                                <p className="text-muted-foreground">{product.drinkDetails?.brand ?? "No brand"}</p>
                                                                            </div>
                                                                        )
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap gap-1 max-w-55">
                                                                        {productTags.length > 0
                                                                            ? productTags.map((tag) => (
                                                                                <Badge
                                                                                    key={`${product.id}-${tag.code}`}
                                                                                    variant="outline"
                                                                                    style={{
                                                                                        backgroundColor: tag.color,
                                                                                        borderColor: tag.color,
                                                                                        color: getReadableTextColor(tag.color)
                                                                                    }}
                                                                                >
                                                                                    {tag.name}
                                                                                </Badge>
                                                                            ))
                                                                            : <span className="text-xs text-muted-foreground">-</span>
                                                                        }
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {product.isNew && (
                                                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                                                New
                                                                            </Badge>
                                                                        )}
                                                                        {product.isBestSeller && (
                                                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                                                                                Best Seller
                                                                            </Badge>
                                                                        )}
                                                                        {!product.isNew && !product.isBestSeller && (
                                                                            <span className="text-xs text-muted-foreground">-</span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeProductFromSlot(slot.id, product.id)}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>

                                            <p className="text-sm text-muted-foreground">
                                                Slot description (auto): {selectedProducts.length} product, from {formatPrice(slotMinPrice)} to {formatPrice(slotMaxPrice)}.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </div >
    );
}
