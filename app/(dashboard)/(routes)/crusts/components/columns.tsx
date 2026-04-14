"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-actions"
import { Badge } from "@/components/ui/badge"
import AvailabilityToggle from "@/components/ui/availability-toggle"

export type Column = {
    id: string
    name: string
    code: string
    availableSizes: string[]
    isAvailable: boolean
}

export const columns: ColumnDef<Column>[] = [
    {
        accessorKey: "name",
        header: "Tên",
    },
    {
        accessorKey: "code",
        header: "Code",
    },
    {
        accessorKey: "availableSizes",
        header: "Cỡ",
        cell: ({ row }) => {
            const sizes = row.original.availableSizes ?? [];

            if (!sizes.length) {
                return <span className="text-muted-foreground text-xs">No sizes</span>
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {sizes.map((size) => (
                        <Badge key={size} variant="default">{size}</Badge>
                    ))}
                </div>
            );
        }
    },
    {
        accessorKey: "isAvailable",
        header: "Sẵn sàng",
        cell: ({ row }) => (
            <AvailabilityToggle
                id={row.original.id}
                isAvailable={row.original.isAvailable}
                entityName="crusts"
            />
        )
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
]