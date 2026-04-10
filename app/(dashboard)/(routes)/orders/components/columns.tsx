"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter, formatDateTime } from "@/lib/utils";
import { Order } from "@prisma/client";
import { CellAction } from "./cell-actions";
import { CheckCircle2 } from "lucide-react";
import { getNextStatus, PAYMENT_LABELS, STATUS_COLOR_MAP } from "@/lib/order-utils";


interface OrderColumnActions {
    onView: (order: Order) => void;
    onAdvance: (order: Order) => void;
    onCopyId: (orderId: string) => void;
}

export const getOrderColumns = ({ onView, onAdvance, onCopyId }: OrderColumnActions): ColumnDef<Order>[] => [
    {
        accessorKey: "id",
        header: "Mã đơn",
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.id}</p>
                <p className="text-xs text-muted-foreground">{row.original.orderItems.length} món</p>
            </div>
        ),
    },
    {
        accessorKey: "customerName",
        header: "Khách hàng",
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.customerName}</p>
                <p className="text-xs text-muted-foreground">{row.original.customerPhone}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{row.original.customerAddress}</p>
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const colorMap = STATUS_COLOR_MAP[row.original.status];
            return <Badge variant="outline" className={cn(colorMap.className)}>{colorMap.label}</Badge>;
        },
    },
    {
        accessorKey: "paymentMethod",
        header: "Thanh toán",
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{PAYMENT_LABELS[row.original.paymentMethod]}</p>
                <p className={cn("text-xs", row.original.isPaid ? "text-emerald-600" : "text-muted-foreground")}>
                    {row.original.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "totalAmount",
        header: "Tổng tiền",
        cell: ({ row }) => <p className="font-semibold">{currencyFormatter.format(row.original.totalAmount)}</p>,
    },
    {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => <p className="text-muted-foreground">{formatDateTime(row.original.updatedAt)}</p>,
    },
    {
        id: "nextStep",
        header: "Cập nhật tiếp theo",
        cell: ({ row }) => {
            const nextStatus = getNextStatus(row.original.status);

            if (!nextStatus) {
                return <span className="text-xs text-muted-foreground">-</span>;
            }

            return (
                <Button size="sm" variant="outline" onClick={() => onAdvance(row.original)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {STATUS_COLOR_MAP[nextStatus].label}
                </Button>
            );
        },
    },
    {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                onView={onView}
                onCopyId={onCopyId}
            />
        ),
    },
];
