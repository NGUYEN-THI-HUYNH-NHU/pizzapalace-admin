import { auth } from "@clerk/nextjs/server";
import { Category } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET() {
    try {
        const chickens = await prismadb.product.findMany({
            where: {
                category: Category.CHICKEN,
                isAvailable: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(chickens);
    } catch (error) {
        console.log("[CHICKENS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function POST(req: Request) {
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

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name || !slug || !desc || !img) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (typeof price !== "number") {
            return new NextResponse("Price must be a number", { status: 400 });
        }

        const chicken = await prismadb.product.create({
            data: {
                category: Category.CHICKEN,
                name,
                slug,
                desc,
                img,
                price,
                tags,
                isAvailable: Boolean(isAvailable),
                isNew: Boolean(isNew),
                isBestSeller: Boolean(isBestSeller)
            }
        });

        return NextResponse.json(chicken);
    } catch (error) {
        console.log("[CHICKENS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
