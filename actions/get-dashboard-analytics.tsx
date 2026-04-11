import { Category, OrderStatus } from "@prisma/client";

import prismadb from "@/lib/prismadb";
import { STATUS_LABELS } from "@/lib/order-utils";

export interface RevenueByMonthItem {
    name: string;
    total: number;
}

export interface BreakdownItem {
    name: string;
    total: number;
}

export interface TopProductItem {
    id: string;
    name: string;
    category: Category;
    categoryLabel: string;
    img: string;
    quantity: number;
    revenue: number;
    isAvailable: boolean;
    isBestSeller: boolean;
}

export interface DashboardAnalytics {
    revenueByMonth: RevenueByMonthItem[];
    orderStatusBreakdown: BreakdownItem[];
    categoryBreakdown: BreakdownItem[];
    topProducts: TopProductItem[];
}

type TopProductAccumulator = {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    category?: Category;
    img?: string;
    isAvailable?: boolean;
    isBestSeller?: boolean;
};

const categoryLabels: Record<Category, string> = {
    PIZZA: "Pizza",
    DRINK: "Đồ uống",
    CHICKEN: "Gà",
    APPETIZER: "Ăn kèm",
    COMBO: "Combo",
};

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
    const [paidOrders, products] = await Promise.all([
        prismadb.order.findMany({
            where: {
                isPaid: true,
            },
            select: {
                createdAt: true,
                totalAmount: true,
                orderItems: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        }),
        prismadb.product.findMany({
            select: {
                category: true,
            },
        }),
    ]);

    const revenueByMonth: RevenueByMonthItem[] = [
        { name: "T1", total: 0 },
        { name: "T2", total: 0 },
        { name: "T3", total: 0 },
        { name: "T4", total: 0 },
        { name: "T5", total: 0 },
        { name: "T6", total: 0 },
        { name: "T7", total: 0 },
        { name: "T8", total: 0 },
        { name: "T9", total: 0 },
        { name: "T10", total: 0 },
        { name: "T11", total: 0 },
        { name: "T12", total: 0 },
    ];

    const statusTotals: Record<OrderStatus, number> = {
        PENDING: 0,
        PREPARING: 0,
        DELIVERING: 0,
        COMPLETED: 0,
        CANCELLED: 0,
    };

    for (const order of paidOrders) {
        revenueByMonth[order.createdAt.getMonth()].total += order.totalAmount;
    }

    const allOrders = await prismadb.order.findMany({
        select: {
            status: true,
            orderItems: true,
        },
    });

    for (const order of allOrders) {
        statusTotals[order.status] += 1;
    }

    const categoryTotals = products.reduce<Record<Category, number>>((accumulator, product) => {
        accumulator[product.category] += 1;
        return accumulator;
    }, {
        PIZZA: 0,
        DRINK: 0,
        CHICKEN: 0,
        APPETIZER: 0,
        COMBO: 0,
    });

    const productStats = new Map<string, TopProductAccumulator>();

    for (const order of paidOrders) {
        for (const item of order.orderItems) {
            const existing = productStats.get(item.productId) ?? {
                id: item.productId,
                name: item.productName,
                quantity: 0,
                revenue: 0,
            };

            existing.quantity += item.quantity;
            existing.revenue += item.price * item.quantity;
            productStats.set(item.productId, existing);
        }
    }

    const productIds = Array.from(productStats.keys());
    const productDetails = productIds.length > 0
        ? await prismadb.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                category: true,
                img: true,
                isAvailable: true,
                isBestSeller: true,
            },
        })
        : [];

    for (const product of productDetails) {
        const stat = productStats.get(product.id);

        if (!stat) {
            continue;
        }

        stat.category = product.category;
        stat.img = product.img;
        stat.isAvailable = product.isAvailable;
        stat.isBestSeller = product.isBestSeller;
    }

    const topProducts: TopProductItem[] = Array.from(productStats.values())
        .map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category ?? Category.PIZZA,
            categoryLabel: categoryLabels[product.category ?? Category.PIZZA],
            img: product.img ?? "",
            quantity: product.quantity,
            revenue: product.revenue,
            isAvailable: product.isAvailable ?? true,
            isBestSeller: product.isBestSeller ?? false,
        }))
        .sort((left, right) => right.revenue - left.revenue)
        .slice(0, 5);

    return {
        revenueByMonth,
        orderStatusBreakdown: Object.entries(statusTotals).map(([status, total]) => ({
            name: STATUS_LABELS[status as OrderStatus],
            total,
        })),
        categoryBreakdown: Object.entries(categoryTotals).map(([category, total]) => ({
            name: categoryLabels[category as Category],
            total,
        })),
        topProducts,
    };
};