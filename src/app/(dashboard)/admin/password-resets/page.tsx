"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type PasswordResetRequest = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
};

export default function PasswordResetsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: "", type: "" });

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/password-resets");
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError("ไม่สามารถดึงข้อมูลคำขอได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchRequests();
    }
  }, [session]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (newPassword.length < 6) {
      setSubmitMessage({ text: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", type: "error" });
      return;
    }

    setSubmitting(true);
    setSubmitMessage({ text: "", type: "" });

    try {
      const res = await fetch(`/api/admin/password-resets/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitMessage({ text: "กำหนดรหัสผ่านใหม่สำเร็จ", type: "success" });
        setRequests(requests.filter(req => req.id !== selectedRequest.id));
        setTimeout(() => {
          setSelectedRequest(null);
          setNewPassword("");
          setSubmitMessage({ text: "", type: "" });
        }, 2000);
      } else {
        setSubmitMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
      }
    } catch (error) {
      setSubmitMessage({ text: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <KeyRound size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">คำขอรีเซ็ตรหัสผ่าน</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">จัดการคำขอลืมรหัสผ่านของพนักงาน</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {selectedRequest ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">กำหนดรหัสผ่านใหม่</h2>
          
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">พนักงาน:</span> {selectedRequest.user.name || "ไม่มีชื่อ"}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">อีเมล:</span> {selectedRequest.user.email}
            </p>
          </div>

          <form onSubmit={handleResolve} className="space-y-4">
            {submitMessage.text && (
              <div className={`rounded-lg p-3 text-sm ${
                submitMessage.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {submitMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                รหัสผ่านชั่วคราว
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="ป้อนรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                ระบบจะบังคับให้พนักงานเปลี่ยนรหัสผ่านนี้เมื่อเข้าสู่ระบบครั้งถัดไป
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "กำลังบันทึก..." : "ยืนยันและรีเซ็ต"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setNewPassword("");
                  setSubmitMessage({ text: "", type: "" });
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
              <CheckCircle2 size={48} className="text-green-500 mb-4 opacity-50" />
              <p>ไม่มีคำขอรีเซ็ตรหัสผ่านในขณะนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ผู้ขอ</th>
                    <th className="px-6 py-4 font-semibold">อีเมล</th>
                    <th className="px-6 py-4 font-semibold">เวลาที่ขอ</th>
                    <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {request.user.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {request.user.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          {new Date(request.createdAt).toLocaleString("th-TH")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium transition-colors"
                        >
                          <KeyRound size={14} />
                          กำหนดรหัสใหม่
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
