import { auth } from "@clerk/nextjs/server";
import { Category } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

type ProductTagPayload = {
    name: string;
    code: string;
    color: string;
};

const normalizeProductTags = (input: unknown): ProductTagPayload[] => {
    if (!Array.isArray(input)) {
        return [];
    }

    const mapped = input.flatMap((rawTag) => {
        if (typeof rawTag === "string") {
            const code = rawTag.trim();

            if (!code) {
                return [];
            }

            return [{ name: code, code, color: "#6b7280" }];
        }

        if (!rawTag || typeof rawTag !== "object") {
            return [];
        }

        const record = rawTag as Record<string, unknown>;
        const name = typeof record.name === "string" ? record.name.trim() : "";
        const code = typeof record.code === "string" ? record.code.trim() : "";
        const color = typeof record.color === "string" ? record.color.trim() : "";

        if (!name || !code) {
            return [];
        }

        return [{ name, code, color: color || "#6b7280" }];
    });

    return Array.from(new Map(mapped.map((tag) => [tag.code, tag])).values());
};

export async function GET() {
    try {
        const pizzas = await prismadb.product.findMany({
            where: {
                category: Category.PIZZA,
                isAvailable: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(pizzas);
    } catch (error) {
        console.log("[PIZZAS_GET]", error);
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
            isBestSeller,
            pizzaDetails
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

        const normalizedTags = normalizeProductTags(tags);

        const pizza = await prismadb.product.create({
            data: {
                category: Category.PIZZA,
                name,
                slug,
                desc,
                img,
                price,
                tags: normalizedTags,
                isAvailable: Boolean(isAvailable),
                isNew: Boolean(isNew),
                isBestSeller: Boolean(isBestSeller),
                pizzaDetails
            }
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZAS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
