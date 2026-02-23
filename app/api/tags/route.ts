import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, code, color } = body;

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

        const tag = await prismadb.pizzaTag.create({
            data: {
                name,
                code,
                color
            },
        });

        return NextResponse.json(tag);
    } catch (error) {
        console.log("[PIZZA_TAGS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}