"use client"

import * as z from "zod";
import { useState } from "react";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import { PizzaTag } from "@prisma/client";

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

const formSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    color: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color must be a valid hex value"),
});

type TagFormValues = z.infer<typeof formSchema>;

interface TagFormProps {
    initialData: PizzaTag | null;
}

const normalizeCode = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toUpperCase();

export const TagForm: React.FC<TagFormProps> = ({
    initialData
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit pizza tag" : "Create pizza tag";
    const description = initialData ? "Edit a pizza tag" : "Add a new pizza tag";
    const toastMessage = initialData ? "Pizza tag updated" : "Pizza tag created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<TagFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name ?? '',
            code: initialData?.code ?? '',
            color: initialData?.color ?? '#000000'
        },
    });

    const onSubmit = async (data: TagFormValues) => {
        try {
            setLoading(true);

            if (initialData) {
                await axios.patch(`/api/tags/${params.tagId}`, data);
            } else {
                await axios.post(`/api/tags`, data);
            }

            router.refresh();
            router.push(`/tags`);
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
            await axios.delete(`/api/tags/${params.tagId}`)
            router.refresh();
            router.push(`/tags`);
            toast.success("Pizza tag deleted.");
        } catch {
            toast.error("Make sure you removed all pizzas using this tag first.")
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
                                        <Input
                                            disabled={loading}
                                            placeholder="Chay..."
                                            value={field.value}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                field.onChange(value);
                                                form.setValue("code", normalizeCode(value), { shouldValidate: true });
                                            }}
                                        />
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
                                    <FormLabel>Code (auto)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="CHAY..." disabled value={field.value} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="color"
                                            disabled={loading}
                                            {...field}
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