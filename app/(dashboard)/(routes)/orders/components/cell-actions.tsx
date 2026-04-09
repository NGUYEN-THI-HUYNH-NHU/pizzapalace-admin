"use client";

import { Copy, Eye, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OrderRecord = {
    id: string;
};

interface CellActionProps<T extends OrderRecord> {
    data: T;
    onView: (order: T) => void;
    onCopyId: (orderId: string) => void;
}

export const CellAction = <T extends OrderRecord>({ data, onView, onCopyId }: CellActionProps<T>) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onCopyId(data.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy mã đơn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onView(data)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Xem chi tiết
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
