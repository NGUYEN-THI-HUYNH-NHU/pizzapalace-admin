"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn, currencyFormatter, formatDateTime } from "@/lib/utils";
import { Order, OrderStatus } from "@prisma/client";
import { PAYMENT_LABELS, STATUS_COLOR_MAP, STATUS_OPTIONS } from "@/lib/order-utils";

interface OrderModalProps {
    order: Order | null;
    isOpen: boolean;
    loading: boolean;
    onClose: () => void;
    onSave: (status: OrderStatus) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
    order,
    isOpen,
    loading,
    onClose,
    onSave,
}) => {
    const [status, setStatus] = useState<OrderStatus>(OrderStatus.PENDING);

    useEffect(() => {
        if (order) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStatus(order.status);
        }
    }, [order]);

    return (
        <Modal
            classname="max-h-[90vh] overflow-hidden"
            title={order ? `Chi tiết đơn ${order.id}` : "Chi tiết đơn"}
            description={order ? `${order.customerName} - ${order.customerPhone}` : "Thông tin đơn hàng"}
            isOpen={isOpen}
            onClose={onClose}
        >
            {order ? (
                <div className="space-y-5 pt-2">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Địa chỉ</p>
                            <p className="font-medium">{order.customerAddress}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Thanh toán</p>
                            <p className="font-medium">{PAYMENT_LABELS[order.paymentMethod]}</p>
                            <p className={cn("text-sm", order.isPaid ? "text-emerald-600" : "text-muted-foreground")}>
                                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Tổng tiền</p>
                            <p className="font-semibold">{currencyFormatter.format(order.totalAmount)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Cập nhật lúc</p>
                            <p className="font-medium">{formatDateTime(order.updatedAt)}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Sản phẩm</p>
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                            {order.orderItems.map((item) => (
                                <div key={`${order.id}-${item.productId}`} className="flex items-start justify-between gap-4 rounded-md border bg-muted/20 p-3">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                                        <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">{currencyFormatter.format(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Cập nhật trạng thái</p>
                        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <Badge variant="outline" className={cn(STATUS_COLOR_MAP[status].className)}>
                            {STATUS_COLOR_MAP[status].label}
                        </Badge>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Đóng
                            </Button>
                            <Button disabled={loading} onClick={() => onSave(status)}>
                                {loading ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};