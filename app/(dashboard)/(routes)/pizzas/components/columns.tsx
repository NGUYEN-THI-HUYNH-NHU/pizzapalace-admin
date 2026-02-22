"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-actions"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import AvailabilityToggle from "@/components/ui/availability-toggle"

export type Column = {
    id: string
    img: string
    name: string
    slug: string
    basePrice: number
    sizesCount: number
    crustsCount: number
    variantsCount: number
    isNew: boolean
    isBestSeller: boolean
    isAvailable: boolean
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
});

export const columns: ColumnDef<Column>[] = [
    {
        accessorKey: "img",
        header: "Img",
        cell: ({ row }) => (
            <div className="relative h-10 w-10 overflow-hidden rounded-full border">
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
                <p className="font-semibold">{row.original.name}</p>
                <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
            </div>
        )
    },
    {
        accessorKey: "basePrice",
        header: "Price",
        cell: ({ row }) => `Từ ${currencyFormatter.format(row.original.basePrice)}`
    },
    {
        accessorKey: "variantsCount",
        header: "Variants",
        cell: ({ row }) => (
            <span>
                {row.original.sizesCount} Cỡ, {row.original.crustsCount} Đế ({row.original.variantsCount} Biến thể)
            </span>
        )
    },
    {
        id: "badges",
        header: "Badges",
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
                {row.original.isNew && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">New</Badge>
                )}
                {row.original.isBestSeller && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Best Seller</Badge>
                )}
            </div>
        )
    },
    {
        accessorKey: "isAvailable",
        header: "Available",
        cell: ({ row }) => (
            <AvailabilityToggle
                id={row.original.id}
                isAvailable={row.original.isAvailable}
                entityName="pizzas"
            />
        )
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
]