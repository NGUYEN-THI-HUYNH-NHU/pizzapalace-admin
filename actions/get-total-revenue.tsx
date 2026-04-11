import prismadb from "@/lib/prismadb";

export const getTotalRevenue = async () => {
    const revenue = await prismadb.order.aggregate({
        where: {
            isPaid: true
        },
        _sum: {
            totalAmount: true,
        },
    });

    return revenue._sum.totalAmount ?? 0;
}