import { OrderStatus, PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

type IncomingOrderItem = {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    img?: string;
};

type IncomingOrderPayload = {
    userId?: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    address: string;
    note?: string;
    paymentMethod: string;
    cartItems: IncomingOrderItem[];
    voucherCode?: string;
    subTotal: number;
    shippingFee: number;
    discount?: number;
    totalAmount: number;
};

const isObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

const mapPaymentMethod = (method: string): PaymentMethod =>
    method?.toLowerCase() === "cash" ? PaymentMethod.CASH : PaymentMethod.ONLINE;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId")?.trim() ?? "";

        const orders = await prismadb.order.findMany({
            where: userId && isObjectId(userId) ? { userId } : undefined,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.log("[ORDERS_GET]", error);
        return NextResponse.json(
            { message: "Khong the lay danh sach don hang." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as IncomingOrderPayload;

        if (!body.fullName || !body.phoneNumber || !body.email || !body.address || !body.cartItems?.length) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const invalidProduct = body.cartItems.find((item) => !isObjectId(String(item.id ?? "")));
        if (invalidProduct) {
            return new NextResponse("Invalid product id in cart items", { status: 400 });
        }

        const paymentMethod = mapPaymentMethod(body.paymentMethod);
        const normalizedUserId = typeof body.userId === "string" ? body.userId.trim() : "";

        const order = await prismadb.order.create({
            data: {
                customerName: body.fullName,
                customerPhone: body.phoneNumber,
                customerAddress: body.address,
                userId: isObjectId(normalizedUserId) ? normalizedUserId : null,
                totalAmount: Number(body.totalAmount ?? 0),
                status: OrderStatus.PENDING,
                paymentMethod,
                isPaid: paymentMethod === PaymentMethod.ONLINE,
                orderItems: body.cartItems.map((item) => ({
                    productId: String(item.id),
                    productName: item.name,
                    sku: item.sku,
                    price: Number(item.price ?? 0),
                    quantity: Number(item.quantity ?? 1),
                    selectedOptions: [],
                })),
            },
        });

        return NextResponse.json({
            orderId: order.id,
            message: "Order placed successfully",
            order,
        });
    } catch (error) {
        console.log("[ORDERS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
