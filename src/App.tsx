/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  BookOpen,
  Users,
  Award,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Check,
  Lock,
  Unlock,
  User,
  Calendar,
  ChevronRight,
  GraduationCap,
  Trophy,
  ArrowLeft,
  BookMarked,
  Edit3,
  Folder,
  FolderPlus,
  FolderOpen,
  Settings,
  ClipboardList,
  CheckSquare
} from "lucide-react";

import { Lesson, StudentProgress, Teacher, ClassCode, Folder as TFolder } from "./types";
import GameDataEditor from "./components/GameDataEditor";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import TeacherDashboard from "./components/TeacherDashboard";

// Game Components imports
import GoldenBell from "./components/games/GoldenBell";
import Millionaire from "./components/games/Millionaire";
import Olympia from "./components/games/Olympia";
import WheelOfFortune from "./components/games/WheelOfFortune";
import PictogramGame from "./components/games/PictogramGame";
import KahootGame from "./components/games/KahootGame";
import QuizizzGame from "./components/games/QuizizzGame";
import EscapeRoom from "./components/games/EscapeRoom";
import SecretCode from "./components/games/SecretCode";
import TreasureHunt from "./components/games/TreasureHunt";

const GAMES_LIST = [
  { key: "goldenBell", name: "Rung Chuông Vàng", desc: "Trả lời câu hỏi trắc nghiệm loại trực tiếp", icon: "🔔", color: "from-amber-500 to-yellow-600" },
  { key: "millionaire", name: "Ai Là Triệu Phú", desc: "Độ khó tăng dần cùng 3 sự trợ giúp độc đáo", icon: "💎", color: "from-blue-500 to-indigo-600" },
  { key: "olympia", name: "Đường Lên Đỉnh Olympia", desc: "Trải nghiệm 4 vòng đấu trí tuệ đỉnh cao", icon: "🏔️", color: "from-orange-500 to-red-600" },
  { key: "wheelOfFortune", name: "Chiếc Nón Kỳ Diệu", desc: "Đoán chữ cái ẩn giấu theo chủ đề bài học", icon: "🎡", color: "from-pink-500 to-rose-600" },
  { key: "pictogram", name: "Đuổi Hình Bắt Chữ", desc: "Ghi nhớ khái niệm qua hình ảnh liên tưởng", icon: "🎨", color: "from-purple-500 to-violet-600" },
  { key: "kahoot", name: "Kahoot Quiz", desc: "Trắc nghiệm tốc độ tính giờ hồi hộp", icon: "⚡", color: "from-cyan-500 to-blue-600" },
  { key: "quizizz", name: "Quizizz Challenge", desc: "Tự luyện tập cá nhân với meme vui nhộn", icon: "👾", color: "from-emerald-500 to-teal-600" },
  { key: "escapeRoom", name: "Escape Room Giáo dục", desc: "Giải mã 5 chốt cửa kịch tính để thoát hiểm", icon: "🚪", color: "from-red-500 to-orange-600" },
  { key: "secretCode", name: "Mật Mã Bí Ẩn", desc: "Đoán từ vựng cốt lõi kiểu Wordle thông minh", icon: "🕵️", color: "from-teal-500 to-emerald-600" },
  { key: "treasureHunt", name: "Truy Tìm Kho Báu", desc: "Hành trình 5 trạm thám hiểm hoang đảo tri thức", icon: "🏴‍☠️", color: "from-yellow-500 to-amber-600" },
];

export default function App() {
  const [role, setRole] = useState<"welcome" | "superadmin" | "admin" | "student">("welcome");

  // Super Admin states
  const [superAdminPasscodeInput, setSuperAdminPasscodeInput] = useState("");
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(false);
  const [superAdminNewTeacherCode, setSuperAdminNewTeacherCode] = useState("");
  const [superAdminNewTeacherName, setSuperAdminNewTeacherName] = useState("");
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);

  // Teacher folders states
  const [activeFolderId, setActiveFolderId] = useState<string>("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // Class Codes (Classes) states
  const [classes, setClasses] = useState<ClassCode[]>([]);
  const [teacherActiveTab, setTeacherActiveTab] = useState<"lessons" | "classes" | "scores">("lessons");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [editingClass, setEditingClass] = useState<ClassCode | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedClassLessons, setSelectedClassLessons] = useState<string[]>([]);

  // Student new states
  const [studentClassCode, setStudentClassCode] = useState<string>(() => localStorage.getItem("edu_student_class_code") || "");
  const [studentActiveClass, setStudentActiveClass] = useState<ClassCode | null>(null);

  // Lesson Edit states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonSubject, setEditLessonSubject] = useState("");
  const [editLessonGrade, setEditLessonGrade] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");

  // Teacher identification state
  const [teacherCode, setTeacherCode] = useState<string>(() => localStorage.getItem("edu_teacher_code") || "");
  const [teacherName, setTeacherName] = useState<string>(() => localStorage.getItem("edu_teacher_name") || "");
  const [registeredTeachers, setRegisteredTeachers] = useState<Teacher[]>([]);
  const [adminMode, setAdminMode] = useState<"login" | "register">("login");
  const [selectedLoginTeacherCode, setSelectedLoginTeacherCode] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");

  // Admin states
  const [lessons, setLessons] = useState<any[]>([]);
  const [scores, setScores] = useState<StudentProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Lịch sử");
  const [newGrade, setNewGrade] = useState("Lớp 5");
  const [newContent, setNewContent] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [generatingGameKey, setGeneratingGameKey] = useState<string | null>(null);

  // Custom prompt & Editor states
  const [customPrompt, setCustomPrompt] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorGameKey, setEditorGameKey] = useState("");
  const [editorGameName, setEditorGameName] = useState("");
  const [editorInitialData, setEditorInitialData] = useState<any>(null);

  // Student states
  const [studentName, setStudentName] = useState<string>(() => localStorage.getItem("edu_student_name") || "");
  const [studentClass, setStudentClass] = useState<string>(() => localStorage.getItem("edu_student_class") || "");
  const [studentTeacherCode, setStudentTeacherCode] = useState<string>(() => localStorage.getItem("edu_student_teacher_code") || "CHUNG");
  const [selectedStudentLessonId, setSelectedStudentLessonId] = useState<string | null>(null);
  const [studentLessonDetail, setStudentLessonDetail] = useState<any | null>(null);
  const [activeGameKey, setActiveGameKey] = useState<string | null>(null);
  const [studentFinishedScore, setStudentFinishedScore] = useState<{ score: number; maxScore: number } | null>(null);

  // Custom dialogs & notification states
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    type: "confirm" | "alert" | "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
      type: "confirm",
    });
  };

  const showCustomAlert = (title: string, message: string, type: "success" | "error" | "alert" = "alert") => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage("Đã sao chép mã lớp: " + text);
      setTimeout(() => setToastMessage(null), 3000);
    }).catch(err => {
      showCustomAlert("Lỗi sao chép", "Không thể sao chép tự động: " + text, "error");
    });
  };

  // Load baseline metadata automatically when role or codes change
  useEffect(() => {
    fetchLessons();
    fetchScores();
    fetchTeachers();
    if (role === "admin" && teacherCode) {
      fetchClasses();
    }
  }, [role, teacherCode, studentTeacherCode]);

  useEffect(() => {
    const savedName = localStorage.getItem("edu_student_name");
    const savedClass = localStorage.getItem("edu_student_class");
    const savedClassCode = localStorage.getItem("edu_student_class_code");
    
    if (role === "student" && savedName && savedClass && savedClassCode) {
      const restoreStudentClass = async () => {
        try {
          if (savedClassCode === "CHUNG") {
            setStudentActiveClass({
              code: "CHUNG",
              name: "Lớp học mẫu Hệ thống",
              teacherCode: "CHUNG",
              assignedLessonIds: [],
              createdAt: ""
            });
            return;
          }
          const res = await fetch(`/api/classes?code=${encodeURIComponent(savedClassCode)}`);
          if (res.ok) {
            const matched = await res.json();
            setStudentActiveClass(matched);
            
            const lRes = await fetch(`/api/lessons?teacherCode=${encodeURIComponent(matched.teacherCode)}`);
            if (lRes.ok) {
              const lData = await lRes.json();
              setLessons(lData.filter((l: any) => matched.assignedLessonIds.includes(l.id)));
            }
          }
        } catch (e) {
          console.error("Auto restore student class failed:", e);
        }
      };
      restoreStudentClass();
    }
  }, [role]);

  const fetchClasses = async () => {
    if (!teacherCode) return;
    try {
      const res = await fetch(`/api/classes?teacherCode=${encodeURIComponent(teacherCode)}`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục lớp học:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      if (res.ok) {
        const data = await res.json();
        setRegisteredTeachers(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách giáo viên:", err);
    }
  };

  const fetchLessons = async () => {
    try {
      const activeCode = role === "admin" ? teacherCode : studentTeacherCode;
      const url = activeCode ? `/api/lessons?teacherCode=${encodeURIComponent(activeCode)}` : "/api/lessons";
      const res = await fetch(url);
      const data = await res.json();
      setLessons(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScores = async () => {
    try {
      const activeCode = role === "admin" ? teacherCode : studentTeacherCode;
      const url = activeCode ? `/api/scores?teacherCode=${encodeURIComponent(activeCode)}` : "/api/scores";
      const res = await fetch(url);
      const data = await res.json();
      setScores(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    setIsAdminLoading(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject,
          grade: newGrade,
          content: newContent,
          teacherCode,
          teacherName,
        })
      });
      const data = await res.json();
      setLessons((prev) => [data, ...prev]);
      setNewTitle("");
      setNewContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showCustomConfirm(
      "Xác nhận xóa bài học",
      "Bạn có chắc chắn muốn xóa bài học này không? Tất cả các game thử thách đi kèm của học sinh cũng sẽ bị gỡ bỏ.",
      async () => {
        try {
          await fetch(`/api/lessons/${id}`, { method: "DELETE" });
          setLessons((prev) => prev.filter((l) => l.id !== id));
          if (selectedLesson?.id === id) {
            setSelectedLesson(null);
          }
          setToastMessage("Đã xóa bài học thành công!");
          setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleSelectLessonForAdmin = async (id: string) => {
    setIsAdminLoading(true);
    try {
      const res = await fetch(`/api/lessons/${id}`);
      const data = await res.json();
      setSelectedLesson(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleGenerateGame = async (gameKey: string) => {
    if (!selectedLesson) return;
    setGeneratingGameKey(gameKey);

    try {
      const res = await fetch(`/api/lessons/${selectedLesson.id}/generate/${gameKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedLesson(data);
        // Refresh list to show checkbox generated status
        fetchLessons();
      } else {
        throw new Error(data.error || "Lỗi tạo lập đề");
      }
    } catch (e: any) {
      showCustomAlert("Lỗi Gemini AI", "Đã xảy ra lỗi khi tạo bộ câu hỏi qua Gemini: " + String(e.message || e), "error");
    } finally {
      setGeneratingGameKey(null);
    }
  };

  const handleSaveGameData = async (updatedData: any) => {
    if (!selectedLesson || !editorGameKey) return;
    try {
      const res = await fetch(`/api/lessons/${selectedLesson.id}/game/${editorGameKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameData: updatedData })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedLesson(data);
        fetchLessons();
      } else {
        throw new Error(data.error || "Lỗi cập nhật dữ liệu");
      }
    } catch (err: any) {
      showCustomAlert("Lỗi lưu trữ", "Không thể lưu dữ liệu câu hỏi: " + err.message, "error");
      throw err;
    }
  };

  const handleCompleteGame = async (score: number, maxScore: number) => {
    if (!selectedStudentLessonId || !activeGameKey) return;

    const payload = {
      studentName,
      studentClass,
      classCode: studentClassCode || "CHUNG",
      lessonId: selectedStudentLessonId,
      gameKey: activeGameKey,
      score,
      maxScore,
      teacherCode: studentTeacherCode,
    };

    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setStudentFinishedScore({ score, maxScore });
      fetchScores();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFolders = async (updatedFolders: TFolder[]) => {
    try {
      const res = await fetch(`/api/teachers/${teacherCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folders: updatedFolders })
      });
      if (res.ok) {
        fetchTeachers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!folderName.trim()) return;
    const currentTeacherObj = registeredTeachers.find(t => t.code === teacherCode);
    const teacherFolders = currentTeacherObj?.folders || [];
    
    const newFolderObj = {
      id: "folder_" + Date.now().toString(36),
      name: folderName.trim()
    };
    const updatedFolders = [...teacherFolders, newFolderObj];
    await handleUpdateFolders(updatedFolders);
    setToastMessage("Đã tạo thư mục mới!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteFolder = async (folderId: string) => {
    const currentTeacherObj = registeredTeachers.find(t => t.code === teacherCode);
    const teacherFolders = currentTeacherObj?.folders || [];
    const updatedFolders = teacherFolders.filter(f => f.id !== folderId);
    
    // update lessons in that folder
    const lessonsInFolder = lessons.filter(l => l.folderId === folderId);
    for (const l of lessonsInFolder) {
      await fetch(`/api/lessons/${l.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: null })
      });
    }
    
    await handleUpdateFolders(updatedFolders);
    setToastMessage("Đã xóa thư mục!");
    setTimeout(() => setToastMessage(null), 3000);
    if (activeFolderId === folderId) {
      setActiveFolderId("all");
    }
    fetchLessons();
  };

  useEffect(() => {
    if (!selectedStudentLessonId) {
      setStudentLessonDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/lessons/${selectedStudentLessonId}`);
        if (res.ok) {
          const data = await res.json();
          setStudentLessonDetail(data);
        }
      } catch (e) {
        console.error("Error fetching student lesson detail:", e);
      }
    };
    fetchDetail();
  }, [selectedStudentLessonId]);

  const selectedLessonDetailForStudent = studentLessonDetail || lessons.find((l) => l.id === selectedStudentLessonId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top beautiful standard header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              setRole("welcome");
              setSelectedLesson(null);
              setSelectedStudentLessonId(null);
              setActiveGameKey(null);
              setStudentFinishedScore(null);
            }}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none">
                Gamified Class
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Học vui vẻ, nhớ bền lâu</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {role === "welcome" && (
              <button
                onClick={() => setRole("superadmin")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-150 cursor-pointer mr-1"
              >
                <GraduationCap className="w-4.5 h-4.5 text-white" />
                <span>Quản trị hệ thống</span>
              </button>
            )}
            {role !== "welcome" && (
              <button
                onClick={() => {
                  setRole("welcome");
                  setSelectedLesson(null);
                  setSelectedStudentLessonId(null);
                  setActiveGameKey(null);
                  setStudentFinishedScore(null);
                }}
                className="text-xs font-bold uppercase tracking-widest text-indigo-600 border-2 border-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-50 transition-colors"
              >
                Về Sảnh Chính
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 max-w-7xl mx-auto w-full px-6 transition-all ${role === "welcome" ? "py-4" : "py-10"}`}>
        <AnimatePresence mode="wait">
          {/* WELCOME PORTAL SELECTION */}
          {role === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-4 md:pt-12"
            >
              <div className="md:col-span-7 space-y-4 text-center md:text-left md:pr-4">
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-full border-2 border-indigo-600/10 text-[10px] font-black uppercase tracking-widest font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Nền tảng ôn tập số hóa 4.0
                </div>

                <h2 className="text-3xl lg:text-4.5xl font-black text-slate-900 leading-[1.05] tracking-tighter uppercase">
                  ÔN TẬP KIẾN THỨC <br />
                  <span className="text-indigo-600">Trò Chơi Thử Thách</span>
                </h2>

                <p className="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed max-w-md mx-auto md:mx-0">
                  Chỉ cần chọn bài học, chọn loại game mà chương trình tích sẵn, mỗi Game sẽ kích thích trí tuệ khác nhau, giúp bạn ôn bài hiệu quả.
                </p>

                {/* Stat row */}
                <div className="flex justify-center md:justify-start gap-8 pt-6 border-t border-slate-100">
                  <div>
                    <span className="block text-2xl font-black text-indigo-600">10</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Trò chơi đa dạng</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-emerald-500">100%</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Tự động hóa AI</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-amber-500">REAL-TIME</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Bảng xếp hạng lớp</span>
                  </div>
                </div>
              </div>

              {/* Action columns Cards */}
              <div className="md:col-span-5 grid grid-cols-1 gap-3.5 w-full">
                {/* Student Card */}
                <button
                  onClick={() => setRole("student")}
                  className="bg-white border-2 border-slate-200 hover:border-indigo-600 rounded-2xl p-4 md:p-5 text-left hover:shadow-lg transition-all duration-300 group shadow-sm flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border-2 border-indigo-600/10 shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black uppercase text-slate-900 leading-none">CỔNG HỌC SINH</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-snug">
                      Đăng ký danh tính, chọn bài giảng được kích hoạt bởi giáo viên và thỏa thích chinh phục các đỉnh cao thử thách!
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-3 font-sans border-t border-slate-100 pt-2.5 w-full">
                    Bắt đầu chơi ngay <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Teacher / Admin Card */}
                <button
                  onClick={() => setRole("admin")}
                  className="bg-white border-2 border-slate-200 hover:border-indigo-600 rounded-2xl p-4 md:p-5 text-left hover:shadow-lg transition-all duration-300 group shadow-sm flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border-2 border-indigo-600/10 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black uppercase text-slate-900 leading-none">CỔNG GIÁO VIÊN</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-snug">
                      Đăng tải tư liệu giáo khoa thô, quản trị danh mục bài học, ra lệnh cho AI sinh đề trắc nghiệm và giám sát bảng xếp hạng lớp.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-3 font-sans border-t border-slate-100 pt-2.5 w-full">
                    Quản trị lớp học <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* SUPER ADMIN PORTAL PANEL */}
          {role === "superadmin" && (
            <motion.div
              key="superadmin-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SuperAdminDashboard
                teachers={registeredTeachers}
                onRefresh={fetchTeachers}
                onBack={() => setRole("welcome")}
                showCustomAlert={showCustomAlert}
                showCustomConfirm={showCustomConfirm}
                setToastMessage={setToastMessage}
              />
            </motion.div>
          )}

          {/* ADMIN PORTAL PANEL */}
          {role === "admin" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {!teacherCode || !teacherName ? (
                <div className="max-w-md mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden my-10">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border-2 border-indigo-600/10">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-sans">KHÔNG GIAN GIÁO VIÊN TẬP TRUNG</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hệ thống quản lý giảng dạy & thử thách đồng bộ</p>
                    </div>
                  </div>

                  <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const codeInput = (e.currentTarget.elements.namedItem("loginTeacherCode") as HTMLSelectElement).value;
                        const found = registeredTeachers.find(t => t.code === codeInput);
                        if (!found) {
                          showCustomAlert("Lỗi truy cập", "Vui lòng chọn một phòng dạy hợp lệ từ danh sách hệ thống.", "error");
                          return;
                        }

                        try {
                          const verifyRes = await fetch("/api/teachers/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ code: codeInput, password: loginPassword })
                          });
                          const verifyData = await verifyRes.json();
                          if (verifyRes.ok) {
                            localStorage.setItem("edu_teacher_code", found.code);
                            localStorage.setItem("edu_teacher_name", found.name);
                            setTeacherCode(found.code);
                            setTeacherName(found.name);
                            setToastMessage(`Đã vào không gian dạy: ${found.name}`);
                            setTimeout(() => setToastMessage(null), 3000);
                            setLoginPassword("");
                          } else {
                            showCustomAlert("Lỗi bảo mật", verifyData.error || "Mật khẩu truy cập không chính xác!", "error");
                          }
                        } catch (err: any) {
                          showCustomAlert("Lỗi kết nối", "Không thể xác thực không gian dạy: " + err.message, "error");
                        }
                      }}
                      className="space-y-5"
                    >
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                          Chọn Phòng dạy / Giáo viên đã đăng ký
                        </label>
                        {registeredTeachers.length === 0 ? (
                          <div className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            Đang tải danh sách phòng dạy tập trung...
                          </div>
                        ) : (
                          <select
                            name="loginTeacherCode"
                            required
                            value={selectedLoginTeacherCode}
                            onChange={(e) => {
                              setSelectedLoginTeacherCode(e.target.value);
                              setLoginPassword("");
                            }}
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                          >
                            <option value="">-- Chọn không gian dạy của bạn --</option>
                            {registeredTeachers.map((t) => (
                              <option key={t.code} value={t.code}>
                                {t.name} {t.hasPassword ? "🔒" : "🔓"}
                              </option>
                            ))}
                          </select>
                        )}
                        <p className="text-[9px] text-slate-400 mt-2 leading-relaxed font-semibold">
                          * Chỉ cần chọn tên bạn trong danh sách để truy cập ngay vào trang quản trị bài giảng và bảng xếp hạng lớp.
                        </p>
                      </div>

                      {registeredTeachers.find(t => t.code === selectedLoginTeacherCode)?.hasPassword && (
                        <div className="animate-fade-in">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Mật khẩu bảo vệ không gian dạy
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Nhập mật khẩu không gian dạy..."
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold font-sans"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        Vào Không Gian Dạy
                      </button>
                    </form>
                  </div>
              ) : (
                <TeacherDashboard
                  teacherCode={teacherCode}
                  teacherName={teacherName}
                  registeredTeachers={registeredTeachers}
                  lessons={lessons}
                  scores={scores}
                  classes={classes}
                  onRefreshLessons={fetchLessons}
                  onRefreshClasses={fetchClasses}
                  onRefreshTeachers={fetchTeachers}
                  onRefreshScores={fetchScores}
                  showCustomAlert={showCustomAlert}
                  showCustomConfirm={showCustomConfirm}
                  setToastMessage={setToastMessage}
                  onLogout={() => {
                    showCustomConfirm(
                      "Đổi giáo viên khác",
                      "Bạn có chắc chắn muốn thoát khỏi không gian dạy này và chuyển sang giáo viên khác?",
                      () => {
                        localStorage.removeItem("edu_teacher_code");
                        localStorage.removeItem("edu_teacher_name");
                        setTeacherCode("");
                        setTeacherName("");
                      }
                    );
                  }}
                  GAMES_LIST={GAMES_LIST}
                  generatingGameKey={generatingGameKey}
                  handleGenerateGame={handleGenerateGame}
                  handleDeleteLesson={handleDeleteLesson}
                  selectedLesson={selectedLesson}
                  setSelectedLesson={setSelectedLesson}
                  handleSelectLessonForAdmin={handleSelectLessonForAdmin}
                  customPrompt={customPrompt}
                  setCustomPrompt={setCustomPrompt}
                  setEditorGameKey={setEditorGameKey}
                  setEditorGameName={setEditorGameName}
                  setEditorInitialData={setEditorInitialData}
                  setIsEditorOpen={setIsEditorOpen}
                />
              )}

            </motion.div>
          )}

          {/* STUDENT PORTAL PANEL */}
          {role === "student" && (
            <motion.div
              key="student-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {(!studentName || !studentClass || !studentClassCode) && (
                <div className="max-w-md mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border-2 border-indigo-600/10">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">ĐĂNG KÝ THI ĐẤU</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vui lòng điền thông tin để ghi nhận điểm</p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const nameInput = (e.currentTarget.elements.namedItem("studentNameInput") as HTMLInputElement).value.trim();
                      const classInput = (e.currentTarget.elements.namedItem("studentClassInput") as HTMLInputElement).value.trim();
                      const codeInput = (e.currentTarget.elements.namedItem("studentClassCodeInput") as HTMLInputElement).value.trim().toUpperCase();
                      
                      if (!nameInput || !classInput || !codeInput) return;

                      try {
                        if (codeInput === "CHUNG") {
                          localStorage.setItem("edu_student_name", nameInput);
                          localStorage.setItem("edu_student_class", classInput);
                          localStorage.setItem("edu_student_class_code", "CHUNG");
                          setStudentName(nameInput);
                          setStudentClass(classInput);
                          setStudentClassCode("CHUNG");
                          setStudentTeacherCode("CHUNG");
                          setStudentActiveClass({
                            code: "CHUNG",
                            name: "Lớp học mẫu Hệ thống",
                            teacherCode: "CHUNG",
                            assignedLessonIds: [],
                            createdAt: ""
                          });
                          
                          // Load all public lessons
                          const lRes = await fetch("/api/lessons?teacherCode=CHUNG");
                          if (lRes.ok) {
                            const lData = await lRes.json();
                            setLessons(lData);
                          }
                          return;
                        }

                        // Verify Class Code
                        const res = await fetch(`/api/classes?code=${encodeURIComponent(codeInput)}`);
                        if (!res.ok) {
                          showCustomAlert("Mã lớp không tồn tại", "Mã lớp này không hợp lệ hoặc đã bị giải tán. Vui lòng liên hệ Giáo viên của bạn!", "error");
                          return;
                        }

                        const matchedClass = await res.json() as ClassCode;
                        
                        localStorage.setItem("edu_student_name", nameInput);
                        localStorage.setItem("edu_student_class", classInput);
                        localStorage.setItem("edu_student_class_code", codeInput);
                        
                        setStudentName(nameInput);
                        setStudentClass(classInput);
                        setStudentClassCode(codeInput);
                        setStudentTeacherCode(matchedClass.teacherCode);
                        setStudentActiveClass(matchedClass);

                        // Load only assigned lessons
                        const lRes = await fetch(`/api/lessons?teacherCode=${encodeURIComponent(matchedClass.teacherCode)}`);
                        if (lRes.ok) {
                          const lData = await lRes.json();
                          setLessons(lData.filter((l: any) => matchedClass.assignedLessonIds.includes(l.id)));
                        }

                        setToastMessage("Vào lớp luyện tập thành công!");
                        setTimeout(() => setToastMessage(null), 3000);
                      } catch (err: any) {
                        showCustomAlert("Lỗi kết nối", "Không thể liên kết tới lớp học này: " + err.message, "error");
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Họ và tên thí sinh
                      </label>
                      <input
                        type="text"
                        name="studentNameInput"
                        required
                        defaultValue={studentName}
                        placeholder="Nhập đầy đủ họ tên..."
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Lớp của bạn (Tên lớp học trường)
                      </label>
                      <input
                        type="text"
                        name="studentClassInput"
                        required
                        defaultValue={studentClass}
                        placeholder="Ví dụ: Lớp 11A1, Lớp 12A2..."
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Nhập Mã Lớp luyện tập được giao
                      </label>
                      <input
                        type="text"
                        name="studentClassCodeInput"
                        required
                        defaultValue={studentClassCode}
                        placeholder="Nhập mã lớp từ Giáo viên (Ví dụ: L11A1) hoặc 'CHUNG'"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold uppercase"
                      />
                      <p className="text-[9px] text-slate-400 mt-1.5 leading-normal font-bold">
                        * Điền Mã Lớp được Giáo viên cung cấp để truy cập đúng danh sách bài luyện tập tương ứng của bạn.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      Bắt Đầu Phiêu Lưu
                    </button>
                  </form>
                </div>
              )}

              {/* STAGE 2: Choose active lesson */}
              {studentName && studentClass && !selectedStudentLessonId && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
                    <div className="text-center md:text-left">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                        SĨ TỬ ĐĂNG NHẬP: <span className="font-bold text-slate-700">{studentName} ({studentClass})</span> | MÃ LỚP LUYỆN TẬP: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{studentClassCode}</span>
                      </span>
                      <h2 className="text-4xl font-black text-slate-900 mt-1 uppercase tracking-tighter">HÃY CHỌN BÀI HỌC CẦN ÔN TẬP</h2>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("edu_student_name");
                        localStorage.removeItem("edu_student_class");
                        localStorage.removeItem("edu_student_class_code");
                        setStudentName("");
                        setStudentClass("");
                        setStudentClassCode("");
                        setStudentTeacherCode("CHUNG");
                        setStudentActiveClass(null);
                        setLessons([]);
                      }}
                      className="bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all"
                    >
                      Đăng xuất / Đổi mã lớp
                    </button>
                  </div>

                  {lessons.length === 0 ? (
                    <div className="bg-white border-2 border-slate-200 p-8 rounded-2xl text-center text-slate-500 shadow-sm">
                      <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Hiện tại chưa có bài học nào được khởi tạo cho lớp {studentTeacherCode}</p>
                      <p className="text-xs text-slate-500 mt-1">Vui lòng liên hệ thầy cô để kích hoạt bài học của lớp bạn!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          onClick={() => setSelectedStudentLessonId(lesson.id)}
                          className="bg-white border-2 border-slate-200 hover:border-indigo-600 p-6 rounded-3xl text-left cursor-pointer hover:shadow-xl transition-all duration-300 group shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded text-indigo-600">
                              {lesson.subject} • {lesson.grade}
                            </span>
                            <h4 className="text-lg font-black uppercase tracking-tight font-sans mt-4 line-clamp-2 text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                              {lesson.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-3 line-clamp-3 leading-relaxed">
                              {lesson.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-6 border-t border-slate-100 pt-4 w-full">
                            Chọn ôn tập bài học <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 3: Pick generated game from lesson */}
              {studentName && studentClass && selectedStudentLessonId && !activeGameKey && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <button
                        onClick={() => setSelectedStudentLessonId(null)}
                        className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 mb-1.5 block transition-colors"
                      >
                        ← Thay đổi bài giảng
                      </button>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">CHỌN TRÒ CHƠI CHO BÀI HỌC</h2>
                      <p className="text-sm text-indigo-600 font-bold mt-1 uppercase tracking-tight">
                        "{selectedLessonDetailForStudent?.title}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GAMES_LIST.map((game, index) => {
                      const isGenerated = selectedLessonDetailForStudent?.gamesGenerated && selectedLessonDetailForStudent.gamesGenerated[game.key];
                      const numStr = String(index + 1).padStart(2, '0');

                      // Design mappings based on index or game key
                      let cardStyle = "";
                      let textStyle = "";
                      let tagBg = "";
                      let tagText = "";

                      if (isGenerated) {
                        // Amber
                        if (game.key === "goldenBell") {
                          cardStyle = "bg-amber-400 hover:shadow-xl hover:shadow-amber-400/20";
                          textStyle = "text-slate-900";
                          tagBg = "bg-slate-900";
                          tagText = "text-white";
                        } else if (game.key === "millionaire") {
                          // Indigo/Blue
                          cardStyle = "bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20";
                          textStyle = "text-white";
                          tagBg = "bg-white";
                          tagText = "text-blue-600";
                        } else if (game.key === "olympia") {
                          // Red/Orange
                          cardStyle = "bg-orange-500 hover:shadow-xl hover:shadow-orange-500/20";
                          textStyle = "text-white";
                          tagBg = "bg-slate-900";
                          tagText = "text-white";
                        } else if (game.key === "wheelOfFortune") {
                          // Pink/Rose
                          cardStyle = "bg-pink-500 hover:shadow-xl hover:shadow-pink-500/20";
                          textStyle = "text-white";
                          tagBg = "bg-white";
                          tagText = "text-pink-500";
                        } else if (game.key === "pictogram") {
                          // Violet/Purple
                          cardStyle = "bg-purple-600 hover:shadow-xl hover:shadow-purple-600/20";
                          textStyle = "text-white";
                          tagBg = "bg-white";
                          tagText = "text-purple-600";
                        } else if (game.key === "kahoot") {
                          // Cyan/Teal
                          cardStyle = "bg-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20";
                          textStyle = "text-slate-950";
                          tagBg = "bg-slate-900";
                          tagText = "text-white";
                        } else if (game.key === "quizizz") {
                          // Emerald
                          cardStyle = "bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20";
                          textStyle = "text-white";
                          tagBg = "bg-white";
                          tagText = "text-emerald-500";
                        } else if (game.key === "escapeRoom") {
                          // Rose
                          cardStyle = "bg-rose-500 hover:shadow-xl hover:shadow-rose-500/20";
                          textStyle = "text-white";
                          tagBg = "bg-white";
                          tagText = "text-rose-500";
                        } else if (game.key === "secretCode") {
                          // Teal
                          cardStyle = "bg-teal-500 hover:shadow-xl hover:shadow-teal-500/20";
                          textStyle = "text-slate-950";
                          tagBg = "bg-slate-900";
                          tagText = "text-white";
                        } else {
                          // Slate
                          cardStyle = "bg-slate-900 hover:shadow-xl hover:shadow-slate-900/20";
                          textStyle = "text-white";
                          tagBg = "bg-indigo-500";
                          tagText = "text-white";
                        }
                      } else {
                        // Locked style
                        cardStyle = "bg-white border-2 border-slate-200 opacity-50 cursor-not-allowed select-none";
                        textStyle = "text-slate-400";
                        tagBg = "bg-slate-100";
                        tagText = "text-slate-400";
                      }

                      return (
                        <div
                          key={game.key}
                          onClick={() => {
                            if (isGenerated) {
                              setActiveGameKey(game.key);
                            }
                          }}
                          className={`group relative rounded-3xl p-6 h-48 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                            isGenerated ? "cursor-pointer scale-100 hover:-translate-y-1" : ""
                          } ${cardStyle}`}
                        >
                          {/* Giant backdrop number */}
                          <span className={`absolute -right-4 -top-4 text-9xl font-black select-none pointer-events-none transition-transform group-hover:scale-110 duration-500 ${
                            isGenerated ? "text-white/20" : "text-slate-100"
                          }`}>
                            {numStr}
                          </span>

                          {/* Icons and badges */}
                          <div className="flex justify-between items-start z-10">
                            <span className="text-3.5xl filter drop-shadow-sm">{game.icon}</span>
                            {isGenerated ? (
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${tagBg} ${tagText}`}>
                                KÍCH HOẠT
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 flex items-center gap-1 border border-slate-200">
                                <Lock className="w-2.5 h-2.5" /> CHƯA MỞ
                              </span>
                            )}
                          </div>

                          {/* Name and desc */}
                          <div className="z-10 mt-4">
                            <h4 className={`text-xl font-black uppercase leading-none ${textStyle} tracking-tight`}>
                              {game.name}
                            </h4>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1.5 opacity-80 ${textStyle} line-clamp-1`}>
                              {game.desc}
                            </p>
                          </div>

                          {/* Bottom action bar */}
                          {isGenerated && (
                            <div className="flex items-center gap-1.5 mt-auto pt-2 z-10">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.75 rounded-lg ${tagBg} ${tagText}`}>
                                THI ĐẤU
                              </span>
                              <span className={`text-[10px] font-bold uppercase ${textStyle} opacity-75`}>
                                Nhấp để chơi
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAGE 4: Interactive game dashboard stage */}
              {studentName && studentClass && selectedStudentLessonId && activeGameKey && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <button
                      onClick={() => {
                        setActiveGameKey(null);
                        setStudentFinishedScore(null);
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-indigo-600 border-2 border-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-50 transition-colors"
                    >
                      ← Sảnh chọn Game
                    </button>

                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Thí sinh đang đấu</span>
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{studentName} ({studentClass})</span>
                    </div>
                  </div>

                  {/* Active playing console */}
                  <div className="min-h-[400px]">
                    {!selectedLessonDetailForStudent?.gameData ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-700">Đang tải bộ câu hỏi...</p>
                        <p className="text-xs text-slate-400 mt-1">Hệ thống đang chuẩn bị trò chơi của bạn</p>
                      </div>
                    ) : (
                      <>
                        {activeGameKey === "goldenBell" && (
                      <GoldenBell
                        data={selectedLessonDetailForStudent?.gameData?.goldenBell!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "millionaire" && (
                      <Millionaire
                        data={selectedLessonDetailForStudent?.gameData?.millionaire!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "olympia" && (
                      <Olympia
                        data={selectedLessonDetailForStudent?.gameData?.olympia!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "wheelOfFortune" && (
                      <WheelOfFortune
                        data={selectedLessonDetailForStudent?.gameData?.wheelOfFortune!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "pictogram" && (
                      <PictogramGame
                        data={selectedLessonDetailForStudent?.gameData?.pictogram!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "kahoot" && (
                      <KahootGame
                        data={selectedLessonDetailForStudent?.gameData?.kahoot!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "quizizz" && (
                      <QuizizzGame
                        data={selectedLessonDetailForStudent?.gameData?.quizizz!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "escapeRoom" && (
                      <EscapeRoom
                        data={selectedLessonDetailForStudent?.gameData?.escapeRoom!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "secretCode" && (
                      <SecretCode
                        data={selectedLessonDetailForStudent?.gameData?.secretCode!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}

                    {activeGameKey === "treasureHunt" && (
                      <TreasureHunt
                        data={selectedLessonDetailForStudent?.gameData?.treasureHunt!}
                        studentName={studentName}
                        studentClass={studentClass}
                        lessonId={selectedStudentLessonId}
                        onComplete={handleCompleteGame}
                        onBack={() => {
                          setActiveGameKey(null);
                          setStudentFinishedScore(null);
                        }}
                      />
                    )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200 bg-white text-xs text-slate-400 py-6 mt-12 font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="uppercase tracking-wide font-semibold text-[10px]">LH: GV Hà Văn Thạnh, Gamified Class Studio. Được tối ưu hóa bằng Gemini AI.</p>
          <div className="flex gap-4 uppercase tracking-widest font-black text-[10px]">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Sách giáo khoa số : Lớp <a href="https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=0" target="_blank">[10]</a><a href="https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=0" target="_blank">[11]</a><a href="https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-vat-li-12.4701697631#page=7" target="_blank">[12]</a></span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors"><a href="https://hethonghoctap-nhc.vercel.app" target="_blank">Học liệu điện tử</a></span>
          </div>
        </div>
      </footer>

      {/* Manual Game Quiz Editor Modal overlay */}
      <GameDataEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        gameKey={editorGameKey}
        gameName={editorGameName}
        initialData={editorInitialData}
        onSave={handleSaveGameData}
      />

      {/* Custom Dialog Modal */}
      {dialogConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              dialogConfig.type === 'error' ? 'bg-red-500' :
              dialogConfig.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-600'
            }`} />
            
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight font-sans mb-2">
              {dialogConfig.title}
            </h3>
            <p className="text-xs text-slate-600 font-bold leading-relaxed mb-6">
              {dialogConfig.message}
            </p>
            
            <div className="flex justify-end gap-3">
              {dialogConfig.type === "confirm" && (
                <button
                  onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                onClick={() => {
                  setDialogConfig(prev => ({ ...prev, isOpen: false }));
                  if (dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {dialogConfig.type === "confirm" ? "Đồng ý" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold font-sans">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
