import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import prismadb from "@/lib/prismadb";

const signInSchema = z.object({
    identifier: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập email hoặc số điện thoại."),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

const phonePattern = /^(0|\+84)\d{9,10}$/;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = signInSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const { identifier, password } = parsed.data;
        const normalizedIdentifier = identifier.trim();
        const isPhoneIdentifier = phonePattern.test(normalizedIdentifier);

        const user = await prismadb.user.findFirst({
            where: isPhoneIdentifier
                ? { phone: normalizedIdentifier }
                : { email: normalizedIdentifier.toLowerCase() },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                hashedPassword: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Email/số điện thoại hoặc mật khẩu không đúng." },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        if (!user.hashedPassword) {
            return NextResponse.json(
                { message: "Tài khoản chưa thiết lập mật khẩu. Vui lòng đăng ký lại." },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: "Email/số điện thoại hoặc mật khẩu không đúng." },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        const response = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            createdAt: user.createdAt,
        };

        return NextResponse.json(response, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        console.log("[AUTH_SIGN_IN_POST]", error);

        const devMessage =
            process.env.NODE_ENV === "development" && error instanceof Error
                ? `Internal error: ${error.message}`
                : "Internal error";

        return NextResponse.json({ message: devMessage }, { status: 500, headers: CORS_HEADERS });
    }
}
