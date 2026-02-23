import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ comboId: string }> }
) {
    try {
        const { comboId } = await params;

        if (!comboId) {
            return new NextResponse("Combo id is required", { status: 400 });
        }

        const combo = await prismadb.product.findUnique({
            where: {
                id: comboId,
            }
        });

        return NextResponse.json(combo);
    } catch (error) {
        console.log("[COMBO_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ comboId: string }> }
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
            isBestSeller,
            comboDetails
        } = body;
        const { comboId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!comboId) {
            return new NextResponse("Combo id is required", { status: 400 });
        }

        const combo = await prismadb.product.update({
            where: {
                id: comboId,
            },
            data: {
                name,
                slug,
                desc,
                img,
                price,
                isAvailable,
                isNew,
                isBestSeller,
                comboDetails
            },
        });

        return NextResponse.json(combo);
    } catch (error) {
        console.log("[COMBO_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ comboId: string }> }
) {
    try {
        const { userId } = await auth();
        const { comboId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!comboId) {
            return new NextResponse("Combo id is required", { status: 400 });
        }

        const combo = await prismadb.product.delete({
            where: {
                id: comboId,
            }
        });

        return NextResponse.json(combo);
    } catch (error) {
        console.log("[COMBO_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}