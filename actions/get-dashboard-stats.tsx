import { startOfDay, startOfMonth } from "date-fns";
import { OrderStatus, Role } from "@prisma/client";

import prismadb from "@/lib/prismadb";

import { getTotalRevenue } from "./get-total-revenue";

export interface DashboardStats {
    totalRevenue: number;
    todayRevenue: number;
    monthRevenue: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    deliveringOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    totalProducts: number;
    availableProducts: number;
    newProducts: number;
    bestSellerProducts: number;
    averageOrderValue: number;
    completionRate: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());

    const [
        totalOrders,
        paidOrders,
        pendingOrders,
        preparingOrders,
        deliveringOrders,
        completedOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        availableProducts,
        newProducts,
        bestSellerProducts,
        todayRevenueAggregate,
        monthRevenueAggregate,
        totalRevenue,
    ] = await Promise.all([
        prismadb.order.count(),
        prismadb.order.count({ where: { isPaid: true } }),
        prismadb.order.count({ where: { status: OrderStatus.PENDING } }),
        prismadb.order.count({ where: { status: OrderStatus.PREPARING } }),
        prismadb.order.count({ where: { status: OrderStatus.DELIVERING } }),
        prismadb.order.count({ where: { status: OrderStatus.COMPLETED } }),
        prismadb.order.count({ where: { status: OrderStatus.CANCELLED } }),
        prismadb.user.count({ where: { role: Role.CUSTOMER } }),
        prismadb.product.count(),
        prismadb.product.count({ where: { isAvailable: true } }),
        prismadb.product.count({ where: { isNew: true } }),
        prismadb.product.count({ where: { isBestSeller: true } }),
        prismadb.order.aggregate({
            where: {
                isPaid: true,
                createdAt: {
                    gte: today,
                },
            },
            _sum: {
                totalAmount: true,
            },
        }),
        prismadb.order.aggregate({
            where: {
                isPaid: true,
                createdAt: {
                    gte: thisMonth,
                },
            },
            _sum: {
                totalAmount: true,
            },
        }),
        getTotalRevenue(),
    ]);

    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
        totalRevenue,
        todayRevenue: todayRevenueAggregate._sum.totalAmount ?? 0,
        monthRevenue: monthRevenueAggregate._sum.totalAmount ?? 0,
        totalOrders,
        paidOrders,
        pendingOrders,
        preparingOrders,
        deliveringOrders,
        completedOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        availableProducts,
        newProducts,
        bestSellerProducts,
        averageOrderValue,
        completionRate,
    };
};