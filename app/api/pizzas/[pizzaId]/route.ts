import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ pizzaId: string }> }
) {
    try {
        const { pizzaId } = await params;

        if (!pizzaId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const pizza = await prismadb.product.findUnique({
            where: {
                id: pizzaId,
            }
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZA_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ pizzaId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const {
            name,
            slug,
            desc,
            img,
            price,
            tags,
            isAvailable,
            isNew,
            isBestSeller,
            pizzaDetails
        } = body;
        const { pizzaId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!pizzaId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const pizza = await prismadb.product.update({
            where: {
                id: pizzaId,
            },
            data: {
                name,
                slug,
                desc,
                img,
                price,
                tags: Array.isArray(tags) ? tags : [],
                isAvailable,
                isNew,
                isBestSeller,
                pizzaDetails
            },
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZA_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ pizzaId: string }> }
) {
    try {
        const { userId } = await auth();
        const { pizzaId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!pizzaId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const pizza = await prismadb.product.delete({
            where: {
                id: pizzaId,
            }
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZA_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}