import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    
    const type = formData.get("type") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;
    const certificate = formData.get("certificate") as File | null;

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let medicalCertificateUrl = null;

    if (certificate && certificate.size > 0) {
      const bytes = await certificate.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "public/uploads");
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        // Ignore if already exists
      }

      // Generate unique filename
      const filename = `${Date.now()}-${certificate.name.replace(/\s/g, '_')}`;
      const filepath = path.join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      medicalCertificateUrl = `/uploads/${filename}`;
    }

    // Convert dates to proper JS Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: type as any,
        startDate: start,
        endDate: end,
        reason,
        status: "PENDING",
        medicalCertificateUrl
      }
    });

    return NextResponse.json({ message: "Leave request created successfully", leaveRequest }, { status: 201 });
  } catch (error) {
    console.error("Leave request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");
    
    let leaves;
    
    if (all === 'true' && session.user.role === 'ADMIN') {
      leaves = await prisma.leaveRequest.findMany({
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      leaves = await prisma.leaveRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(leaves, { status: 200 });
  } catch (error) {
    console.error("Fetch leaves error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
