import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { id }
    });

    if (!resetRequest) {
      return NextResponse.json({ message: "ไม่พบคำขอรีเซ็ตรหัสผ่าน" }, { status: 404 });
    }

    if (resetRequest.status === "RESOLVED") {
      return NextResponse.json({ message: "คำขอนี้ได้รับการจัดการแล้ว" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Run transaction to ensure both user and request are updated
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { 
          password: hashedNewPassword,
          forcePasswordChange: true 
        }
      }),
      prisma.passwordResetRequest.update({
        where: { id },
        data: { status: "RESOLVED" }
      })
    ]);

    return NextResponse.json({ message: "กำหนดรหัสผ่านใหม่สำเร็จ" });
  } catch (error) {
    console.error("Resolve Password Reset Request Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
