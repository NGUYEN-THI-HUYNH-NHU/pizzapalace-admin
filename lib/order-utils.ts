import { OrderStatus, PaymentMethod } from "@prisma/client";

export const STATUS_COLOR_MAP: Record<OrderStatus, { label: string; className: string }> = {
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

export const STATUS_LABELS: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Đã tiếp nhận",
    [OrderStatus.PREPARING]: "Đang chuẩn bị",
    [OrderStatus.DELIVERING]: "Đang giao",
    [OrderStatus.COMPLETED]: "Hoàn tất",
    [OrderStatus.CANCELLED]: "Đã hủy",
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