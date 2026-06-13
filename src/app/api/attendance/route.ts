import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "ADMIN") {
      return NextResponse.json({ message: "Admin users do not need to check in/out" }, { status: 403 });
    }

    const { action, latitude, longitude, reason } = await req.json();

    if (!action || !['checkIn', 'checkOutLunch', 'checkInAfternoon', 'checkOut'].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const userId = session.user.id;
    
    // Server-side Time in UTC
    const serverTime = new Date();

    // Get current date string in Asia/Bangkok (Thailand) timezone
    const thaiDateString = serverTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const todayDate = new Date(thaiDateString);

    // Get current hour and minute in Thai time for validation
    const thaiTimeString = serverTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour12: false });
    // thaiTimeString is like "09:15:00"
    const [hours, minutes] = thaiTimeString.split(':').map(Number);
    const timeValue = hours * 60 + minutes; // minutes since midnight

    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: todayDate,
        }
      }
    });

    if (action === 'checkIn') {
      if (attendance && attendance.checkIn) {
        return NextResponse.json({ message: "Already checked in for morning" }, { status: 400 });
      }

      if (timeValue >= 12 * 60) {
        return NextResponse.json({ message: "หมดเวลาลงชื่อเข้างานรอบเช้าแล้ว กรุณาลงชื่อเข้างานรอบบ่ายตั้งแต่เวลา 13:00 น. เป็นต้นไป" }, { status: 400 });
      }

      let status = "ON_TIME";
      let deductKpi = false;

      // > 09:15 is late morning
      if (timeValue > 9 * 60 + 15) {
        status = "LATE_MORNING";
        deductKpi = true;
      }

      if (!attendance) {
        attendance = await prisma.attendance.create({
          data: {
            userId,
            date: todayDate,
            checkIn: serverTime,
            latitude: latitude || null,
            longitude: longitude || null,
            status: status as any,
          }
        });
      } else {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkIn: serverTime,
            latitude: attendance.latitude || latitude || null,
            longitude: attendance.longitude || longitude || null,
            status: status as any,
          }
        });
      }

      // Deduct KPI if not approved leave
      if (deductKpi && !attendance.hasApprovedLeave) {
        await prisma.user.update({
          where: { id: userId },
          data: { kpiScore: { decrement: 1 } }
        });
      }

    } else if (action === 'checkOutLunch') {
      if (!attendance) return NextResponse.json({ message: "No attendance record today" }, { status: 400 });
      if (timeValue < 12 * 60 || timeValue > 13 * 60) {
        return NextResponse.json({ message: "พักเที่ยงต้องกดออกระหว่างเวลา 12:00 - 13:00 น. เท่านั้น" }, { status: 400 });
      }
      
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkOutLunch: serverTime }
      });

    } else if (action === 'checkInAfternoon') {
      if (timeValue < 13 * 60) {
        return NextResponse.json({ message: "สามารถลงชื่อเข้างานรอบบ่ายได้ตั้งแต่เวลา 13:00 น. เป็นต้นไป" }, { status: 400 });
      }

      let status = attendance?.status || "ON_TIME";
      let deductKpi = false;

      // > 13:30 is late afternoon
      if (timeValue > 13 * 60 + 30) {
        status = "LATE_AFTERNOON";
        deductKpi = true;
      }

      if (!attendance) {
        attendance = await prisma.attendance.create({
          data: {
            userId,
            date: todayDate,
            checkInAfternoon: serverTime,
            latitude: latitude || null,
            longitude: longitude || null,
            status: status as any,
          }
        });
      } else {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkInAfternoon: serverTime,
            status: status as any,
          }
        });
      }

      if (deductKpi && !attendance.hasApprovedLeave) {
        await prisma.user.update({
          where: { id: userId },
          data: { kpiScore: { decrement: 1 } }
        });
      }

    } else if (action === 'checkOut') {
      if (!attendance) return NextResponse.json({ message: "No attendance record today" }, { status: 400 });
      if (attendance.checkOut) return NextResponse.json({ message: "Already checked out" }, { status: 400 });
      
      const firstCheckIn = attendance.checkIn || attendance.checkInAfternoon;
      if (!firstCheckIn) {
        return NextResponse.json({ message: "กรุณาลงชื่อเข้างานก่อน" }, { status: 400 });
      }

      const diffMs = serverTime.getTime() - new Date(firstCheckIn).getTime();
      const oneHourMs = 60 * 60 * 1000;
      if (diffMs < oneHourMs) {
        return NextResponse.json({ message: "ไม่สามารถเลิกงานได้ ต้องทำงานอย่างน้อย 1 ชั่วโมงหลังจากการเข้างาน" }, { status: 400 });
      }

      let updateData: any = { checkOut: serverTime };

      // Early leave before 18:00
      if (timeValue < 18 * 60) {
        if (!reason) {
          return NextResponse.json({ message: "Reason required for early leave" }, { status: 400 });
        }
        updateData.status = "EARLY_LEAVE";
        updateData.earlyLeaveReason = reason;
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData
      });
    }

    return NextResponse.json({ message: "Success", attendance }, { status: 200 });

  } catch (error) {
    console.error("Attendance API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    if (session.user.role === 'EMPLOYEE' || session.user.role === 'INTERN') {
      const records = await prisma.attendance.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });
      // also fetch user KPI
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { kpiScore: true }});
      return NextResponse.json({ records, kpiScore: user?.kpiScore || 100 }, { status: 200 });
    }
    
    if (session.user.role === 'ADMIN') {
      const { searchParams } = new URL(req.url);
      const dateParam = searchParams.get('date');
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const search = searchParams.get('search');
      
      let whereClause: any = {};
      
      if (startDateParam && endDateParam) {
        whereClause.date = {
          gte: new Date(startDateParam),
          lte: new Date(endDateParam),
        };
      } else if (dateParam) {
        whereClause.date = new Date(dateParam);
      }
      
      if (search) {
        whereClause.user = {
          name: { contains: search, mode: 'insensitive' }
        };
      }

      const records = await prisma.attendance.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, email: true, kpiScore: true }
          }
        },
        orderBy: { date: 'desc' },
      });
      
      return NextResponse.json(records, { status: 200 });
    }

    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Attendance Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
