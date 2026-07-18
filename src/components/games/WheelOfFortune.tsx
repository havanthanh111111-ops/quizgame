/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCw, HelpCircle, Trophy, Sparkles, Check, AlertTriangle } from "lucide-react";
import { WheelOfFortuneData } from "../../types";
import { playSound } from "../../utils/sound";
import { MathText } from "../MathText";

interface Props {
  data: WheelOfFortuneData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

function cleanText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, "");
}

const WHEEL_SECTORS = [
  { label: "100 Điểm", value: 100, color: "from-blue-600 to-blue-500" },
  { label: "MẤT ĐIỂM 💥", value: -1, color: "from-red-600 to-red-500" },
  { label: "500 Điểm", value: 500, color: "from-green-600 to-green-500" },
  { label: "NHÂN ĐÔI ✖️", value: -2, color: "from-purple-600 to-purple-500" },
  { label: "200 Điểm", value: 200, color: "from-yellow-600 to-yellow-500" },
  { label: "MAY MẮN 🌟", value: 0, color: "from-amber-600 to-amber-500" },
  { label: "1000 Điểm", value: 1000, color: "from-emerald-600 to-emerald-500" },
  { label: "300 Điểm", value: 300, color: "from-teal-600 to-teal-500" }
];

export default function WheelOfFortune({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [puzzleScore, setPuzzleScore] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wheelState, setWheelState] = useState<"idle" | "spinning" | "landed">("idle");
  const [landedSector, setLandedSector] = useState<typeof WHEEL_SECTORS[0] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [directGuessInput, setDirectGuessInput] = useState("");
  const [showDirectGuess, setShowDirectGuess] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const activePuzzle = data.words[currentWordIdx];
  const cleanedWord = cleanText(activePuzzle.word);

  const spinWheel = () => {
    if (wheelState === "spinning") return;
    setWheelState("spinning");
    setLandedSector(null); // Clear previous landed sector immediately
    playSound.spin();

    const extraSpins = 5 + Math.floor(Math.random() * 5); // Spins
    const randomSectorIdx = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const degreePerSector = 360 / WHEEL_SECTORS.length;
    // Calculate precise angle based on current full spins to prevent angle and sector divergence
    const currentFullSpins = Math.floor(rotation / 360);
    const targetAngle = (currentFullSpins + extraSpins) * 360 + (randomSectorIdx * degreePerSector);

    setRotation(targetAngle);

    setTimeout(() => {
      const actualSector = WHEEL_SECTORS[(WHEEL_SECTORS.length - randomSectorIdx) % WHEEL_SECTORS.length];
      setLandedSector(actualSector);
      setWheelState("landed");

      // Apply instant sector effects
      if (actualSector.value === -1) {
        // Bankrupt / Mất điểm
        setPuzzleScore(0);
        setWheelState("idle");
        playSound.wrong();
      } else if (actualSector.value === -2) {
        // Double score
        setPuzzleScore((prev) => prev * 2);
        setWheelState("idle");
        playSound.correct();
      } else if (actualSector.value === 0) {
        // Lucky - lets you guess a letter for free (worth 300)
        // Just let state be landed, and handle points
        playSound.correct();
      } else {
        playSound.click();
      }
    }, 2500);
  };

  const guessLetter = (letter: string) => {
    if (wheelState !== "landed" && landedSector?.value !== 0) return;
    
    const cleanLetter = cleanText(letter);
    if (guessedLetters.includes(cleanLetter)) return;

    const updatedGuesses = [...guessedLetters, cleanLetter];
    setGuessedLetters(updatedGuesses);

    const occurrences = cleanedWord.split("").filter(l => l === cleanLetter).length;

    if (occurrences > 0) {
      // Landed points
      let pointPerOccurrence = landedSector?.value && landedSector.value > 0 ? landedSector.value : 300;
      setPuzzleScore((prev) => prev + (pointPerOccurrence * occurrences));
      playSound.correct();
    } else {
      // Wrong letter penalty or turn over
      playSound.wrong();
    }

    setWheelState("idle");
    setLandedSector(null);

    // Auto check if fully solved
    const solved = cleanedWord.split("").every(char => updatedGuesses.includes(char));
    if (solved) {
      handlePuzzleSolved();
    }
  };

  const handlePuzzleSolved = () => {
    const finalReward = puzzleScore + 500; // Solve bonus!
    setScore((prev) => prev + finalReward);
    setPuzzleScore(0);
    setGuessedLetters([]);
    playSound.win();

    if (currentWordIdx < data.words.length - 1) {
      setCurrentWordIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      onComplete(score + finalReward, data.words.length * 1000);
    }
  };

  const handleDirectGuess = () => {
    if (cleanText(directGuessInput) === cleanedWord) {
      // Guessed the whole word! Give all points + huge bonus
      const unrevealedLettersCount = cleanedWord.split("").filter(l => !guessedLetters.includes(l)).length;
      const solvedAward = puzzleScore + (unrevealedLettersCount * 500) + 1000;
      setScore((prev) => prev + solvedAward);
      setPuzzleScore(0);
      setGuessedLetters([]);
      setDirectGuessInput("");
      setShowDirectGuess(false);
      playSound.win();

      if (currentWordIdx < data.words.length - 1) {
        setCurrentWordIdx((prev) => prev + 1);
      } else {
        setIsFinished(true);
        onComplete(score + solvedAward, data.words.length * 1000);
      }
    } else {
      // Wrong keyword guess resets puzzle points and gives a warning
      setPuzzleScore(0);
      setShowDirectGuess(false);
      setDirectGuessInput("");
      playSound.fail();
    }
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-pulse" />

        <h2 className="text-3xl font-black mb-2 text-emerald-600 uppercase">QUAY XONG Ô CHỮ!</h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Thí sinh <span className="font-extrabold text-emerald-600">{studentName}</span> đã giải xong toàn bộ câu đố của Chiếc Nón Kỳ Diệu!
        </p>

        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 mb-8 max-w-xs mx-auto shadow-inner">
          <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-bounce" />
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM KHÁNH GIẢ</span>
          <span className="text-4xl font-black text-emerald-600 font-sans block mt-1">{score}</span>
        </div>

        <button
          onClick={onBack}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md uppercase text-xs tracking-wider"
        >
          Trở Lại Danh Sách Game
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl animate-fade-in">
      {/* Top statistics panel */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-150">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase font-black tracking-widest block">
            CHIẾC NÓN KỲ DIỆU • VÒNG {currentWordIdx + 1}/{data.words.length}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-black tracking-wider">ĐIỂM TỔNG TÍCH LŨY</span>
            <span className="text-sm font-black text-emerald-600">{score}</span>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-black tracking-wider">ĐIỂM VÒNG NÀY</span>
            <span className="text-sm font-black text-amber-600">{puzzleScore}</span>
          </div>
        </div>
      </div>

      {/* Clue/Hint display box */}
      <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 mb-6 relative overflow-hidden">
        <span className="text-[10px] font-mono font-black text-emerald-600 uppercase tracking-widest block mb-2">ĐỊNH NGHĨA CHỦ ĐỀ</span>
        <div className="text-base font-sans font-semibold text-slate-700"><MathText text={activePuzzle.clue} /></div>
      </div>

      {/* Letter Grid slots */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 shadow-inner">
        {activePuzzle.word.split("").map((char, idx) => {
          const isSpace = char === " ";
          const cleanChar = cleanText(char);
          const isGuessed = guessedLetters.includes(cleanChar) || !cleanChar;

          if (isSpace) {
            return <div key={idx} className="w-6 md:w-8 h-10 md:h-12 border-b-2 border-dashed border-slate-300" />;
          }

          return (
            <motion.div
              key={idx}
              className={`w-8 md:w-10 h-10 md:h-12 rounded-xl border flex items-center justify-center font-black font-mono text-lg md:text-xl transition-all duration-300 ${
                isGuessed
                  ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow shadow-emerald-200"
                  : "bg-white border-slate-200 text-transparent"
              }`}
            >
              {char}
            </motion.div>
          );
        })}
      </div>

      {/* Main interactive area: Wheel and Letter bank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Column: Spin interactive Wheel */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-slate-200 bg-slate-50 shadow-lg flex items-center justify-center overflow-hidden">
            {/* Spinning background sector slice segments */}
            <div
              className="absolute inset-0 transition-transform duration-[2.5s] ease-out flex items-center justify-center"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {WHEEL_SECTORS.map((sector, idx) => {
                const angle = 360 / WHEEL_SECTORS.length;
                return (
                  <div
                    key={idx}
                    className="absolute w-full h-full"
                    style={{ transform: `rotate(${idx * angle}deg)` }}
                  >
                    {/* Visual sector line */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-slate-200 transform -translate-x-1/2 origin-bottom" />
                    {/* Floating label */}
                    <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-white whitespace-nowrap bg-indigo-900/90 px-1.5 py-0.5 rounded-full shadow border border-indigo-800">
                      {sector.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Needle indicator pointer */}
            <div className="absolute top-0 z-20 transform -translate-y-1 bg-red-500 w-3 h-6 clip-path-needle border border-white" />

            {/* Central hub spin button */}
            <button
              onClick={spinWheel}
              disabled={wheelState === "spinning" || (landedSector !== null && landedSector.value >= 0)}
              className="absolute z-10 w-16 h-16 rounded-full bg-white border-2 border-slate-200 shadow-xl flex flex-col items-center justify-center hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCw className={`w-5 h-5 text-emerald-500 ${wheelState === "spinning" ? "animate-spin" : ""}`} />
              <span className="text-[9px] font-black font-sans uppercase mt-0.5 text-slate-500">QUAY</span>
            </button>
          </div>

          {/* Landing result text */}
          <div className="mt-4 text-center min-h-[40px]">
            {wheelState === "spinning" && (
              <p className="text-xs text-slate-500 font-mono animate-pulse font-bold uppercase tracking-wider">
                Đang quay nón kì diệu...
              </p>
            )}
            {wheelState !== "spinning" && landedSector && (
              <div className="animate-fade-in">
                {landedSector.value === -1 && (
                  <p className="text-sm font-bold text-red-600">
                    💥 Ôi không! Bạn đã quay vào ô {landedSector.label}! Điểm vòng này đã bị xóa sạch về 0. Hãy quay tiếp!
                  </p>
                )}
                {landedSector.value === -2 && (
                  <p className="text-sm font-bold text-purple-600">
                    ✖️ Tuyệt vời! Bạn quay vào ô {landedSector.label}! Điểm số vòng này đã được nhân đôi. Hãy quay tiếp!
                  </p>
                )}
                {landedSector.value === 0 && (
                  <div className="animate-bounce">
                    <span className="text-[10px] font-mono uppercase font-black text-yellow-600 block tracking-widest">LƯỢT QUAY LANDED</span>
                    <p className="text-sm font-bold text-slate-800">
                      🎁 May mắn! Bạn có quyền đoán 1 chữ cái miễn phí!
                    </p>
                  </div>
                )}
                {landedSector.value > 0 && (
                  <div className="animate-bounce">
                    <span className="text-[10px] font-mono uppercase font-black text-yellow-600 block tracking-widest">LƯỢT QUAY LANDED</span>
                    <p className="text-sm font-bold text-slate-800">
                      🎯 Lượt quay trị giá {landedSector.label}! Hãy chọn một chữ cái bên phải.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Keypad / Letter selection */}
        <div>
          {wheelState === "landed" || landedSector?.value === 0 ? (
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-3 uppercase font-black tracking-widest">CHỌN CHỮ CÁI ĐỂ ĐOÁN</span>
              <div className="grid grid-cols-6 gap-2">
                {"AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY".split("").map((letter) => {
                  const isGuessed = guessedLetters.includes(cleanText(letter));
                  return (
                    <button
                      key={letter}
                      onClick={() => guessLetter(letter)}
                      disabled={isGuessed}
                      className={`h-8 md:h-10 text-xs md:text-sm font-mono font-black rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isGuessed
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-white text-emerald-600 shadow-sm"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 text-center min-h-[160px] flex flex-col justify-center items-center shadow-inner">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-3 font-black tracking-widest">MỜI BẠN QUAY CHIẾC NÓN</span>
              <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed font-semibold">
                Bạn cần phải nhấn nút <strong className="text-indigo-600">QUAY</strong> ở tâm chiếc nón để xác định điểm số của lượt đoán trước khi có thể chọn chữ cái!
              </p>

              {/* Direct guess button toggle */}
              <button
                onClick={() => setShowDirectGuess(!showDirectGuess)}
                className="text-xs font-black text-emerald-600 hover:underline uppercase tracking-wide"
              >
                {showDirectGuess ? "Ẩn hộp nhập" : "Tôi muốn đoán trực tiếp cả từ khóa này!"}
              </button>

              {showDirectGuess && (
                <div className="flex gap-2 mt-4 w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="Viết liền không dấu..."
                    value={directGuessInput}
                    onChange={(e) => setDirectGuessInput(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-800 w-full font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleDirectGuess}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Gửi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
