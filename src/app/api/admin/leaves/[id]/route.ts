import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ message: `Leave request ${status.toLowerCase()}`, leaveRequest }, { status: 200 });
  } catch (error) {
    console.error("Update leave request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
