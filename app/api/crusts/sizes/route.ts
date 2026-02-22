import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, code } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!code) {
            return new NextResponse("Code is required", { status: 400 });
        }

        const size = await prismadb.pizzaSize.create({
            data: {
                name,
                code,
            },
        });

        return NextResponse.json(size);
    } catch (error) {
        console.log("[PIZZA_SIZES_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}