/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Play, Users, Trophy, Award, ArrowRight, CheckCircle, RotateCcw } from "lucide-react";
import { KahootData } from "../../types";
import { MathText } from "../MathText";

interface Props {
  data: KahootData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

const KAHOOT_COLORS = [
  "bg-red-500 border-red-600 hover:bg-red-600 text-white shadow-red-500/20",
  "bg-blue-500 border-blue-600 hover:bg-blue-600 text-white shadow-blue-500/20",
  "bg-yellow-500 border-yellow-600 hover:bg-yellow-600 text-slate-950 shadow-yellow-500/20",
  "bg-green-500 border-green-600 hover:bg-green-600 text-white shadow-green-500/20"
];

const KAHOOT_SHAPES = [
  "▲", // Triangle
  "◆", // Diamond
  "●", // Circle
  "■"  // Square
];

export default function KahootGame({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [gameState, setGameState] = useState<"lobby" | "playing" | "results">("lobby");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);

  // Leaderboard of competitors (simulated)
  const [leaderboard, setLeaderboard] = useState([
    { name: studentName, score: 0, isPlayer: true },
    { name: "Minh Quân 🎒", score: 0, isPlayer: false },
    { name: "Lan Vy 🌸", score: 0, isPlayer: false },
    { name: "Gia Bảo 🚀", score: 0, isPlayer: false },
    { name: "Phương Anh 🍭", score: 0, isPlayer: false }
  ]);

  const currentQuestion = data.questions[currentIdx];

  // Lobby simulation countdown
  const [lobbyTime, setLobbyTime] = useState(3);
  useEffect(() => {
    if (gameState !== "lobby") return;
    if (lobbyTime === 0) {
      setGameState("playing");
      setTimeLeft(currentQuestion.timeLimit);
      return;
    }
    const timer = setTimeout(() => {
      setLobbyTime((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameState, lobbyTime]);

  // Game timer ticking
  useEffect(() => {
    if (gameState !== "playing" || isAnswered || isFinished) return;

    if (timeLeft === 0) {
      handleTimeOut();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, isAnswered, isFinished]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(-1);
    updateCompetitors(false, 0);
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQuestion.correctAnswer;
    // Kahoot points calculation based on speed
    const scoreEarned = isCorrect ? Math.round(500 + (timeLeft / currentQuestion.timeLimit) * 500) : 0;

    updateCompetitors(isCorrect, scoreEarned);
  };

  const updateCompetitors = (playerCorrect: boolean, playerScoreEarned: number) => {
    setLeaderboard((prev) => {
      const updated = prev.map((competitor) => {
        if (competitor.isPlayer) {
          return { ...competitor, score: competitor.score + playerScoreEarned };
        }
        // Simulated classmates answering
        const competitorCorrect = Math.random() > 0.35; // 65% chance of correct answer
        const speedFactor = Math.random(); // random quickness
        const competitorEarned = competitorCorrect ? Math.round(500 + speedFactor * 450) : 0;
        return { ...competitor, score: competitor.score + competitorEarned };
      });
      // Sort leaderboard
      return updated.sort((a, b) => b.score - a.score);
    });
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOption(null);

    if (currentIdx < data.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(data.questions[currentIdx + 1].timeLimit);
    } else {
      setGameState("results");
      // Find final score of the player
      const finalRecord = leaderboard.find(c => c.isPlayer);
      onComplete(finalRecord?.score || 0, data.questions.length * 1000);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setLobbyTime(3);
    setGameState("lobby");
    setLeaderboard([
      { name: studentName, score: 0, isPlayer: true },
      { name: "Minh Quân 🎒", score: 0, isPlayer: false },
      { name: "Lan Vy 🌸", score: 0, isPlayer: false },
      { name: "Gia Bảo 🚀", score: 0, isPlayer: false },
      { name: "Phương Anh 🍭", score: 0, isPlayer: false }
    ]);
  };

  if (gameState === "lobby") {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl flex flex-col items-center justify-center min-h-[350px] animate-fade-in">
        <Users className="w-16 h-16 text-indigo-500 mb-4 animate-bounce" />
        <h3 className="text-2xl font-black mb-2 text-indigo-600 uppercase">ĐANG CHỜ PHÒNG CHỜ...</h3>
        <p className="text-slate-500 mb-8 text-sm font-semibold max-w-md">
          Chuẩn bị tham gia đấu trường Kahoot! Bạn sẽ so tài trực tiếp cùng các bạn học trong lớp.
        </p>

        <div className="bg-slate-50 px-8 py-6 rounded-full border border-slate-200 shadow-inner">
          <span className="text-4xl font-black text-indigo-600 font-mono animate-ping absolute block w-10 text-center">
            {lobbyTime}
          </span>
          <span className="text-4xl font-black text-indigo-600 font-mono relative block w-10 text-center">
            {lobbyTime}
          </span>
        </div>
      </div>
    );
  }

  if (gameState === "results") {
    const playerRank = leaderboard.findIndex(c => c.isPlayer) + 1;
    const playerScoreObj = leaderboard.find(c => c.isPlayer);

    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl animate-fade-in">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-1 uppercase text-indigo-600">KẾT QUẢ KHOA BẢNG</h2>
        <p className="text-slate-500 text-sm mb-6 font-bold uppercase tracking-wide">Trò chơi Kahoot Quiz trực tuyến lớp {studentClass}</p>

        {/* Podium Rank representation */}
        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 max-w-sm mx-auto mb-8 shadow-inner">
          <Award className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">XẾP HẠNG CHUNG CUỘC</span>
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-sans block mt-1">
            HẠNG #{playerRank}
          </span>
          <span className="text-slate-600 block text-sm font-extrabold mt-2">Tổng số điểm: {playerScoreObj?.score}</span>
        </div>

        {/* Competitor Board lists */}
        <div className="bg-slate-50 rounded-2xl border-2 border-slate-150 overflow-hidden mb-8 text-left shadow-sm">
          <div className="bg-slate-100/85 p-3 border-b border-slate-200 text-xs font-mono font-bold text-slate-500 flex justify-between">
            <span>HẠNG & THÍ SINH</span>
            <span>ĐIỂM SỐ CHUNG CUỘC</span>
          </div>
          <div className="divide-y divide-slate-200">
            {leaderboard.map((comp, idx) => (
              <div
                key={idx}
                className={`p-3.5 flex justify-between items-center text-sm ${
                  comp.isPlayer ? "bg-indigo-50 border-l-4 border-indigo-600 font-bold text-indigo-700" : "text-slate-600 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                  <span>{comp.name} {comp.isPlayer ? "(Bạn)" : ""}</span>
                </div>
                <span className="font-mono font-bold">{comp.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="bg-slate-100 text-slate-700 border border-slate-200 font-black px-6 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-xs uppercase tracking-wider"
          >
            Chơi Lại
          </button>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-md"
          >
            Trở Lại Danh Sách Game
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl relative animate-fade-in">
      {/* Top indicator ribbon */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-150">
        <div>
          <span className="text-xs font-mono text-red-600 uppercase font-black tracking-widest block">
            KAHOOT • CÂU HỎI {currentIdx + 1}/{data.questions.length}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        {/* Timed countdown bar */}
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-205 shadow-inner">
          <Clock className={`w-4 h-4 ${timeLeft < 4 ? "text-red-500 animate-pulse" : "text-red-500"}`} />
          <span className="text-sm font-mono font-black text-slate-700">{timeLeft}s</span>
        </div>
      </div>

      {/* Core Question Content */}
      <div className="bg-slate-50 p-8 rounded-2xl border-2 border-slate-100 text-center mb-8 shadow-inner relative overflow-hidden">
        <h2 className="text-base md:text-xl font-sans font-black leading-relaxed text-slate-800 text-left md:text-center">
          <MathText text={currentQuestion.question} />
        </h2>
      </div>

      {/* Kahoot Color/Shape Buttons Layout */}
      {!isAnswered ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const colorClass = KAHOOT_COLORS[idx];
            const shape = KAHOOT_SHAPES[idx];

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`flex items-center gap-4 text-left p-6 rounded-2xl border shadow-md transition-all duration-200 active:scale-[0.98] text-base font-sans font-black cursor-pointer ${colorClass}`}
              >
                <span className="text-2xl font-black w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center shrink-0">
                  {shape}
                </span>
                <MathText text={option} />
              </button>
            );
          })}
        </div>
      ) : (
        /* Explanations & Next Level panel */
        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-150 mb-8 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            {isCorrect ? (
              <span className="text-emerald-700 font-black text-xs uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                ✓ Trả lời chính xác!
              </span>
            ) : (
              <span className="text-red-600 font-black text-xs uppercase tracking-widest bg-red-50 px-3.5 py-1.5 rounded-full border border-red-200">
                ✗ Chưa chính xác
              </span>
            )}
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
            Đáp án đúng: <span className="text-slate-800 font-black"><MathText text={currentQuestion.options[currentQuestion.correctAnswer]} /></span>
          </p>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              Câu Tiếp Theo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer controls & live class list snippet */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-150 text-xs text-slate-400 font-bold">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Thoát
        </button>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="uppercase tracking-wider text-[10px]">Vị trí hiện tại của bạn: #{leaderboard.findIndex(c => c.isPlayer) + 1}</span>
        </div>
      </div>
    </div>
  );
}
