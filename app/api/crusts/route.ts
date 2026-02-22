import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, code, availableSizes, isAvailable } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!code) {
            return new NextResponse("Code is required", { status: 400 });
        }

        if (!Array.isArray(availableSizes)) {
            return new NextResponse("Available sizes must be an array", { status: 400 });
        }

        if (typeof isAvailable !== "boolean") {
            return new NextResponse("isAvailable must be a boolean", { status: 400 });
        }

        const crust = await prismadb.pizzaCrust.create({
            data: {
                name,
                code,
                availableSizes,
                isAvailable,
            },
        });

        return NextResponse.json(crust);
    } catch (error) {
        console.log("[PIZZA_CRUSTS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}