"use client";

import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { Column } from "./columns";
import { useState } from "react";
import { AlertModal } from "@/components/modals/alert-modal";

interface ComboCellActionProps {
    data: Column
}

export const CellAction: React.FC<ComboCellActionProps> = ({
    data
}) => {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("Combo id copied to the clipboard.");
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/combos/${data.id}`)
            router.refresh();
            toast.success("Combo deleted.");
        } catch (error) {
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-5 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Action</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onCopy(data.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/combos/${data.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Update
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};