"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, currencyFormatter, formatDateTime } from "@/lib/utils";
import { Order, OrderStatus, PaymentMethod } from "@prisma/client";
import { CellAction } from "./cell-actions";
import { CheckCircle2 } from "lucide-react";


export const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
    [OrderStatus.PENDING]: { label: "Đã tiếp nhận", className: "bg-blue-100 text-blue-700 border-blue-200" },
    [OrderStatus.PREPARING]: { label: "Đang chuẩn bị", className: "bg-amber-100 text-amber-700 border-amber-200" },
    [OrderStatus.DELIVERING]: { label: "Đang giao", className: "bg-orange-100 text-orange-700 border-orange-200" },
    [OrderStatus.COMPLETED]: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    [OrderStatus.CANCELLED]: { label: "Đã hủy", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: "Tiền mặt",
    [PaymentMethod.ONLINE]: "Trực tuyến",
};

export const STATUS_OPTIONS: Array<{ label: string; value: OrderStatus }> = [
    { label: "Đã tiếp nhận", value: OrderStatus.PENDING },
    { label: "Đang chuẩn bị", value: OrderStatus.PREPARING },
    { label: "Đang giao", value: OrderStatus.DELIVERING },
    { label: "Hoàn tất", value: OrderStatus.COMPLETED },
    { label: "Đã hủy", value: OrderStatus.CANCELLED },
];

export const getNextStatus = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.PENDING:
            return OrderStatus.PREPARING;
        case OrderStatus.PREPARING:
            return OrderStatus.DELIVERING;
        case OrderStatus.DELIVERING:
            return OrderStatus.COMPLETED;
        default:
            return null;
    }
};

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
            const meta = STATUS_META[row.original.status];
            return <Badge variant="outline" className={cn(meta.className)}>{meta.label}</Badge>;
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
                    {STATUS_META[nextStatus].label}
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
