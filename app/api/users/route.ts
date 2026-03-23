import bcrypt from "bcrypt";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import prismadb from "@/lib/prismadb";

const createUserSchema = z.object({
    name: z.string().trim().min(1, "Họ tên không được để trống."),
    phone: z
        .string()
        .trim()
        .regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ."),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET() {
    try {
        const users = await prismadb.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(users, { headers: CORS_HEADERS });
    } catch (error) {
        console.log("[USERS_GET]", error);
        return NextResponse.json({ message: "Internal error" }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = createUserSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const { name, phone, password } = parsed.data;

        const existingUser = await prismadb.user.findFirst({
            where: { phone },
            select: { id: true },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Số điện thoại đã được đăng ký." },
                { status: 409, headers: CORS_HEADERS }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prismadb.user.create({
            data: {
                name,
                phone,
                hashedPassword,
                role: Role.CUSTOMER,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user, { status: 201, headers: CORS_HEADERS });
    } catch (error) {
        console.log("[USERS_POST]", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { message: "Tài khoản đã tồn tại (trùng thông tin đăng ký)." },
                { status: 409, headers: CORS_HEADERS }
            );
        }

        return NextResponse.json({ message: "Internal error" }, { status: 500, headers: CORS_HEADERS });
    }
}
