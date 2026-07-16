/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc, 
  writeBatch, 
  query, 
  limit 
} from "firebase/firestore";
import fsSync from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Game question generation will fail.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Initialize Firestore
let db: any = null;
try {
  let firebaseConfig: any = null;

  // 1. Try loading from individual Environment Variables first
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID) {
    firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || ""
    };
    console.log("Firebase initialized using Environment Variables configuration.");
  } else {
    // 2. Fallback to local config file
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fsSync.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, "utf-8"));
      console.log("Firebase initialized using firebase-applet-config.json.");
    }
  }

  if (firebaseConfig) {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
    console.log("Firebase Firestore client SDK initialized successfully.");
  } else {
    console.warn("WARNING: Firebase Firestore configuration not found (neither Env Vars nor firebase-applet-config.json).");
  }
} catch (err) {
  console.error("Failed to initialize Firestore client SDK:", err);
}

const useTmp = !!process.env.VERCEL;
const LESSONS_FILE = useTmp ? path.join("/tmp", "db.json") : path.join(process.cwd(), "db.json");
const SCORES_FILE = useTmp ? path.join("/tmp", "scores.json") : path.join(process.cwd(), "scores.json");
const TEACHERS_FILE = useTmp ? path.join("/tmp", "teachers.json") : path.join(process.cwd(), "teachers.json");
const CLASSES_FILE = useTmp ? path.join("/tmp", "classes.json") : path.join(process.cwd(), "classes.json");
const ADMIN_CONFIG_FILE = useTmp ? path.join("/tmp", "admin_config.json") : path.join(process.cwd(), "admin_config.json");

// Helper to load/save admin config
async function loadAdminConfig() {
  if (db) {
    try {
      const adminDocRef = doc(db, "configs", "admin");
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists()) {
        const config = adminSnap.data();
        // Update local cache asynchronously
        fs.writeFile(ADMIN_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8").catch(() => {});
        return config;
      }
    } catch (error) {
      console.error("Failed to load admin config from Firestore, falling back to local file:", error);
    }
  }

  try {
    let data;
    try {
      data = await fs.readFile(ADMIN_CONFIG_FILE, "utf-8");
    } catch {
      data = await fs.readFile(path.join(process.cwd(), "admin_config.json"), "utf-8");
    }
    return JSON.parse(data);
  } catch {
    const defaultConfig = { passcode: "admin123" };
    await fs.writeFile(ADMIN_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), "utf-8").catch(() => {});
    return defaultConfig;
  }
}

async function saveAdminConfig(config: any) {
  await fs.writeFile(ADMIN_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8").catch(() => {});
  if (db) {
    try {
      await setDoc(doc(db, "configs", "admin"), config);
      console.log("Saved admin config to Firestore.");
    } catch (err) {
      console.error("Failed to save admin config to Firestore:", err);
    }
  }
}

// Helper to load classes
async function loadClasses() {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "classes"));
      const classes: any[] = [];
      snapshot.forEach((doc) => {
        classes.push(doc.data());
      });
      classes.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      
      // Update local cache asynchronously
      fs.writeFile(CLASSES_FILE, JSON.stringify(classes, null, 2), "utf-8").catch(() => {});
      
      return classes;
    } catch (error) {
      console.error("Failed to load classes from Firestore, falling back to local file:", error);
    }
  }

  try {
    let data;
    try {
      data = await fs.readFile(CLASSES_FILE, "utf-8");
    } catch {
      data = await fs.readFile(path.join(process.cwd(), "classes.json"), "utf-8");
    }
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to save classes
async function saveClasses(classes: any[]) {
  await fs.writeFile(CLASSES_FILE, JSON.stringify(classes, null, 2), "utf-8").catch(() => {});

  if (db) {
    try {
      const batch = writeBatch(db);
      const batchClasses = classes.slice(0, 450);
      for (const cl of batchClasses) {
        const docRef = doc(db, "classes", cl.code);
        batch.set(docRef, cl);
      }
      await batch.commit();
      console.log(`Saved ${batchClasses.length} classes to Firestore.`);
    } catch (error) {
      console.error("Failed to save classes to Firestore:", error);
    }
  }
}

// Helper to load teachers
async function loadTeachers() {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "teachers"));
      const teachers: any[] = [];
      snapshot.forEach((doc) => {
        teachers.push(doc.data());
      });
      // Sort by creation date
      teachers.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      
      // Update local cache asynchronously
      fs.writeFile(TEACHERS_FILE, JSON.stringify(teachers, null, 2), "utf-8").catch(() => {});
      
      return teachers;
    } catch (error) {
      console.error("Failed to load teachers from Firestore, falling back to local file:", error);
    }
  }

  try {
    let data;
    try {
      data = await fs.readFile(TEACHERS_FILE, "utf-8");
    } catch {
      data = await fs.readFile(path.join(process.cwd(), "teachers.json"), "utf-8");
    }
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to save teachers
async function saveTeachers(teachers: any[]) {
  await fs.writeFile(TEACHERS_FILE, JSON.stringify(teachers, null, 2), "utf-8").catch(() => {});

  if (db) {
    try {
      const batch = writeBatch(db);
      const batchTeachers = teachers.slice(0, 450);
      for (const teacher of batchTeachers) {
        const docRef = doc(db, "teachers", teacher.code);
        batch.set(docRef, teacher);
      }
      await batch.commit();
      console.log(`Saved ${batchTeachers.length} teachers to Firestore.`);
    } catch (error) {
      console.error("Failed to save teachers to Firestore:", error);
    }
  }
}

// Helper to load lessons
async function loadLessons() {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "lessons"));
      const lessons: any[] = [];
      snapshot.forEach((doc) => {
        lessons.push(doc.data());
      });
      // Sort by creation date
      lessons.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      
      // Update local cache asynchronously so it stays in sync
      fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2), "utf-8").catch(() => {});
      
      return lessons;
    } catch (error) {
      console.error("Failed to load lessons from Firestore, falling back to local file:", error);
    }
  }

  try {
    let data;
    try {
      data = await fs.readFile(LESSONS_FILE, "utf-8");
    } catch {
      data = await fs.readFile(path.join(process.cwd(), "db.json"), "utf-8");
    }
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to save lessons (batch write for fallback/init sync)
async function saveLessons(lessons: any[]) {
  await fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2), "utf-8").catch(() => {});

  if (db) {
    try {
      const batch = writeBatch(db);
      // Ensure we don't exceed batch write limits (500)
      const batchLessons = lessons.slice(0, 450);
      for (const lesson of batchLessons) {
        const docRef = doc(db, "lessons", lesson.id);
        batch.set(docRef, lesson);
      }
      await batch.commit();
      console.log(`Saved ${batchLessons.length} lessons to Firestore.`);
    } catch (error) {
      console.error("Failed to save lessons to Firestore:", error);
    }
  }
}

// Helper to load scores
async function loadScores() {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "scores"));
      const scores: any[] = [];
      snapshot.forEach((doc) => {
        scores.push(doc.data());
      });
      // Sort scores descending
      scores.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
      
      // Update local cache asynchronously so it stays in sync
      fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2), "utf-8").catch(() => {});
      
      return scores;
    } catch (error) {
      console.error("Failed to load scores from Firestore, falling back to local file:", error);
    }
  }

  try {
    let data;
    try {
      data = await fs.readFile(SCORES_FILE, "utf-8");
    } catch {
      data = await fs.readFile(path.join(process.cwd(), "scores.json"), "utf-8");
    }
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to save scores (batch write for fallback/init sync)
async function saveScores(scores: any[]) {
  await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2), "utf-8").catch(() => {});

  if (db) {
    try {
      const batch = writeBatch(db);
      // Limit to stay below batch limits
      const batchScores = scores.slice(0, 450);
      for (const score of batchScores) {
        const docRef = doc(db, "scores", score.id);
        batch.set(docRef, score);
      }
      await batch.commit();
      console.log(`Saved ${batchScores.length} scores to Firestore.`);
    } catch (error) {
      console.error("Failed to save scores to Firestore:", error);
    }
  }
}

// Ensure database files exist and sync local data to Firestore if Firestore is empty
async function initDb() {
  const defaultTeachers = [
    { code: "CHUNG", name: "Hệ thống chung", createdAt: new Date().toISOString() },
    { code: "THAY_MINH", name: "Thầy Hùng Minh (Toán - Khoa học)", createdAt: new Date().toISOString() },
    { code: "CO_VY", name: "Cô Khánh Vy (Tiếng Anh - Tiếng Việt)", createdAt: new Date().toISOString() }
  ];

  const defaultClasses = [
    { code: "CHUNG", name: "Lớp học mẫu Hệ thống", teacherCode: "CHUNG", assignedLessonIds: [], createdAt: new Date().toISOString() }
  ];

  let localTeachers: any[] = [];
  try {
    await fs.access(TEACHERS_FILE);
    const data = await fs.readFile(TEACHERS_FILE, "utf-8");
    localTeachers = JSON.parse(data);
  } catch {
    localTeachers = defaultTeachers;
    await fs.writeFile(TEACHERS_FILE, JSON.stringify(localTeachers, null, 2), "utf-8");
  }

  let localClasses: any[] = [];
  try {
    await fs.access(CLASSES_FILE);
    const data = await fs.readFile(CLASSES_FILE, "utf-8");
    localClasses = JSON.parse(data);
  } catch {
    localClasses = defaultClasses;
    await fs.writeFile(CLASSES_FILE, JSON.stringify(localClasses, null, 2), "utf-8");
  }

  let localLessons: any[] = [];
  try {
    await fs.access(LESSONS_FILE);
    const data = await fs.readFile(LESSONS_FILE, "utf-8");
    localLessons = JSON.parse(data);
  } catch {
    await fs.writeFile(LESSONS_FILE, "[]", "utf-8");
  }

  let localScores: any[] = [];
  try {
    await fs.access(SCORES_FILE);
    const data = await fs.readFile(SCORES_FILE, "utf-8");
    localScores = JSON.parse(data);
  } catch {
    await fs.writeFile(SCORES_FILE, "[]", "utf-8");
  }

  if (db) {
    // 1. Teachers Sync
    try {
      const teacherSnapshot = await getDocs(collection(db, "teachers"));
      if (!teacherSnapshot.empty) {
        console.log("Firestore teachers found. Syncing to local file...");
        const remoteTeachers: any[] = [];
        teacherSnapshot.forEach((doc) => remoteTeachers.push(doc.data()));
        remoteTeachers.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        await fs.writeFile(TEACHERS_FILE, JSON.stringify(remoteTeachers, null, 2), "utf-8");
        console.log(`Synced ${remoteTeachers.length} teachers from Firestore to local.`);
      } else if (localTeachers.length > 0) {
        console.log("Firestore teachers collection is empty. Seeding from local...");
        const batch = writeBatch(db);
        for (const teacher of localTeachers) {
          const docRef = doc(db, "teachers", teacher.code);
          batch.set(docRef, teacher);
        }
        await batch.commit();
        console.log("Seeded teachers successfully.");
      }
    } catch (error) {
      console.error("Failed to seed/sync teachers with Firestore:", error);
    }

    // 2. Classes Sync
    try {
      const classSnapshot = await getDocs(collection(db, "classes"));
      if (!classSnapshot.empty) {
        console.log("Firestore classes found. Syncing to local file...");
        const remoteClasses: any[] = [];
        classSnapshot.forEach((doc) => remoteClasses.push(doc.data()));
        remoteClasses.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        await fs.writeFile(CLASSES_FILE, JSON.stringify(remoteClasses, null, 2), "utf-8");
        console.log(`Synced ${remoteClasses.length} classes from Firestore to local.`);
      } else if (localClasses.length > 0) {
        console.log("Firestore classes collection is empty. Seeding from local...");
        const batch = writeBatch(db);
        for (const cl of localClasses) {
          const docRef = doc(db, "classes", cl.code);
          batch.set(docRef, cl);
        }
        await batch.commit();
        console.log("Seeded classes successfully.");
      }
    } catch (error) {
      console.error("Failed to seed/sync classes with Firestore:", error);
    }

    // 3. Lessons Sync
    try {
      const lessonSnapshot = await getDocs(collection(db, "lessons"));
      if (!lessonSnapshot.empty) {
        console.log("Firestore lessons found. Syncing to local file...");
        const remoteLessons: any[] = [];
        lessonSnapshot.forEach((doc) => remoteLessons.push(doc.data()));
        remoteLessons.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        await fs.writeFile(LESSONS_FILE, JSON.stringify(remoteLessons, null, 2), "utf-8");
        console.log(`Synced ${remoteLessons.length} lessons from Firestore to local.`);
      } else if (localLessons.length > 0) {
        console.log("Firestore lessons collection is empty. Seeding from local...");
        const batch = writeBatch(db);
        for (const lesson of localLessons) {
          const docRef = doc(db, "lessons", lesson.id);
          batch.set(docRef, lesson);
        }
        await batch.commit();
        console.log("Seeded lessons successfully.");
      }
    } catch (error) {
      console.error("Failed to seed/sync lessons with Firestore:", error);
    }

    // 4. Scores Sync
    try {
      const scoreSnapshot = await getDocs(collection(db, "scores"));
      if (!scoreSnapshot.empty) {
        console.log("Firestore scores found. Syncing to local file...");
        const remoteScores: any[] = [];
        scoreSnapshot.forEach((doc) => remoteScores.push(doc.data()));
        remoteScores.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
        await fs.writeFile(SCORES_FILE, JSON.stringify(remoteScores, null, 2), "utf-8");
        console.log(`Synced ${remoteScores.length} scores from Firestore to local.`);
      } else if (localScores.length > 0) {
        console.log("Firestore scores collection is empty. Seeding from local...");
        const batch = writeBatch(db);
        for (const score of localScores) {
          const docRef = doc(db, "scores", score.id);
          batch.set(docRef, score);
        }
        await batch.commit();
        console.log("Seeded scores successfully.");
      }
    } catch (error) {
      console.error("Failed to seed/sync scores with Firestore:", error);
    }

    // 5. Admin Config Sync
    try {
      const adminDocRef = doc(db, "configs", "admin");
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists()) {
        console.log("Firestore admin config found. Syncing to local file...");
        await fs.writeFile(ADMIN_CONFIG_FILE, JSON.stringify(adminSnap.data(), null, 2), "utf-8");
      } else {
        console.log("Firestore admin config is empty. Seeding with default or local...");
        let passcode = "admin123";
        try {
          const localData = JSON.parse(await fs.readFile(ADMIN_CONFIG_FILE, "utf-8"));
          passcode = localData.passcode || "admin123";
        } catch {
          await fs.writeFile(ADMIN_CONFIG_FILE, JSON.stringify({ passcode }, null, 2), "utf-8");
        }
        await setDoc(adminDocRef, { passcode });
      }
    } catch (error) {
      console.error("Failed to seed/sync admin config with Firestore:", error);
    }
  }
}

if (!process.env.VERCEL) {
  initDb().catch(console.error);
} else {
  console.log("Running in Vercel. Skipping initDb seeding/synchronization on startup.");
}

// API: Get all lessons metadata (no gameData to keep response small)
app.get("/api/lessons", async (req, res) => {
  try {
    const lessons = await loadLessons();
    const { teacherCode } = req.query;
    
    let filteredLessons = lessons;
    if (teacherCode) {
      const codeStr = String(teacherCode).trim().toUpperCase();
      if (codeStr !== "CHUNG" && codeStr !== "ALL") {
        filteredLessons = lessons.filter((l: any) => 
          l.teacherCode && l.teacherCode.trim().toUpperCase() === codeStr
        );
      } else {
        filteredLessons = lessons.filter((l: any) => 
          !l.teacherCode || l.teacherCode.trim().toUpperCase() === "CHUNG"
        );
      }
    }

    const metadata = filteredLessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      subject: l.subject,
      grade: l.grade,
      createdAt: l.createdAt,
      gamesGenerated: l.gamesGenerated || {},
      teacherCode: l.teacherCode,
      teacherName: l.teacherName,
      folderId: l.folderId || null,
    }));
    res.json(metadata);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get specific lesson with all its generated games
app.get("/api/lessons/:id", async (req, res) => {
  try {
    const lessons = await loadLessons();
    const lesson = lessons.find((l: any) => l.id === req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create a new lesson
app.post("/api/lessons", async (req, res) => {
  try {
    const { title, subject, grade, content, teacherCode, teacherName, folderId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const lessons = await loadLessons();
    const newLesson = {
      id: "lesson_" + Date.now().toString(36),
      title,
      subject: subject || "Chung",
      grade: grade || "Mọi khối",
      content,
      createdAt: new Date().toISOString(),
      gamesGenerated: {},
      gameData: {},
      teacherCode: teacherCode ? teacherCode.trim().toUpperCase() : "CHUNG",
      teacherName: teacherName ? teacherName.trim() : "Giáo viên Hệ thống",
      folderId: folderId || null,
    };

    lessons.push(newLesson);
    
    // Save to local cache file
    await fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2), "utf-8");

    // Write to Firestore directly
    if (db) {
      try {
        await setDoc(doc(db, "lessons", newLesson.id), newLesson);
        console.log(`Created lesson ${newLesson.id} in Firestore.`);
      } catch (err) {
        console.error("Failed to save created lesson to Firestore:", err);
      }
    }

    res.status(201).json(newLesson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a lesson
app.delete("/api/lessons/:id", async (req, res) => {
  try {
    const lessons = await loadLessons();
    const filtered = lessons.filter((l: any) => l.id !== req.params.id);
    if (lessons.length === filtered.length) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // Save to local cache file
    await fs.writeFile(LESSONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");

    // Delete from Firestore directly
    if (db) {
      try {
        await deleteDoc(doc(db, "lessons", req.params.id));
        console.log(`Deleted lesson ${req.params.id} from Firestore.`);
      } catch (err) {
        console.error("Failed to delete lesson from Firestore:", err);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Submit a student score
app.post("/api/scores", async (req, res) => {
  try {
    const scoreData = req.body;
    if (!scoreData.studentName || !scoreData.lessonId || !scoreData.gameKey) {
      return res.status(400).json({ error: "Name, lessonId, and gameKey are required" });
    }

    const scores = await loadScores();
    const newRecord = {
      id: "score_" + Date.now().toString(36),
      ...scoreData,
      completedAt: new Date().toISOString(),
    };
    scores.push(newRecord);

    // Save to local cache file
    await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2), "utf-8");

    // Write to Firestore directly
    if (db) {
      try {
        await setDoc(doc(db, "scores", newRecord.id), newRecord);
        console.log(`Saved score ${newRecord.id} to Firestore.`);
      } catch (err) {
        console.error("Failed to save score directly to Firestore:", err);
      }
    }

    res.status(201).json(newRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get scores leaderboard
app.get("/api/scores", async (req, res) => {
  try {
    const scores = await loadScores();
    const { teacherCode, classCode } = req.query;
    
    let filteredScores = scores;
    if (teacherCode) {
      const codeStr = String(teacherCode).trim().toUpperCase();
      if (codeStr !== "CHUNG" && codeStr !== "ALL") {
        filteredScores = filteredScores.filter((s: any) => 
          s.teacherCode && s.teacherCode.trim().toUpperCase() === codeStr
        );
      }
    }
    if (classCode) {
      const classStr = String(classCode).trim().toUpperCase();
      filteredScores = filteredScores.filter((s: any) => 
        s.classCode && s.classCode.trim().toUpperCase() === classStr
      );
    }
    res.json(filteredScores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get all registered teachers (Centralized Directory)
app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await loadTeachers();
    // Do not return password to client
    const safeTeachers = teachers.map((t: any) => ({
      code: t.code,
      name: t.name,
      createdAt: t.createdAt,
      folders: t.folders || [],
      hasPassword: !!t.password
    }));
    res.json(safeTeachers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Verify teacher password on login
app.post("/api/teachers/verify", async (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Mã giáo viên là bắt buộc!" });
    }
    const codeUpper = code.trim().toUpperCase();
    const teachers = await loadTeachers();
    const found = teachers.find((t: any) => t.code === codeUpper);
    if (!found) {
      return res.status(404).json({ error: "Không tìm thấy giáo viên với mã này!" });
    }

    if (found.password && found.password !== password) {
      return res.status(401).json({ error: "Mật khẩu truy cập không chính xác!" });
    }

    res.json({
      success: true,
      code: found.code,
      name: found.name,
      hasPassword: !!found.password
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Register a new teacher and unique class code (Centralized registration & validation)
app.post("/api/teachers", async (req, res) => {
  try {
    const { name, code, password } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: "Họ tên Giáo viên và Mã lớp là bắt buộc!" });
    }

    const codeUpper = code.trim().toUpperCase();
    const nameTrim = name.trim();

    if (codeUpper === "ALL") {
      return res.status(400).json({ error: "Mã lớp 'ALL' là từ khóa bảo mật của hệ thống, vui lòng chọn mã khác!" });
    }

    const teachers = await loadTeachers();
    const exists = teachers.some((t: any) => t.code === codeUpper);
    if (exists) {
      return res.status(400).json({ error: `Mã lớp '${codeUpper}' đã được giáo viên khác đăng ký sử dụng trong hệ thống tập trung!` });
    }

    const newTeacher = {
      code: codeUpper,
      name: nameTrim,
      createdAt: new Date().toISOString(),
      folders: [],
      password: password ? password.trim() : undefined,
    };

    teachers.push(newTeacher);
    await saveTeachers(teachers);

    res.status(201).json({
      code: newTeacher.code,
      name: newTeacher.name,
      createdAt: newTeacher.createdAt,
      hasPassword: !!newTeacher.password
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update a teacher's details (e.g. name, folders, or password)
app.put("/api/teachers/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { name, folders, password } = req.body;
    const codeUpper = code.trim().toUpperCase();

    const teachers = await loadTeachers();
    const idx = teachers.findIndex((t: any) => t.code === codeUpper);
    if (idx === -1) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (name !== undefined) teachers[idx].name = name.trim();
    if (folders !== undefined) teachers[idx].folders = folders;
    if (password !== undefined) teachers[idx].password = password ? password.trim() : undefined;

    await saveTeachers(teachers);
    res.json({
      code: teachers[idx].code,
      name: teachers[idx].name,
      folders: teachers[idx].folders,
      hasPassword: !!teachers[idx].password
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a teacher (Super Admin feature)
app.delete("/api/teachers/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const codeUpper = code.trim().toUpperCase();

    const teachers = await loadTeachers();
    const filtered = teachers.filter((t: any) => t.code !== codeUpper);
    if (teachers.length === filtered.length) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    await saveTeachers(filtered);

    if (db) {
      try {
        await deleteDoc(doc(db, "teachers", codeUpper));
        console.log(`Deleted teacher ${codeUpper} from Firestore.`);
      } catch (err) {
        console.error("Failed to delete teacher from Firestore:", err);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Verify super admin passcode
app.post("/api/admin/verify", async (req, res) => {
  try {
    const { passcode } = req.body;
    const config = await loadAdminConfig();
    if (config.passcode === passcode) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Mật mã quản trị viên tối cao không chính xác!" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update super admin passcode
app.put("/api/admin/passcode", async (req, res) => {
  try {
    const { currentPasscode, newPasscode } = req.body;
    if (!newPasscode || !newPasscode.trim()) {
      return res.status(400).json({ error: "Mật mã mới không được để trống!" });
    }
    const config = await loadAdminConfig();
    if (config.passcode !== currentPasscode) {
      return res.status(401).json({ error: "Mật mã hiện tại không chính xác!" });
    }
    config.passcode = newPasscode.trim();
    await saveAdminConfig(config);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get class codes (Classes)
app.get("/api/classes", async (req, res) => {
  try {
    const classes = await loadClasses();
    const { teacherCode, code } = req.query;

    if (code) {
      const singleClass = classes.find((c: any) => c.code.trim().toUpperCase() === String(code).trim().toUpperCase());
      if (!singleClass) {
        return res.status(404).json({ error: "Lớp học không tồn tại!" });
      }
      return res.json(singleClass);
    }

    if (teacherCode) {
      const codeStr = String(teacherCode).trim().toUpperCase();
      const filtered = classes.filter((c: any) => c.teacherCode && c.teacherCode.trim().toUpperCase() === codeStr);
      return res.json(filtered);
    }

    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create a new class code
app.post("/api/classes", async (req, res) => {
  try {
    const { code, name, teacherCode, assignedLessonIds } = req.body;
    if (!code || !name || !teacherCode) {
      return res.status(400).json({ error: "Mã lớp, tên lớp và mã giáo viên là bắt buộc!" });
    }

    const codeUpper = code.trim().toUpperCase();
    if (codeUpper === "ALL") {
      return res.status(400).json({ error: "Mã lớp 'ALL' không được phép sử dụng." });
    }

    const classes = await loadClasses();
    const exists = classes.some((c: any) => c.code === codeUpper);
    if (exists) {
      return res.status(400).json({ error: `Mã lớp '${codeUpper}' đã tồn tại!` });
    }

    const newClass = {
      code: codeUpper,
      name: name.trim(),
      teacherCode: teacherCode.trim().toUpperCase(),
      assignedLessonIds: assignedLessonIds || [],
      createdAt: new Date().toISOString()
    };

    classes.push(newClass);
    await saveClasses(classes);

    res.status(201).json(newClass);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update a class code (assign lessons or update name)
app.put("/api/classes/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { name, assignedLessonIds } = req.body;
    const codeUpper = code.trim().toUpperCase();

    const classes = await loadClasses();
    const idx = classes.findIndex((c: any) => c.code === codeUpper);
    if (idx === -1) {
      return res.status(404).json({ error: "Class not found" });
    }

    if (name !== undefined) classes[idx].name = name.trim();
    if (assignedLessonIds !== undefined) classes[idx].assignedLessonIds = assignedLessonIds;

    await saveClasses(classes);
    res.json(classes[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a class code
app.delete("/api/classes/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const codeUpper = code.trim().toUpperCase();

    const classes = await loadClasses();
    const filtered = classes.filter((c: any) => c.code !== codeUpper);
    if (classes.length === filtered.length) {
      return res.status(404).json({ error: "Class not found" });
    }

    await saveClasses(filtered);

    if (db) {
      try {
        await deleteDoc(doc(db, "classes", codeUpper));
        console.log(`Deleted class ${codeUpper} from Firestore.`);
      } catch (err) {
        console.error("Failed to delete class from Firestore:", err);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update general lesson properties (metadata and folderId assignment)
app.put("/api/lessons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, grade, content, folderId } = req.body;

    const lessons = await loadLessons();
    const idx = lessons.findIndex((l: any) => l.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const lesson = lessons[idx];
    if (title !== undefined) lesson.title = title;
    if (subject !== undefined) lesson.subject = subject;
    if (grade !== undefined) lesson.grade = grade;
    if (content !== undefined) lesson.content = content;
    if (folderId !== undefined) lesson.folderId = folderId; // Can be string or null

    // Save to local cache file
    await fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2), "utf-8");

    // Write to Firestore directly
    if (db) {
      try {
        await setDoc(doc(db, "lessons", id), lesson);
        console.log(`Updated lesson ${id} details in Firestore.`);
      } catch (err) {
        console.error("Failed to save updated lesson details to Firestore:", err);
      }
    }

    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Manually update game quiz data
app.put("/api/lessons/:id/game/:gameKey", async (req, res) => {
  const { id, gameKey } = req.params;
  const { gameData } = req.body;
  try {
    const lessons = await loadLessons();
    const lessonIdx = lessons.findIndex((l: any) => l.id === id);
    if (lessonIdx === -1) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const lesson = lessons[lessonIdx];
    if (!lesson.gameData) {
      lesson.gameData = {};
    }
    if (!lesson.gamesGenerated) {
      lesson.gamesGenerated = {};
    }

    lesson.gameData[gameKey] = gameData;
    lesson.gamesGenerated[gameKey] = true;

    // Save to local cache file
    await fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2), "utf-8");

    // Write to Firestore directly
    if (db) {
      try {
        await setDoc(doc(db, "lessons", id), lesson);
        console.log(`Manually updated game ${gameKey} for lesson ${id} in Firestore.`);
      } catch (err) {
        console.error("Failed to save manually edited game data to Firestore:", err);
      }
    }

    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Generate quiz content for a specific game on a specific lesson using Gemini
app.post("/api/lessons/:id/generate/:gameKey", async (req, res) => {
  const { id, gameKey } = req.params;
  const { customPrompt } = req.body || {};
  try {
    if (!apiKey) {
      return res.status(500).json({ error: "API key is missing in server environment. Configure it in Secrets." });
    }

    const lessons = await loadLessons();
    const lessonIdx = lessons.findIndex((l: any) => l.id === id);
    if (lessonIdx === -1) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const lesson = lessons[lessonIdx];
    const lessonContent = lesson.content;

    let systemInstruction = "Bạn là một giáo viên chuyên nghiệp và chuyên gia thiết kế trò chơi giáo dục bằng Tiếng Việt. Nhiệm vụ của bạn là đọc nội dung bài học được cung cấp và thiết kế bộ câu hỏi/nội dung trò chơi tương ứng theo đúng cấu trúc dữ liệu JSON được yêu cầu. Đảm bảo tất cả câu hỏi và phản hồi bằng Tiếng Việt chuẩn xác, mang tính giáo dục cao.";
    let prompt = "";
    let responseSchema: any = null;

    // Build the specific prompt and schema based on the gameKey
    switch (gameKey) {
      case "goldenBell":
        prompt = `Hãy tạo 10 câu hỏi trắc nghiệm cho trò chơi "Rung Chuông Vàng" dựa trên nội dung bài học sau:\n\n${lessonContent}\n\nYêu cầu câu hỏi có độ khó tăng dần từ dễ đến khó. Trả về định dạng JSON phù hợp.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: "Câu hỏi rõ ràng, chính xác" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Mảng gồm đúng 4 lựa chọn trả lời"
                  },
                  correctAnswer: { type: Type.INTEGER, description: "Chỉ số của câu trả lời đúng (0 đến 3)" },
                  explanation: { type: Type.STRING, description: "Lời giải thích ngắn gọn tại sao đáp án đó đúng" }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        };
        break;

      case "millionaire":
        prompt = `Hãy tạo đúng 15 câu hỏi trắc nghiệm cho trò chơi "Ai Là Triệu Phú" dựa trên nội dung bài học này:\n\n${lessonContent}\n\nChia làm 3 phân khúc độ khó tăng dần: câu 1-5 cực kì dễ, câu 6-10 trung bình, câu 11-15 cực khó học búa. Cung cấp đầy đủ 3 sự trợ giúp: Gọi điện thoại cho người thân (gợi ý hài hước), Khán giả trợ giúp (tỷ lệ phần trăm hợp lý có đáp án đúng chiếm đa số), 50-50 (gồm chỉ số đáp án đúng và 1 chỉ số sai). Trả về JSON phù hợp.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  level: { type: Type.INTEGER, description: "Số thứ tự câu hỏi từ 1 đến 15" },
                  explanation: { type: Type.STRING },
                  hints: {
                    type: Type.OBJECT,
                    properties: {
                      callFriend: { type: Type.STRING, description: "Gợi ý dí dỏm bằng Tiếng Việt" },
                      audiencePoll: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Mảng 4 số phần trăm cộng lại bằng 100" },
                      fiftyFifty: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Mảng gồm 2 số nguyên là chỉ số đáp án đúng và 1 đáp án sai bất kỳ" }
                    },
                    required: ["callFriend", "audiencePoll", "fiftyFifty"]
                  }
                },
                required: ["id", "question", "options", "correctAnswer", "level", "explanation", "hints"]
              }
            }
          },
          required: ["questions"]
        };
        break;

      case "olympia":
        prompt = `Hãy thiết kế trọn bộ câu hỏi "Đường Lên Đỉnh Olympia" thu nhỏ dựa trên bài học sau:\n\n${lessonContent}\n\nYêu cầu đầy đủ 4 phần thi:
1. Khởi động (round1): Gồm 10 câu hỏi ngắn hỏi nhanh đáp gọn. Có sẵn 4 lựa chọn trắc nghiệm để học sinh dễ nhấn trực tuyến.
2. Vượt chướng ngại vật (round2): Gồm 1 từ khóa bí ẩn 'keyword' (từ 6 đến 12 ký tự, không dấu, viết hoa) liên quan mật thiết đến bài học. Và đúng 4 câu hỏi gợi ý hàng ngang (clues). Mỗi câu hỏi hàng ngang có câu trả lời 'rowWord' (không dấu, viết hoa) có độ dài khớp với 'answerLength'. Các từ hàng ngang phải chứa chữ cái nằm trong từ khóa bí ẩn hoặc gợi ý mạnh mẽ đến nó.
3. Tăng tốc (round3): Gồm 4 câu hỏi trắc nghiệm tư duy nhanh.
4. Về đích (round4): Gồm 3 câu hỏi sâu rộng lần lượt có số điểm 20, 30, 40 điểm.
Trả về JSON cấu trúc chính xác.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            round1: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING, description: "Từ khóa đáp án chính xác hoặc chữ đáp án" }
                },
                required: ["id", "question", "options", "answer"]
              }
            },
            round2: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING, description: "Từ khóa chính chướng ngại vật cần tìm, viết hoa không dấu, không khoảng cách" },
                cluesCount: { type: Type.INTEGER, description: "Luôn là 4" },
                clues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING, description: "Câu hỏi hàng ngang số i" },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.INTEGER },
                      answerLength: { type: Type.INTEGER, description: "Độ dài ký tự của câu trả lời" },
                      rowWord: { type: Type.STRING, description: "Từ đáp án hàng ngang, viết hoa không dấu" }
                    },
                    required: ["question", "options", "correctAnswer", "answerLength", "rowWord"]
                  }
                }
              },
              required: ["keyword", "cluesCount", "clues"]
            },
            round3: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            },
            round4: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  points: { type: Type.INTEGER, description: "20, 30, hoặc 40" },
                  question: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "points", "question", "correctAnswer", "options", "explanation"]
              }
            }
          },
          required: ["round1", "round2", "round3", "round4"]
        };
        break;

      case "wheelOfFortune":
        prompt = `Hãy chọn ra 5 thuật ngữ/từ khóa học thuật cốt lõi (từ 5 đến 15 chữ cái, VIẾT HOA KHÔNG DẤU, KHÔNG CHỨA KÝ TỰ ĐẶC BIỆT) trong bài học sau để chơi "Chiếc Nón Kỳ Diệu":\n\n${lessonContent}\n\nMỗi từ kèm theo 1 định nghĩa hoặc câu gợi ý cực kì xúc tích để học sinh đoán chữ cái. Trả về JSON phù hợp.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "Từ khóa viết hoa không dấu, ví dụ: 'DIENBIENPHU' hoặc 'NGUYENTU'" },
                  clue: { type: Type.STRING, description: "Gợi ý / định nghĩa liên quan đến từ này" }
                },
                required: ["word", "clue"]
              }
            }
          },
          required: ["words"]
        };
        break;

      case "pictogram":
        prompt = `Hãy thiết kế trò chơi "Đuổi Hình Bắt Chữ" gồm 6 câu đố trí tuệ từ bài học sau:\n\n${lessonContent}\n\nMỗi câu đố tương ứng một khái niệm/từ khóa quan trọng (VIẾT HOA KHÔNG DẤU). Bạn cần tạo liên tưởng bằng cách:
1. 'emojis': Một tổ hợp từ 2-4 emojis biểu thị nghĩa đen hoặc nghĩa bóng để ghép thành từ đó (Ví dụ: "Học đường" = "📖🏫", "Điện Biên Phủ" = "⚡⛰️🏰").
2. 'visualDescription': Một mô tả hình ảnh cực kỳ sáng tạo, đố chữ, lôi cuốn diễn tả lại bức tranh đố hình đó (Ví dụ: "Hình ảnh một tia chớp đánh vào một ngọn núi bên cạnh chiếc thành trì cổ xưa").
3. 'explanation': Giải thích vì sao bức hình đó lại liên kết với khái niệm.
Trả về JSON tương ứng.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            puzzles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "Từ khóa viết hoa không dấu" },
                  emojis: { type: Type.STRING, description: "Chuỗi 2-4 emojis ghép nghĩa" },
                  visualDescription: { type: Type.STRING, description: "Riddles / miêu tả hình vẽ liên tưởng hấp dẫn" },
                  explanation: { type: Type.STRING, description: "Giải thích kiến thức liên quan" }
                },
                required: ["word", "emojis", "visualDescription", "explanation"]
              }
            }
          },
          required: ["puzzles"]
        };
        break;

      case "kahoot":
        prompt = `Hãy tạo 10 câu hỏi trắc nghiệm tốc độ kiểu "Kahoot Quiz" từ bài học sau:\n\n${lessonContent}\n\nĐặt thời gian trả lời nhanh (timeLimit: 15 hoặc 20 giây) và điểm số thưởng (1000 điểm). Trả về JSON phù hợp.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Đúng 4 đáp án lựa chọn" },
                  correctAnswer: { type: Type.INTEGER },
                  timeLimit: { type: Type.INTEGER, description: "Giới hạn thời gian giây (15 hoặc 20)" },
                  points: { type: Type.INTEGER, description: "Điểm thưởng tối đa (luôn là 1000)" }
                },
                required: ["id", "question", "options", "correctAnswer", "timeLimit", "points"]
              }
            }
          },
          required: ["questions"]
        };
        break;

      case "quizizz":
        prompt = `Hãy tạo 10 câu hỏi trắc nghiệm ôn tập kiểu "Quizizz Challenge" dựa trên bài học sau:\n\n${lessonContent}\n\nYêu cầu mỗi câu hỏi có lời giải thích giáo dục chi tiết. Đặc biệt có hai thông điệp vui nhộn: 'memeSuccess' (khi học sinh trả lời đúng) và 'memeFail' (khi học sinh trả lời sai, mang tính khích lệ, dí dỏm). Trả về JSON phù hợp.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  memeSuccess: { type: Type.STRING, description: "Câu khen ngợi vui vẻ hóm hỉnh" },
                  memeFail: { type: Type.STRING, description: "Câu an ủi khích lệ khôi hài" }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation", "memeSuccess", "memeFail"]
              }
            }
          },
          required: ["questions"]
        };
        break;

      case "escapeRoom":
        prompt = `Hãy xây dựng một mật phòng thử thách "Escape Room Giáo dục" gồm đúng 5 tầng cửa khoá liên tiếp dựa trên bài học sau:\n\n${lessonContent}\n\nMỗi tầng là 1 dạng câu đố khác nhau mở khoá:
Cửa 1 (padlock): Trắc nghiệm tìm mật mã gồm 4 số hoặc 1 từ (dạng trắc nghiệm).
Cửa 2 (anagram): Đố sắp xếp lại các chữ cái lộn xộn thành 1 thuật ngữ đúng (Ví dụ: 'NDEI BENI PHU' -> 'DIEN BIEN PHU').
Cửa 3 (matching): Nối khái niệm đúng với định nghĩa (Sử dụng câu hỏi nối).
Cửa 4 (code): Tính toán số liệu thực tế trong bài (Ví dụ: cộng năm xảy ra sự kiện, hoặc số lượng... để ra một dãy số).
Cửa 5 (riddle): Một câu đố mẹo tư duy sâu về bài học để thoát phòng.
Mỗi tầng phải có 'scenario' (cốt truyện nhập vai tìm đường thoát), 'hint' (gợi ý khi bí), 'correctAnswer' (chữ hoặc số viết hoa không dấu dùng để gõ mở khóa). Trả về JSON cấu trúc chính xác.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            levels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  levelNum: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: "Phải thuộc một trong các giá trị: 'padlock', 'anagram', 'matching', 'code', 'riddle'" },
                  title: { type: Type.STRING },
                  scenario: { type: Type.STRING, description: "Đoạn văn kể chuyện nhập vai tạo không khí kịch tính" },
                  question: { type: Type.STRING, description: "Nhiệm vụ/câu đố cần làm để lấy mật mã" },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tùy chọn trắc nghiệm nếu có (đặc biệt là padlock hoặc matching)" },
                  correctAnswer: { type: Type.STRING, description: "Đáp án chính xác, viết hoa không dấu hoặc chữ số" },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING, description: "Lời gợi ý nhỏ giúp học sinh không bị kẹt" }
                },
                required: ["levelNum", "type", "title", "scenario", "question", "correctAnswer", "explanation", "hint"]
              }
            }
          },
          required: ["levels"]
        };
        break;

      case "secretCode":
        prompt = `Hãy chọn 1 từ khóa cốt lõi nhất của bài học này (độ dài đúng 5 đến 6 chữ cái, viết hoa không dấu, không khoảng cách) để chơi "Mật Mã Bí Ẩn" (kiểu Wordle đoán từ):\n\n${lessonContent}\n\nCung cấp:
- 'secretWord': Từ khóa cốt lõi cần đoán.
- 'wordDefinition': Định nghĩa xúc tích.
- 'clues': 3 gợi ý mở rộng theo mức độ hé lộ tăng dần.
- 'explanation': Giải thích cặn kẽ ý nghĩa lịch sử/khoa học của từ khóa đó.
Trả về JSON.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            secretWord: { type: Type.STRING, description: "Từ khóa viết hoa không dấu, đúng 5 hoặc 6 chữ cái" },
            wordDefinition: { type: Type.STRING },
            clues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gồm đúng 3 gợi ý mở rộng" },
            explanation: { type: Type.STRING }
          },
          required: ["secretWord", "wordDefinition", "clues", "explanation"]
        };
        break;

      case "treasureHunt":
        prompt = `Hãy thiết kế một tấm bản đồ "Truy Tìm Kho Báu" gồm đúng 5 trạm thử thách dựa trên bài học sau:\n\n${lessonContent}\n\nHọc sinh sẽ vượt qua 5 trạm địa điểm để tìm thấy rương vàng:
Trạm 1: Thử thách ghép cặp/Khái niệm (multiple-choice).
Trạm 2: Trắc nghiệm Địa lý/Sự kiện (multiple-choice).
Trạm 3: Câu hỏi Đúng/Sai (true-false).
Trạm 4: Điền vào chỗ trống (fill-blank).
Trạm 5: Giải mã mật thư mật mã (cipher - ví dụ đảo ngược chữ cái hoặc mật mã Caesar đơn giản).
Mỗi trạm có 'name' (Ví dụ: Thung Lũng Chết, Đầm Lầy Sương Mù...), tọa độ 'coordinates' dạng phần trăm màn hình x, y để vẽ lên bản đồ ảo (các số x, y từ 15 đến 85 phân bổ đều), câu hỏi tương ứng và 'correctAnswer'. Trả về JSON phù hợp.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            stations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stationNum: { type: Type.INTEGER },
                  name: { type: Type.STRING, description: "Tên địa danh phiêu lưu viễn tưởng lý thú" },
                  coordinates: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.INTEGER, description: "Tọa độ trục ngang từ 15 đến 85" },
                      y: { type: Type.INTEGER, description: "Tọa độ trục dọc từ 15 đến 85" }
                    },
                    required: ["x", "y"]
                  },
                  challengeType: { type: Type.STRING, description: "Phải thuộc: 'multiple-choice', 'true-false', 'fill-blank', 'cipher'" },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING, description: "Mật mã đáp án, viết hoa không dấu" },
                  explanation: { type: Type.STRING },
                  cipherHint: { type: Type.STRING, description: "Gợi ý cách giải mật thư (đặc biệt cho trạm cipher)" }
                },
                required: ["stationNum", "name", "coordinates", "challengeType", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["stations"]
        };
        break;

      default:
        return res.status(400).json({ error: `Game key '${gameKey}' is not supported.` });
    }

    if (customPrompt && typeof customPrompt === "string" && customPrompt.trim()) {
      prompt += `\n\n[YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN BẮT BUỘC TUÂN THEO]:\n${customPrompt.trim()}`;
    }

    console.log(`Generating content for lesson '${id}', game: '${gameKey}' using gemini-3.5-flash...`);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API.");
    }

    const parsedData = JSON.parse(responseText.trim());

    // Save back to local JSON database
    const currentLessons = await loadLessons();
    const currentLessonIdx = currentLessons.findIndex((l: any) => l.id === id);
    if (currentLessonIdx !== -1) {
      if (!currentLessons[currentLessonIdx].gameData) {
        currentLessons[currentLessonIdx].gameData = {};
      }
      if (!currentLessons[currentLessonIdx].gamesGenerated) {
        currentLessons[currentLessonIdx].gamesGenerated = {};
      }

      currentLessons[currentLessonIdx].gameData[gameKey] = parsedData;
      currentLessons[currentLessonIdx].gamesGenerated[gameKey] = true;

      await saveLessons(currentLessons);
      res.json(currentLessons[currentLessonIdx]);
    } else {
      res.status(404).json({ error: "Lesson not found mid-operation" });
    }
  } catch (error: any) {
    console.error("Gemini API generation error:", error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Start the server with Vite Integration or Static serving
async function start() {
  if (process.env.VERCEL) {
    console.log("Running in Vercel environment. Skipping local port listener.");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is active and running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);

export default app;
