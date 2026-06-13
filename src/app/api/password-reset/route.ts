import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "กรุณาระบุอีเมล" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ message: "หากมีอีเมลในระบบ จะมีการแจ้งเตือนไปยังผู้ดูแลระบบ" });
    }

    // Check if there is already a pending request
    const existingRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return NextResponse.json({ message: "คำขอของคุณกำลังดำเนินการอยู่แล้ว" }, { status: 400 });
    }

    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        status: "PENDING"
      }
    });

    return NextResponse.json({ message: "ส่งคำขอสำเร็จ ผู้ดูแลระบบจะดำเนินการให้ในไม่ช้า" });
  } catch (error) {
    console.error("Password Reset Request Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
