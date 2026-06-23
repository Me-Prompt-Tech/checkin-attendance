import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canAccessProfile } from "@/lib/permissions";
import { EmploymentStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    if (!canAccessProfile(session, targetUserId)) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนตัว" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      kpiScore: user.kpiScore,
      employmentStatus: user.employmentStatus,
      joinedAt: user.joinedAt,
      resignedAt: user.resignedAt,
      profile: user.profile,
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    if (!canAccessProfile(session, targetUserId)) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนตัว" }, { status: 403 });
    }

    const data = await req.json();

    // ดึงค่าสำหรับ User Table
    const { kpiScore, employmentStatus, joinedAt, resignedAt, role, ...profileData } = data;

    // แอดมินเท่านั้นที่จะสามารถแก้ไขข้อมูล EmploymentStatus, KPI, Role ได้
    const isAdmin = session?.user?.role === "ADMIN";

    let updateUserData: any = {};
    if (isAdmin) {
      if (kpiScore !== undefined) updateUserData.kpiScore = Number(kpiScore);
      if (employmentStatus !== undefined) updateUserData.employmentStatus = employmentStatus as EmploymentStatus;
      if (role !== undefined) updateUserData.role = role;
      if (joinedAt !== undefined) updateUserData.joinedAt = joinedAt ? new Date(joinedAt) : null;
      if (resignedAt !== undefined) updateUserData.resignedAt = resignedAt ? new Date(resignedAt) : null;
    }

    // จัดการข้อมูล Profile Data
    const formattedProfileData = {
      phone: profileData.phone || null,
      address: profileData.address || null,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
      bankAccount: profileData.bankAccount || null,
      bankAccountName: profileData.bankAccountName || null,
      bankName: profileData.bankName || null,
      emergencyContactName: profileData.emergencyContactName || null,
      emergencyContactPhone: profileData.emergencyContactPhone || null,
    };

    // อัปเดตข้อมูลด้วย Prisma Transaction
    const updatedUser = await prisma.$transaction(async (prisma) => {
      let updatedUserProfile;

      // Upsert UserProfile
      const existingProfile = await prisma.userProfile.findUnique({ where: { userId: targetUserId } });
      if (existingProfile) {
        updatedUserProfile = await prisma.userProfile.update({
          where: { userId: targetUserId },
          data: formattedProfileData,
        });
      } else {
        updatedUserProfile = await prisma.userProfile.create({
          data: {
            ...formattedProfileData,
            userId: targetUserId,
          },
        });
      }

      // Update User if needed (Admin only fields)
      let finalUser;
      if (Object.keys(updateUserData).length > 0) {
        finalUser = await prisma.user.update({
          where: { id: targetUserId },
          data: updateUserData,
          include: { profile: true },
        });
      } else {
        finalUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          include: { profile: true },
        });
      }

      return finalUser;
    });

    return NextResponse.json({ message: "อัปเดตข้อมูลสำเร็จ", user: updatedUser });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" }, { status: 500 });
  }
}
