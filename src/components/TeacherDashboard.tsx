import React, { useState } from "react";
import {
  Trophy,
  User,
  Users,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Sparkles,
  Folder as FolderIcon,
  FolderPlus,
  FolderOpen,
  BookMarked,
  Check,
  ClipboardList,
  CheckSquare,
  GraduationCap,
  ChevronRight,
  Settings,
  ArrowLeft
} from "lucide-react";
import { Lesson, StudentProgress, Folder, Teacher, ClassCode } from "../types";

interface TeacherDashboardProps {
  teacherCode: string;
  teacherName: string;
  registeredTeachers: Teacher[];
  lessons: Lesson[];
  scores: StudentProgress[];
  classes: ClassCode[];
  onRefreshLessons: () => Promise<void>;
  onRefreshClasses: () => Promise<void>;
  onRefreshTeachers: () => Promise<void>;
  onRefreshScores: () => Promise<void>;
  showCustomAlert: (title: string, message: string, type?: "success" | "error" | "alert") => void;
  showCustomConfirm: (title: string, message: string, onConfirm: () => void) => void;
  setToastMessage: (msg: string | null) => void;
  onLogout: () => void;
  GAMES_LIST: Array<{ key: string; name: string; desc: string; icon: string; color: string }>;
  generatingGameKey: string | null;
  handleGenerateGame: (gameKey: string) => Promise<void>;
  handleDeleteLesson: (id: string, e: React.MouseEvent) => Promise<void>;
  selectedLesson: Lesson | null;
  setSelectedLesson: (l: Lesson | null) => void;
  handleSelectLessonForAdmin: (id: string) => Promise<void>;
  
  // Custom Prompt state pass downs
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  
  // Editor modal triggers
  setEditorGameKey: (key: string) => void;
  setEditorGameName: (name: string) => void;
  setEditorInitialData: (data: any) => void;
  setIsEditorOpen: (open: boolean) => void;
}

export default function TeacherDashboard({
  teacherCode,
  teacherName,
  registeredTeachers,
  lessons,
  scores,
  classes,
  onRefreshLessons,
  onRefreshClasses,
  onRefreshTeachers,
  onRefreshScores,
  showCustomAlert,
  showCustomConfirm,
  setToastMessage,
  onLogout,
  GAMES_LIST,
  generatingGameKey,
  handleGenerateGame,
  handleDeleteLesson,
  selectedLesson,
  setSelectedLesson,
  handleSelectLessonForAdmin,
  customPrompt,
  setCustomPrompt,
  setEditorGameKey,
  setEditorGameName,
  setEditorInitialData,
  setIsEditorOpen,
}: TeacherDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<"lessons" | "classes" | "scores">("lessons");

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalPasswordInput, setModalPasswordInput] = useState("");

  // Folder states
  const [activeFolderId, setActiveFolderId] = useState<string>("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Create Lesson state
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Lịch sử");
  const [newGrade, setNewGrade] = useState("Lớp 11");
  const [newContent, setNewContent] = useState("");
  const [newLessonFolderId, setNewLessonFolderId] = useState<string>("");
  const [isLessonCreating, setIsLessonCreating] = useState(false);

  // Class Management states
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [isClassCreating, setIsClassCreating] = useState(false);
  const [assigningClass, setAssigningClass] = useState<ClassCode | null>(null);

  // Leaderboard filters
  const [selectedLeaderboardClass, setSelectedLeaderboardClass] = useState<string>("all");

  const currentTeacherObj = registeredTeachers.find((t) => t.code === teacherCode);
  const teacherFolders = currentTeacherObj?.folders || [];

  // Helper folder actions
  const handleUpdateFoldersOnServer = async (updatedFolders: Folder[]) => {
    try {
      const res = await fetch(`/api/teachers/${teacherCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folders: updatedFolders }),
      });
      if (res.ok) {
        await onRefreshTeachers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    const newFolderObj: Folder = {
      id: "folder_" + Date.now().toString(36),
      name: newFolderName.trim()
    };
    
    const updatedFolders = [...teacherFolders, newFolderObj];
    await handleUpdateFoldersOnServer(updatedFolders);
    setNewFolderName("");
    setIsCreatingFolder(false);
    setToastMessage("Đã tạo thư mục mới để lưu đề!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    showCustomConfirm(
      "Xác nhận xóa thư mục",
      `Bạn có chắc chắn muốn xóa thư mục "${folderName}"? Các bài giảng nằm trong thư mục này sẽ tự động chuyển về trạng thái Không phân loại.`,
      async () => {
        const updatedFolders = teacherFolders.filter((f) => f.id !== folderId);
        await handleUpdateFoldersOnServer(updatedFolders);

        // Reset lessons associated with this folder
        const lessonsInFolder = lessons.filter((l) => l.folderId === folderId);
        for (const l of lessonsInFolder) {
          await fetch(`/api/lessons/${l.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...l, folderId: null }),
          });
        }
        
        if (activeFolderId === folderId) {
          setActiveFolderId("all");
        }
        await onRefreshLessons();
        setToastMessage(`Đã xóa thư mục ${folderName}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    );
  };

  // Lesson actions
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsLessonCreating(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          subject: newSubject.trim(),
          grade: newGrade.trim(),
          content: newContent.trim(),
          teacherCode,
          teacherName,
          folderId: newLessonFolderId || null
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setNewLessonFolderId("");
        await onRefreshLessons();
        setToastMessage("Đã lập trình & khai thác bài học AI!");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const data = await res.json();
        showCustomAlert("Lỗi khởi tạo", data.error || "Không thể tạo bài học.", "error");
      }
    } catch (err: any) {
      showCustomAlert("Lỗi mạng", err.message, "error");
    } finally {
      setIsLessonCreating(false);
    }
  };

  // Class actions
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) return;

    const codeUpper = newClassCode.trim().toUpperCase();
    if (codeUpper === "ALL" || codeUpper === "CHUNG") {
      showCustomAlert("Mã lớp trùng lặp", "Mã lớp này trùng với các mã hệ thống dự phòng, vui lòng đặt mã khác!", "error");
      return;
    }

    setIsClassCreating(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          code: codeUpper,
          teacherCode,
          assignedLessonIds: []
        }),
      });

      if (res.ok) {
        setNewClassName("");
        setNewClassCode("");
        await onRefreshClasses();
        setToastMessage("Kích hoạt mã lớp thành công!");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const data = await res.json();
        showCustomAlert("Mã lớp đã tồn tại", data.error || "Vui lòng đặt mã lớp khác.", "error");
      }
    } catch (err: any) {
      showCustomAlert("Lỗi mạng", err.message, "error");
    } finally {
      setIsClassCreating(false);
    }
  };

  const handleDeleteClass = async (code: string, name: string) => {
    showCustomConfirm(
      "Giải tán lớp học",
      `Bạn có chắc chắn muốn xóa lớp học "${name}" (Mã: ${code})? Học sinh sẽ không thể đăng nhập bằng mã lớp này nữa.`,
      async () => {
        try {
          const res = await fetch(`/api/classes/${code}`, {
            method: "DELETE"
          });
          if (res.ok) {
            await onRefreshClasses();
            if (assigningClass?.code === code) {
              setAssigningClass(null);
            }
            setToastMessage(`Đã xóa lớp học ${name}`);
            setTimeout(() => setToastMessage(null), 3000);
          } else {
            showCustomAlert("Lỗi xóa lớp", "Không thể hoàn tất yêu cầu.", "error");
          }
        } catch (err: any) {
          showCustomAlert("Lỗi kết nối", err.message, "error");
        }
      }
    );
  };

  const handleToggleLessonInClass = async (lessonId: string) => {
    if (!assigningClass) return;
    
    let updatedLessonIds = [...assigningClass.assignedLessonIds];
    if (updatedLessonIds.includes(lessonId)) {
      updatedLessonIds = updatedLessonIds.filter(id => id !== lessonId);
    } else {
      updatedLessonIds.push(lessonId);
    }

    try {
      const res = await fetch(`/api/classes/${assigningClass.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedLessonIds: updatedLessonIds })
      });
      if (res.ok) {
        const data = await res.json() as ClassCode;
        setAssigningClass(data);
        await onRefreshClasses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter lessons based on teacher and folder selection
  const filteredLessons = lessons.filter((lesson) => {
    // filter by folder selection
    if (activeFolderId === "all") return true;
    if (activeFolderId === "uncategorized") return !lesson.folderId;
    return lesson.folderId === activeFolderId;
  });

  // Filter scores for leaderboard tab
  const filteredScores = scores.filter((score) => {
    if (selectedLeaderboardClass === "all") return true;
    return score.classCode === selectedLeaderboardClass;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              GIẢNG ĐƯỜNG GIÁO VIÊN
            </h2>
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 font-black text-[10px] px-2.5 py-1 rounded-xl uppercase tracking-wider font-mono">
              Thầy cô: {teacherName} (Mã GV: {teacherCode})
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase mt-1.5 tracking-wider">
            Mã định danh hệ thống của bạn là <span className="text-indigo-600 select-all font-mono font-black">{teacherCode}</span> | Hãy dùng mã này để liên kết lớp học.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setModalPasswordInput("");
              setShowPasswordModal(true);
            }}
            className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5"
            title="Ngăn không cho học sinh tự ý chọn tên bạn để đăng nhập vào trang giáo viên"
          >
            {currentTeacherObj?.hasPassword ? "🔒 ĐỔI MẬT KHẨU" : "🔑 CÀI MẬT KHẨU BẢO VỆ"}
          </button>

          <button
            onClick={onLogout}
            className="bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all"
          >
            Đổi Không Gian Dạy
          </button>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("lessons")}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all flex items-center gap-2 ${
            activeTab === "lessons"
              ? "border-indigo-600 text-indigo-600 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Bài học & Thư mục (Folders)
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all flex items-center gap-2 ${
            activeTab === "classes"
              ? "border-indigo-600 text-indigo-600 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Mã Lớp Học ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab("scores")}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all flex items-center gap-2 ${
            activeTab === "scores"
              ? "border-indigo-600 text-indigo-600 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Bảng Điểm Lớp Học
        </button>
      </div>

      {/* TAB 1: LESSONS & FOLDERS */}
      {activeTab === "lessons" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Folders List & Create Lesson */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Folder Navigation */}
            <div className="bg-white border-2 border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                  THƯ MỤC LƯU ĐỀ
                </span>
                <button
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1"
                >
                  {isCreatingFolder ? "Hủy" : "+ Thư mục"}
                </button>
              </div>

              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="mb-4 bg-slate-50 border-2 border-indigo-100 rounded-xl p-3 space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Tên thư mục (ví dụ: Toán L11, Học kì 1)..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                  />
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-black py-1.5 rounded-lg text-[9px] uppercase tracking-widest shadow hover:bg-indigo-700"
                  >
                    Tạo Thư Mục
                  </button>
                </form>
              )}

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setActiveFolderId("all");
                    setSelectedLesson(null);
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all ${
                    activeFolderId === "all"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" />
                    TẤT CẢ BÀI HỌC
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {lessons.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveFolderId("uncategorized");
                    setSelectedLesson(null);
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all ${
                    activeFolderId === "uncategorized"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderIcon className="w-3.5 h-3.5 text-slate-400" />
                    KHÔNG PHÂN LOẠI
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {lessons.filter(l => !l.folderId).length}
                  </span>
                </button>

                {teacherFolders.map((folder) => {
                  const cnt = lessons.filter((l) => l.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      className={`group/item flex items-center justify-between rounded-xl transition-all ${
                        activeFolderId === folder.id
                          ? "bg-indigo-50 border-2 border-indigo-600 text-indigo-700"
                          : "bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          setSelectedLesson(null);
                        }}
                        className="flex-1 text-left px-3.5 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-2 truncate"
                      >
                        <FolderIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      
                      <div className="flex items-center pr-2 gap-1 shrink-0">
                        <span className="text-[9px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                          {cnt}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id, folder.name);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity"
                          title="Xóa thư mục"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create New Lesson Form */}
            <div className="bg-white border-2 border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">
                TẠO BÀI HỌC MỚI
              </h3>
              <form onSubmit={handleAddLesson} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Tên bài học
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lực hướng tâm & Chuyển động tròn"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Môn học
                    </label>
                    <input
                      type="text"
                      placeholder="Toán, Vật lí, Hóa học..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Lớp / Khối
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Lớp 11A..."
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Lưu vào Thư mục
                  </label>
                  <select
                    value={newLessonFolderId}
                    onChange={(e) => setNewLessonFolderId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="">-- Không phân loại --</option>
                    {teacherFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        Thư mục: {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Nội dung giáo khoa thô (Lý thuyết)
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Dán toàn bộ bài đọc lý thuyết giáo khoa, định nghĩa hoặc dữ liệu học tập vào đây để Gemini đọc biên soạn đề..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold font-sans leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLessonCreating}
                  className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLessonCreating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Lập Trình Bài Học AI
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Lessons List & Active lesson details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Active Lessons display list under selected folder */}
            <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">
                BÀI HỌC TRONG THƯ MỤC ({filteredLessons.length})
              </h3>
              
              {filteredLessons.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-wider">Không có bài học nào trong phân mục này.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Hãy tạo bài giảng mới hoặc đổi thư mục lưu trữ!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
                  {filteredLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => handleSelectLessonForAdmin(lesson.id)}
                      className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                        selectedLesson?.id === lesson.id
                          ? "border-indigo-600 bg-indigo-50/45 text-indigo-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {lesson.subject} • {lesson.grade}
                          </span>
                          <button
                            onClick={(e) => handleDeleteLesson(lesson.id, e)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                            title="Xóa bài học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-black uppercase mt-2.5 leading-snug line-clamp-2">
                          {lesson.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 mt-4 border-t border-slate-100 pt-2.5">
                        Thiết lập AI 10 Game <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Games config for selected lesson */}
            {selectedLesson ? (
              <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
                <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                      ĐANG QUẢN TRỊ AI GAME CHO BÀI
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {selectedLesson.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-sans font-bold uppercase">
                      {selectedLesson.subject} • {selectedLesson.grade} • Tạo lúc {new Date(selectedLesson.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Selected Lesson Core content preview */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                  <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mb-2">
                    NỘI DUNG TƯ LIỆU SÁCH GIÁO KHOA TRÍ TUỆ NHÂN TẠO ĐỌC
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {selectedLesson.content}
                  </p>
                </div>

                {/* Gemini prompt adjustments */}
                <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                      YÊU CẦU BỔ SUNG CHO GEMINI AI (PROMPT TÙY CHỈNH)
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold mb-3 uppercase tracking-wide">
                    Nhập chỉ dẫn riêng để AI thiết kế câu đố đúng mục đích (Ví dụ: "Hãy đặt câu hỏi bằng tiếng Anh", "Tập trung sâu vào công thức vật lý", "Hãy tránh các câu hỏi mang tính suy đoán mơ hồ").
                  </p>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Nhập hướng dẫn biên dịch câu hỏi cho AI tại đây (Ví dụ: Ra đề khó, câu hỏi ngắn, kèm lời giải thích...)..."
                    rows={2}
                    className="w-full bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-slate-800 leading-relaxed"
                  />
                </div>

                {/* Game activations list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest block">
                    KÍCH HOẠT ĐỀ CHO 10 THỂ LOẠI GAME
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GAMES_LIST.map((game) => {
                      const isGenerated = selectedLesson.gamesGenerated && selectedLesson.gamesGenerated[game.key];
                      const isGenLoading = generatingGameKey === game.key;

                      return (
                        <div
                          key={game.key}
                          className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl shrink-0">{game.icon}</span>
                            <div>
                              <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                {game.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                                {game.desc}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-end">
                            {isGenerated ? (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border-2 border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                  <Check className="w-2.5 h-2.5" /> HOẠT ĐỘNG
                                </div>
                                <div className="flex gap-1.5 mt-1 sm:mt-0">
                                  <button
                                    onClick={() => {
                                      setEditorGameKey(game.key);
                                      setEditorGameName(game.name);
                                      setEditorInitialData(selectedLesson.gameData ? selectedLesson.gameData[game.key] : null);
                                      setIsEditorOpen(true);
                                    }}
                                    className="bg-white hover:bg-slate-100 border-2 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl text-slate-700 flex items-center gap-1"
                                    title="Chỉnh sửa câu hỏi thủ công"
                                  >
                                    <Edit3 className="w-3 h-3" /> SỬA ĐỀ
                                  </button>

                                  <button
                                    disabled={generatingGameKey !== null}
                                    onClick={() => handleGenerateGame(game.key)}
                                    className="bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl text-indigo-600 flex items-center gap-1"
                                  >
                                    {isGenLoading ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3 text-indigo-500" /> AI TẠO LẠI
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                disabled={generatingGameKey !== null}
                                onClick={() => handleGenerateGame(game.key)}
                                className="bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-600 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-slate-700 hover:text-indigo-600 transition-all shadow-sm"
                              >
                                {isGenLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                ) : (
                                  "AI BIÊN SOẠN"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                <BookMarked className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <p className="text-sm font-black uppercase text-slate-400 tracking-widest">
                  Chưa có bài học nào được chọn để thiết kế game
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                  Hãy nhấp chọn một bài học ở danh sách bên trên để bắt đầu cấu hình câu hỏi, yêu cầu AI Gemini biên dịch thành 10 game cực đỉnh cho sĩ tử luyện tập!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLASS CODES MANAGEMENT */}
      {activeTab === "classes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Create New Class Code form */}
          <div className="lg:col-span-4 bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
              TẠO LỚP HỌC & MÃ LUYỆN TẬP
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug font-medium">
              Tạo các lớp khác nhau (e.g. 11A1, 11A2, 10A1) để quản lý riêng biệt đề bài và danh sách điểm số thi đấu.
            </p>

            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp 11A1 (Chuyên Toán)..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Mã Lớp Giao Học Sinh (Duy nhất)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: L11A1, TOAN11VY..."
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold uppercase"
                />
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  * Viết liền không dấu. Học sinh sẽ nhập mã này ở màn hình đăng nhập để vào đúng lớp.
                </p>
              </div>

              <button
                type="submit"
                disabled={isClassCreating}
                className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isClassCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Kích Hoạt Lớp Học Mới
              </button>
            </form>
          </div>

          {/* Classes Directory list */}
          <div className="lg:col-span-8 bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest block pb-4 border-b border-slate-100">
              MÃ LỚP ĐANG HOẠT ĐỘNG ({classes.length})
            </h4>

            {classes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-black uppercase tracking-widest">Chưa có mã lớp nào hoạt động</p>
                <p className="text-xs text-slate-500 mt-1">Hãy tạo mã lớp học đầu tiên của bạn ở cột bên trái!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => {
                  const isCurrentlyAssigning = assigningClass?.code === cls.code;
                  return (
                    <div
                      key={cls.code}
                      className="border-2 border-slate-200 rounded-2xl p-4 space-y-4 hover:border-indigo-600 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-black text-slate-900 uppercase">
                              {cls.name}
                            </h5>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono uppercase">
                              MÃ LỚP: {cls.code}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            Sĩ số bài tập đã giao: {cls.assignedLessonIds?.length || 0} bài học
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => {
                              if (isCurrentlyAssigning) {
                                setAssigningClass(null);
                              } else {
                                setAssigningClass(cls);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                              isCurrentlyAssigning
                                ? "bg-indigo-600 text-white shadow-md"
                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                            }`}
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            {isCurrentlyAssigning ? "Đang Giao Đề" : "Giao Bài Tập"}
                          </button>

                          <button
                            onClick={() => handleDeleteClass(cls.code, cls.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-xl transition-colors"
                            title="Xóa lớp học"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Lesson assignment zone */}
                      {isCurrentlyAssigning && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              CHỌN BÀI LUYỆN TẬP GIAO CHO LỚP {cls.code}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-600">
                              Đã chọn: {assigningClass.assignedLessonIds.length} bài
                            </span>
                          </div>

                          {lessons.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Bạn chưa khởi tạo bất kỳ bài học nào để giao.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                              {lessons.map((lesson) => {
                                const isAssigned = assigningClass.assignedLessonIds.includes(lesson.id);
                                return (
                                  <label
                                    key={lesson.id}
                                    onClick={() => handleToggleLessonInClass(lesson.id)}
                                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                                      isAssigned
                                        ? "bg-white border-indigo-600 shadow-sm text-indigo-950 font-semibold"
                                        : "bg-white/50 border-slate-200 text-slate-500 hover:bg-white"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      readOnly
                                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 shrink-0"
                                    />
                                    <div className="text-[11px] leading-tight">
                                      <p className="font-bold line-clamp-1">{lesson.title}</p>
                                      <p className="text-[8px] text-slate-400 uppercase font-mono mt-0.5">{lesson.subject} • {lesson.grade}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-[9px] text-slate-400 leading-normal font-bold">
                            * Học sinh đăng nhập bằng mã lớp này sẽ chỉ được tiếp cận và thi đấu những bài ôn tập đã tích chọn ở trên.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLASS LEADERBOARD */}
      {activeTab === "scores" && (
        <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest block">
                  BẢNG XẾP HẠNG THÀNH TÍCH ĐIỂM SỐ LỚP
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Nhật ký giải đố trực tuyến của tất cả học viên
                </p>
              </div>
            </div>

            {/* Class filter dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                Lọc theo lớp học:
              </label>
              <select
                value={selectedLeaderboardClass}
                onChange={(e) => setSelectedLeaderboardClass(e.target.value)}
                className="bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-slate-950 font-bold font-sans"
              >
                <option value="all">TẤT CẢ CÁC LỚP</option>
                <option value="CHUNG">Lớp học mẫu Hệ thống (CHUNG)</option>
                {classes.map((cls) => (
                  <option key={cls.code} value={cls.code}>
                    Lớp: {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredScores.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-black uppercase tracking-widest">Chưa ghi nhận điểm số thi đua nào</p>
              <p className="text-xs text-slate-500 mt-1">Các học sinh trong lớp chưa tham gia giải đố hoặc bộ lọc không khớp.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                    <th className="pb-3">Học Sinh</th>
                    <th className="pb-3">Lớp học trường</th>
                    <th className="pb-3">Mã lớp ôn tập</th>
                    <th className="pb-3">Bài Học</th>
                    <th className="pb-3">Thể Loại Game</th>
                    <th className="pb-3 text-right">Điểm Số Đạt Được</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((record) => {
                    const game = GAMES_LIST.find((g) => g.key === record.gameKey);
                    const lessonName = lessons.find((l) => l.id === record.lessonId)?.title || "Bài học mẫu";

                    return (
                      <tr key={record.id} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {record.studentName}
                        </td>
                        <td className="py-3 font-black text-slate-500 uppercase tracking-wider">{record.studentClass}</td>
                        <td className="py-3 font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit text-[10px]">{record.classCode}</td>
                        <td className="py-3 text-slate-500 font-medium truncate max-w-[150px]">{lessonName}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-wider">
                            {game ? game.name : record.gameKey}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-indigo-600 font-mono text-sm">
                          {record.score} <span className="text-slate-400 text-xs">/ {record.maxScore}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-amber-200 shadow-2xl p-6 relative overflow-hidden transform transition-all scale-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200">
                <span className="text-xl">🔑</span>
              </div>
              <div>
                <h3 className="font-sans font-black text-slate-800 text-sm uppercase tracking-wider">
                  Mật Khẩu Không Gian Dạy
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                  Trạng thái: {currentTeacherObj?.hasPassword ? "🔒 ĐÃ CÓ MẬT KHẨU" : "🔓 CHƯA CÓ MẬT KHẨU"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold mb-4">
              Đặt mật khẩu bảo mật ngăn không cho học sinh tự ý chọn tên bạn để đăng nhập vào trang giáo viên nhằm sửa giáo án hoặc xem điểm.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newPass = modalPasswordInput.trim();
                fetch(`/api/teachers/${teacherCode}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: newPass })
                })
                .then(res => res.json())
                .then(data => {
                  onRefreshTeachers();
                  setToastMessage(newPass ? "Cài mật khẩu thành công! Không gian dạy của bạn đã được bảo vệ. 🔒" : "Đã gỡ mật khẩu thành công! 🔓");
                  setTimeout(() => setToastMessage(null), 3000);
                  setShowPasswordModal(false);
                })
                .catch(err => {
                  showCustomAlert("Lỗi cài đặt", "Không thể cập nhật mật khẩu: " + err.message, "error");
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Mật khẩu bảo vệ mới
                </label>
                <input
                  type="text"
                  placeholder="Để trống nếu muốn gỡ bỏ mật khẩu..."
                  value={modalPasswordInput}
                  onChange={(e) => setModalPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold"
                  autoFocus
                />
                <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed font-bold">
                  * Sau khi thiết lập, lần tiếp theo đăng nhập phòng dạy này sẽ yêu cầu mật khẩu bảo vệ này.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  Đóng / Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all"
                >
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
