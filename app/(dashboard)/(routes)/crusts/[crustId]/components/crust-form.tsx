"use client"

import * as z from "zod";
import { useState } from "react";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { PizzaSize } from "@prisma/client";

import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertModal } from "@/components/modals/alert-modal";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    availableSizes: z.array(z.string()),
    isAvailable: z.boolean()
});

type CrustFormValues = z.infer<typeof formSchema>;

interface CrustFormProps {
    initialData: {
        id: string;
        name: string;
        code: string;
        availableSizes?: string[];
        isAvailable: boolean;
    } | null;
    sizes: PizzaSize[];
}

export const CrustForm: React.FC<CrustFormProps> = ({
    initialData,
    sizes
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit pizza crust" : "Create pizza crust";
    const description = initialData ? "Edit a pizza crust" : "Add a new pizza crust";
    const toastMessage = initialData ? "Pizza crust updated" : "Pizza crust created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<CrustFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name ?? '',
            code: initialData?.code ?? '',
            availableSizes: initialData?.availableSizes ?? [],
            isAvailable: initialData?.isAvailable ?? true
        },
    });

    const onSubmit = async (data: CrustFormValues) => {
        try {
            setLoading(true);

            if (initialData) {
                await axios.patch(`/api/crusts/${params.crustId}`, data);
            } else {
                await axios.post(`/api/crusts`, data);
            }

            router.refresh();
            router.push(`/crusts`);
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
            await axios.delete(`/api/crusts/${params.crustId}`)
            router.refresh();
            router.push(`/crusts`);
            toast.success("Pizza crust deleted.");
        } catch {
            toast.error("Make sure you removed all pizzas using this crust first.")
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

            <Separator className="my-2" />

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8 w-full"
                >
                    <div className="grid grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Pizza crust name..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Pizza crust code..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isAvailable"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Available
                                        </FormLabel>
                                        <FormDescription>
                                            These crusts are available?
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="availableSizes"
                            render={({ field }) => (
                                <FormItem className="space-y-3 md:col-span-1">
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
                    </div>
                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </div >
    );
}