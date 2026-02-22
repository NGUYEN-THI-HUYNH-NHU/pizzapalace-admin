import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ sizeId: string }> }
) {
    try {
        const { sizeId } = await params;

        if (!sizeId) {
            return new NextResponse("Size id is required", { status: 400 });
        }

        const size = await prismadb.pizzaSize.findUnique({
            where: {
                id: sizeId,
            }
        });

        return NextResponse.json(size);

    } catch (error) {
        console.log('[PIZZA_SIZE_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ sizeId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, code } = body;
        const { sizeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!code) {
            return new NextResponse("Code is required", { status: 400 });
        }

        if (!sizeId) {
            return new NextResponse("Size id is required", { status: 400 });
        }

        const size = await prismadb.pizzaSize.updateMany({
            where: {
                id: sizeId,
            },
            data: {
                name,
                code,
            }
        });

        return NextResponse.json(size);
    } catch (error) {
        console.log("[PIZZA_SIZE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ sizeId: string }> }
) {
    try {
        const { userId } = await auth();
        const { sizeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!sizeId) {
            return new NextResponse("Size id is required", { status: 400 });
        }

        const size = await prismadb.pizzaSize.deleteMany({
            where: {
                id: sizeId,
            }
        });

        return NextResponse.json(size);
    } catch (error) {
        console.log("[PIZZA_SIZE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}