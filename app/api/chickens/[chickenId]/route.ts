import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ chickenId: string }> }
) {
    try {
        const { chickenId } = await params;

        if (!chickenId) {
            return new NextResponse("Chicken id is required", { status: 400 });
        }

        const chicken = await prismadb.product.findUnique({
            where: {
                id: chickenId,
            }
        });

        return NextResponse.json(chicken);
    } catch (error) {
        console.log("[CHICKEN_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ chickenId: string }> }
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
            isBestSeller
        } = body;
        const { chickenId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!chickenId) {
            return new NextResponse("Chicken id is required", { status: 400 });
        }

        const chicken = await prismadb.product.update({
            where: {
                id: chickenId,
            },
            data: {
                name,
                slug,
                desc,
                img,
                price,
                tags,
                isAvailable,
                isNew,
                isBestSeller
            },
        });

        return NextResponse.json(chicken);
    } catch (error) {
        console.log("[CHICKEN_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ chickenId: string }> }
) {
    try {
        const { userId } = await auth();
        const { chickenId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!chickenId) {
            return new NextResponse("Chicken id is required", { status: 400 });
        }

        const chicken = await prismadb.product.delete({
            where: {
                id: chickenId,
            }
        });

        return NextResponse.json(chicken);
    } catch (error) {
        console.log("[CHICKEN_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}