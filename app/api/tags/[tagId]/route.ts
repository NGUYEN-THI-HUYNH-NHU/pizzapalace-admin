import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ tagId: string }> }
) {
    try {
        const { tagId } = await params;

        if (!tagId) {
            return new NextResponse("Tag id is required", { status: 400 });
        }

        const tag = await prismadb.pizzaTag.findUnique({
            where: {
                id: tagId,
            }
        });

        return NextResponse.json(tag);

    } catch (error) {
        console.log('[PIZZA_TAG_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ tagId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, code, color } = body;
        const { tagId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!code) {
            return new NextResponse("Code is required", { status: 400 });
        }

        if (!color) {
            return new NextResponse("Color is required", { status: 400 });
        }

        if (!tagId) {
            return new NextResponse("Tag id is required", { status: 400 });
        }

        const tag = await prismadb.pizzaTag.updateMany({
            where: {
                id: tagId,
            },
            data: {
                name,
                code,
                color
            }
        });

        return NextResponse.json(tag);
    } catch (error) {
        console.log("[PIZZA_TAG_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ tagId: string }> }
) {
    try {
        const { userId } = await auth();
        const { tagId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!tagId) {
            return new NextResponse("Tag id is required", { status: 400 });
        }

        const tag = await prismadb.pizzaTag.deleteMany({
            where: {
                id: tagId,
            }
        });

        return NextResponse.json(tag);
    } catch (error) {
        console.log("[PIZZA_TAG_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}