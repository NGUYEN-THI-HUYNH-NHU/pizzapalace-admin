import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import prismadb from "@/lib/prismadb";
import { sendForgotPasswordCodeEmail } from "@/lib/email";

const sendCodeSchema = z.object({
  email: z.string().trim().email("Email khong hop le."),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const buildOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sendCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Du lieu khong hop le." },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prismadb.user.findFirst({
      where: { email },
      select: { id: true },
    });

    // Always return the same message so attackers cannot enumerate accounts.
    const successResponse = NextResponse.json(
      { message: "Neu email ton tai, ma xac nhan da duoc gui." },
      { status: 200, headers: CORS_HEADERS },
    );

    if (!user) {
      return successResponse;
    }

    const code = buildOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, 10);

    await prismadb.user.update({
      where: { id: user.id },
      data: {
        resetPasswordCode: hashedCode,
        resetPasswordCodeExpiresAt: expiresAt,
      },
    });

    await sendForgotPasswordCodeEmail(email, code);

    return successResponse;
  } catch (error) {
    console.log("[AUTH_FORGOT_PASSWORD_SEND_CODE_POST]", error);
    return NextResponse.json(
      { message: "Khong the gui ma xac nhan luc nay." },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
