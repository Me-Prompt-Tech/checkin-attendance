"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck, AlertTriangle, Eye, EyeOff } from "lucide-react";

function SettingsContent() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const isForced = searchParams.get("force") === "true" || session?.user?.forcePasswordChange;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ text: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน", type: "error" });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ text: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่", type: "success" });
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        
        // Force re-login
        setTimeout(() => {
          signOut({ callbackUrl: '/login' });
        }, 1500);
      } else {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <KeyRound size={20} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ตั้งค่าบัญชี</h1>
      </div>

      {isForced && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                จำเป็นต้องเปลี่ยนรหัสผ่าน
              </h3>
              <div className="mt-2 text-sm text-orange-700 dark:text-orange-400">
                <p>ผู้ดูแลระบบได้กำหนดรหัสผ่านชั่วคราวให้คุณ กรุณาเปลี่ยนรหัสผ่านใหม่ก่อนเข้าใช้งานระบบ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
          <ShieldCheck className="text-slate-500 dark:text-slate-400" size={20} />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">เปลี่ยนรหัสผ่าน</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              รหัสผ่านปัจจุบัน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="currentPassword"
                required
                value={passwords.currentPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              รหัสผ่านใหม่ <span className="text-xs text-slate-500 font-normal">(อย่างน้อย 6 ตัวอักษร)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                required
                value={passwords.newPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={passwords.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <SettingsContent />
    </Suspense>
  );
}
