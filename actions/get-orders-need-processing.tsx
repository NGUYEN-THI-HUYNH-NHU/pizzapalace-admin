import { OrderStatus, PaymentMethod } from "@prisma/client";

import prismadb from "@/lib/prismadb";

export interface RecentOrderItem {
    id: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    isPaid: boolean;
    itemCount: number;
    itemsPreview: string;
    createdAt: Date;
}

export const getOrderNeedProcessing = async (): Promise<RecentOrderItem[]> => {
    const orders = await prismadb.order.findMany({
        where: {
            status: {
                not: OrderStatus.COMPLETED,
            }
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            customerName: true,
            customerPhone: true,
            totalAmount: true,
            status: true,
            paymentMethod: true,
            isPaid: true,
            createdAt: true,
            orderItems: true,
        },
    });

    return orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        itemCount: order.orderItems.reduce((total, item) => total + item.quantity, 0),
        itemsPreview: order.orderItems.slice(0, 2).map((item) => item.productName).join(", "),
        createdAt: order.createdAt,
    }));
};