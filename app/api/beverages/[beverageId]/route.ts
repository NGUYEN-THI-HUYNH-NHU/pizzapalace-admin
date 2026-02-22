import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ beverageId: string }> }
) {
    try {
        const { beverageId } = await params;

        if (!beverageId) {
            return new NextResponse("Beverage id is required", { status: 400 });
        }

        const beverage = await prismadb.product.findUnique({
            where: {
                id: beverageId,
            }
        });

        return NextResponse.json(beverage);
    } catch (error) {
        console.log("[BEVERAGE_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ beverageId: string }> }
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
        const { beverageId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!beverageId) {
            return new NextResponse("Beverage id is required", { status: 400 });
        }

        const beverage = await prismadb.product.update({
            where: {
                id: beverageId,
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

        return NextResponse.json(beverage);
    } catch (error) {
        console.log("[BEVERAGE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ beverageId: string }> }
) {
    try {
        const { userId } = await auth();
        const { beverageId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!beverageId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const beverage = await prismadb.product.delete({
            where: {
                id: beverageId,
            }
        });

        return NextResponse.json(beverage);
    } catch (error) {
        console.log("[BEVERAGE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}