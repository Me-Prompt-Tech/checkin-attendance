"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { 
  KeyRound, ShieldCheck, AlertTriangle, Eye, EyeOff, 
  User, Phone, MapPin, Calendar, CreditCard, HeartPulse, 
  Briefcase, Star, Activity, Save, CheckCircle2, AlertCircle 
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

function ProfileContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isForced = searchParams.get("force") === "true" || session?.user?.forcePasswordChange;
  
  // States
  const [activeTab, setActiveTab] = useState<"personal" | "professional" | "financial" | "security">(isForced ? "security" : "personal");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
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
    if (status === "unauthenticated") {
      redirect("/login");
    } else if (status === "authenticated" && session?.user?.id) {
      fetchProfile();
    }
  }, [status, session]);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/users/${session?.user?.id}/profile`);
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
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch(`/api/users/${session?.user?.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ text: "บันทึกข้อมูลส่วนตัวสำเร็จ!", type: "success" });
      } else {
        const errData = await res.json();
        setMessage({ text: errData.message || "เกิดข้อผิดพลาดในการบันทึก", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "ระบบขัดข้อง", type: "error" });
    } finally {
      setSubmitLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    setPasswordLoading(true);

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
        
        setTimeout(() => {
          signOut({ callbackUrl: '/login' });
        }, 1500);
      } else {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <User size={20} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">โปรไฟล์ของฉัน (My Profile)</h1>
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
                <p>ผู้ดูแลระบบได้กำหนดรหัสผ่านชั่วคราวให้คุณ กรุณาไปที่แท็บ "ความปลอดภัย" และเปลี่ยนรหัสผ่านใหม่ก่อนเข้าใช้งานระบบแบบเต็มรูปแบบ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${message.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/60 p-4 sm:p-6 space-y-2 bg-slate-50 dark:bg-slate-900/30">
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
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <TabButton 
              active={activeTab === "security"} 
              onClick={() => setActiveTab("security")}
              icon={<KeyRound size={18} />} 
              label="ความปลอดภัย" 
              danger={isForced}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 sm:p-8">
          {loadingProfile ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
            <>
              {/* Profile Forms */}
              {(activeTab === "personal" || activeTab === "financial" || activeTab === "professional") && (
                <form onSubmit={handleProfileSubmit} className="space-y-8 animate-in fade-in duration-300">
                  
                  {activeTab === "personal" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">ข้อมูลส่วนบุคคล และการติดต่อ</h3>
                      <div className="space-y-5">
                        <InputField label="วัน/เดือน/ปีเกิด" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleProfileChange} icon={<Calendar size={18} />} />
                        <InputField label="เบอร์โทรศัพท์" name="phone" placeholder="08X-XXX-XXXX" value={formData.phone} onChange={handleProfileChange} icon={<Phone size={18} />} />
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ที่อยู่ปัจจุบัน</label>
                          <div className="relative group">
                            <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                              <MapPin size={18} />
                            </div>
                            <textarea
                              name="address"
                              value={formData.address}
                              onChange={handleProfileChange}
                              rows={3}
                              placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด..."
                              className="w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none shadow-sm dark:shadow-inner"
                            />
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/60">
                          <h4 className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-4 flex items-center gap-2">
                            <HeartPulse size={16} /> ผู้ติดต่อฉุกเฉิน
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField label="ชื่อ-นามสกุล (ผู้ติดต่อฉุกเฉิน)" name="emergencyContactName" placeholder="ระบุชื่อผู้ติดต่อ" value={formData.emergencyContactName} onChange={handleProfileChange} icon={<User size={18} />} />
                            <InputField label="เบอร์โทรศัพท์ฉุกเฉิน" name="emergencyContactPhone" placeholder="08X-XXX-XXXX" value={formData.emergencyContactPhone} onChange={handleProfileChange} icon={<Phone size={18} />} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "professional" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">ข้อมูลการทำงานและสถานะ <span className="text-sm font-normal text-slate-500">(อ่านได้อย่างเดียว)</span></h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReadOnlyCard icon={<Briefcase />} title="ตำแหน่ง (Role)" value={formData.role || "EMPLOYEE"} color="blue" />
                        <ReadOnlyCard icon={<Activity />} title="สถานะพนักงาน (Status)" value={formData.employmentStatus || "ACTIVE"} color="emerald" />
                        <ReadOnlyCard icon={<Star />} title="คะแนน KPI (KPI Score)" value={`${formData.kpiScore || 100} / 100`} color="amber" />
                        <ReadOnlyCard icon={<Calendar />} title="วันที่เริ่มงาน (Joined Date)" value={formData.joinedAt ? new Date(formData.joinedAt).toLocaleDateString('th-TH') : "-"} color="purple" />
                      </div>
                    </div>
                  )}

                  {activeTab === "financial" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">ข้อมูลทางการเงิน (Payroll)</h3>
                      <div className="space-y-5">
                        <InputField label="ธนาคาร" name="bankName" placeholder="เช่น กสิกรไทย, ไทยพาณิชย์" value={formData.bankName} onChange={handleProfileChange} icon={<CreditCard size={18} />} />
                        <InputField label="ชื่อบัญชี" name="bankAccountName" placeholder="นาย/นางสาว..." value={formData.bankAccountName} onChange={handleProfileChange} icon={<User size={18} />} />
                        <InputField label="เลขบัญชีธนาคาร" name="bankAccount" placeholder="XXX-X-XXXXX-X" value={formData.bankAccount} onChange={handleProfileChange} icon={<CreditCard size={18} />} />
                        <p className="text-xs text-slate-500">
                          * ข้อมูลนี้จะถูกใช้เพื่อการโอนเงินเดือน กรุณาตรวจสอบความถูกต้องให้ครบถ้วน
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab !== "professional" && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex justify-end">
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-500/20"
                      >
                        {submitLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Save size={18} /> บันทึกข้อมูลโปรไฟล์</>}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Security Form (Change Password) */}
              {activeTab === "security" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-500" size={20} />
                    เปลี่ยนรหัสผ่าน
                  </h3>
                  
                  <div className="space-y-5">
                    <PasswordField label="รหัสผ่านปัจจุบัน" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} showPassword={showPassword} setShowPassword={setShowPassword} />
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <PasswordField label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} showPassword={showPassword} setShowPassword={setShowPassword} />
                    </div>
                    <PasswordField label="ยืนยันรหัสผ่านใหม่" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} showPassword={showPassword} setShowPassword={setShowPassword} />
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                      {passwordLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}

// ---------------- Helper Components ----------------

function TabButton({ active, onClick, icon, label, danger }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium border
        ${active 
          ? (danger ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 shadow-inner" : "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 shadow-inner")
          : (danger ? "bg-transparent text-orange-500 border-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20" : "bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200")
        }
      `}
    >
      <div className={`${active ? (danger ? "text-orange-500 dark:text-orange-400" : "text-indigo-600 dark:text-indigo-400") : "text-slate-500"}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function InputField({ label, name, type = "text", placeholder, value, onChange, icon }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm dark:shadow-inner`}
        />
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, showPassword, setShowPassword }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          required
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm dark:shadow-inner"
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
  );
}

function ReadOnlyCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: "blue" | "emerald" | "amber" | "purple" }) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20"
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
