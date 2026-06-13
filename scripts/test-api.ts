import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApi() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return;

    const action = 'checkInAfternoon';
    const userId = user.id;
    const serverTime = new Date();
    const thaiDateString = serverTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const todayDate = new Date(thaiDateString);
    const timeValue = 14 * 60 + 38; // Simulate 14:38

    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: todayDate,
        }
      }
    });

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

    console.log("Success");
  } catch (error) {
    console.error("Test failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testApi();
