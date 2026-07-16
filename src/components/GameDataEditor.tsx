import React, { useState, useEffect } from "react";
import { Sparkles, Check, AlertTriangle, HelpCircle, Save, X, RefreshCw } from "lucide-react";

interface GameDataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  gameKey: string;
  gameName: string;
  initialData: any;
  onSave: (updatedData: any) => Promise<void>;
}

export default function GameDataEditor({
  isOpen,
  onClose,
  gameKey,
  gameName,
  initialData,
  onSave
}: GameDataEditorProps) {
  const [jsonText, setJsonText] = useState("");
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load and format initial data
  useEffect(() => {
    if (initialData) {
      setJsonText(JSON.stringify(initialData, null, 2));
      setSyntaxError(null);
      setSaveSuccess(false);
    } else {
      setJsonText("");
    }
  }, [initialData, gameKey]);

  if (!isOpen) return null;

  // Real-time syntax check
  const handleTextChange = (value: string) => {
    setJsonText(value);
    setSaveSuccess(false);
    try {
      if (value.trim() === "") {
        setSyntaxError("Dữ liệu không được để trống");
        return;
      }
      JSON.parse(value);
      setSyntaxError(null);
    } catch (err: any) {
      setSyntaxError(err.message || "Cú pháp JSON không hợp lệ");
    }
  };

  // Perform save
  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText.trim());
      setSyntaxError(null);
      setIsSaving(true);
      await onSave(parsed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSyntaxError("Không thể lưu: " + (err.message || "Lỗi cú pháp JSON"));
    } finally {
      setIsSaving(false);
    }
  };

  // Format JSON automatically
  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setSyntaxError(null);
    } catch (err: any) {
      setSyntaxError("Cú pháp đang bị lỗi, hãy sửa trước khi tự động căn lề: " + err.message);
    }
  };

  // Vietnamese helper documentation for each game type
  const getHelperGuide = () => {
    switch (gameKey) {
      case "goldenBell":
        return {
          title: "🔔 RUNG CHUÔNG VÀNG (10 câu trắc nghiệm)",
          fields: [
            { key: "questions", desc: "Mảng danh sách các câu hỏi" },
            { key: "id", desc: "Mã định danh duy nhất (ví dụ: 'gb_1')" },
            { key: "question", desc: "Nội dung câu hỏi chữ" },
            { key: "options", desc: "Mảng chứa ĐÚNG 4 lựa chọn trả lời dạng chuỗi chữ" },
            { key: "correctAnswer", desc: "Chỉ số của đáp án đúng (từ 0 đến 3). 0 = Đáp án thứ nhất, 1 = Thứ hai..." },
            { key: "explanation", desc: "Lời giải thích ngắn gọn lý do đáp án đó đúng" }
          ],
          tips: "Hãy đảm bảo luôn có đủ 4 lựa chọn trong mảng 'options' và 'correctAnswer' nằm trong khoảng từ 0 đến 3."
        };
      case "millionaire":
        return {
          title: "💎 AI LÀ TRIỆU PHÚ (15 câu phân bậc)",
          fields: [
            { key: "questions", desc: "Mảng chứa đúng 15 câu hỏi" },
            { key: "level", desc: "Bậc câu hỏi (từ 1 đến 15) đại diện cho độ khó tăng dần" },
            { key: "options", desc: "Mảng gồm đúng 4 lựa chọn đáp án" },
            { key: "correctAnswer", desc: "Chỉ số đáp án đúng (0 đến 3)" },
            { key: "hints", desc: "Gồm 3 gói trợ giúp: callFriend (lời tư vấn dí dỏm), audiencePoll (mảng 4 số tỉ lệ % khán giả chọn, tổng = 100), fiftyFifty (mảng 2 phần tử gồm chỉ số đúng và 1 chỉ số sai bất kỳ)" }
          ],
          tips: "Trò chơi yêu cầu đúng 15 câu hỏi sắp xếp theo 'level' từ 1 đến 15 để bọc lót quy trình vượt qua các mốc giải thưởng."
        };
      case "olympia":
        return {
          title: "🏔️ ĐƯỜNG LÊN ĐỈNH OLYMPIA (4 vòng thi)",
          fields: [
            { key: "round1", desc: "Vòng Khởi Động: Gồm các câu hỏi trắc nghiệm ngắn phản ứng nhanh" },
            { key: "round2", desc: "Vòng Vượt Chướng Ngại Vật: Chứa 'keyword' (viết hoa không dấu, ví dụ: 'DIENBIENPHU') và mảng 'clues' gồm 4 câu gợi ý hàng ngang. Mỗi câu gợi ý cần có 'rowWord' (đáp án viết hoa không dấu) và 'answerLength' (độ dài chữ)" },
            { key: "round3", desc: "Vòng Tăng Tốc: 4 câu hỏi trắc nghiệm tư duy logic cao" },
            { key: "round4", desc: "Vòng Về Đích: 3 câu hỏi sâu với các mốc điểm 20, 30, 40" }
          ],
          tips: "Đây là cấu trúc phức tạp nhất. Hãy cẩn thận giữ nguyên các thuộc tính 'round1', 'round2', 'round3', 'round4'."
        };
      case "wheelOfFortune":
        return {
          title: "🎡 CHIẾC NÓN KỲ DIỆU (Đoán từ ẩn)",
          fields: [
            { key: "words", desc: "Mảng chứa danh sách các từ khóa chủ đề" },
            { key: "word", desc: "Từ cần đoán (phải VIẾT HOA KHÔNG DẤU, có thể có khoảng trắng, ví dụ: 'QUANG TRUNG')" },
            { key: "clue", desc: "Gợi ý / định nghĩa giúp người chơi suy đoán ra từ khóa trên" }
          ],
          tips: "Người chơi sẽ xoay nón và đoán từng chữ cái. Hãy giữ từ 'word' viết hoa không dấu để công nghệ so khớp hoạt động chính xác."
        };
      case "pictogram":
        return {
          title: "🎨 ĐUỔI HÌNH BẮT CHỮ (Liên tưởng emoji)",
          fields: [
            { key: "puzzles", desc: "Mảng chứa danh sách các câu đố" },
            { key: "word", desc: "Khái niệm đáp án (phải VIẾT HOA KHÔNG DẤU, ví dụ: 'BAO CAO')" },
            { key: "emojis", desc: "Chuỗi ghép 2-4 emojis mô tả liên tưởng (ví dụ: '📖🏫')" },
            { key: "visualDescription", desc: "Đoạn văn tả bức tranh đố vui sáng tạo gợi ý khái niệm" },
            { key: "explanation", desc: "Giải thích ý nghĩa lịch sử/khoa học đằng sau từ khóa" }
          ],
          tips: "Emojis đóng vai trò là 'hình ảnh' đại diện trực quan giúp học sinh đoán chữ."
        };
      case "kahoot":
        return {
          title: "⚡ KAHOOT CHALLENGE (Trắc nghiệm tốc độ)",
          fields: [
            { key: "questions", desc: "Mảng các câu hỏi trắc nghiệm" },
            { key: "options", desc: "Mảng gồm đúng 4 đáp án lựa chọn" },
            { key: "correctAnswer", desc: "Chỉ số đáp án đúng (0 đến 3)" },
            { key: "timeLimit", desc: "Thời gian giây quy định trả lời (thường là 15 hoặc 20)" },
            { key: "points", desc: "Hệ số điểm thưởng tối đa (luôn đặt là 1000)" }
          ],
          tips: "Người chơi trả lời càng nhanh điểm nhận được càng cao dựa trên giới hạn 'timeLimit'."
        };
      case "quizizz":
        return {
          title: "👾 QUIZIZZ CHALLENGE (Trắc nghiệm kèm meme)",
          fields: [
            { key: "questions", desc: "Mảng các câu hỏi trắc nghiệm luyện tập" },
            { key: "options", desc: "Mảng gồm 4 đáp án lựa chọn" },
            { key: "correctAnswer", desc: "Chỉ số đáp án đúng (0-3)" },
            { key: "explanation", desc: "Lời giảng giải chi tiết kiến thức" },
            { key: "memeSuccess", desc: "Lời khen ngợi hóm hỉnh hiện lên khi trả lời ĐÚNG" },
            { key: "memeFail", desc: "Lời an ủi khôi hài, khích lệ hiện lên khi trả lời SAI" }
          ],
          tips: "Phù hợp cho tự luyện tập cá nhân. Các câu 'meme' mang đậm tính tương tác vui nhộn."
        };
      case "escapeRoom":
        return {
          title: "🚪 ESCAPE ROOM GIÁO DỤC (5 chốt giải mã)",
          fields: [
            { key: "levels", desc: "Mảng 5 chốt chặn liên tiếp (levelNum từ 1 đến 5)" },
            { key: "type", desc: "Thể loại thử thách của chốt chặn. Phải là một trong: 'padlock', 'anagram', 'matching', 'code', 'riddle'" },
            { key: "title", desc: "Tên chặng/chốt cửa" },
            { key: "scenario", desc: "Lời dẫn nhập kể chuyện kịch tính nhập vai tìm lối thoát" },
            { key: "question", desc: "Nhiệm vụ, câu đố cần thực hiện để lấy mật mã" },
            { key: "options", desc: "Tùy chọn đáp án (được dùng nhiều cho padlock hoặc matching, có thể rỗng)" },
            { key: "correctAnswer", desc: "Mã khóa chính xác để bẻ khóa (VIẾT HOA KHÔNG DẤU hoặc CHỮ SỐ)" },
            { key: "hint", desc: "Gợi ý kham khảo để tránh bị kẹt" }
          ],
          tips: "Hãy bảo toàn các giá trị 'type' đúng quy chuẩn để tránh gây lỗi giao diện trò chơi."
        };
      case "secretCode":
        return {
          title: "🕵️ MẬT MÃ BÍ ẨN (Kiểu đoán Wordle)",
          fields: [
            { key: "secretWord", desc: "Từ khóa cốt lõi cần giải mật mã (PHẢI CÓ ĐỘ DÀI ĐÚNG 5 ĐẾN 6 CHỮ CÁI, VIẾT HOA KHÔNG DẤU, ví dụ: 'DIENBI')" },
            { key: "wordDefinition", desc: "Khái niệm, định nghĩa định hướng của từ khóa" },
            { key: "clues", desc: "Mảng gồm đúng 3 gợi ý mở rộng hỗ trợ người chơi theo lượt" },
            { key: "explanation", desc: "Giải thích sâu về bối cảnh khoa học / lịch sử của từ khóa" }
          ],
          tips: "Yêu cầu nghiêm ngặt về độ dài 'secretWord' (5 hoặc 6 ký tự viết hoa không dấu) để vẽ các ô lưới Wordle hoàn hảo."
        };
      case "treasureHunt":
        return {
          title: "🏴‍☠️ TRUY TÌM KHO BÁU (5 trạm địa danh)",
          fields: [
            { key: "stations", desc: "Mảng chứa đúng 5 trạm địa danh thám hiểm" },
            { key: "name", desc: "Tên địa danh (ví dụ: 'Hang Khói', 'Bãi Đá Ngầm'...)" },
            { key: "coordinates", desc: "Tọa độ vẽ chấm tròn trên bản đồ ảo gồm x, y (khoảng 15 đến 85)" },
            { key: "challengeType", desc: "Thể loại nhiệm vụ. Phải thuộc: 'multiple-choice', 'true-false', 'fill-blank', 'cipher'" },
            { key: "question", desc: "Đề bài thử thách" },
            { key: "options", desc: "Lựa chọn đáp án (đặc biệt cần thiết cho multiple-choice)" },
            { key: "correctAnswer", desc: "Đáp án gõ chính xác (VIẾT HOA KHÔNG DẤU, ví dụ: 'TRUE', 'A', '1954')" },
            { key: "cipherHint", desc: "Gợi ý giải mã khi chơi trạm cipher (giải mật thư)" }
          ],
          tips: "Tọa độ 'coordinates' x, y giúp chấm điểm trạm hiển thị đúng vị trí sinh động trên bản đồ hòn đảo."
        };
      default:
        return {
          title: "Dữ liệu trò chơi cấu trúc tùy biến",
          fields: [
            { key: "Tất cả các trường", desc: "Được sinh tự động từ Gemini AI." }
          ],
          tips: "Hãy đảm bảo chỉnh sửa đúng định dạng và cú pháp JSON chuẩn xác."
        };
    }
  };

  const guide = getHelperGuide();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white border-2 border-slate-300 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200">HIỆU CHỈNH ĐỀ THI CỦA AI</h3>
              <p className="text-xs font-semibold text-white/95 uppercase">{gameName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content columns split screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Code Textarea Editor */}
          <div className="lg:col-span-7 flex flex-col p-6 bg-slate-50 border-r border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Trình biên tập JSON nâng cao
              </span>
              <button
                onClick={handlePrettify}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"
                title="Tự động căn lề thụt dòng đẹp mắt"
              >
                <RefreshCw className="w-3 h-3" /> Căn lề code
              </button>
            </div>

            <div className="flex-1 min-h-[300px] relative flex flex-col">
              <textarea
                value={jsonText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="flex-1 font-mono text-xs bg-slate-900 text-indigo-300 p-4 rounded-2xl border-2 border-slate-950 focus:border-indigo-600 focus:outline-none resize-none leading-relaxed shadow-inner overflow-y-auto"
                spellCheck={false}
              />
            </div>

            {/* Error or Success notification row */}
            <div className="mt-4">
              {syntaxError ? (
                <div className="bg-red-50 border-2 border-red-500/20 text-red-600 rounded-xl p-3 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold uppercase block text-[10px] tracking-wider text-red-700 mb-0.5">LỖI CÚ PHÁP ĐỀ THI:</span>
                    <p className="font-mono text-[11px] leading-relaxed break-all">{syntaxError}</p>
                  </div>
                </div>
              ) : saveSuccess ? (
                <div className="bg-emerald-50 border-2 border-emerald-500/20 text-emerald-600 rounded-xl p-3 flex items-center gap-2 text-xs">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="font-bold uppercase text-[10px] tracking-wider text-emerald-700">ĐÃ LƯU THAY ĐỔI THÀNH CÔNG VÀO CƠ SỞ DỮ LIỆU!</span>
                </div>
              ) : (
                <div className="bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Cú pháp dữ liệu hợp lệ. Sẵn sàng lưu trữ.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Schema/Field Documentation Helper */}
          <div className="lg:col-span-5 p-6 overflow-y-auto max-h-full space-y-4">
            <div className="border-b border-slate-150 pb-3">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <HelpCircle className="w-4.5 h-4.5" />
                <h4 className="text-xs font-black uppercase tracking-wider">HƯỚNG DẪN HIỆU CHỈNH CẤU TRÚC</h4>
              </div>
              <p className="text-slate-500 text-[11px] font-semibold uppercase mt-1">Cẩm nang cấu hình các trường thông tin không gây lỗi</p>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
              <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider mb-2.5">
                {guide.title}
              </h5>
              <div className="space-y-3">
                {guide.fields.map((field) => (
                  <div key={field.key} className="text-xs leading-relaxed">
                    <code className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-[11px] font-mono">
                      "{field.key}"
                    </code>
                    <p className="text-slate-600 mt-1 pl-1 font-sans text-[11px] leading-relaxed">
                      {field.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-150 text-[11px] text-indigo-700 font-sans italic leading-relaxed">
                <strong>💡 Lưu ý quan trọng:</strong> {guide.tips}
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <h6 className="text-[10px] font-black uppercase tracking-wider">Cảnh báo can thiệp</h6>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed font-sans font-medium">
                Hãy giữ nguyên tên và kiểu của các trường khóa gốc (như dấu ngoặc nhọn, mảng ngoặc vuông). Nếu sửa đổi sai cấu trúc, Game của học sinh có thể không khởi động được. Sử dụng nút <strong className="text-indigo-600">"Căn lề code"</strong> để làm gọn văn bản.
              </p>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="border-2 border-slate-200 text-slate-700 font-black px-6 py-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            Đóng Lại
          </button>
          
          <button
            disabled={!!syntaxError || isSaving}
            onClick={handleSave}
            className="bg-indigo-600 text-white font-black px-8 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all text-xs uppercase tracking-widest shadow-md flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu đề thi
          </button>
        </div>

      </div>
    </div>
  );
}
