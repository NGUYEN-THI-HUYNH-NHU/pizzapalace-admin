import { NextResponse } from "next/server";
import { z } from "zod";

import prismadb from "@/lib/prismadb";

const updateUserSchema = z.object({
    name: z.string().trim().min(1, "Họ tên không được để trống."),
    email: z.string().trim().email("Email không hợp lệ."),
    phone: z
        .string()
        .trim()
        .regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ."),
    address: z.string().trim()
});

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(_req: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const user = await prismadb.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Không tìm thấy người dùng." },
                { status: 404, headers: CORS_HEADERS }
            );
        }

        return NextResponse.json(user, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        console.log("[USERS_ID_GET]", error);
        return NextResponse.json({ message: "Internal error" }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function PUT(req: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const parsed = updateUserSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const normalizedEmail = parsed.data.email.toLowerCase();

        const existingUser = await prismadb.user.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existingUser) {
            return NextResponse.json(
                { message: "Không tìm thấy người dùng." },
                { status: 404, headers: CORS_HEADERS }
            );
        }

        const duplicatedUser = await prismadb.user.findFirst({
            where: {
                OR: [
                    { phone: parsed.data.phone },
                    { email: normalizedEmail },
                ],
                NOT: { id },
            },
            select: { id: true, phone: true, email: true },
        });

        if (duplicatedUser) {
            return NextResponse.json(
                {
                    message:
                        duplicatedUser.email === parsed.data.email
                            || duplicatedUser.email === normalizedEmail
                            ? "Email đã được sử dụng."
                            : "Số điện thoại đã được sử dụng.",
                },
                { status: 409, headers: CORS_HEADERS }
            );
        }

        const updatedUser = await prismadb.user.update({
            where: { id },
            data: {
                name: parsed.data.name,
                email: normalizedEmail,
                phone: parsed.data.phone,
                address: parsed.data.address
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(updatedUser, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        console.log("[USERS_ID_PUT]", error);
        return NextResponse.json({ message: "Internal error" }, { status: 500, headers: CORS_HEADERS });
    }
}
