"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, CalendarDays, User, Paperclip } from "lucide-react";

type LeaveType = "SICK_LEAVE" | "PERSONAL_LEAVE" | "VACATION_LEAVE" | "OTHER";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LeaveRequest {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  medicalCertificateUrl?: string;
}

export function LeaveManagement() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/leaves?all=true");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleStatusUpdate = async (id: string, status: LeaveStatus) => {
    try {
      const res = await fetch(`/api/admin/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        // Update local state
        setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    switch (type) {
      case "SICK_LEAVE": return "ลาป่วย";
      case "PERSONAL_LEAVE": return "ลากิจ";
      case "VACATION_LEAVE": return "ลาพักร้อน";
      case "OTHER": return "อื่นๆ";
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">ยังไม่มีคำร้องขอลางาน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">จัดการคำร้องขอลางาน</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaves.map((leave) => (
          <div key={leave.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{leave.user.name || "ไม่มีชื่อ"}</p>
                  <p className="text-xs text-gray-500">{leave.user.email}</p>
                </div>
              </div>
              
              {leave.status === "PENDING" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  รอพิจารณา
                </span>
              ) : leave.status === "APPROVED" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  อนุมัติ
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  ไม่อนุมัติ
                </span>
              )}
            </div>

            <div className="mt-2 mb-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {getLeaveTypeLabel(leave.type)}
                </span>
                <span className="text-xs text-gray-400">
                  ยื่น: {format(new Date(leave.createdAt), "dd/MM/yy")}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-indigo-400" />
                {format(new Date(leave.startDate), "dd MMM")} - {format(new Date(leave.endDate), "dd MMM yyyy")}
              </div>
              
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                <span className="font-medium">เหตุผล: </span>
                {leave.reason}
              </div>
              
              {leave.medicalCertificateUrl && (
                <div className="mt-3">
                  <a 
                    href={leave.medicalCertificateUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <Paperclip className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    ดูใบรับรองแพทย์
                  </a>
                </div>
              )}
            </div>

            {leave.status === "PENDING" && (
              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleStatusUpdate(leave.id, "APPROVED")}
                  className="flex-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleStatusUpdate(leave.id, "REJECTED")}
                  className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                  ไม่อนุมัติ
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
