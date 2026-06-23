"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User as UserIcon, LayoutDashboard, Shield, CalendarDays, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Profiler, useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.forcePasswordChange && pathname !== '/profile') {
      router.push('/profile?force=true');
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
                  <>
                    <Link
                      href="/dashboard"
                      className={`${pathname === '/dashboard'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      หน้าหลัก
                    </Link>
                    <Link
                      href="/leaves"
                      className={`${pathname === '/leaves'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      ขอลางาน
                    </Link>
                  </>
                )}
                {session?.user.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className={`${pathname === '/admin'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      ประวัติการเข้างาน
                    </Link>
                    <Link
                      href="/admin/password-resets"
                      className={`${pathname === '/admin/password-resets'
                          ? 'border-blue-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      คำขอรีเซ็ตรหัสผ่าน
                    </Link>
                    <Link
                      href="/admin/users"
                      className={`${pathname === '/admin/users'
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

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserIcon size={16} />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none">
                    {session?.user?.name || session?.user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 mt-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-medium">
                    {session?.user?.role}
                  </span>
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <User size={16} className="text-slate-400" />
                      <span className="font-medium">My Profile</span>
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button
                      onClick={() => { setIsProfileOpen(false); signOut({ callbackUrl: "/login" }); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <LogOut size={16} className="text-red-400" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </>
              )}
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
        <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe">
          <div className="flex justify-around">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center py-3 px-6 ${pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <LayoutDashboard size={24} />
              <span className="text-xs mt-1">หน้าหลัก</span>
            </Link>
            <Link
              href="/leaves"
              className={`flex flex-col items-center py-3 px-6 ${pathname === '/leaves' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <CalendarDays size={24} />
              <span className="text-xs mt-1">ขอลางาน</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
