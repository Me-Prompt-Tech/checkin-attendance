import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found");
      return;
    }

    const testDate = new Date();
    testDate.setFullYear(2025);

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: testDate,
        checkInAfternoon: new Date(),
        status: "ON_TIME" as any,
      }
    });

    console.log("Success:", attendance);
    
    // Clean up
    await prisma.attendance.delete({
      where: { id: attendance.id }
    });

  } catch (error) {
    console.error("Test failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
