import { OrderStatus, PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { emitRealtimeEvent } from "@/lib/realtime";

type IncomingOrderItem = {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    img?: string;
    size?: string;
    crust?: string;
    crustName?: string;
    selectedOptions?: Array<{
        k: string;
        v: string;
        productId?: string;
        sku: string;
        crustName?: string;
        crustSize?: string;
    }>;
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

const mergeOrderItems = (items: IncomingOrderItem[]) => {
    const merged = new Map<string, IncomingOrderItem>();

    items.forEach((item) => {
        const key = [item.id, item.sku, item.name, item.price].join("|");
        const existing = merged.get(key);

        if (existing) {
            merged.set(key, {
                ...existing,
                quantity: Number(existing.quantity ?? 0) + Number(item.quantity ?? 0),
            });
            return;
        }

        merged.set(key, { ...item, quantity: Number(item.quantity ?? 0) });
    });

    return Array.from(merged.values());
};

const normalizeSelectedOptions = (items: IncomingOrderItem["selectedOptions"] = []) => {
    return items.map((option) => ({
        k: option.k,
        v: option.v,
        productId: option.productId ?? null,
        sku: option.sku,
        crustName: option.crustName ?? null,
        crustSize: option.crustSize ?? null,
    }));
};

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
        const orderItems = mergeOrderItems(body.cartItems);

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
                orderItems: orderItems.map((item) => ({
                    productId: String(item.id),
                    productName: item.name,
                    sku: item.sku,
                    price: Number(item.price ?? 0),
                    quantity: Number(item.quantity ?? 1),
                    crustName: item.crustName ?? null,
                    crustSize: item.size ?? null,
                    selectedOptions: normalizeSelectedOptions(item.selectedOptions),
                })),
            },
        });

        await emitRealtimeEvent({
            event: "order:new",
            payload: { order },
            rooms: ["admins"],
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
