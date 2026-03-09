import { Category } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const categories = Object.values(Category);
        return NextResponse.json(categories);
    } catch (error) {
        console.log("[CATEGORIES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
