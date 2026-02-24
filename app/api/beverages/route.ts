import { auth } from "@clerk/nextjs/server";
import { Category } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

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
            isAvailable,
            isNew,
            isBestSeller,
            drinkDetails
        } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name || !slug || !desc || !img || !drinkDetails) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (typeof price !== "number") {
            return new NextResponse("Price must be a number", { status: 400 });
        }

        const beverage = await prismadb.product.create({
            data: {
                category: Category.DRINK,
                name,
                slug,
                desc,
                img,
                price,
                isAvailable: Boolean(isAvailable),
                isNew: Boolean(isNew),
                isBestSeller: Boolean(isBestSeller),
                drinkDetails
            }
        });

        return NextResponse.json(beverage);
    } catch (error) {
        console.log("[BEVERAGES_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
