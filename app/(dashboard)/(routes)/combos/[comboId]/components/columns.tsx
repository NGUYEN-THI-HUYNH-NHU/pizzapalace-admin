"use client";

import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { CellAction } from "./cell-actions";

export interface SlotProductTag {
    code: string;
    name: string;
    color: string;
}

export interface SlotProductRow {
    id: string;
    img: string;
    name: string;
    slug: string;
    info: string;
    priceRange: string;
    tags: SlotProductTag[];
    isNew: boolean;
    isBestSeller: boolean;
}

interface CreateColumnsProps {
    onRemove: (productId: string) => void;
    disabled?: boolean;
}

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

export const createSlotProductColumns = ({
    onRemove,
    disabled
}: CreateColumnsProps): ColumnDef<SlotProductRow>[] => [
        {
            accessorKey: "img",
            header: "Img",
            cell: ({ row }) => (
                <div className="relative h-11 w-11 overflow-hidden rounded-full border">
                    <Image
                        src={row.original.img}
                        alt={row.original.name}
                        fill
                        className="object-cover"
                    />
                </div>
            )
        },
        {
            accessorKey: "name",
            header: "Name & Slug",
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
                </div>
            )
        },
        {
            accessorKey: "info",
            header: "Info"
        },
        {
            accessorKey: "priceRange",
            header: "Price",
        },
        {
            accessorKey: "tags",
            header: "Tags",
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1 max-w-55">
                    {row.original.tags.length > 0
                        ? row.original.tags.map((tag) => (
                            <Badge
                                key={`${row.original.id}-${tag.code}`}
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
            )
        },
        {
            id: "badges",
            header: "Badges",
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.isNew && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            New
                        </Badge>
                    )}
                    {row.original.isBestSeller && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                            Best Seller
                        </Badge>
                    )}
                    {!row.original.isNew && !row.original.isBestSeller && (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <CellAction
                    productId={row.original.id}
                    disabled={disabled}
                    onRemove={onRemove}
                />
            )
        }
    ];
