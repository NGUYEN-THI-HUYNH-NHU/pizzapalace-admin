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
        const combos = await prismadb.product.findMany({
            where: {
                category: Category.COMBO,
                isAvailable: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(combos);
    } catch (error) {
        console.log("[COMBOS_GET]", error);
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
            comboDetails,
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

        const combo = await prismadb.product.create({
            data: {
                category: Category.COMBO,
                name,
                slug,
                desc,
                img,
                price,
                tags: normalizedTags,
                isAvailable: Boolean(isAvailable),
                isNew: Boolean(isNew),
                isBestSeller: Boolean(isBestSeller),
                comboDetails
            }
        });

        return NextResponse.json(combo);
    } catch (error) {
        console.log("[COMBOS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
