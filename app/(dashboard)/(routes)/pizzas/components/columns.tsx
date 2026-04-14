"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-actions"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import AvailabilityToggle from "@/components/ui/availability-toggle"
import Tag from "@/components/ui/tag";
import { currencyFormatter } from "@/lib/utils"

export type Column = {
    id: string
    img: string
    name: string
    slug: string
    basePrice: number
    tags: {
        code: string
        name: string
        color: string
    }[]
    sizesCount: number
    crustsCount: number
    variantsCount: number
    isNew: boolean
    isBestSeller: boolean
    isAvailable: boolean
}

export const columns: ColumnDef<Column>[] = [
    {
        accessorKey: "img",
        header: "Ảnh",
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
        header: "Tên & Slug",
        cell: ({ row }) => (
            <div>
                <p className="font-semibold">{row.original.name}</p>
                <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
            </div>
        )
    },
    {
        accessorKey: "basePrice",
        header: "Giá",
        cell: ({ row }) => `Từ ${currencyFormatter.format(row.original.basePrice)}`
    },
    {
        accessorKey: "variantsCount",
        header: "Biến thể",
        cell: ({ row }) => (
            <span>
                {row.original.sizesCount} Cỡ, {row.original.crustsCount} Đế ({row.original.variantsCount} Biến thể)
            </span>
        )
    },
    {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
                {row.original.tags.length > 0 ? (
                    row.original.tags.map((tag) => (
                        <Tag key={tag.code} name={tag.name} color={tag.color} />
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground">No tags</span>
                )}
            </div>
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
        header: "Sẵn sàng",
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