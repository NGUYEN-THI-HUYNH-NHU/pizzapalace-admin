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
            tags,
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

        const normalizedTags = normalizeProductTags(tags);

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
                tags: tags === undefined ? undefined : normalizedTags,
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