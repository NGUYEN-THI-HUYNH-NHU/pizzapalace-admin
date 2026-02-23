"use client"

import * as z from "zod";
import { useMemo, useState } from "react";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { Product } from "@prisma/client";

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

interface ComboInitialData extends Omit<Product, "comboDetails"> {
    initialData?: Product | null;
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

export const ComboForm: React.FC<ComboFormProps> = ({
    initialData,
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit combo" : "Create combo";
    const description = initialData ? "Edit a combo" : "Add a new combo";
    const toastMessage = initialData ? "Combo updated." : "Combo created.";
    const action = initialData ? "Save changes" : "Create";


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

    const onSubmit = async (data: ComboFormValues) => {
        try {
            setLoading(true);

            const payload = {
                name: data.name,
                slug: data.slug,
                desc: data.desc,
                img: data.img,
                price: data.price,
                isAvailable: data.isAvailable,
                isNew: data.isNew,
                isBestSeller: data.isBestSeller,
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

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </div >
    );
}