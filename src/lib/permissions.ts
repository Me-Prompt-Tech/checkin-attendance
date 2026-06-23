import { Session } from "next-auth";

/**
 * เช็กสิทธิ์การเข้าถึงข้อมูล UserProfile
 * @param session Session ปัจจุบันของผู้ใช้งาน
 * @param targetUserId ID ของเจ้าของข้อมูล
 */
export function canAccessProfile(session: Session | null, targetUserId: string): boolean {
  if (!session || !session.user) return false;
  if (session.user.role === "ADMIN") return true;
  if (session.user.id === targetUserId) return true;
  return false;
}
