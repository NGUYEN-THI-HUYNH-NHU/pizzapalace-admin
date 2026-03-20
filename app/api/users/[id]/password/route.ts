import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import prismadb from "@/lib/prismadb";

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
        newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự."),
        confirmPassword: z.string().min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp.",
        path: ["confirmPassword"],
    });

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function PUT(req: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const { currentPassword, newPassword } = parsed.data;

        const user = await prismadb.user.findUnique({
            where: { id },
            select: {
                id: true,
                hashedPassword: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Không tìm thấy người dùng." },
                { status: 404, headers: CORS_HEADERS }
            );
        }

        if (!user.hashedPassword) {
            return NextResponse.json(
                { message: "Tài khoản chưa thiết lập mật khẩu." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { message: "Mật khẩu hiện tại không đúng." },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        const isSameAsCurrentPassword = await bcrypt.compare(newPassword, user.hashedPassword);

        if (isSameAsCurrentPassword) {
            return NextResponse.json(
                { message: "Mật khẩu mới phải khác mật khẩu hiện tại." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        await prismadb.user.update({
            where: { id },
            data: {
                hashedPassword: newHashedPassword,
            },
        });

        return NextResponse.json({ message: "Đổi mật khẩu thành công." }, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        console.log("[USERS_ID_PASSWORD_PUT]", error);
        return NextResponse.json({ message: "Internal error" }, { status: 500, headers: CORS_HEADERS });
    }
}
