import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import prismadb from "@/lib/prismadb";

const resetPasswordSchema = z
    .object({
        email: z.string().trim().email("Email khong hop le."),
        code: z.string().trim().regex(/^\d{6}$/, "Ma xac nhan gom 6 chu so."),
        newPassword: z.string().min(8, "Mat khau moi phai co it nhat 8 ky tu."),
        confirmPassword: z.string().min(8, "Mat khau xac nhan phai co it nhat 8 ky tu."),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
        message: "Mat khau xac nhan khong khop.",
        path: ["confirmPassword"],
    });

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
        const parsed = resetPasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.issues[0]?.message || "Du lieu khong hop le." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const { email, code, newPassword } = parsed.data;

        const user = await prismadb.user.findFirst({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                resetPasswordCode: true,
                resetPasswordCodeExpiresAt: true,
            },
        });

        if (!user || !user.resetPasswordCode || !user.resetPasswordCodeExpiresAt) {
            return NextResponse.json(
                { message: "Ma xac nhan khong hop le hoac da het han." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        if (user.resetPasswordCodeExpiresAt.getTime() < Date.now()) {
            return NextResponse.json(
                { message: "Ma xac nhan da het han." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const isCodeValid = await bcrypt.compare(code, user.resetPasswordCode);

        if (!isCodeValid) {
            return NextResponse.json(
                { message: "Ma xac nhan khong dung." },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        await prismadb.user.update({
            where: { id: user.id },
            data: {
                hashedPassword: newHashedPassword,
                resetPasswordCode: null,
                resetPasswordCodeExpiresAt: null,
            },
        });

        return NextResponse.json(
            { message: "Dat lai mat khau thanh cong." },
            { status: 200, headers: CORS_HEADERS }
        );
    } catch (error) {
        console.log("[AUTH_FORGOT_PASSWORD_RESET_POST]", error);
        return NextResponse.json(
            { message: "Khong the dat lai mat khau luc nay." },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
