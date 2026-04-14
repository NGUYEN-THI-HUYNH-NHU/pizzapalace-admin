"use client"

import * as z from "zod";
import { useState } from "react";
import { Trash, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { PizzaTag, Product } from "@prisma/client";

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
import { getReadableTextColor, normalizeSlug } from "@/lib/product-utils";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    desc: z.string().min(1),
    img: z.string().min(1),
    price: z.number().min(0.1),
    tagCodes: z.array(z.string()),
    isAvailable: z.boolean(),
    isNew: z.boolean(),
    isBestSeller: z.boolean()
});

type ChickenFormValues = z.infer<typeof formSchema>;

interface ChickenFormProps {
    initialData: Product | null;
    tags: PizzaTag[];
}

export const ChickenForm: React.FC<ChickenFormProps> = ({
    initialData,
    tags
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit chicken" : "Create chicken";
    const description = initialData ? "Edit a chicken" : "Add a new chicken";
    const toastMessage = initialData ? "Chicken updated." : "Chicken created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<ChickenFormValues>({
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

    const onSubmit = async (data: ChickenFormValues) => {
        try {
            setLoading(true);

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
                    })), isAvailable: data.isAvailable,
                isNew: data.isNew,
                isBestSeller: data.isBestSeller,
            };

            if (initialData) {
                await axios.patch(`/api/chickens/${params.chickenId}`, payload);
            } else {
                await axios.post(`/api/chickens`, payload);
            }

            router.refresh();
            router.push(`/chickens`);
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
            await axios.delete(`/api/chickens/${params.chickenId}`)
            router.refresh();
            router.push(`/chickens`);
            toast.success("Chicken deleted.");
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
                        <h3 className="font-semibold">Section 1: Chicken Image</h3>
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
                        <h3 className="font-semibold">Section 2: Name, Slug, Description</h3>
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
                                                placeholder="Gà Giòn Không Xương Xốt Thái Tomyum..."
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
                                            <Input disabled readOnly value={field.value} />
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
                                            placeholder="Vị gà truyền thống cùng độ chua cay Tom Yum đặc trưng..."
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
                        <h3 className="font-semibold">Section 3: Flags</h3>
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

                    <div className="space-y-3">
                        <h3 className="font-semibold">Section 4: Price</h3>
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem className="max-w-xs">
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.1"
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

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </div >
    );
}