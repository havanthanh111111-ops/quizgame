/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Zap, ShieldAlert, Star, Compass, ArrowRight, CheckCircle, HelpCircle, AlertTriangle } from "lucide-react";
import { OlympiaData } from "../../types";
import { MathText } from "../MathText";

interface Props {
  data: OlympiaData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

export default function Olympia({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3 | 4>(1);
  const [score, setScore] = useState(0);

  // Round 1 (Khởi động) State
  const [r1Idx, setR1Idx] = useState(0);
  const [r1TimeLeft, setR1TimeLeft] = useState(60);
  const [r1Completed, setR1Completed] = useState(false);

  // Round 2 (Vượt chướng ngại vật) State
  const [r2RevealedRows, setR2RevealedRows] = useState<boolean[]>([false, false, false, false]);
  const [r2ActiveRow, setR2ActiveRow] = useState<number | null>(null);
  const [r2InputAnswer, setR2InputAnswer] = useState("");
  const [r2GuessedRows, setR2GuessedRows] = useState<string[]>(["", "", "", ""]);
  const [r2KeywordInput, setR2KeywordInput] = useState("");
  const [r2KeywordSolved, setR2KeywordSolved] = useState(false);
  const [r2Eliminated, setR2Eliminated] = useState(false);
  const [r2Completed, setR2Completed] = useState(false);

  // Round 3 (Tăng tốc) State
  const [r3Idx, setR3Idx] = useState(0);
  const [r3TimeLeft, setR3TimeLeft] = useState(30);
  const [r3AnswerSelected, setR3AnswerSelected] = useState<number | null>(null);
  const [r3IsAnswered, setR3IsAnswered] = useState(false);
  const [r3Scores, setR3Scores] = useState<number[]>([]);
  const [r3Completed, setR3Completed] = useState(false);

  // Round 4 (Về đích) State
  const [r4Idx, setR4Idx] = useState(0);
  const [r4HopeStar, setR4HopeStar] = useState(false);
  const [r4AnswerSelected, setR4AnswerSelected] = useState<number | null>(null);
  const [r4IsAnswered, setR4IsAnswered] = useState(false);
  const [r4Completed, setR4Completed] = useState(false);

  // Setup timers
  useEffect(() => {
    if (currentRound === 1 && !r1Completed && r1TimeLeft > 0) {
      const timer = setInterval(() => {
        setR1TimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (currentRound === 1 && r1TimeLeft === 0) {
      setR1Completed(true);
    }
  }, [currentRound, r1TimeLeft, r1Completed]);

  useEffect(() => {
    if (currentRound === 3 && !r3Completed && r3TimeLeft > 0 && !r3IsAnswered) {
      const timer = setInterval(() => {
        setR3TimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (currentRound === 3 && r3TimeLeft === 0 && !r3IsAnswered) {
      setR3IsAnswered(true);
      setR3AnswerSelected(-1);
    }
  }, [currentRound, r3TimeLeft, r3IsAnswered, r3Completed]);

  // Round 1 Handlers
  const handleR1Answer = (optionIdx: number) => {
    const q = data.round1[r1Idx];
    // Simple mock comparison
    const isCorrect = q.options ? q.options[optionIdx] === q.answer : false;
    if (isCorrect) {
      setScore((prev) => prev + 10);
    }

    if (r1Idx < data.round1.length - 1) {
      setR1Idx((prev) => prev + 1);
    } else {
      setR1Completed(true);
    }
  };

  // Round 2 Handlers
  const handleR2OpenRow = (idx: number) => {
    if (r2RevealedRows[idx] || r2Eliminated || r2KeywordSolved) return;
    setR2ActiveRow(idx);
    setR2InputAnswer("");
  };

  const handleR2SubmitRow = () => {
    if (r2ActiveRow === null) return;
    const clue = data.round2.clues[r2ActiveRow];
    const isCorrect = r2InputAnswer.toUpperCase().trim() === clue.rowWord.toUpperCase().trim();

    const updatedRows = [...r2RevealedRows];
    updatedRows[r2ActiveRow] = true;
    setR2RevealedRows(updatedRows);

    const updatedGuesses = [...r2GuessedRows];
    if (isCorrect) {
      updatedGuesses[r2ActiveRow] = clue.rowWord;
      setScore((prev) => prev + 10);
    } else {
      updatedGuesses[r2ActiveRow] = "ĐÁP ÁN SAI";
    }
    setR2GuessedRows(updatedGuesses);
    setR2ActiveRow(null);

    // If all rows answered, complete
    if (updatedRows.every(r => r)) {
      setR2Completed(true);
    }
  };

  const handleR2SubmitKeyword = () => {
    if (r2KeywordInput.toUpperCase().trim() === data.round2.keyword.toUpperCase().trim()) {
      setR2KeywordSolved(true);
      // Award massive points depending on how many rows are revealed
      const unrevealedCount = r2RevealedRows.filter(r => !r).length;
      const award = 40 + unrevealedCount * 10;
      setScore((prev) => prev + award);
      setR2Completed(true);
    } else {
      setR2Eliminated(true);
      setR2Completed(true);
    }
  };

  // Round 3 Handlers
  const handleR3Answer = (optionIdx: number) => {
    if (r3IsAnswered) return;
    setR3AnswerSelected(optionIdx);
    setR3IsAnswered(true);

    const q = data.round3[r3Idx];
    if (optionIdx === q.correctAnswer) {
      // Points depend on speed
      let points = 10;
      if (r3TimeLeft > 22) points = 40;
      else if (r3TimeLeft > 15) points = 30;
      else if (r3TimeLeft > 8) points = 20;

      setScore((prev) => prev + points);
    }
  };

  const handleR3Next = () => {
    setR3IsAnswered(false);
    setR3AnswerSelected(null);
    setR3TimeLeft(30);

    if (r3Idx < data.round3.length - 1) {
      setR3Idx((prev) => prev + 1);
    } else {
      setR3Completed(true);
    }
  };

  // Round 4 Handlers
  const handleR4Answer = (optionIdx: number) => {
    if (r4IsAnswered) return;
    setR4AnswerSelected(optionIdx);
    setR4IsAnswered(true);

    const q = data.round4[r4Idx];
    const optionText = q.options ? q.options[optionIdx] : "";
    const isCorrect = optionText === q.correctAnswer;

    let points = q.points;
    if (r4HopeStar) points *= 2;

    if (isCorrect) {
      setScore((prev) => prev + points);
    } else {
      setScore((prev) => Math.max(0, prev - (r4HopeStar ? q.points : q.points / 2)));
    }
  };

  const handleR4Next = () => {
    setR4IsAnswered(false);
    setR4AnswerSelected(null);
    setR4HopeStar(false);

    if (r4Idx < data.round4.length - 1) {
      setR4Idx((prev) => prev + 1);
    } else {
      setR4Completed(true);
      // Done with all rounds! Save score
      onComplete(score, 400); // 400 max score reference
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl relative animate-fade-in">
      {/* Top Navigation / Round indicator */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 pb-4 border-b border-slate-150 gap-4">
        <div>
          <span className="text-xs font-mono text-indigo-600 uppercase font-black tracking-widest block">
            ĐƯỜNG LÊN ĐỈNH OLYMPIA MINI
          </span>
          <h2 className="text-xl font-black font-sans mt-0.5 text-slate-800 uppercase tracking-tight">
            {currentRound === 1 && "⚡ Vòng 1: Khởi Động"}
            {currentRound === 2 && "🧗 Vòng 2: Vượt Chướng Ngại Vật"}
            {currentRound === 3 && "🚀 Vòng 3: Tăng Tốc"}
            {currentRound === 4 && "🎯 Vòng 4: Về Đích"}
          </h2>
        </div>

        {/* Scoring / Navigation tabs */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-205 flex items-center gap-2 shadow-inner">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-mono text-slate-400 font-bold">ĐIỂM SỐ:</span>
            <span className="text-lg font-black text-indigo-600 font-sans">{score}</span>
          </div>

          <button
            onClick={onBack}
            className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors"
          >
            Thoát
          </button>
        </div>
      </div>

      {/* ROUND 1: KHỞI ĐỘNG */}
      {currentRound === 1 && (
        <div className="space-y-6">
          {!r1Completed ? (
            <>
              <div className="flex justify-between items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">Thời gian còn lại:</span>
                <span className={`text-xl font-bold font-mono ${r1TimeLeft < 10 ? "text-red-500 animate-pulse" : "text-cyan-400"}`}>
                  {r1TimeLeft} Giây
                </span>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-6 border border-slate-800 text-white">
                <span className="text-xs text-cyan-400 font-mono font-bold uppercase block mb-2">Câu Hỏi {r1Idx + 1}/10</span>
                <div className="text-lg font-semibold font-sans text-white"><MathText text={data.round1[r1Idx]?.question} /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.round1[r1Idx]?.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleR1Answer(idx)}
                    className="bg-slate-950/40 border border-slate-800 hover:border-cyan-500 hover:bg-slate-950 text-white text-left p-4 rounded-xl text-sm md:text-base font-sans font-semibold transition-all"
                  >
                    <MathText text={opt} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Hoàn Thành Khởi Động!</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                Hết giờ! Bạn đã hoàn tất vòng thi đầu tiên với số điểm hiện có là <span className="text-yellow-400 font-bold">{score} điểm</span>.
              </p>
              <button
                onClick={() => setCurrentRound(2)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/10"
              >
                Vòng Tiếp Theo (Vượt Chướng Ngại Vật)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ROUND 2: VƯỢT CHƯỚNG NGẠI VẬT */}
      {currentRound === 2 && (
        <div className="space-y-6">
          {!r2Completed ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Horizontal rows map */}
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs font-mono text-slate-500 block uppercase mb-2">Hàng Ngang Chướng Ngại Vật</span>
                {data.round2.clues.map((clue, idx) => {
                  const isRevealed = r2RevealedRows[idx];
                  const guessedWord = r2GuessedRows[idx];

                  return (
                    <div
                      key={idx}
                      onClick={() => handleR2OpenRow(idx)}
                      className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                        isRevealed
                          ? "bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-slate-950 hover:bg-slate-900 border-cyan-500/30 text-white cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono bg-slate-900 border border-slate-800 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-cyan-400 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Hàng ngang {idx + 1} ({clue.answerLength} chữ cái)</p>
                          {isRevealed && (
                            <p className="text-xs font-mono uppercase font-bold text-green-400 mt-0.5">
                              ĐÁP ÁN: {guessedWord}
                            </p>
                          )}
                        </div>
                      </div>

                      {!isRevealed && <span className="text-xs text-cyan-400 font-mono">Giải mã →</span>}
                    </div>
                  );
                })}

                {/* Main keyword guess field */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-6">
                  <span className="text-xs font-mono text-amber-500 block uppercase mb-2 font-bold">Đoán Chướng Ngại Vật chính</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập từ khóa không dấu..."
                      value={r2KeywordInput}
                      onChange={(e) => setR2KeywordInput(e.target.value)}
                      disabled={r2Eliminated || r2KeywordSolved}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm w-full font-mono uppercase tracking-widest text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleR2SubmitKeyword}
                      disabled={r2Eliminated || r2KeywordSolved || !r2KeywordInput}
                      className="bg-amber-500 text-slate-950 font-bold px-4 rounded-lg text-xs hover:bg-amber-400 active:scale-95 transition-all uppercase"
                    >
                      Gửi từ khóa
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Active question & clues box */}
              <div className="md:col-span-5 space-y-4">
                {r2ActiveRow !== null ? (
                  <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/30 h-full flex flex-col justify-between text-white">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 uppercase font-bold block mb-2">ĐANG GIẢI HÀNG NGANG {r2ActiveRow + 1}</span>
                      <div className="text-sm font-medium mb-4 text-white"><MathText text={data.round2.clues[r2ActiveRow].question} /></div>

                      <input
                        type="text"
                        placeholder="Nhập câu trả lời viết liền không dấu..."
                        value={r2InputAnswer}
                        onChange={(e) => setR2InputAnswer(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm w-full font-mono uppercase text-white mb-2"
                      />
                    </div>
                    <button
                      onClick={handleR2SubmitRow}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all uppercase"
                    >
                      Xác Nhận Đáp Án
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950/30 p-6 rounded-xl border border-slate-800 text-center text-slate-500 h-full flex flex-col justify-center items-center">
                    <Compass className="w-12 h-12 text-slate-700 mb-2 animate-spin" style={{ animationDuration: "12s" }} />
                    <p className="text-xs max-w-xs">
                      Click chọn một hàng ngang bên trái để mở gói câu hỏi gợi ý, hoặc đoán trực tiếp Từ khóa chính bên dưới nếu bạn đã xâu chuỗi được dữ kiện!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              {r2KeywordSolved ? (
                <>
                  <CheckCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">Tuyệt Vời! Đã Phá Khóa Chướng Ngại Vật</h3>
                  <p className="text-slate-300 mb-1 max-w-sm mx-auto text-sm">
                    Đáp án chướng ngại vật chính xác là: <span className="font-mono text-yellow-400 font-extrabold uppercase">{data.round2.keyword}</span>
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Tiếc Quá, Bạn Đã Dừng Lại!</h3>
                  <p className="text-slate-400 mb-1 max-w-sm mx-auto text-sm">
                    Từ khóa chướng ngại vật là: <span className="font-mono text-cyan-400 font-extrabold uppercase">{data.round2.keyword}</span>
                  </p>
                </>
              )}
              <p className="text-slate-500 text-xs mb-8">Điểm hiện tại: {score}</p>
              <button
                onClick={() => setCurrentRound(3)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                Vòng Tiếp Theo (Tăng Tốc)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ROUND 3: TĂNG TỐC */}
      {currentRound === 3 && (
        <div className="space-y-6">
          {!r3Completed ? (
            <>
              <div className="flex justify-between items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">Thời gian trả lời còn lại:</span>
                <span className={`text-xl font-bold font-mono ${r3TimeLeft < 5 ? "text-red-500 animate-pulse" : "text-amber-500"}`}>
                  {r3TimeLeft} Giây
                </span>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-6 border border-slate-800 text-white">
                <span className="text-xs text-amber-500 font-mono font-bold uppercase block mb-2">CÂU HỎI TĂNG TỐC {r3Idx + 1}/4</span>
                <div className="text-lg font-semibold font-sans text-white"><MathText text={data.round3[r3Idx]?.question} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.round3[r3Idx]?.options.map((opt, idx) => {
                  let btnClass = "border-slate-800 bg-slate-950/50 hover:bg-slate-950 text-white";
                  if (r3IsAnswered) {
                    if (idx === data.round3[r3Idx].correctAnswer) {
                      btnClass = "border-green-500 bg-green-500/20 text-green-300";
                    } else if (idx === r3AnswerSelected) {
                      btnClass = "border-red-500 bg-red-500/20 text-red-300";
                    } else {
                      btnClass = "border-slate-900 bg-slate-950/10 text-slate-600";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={r3IsAnswered}
                      onClick={() => handleR3Answer(idx)}
                      className={`flex items-start gap-3 text-left p-4 rounded-xl border text-sm md:text-base font-sans font-semibold transition-all ${btnClass}`}
                    >
                      <span className="font-mono text-xs bg-slate-900 border border-slate-800 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-amber-500">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span><MathText text={opt} /></span>
                    </button>
                  );
                })}
              </div>

              {r3IsAnswered && (
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex justify-between items-center flex-wrap gap-4">
                  <div className="text-xs text-slate-400 max-w-md"><MathText text={data.round3[r3Idx]?.explanation} /></div>
                  <button
                    onClick={handleR3Next}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2 rounded-lg text-xs uppercase"
                  >
                    Tiếp theo
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Tăng Tốc Về Đích!</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm">
                Bạn đã hoàn thành vòng Tăng Tốc kịch tính. Điểm số tích lũy: <span className="text-yellow-400 font-bold">{score} điểm</span>.
              </p>
              <button
                onClick={() => setCurrentRound(4)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                Vòng Quyết Định (Về Đích)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ROUND 4: VỀ ĐÍCH */}
      {currentRound === 4 && (
        <div className="space-y-6">
          {!r4Completed ? (
            <>
              {/* Question card header */}
              <div className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                    CÂU {data.round4[r4Idx]?.points} ĐIỂM
                  </span>
                  <span className="text-xs font-mono text-slate-400">Câu hỏi {r4Idx + 1}/3</span>
                </div>

                {/* Hope Star trigger */}
                <button
                  onClick={() => !r4IsAnswered && setR4HopeStar(!r4HopeStar)}
                  disabled={r4IsAnswered}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    r4HopeStar
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Star className={`w-4 h-4 ${r4HopeStar ? "fill-amber-400 text-amber-400 animate-pulse" : ""}`} />
                  Ngôi Sao Hy Vọng
                </button>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-6 border border-slate-800 text-white">
                <div className="text-lg font-semibold font-sans text-white"><MathText text={data.round4[r4Idx]?.question} /></div>
              </div>

              {/* Options Grid (If options exist) */}
              {data.round4[r4Idx]?.options && data.round4[r4Idx].options.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.round4[r4Idx].options.map((opt, idx) => {
                    let btnClass = "border-slate-800 bg-slate-950/50 hover:bg-slate-950 text-white";
                    if (r4IsAnswered) {
                      const isThisCorrect = opt === data.round4[r4Idx].correctAnswer;
                      if (isThisCorrect) {
                        btnClass = "border-green-500 bg-green-500/20 text-green-300";
                      } else if (idx === r4AnswerSelected) {
                        btnClass = "border-red-500 bg-red-500/20 text-red-300";
                      } else {
                        btnClass = "border-slate-900 bg-slate-950/10 text-slate-600";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={r4IsAnswered}
                        onClick={() => handleR4Answer(idx)}
                        className={`flex items-start gap-3 text-left p-4 rounded-xl border text-sm md:text-base font-sans font-semibold transition-all ${btnClass}`}
                      >
                        <span className="font-mono text-xs bg-slate-900 border border-slate-800 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-red-400">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span><MathText text={opt} /></span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Text Input for direct short answers if options do not exist */
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập đáp án tự luận..."
                      id="r4ShortInput"
                      disabled={r4IsAnswered}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm w-full text-white"
                    />
                    <button
                      onClick={() => {
                        const inputVal = (document.getElementById("r4ShortInput") as HTMLInputElement)?.value;
                        if (!inputVal) return;
                        const isCorrect = inputVal.toUpperCase().trim() === data.round4[r4Idx].correctAnswer.toUpperCase().trim();
                        let points = data.round4[r4Idx].points;
                        if (r4HopeStar) points *= 2;
                        if (isCorrect) {
                          setScore((prev) => prev + points);
                        } else {
                          setScore((prev) => Math.max(0, prev - (r4HopeStar ? data.round4[r4Idx].points : data.round4[r4Idx].points / 2)));
                        }
                        setR4IsAnswered(true);
                      }}
                      disabled={r4IsAnswered}
                      className="bg-red-500 text-white font-bold px-6 rounded-lg text-xs uppercase hover:bg-red-400"
                    >
                      Gửi đáp án
                    </button>
                  </div>
                </div>
              )}

              {r4IsAnswered && (
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                  <span className="text-xs uppercase font-bold text-slate-500 mb-1 block">Giải thích:</span>
                  <div className="text-sm text-slate-400 mb-4"><MathText text={data.round4[r4Idx]?.explanation} /></div>
                  <div className="text-xs text-green-400 font-bold mb-4">✓ Đáp án đúng: <MathText text={data.round4[r4Idx]?.correctAnswer} /></div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleR4Next}
                      className="bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-2 rounded-lg text-xs uppercase"
                    >
                      {r4Idx < data.round4.length - 1 ? "Câu Tiếp Theo" : "Hoàn Thành Về Đích"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
