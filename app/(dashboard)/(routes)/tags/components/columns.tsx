"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-actions"

import { Badge } from "@/components/ui/badge"

export type Column = {
    id: string
    name: string
    code: string
    color: string
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
        id: "color",
        header: "Tags",
        cell: ({ row }) => {
            const color = row.original.color;

            return (
                <div className="flex items-center gap-x-2">
                    <Badge
                        style={{
                            backgroundColor: color,
                            color: getReadableTextColor(color),
                            borderColor: 'transparent'
                        }}
                        className="hover:opacity-80"
                    >
                        {row.original.name}
                    </Badge>
                    <span className="text-xs font-mono">{color}</span>
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
]