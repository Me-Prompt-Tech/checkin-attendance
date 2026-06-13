"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User as UserIcon, LayoutDashboard, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.forcePasswordChange && pathname !== '/settings') {
      router.push('/settings?force=true');
    }
  }, [session, pathname, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
                <Shield className="w-6 h-6" />
                <span>AMS</span>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {(session?.user.role === 'EMPLOYEE' || session?.user.role === 'INTERN') && (
                  <Link
                    href="/dashboard"
                    className={`${
                      pathname === '/dashboard'
                        ? 'border-blue-500 text-slate-900 dark:text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    หน้าหลักพนักงาน
                  </Link>
                )}
                {session?.user.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className={`${
                        pathname === '/admin'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      ประวัติการเข้างาน
                    </Link>
                    <Link
                      href="/admin/password-resets"
                      className={`${
                        pathname === '/admin/password-resets'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      คำขอรีเซ็ตรหัสผ่าน
                    </Link>
                    <Link
                      href="/admin/users"
                      className={`${
                        pathname === '/admin/users'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      จัดการพนักงาน
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <UserIcon size={16} />
                </div>
                <span>{session?.user?.name || session?.user?.email}</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {session?.user?.role}
                </span>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
              >
                <span className="hidden sm:inline">ตั้งค่ารหัสผ่าน</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation (for Employees only) */}
      {(session?.user.role === 'EMPLOYEE' || session?.user.role === 'INTERN') && (
        <div className="sm:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe">
          <div className="flex justify-around">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center py-3 px-6 ${
                pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard size={24} />
              <span className="text-xs mt-1">หน้าหลัก</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
