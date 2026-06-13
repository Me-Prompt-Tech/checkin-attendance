"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { MapPin, Clock, CalendarDays, CheckCircle2, Coffee, Sunrise, Sunset, Activity, AlertCircle } from "lucide-react";

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const [time, setTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [kpiScore, setKpiScore] = useState(100);
  
  // Early leave modal state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState("");

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      window.location.href = "/admin";
    }
  }, [session]);

  // Update time every second
  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
        if (data.kpiScore !== undefined) {
          setKpiScore(data.kpiScore);
        }
      }
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const getPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }
    });
  };

  const handleAction = async (action: string, reason?: string) => {
    // If action is checkOut and time is before 18:00, show modal if reason not provided
    if (action === 'checkOut' && !reason) {
      const currentHours = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour12: false });
      const [h, m] = currentHours.split(':').map(Number);
      if (h < 18) {
        setShowReasonModal(true);
        return;
      }
    }

    setLoading(true);
    setShowReasonModal(false);
    setMessage({ text: "กำลังบันทึกข้อมูล...", type: "info" });

    try {
      let lat = null;
      let lng = null;

      // Only get GPS for checkIn and checkInAfternoon to speed up checkouts, or get it for all if preferred
      if (action.includes('checkIn')) {
        try {
          const position = await getPosition();
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoError) {
          console.warn("Could not get location:", geoError);
          const proceed = confirm("ไม่สามารถดึงข้อมูลตำแหน่งที่ตั้งได้ ต้องการบันทึกเวลาโดยไม่มีตำแหน่งหรือไม่?");
          if (!proceed) {
            setLoading(false);
            setMessage({ text: "ยกเลิกการบันทึกเวลา", type: "error" });
            return;
          }
        }
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, latitude: lat, longitude: lng, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "บันทึกเวลาสำเร็จ", type: "success" });
        setEarlyLeaveReason("");
        fetchHistory(); // Refresh history
      } else {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  if (!time) return null;

  const currentHour = time.getHours();
  
  const isMorningPhase = currentHour >= 0 && currentHour < 12;
  const isLunchPhase = currentHour === 12;
  const isAfternoonPhase = currentHour >= 13 && currentHour < 18;
  const isEveningPhase = currentHour >= 18;

  let phaseText = "";
  let phaseColor = "";
  
  if (isMorningPhase) {
    phaseText = "ขณะนี้อยู่ในช่วงเวลา: เข้างานรอบเช้า (00:00 - 11:59 น.)";
    phaseColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  } else if (isLunchPhase) {
    phaseText = "ขณะนี้อยู่ในช่วงเวลา: พักกลางวัน (12:00 - 12:59 น.)";
    phaseColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  } else if (isAfternoonPhase) {
    phaseText = "ขณะนี้อยู่ในช่วงเวลา: เข้างานรอบบ่าย (13:00 - 17:59 น.)";
    phaseColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  } else {
    phaseText = "ขณะนี้อยู่ในช่วงเวลา: เลิกงาน (18:00 น. เป็นต้นไป)";
    phaseColor = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
  }

  const todayRecord = history.length > 0 && 
    new Date(history[0].date).toLocaleDateString('en-CA') === time.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) 
    ? history[0] : null;

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      'ON_TIME': 'ตรงเวลา',
      'LATE_MORNING': 'สาย (เช้า)',
      'LATE_AFTERNOON': 'สาย (บ่าย)',
      'EARLY_LEAVE': 'ออกก่อนเวลา',
      'ABSENT': 'ขาดงาน',
      'ON_LEAVE': 'ลา'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TIME': return 'bg-green-100 text-green-700 border-green-200';
      case 'LATE_MORNING':
      case 'LATE_AFTERNOON': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'EARLY_LEAVE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Bar with KPI */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">คะแนน KPI ปัจจุบัน</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpiScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500 flex items-center gap-1 justify-end">
            <AlertCircle size={14} /> หักคะแนนเมื่อมาสาย
          </div>
        </div>
      </div>

      {/* Main Clock & Buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
        
        <h2 className="text-xl font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-center gap-2">
          <CalendarDays size={20} />
          {time.toLocaleDateString('th-TH', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </h2>
        <div className="text-6xl sm:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tighter tabular-nums">
          {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <div className={`mb-6 p-4 rounded-xl inline-block max-w-lg w-full text-sm font-medium border ${phaseColor}`}>
          <div className="flex items-center justify-center gap-2">
            <Clock size={18} />
            {phaseText}
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl inline-block max-w-md w-full text-sm font-medium ${
            message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            message.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-3xl mx-auto">
          {/* Morning Check-In Button */}
          {isMorningPhase && (
            <button
              onClick={() => handleAction('checkIn')}
              disabled={loading || !!todayRecord?.checkIn}
              className="flex-1 relative group overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
              <div className="relative bg-white/10 flex flex-col items-center justify-center py-6 px-4 rounded-xl text-white h-full">
                <Sunrise size={28} className="mb-2" />
                <span className="text-lg font-bold">เข้างาน (เช้า)</span>
                {todayRecord?.checkIn && (
                  <span className="text-xs mt-2 bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> {new Date(todayRecord.checkIn).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Lunch Check-Out Button */}
          {isLunchPhase && (
            <button
              onClick={() => handleAction('checkOutLunch')}
              disabled={loading || !todayRecord?.checkIn || !!todayRecord?.checkOutLunch}
              className="flex-1 relative group overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-1 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
              <div className="relative bg-white/10 flex flex-col items-center justify-center py-6 px-4 rounded-xl text-white h-full">
                <Coffee size={28} className="mb-2" />
                <span className="text-lg font-bold">พักเที่ยง</span>
                {todayRecord?.checkOutLunch && (
                  <span className="text-xs mt-2 bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> {new Date(todayRecord.checkOutLunch).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Afternoon Check-In Button */}
          {isAfternoonPhase && (
            <button
              onClick={() => handleAction('checkInAfternoon')}
              disabled={loading || !!todayRecord?.checkInAfternoon}
              className="flex-1 relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
              <div className="relative bg-white/10 flex flex-col items-center justify-center py-6 px-4 rounded-xl text-white h-full">
                <Activity size={28} className="mb-2" />
                <span className="text-lg font-bold">เข้างาน (บ่าย)</span>
                {todayRecord?.checkInAfternoon && (
                  <span className="text-xs mt-2 bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> {new Date(todayRecord.checkInAfternoon).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Check-Out Button (Always render to allow early leave, but disable if no check-in exists yet) */}
          <button
            onClick={() => handleAction('checkOut')}
            disabled={loading || (!todayRecord?.checkIn && !todayRecord?.checkInAfternoon) || !!todayRecord?.checkOut}
            className="flex-1 relative group overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
            <div className="relative bg-white/10 flex flex-col items-center justify-center py-6 px-4 rounded-xl text-white h-full">
              <Sunset size={28} className="mb-2" />
              <span className="text-lg font-bold">เลิกงาน</span>
              {todayRecord?.checkOut && (
                <span className="text-xs mt-2 bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> {new Date(todayRecord.checkOut).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          ประวัติการเข้างานล่าสุด
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-4 rounded-tl-lg">วันที่</th>
                <th className="py-4 px-4">เข้าเช้า</th>
                <th className="py-4 px-4">พักเที่ยง</th>
                <th className="py-4 px-4">เข้าบ่าย</th>
                <th className="py-4 px-4">เลิกงาน</th>
                <th className="py-4 px-4 rounded-tr-lg">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    ไม่มีข้อมูลการเข้างาน
                  </td>
                </tr>
              ) : (
                history.slice(0, 7).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                      {record.checkOutLunch ? new Date(record.checkOutLunch).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                      {record.checkInAfternoon ? new Date(record.checkInAfternoon).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {translateStatus(record.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Early Leave Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="text-yellow-500" />
                ออกก่อนเวลา
              </h3>
              <p className="text-sm text-slate-500 mt-1">ขณะนี้ยังไม่ถึงเวลาเลิกงาน (18:00 น.) กรุณาระบุเหตุผล</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={earlyLeaveReason}
                onChange={(e) => setEarlyLeaveReason(e.target.value)}
                placeholder="ระบุเหตุผลที่ต้องออกก่อนเวลา..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowReasonModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleAction('checkOut', earlyLeaveReason)}
                  disabled={!earlyLeaveReason.trim() || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {loading ? "กำลังบันทึก..." : "ยืนยันการเลิกงาน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
