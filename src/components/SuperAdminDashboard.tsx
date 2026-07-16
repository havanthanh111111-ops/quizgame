import React, { useState } from "react";
import { Lock, Unlock, Users, Plus, Trash2, Edit3, Loader2, KeyRound } from "lucide-react";
import { Teacher } from "../types";

interface SuperAdminDashboardProps {
  teachers: Teacher[];
  onRefresh: () => Promise<void>;
  onBack: () => void;
  showCustomAlert: (title: string, message: string, type?: "success" | "error" | "alert") => void;
  showCustomConfirm: (title: string, message: string, onConfirm: () => void) => void;
  setToastMessage: (msg: string | null) => void;
}

export default function SuperAdminDashboard({
  teachers,
  onRefresh,
  onBack,
  showCustomAlert,
  showCustomConfirm,
  setToastMessage,
}: SuperAdminDashboardProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [validatedPasscode, setValidatedPasscode] = useState("");

  // Admin passcode modal states
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [adminCurrentPass, setAdminCurrentPass] = useState("");
  const [adminNewPass, setAdminNewPass] = useState("");
  
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherCode, setNewTeacherCode] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPassword, setEditingPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthorized(true);
        setValidatedPasscode(passcode);
        setToastMessage("Đăng nhập quyền Quản trị tối cao thành công! 🔑");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        showCustomAlert("Mật mã sai", data.error || "Mật mã quản trị viên tối cao không chính xác. Vui lòng thử lại!", "error");
      }
    } catch (err: any) {
      showCustomAlert("Lỗi mạng", "Không thể xác thực: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherCode.trim()) return;

    const codeUpper = newTeacherCode.trim().toUpperCase();
    if (codeUpper === "ALL" || codeUpper === "CHUNG") {
      showCustomAlert("Lỗi bảo mật", "Mã giáo viên này trùng với từ khóa hệ thống. Vui lòng chọn mã khác!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeacherName.trim(),
          code: codeUpper,
          password: newTeacherPassword.trim()
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewTeacherName("");
        setNewTeacherCode("");
        setNewTeacherPassword("");
        await onRefresh();
        setToastMessage(`Đã cấp phòng dạy thành công cho GV ${data.name}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        showCustomAlert("Không thể thêm giáo viên", data.error || "Mã lớp hoặc tên giáo viên không hợp lệ.", "error");
      }
    } catch (err: any) {
      showCustomAlert("Lỗi mạng", "Không thể liên kết tới máy chủ: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/teachers/${editingTeacher.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingName.trim(),
          password: editingPassword.trim()
        }),
      });

      if (res.ok) {
        setEditingTeacher(null);
        setEditingName("");
        setEditingPassword("");
        await onRefresh();
        setToastMessage("Cập nhật thông tin giáo viên thành công!");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const data = await res.json();
        showCustomAlert("Lỗi cập nhật", data.error || "Không thể lưu thông tin mới.", "error");
      }
    } catch (err: any) {
      showCustomAlert("Lỗi kết nối", err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeacher = (code: string, name: string) => {
    showCustomConfirm(
      "Xác nhận xóa tài khoản",
      `Bạn có chắc chắn muốn xóa phòng dạy của Giáo viên "${name}" (Mã: ${code})? Tất cả bài học và cấu hình đi kèm của giáo viên này sẽ bị gỡ khỏi hệ thống trung tâm.`,
      async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/teachers/${code}`, {
            method: "DELETE",
          });
          if (res.ok) {
            await onRefresh();
            setToastMessage(`Đã xóa giáo viên ${name} thành công.`);
            setTimeout(() => setToastMessage(null), 3000);
          } else {
            showCustomAlert("Lỗi xóa tài khoản", "Không thể xóa tài khoản này.", "error");
          }
        } catch (err: any) {
          showCustomAlert("Lỗi mạng", err.message, "error");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden my-12">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border-2 border-amber-600/10">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Xác thực Quản trị tối cao</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Yêu cầu quyền truy cập hệ thống</p>
          </div>
        </div>

        <form onSubmit={handleAuthorize} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Nhập mật mã Super Admin
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Nhập passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold"
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 font-bold">
              * Mật mã mẫu phát triển mặc định là: <span className="text-amber-600">admin123</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer text-center"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-amber-600 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Đăng Nhập
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl uppercase tracking-wider block w-fit">
            Hệ Thống Trung Tâm
          </span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mt-2">
            Quản Trị Hệ Thống Tối Cao
          </h2>
          <p className="text-xs text-slate-500 uppercase mt-1 tracking-wider font-bold">
            Quản lý cấp phép phòng học giáo viên, điều phối tài khoản tập trung
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setAdminCurrentPass(validatedPasscode);
              setAdminNewPass("");
              setShowAdminPassModal(true);
            }}
            className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
            title="Đổi mật mã truy cập hệ thống Quản Trị Hệ Thống Tối Cao"
          >
            <span>🔑</span> Đổi mật mã Admin
          </button>
          
          <button
            onClick={() => {
              setIsAuthorized(false);
              setPasscode("");
              setValidatedPasscode("");
              onBack();
            }}
            className="bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all cursor-pointer"
          >
            Đăng xuất Quyền lực
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left side: Add / Edit form */}
        <div className="lg:col-span-4">
          {editingTeacher ? (
            <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest">
                  CẬP NHẬT GIÁO VIÊN
                </h3>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase"
                >
                  Hủy
                </button>
              </div>

              <form onSubmit={handleUpdateTeacher} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Mã Giáo viên (Không sửa được)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingTeacher.code}
                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-bold uppercase cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Họ và tên Giáo viên mới
                  </label>
                  <input
                    type="text"
                    required
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Nhập họ tên mới..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Mật khẩu bảo vệ mới (Để trống nếu giữ nguyên/không dùng)
                  </label>
                  <input
                    type="password"
                    value={editingPassword}
                    onChange={(e) => setEditingPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-amber-600 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cập Nhật Tài Khoản
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                CẤP PHÒNG DẠY MỚI
              </h3>

              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Họ và tên Giáo viên
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thầy Hoàng Lâm, Cô Mỹ Hạnh..."
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Mã Giáo viên / Mã Lớp học (Duy nhất)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: THAY_LAM, CO_HANH..."
                    value={newTeacherCode}
                    onChange={(e) => setNewTeacherCode(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold uppercase"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    * Mã định danh duy nhất viết liền không dấu. Phân biệt cho học sinh nhập mã luyện tập.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Mật khẩu bảo vệ không gian dạy
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Đặt mật khẩu ngăn học sinh tự ý truy cập..."
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Tạo Giáo Viên Mới
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right side: Teacher list table */}
        <div className="lg:col-span-8 bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
              DANH SÁCH GIÁO VIÊN TRÊN TOÀN HỆ THỐNG ({teachers.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                  <th className="pb-3">Họ Tên</th>
                  <th className="pb-3">Mã Giáo Viên</th>
                  <th className="pb-3">Số Thư Mục Đề</th>
                  <th className="pb-3">Bảo mật</th>
                  <th className="pb-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.code}
                    className="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 font-bold text-slate-900">{teacher.name}</td>
                    <td className="py-3 font-black text-indigo-600 font-mono uppercase">
                      {teacher.code}
                    </td>
                    <td className="py-3 font-bold text-slate-500">
                      {teacher.folders?.length || 0} thư mục
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        teacher.hasPassword 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {teacher.hasPassword ? "🔒 Có bảo vệ" : "🔓 Không mật khẩu"}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingTeacher(teacher);
                          setEditingName(teacher.name);
                          setEditingPassword("");
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 transition-colors inline-flex items-center"
                        title="Sửa thông tin"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      
                      {teacher.code !== "CHUNG" && (
                        <button
                          onClick={() => handleDeleteTeacher(teacher.code, teacher.name)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-700 transition-colors inline-flex items-center"
                          title="Thu hồi tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdminPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-amber-200 shadow-2xl p-6 relative overflow-hidden transform transition-all scale-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200">
                <span className="text-xl">🔑</span>
              </div>
              <div>
                <h3 className="font-sans font-black text-slate-800 text-sm uppercase tracking-wider">
                  Mật Mã Quản Trị Tối Cao
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                  Thiết Lập Bảo Mật Hệ Thống Trung Tâm
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold mb-4">
              Cập nhật mật mã dùng để truy cập không gian Quản Trị Hệ Thống Tối Cao. Mật mã này được lưu trữ đồng bộ trên đám mây Firestore.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                try {
                  const res = await fetch("/api/admin/passcode", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      currentPasscode: adminCurrentPass,
                      newPasscode: adminNewPass
                    })
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    setValidatedPasscode(adminNewPass);
                    setPasscode(adminNewPass);
                    setToastMessage("Cập nhật mật mã Quản trị tối cao thành công! 🔒");
                    setTimeout(() => setToastMessage(null), 3000);
                    setShowAdminPassModal(false);
                  } else {
                    showCustomAlert("Thất bại", data.error || "Không thể cập nhật mật mã.", "error");
                  }
                } catch (err: any) {
                  showCustomAlert("Lỗi kết nối", err.message, "error");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu Admin hiện tại..."
                  value={adminCurrentPass}
                  onChange={(e) => setAdminCurrentPass(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mật khẩu Admin mới..."
                  value={adminNewPass}
                  onChange={(e) => setAdminNewPass(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPassModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cập Nhật 🔒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
