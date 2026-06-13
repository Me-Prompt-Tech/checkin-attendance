import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGet() {
  try {
    const dateParam = '2026-06-10';
    let whereClause: any = {};
    if (dateParam) {
      whereClause.date = new Date(dateParam);
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
    console.log("Success, found records:", records.length);
  } catch (error) {
    console.error("Test failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testGet();
