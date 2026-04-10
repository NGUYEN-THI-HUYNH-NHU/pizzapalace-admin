import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { emitRealtimeEvent } from "@/lib/realtime";

const isOrderStatus = (value: string): value is OrderStatus => {
    return [
        OrderStatus.PENDING,
        OrderStatus.PREPARING,
        OrderStatus.DELIVERING,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
    ].includes(value as OrderStatus);
};

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
        const body = (await req.json().catch(() => null)) as { status?: string; isPaid?: boolean } | null;

        if (!body) {
            return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
        }

        const updateData: { status?: OrderStatus; isPaid?: boolean } = {};

        if (typeof body.status === "string") {
            if (!isOrderStatus(body.status)) {
                return NextResponse.json({ message: "Invalid order status" }, { status: 400 });
            }

            updateData.status = body.status;
        }

        if (typeof body.isPaid === "boolean") {
            updateData.isPaid = body.isPaid;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No fields to update" }, { status: 400 });
        }

        const updatedOrder = await prismadb.order.update({
            where: {
                id: orderId,
            },
            data: updateData,
        });

        await emitRealtimeEvent({
            event: "order:updated",
            payload: { order: updatedOrder },
            rooms: ["admins", ...(updatedOrder.userId ? [`user:${updatedOrder.userId}`] : [])],
        });

        return NextResponse.json({ order: updatedOrder }, { status: 200 });
    } catch (error) {
        console.log("[ORDERS_PATCH]", error);
        return NextResponse.json(
            { message: "Khong the cap nhat don hang." },
            { status: 500 }
        );
    }
}