"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Search, Download, Calendar as CalendarIcon, MapPin, MessageSquareText, Users, CalendarDays } from "lucide-react";
import Papa from "papaparse";
import { LeaveManagement } from "@/components/admin/LeaveManagement";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');

  // Filters
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }));
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    } else if (session?.user?.role !== "ADMIN" && status === "authenticated") {
      redirect("/dashboard");
    }
  }, [session, status]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchRecords();
    }
  }, [session, startDate, endDate, searchQuery]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleExportCSV = () => {
    const exportData = records.map(record => ({
      "วันที่": new Date(record.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      "ชื่อพนักงาน": record.user.name || record.user.email,
      "อีเมล": record.user.email,
      "คะแนน KPI": record.user.kpiScore || 100,
      "เวลาเข้างาน (เช้า)": record.checkIn ? new Date(record.checkIn).toLocaleTimeString('th-TH') : "-",
      "เวลาพักเที่ยง": record.checkOutLunch ? new Date(record.checkOutLunch).toLocaleTimeString('th-TH') : "-",
      "เวลาเข้างาน (บ่าย)": record.checkInAfternoon ? new Date(record.checkInAfternoon).toLocaleTimeString('th-TH') : "-",
      "เวลาออกงาน (เย็น)": record.checkOut ? new Date(record.checkOut).toLocaleTimeString('th-TH') : "-",
      "เหตุผลออกก่อนเวลา": record.earlyLeaveReason || "-",
      "ละติจูด (เข้า)": record.latitude || "-",
      "ลองจิจูด (เข้า)": record.longitude || "-",
      "สถานะ": translateStatus(record.status)
    }));

    const csv = "\uFEFF" + Papa.unparse(exportData); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_export_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading" || !session) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`lg:text-xl font-bold flex items-center gap-2 pb-2 -mb-[17px] border-b-2 transition-colors ${activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
          >
            <Users className="w-5 h-5" />
            การเข้างาน
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`lg:text-xl font-bold flex items-center gap-2 pb-2 -mb-[17px] border-b-2 transition-colors ${activeTab === 'leaves'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
          >
            <CalendarDays className="w-5 h-5" />
            การขอลางาน
          </button>
        </div>

        {activeTab === 'attendance' && (
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-sm md:text-base text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
        )}
      </div>

      {activeTab === 'leaves' ? (
        <LeaveManagement />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาชื่อพนักงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
              />
            </div>
            <div className="sm:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
              />
            </div>
            <div className="flex items-center justify-center text-slate-400">-</div>
            <div className="sm:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">พนักงาน</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">KPI</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">เข้าเช้า</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">พักเที่ยง</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">เข้าบ่าย</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">เลิกงาน</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">พิกัด/เหตุผล</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        ไม่พบข้อมูลการเข้างาน
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {record.user.name?.charAt(0).toUpperCase() || record.user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {record.user.name || "ไม่มีชื่อ"}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {record.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-bold ${record.user.kpiScore < 100 ? 'text-orange-500' : 'text-green-600'}`}>
                              {record.user.kpiScore || 100}
                            </span>
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {record.checkOutLunch ? new Date(record.checkOutLunch).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {record.checkInAfternoon ? new Date(record.checkInAfternoon).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col gap-1 max-w-[150px]">
                            {record.latitude && record.longitude && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                              >
                                <MapPin size={12} /> ดูแผนที่
                              </a>
                            )}
                            {record.earlyLeaveReason && (
                              <div className="flex items-start gap-1 text-yellow-600 dark:text-yellow-500" title={record.earlyLeaveReason}>
                                <MessageSquareText size={12} className="mt-0.5 shrink-0" />
                                <span className="truncate">{record.earlyLeaveReason}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(record.status)}`}>
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
        </>
      )}
    </div>
  );
}
