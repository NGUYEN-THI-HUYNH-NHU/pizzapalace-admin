import { auth } from "@clerk/nextjs/server";
import { Category } from "@prisma/client";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

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
        console.log("[PIZZAS_GET_TYPED]", error);

        try {
            const rawPizzas = await prismadb.product.findRaw({
                filter: {
                    category: Category.PIZZA,
                    isAvailable: true,
                },
                options: {
                    sort: {
                        createdAt: -1,
                    },
                },
            });

            const normalizedPizzas = (Array.isArray(rawPizzas) ? rawPizzas : []).flatMap((rawPizza) => {
                if (!rawPizza || typeof rawPizza !== "object") {
                    return [];
                }

                const record = rawPizza as Record<string, unknown>;
                const id = typeof record.id === "string"
                    ? record.id
                    : (record._id && typeof record._id === "object" && "$oid" in record._id)
                        ? String((record._id as { $oid?: unknown }).$oid ?? "")
                        : "";

                const name = typeof record.name === "string" ? record.name : "";
                const slug = typeof record.slug === "string" ? record.slug : "";
                const desc = typeof record.desc === "string" ? record.desc : "";
                const img = typeof record.img === "string" ? record.img : "";

                if (!id || !name || !slug || !desc || !img) {
                    return [];
                }

                return [{
                    id,
                    category: Category.PIZZA,
                    name,
                    slug,
                    desc,
                    img,
                    price: Number(record.price ?? 0),
                    isAvailable: Boolean(record.isAvailable),
                    isNew: Boolean(record.isNew),
                    isBestSeller: Boolean(record.isBestSeller),
                    pizzaDetails: record.pizzaDetails ?? null,
                    drinkDetails: null,
                    comboDetails: null,
                    tags: record.tags,
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                }];
            });

            return NextResponse.json(normalizedPizzas);
        } catch (fallbackError) {
            console.log("[PIZZAS_GET_RAW]", fallbackError);
            return new NextResponse("Internal error", { status: 500 });
        }
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

        const pizza = await prismadb.product.create({
            data: {
                category: Category.PIZZA,
                name,
                slug,
                desc,
                img,
                price,
                tags: tags,
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
