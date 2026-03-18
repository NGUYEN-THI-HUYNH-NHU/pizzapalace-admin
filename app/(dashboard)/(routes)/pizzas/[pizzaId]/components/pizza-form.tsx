"use client"

import * as z from "zod";
import { useMemo, useState } from "react";
import { Trash, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { PizzaCrust, PizzaSize, PizzaTag, Product } from "@prisma/client";

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

interface VariantRow {
    sizeCode: string;
    sizeName: string;
    crustCode: string;
    crustName: string;
}

interface PizzaDetailsInput {
    sizes: string[];
    crusts: string[];
    variants: {
        size: string;
        crust: string;
        price: number;
        sku: string;
        isAvailable: boolean;
    }[];
}

interface PizzaInitialData extends Omit<Product, "pizzaDetails"> {
    pizzaDetails?: PizzaDetailsInput | null;
}

const formSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    desc: z.string().min(1),
    img: z.string().min(1),
    price: z.number().min(1),
    tagCodes: z.array(z.string()),
    sizes: z.array(z.string()),
    crusts: z.array(z.string()),
    isAvailable: z.boolean(),
    isNew: z.boolean(),
    isBestSeller: z.boolean()
});

type PizzaFormValues = z.infer<typeof formSchema>;

interface PizzaFormProps {
    initialData: PizzaInitialData | null;
    sizes: PizzaSize[];
    crusts: PizzaCrust[];
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

export const PizzaForm: React.FC<PizzaFormProps> = ({
    initialData,
    sizes,
    crusts,
    tags
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit pizza" : "Create pizza";
    const description = initialData ? "Edit a pizza" : "Add a new pizza";
    const toastMessage = initialData ? "Pizza updated." : "Pizza created.";
    const action = initialData ? "Save changes" : "Create";

    const initialVariantPrices = useMemo(() => {
        const variants = initialData?.pizzaDetails?.variants ?? [];

        return variants.reduce<Record<string, number>>((acc, variant) => {
            acc[`${variant.size}__${variant.crust}`] = variant.price;
            return acc;
        }, {});
    }, [initialData]);

    const [variantPrices, setVariantPrices] = useState<Record<string, number>>(initialVariantPrices);

    const form = useForm<PizzaFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            slug: initialData?.slug ?? "",
            desc: initialData?.desc ?? "",
            img: initialData?.img ?? "",
            price: initialData?.price ?? 0,
            tagCodes: (initialData?.tags ?? [])
                .map((tag) => {
                    if (typeof tag === "string") {
                        return tag;
                    }

                    return tag?.code;
                })
                .filter((code): code is string => typeof code === "string" && code.length > 0),
            sizes: initialData?.pizzaDetails?.sizes ?? [],
            crusts: initialData?.pizzaDetails?.crusts ?? [],
            isAvailable: initialData?.isAvailable ?? true,
            isNew: initialData?.isNew ?? true,
            isBestSeller: initialData?.isBestSeller ?? false
        }
    });

    const selectedSizeCodes = form.watch("sizes");
    const selectedCrustCodes = form.watch("crusts");
    const basePrice = form.watch("price");
    const isAvailable = form.watch("isAvailable");
    const isNew = form.watch("isNew");
    const isBestSeller = form.watch("isBestSeller");

    const selectedFlagsCount = [isAvailable, isNew, isBestSeller].filter(Boolean).length;
    const areAllFlagsSelected = selectedFlagsCount === 3;
    const areSomeFlagsSelected = selectedFlagsCount > 0 && selectedFlagsCount < 3;

    const selectedSizes = useMemo(
        () => sizes.filter((size) => selectedSizeCodes.includes(size.code)),
        [sizes, selectedSizeCodes]
    );

    const selectedCrusts = useMemo(
        () => crusts.filter((crust) => selectedCrustCodes.includes(crust.code)),
        [crusts, selectedCrustCodes]
    );

    const variantRows = useMemo<VariantRow[]>(() => {
        const rows: VariantRow[] = [];

        selectedCrusts.forEach((crust) => {
            const availableSizes = crust.availableSizes ?? [];

            selectedSizes.forEach((size) => {
                if (!availableSizes.includes(size.code)) {
                    return;
                }

                rows.push({
                    sizeCode: size.code,
                    sizeName: size.name,
                    crustCode: crust.code,
                    crustName: crust.name
                });
            });
        });

        return rows;
    }, [selectedSizes, selectedCrusts]);

    const onSubmit = async (data: PizzaFormValues) => {
        try {
            setLoading(true);

            const variants = variantRows.map((row) => {
                const key = `${row.sizeCode}__${row.crustCode}`;
                const variantPrice = variantPrices[key] ?? data.price;

                return {
                    size: row.sizeCode,
                    crust: row.crustCode,
                    price: Number(variantPrice),
                    sku: `${data.slug}-${row.sizeCode}-${row.crustCode}`.toLowerCase(),
                    isAvailable: true
                };
            });

            const payload = {
                name: data.name,
                slug: data.slug,
                desc: data.desc,
                img: data.img,
                price: data.price,
                tags: tags
                    .filter((tag) => data.tagCodes.includes(tag.code))
                    .map((tag) => ({
                        name: tag.name,
                        code: tag.code,
                        color: tag.color
                    })),
                isAvailable: data.isAvailable,
                isNew: data.isNew,
                isBestSeller: data.isBestSeller,
                pizzaDetails: {
                    sizes: data.sizes,
                    crusts: data.crusts,
                    variants
                }
            };

            if (initialData) {
                await axios.patch(`/api/pizzas/${params.pizzaId}`, payload);
            } else {
                await axios.post(`/api/pizzas`, payload);
            }

            router.refresh();
            router.push(`/pizzas`);
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
            await axios.delete(`/api/pizzas/${params.pizzaId}`)
            router.refresh();
            router.push(`/pizzas`);
            toast.success("Pizza deleted.");
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
                        <h3 className="font-semibold">Pizza Image</h3>
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
                                                placeholder="Pizza Phô Mai Cao Cấp"
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
                                            step="1000"
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

                    <div className="space-y-3">
                        <h3 className="font-semibold">Tags</h3>
                        <FormField
                            control={form.control}
                            name="tagCodes"
                            render={({ field }) => {
                                const selectedTags = tags.filter((tag) => field.value.includes(tag.code));

                                return (
                                    <FormItem>
                                        <FormLabel>Select tags</FormLabel>
                                        <FormControl>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="outline" className="w-full justify-between">
                                                            {field.value.length > 0
                                                                ? `Selected ${field.value.length} tag(s)`
                                                                : "Choose tags"}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-70">
                                                        {tags.map((tag) => {
                                                            const isSelected = field.value.includes(tag.code);

                                                            return (
                                                                <DropdownMenuCheckboxItem
                                                                    key={tag.id}
                                                                    checked={isSelected}
                                                                    onSelect={(event) => event.preventDefault()}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked === true) {
                                                                            field.onChange([...field.value, tag.code]);
                                                                            return;
                                                                        }

                                                                        field.onChange(field.value.filter((code) => code !== tag.code));
                                                                    }}
                                                                >
                                                                    {tag.name}
                                                                </DropdownMenuCheckboxItem>
                                                            );
                                                        })}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {selectedTags.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-2 col-span-2">
                                                        {selectedTags.map((tag) => (
                                                            <Badge
                                                                key={tag.id}
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
                                                                    onClick={() => field.onChange(field.value.filter((code) => code !== tag.code))}
                                                                    className="inline-flex"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold">Sizes & Crusts</h3>
                        <FormField
                            control={form.control}
                            name="sizes"
                            render={({ field }) => (
                                <FormItem className="space-y-3 col-span-1">
                                    <FormLabel>Sizes</FormLabel>
                                    <div className="flex flex-wrap gap-3">
                                        {sizes.map((size) => {
                                            const selected = field.value.includes(size.code);

                                            return (
                                                <Button
                                                    key={size.id}
                                                    type="button"
                                                    variant={selected ? "default" : "outline"}
                                                    onClick={() => {
                                                        if (selected) {
                                                            field.onChange(field.value.filter((code) => code !== size.code));
                                                            return;
                                                        }

                                                        field.onChange([...field.value, size.code]);
                                                    }}
                                                >
                                                    {size.name}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="crusts"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Crusts</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={
                                                crusts.length === 0
                                                    ? false
                                                    : field.value.length === crusts.length
                                                        ? true
                                                        : field.value.length > 0
                                                            ? "indeterminate"
                                                            : false
                                            }
                                            onCheckedChange={(checked) => {
                                                if (checked === true) {
                                                    field.onChange(crusts.map((crust) => crust.code));
                                                    return;
                                                }

                                                field.onChange([]);
                                            }}
                                        />
                                        <span className="text-sm font-medium">Select all crusts</span>
                                    </div>
                                    <div className="space-y-2">
                                        {crusts.map((crust) => {
                                            const selected = field.value.includes(crust.code);

                                            return (
                                                <div key={crust.id} className="rounded-md border p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={selected}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    field.onChange([...(field.value ?? []), crust.code]);
                                                                    return;
                                                                }

                                                                field.onChange((field.value ?? []).filter((code) => code !== crust.code));
                                                            }}
                                                        />
                                                        <span className="font-medium">{crust.name}</span>
                                                        <Badge variant="outline">{crust.code}</Badge>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Available sizes: {(crust.availableSizes ?? []).join(", ") || "None"}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-semibold">Section 6: Variants Matrix</h3>
                        {!variantRows.length ? (
                            <p className="text-sm text-muted-foreground">
                                Chọn Sizes và Crusts để tạo variants. Chỉ hiển thị cặp size/crust hợp lệ theo availableSizes của crust.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {variantRows.map((row) => {
                                    const key = `${row.sizeCode}__${row.crustCode}`;

                                    return (
                                        <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center rounded-md border p-3">
                                            <div className="text-sm font-medium md:col-span-2">
                                                {row.sizeName} ({row.sizeCode}) + {row.crustName} ({row.crustCode})
                                            </div>
                                            <Input
                                                type="number"
                                                step="1"
                                                disabled={loading}
                                                value={variantPrices[key] ?? basePrice ?? 0}
                                                onChange={(event) => {
                                                    const parsed = Number(event.target.value);
                                                    setVariantPrices((prev) => ({
                                                        ...prev,
                                                        [key]: Number.isFinite(parsed) ? parsed : basePrice
                                                    }));
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </div >
    );
}