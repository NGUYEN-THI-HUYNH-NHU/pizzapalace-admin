import { auth } from "@clerk/nextjs/server";
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

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ pizzaId: string }> }
) {
    try {
        const { pizzaId } = await params;

        if (!pizzaId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const pizza = await prismadb.product.findUnique({
            where: {
                id: pizzaId,
            }
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZA_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ pizzaId: string }> }
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
            isBestSeller,
            pizzaDetails
        } = body;
        const { pizzaId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!pizzaId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const normalizedTags = normalizeProductTags(tags);

        const pizza = await prismadb.product.update({
            where: {
                id: pizzaId,
            },
            data: {
                name,
                slug,
                desc,
                img,
                price,
                tags: normalizedTags,
                isAvailable,
                isNew,
                isBestSeller,
                pizzaDetails
            },
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZA_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ pizzaId: string }> }
) {
    try {
        const { userId } = await auth();
        const { pizzaId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!pizzaId) {
            return new NextResponse("Pizza id is required", { status: 400 });
        }

        const pizza = await prismadb.product.delete({
            where: {
                id: pizzaId,
            }
        });

        return NextResponse.json(pizza);
    } catch (error) {
        console.log("[PIZZA_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}