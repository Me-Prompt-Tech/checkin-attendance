import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  HeartPulse,
  Briefcase,
  Star,
  Activity,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface UserProfileData {
  phone: string;
  address: string;
  dateOfBirth: string;
  bankAccount: string;
  bankAccountName: string;
  bankName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  role?: string;
  employmentStatus?: string;
  kpiScore?: number;
  joinedAt?: string;
  resignedAt?: string;
}

interface UserProfileEditModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function UserProfileEditModal({ userId, userName, isOpen, onClose, onSaveSuccess }: UserProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "professional" | "financial">("personal");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [formData, setFormData] = useState<UserProfileData>({
    phone: "",
    address: "",
    dateOfBirth: "",
    bankAccount: "",
    bankAccountName: "",
    bankName: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    role: "EMPLOYEE",
    employmentStatus: "ACTIVE",
    kpiScore: 100,
    joinedAt: "",
    resignedAt: ""
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          phone: data.profile?.phone || "",
          address: data.profile?.address || "",
          dateOfBirth: data.profile?.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : "",
          bankAccount: data.profile?.bankAccount || "",
          bankAccountName: data.profile?.bankAccountName || "",
          bankName: data.profile?.bankName || "",
          emergencyContactName: data.profile?.emergencyContactName || "",
          emergencyContactPhone: data.profile?.emergencyContactPhone || "",
          role: data.role || "EMPLOYEE",
          employmentStatus: data.employmentStatus || "ACTIVE",
          kpiScore: data.kpiScore || 100,
          joinedAt: data.joinedAt ? new Date(data.joinedAt).toISOString().split('T')[0] : "",
          resignedAt: data.resignedAt ? new Date(data.resignedAt).toISOString().split('T')[0] : ""
        });
      } else {
        setMessage({ text: "ไม่สามารถดึงข้อมูลประวัติได้", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "เกิดข้อผิดพลาดของระบบ", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = { ...formData };
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ text: "บันทึกข้อมูลสำเร็จ!", type: "success" });
        setTimeout(() => {
          onSaveSuccess();
          onClose();
        }, 1500);
      } else {
        const errData = await res.json();
        setMessage({ text: errData.message || "เกิดข้อผิดพลาดในการบันทึก", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "ระบบขัดข้อง", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">จัดการข้อมูลส่วนบุคคล</h2>
            <p className="text-sm text-slate-400 mt-1">พนักงาน: {userName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800/60 p-4 sm:p-6 space-y-2 bg-slate-900/30 overflow-y-auto shrink-0">
              <TabButton 
                active={activeTab === "personal"} 
                onClick={() => setActiveTab("personal")}
                icon={<User size={18} />} 
                label="ข้อมูลส่วนบุคคล" 
              />
              <TabButton 
                active={activeTab === "professional"} 
                onClick={() => setActiveTab("professional")}
                icon={<Briefcase size={18} />} 
                label="ข้อมูลการทำงาน" 
              />
              <TabButton 
                active={activeTab === "financial"} 
                onClick={() => setActiveTab("financial")}
                icon={<CreditCard size={18} />} 
                label="ข้อมูลทางการเงิน" 
              />
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {message.text && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    <p className="font-medium text-sm">{message.text}</p>
                  </div>
                )}

                {/* Personal Tab */}
                <div className={activeTab === "personal" ? "block space-y-6" : "hidden"}>
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2 mb-6">ข้อมูลส่วนบุคคล และการติดต่อ</h3>
                  <div className="space-y-5">
                    <InputField 
                      label="วัน/เดือน/ปีเกิด" 
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth} 
                      onChange={handleChange} 
                      icon={<Calendar size={18} />} 
                    />
                    
                    <InputField 
                      label="เบอร์โทรศัพท์" 
                      name="phone"
                      placeholder="08X-XXX-XXXX"
                      value={formData.phone} 
                      onChange={handleChange} 
                      icon={<Phone size={18} />} 
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">ที่อยู่ปัจจุบัน</label>
                      <div className="relative group">
                        <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                          <MapPin size={18} />
                        </div>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows={3}
                          placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด..."
                          className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/60">
                      <h4 className="text-sm font-medium text-indigo-300 mb-4 flex items-center gap-2">
                        <HeartPulse size={16} /> ผู้ติดต่อฉุกเฉิน
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                          label="ชื่อ-นามสกุล (ผู้ติดต่อฉุกเฉิน)" 
                          name="emergencyContactName"
                          placeholder="ระบุชื่อผู้ติดต่อ"
                          value={formData.emergencyContactName} 
                          onChange={handleChange} 
                          icon={<User size={18} />} 
                        />
                        <InputField 
                          label="เบอร์โทรศัพท์ฉุกเฉิน" 
                          name="emergencyContactPhone"
                          placeholder="08X-XXX-XXXX"
                          value={formData.emergencyContactPhone} 
                          onChange={handleChange} 
                          icon={<Phone size={18} />} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Tab */}
                <div className={activeTab === "professional" ? "block space-y-6" : "hidden"}>
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2 mb-6">ข้อมูลการทำงานและสถานะ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">ตำแหน่ง (Role)</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      >
                        <option value="EMPLOYEE">พนักงาน (EMPLOYEE)</option>
                        <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                        <option value="INTERN">เด็กฝึกงาน (INTERN)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">สถานะพนักงาน (Status)</label>
                      <select
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleChange}
                        className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      >
                        <option value="PROBATION">ทดลองงาน (PROBATION)</option>
                        <option value="ACTIVE">พนักงานประจำ (ACTIVE)</option>
                        <option value="SUSPENDED">พักงาน (SUSPENDED)</option>
                        <option value="RESIGNED">ลาออก/พ้นสภาพ (RESIGNED)</option>
                      </select>
                    </div>

                    <InputField 
                      label="คะแนน KPI (KPI Score)" 
                      name="kpiScore"
                      type="number"
                      value={formData.kpiScore?.toString() || "100"} 
                      onChange={handleChange} 
                      icon={<Star size={18} />} 
                    />

                    <InputField 
                      label="วันที่เริ่มงาน (Joined Date)" 
                      name="joinedAt"
                      type="date"
                      value={formData.joinedAt || ""} 
                      onChange={handleChange} 
                      icon={<Calendar size={18} />} 
                    />

                    {formData.employmentStatus === "RESIGNED" && (
                      <InputField 
                        label="วันที่ลาออก (Resignation Date)" 
                        name="resignedAt"
                        type="date"
                        value={formData.resignedAt || ""} 
                        onChange={handleChange} 
                        icon={<Calendar size={18} />} 
                      />
                    )}

                  </div>
                </div>

                {/* Financial Tab */}
                <div className={activeTab === "financial" ? "block space-y-6" : "hidden"}>
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2 mb-6">ข้อมูลทางการเงิน (Payroll)</h3>
                  <div className="space-y-5">
                    <InputField 
                      label="ธนาคาร" 
                      name="bankName"
                      placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
                      value={formData.bankName} 
                      onChange={handleChange} 
                      icon={<CreditCard size={18} />} 
                    />
                    <InputField 
                      label="ชื่อบัญชี" 
                      name="bankAccountName"
                      placeholder="นาย/นางสาว..."
                      value={formData.bankAccountName} 
                      onChange={handleChange} 
                      icon={<User size={18} />} 
                    />
                    <InputField 
                      label="เลขบัญชีธนาคาร" 
                      name="bankAccount"
                      placeholder="XXX-X-XXXXX-X"
                      value={formData.bankAccount} 
                      onChange={handleChange} 
                      icon={<CreditCard size={18} />} 
                    />
                    <p className="text-xs text-slate-500">
                      * ข้อมูลนี้จะถูกใช้เพื่อการจ่ายเงินเดือน กรุณาตรวจสอบความถูกต้อง
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {submitLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save size={18} />
                        บันทึกข้อมูล
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Helper Components ----------------

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium border
        ${active 
          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-inner" 
          : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
        }
      `}
    >
      <div className={`${active ? "text-indigo-400" : "text-slate-500"}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function InputField({ 
  label, 
  name, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  icon 
}: { 
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner`}
        />
      </div>
    </div>
  );
}
