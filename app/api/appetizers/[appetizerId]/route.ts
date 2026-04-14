import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ appetizerId: string }> }
) {
    try {
        const { appetizerId } = await params;

        if (!appetizerId) {
            return new NextResponse("Appetizer id is required", { status: 400 });
        }

        const appetizer = await prismadb.product.findUnique({
            where: {
                id: appetizerId,
            }
        });

        return NextResponse.json(appetizer);
    } catch (error) {
        console.log("[APPETIZER_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ appetizerId: string }> }
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
            isAvailable,
            isNew,
            isBestSeller
        } = body;
        const { appetizerId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!appetizerId) {
            return new NextResponse("Appetizer id is required", { status: 400 });
        }

        const appetizer = await prismadb.product.update({
            where: {
                id: appetizerId,
            },
            data: {
                name,
                slug,
                desc,
                img,
                price,
                isAvailable,
                isNew,
                isBestSeller
            },
        });

        return NextResponse.json(appetizer);
    } catch (error) {
        console.log("[APPETIZER_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ appetizerId: string }> }
) {
    try {
        const { userId } = await auth();
        const { appetizerId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!appetizerId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const appetizer = await prismadb.product.delete({
            where: {
                id: appetizerId,
            }
        });

        return NextResponse.json(appetizer);
    } catch (error) {
        console.log("[APPETIZER_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}