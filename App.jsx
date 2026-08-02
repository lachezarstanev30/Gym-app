import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Scale,
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertTriangle,
  Check,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  X,
  Flame,
  Play,
  Square,
  RotateCcw,
  Moon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ---------------------------------- LOCALSTORAGE SHIM ---------------------------------- */
/* Mirrors the window.storage API (get/set/delete/list) using the browser's own localStorage,
   so this file runs unchanged as a standalone app, with data saved on this device/browser. */
if (typeof window !== "undefined" && !window.storage) {
  const LS_PREFIX = "sila-dnevnik::";
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(LS_PREFIX + key);
      if (raw === null) return null;
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(LS_PREFIX + key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      localStorage.removeItem(LS_PREFIX + key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LS_PREFIX)) {
          const bare = k.slice(LS_PREFIX.length);
          if (bare.startsWith(prefix)) keys.push(bare);
        }
      }
      return { keys, prefix, shared: false };
    },
  };
}

/* ---------------------------------- THEME ---------------------------------- */

const C = {
  bg: "#121315",
  surface: "#1B1D1F",
  surfaceRaised: "#242628",
  border: "#34383B",
  gold: "#E3A23D",
  goldDim: "#A47328",
  steel: "#4FA7A0",
  steelDim: "#357A75",
  text: "#F5F1E8",
  textDim: "#9CA3A0",
  textFaint: "#6C726F",
  up: "#7ED08A",
  down: "#E2695A",
  flat: "#9CA3A0",
  over: "#6FA8D8",
};

const displayFont =
  "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const bodyFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/* ---------------------------------- PROGRAM ---------------------------------- */

const START_DATE = "2026-08-03"; // Monday
const MIN_DATE = "2026-08-02"; // earliest day reachable in the day navigator

const PROGRAM = {
  1: {
    name: "Понеделник",
    focus: "Гърди + Гръб",
    exercises: [
      { id: "mon-1", name: "Избутване с дъмбели от наклон", sets: 4, reps: "6–8" },
      { id: "mon-2", name: "Придърпване на вертикален скрипец", sets: 4, reps: "8–10" },
      { id: "mon-3", name: "Chest Press", sets: 3, reps: "10–12" },
      { id: "mon-4", name: "Гребане на машина с опора за гърдите", sets: 3, reps: "10–12" },
      { id: "mon-5", name: "Пек дек", sets: 2, reps: "12–15" },
      { id: "mon-6", name: "Face Pull", sets: 3, reps: "15" },
    ],
  },
  2: {
    name: "Вторник",
    focus: "Крака",
    exercises: [
      { id: "tue-1", name: "Лег преса", sets: 4, reps: "8–10" },
      { id: "tue-2", name: "Български клек с дъмбели", sets: 3, reps: "10", note: "на крак" },
      { id: "tue-3", name: "Бедрено сгъване", sets: 3, reps: "10–12" },
      { id: "tue-4", name: "Бедрено разгъване", sets: 3, reps: "12–15" },
      { id: "tue-5", name: "Прасци", sets: 4, reps: "12–15" },
      { id: "tue-6", name: "Повдигане на краката от вис", sets: 3, reps: "12–15" },
    ],
  },
  3: {
    name: "Сряда",
    focus: "Рамене + Ръце",
    exercises: [
      { id: "wed-1", name: "Раменна преса", sets: 3, reps: "8–10" },
      { id: "wed-2", name: "Разтваряне встрани", sets: 4, reps: "12–15" },
      { id: "wed-3", name: "Reverse Pec Deck", sets: 4, reps: "12–15" },
      { id: "wed-4", name: "Скотово сгъване", sets: 3, reps: "10–12" },
      { id: "wed-5", name: "Чуково сгъване", sets: 3, reps: "10–12" },
      { id: "wed-6", name: "Разгъване на въже", sets: 3, reps: "10–12" },
      { id: "wed-7", name: "Френско разгъване", sets: 3, reps: "10–12" },
    ],
  },
  4: {
    name: "Четвъртък",
    focus: "Горна част",
    exercises: [
      { id: "thu-1", name: "Избутване с дъмбели от хоризонтална лежанка", sets: 3, reps: "8–10" },
      { id: "thu-2", name: "Гребане на хоризонтален скрипец", sets: 3, reps: "8–10" },
      { id: "thu-3", name: "Incline Chest Press", sets: 3, reps: "10–12" },
      { id: "thu-4", name: "Тесен вертикален скрипец", sets: 3, reps: "10–12" },
      { id: "thu-5", name: "Разтваряне встрани", sets: 3, reps: "15" },
      { id: "thu-6", name: "Face Pull", sets: 3, reps: "15" },
    ],
  },
  5: {
    name: "Петък",
    focus: "Крака + Корем",
    exercises: [
      { id: "fri-1", name: "Hack Squat / Лег преса", sets: 4, reps: "10" },
      { id: "fri-2", name: "Румънска тяга с дъмбели", sets: 3, reps: "10" },
      { id: "fri-3", name: "Бедрено сгъване", sets: 3, reps: "12" },
      { id: "fri-4", name: "Прасци", sets: 4, reps: "15" },
      { id: "fri-5", name: "Кабелни коремни преси", sets: 3, reps: "15" },
      { id: "fri-6", name: "Планк", sets: 3, reps: "време", type: "time" },
    ],
  },
};

const ALL_EXERCISES = Object.values(PROGRAM).flatMap((d) => d.exercises);
const EXERCISE_BY_ID = Object.fromEntries(ALL_EXERCISES.map((e) => [e.id, e]));

/* ---------------------------------- EXERCISE PICTOGRAMS ---------------------------------- */
/* Original minimalist line-art poses (not photos) so each exercise card has a quick visual cue. */

const POSES = {
  standingArmsUp: (
    <>
      <circle cx="32" cy="12" r="6" />
      <line x1="32" y1="18" x2="32" y2="40" />
      <line x1="32" y1="40" x2="26" y2="58" />
      <line x1="32" y1="40" x2="38" y2="58" />
      <line x1="32" y1="22" x2="20" y2="6" />
      <line x1="32" y1="22" x2="44" y2="6" />
      <circle cx="20" cy="6" r="3.5" fill={C.gold} stroke="none" />
      <circle cx="44" cy="6" r="3.5" fill={C.gold} stroke="none" />
    </>
  ),
  standingArmsOut: (
    <>
      <circle cx="32" cy="12" r="6" />
      <line x1="32" y1="18" x2="32" y2="40" />
      <line x1="32" y1="40" x2="26" y2="58" />
      <line x1="32" y1="40" x2="38" y2="58" />
      <line x1="32" y1="22" x2="12" y2="20" />
      <line x1="32" y1="22" x2="52" y2="20" />
      <circle cx="12" cy="20" r="3.5" fill={C.gold} stroke="none" />
      <circle cx="52" cy="20" r="3.5" fill={C.gold} stroke="none" />
    </>
  ),
  standingArmCurl: (
    <>
      <circle cx="32" cy="12" r="6" />
      <line x1="32" y1="18" x2="32" y2="40" />
      <line x1="32" y1="40" x2="26" y2="58" />
      <line x1="32" y1="40" x2="38" y2="58" />
      <line x1="32" y1="22" x2="22" y2="34" />
      <line x1="22" y1="34" x2="18" y2="20" />
      <line x1="32" y1="22" x2="42" y2="34" />
      <line x1="42" y1="34" x2="46" y2="20" />
      <circle cx="18" cy="20" r="3.5" fill={C.gold} stroke="none" />
      <circle cx="46" cy="20" r="3.5" fill={C.gold} stroke="none" />
    </>
  ),
  standingArmPushDown: (
    <>
      <circle cx="32" cy="12" r="6" />
      <line x1="32" y1="18" x2="32" y2="40" />
      <line x1="32" y1="40" x2="26" y2="58" />
      <line x1="32" y1="40" x2="38" y2="58" />
      <line x1="32" y1="22" x2="24" y2="32" />
      <line x1="24" y1="32" x2="22" y2="46" />
      <line x1="32" y1="22" x2="40" y2="32" />
      <line x1="40" y1="32" x2="42" y2="46" />
      <line x1="18" y1="46" x2="46" y2="46" />
    </>
  ),
  lyingPress: (
    <>
      <line x1="12" y1="44" x2="52" y2="44" />
      <circle cx="18" cy="44" r="6" />
      <line x1="18" y1="44" x2="40" y2="44" />
      <line x1="36" y1="44" x2="30" y2="20" />
      <line x1="36" y1="44" x2="44" y2="20" />
      <circle cx="30" cy="20" r="3.5" fill={C.gold} stroke="none" />
      <circle cx="44" cy="20" r="3.5" fill={C.gold} stroke="none" />
      <line x1="40" y1="44" x2="46" y2="54" />
      <line x1="46" y1="54" x2="40" y2="60" />
    </>
  ),
  seatedPull: (
    <>
      <line x1="20" y1="52" x2="44" y2="52" />
      <circle cx="32" cy="16" r="6" />
      <line x1="32" y1="22" x2="32" y2="44" />
      <line x1="32" y1="44" x2="26" y2="52" />
      <line x1="26" y1="52" x2="26" y2="60" />
      <line x1="32" y1="44" x2="38" y2="52" />
      <line x1="38" y1="52" x2="38" y2="60" />
      <line x1="32" y1="26" x2="18" y2="14" />
      <line x1="32" y1="26" x2="46" y2="14" />
      <line x1="14" y1="14" x2="50" y2="14" />
    </>
  ),
  seatedRow: (
    <>
      <line x1="20" y1="54" x2="44" y2="54" />
      <circle cx="30" cy="16" r="6" />
      <line x1="32" y1="22" x2="36" y2="40" />
      <line x1="36" y1="40" x2="30" y2="50" />
      <line x1="30" y1="50" x2="30" y2="60" />
      <line x1="36" y1="40" x2="42" y2="50" />
      <line x1="42" y1="50" x2="42" y2="60" />
      <line x1="34" y1="26" x2="48" y2="22" />
      <line x1="34" y1="26" x2="48" y2="30" />
    </>
  ),
  seatedFly: (
    <>
      <line x1="20" y1="54" x2="44" y2="54" />
      <circle cx="32" cy="16" r="6" />
      <line x1="32" y1="22" x2="32" y2="44" />
      <line x1="32" y1="44" x2="26" y2="52" />
      <line x1="26" y1="52" x2="26" y2="60" />
      <line x1="32" y1="44" x2="38" y2="52" />
      <line x1="38" y1="52" x2="38" y2="60" />
      <line x1="32" y1="26" x2="46" y2="24" />
      <line x1="46" y1="24" x2="38" y2="30" />
      <line x1="32" y1="26" x2="18" y2="24" />
      <line x1="18" y1="24" x2="26" y2="30" />
    </>
  ),
  legPress: (
    <>
      <circle cx="16" cy="52" r="6" />
      <line x1="14" y1="50" x2="30" y2="34" />
      <line x1="30" y1="34" x2="46" y2="28" />
      <line x1="30" y1="34" x2="46" y2="38" />
      <line x1="48" y1="18" x2="48" y2="46" />
    </>
  ),
  lunge: (
    <>
      <circle cx="30" cy="12" r="6" />
      <line x1="30" y1="18" x2="30" y2="36" />
      <line x1="30" y1="36" x2="22" y2="46" />
      <line x1="22" y1="46" x2="18" y2="58" />
      <line x1="30" y1="36" x2="40" y2="42" />
      <line x1="40" y1="42" x2="48" y2="40" />
      <line x1="30" y1="22" x2="24" y2="34" />
      <circle cx="24" cy="34" r="3.5" fill={C.gold} stroke="none" />
      <line x1="30" y1="22" x2="36" y2="34" />
      <circle cx="36" cy="34" r="3.5" fill={C.gold} stroke="none" />
    </>
  ),
  legBend: (
    <>
      <line x1="12" y1="36" x2="40" y2="36" />
      <circle cx="12" cy="32" r="6" />
      <line x1="14" y1="32" x2="38" y2="32" />
      <line x1="38" y1="32" x2="44" y2="32" />
      <line x1="44" y1="32" x2="44" y2="16" />
    </>
  ),
  legExtension: (
    <>
      <line x1="14" y1="42" x2="28" y2="42" />
      <circle cx="20" cy="16" r="6" />
      <line x1="20" y1="22" x2="20" y2="42" />
      <line x1="20" y1="42" x2="34" y2="42" />
      <line x1="34" y1="42" x2="46" y2="30" />
    </>
  ),
  calfRaise: (
    <>
      <circle cx="32" cy="12" r="6" />
      <line x1="32" y1="18" x2="32" y2="40" />
      <line x1="32" y1="40" x2="27" y2="58" />
      <line x1="32" y1="40" x2="37" y2="58" />
      <line x1="25" y1="54" x2="25" y2="48" />
      <line x1="25" y1="48" x2="22" y2="51" />
      <line x1="25" y1="48" x2="28" y2="51" />
      <line x1="39" y1="54" x2="39" y2="48" />
      <line x1="39" y1="48" x2="36" y2="51" />
      <line x1="39" y1="48" x2="42" y2="51" />
    </>
  ),
  hanging: (
    <>
      <line x1="18" y1="8" x2="46" y2="8" />
      <circle cx="32" cy="12" r="5" />
      <line x1="32" y1="17" x2="32" y2="32" />
      <line x1="32" y1="17" x2="22" y2="8" />
      <line x1="32" y1="17" x2="42" y2="8" />
      <line x1="32" y1="32" x2="44" y2="28" />
      <line x1="32" y1="32" x2="46" y2="32" />
    </>
  ),
  hinge: (
    <>
      <circle cx="28" cy="16" r="6" />
      <line x1="28" y1="20" x2="38" y2="34" />
      <line x1="38" y1="34" x2="36" y2="58" />
      <line x1="38" y1="34" x2="42" y2="58" />
      <line x1="34" y1="24" x2="32" y2="46" />
      <circle cx="32" cy="46" r="3.5" fill={C.gold} stroke="none" />
    </>
  ),
  plank: (
    <>
      <line x1="8" y1="44" x2="54" y2="44" />
      <circle cx="10" cy="32" r="6" />
      <line x1="12" y1="32" x2="46" y2="32" />
      <line x1="18" y1="32" x2="18" y2="44" />
      <line x1="46" y1="32" x2="52" y2="36" />
    </>
  ),
  kneelingCrunch: (
    <>
      <circle cx="26" cy="26" r="6" />
      <line x1="28" y1="30" x2="34" y2="42" />
      <line x1="24" y1="22" x2="18" y2="16" />
      <line x1="30" y1="22" x2="36" y2="16" />
      <line x1="34" y1="42" x2="30" y2="52" />
      <line x1="30" y1="52" x2="38" y2="54" />
      <line x1="34" y1="42" x2="40" y2="50" />
      <line x1="40" y1="50" x2="46" y2="56" />
    </>
  ),
};

function ExercisePictogram({ pose, size = 44 }) {
  const shape = POSES[pose];
  if (!shape) return null;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke={C.gold}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {shape}
    </svg>
  );
}

const EXERCISE_POSE = {
  "mon-1": "lyingPress",
  "mon-2": "seatedPull",
  "mon-3": "lyingPress",
  "mon-4": "seatedRow",
  "mon-5": "seatedFly",
  "mon-6": "standingArmsOut",
  "tue-1": "legPress",
  "tue-2": "lunge",
  "tue-3": "legBend",
  "tue-4": "legExtension",
  "tue-5": "calfRaise",
  "tue-6": "hanging",
  "wed-1": "standingArmsUp",
  "wed-2": "standingArmsOut",
  "wed-3": "standingArmsOut",
  "wed-4": "standingArmCurl",
  "wed-5": "standingArmCurl",
  "wed-6": "standingArmPushDown",
  "wed-7": "standingArmPushDown",
  "thu-1": "lyingPress",
  "thu-2": "seatedRow",
  "thu-3": "lyingPress",
  "thu-4": "seatedPull",
  "thu-5": "standingArmsOut",
  "thu-6": "standingArmsOut",
  "fri-1": "legPress",
  "fri-2": "hinge",
  "fri-3": "legBend",
  "fri-4": "calfRaise",
  "fri-5": "kneelingCrunch",
  "fri-6": "plank",
};

const MONTHS_BG = [
  "януари", "февруари", "март", "април", "май", "юни",
  "юли", "август", "септември", "октомври", "ноември", "декември",
];
const WEEKDAY_LABELS = { 1: "Пон", 2: "Вт", 3: "Ср", 4: "Чет", 5: "Пет", 6: "Съб", 7: "Нед", 0: "Нед" };

/* ---------------------------------- DATE HELPERS ---------------------------------- */

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
function getISOWeekday(iso) {
  const d = parseISO(iso).getDay(); // 0 sun .. 6 sat
  return d === 0 ? 7 : d;
}
function getWeekNumber(iso) {
  const start = parseISO(START_DATE);
  const cur = parseISO(iso);
  const diffDays = Math.floor((cur - start) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}
function formatDateBG(iso) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS_BG[d.getMonth()]}`;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function getTodaySofia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getNowSofiaMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/* ---------------------------------- STORAGE ---------------------------------- */

const PREFIX = "workout:";

async function loadAllLogs() {
  const out = {};
  try {
    const listed = await window.storage.list(PREFIX, false);
    const keys = listed?.keys || [];
    for (const k of keys) {
      try {
        const r = await window.storage.get(k, false);
        if (r && r.value) out[k.slice(PREFIX.length)] = JSON.parse(r.value);
      } catch (e) {
        /* skip corrupt entry */
      }
    }
  } catch (e) {
    console.error("Storage load failed", e);
  }
  return out;
}

async function saveLog(date, record) {
  try {
    await window.storage.set(PREFIX + date, JSON.stringify(record), false);
  } catch (e) {
    console.error("Storage save failed", e);
  }
}

/* ---------------------------------- ANALYSIS ---------------------------------- */

function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

function bestOfSession(sets, isTime) {
  if (!sets || !sets.length) return 0;
  if (isTime) {
    return Math.max(0, ...sets.map((s) => s.duration || 0));
  }
  return Math.max(0, ...sets.map((s) => epley1RM(s.weight || 0, s.reps || 0)));
}

function getSessions(logs, exerciseId) {
  const isTime = EXERCISE_BY_ID[exerciseId]?.type === "time";
  return Object.keys(logs)
    .filter((d) => logs[d]?.sets?.[exerciseId]?.some((s) => (s.weight && s.reps) || s.duration))
    .sort()
    .map((d) => {
      const sets = logs[d].sets[exerciseId].filter((s) => (s.weight && s.reps) || s.duration);
      return { date: d, sets, best: bestOfSession(sets, isTime) };
    });
}

function getTrend(logs, exerciseId) {
  const sessions = getSessions(logs, exerciseId);
  if (sessions.length < 3) return { dir: "none", sessions };
  const last = sessions[sessions.length - 1];
  const prev = sessions.slice(-4, -1);
  const prevAvg = prev.reduce((a, s) => a + s.best, 0) / prev.length;
  if (!prevAvg) return { dir: "none", sessions };
  const pct = ((last.best - prevAvg) / prevAvg) * 100;
  let dir = "flat";
  if (pct > 2) dir = "up";
  else if (pct < -2) dir = "down";
  return { dir, pct, sessions };
}

function getLastSession(logs, exerciseId, beforeDate) {
  const sessions = getSessions(logs, exerciseId).filter((s) => s.date < beforeDate);
  return sessions.length ? sessions[sessions.length - 1] : null;
}

function getPreviousBodyWeight(logs, beforeDate) {
  const dates = Object.keys(logs)
    .filter((d) => d < beforeDate && logs[d]?.bodyWeight != null)
    .sort();
  if (!dates.length) return null;
  const d = dates[dates.length - 1];
  return { date: d, weight: logs[d].bodyWeight };
}

function getWeekDates(weekNum) {
  const start = addDays(START_DATE, (weekNum - 1) * 7);
  return [0, 1, 2, 3, 4].map((i) => addDays(start, i));
}

function getWeekAvgBodyWeight(logs, weekNum) {
  const vals = getWeekDates(weekNum)
    .map((d) => logs[d]?.bodyWeight)
    .filter((v) => v !== null && v !== undefined);
  if (!vals.length) return null;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function getDayTonnage(record) {
  if (!record?.sets) return 0;
  let total = 0;
  Object.values(record.sets).forEach((sets) => {
    sets.forEach((s) => {
      if (s.weight && s.reps) total += s.weight * s.reps;
    });
  });
  return Math.round(total);
}

function getWeekTonnage(logs, weekNum) {
  return getWeekDates(weekNum).reduce((sum, d) => sum + getDayTonnage(logs[d]), 0);
}

const USER_HEIGHT_CM = 175;
const USER_AGE = 24;
const USER_SEX = "male"; // "male" | "female" — used only for the Mifflin-St Jeor BMR estimate below

function getBMR(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

function getSessionAvgRest(record) {
  if (!record?.sets) return null;
  const vals = [];
  Object.values(record.sets).forEach((sets) => {
    sets.forEach((s) => {
      if (s.restAfterSec != null) vals.push(s.restAfterSec);
    });
  });
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function getMET(avgRestSec) {
  if (avgRestSec === null) return 5; // moderate resistance training default (Compendium of Physical Activities)
  if (avgRestSec < 45) return 8; // circuit-style, minimal rest
  if (avgRestSec < 90) return 6;
  if (avgRestSec < 150) return 5;
  return 3.8; // long rests, traditional heavy lifting
}

function getTonnageIntensityFactor(tonnage, minutes, bodyWeightKg) {
  if (!tonnage || !minutes || !bodyWeightKg) return 1;
  const ratePerMin = tonnage / minutes; // total kg moved per minute
  const relative = ratePerMin / bodyWeightKg; // in bodyweight-multiples per minute
  const REFERENCE = 0.4; // calibration point representing a typical moderate-volume session
  const factor = relative / REFERENCE;
  return Math.min(1.15, Math.max(0.85, factor));
}

function getSessionCalories(record, bodyWeightKg) {
  if (!record?.workoutDurationSec || !bodyWeightKg) return null;
  const avgRest = getSessionAvgRest(record);
  const minutes = record.workoutDurationSec / 60;
  const tonnage = getDayTonnage(record);
  const intensityFactor = getTonnageIntensityFactor(tonnage, minutes, bodyWeightKg);
  const met = getMET(avgRest) * intensityFactor;
  const bmr = getBMR(bodyWeightKg, USER_HEIGHT_CM, USER_AGE, USER_SEX);
  const kcalPerMinute = bmr / 1440; // MET is defined as a multiple of resting metabolic rate
  return Math.round(met * kcalPerMinute * minutes);
}

function getDayCalories(logs, date) {
  const weekday = getISOWeekday(date);
  if (weekday < 1 || weekday > 5) return null; // training days only, Mon–Fri
  const record = logs[date];
  if (!record) return null;
  const bw = record.bodyWeight ?? getPreviousBodyWeight(logs, date)?.weight ?? null;
  return getSessionCalories(record, bw);
}

function getAllCalorieSessions(logs) {
  return Object.keys(logs)
    .filter((d) => getISOWeekday(d) >= 1 && getISOWeekday(d) <= 5)
    .sort()
    .map((d) => ({ date: d, calories: getDayCalories(logs, d) }))
    .filter((s) => s.calories !== null);
}

function getWeekCalories(logs, weekNum) {
  return getWeekDates(weekNum).reduce((sum, d) => {
    const c = getDayCalories(logs, d);
    return sum + (c || 0);
  }, 0);
}

function isDayTrained(logs, date) {
  const record = logs[date];
  if (!record || !record.sets) return false;
  return Object.values(record.sets).some((sets) => sets.some((s) => (s.weight && s.reps) || s.duration));
}

function getScheduledDates(fromDate, toDate) {
  const dates = [];
  let d = fromDate;
  let guard = 0;
  while (d <= toDate && guard < 2000) {
    const wd = getISOWeekday(d);
    if (wd >= 1 && wd <= 5) dates.push(d);
    d = addDays(d, 1);
    guard++;
  }
  return dates;
}

function getCurrentStreak(logs) {
  const today = getTodaySofia();
  if (today < START_DATE) return 0;
  const scheduled = getScheduledDates(START_DATE, today);
  let streak = 0;
  for (let i = scheduled.length - 1; i >= 0; i--) {
    if (isDayTrained(logs, scheduled[i])) streak++;
    else break;
  }
  return streak;
}

function formatDuration(sec) {
  if (!sec || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getFullWeekDates(weekNum) {
  const start = addDays(START_DATE, (weekNum - 1) * 7);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
}

function timeToMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function getSleepMinutes(sleepStart, sleepEnd) {
  if (!sleepStart || !sleepEnd) return null;
  const startMin = timeToMinutes(sleepStart);
  const endMin = timeToMinutes(sleepEnd);
  if (startMin === null || endMin === null) return null;
  if (startMin < endMin) {
    // bedtime and wake time fall on the same calendar day (e.g. fell asleep at 00:45, woke at 08:00)
    return endMin - startMin;
  }
  // bedtime's clock-time is later than wake's, so it must have been the previous evening
  return 24 * 60 - startMin + endMin;
}

function formatSleepDuration(min) {
  if (min === null || min === undefined) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}ч ${m}мин`;
}

function getWeekAvgSleep(logs, weekNum) {
  const vals = getFullWeekDates(weekNum)
    .map((d) => getSleepMinutes(logs[d]?.sleepStart, logs[d]?.sleepEnd))
    .filter((v) => v !== null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function getAllSleepSessions(logs) {
  return Object.keys(logs)
    .filter((d) => logs[d]?.sleepStart && logs[d]?.sleepEnd)
    .sort()
    .map((d) => ({
      date: d,
      sleepStart: logs[d].sleepStart,
      sleepEnd: logs[d].sleepEnd,
      minutes: getSleepMinutes(logs[d].sleepStart, logs[d].sleepEnd),
    }));
}

function normalizedBedtimeMinutes(hhmm) {
  const m = timeToMinutes(hhmm);
  if (m === null) return null;
  // treat past-midnight bedtimes as continuing the previous evening's timeline, so they compare cleanly
  return m < 12 * 60 ? m + 24 * 60 : m;
}

function getBedtimeConsistency(sessions) {
  const vals = sessions.map((s) => normalizedBedtimeMinutes(s.sleepStart)).filter((v) => v !== null);
  if (vals.length < 2) return null;
  return Math.max(...vals) - Math.min(...vals);
}

function getSleepRecommendation(avgMinutes, consistencySpread) {
  if (avgMinutes === null) return null;
  const hours = avgMinutes / 60;
  let rec;
  if (hours < 6) {
    rec = {
      type: "warn",
      text: "Средно под 6 часа сън. Недостатъчният сън забавя възстановяването на мускулите и може да се отрази на силата ти в залата.",
    };
  } else if (hours < 7) {
    rec = { type: "note", text: "Малко под препоръчителните 7–9 часа. Опитай да си лягаш 30–45 минути по-рано." };
  } else if (hours <= 9) {
    rec = { type: "good", text: "В здравословния диапазон (7–9 часа). Продължавай в този режим." };
  } else {
    rec = {
      type: "note",
      text: "Над 9 часа средно — не е проблем само по себе си, но ако усещаш умора въпреки дългия сън, обърни внимание и на качеството му.",
    };
  }
  if (consistencySpread !== null && consistencySpread > 90) {
    rec.consistencyNote = "Часовете ти за лягане варират доста през седмицата — по-постоянен режим обикновено подобрява качеството на съня.";
  }
  return rec;
}

function parseRepsRange(str) {
  if (!str) return null;
  const nums = str.match(/\d+/g);
  if (!nums || !nums.length) return null;
  if (nums.length === 1) return { min: Number(nums[0]), max: Number(nums[0]) };
  return { min: Number(nums[0]), max: Number(nums[1]) };
}

function getRepStatus(reps, range) {
  if (reps === null || reps === undefined || !range) return null;
  if (reps < range.min) return "under";
  if (reps > range.max) return "over";
  return "match";
}

function getMonthRange(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return [first, last];
}

function buildCSV(logs, fromDate, toDate) {
  const rows = [
    [
      "Дата",
      "Ден",
      "Тегло преди тренировка (кг)",
      "Легнал в",
      "Станал в",
      "Сън (мин)",
      "Продължителност тренировка (сек)",
      "Калории (прибл.)",
      "Упражнение",
      "Сет",
      "Повторения",
      "Тегло (кг)",
      "Времетраене (сек)",
      "Почивка след серия (сек)",
    ],
  ];
  const dates = Object.keys(logs)
    .filter((d) => (fromDate ? d >= fromDate : true) && (toDate ? d <= toDate : true))
    .sort();

  dates.forEach((date) => {
    const record = logs[date] || {};
    const weekday = getISOWeekday(date);
    const dayLabel = WEEKDAY_LABELS[weekday] || "";
    const bw = record.bodyWeight ?? "";
    const dur = record.workoutDurationSec ?? "";
    const sleepStart = record.sleepStart ?? "";
    const sleepEnd = record.sleepEnd ?? "";
    const sleepMin = getSleepMinutes(record.sleepStart, record.sleepEnd) ?? "";
    const calories = getDayCalories(logs, date) ?? "";
    const sets = record.sets || {};
    const exIds = Object.keys(sets).filter((id) => (sets[id] || []).some((s) => (s.weight && s.reps) || s.duration));

    if (exIds.length === 0) {
      if (bw !== "" || dur !== "" || sleepStart !== "")
        rows.push([date, dayLabel, bw, sleepStart, sleepEnd, sleepMin, dur, calories, "", "", "", "", "", ""]);
      return;
    }
    exIds.forEach((exId) => {
      const ex = EXERCISE_BY_ID[exId];
      const exName = ex ? ex.name : exId;
      (sets[exId] || []).forEach((s, i) => {
        if ((s.weight && s.reps) || s.duration) {
          rows.push([
            date,
            dayLabel,
            bw,
            sleepStart,
            sleepEnd,
            sleepMin,
            dur,
            calories,
            exName,
            i + 1,
            s.reps ?? "",
            s.weight ?? "",
            s.duration ?? "",
            s.restAfterSec ?? "",
          ]);
        }
      });
    });
  });

  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getPR(logs, exerciseId) {
  const isTime = EXERCISE_BY_ID[exerciseId]?.type === "time";
  let best = null;
  Object.keys(logs).forEach((d) => {
    const sets = logs[d]?.sets?.[exerciseId];
    if (!sets) return;
    sets.forEach((s) => {
      if (isTime) {
        if (s.duration && (!best || s.duration > best.duration)) best = { duration: s.duration, date: d };
      } else if (s.weight && s.reps) {
        if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
          best = { weight: s.weight, reps: s.reps, date: d };
        }
      }
    });
  });
  return best;
}

/* ---------------------------------- SMALL UI PIECES ---------------------------------- */

function PlateMark({ size = 28 }) {
  const holes = [0, 60, 120, 180, 240, 300];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" stroke={C.gold} strokeWidth="2.5" />
      <circle cx="20" cy="20" r="12.5" stroke={C.gold} strokeWidth="1.5" opacity="0.5" />
      {holes.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 20 + Math.cos(rad) * 9;
        const cy = 20 + Math.sin(rad) * 9;
        return <circle key={deg} cx={cx} cy={cy} r="1.6" fill={C.gold} opacity="0.7" />;
      })}
      <circle cx="20" cy="20" r="4" fill={C.gold} />
    </svg>
  );
}

function StripeDivider({ color = C.gold, height = 5 }) {
  return (
    <div
      style={{
        height,
        borderRadius: height,
        marginBottom: 18,
        backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0px, ${color} 6px, transparent 6px, transparent 12px)`,
        opacity: 0.65,
      }}
    />
  );
}

function TrendBadge({ dir, pct }) {
  if (dir === "none") return null;
  const map = {
    up: { icon: TrendingUp, color: C.up, label: pct !== undefined ? `+${round1(pct)}%` : "" },
    down: { icon: TrendingDown, color: C.down, label: pct !== undefined ? `${round1(pct)}%` : "" },
    flat: { icon: Minus, color: C.flat, label: "стабилно" },
  };
  const M = map[dir];
  const Icon = M.icon;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 20,
        background: C.surfaceRaised,
        border: `1px solid ${M.color}55`,
      }}
    >
      <Icon size={13} color={M.color} />
      <span style={{ fontSize: 11, color: M.color, fontWeight: 600 }}>{M.label}</span>
    </div>
  );
}

function NumField({ value, onChange, placeholder, width = 58, disabled = false, statusColor }) {
  const [text, setText] = useState(value === undefined || value === null ? "" : String(value).replace(".", ","));

  useEffect(() => {
    setText(value === undefined || value === null ? "" : String(value).replace(".", ","));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.,]/g, "");
    setText(raw);
    const normalized = raw.replace(",", ".");
    if (normalized === "") {
      onChange(null);
      return;
    }
    if (/^\d*\.?\d*$/.test(normalized)) {
      const num = Number(normalized);
      if (!Number.isNaN(num)) onChange(num);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      onChange={handleChange}
      style={{
        width,
        background: disabled ? C.surface : statusColor ? `${statusColor}1F` : C.bg,
        border: `1px solid ${disabled ? C.border : statusColor || C.border}`,
        borderRadius: 8,
        color: disabled ? C.textFaint : statusColor || C.text,
        fontSize: 15,
        fontWeight: 600,
        textAlign: "center",
        padding: "8px 4px",
        outline: "none",
        opacity: disabled ? 0.6 : 1,
      }}
    />
  );
}

function TimeField({ value, onChange, disabled = false, width = 92 }) {
  return (
    <input
      type="time"
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        width,
        background: disabled ? C.surface : C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        color: disabled ? C.textFaint : C.text,
        fontSize: 14,
        fontWeight: 600,
        textAlign: "center",
        padding: "8px 4px",
        outline: "none",
        opacity: disabled ? 0.6 : 1,
      }}
    />
  );
}

/* ---------------------------------- EXERCISE CARD ---------------------------------- */

function ExerciseCard({ exercise, index, record, onChangeSet, logs, currentDate, isFuture, activeRest, startRest, stopRest }) {
  const isTime = exercise.type === "time";
  const repsRange = !isTime ? parseRepsRange(exercise.reps) : null;
  const setsArr = record?.sets?.[exercise.id] || Array.from({ length: exercise.sets }, () => ({}));
  const trend = getTrend(logs, exercise.id);
  const last = getLastSession(logs, exercise.id, currentDate);
  const lastBestSet = last
    ? last.sets.reduce((a, s) => {
        if (isTime) return !a || s.duration > a.duration ? s : a;
        return !a || epley1RM(s.weight, s.reps) > epley1RM(a.weight, a.reps) ? s : a;
      }, null)
    : null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: C.surfaceRaised,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 10,
          }}
        >
          <ExercisePictogram pose={EXERCISE_POSE[exercise.id]} size={34} />
        </div>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontSize: 11, color: C.goldDim, fontWeight: 700, letterSpacing: 0.5 }}>
            {String(index + 1).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: C.text, lineHeight: 1.25 }}>
            {exercise.name}
            {exercise.note ? <span style={{ color: C.textFaint, fontWeight: 400 }}> · {exercise.note}</span> : null}
          </div>
          <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2 }}>
            {exercise.sets} × {exercise.reps}
          </div>
        </div>
        <TrendBadge dir={trend.dir} pct={trend.pct} />
      </div>

      {lastBestSet && (
        <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 8 }}>
          последно:{" "}
          {isTime ? `${lastBestSet.duration}с` : `${lastBestSet.reps} × ${lastBestSet.weight} кг`}
        </div>
      )}

      {trend.dir === "down" && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "flex-start",
            background: `${C.down}15`,
            border: `1px solid ${C.down}40`,
            borderRadius: 8,
            padding: "6px 8px",
            marginBottom: 8,
          }}
        >
          <AlertTriangle size={13} color={C.down} style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: C.text }}>
            Няма прогрес от 3 тренировки. Пробвай делоуд (-10% тегло) или фокус върху техниката.
          </span>
        </div>
      )}
      {trend.dir === "flat" && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "flex-start",
            background: `${C.surfaceRaised}`,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "6px 8px",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11.5, color: C.textDim }}>
            Стабилно тегло. Пробвай +1 повторение или +2.5 кг следващия път.
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {setsArr.map((s, i) => {
          const repStatus = getRepStatus(s.reps, repsRange);
          const repColor =
            repStatus === "under" ? C.down : repStatus === "match" ? C.up : repStatus === "over" ? C.over : undefined;
          return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: C.textFaint, width: 16 }}>{i + 1}</span>
            {isTime ? (
              <>
                <NumField
                  value={s.duration}
                  onChange={(v) => onChangeSet(exercise.id, i, "duration", v)}
                  placeholder="сек"
                  width={90}
                  disabled={isFuture}
                />
                <span style={{ fontSize: 12, color: C.textFaint }}>секунди</span>
              </>
            ) : (
              <>
                <NumField
                  value={s.reps}
                  onChange={(v) => onChangeSet(exercise.id, i, "reps", v)}
                  placeholder="повт."
                  disabled={isFuture}
                  statusColor={repColor}
                />
                <span style={{ fontSize: 13, color: C.textFaint }}>×</span>
                <NumField
                  value={s.weight}
                  onChange={(v) => onChangeSet(exercise.id, i, "weight", v)}
                  placeholder="кг"
                  disabled={isFuture}
                />
                <span style={{ fontSize: 12, color: C.textFaint }}>кг</span>
              </>
            )}
            {!isFuture &&
              startRest &&
              (() => {
                const isActive =
                  activeRest &&
                  activeRest.date === currentDate &&
                  activeRest.exId === exercise.id &&
                  activeRest.setIndex === i;
                if (isActive) {
                  return (
                    <button
                      onClick={stopRest}
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: `${C.gold}22`,
                        border: `1px solid ${C.gold}`,
                        flexShrink: 0,
                      }}
                      aria-label="Спри и запази почивката"
                    >
                      <Square size={10} color={C.gold} fill={C.gold} />
                      <span style={{ fontSize: 11.5, color: C.gold, fontWeight: 700, fontFamily: displayFont }}>
                        {formatDuration(Math.floor((Date.now() - activeRest.startedAt) / 1000))}
                      </span>
                    </button>
                  );
                }
                if (s.restAfterSec != null) {
                  return (
                    <button
                      onClick={() => startRest(currentDate, exercise.id, i)}
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: C.surfaceRaised,
                        border: `1px solid ${C.border}`,
                        flexShrink: 0,
                      }}
                      aria-label="Почивка записана, натисни за нова"
                    >
                      <Timer size={12} color={C.textDim} />
                      <span style={{ fontSize: 11.5, color: C.textDim, fontWeight: 600 }}>
                        {formatDuration(s.restAfterSec)}
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => startRest(currentDate, exercise.id, i)}
                    style={{
                      marginLeft: "auto",
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: C.surfaceRaised,
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    aria-label="Старт на почивката"
                  >
                    <Timer size={13} color={C.gold} />
                  </button>
                );
              })()}
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- TODAY TAB ---------------------------------- */

function TodayTab({ logs, currentDate, setCurrentDate, updateRecord, activeRest, startRest, stopRest }) {
  const weekday = getISOWeekday(currentDate);
  const day = PROGRAM[weekday];
  const todaySofia = getTodaySofia();
  const isFuture = currentDate > todaySofia;
  const week = getWeekNumber(currentDate);
  const record = logs[currentDate] || { bodyWeight: null, sets: {} };

  const [, minuteTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => minuteTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const BEDTIME_UNLOCK_MINUTES = 21 * 60 + 30; // 21:30
  const isTomorrow = currentDate === addDays(todaySofia, 1);
  const sleepStartUnlockedEarly = isTomorrow && getNowSofiaMinutes() >= BEDTIME_UNLOCK_MINUTES;
  const sleepStartDisabled = isFuture && !sleepStartUnlockedEarly;

  const onChangeSet = (exId, idx, field, value) => {
    const exercise = EXERCISE_BY_ID[exId];
    const current = record.sets[exId] || Array.from({ length: exercise.sets }, () => ({}));
    const nextSets = current.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    updateRecord(currentDate, { ...record, sets: { ...record.sets, [exId]: nextSets } });
  };

  const onChangeBodyWeight = (v) => {
    updateRecord(currentDate, { ...record, bodyWeight: v });
  };

  const onChangeSleepStart = (v) => updateRecord(currentDate, { ...record, sleepStart: v });
  const onChangeSleepEnd = (v) => updateRecord(currentDate, { ...record, sleepEnd: v });
  const sleepMinutes = getSleepMinutes(record.sleepStart, record.sleepEnd);

  const isSunday = weekday === 7;
  const sleepWeekThis = isSunday ? getWeekAvgSleep(logs, week) : null;
  const sleepWeekPrev = isSunday ? getWeekAvgSleep(logs, week - 1) : null;
  const sleepWeekDelta = sleepWeekThis !== null && sleepWeekPrev !== null ? sleepWeekThis - sleepWeekPrev : null;

  const [, forceTick] = useState(0);
  useEffect(() => {
    if (record.workoutStartedAt && !record.workoutDurationSec) {
      const id = setInterval(() => forceTick((t) => t + 1), 1000);
      return () => clearInterval(id);
    }
  }, [record.workoutStartedAt, record.workoutDurationSec, currentDate]);

  const dayTonnage = getDayTonnage(record);
  const dayCalories = getDayCalories(logs, currentDate);
  const liveElapsedSec = record.workoutStartedAt
    ? Math.floor((Date.now() - record.workoutStartedAt) / 1000)
    : 0;
  const showLiveTimer = record.workoutStartedAt && !record.workoutDurationSec;

  const startWorkout = () => updateRecord(currentDate, { ...record, workoutStartedAt: Date.now() });
  const stopWorkout = () =>
    updateRecord(currentDate, {
      ...record,
      workoutDurationSec: Math.max(1, Math.floor((Date.now() - record.workoutStartedAt) / 1000)),
    });
  const resetWorkout = () => {
    const { workoutStartedAt, workoutDurationSec, ...rest } = record;
    updateRecord(currentDate, rest);
  };

  const prevWeight = getPreviousBodyWeight(logs, currentDate);
  const weightDelta =
    record.bodyWeight != null && prevWeight ? round1(record.bodyWeight - prevWeight.weight) : null;

  const isFriday = weekday === 5 && currentDate >= START_DATE;
  const thisWeekAvg = isFriday ? getWeekAvgBodyWeight(logs, week) : null;
  const prevWeekAvg = isFriday ? getWeekAvgBodyWeight(logs, week - 1) : null;
  const weekDelta = thisWeekAvg != null && prevWeekAvg != null ? round1(thisWeekAvg - prevWeekAvg) : null;

  const flagged = day
    ? day.exercises.filter((e) => getTrend(logs, e.id).dir === "down")
    : [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: currentDate === todaySofia ? 14 : 8 }}>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, -1))}
          disabled={currentDate <= MIN_DATE}
          style={{ ...navBtnStyle, opacity: currentDate <= MIN_DATE ? 0.4 : 1 }}
          aria-label="Предишен ден"
        >
          <ChevronLeft size={18} color={C.text} />
        </button>
        <div style={{ textAlign: "center" }}>
          {currentDate >= START_DATE && (
            <div style={{ fontSize: 12, color: C.textFaint }}>седмица {week}</div>
          )}
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
            {WEEKDAY_LABELS[weekday]}, {formatDateBG(currentDate)}
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          style={navBtnStyle}
          aria-label="Следващ ден"
        >
          <ChevronRight size={18} color={C.text} />
        </button>
      </div>

      {currentDate !== todaySofia && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <button
            onClick={() => setCurrentDate(todaySofia)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${C.gold}`,
              background: `${C.gold}18`,
              color: C.gold,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            <CalendarDays size={13} color={C.gold} />
            Към днешния ден
          </button>
        </div>
      )}

      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 12,
          marginBottom: weightDelta !== null || isFriday ? 6 : 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scale size={17} color={C.gold} />
            <span style={{ fontSize: 13.5, color: C.textDim }}>{day ? "Тегло преди тренировка" : "Тегло в почивен ден"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NumField value={record.bodyWeight} onChange={onChangeBodyWeight} placeholder="кг" width={64} disabled={isFuture} />
            <span style={{ fontSize: 12, color: C.textFaint }}>кг</span>
          </div>
        </div>
        {weightDelta !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            {Math.abs(weightDelta) < 0.05 ? (
              <Minus size={13} color={C.textFaint} />
            ) : weightDelta > 0 ? (
              <TrendingUp size={13} color={C.textFaint} />
            ) : (
              <TrendingDown size={13} color={C.textFaint} />
            )}
            <span style={{ fontSize: 12, color: C.textDim }}>
              {Math.abs(weightDelta) < 0.05
                ? "същото тегло"
                : `${weightDelta > 0 ? "+" : ""}${weightDelta} кг`}{" "}
              спрямо {formatDateBG(prevWeight.date)} ({prevWeight.weight} кг)
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Moon size={16} color={C.steel} />
          <span style={{ fontSize: 13.5, color: C.textDim }}>Сън</span>
          {sleepMinutes !== null && (
            <span style={{ marginLeft: "auto", fontSize: 13, color: C.text, fontWeight: 700, fontFamily: displayFont }}>
              {formatSleepDuration(sleepMinutes)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: C.textFaint, marginBottom: 4 }}>легнал в</div>
            <TimeField value={record.sleepStart} onChange={onChangeSleepStart} disabled={sleepStartDisabled} width="100%" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: C.textFaint, marginBottom: 4 }}>станал в</div>
            <TimeField value={record.sleepEnd} onChange={onChangeSleepEnd} disabled={isFuture} width="100%" />
          </div>
        </div>
        {isTomorrow && !sleepStartUnlockedEarly && (
          <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 6 }}>
            Часът за лягане ще може да се въведе от 21:30 довечера.
          </div>
        )}
      </div>

      {isSunday && (sleepWeekThis !== null || sleepWeekPrev !== null) && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, color: C.goldDim, fontWeight: 700, letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
            Седмично обобщение на съня
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>тази седмица (ср.)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {sleepWeekThis !== null ? formatSleepDuration(sleepWeekThis) : "—"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>миналата седмица (ср.)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {sleepWeekPrev !== null ? formatSleepDuration(sleepWeekPrev) : "—"}
              </div>
            </div>
          </div>
          {sleepWeekDelta !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              {Math.abs(sleepWeekDelta) < 5 ? (
                <Minus size={13} color={C.textFaint} />
              ) : sleepWeekDelta > 0 ? (
                <TrendingUp size={13} color={C.textFaint} />
              ) : (
                <TrendingDown size={13} color={C.textFaint} />
              )}
              <span style={{ fontSize: 12, color: C.textDim }}>
                {Math.abs(sleepWeekDelta) < 5
                  ? "без промяна спрямо миналата седмица"
                  : `${sleepWeekDelta > 0 ? "+" : ""}${Math.round(sleepWeekDelta)} мин спрямо миналата седмица`}
              </span>
            </div>
          )}
        </div>
      )}

      {isFriday && (thisWeekAvg !== null || prevWeekAvg !== null) && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, color: C.goldDim, fontWeight: 700, letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
            Седмично обобщение на теглото
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>тази седмица (ср.)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {thisWeekAvg !== null ? `${thisWeekAvg} кг` : "—"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>миналата седмица (ср.)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {prevWeekAvg !== null ? `${prevWeekAvg} кг` : "—"}
              </div>
            </div>
          </div>
          {weekDelta !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              {Math.abs(weekDelta) < 0.05 ? (
                <Minus size={13} color={C.textFaint} />
              ) : weekDelta > 0 ? (
                <TrendingUp size={13} color={C.textFaint} />
              ) : (
                <TrendingDown size={13} color={C.textFaint} />
              )}
              <span style={{ fontSize: 12, color: C.textDim }}>
                {Math.abs(weekDelta) < 0.05 ? "без промяна спрямо миналата седмица" : `${weekDelta > 0 ? "+" : ""}${weekDelta} кг спрямо миналата седмица`}
              </span>
            </div>
          )}
        </div>
      )}

      {day && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>продължителност</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {showLiveTimer
                  ? formatDuration(liveElapsedSec)
                  : record.workoutDurationSec
                  ? formatDuration(record.workoutDurationSec)
                  : "—"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>тонаж днес</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {dayTonnage > 0 ? `${dayTonnage} кг` : "—"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textFaint }}>калории (прибл.)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {dayCalories !== null ? `${dayCalories}` : "—"}
              </div>
            </div>
          </div>
          {!isFuture &&
            (showLiveTimer ? (
              <button
                onClick={stopWorkout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.down}66`,
                  background: `${C.down}18`,
                  color: C.down,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Square size={13} /> Стоп тренировка
              </button>
            ) : record.workoutDurationSec ? (
              <button
                onClick={resetWorkout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.textFaint,
                  fontSize: 12.5,
                }}
              >
                <RotateCcw size={13} /> Нулирай
              </button>
            ) : (
              <button
                onClick={startWorkout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: C.gold,
                  color: C.bg,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Play size={13} /> Старт тренировка
              </button>
            ))}
        </div>
      )}

      {isFuture && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 9,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <AlertTriangle size={15} color={C.textFaint} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12.5, color: C.textDim }}>
            Този ден още не е настъпил — полетата се отключват на {formatDateBG(currentDate)}.
          </span>
        </div>
      )}

      {!day ? (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 15, color: C.textDim }}>Почивен ден</div>
          <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 4 }}>
            Без тренировка по програма — можеш да въведеш само теглото си.
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: C.goldDim, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>
            {day.focus}
          </div>

          {flagged.length > 0 && (
            <div
              style={{
                background: `${C.down}12`,
                border: `1px solid ${C.down}40`,
                borderRadius: 9,
                padding: 10,
                marginBottom: 14,
                display: "flex",
                gap: 8,
              }}
            >
              <AlertTriangle size={16} color={C.down} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: C.text }}>
                Без прогрес: {flagged.map((e) => e.name).join(", ")}.
              </div>
            </div>
          )}

          {day.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              record={record}
              onChangeSet={onChangeSet}
              logs={logs}
              currentDate={currentDate}
              isFuture={isFuture}
              activeRest={activeRest}
              startRest={startRest}
              stopRest={stopRest}
            />
          ))}
        </>
      )}
    </div>
  );
}

const navBtnStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/* ---------------------------------- PROGRESS TAB ---------------------------------- */

function ProgressTab({ logs }) {
  const [dayFilter, setDayFilter] = useState(1);
  const [exId, setExId] = useState(PROGRAM[1].exercises[0].id);
  const [showTonnage, setShowTonnage] = useState(true);

  useEffect(() => {
    const exists = PROGRAM[dayFilter].exercises.find((e) => e.id === exId);
    if (!exists) setExId(PROGRAM[dayFilter].exercises[0].id);
  }, [dayFilter]); // eslint-disable-line

  const exercise = EXERCISE_BY_ID[exId];
  const isTime = exercise.type === "time";
  const sessions = getSessions(logs, exId);
  const trend = getTrend(logs, exId);

  const chartData = sessions.map((s) => ({
    label: formatDateBG(s.date),
    week: getWeekNumber(s.date),
    value: isTime ? s.best : round1(s.best),
  }));

  const todaySofia = getTodaySofia();
  const maxWeek = Math.max(getWeekNumber(todaySofia), 1);
  const tonnageData = [];
  for (let w = 1; w <= maxWeek; w++) {
    const t = getWeekTonnage(logs, w);
    if (t > 0 || w === maxWeek) tonnageData.push({ label: `С${w}`, tonnage: t });
  }
  const hasTonnageData = tonnageData.some((d) => d.tonnage > 0);

  return (
    <div>
      <button
        onClick={() => setShowTonnage((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 9,
          padding: 12,
          marginBottom: showTonnage ? 8 : 16,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Общ тонаж по седмици</span>
        {showTonnage ? <ChevronUp size={16} color={C.textFaint} /> : <ChevronDown size={16} color={C.textFaint} />}
      </button>

      {showTonnage && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          {!hasTonnageData ? (
            <div style={{ textAlign: "center", color: C.textFaint, fontSize: 12.5, padding: 16 }}>
              Все още няма достатъчно данни за седмичния тонаж.
            </div>
          ) : (
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tonnageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: C.text }}
                    formatter={(v) => [`${v} кг`, "тонаж"]}
                  />
                  <Bar dataKey="tonnage" fill={C.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
        {Object.entries(PROGRAM).map(([num, d]) => (
          <button
            key={num}
            onClick={() => setDayFilter(Number(num))}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1px solid ${dayFilter === Number(num) ? C.gold : C.border}`,
              background: dayFilter === Number(num) ? `${C.gold}20` : C.surface,
              color: dayFilter === Number(num) ? C.gold : C.textDim,
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      <select
        value={exId}
        onChange={(e) => setExId(e.target.value)}
        style={{
          width: "100%",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          color: C.text,
          fontSize: 14,
          padding: "10px 10px",
          marginBottom: 14,
        }}
      >
        {PROGRAM[dayFilter].exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textFaint, fontSize: 13, padding: 30 }}>
          Все още няма записани данни за това упражнение.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, color: C.textDim }}>
              {isTime ? "Приблизителна максимална издръжливост" : "Приблизителен 1RM (Epley)"}
            </div>
            <TrendBadge dir={trend.dir} pct={trend.pct} />
          </div>

          <div style={{ height: 180, marginBottom: 18 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: C.text }}
                />
                <Line type="monotone" dataKey="value" stroke={C.gold} strokeWidth={2.5} dot={{ r: 3, fill: C.gold }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
            История по седмици
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...sessions].reverse().map((s) => (
              <div
                key={s.date}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: 12.5, color: C.textDim }}>
                  седмица {getWeekNumber(s.date)} · {formatDateBG(s.date)}
                </span>
                <span style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>
                  {isTime
                    ? s.sets.map((x) => `${x.duration}с`).join(" / ")
                    : s.sets.map((x) => `${x.reps}×${x.weight}кг`).join(" / ")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------- PR TAB ---------------------------------- */

function PRTab({ logs }) {
  return (
    <div>
      {Object.entries(PROGRAM).map(([num, day]) => (
        <div key={num} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, color: C.goldDim, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
            {day.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {day.exercises.map((ex) => {
              const pr = getPR(logs, ex.id);
              const isTime = ex.type === "time";
              return (
                <div
                  key={ex.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <ExercisePictogram pose={EXERCISE_POSE[ex.id]} size={22} />
                    <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ex.name}
                    </span>
                  </div>
                  {pr ? (
                    <span style={{ fontSize: 13, color: C.gold, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                      {isTime ? `${pr.duration}с` : `${pr.weight}кг × ${pr.reps}`}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: C.textFaint, flexShrink: 0, marginLeft: 8 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- HISTORY TAB ---------------------------------- */

function DayLogSummary({ date, record, logs }) {
  const weekday = getISOWeekday(date);
  const day = PROGRAM[weekday];

  const trainedExercises = day
    ? day.exercises.filter((ex) => {
        const sets = record?.sets?.[ex.id];
        return sets && sets.some((s) => (s.weight && s.reps) || s.duration);
      })
    : [];

  const tonnage = getDayTonnage(record);
  const sleepMinutes = getSleepMinutes(record?.sleepStart, record?.sleepEnd);
  const calories = logs ? getDayCalories(logs, date) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sleepMinutes !== null && (
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 2 }}>
          сън: {formatSleepDuration(sleepMinutes)} ({record.sleepStart}–{record.sleepEnd})
        </div>
      )}
      {(record?.workoutDurationSec || tonnage > 0 || calories !== null) && (
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.textDim, marginBottom: 2, flexWrap: "wrap" }}>
          {record?.workoutDurationSec ? <span>продължителност: {formatDuration(record.workoutDurationSec)}</span> : null}
          {tonnage > 0 ? <span>тонаж: {tonnage} кг</span> : null}
          {calories !== null ? <span>калории: {calories}</span> : null}
        </div>
      )}
      {!day ? (
        <div style={{ fontSize: 12.5, color: C.textFaint, padding: "4px 2px" }}>Почивен ден по програма.</div>
      ) : trainedExercises.length === 0 ? (
        <div style={{ fontSize: 12.5, color: C.textFaint, padding: "4px 2px" }}>
          Няма записани данни за този ден.
        </div>
      ) : (
        trainedExercises.map((ex) => {
          const isTime = ex.type === "time";
          const sets = record.sets[ex.id].filter((s) => (s.weight && s.reps) || s.duration);
          const restValues = record.sets[ex.id].map((s) => s.restAfterSec).filter((v) => v != null);
          const avgRest = restValues.length
            ? Math.round(restValues.reduce((a, b) => a + b, 0) / restValues.length)
            : null;
          return (
            <div
              key={ex.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.text, paddingRight: 8 }}>{ex.name}</span>
                <span style={{ fontSize: 12.5, color: C.gold, fontWeight: 600, flexShrink: 0, textAlign: "right" }}>
                  {isTime
                    ? sets.map((s) => `${s.duration}с`).join(" / ")
                    : sets.map((s) => `${s.reps}×${s.weight}кг`).join(" / ")}
                </span>
              </div>
              {avgRest !== null && (
                <span style={{ fontSize: 11, color: C.textFaint }}>ср. почивка: {formatDuration(avgRest)}</span>
              )}
            </div>
          );
        })
      )}
      {record?.bodyWeight ? (
        <div style={{ fontSize: 12, color: C.textFaint, marginTop: 2 }}>
          {day ? "Тегло преди тренировка" : "Тегло в почивен ден"}:{" "}
          <span style={{ color: C.textDim, fontWeight: 600 }}>{record.bodyWeight} кг</span>
        </div>
      ) : null}
    </div>
  );
}

function CalendarPicker({ selectedDate, onSelect, min, max }) {
  const initial = selectedDate ? parseISO(selectedDate) : parseISO(max);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = `${MONTHS_BG[viewMonth]} ${viewYear}`;

  const changeMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div
      style={{
        background: C.surfaceRaised,
        border: `1px solid ${C.border}`,
        borderRadius: 9,
        padding: 12,
        marginTop: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={() => changeMonth(-1)} style={{ ...navBtnStyle, width: 30, height: 30 }} aria-label="Предишен месец">
          <ChevronLeft size={15} color={C.text} />
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>{monthLabel}</span>
        <button onClick={() => changeMonth(1)} style={{ ...navBtnStyle, width: 30, height: 30 }} aria-label="Следващ месец">
          <ChevronRight size={15} color={C.text} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {["П", "В", "С", "Ч", "П", "С", "Н"].map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10.5, color: C.textFaint, padding: "4px 0" }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const disabled = dateStr < min || dateStr > max;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? C.gold : "transparent",
                color: disabled ? C.textFaint : isSelected ? C.bg : C.text,
                opacity: disabled ? 0.35 : 1,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodSelector({ onChange }) {
  const todaySofia = getTodaySofia();
  const maxWeek = Math.max(getWeekNumber(todaySofia), 1);
  const weeks = [];
  for (let w = 1; w <= maxWeek; w++) weeks.push(w);
  const todayD = parseISO(todaySofia);

  const [mode, setMode] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState(maxWeek);
  const [monthYear, setMonthYear] = useState(todayD.getFullYear());
  const [monthIndex, setMonthIndex] = useState(todayD.getMonth());
  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo, setRangeTo] = useState(null);
  const [rangePicking, setRangePicking] = useState(null);

  let fromDate = null;
  let toDate = null;
  if (mode === "week") {
    const wd = getFullWeekDates(selectedWeek);
    fromDate = wd[0];
    toDate = wd[6];
  } else if (mode === "month") {
    [fromDate, toDate] = getMonthRange(monthYear, monthIndex);
  } else if (mode === "range") {
    fromDate = rangeFrom;
    toDate = rangeTo;
  }

  useEffect(() => {
    onChange(fromDate, toDate);
  }, [mode, selectedWeek, monthYear, monthIndex, rangeFrom, rangeTo]); // eslint-disable-line

  const modes = [
    { id: "all", label: "Целия период" },
    { id: "week", label: "Седмица" },
    { id: "month", label: "Месец" },
    { id: "range", label: "Период" },
  ];

  const monthLabel = `${MONTHS_BG[monthIndex]} ${monthYear}`;
  const changeMonth = (delta) => {
    let m = monthIndex + delta;
    let y = monthYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonthIndex(m);
    setMonthYear(y);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginBottom: mode === "all" ? 0 : 8 }}>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1px solid ${mode === m.id ? C.gold : C.border}`,
              background: mode === m.id ? `${C.gold}20` : C.surface,
              color: mode === m.id ? C.gold : C.textDim,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "week" && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
                border: `1px solid ${selectedWeek === w ? C.gold : C.border}`,
                background: selectedWeek === w ? `${C.gold}20` : C.surface,
                color: selectedWeek === w ? C.gold : C.textDim,
              }}
            >
              Седмица {w}
            </button>
          ))}
        </div>
      )}

      {mode === "month" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 9,
            padding: 10,
          }}
        >
          <button onClick={() => changeMonth(-1)} style={{ ...navBtnStyle, width: 28, height: 28 }} aria-label="Предишен месец">
            <ChevronLeft size={14} color={C.text} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ ...navBtnStyle, width: 28, height: 28 }} aria-label="Следващ месец">
            <ChevronRight size={14} color={C.text} />
          </button>
        </div>
      )}

      {mode === "range" && (
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setRangePicking(rangePicking === "from" ? null : "from")}
              style={{
                flex: 1,
                background: C.surface,
                border: `1px solid ${rangePicking === "from" ? C.gold : C.border}`,
                borderRadius: 8,
                padding: "9px 10px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10, color: C.textFaint }}>От дата</div>
              <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>
                {rangeFrom ? formatDateBG(rangeFrom) : "изберете"}
              </div>
            </button>
            <button
              onClick={() => setRangePicking(rangePicking === "to" ? null : "to")}
              style={{
                flex: 1,
                background: C.surface,
                border: `1px solid ${rangePicking === "to" ? C.gold : C.border}`,
                borderRadius: 8,
                padding: "9px 10px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10, color: C.textFaint }}>До дата</div>
              <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{rangeTo ? formatDateBG(rangeTo) : "изберете"}</div>
            </button>
          </div>
          {rangePicking && (
            <div style={{ marginTop: 8 }}>
              <CalendarPicker
                selectedDate={rangePicking === "from" ? rangeFrom : rangeTo}
                min={MIN_DATE}
                max={todaySofia}
                onSelect={(d) => {
                  if (rangePicking === "from") setRangeFrom(d);
                  else setRangeTo(d);
                  setRangePicking(null);
                }}
              />
            </div>
          )}
          {rangeFrom && rangeTo && rangeFrom > rangeTo && (
            <div style={{ fontSize: 11.5, color: C.down, marginTop: 6 }}>Началната дата трябва да е преди крайната.</div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ logs }) {
  const todayISO = getTodaySofia();
  const todayWeek = Math.max(getWeekNumber(todayISO), 1);
  const weeks = [];
  for (let w = 1; w <= todayWeek; w++) weeks.push(w);

  const [selectedWeek, setSelectedWeek] = useState(todayWeek);
  const [expandedDate, setExpandedDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const weekDays = getFullWeekDates(selectedWeek);

  const handleJump = (dateStr) => {
    if (!dateStr) return;
    setSelectedWeek(Math.max(getWeekNumber(dateStr), 1));
    setExpandedDate(dateStr);
    setCalendarOpen(false);
  };

  const streak = getCurrentStreak(logs);
  const recentScheduled =
    todayISO >= START_DATE ? getScheduledDates(START_DATE, todayISO).slice(-15) : [];

  return (
    <div>
      {recentScheduled.length > 0 && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Flame size={17} color={streak > 0 ? C.gold : C.textFaint} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              {streak > 0 ? `${streak} тренировки поред` : "Без активна серия"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {recentScheduled.map((d) => {
              const trained = isDayTrained(logs, d);
              return (
                <div
                  key={d}
                  title={formatDateBG(d)}
                  style={{
                    flex: 1,
                    height: 20,
                    borderRadius: 5,
                    background: trained ? C.gold : C.border,
                    opacity: trained ? 1 : 0.5,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setCalendarOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: C.surface,
          border: `1px solid ${calendarOpen ? C.gold : C.border}`,
          borderRadius: 9,
          padding: 12,
          marginBottom: calendarOpen ? 0 : 14,
        }}
      >
        <CalendarDays size={16} color={C.gold} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: C.textDim, flex: 1, textAlign: "left" }}>
          {expandedDate ? `${WEEKDAY_LABELS[getISOWeekday(expandedDate)]}, ${formatDateBG(expandedDate)}` : "Отиди на дата"}
        </span>
        {calendarOpen ? <ChevronUp size={16} color={C.textFaint} /> : <ChevronDown size={16} color={C.textFaint} />}
      </button>
      {calendarOpen && (
        <div style={{ marginBottom: 14 }}>
          <CalendarPicker selectedDate={expandedDate} onSelect={handleJump} min={MIN_DATE} max={todayISO} />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => {
              setSelectedWeek(w);
              setExpandedDate(null);
            }}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1px solid ${selectedWeek === w ? C.gold : C.border}`,
              background: selectedWeek === w ? `${C.gold}20` : C.surface,
              color: selectedWeek === w ? C.gold : C.textDim,
            }}
          >
            Седмица {w}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weekDays.map((date) => {
          const weekday = getISOWeekday(date);
          const day = PROGRAM[weekday];
          const record = logs[date];
          const hasData =
            record &&
            ((record.sets && Object.values(record.sets).some((sets) => sets.some((s) => (s.weight && s.reps) || s.duration))) ||
              record.bodyWeight ||
              (record.sleepStart && record.sleepEnd));
          const isOpen = expandedDate === date;
          const isFuture = date > getTodaySofia();

          return (
            <div
              key={date}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => !isFuture && setExpandedDate(isOpen ? null : date)}
                disabled={isFuture}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "transparent",
                  opacity: isFuture ? 0.4 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: hasData ? C.up : C.border,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>
                      {WEEKDAY_LABELS[weekday]}, {formatDateBG(date)}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textFaint }}>{day ? day.focus : "почивен ден"}</div>
                  </div>
                </div>
                {!isFuture && (isOpen ? <ChevronUp size={16} color={C.textFaint} /> : <ChevronDown size={16} color={C.textFaint} />)}
              </button>
              {isOpen && (
                <div style={{ padding: "0 14px 14px" }}>
                  <DayLogSummary date={date} record={record} logs={logs} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- WEIGHT TAB ---------------------------------- */

function SleepTab({ logs }) {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const allSessions = getAllSleepSessions(logs);
  const sessions = allSessions.filter(
    (s) => (fromDate ? s.date >= fromDate : true) && (toDate ? s.date <= toDate : true)
  );

  const periodAvg = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.minutes, 0) / sessions.length) : null;
  const consistencySpread = getBedtimeConsistency(sessions);
  const recommendation = getSleepRecommendation(periodAvg, consistencySpread);

  const chartData = sessions.map((s) => ({ label: formatDateBG(s.date), hours: round1(s.minutes / 60) }));

  const recColor = recommendation?.type === "warn" ? C.down : recommendation?.type === "good" ? C.steel : C.gold;

  return (
    <div>
      <PeriodSelector onChange={(f, t) => { setFromDate(f); setToDate(t); }} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Средно за периода</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
            {periodAvg !== null ? formatSleepDuration(periodAvg) : "—"}
          </div>
        </div>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Постоянство на лягане</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
            {consistencySpread !== null ? `±${Math.round(consistencySpread / 2)} мин` : "—"}
          </div>
        </div>
      </div>

      {recommendation && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: `${recColor}15`,
            border: `1px solid ${recColor}40`,
            borderRadius: 9,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {recommendation.type === "good" ? (
              <Check size={15} color={recColor} style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertTriangle size={15} color={recColor} style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <span style={{ fontSize: 12.5, color: C.text }}>{recommendation.text}</span>
          </div>
          {recommendation.consistencyNote && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", paddingTop: 6, borderTop: `1px solid ${recColor}30` }}>
              <Moon size={14} color={C.steel} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: C.textDim }}>{recommendation.consistencyNote}</span>
            </div>
          )}
        </div>
      )}

      {sessions.length < 2 ? (
        <div style={{ textAlign: "center", color: C.textFaint, fontSize: 13, padding: 30 }}>
          Няма достатъчно записи за сън в избрания период.
        </div>
      ) : (
        <div style={{ height: 180, marginBottom: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: C.text }}
                formatter={(v) => [`${v} ч`, "сън"]}
              />
              <Line type="monotone" dataKey="hours" stroke={C.steel} strokeWidth={2.5} dot={{ r: 3, fill: C.steel }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {sessions.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
            История за периода
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...sessions].reverse().map((s) => (
              <div
                key={s.date}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: 12.5, color: C.textDim }}>{formatDateBG(s.date)}</span>
                <span style={{ fontSize: 12, color: C.textFaint }}>
                  {s.sleepStart}–{s.sleepEnd}
                </span>
                <span style={{ fontSize: 12.5, color: C.steel, fontWeight: 700 }}>{formatSleepDuration(s.minutes)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CaloriesTab({ logs }) {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const allSessions = getAllCalorieSessions(logs);
  const sessions = allSessions.filter(
    (s) => (fromDate ? s.date >= fromDate : true) && (toDate ? s.date <= toDate : true)
  );

  const total = sessions.reduce((a, s) => a + s.calories, 0);
  const avg = sessions.length ? Math.round(total / sessions.length) : null;

  const chartData = sessions.map((s) => ({ label: formatDateBG(s.date), calories: s.calories }));

  return (
    <div>
      <PeriodSelector onChange={(f, t) => { setFromDate(f); setToDate(t); }} />

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Общо за периода</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
            {sessions.length ? `${total} кал` : "—"}
          </div>
        </div>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Средно на тренировка</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
            {avg !== null ? `${avg} кал` : "—"}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: C.surfaceRaised,
          border: `1px solid ${C.border}`,
          borderRadius: 9,
          padding: 10,
          marginBottom: 16,
        }}
      >
        <Flame size={14} color={C.gold} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11.5, color: C.textDim, lineHeight: 1.5 }}>
          Приблизителна оценка: личен базов метаболизъм (тегло, ръст, възраст, пол) × интензивност, изведена от
          почивките между сериите и общия вдигнат тонаж, × продължителност. Само тренировъчни дни, Пон–Пет. Не е
          медицински точно измерване.
        </span>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textFaint, fontSize: 13, padding: 30 }}>
          Няма изчислени калории за избрания период — нужни са записана продължителност на тренировката и тегло за деня.
        </div>
      ) : (
        <div style={{ height: 180, marginBottom: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: C.text }}
                formatter={(v) => [`${v} кал`, "калории"]}
              />
              <Bar dataKey="calories" fill={C.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {sessions.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
            История за периода
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...sessions].reverse().map((s) => (
              <div
                key={s.date}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: 12.5, color: C.textDim }}>{formatDateBG(s.date)}</span>
                <span style={{ fontSize: 12.5, color: C.gold, fontWeight: 700 }}>{s.calories} кал</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WeightTab({ logs }) {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const data = Object.keys(logs)
    .filter((d) => logs[d]?.bodyWeight && (fromDate ? d >= fromDate : true) && (toDate ? d <= toDate : true))
    .sort()
    .map((d) => ({ date: d, label: formatDateBG(d), weight: logs[d].bodyWeight }));

  const first = data[0]?.weight;
  const last = data[data.length - 1]?.weight;
  const delta = first != null && last != null ? round1(last - first) : null;
  const avg = data.length ? round1(data.reduce((a, d) => a + d.weight, 0) / data.length) : null;

  return (
    <div>
      <PeriodSelector onChange={(f, t) => { setFromDate(f); setToDate(t); }} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Средно за периода</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
            {avg !== null ? `${avg} кг` : "—"}
          </div>
        </div>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Промяна за периода</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: displayFont,
              color: delta > 0 ? C.up : delta < 0 ? C.down : C.text,
            }}
          >
            {delta !== null ? `${delta > 0 ? "+" : ""}${delta} кг` : "—"}
          </div>
        </div>
      </div>

      {data.length < 2 ? (
        <div style={{ textAlign: "center", color: C.textFaint, fontSize: 13, padding: 30 }}>
          Няма достатъчно записи за тегло в избрания период.
        </div>
      ) : (
        <div style={{ height: 200, marginBottom: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: C.text }}
              />
              <Line type="monotone" dataKey="weight" stroke={C.gold} strokeWidth={2.5} dot={{ r: 3, fill: C.gold }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
            История за периода
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...data].reverse().map((d) => (
              <div
                key={d.date}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: 12.5, color: C.textDim }}>{d.label}</span>
                <span style={{ fontSize: 12.5, color: C.gold, fontWeight: 700 }}>{d.weight} кг</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------- EXPORT PANEL ---------------------------------- */

function ExportPanel({ logs, onClose }) {
  const todaySofia = getTodaySofia();
  const maxWeek = Math.max(getWeekNumber(todaySofia), 1);
  const weeks = [];
  for (let w = 1; w <= maxWeek; w++) weeks.push(w);

  const todayD = parseISO(todaySofia);

  const [mode, setMode] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState(maxWeek);
  const [monthYear, setMonthYear] = useState(todayD.getFullYear());
  const [monthIndex, setMonthIndex] = useState(todayD.getMonth());
  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo, setRangeTo] = useState(null);
  const [rangePicking, setRangePicking] = useState(null); // 'from' | 'to' | null
  const [justDownloaded, setJustDownloaded] = useState(false);

  const modes = [
    { id: "all", label: "Целия период" },
    { id: "week", label: "По седмица" },
    { id: "month", label: "По месец" },
    { id: "range", label: "Конкретен период" },
  ];

  let fromDate = null;
  let toDate = null;
  let canExport = true;
  let filenameSuffix = "all";

  if (mode === "week") {
    const wd = getWeekDates(selectedWeek);
    fromDate = wd[0];
    toDate = wd[4];
    filenameSuffix = `sedmica-${selectedWeek}`;
  } else if (mode === "month") {
    [fromDate, toDate] = getMonthRange(monthYear, monthIndex);
    filenameSuffix = `${monthYear}-${String(monthIndex + 1).padStart(2, "0")}`;
  } else if (mode === "range") {
    fromDate = rangeFrom;
    toDate = rangeTo;
    canExport = !!rangeFrom && !!rangeTo && rangeFrom <= rangeTo;
    filenameSuffix = rangeFrom && rangeTo ? `${rangeFrom}_${rangeTo}` : "period";
  }

  const handleExport = () => {
    if (!canExport) return;
    const csv = buildCSV(logs, fromDate, toDate);
    downloadCSV(csv, `sila-dnevnik_${filenameSuffix}.csv`);
    setJustDownloaded(true);
    setTimeout(() => setJustDownloaded(false), 2000);
  };

  const monthLabel = `${MONTHS_BG[monthIndex]} ${monthYear}`;
  const changeMonth = (delta) => {
    let m = monthIndex + delta;
    let y = monthYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonthIndex(m);
    setMonthYear(y);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: displayFont }}>Резервно копие</div>
        <button onClick={onClose} style={{ ...navBtnStyle, width: 34, height: 34 }} aria-label="Затвори">
          <X size={16} color={C.text} />
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 14, lineHeight: 1.5 }}>
        Изтегли данните си като CSV файл (отваря се в Excel / Google Sheets), за да имаш собствено копие извън приложението.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: "7px 12px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1px solid ${mode === m.id ? C.gold : C.border}`,
              background: mode === m.id ? `${C.gold}20` : C.surface,
              color: mode === m.id ? C.gold : C.textDim,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "week" && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 18, paddingBottom: 2 }}>
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
                border: `1px solid ${selectedWeek === w ? C.gold : C.border}`,
                background: selectedWeek === w ? `${C.gold}20` : C.surface,
                color: selectedWeek === w ? C.gold : C.textDim,
              }}
            >
              Седмица {w}
            </button>
          ))}
        </div>
      )}

      {mode === "month" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 9,
            padding: 12,
            marginBottom: 18,
          }}
        >
          <button onClick={() => changeMonth(-1)} style={{ ...navBtnStyle, width: 30, height: 30 }} aria-label="Предишен месец">
            <ChevronLeft size={15} color={C.text} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ ...navBtnStyle, width: 30, height: 30 }} aria-label="Следващ месец">
            <ChevronRight size={15} color={C.text} />
          </button>
        </div>
      )}

      {mode === "range" && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setRangePicking(rangePicking === "from" ? null : "from")}
              style={{
                flex: 1,
                background: C.surface,
                border: `1px solid ${rangePicking === "from" ? C.gold : C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10.5, color: C.textFaint }}>От дата</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                {rangeFrom ? formatDateBG(rangeFrom) : "изберете"}
              </div>
            </button>
            <button
              onClick={() => setRangePicking(rangePicking === "to" ? null : "to")}
              style={{
                flex: 1,
                background: C.surface,
                border: `1px solid ${rangePicking === "to" ? C.gold : C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10.5, color: C.textFaint }}>До дата</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{rangeTo ? formatDateBG(rangeTo) : "изберете"}</div>
            </button>
          </div>
          {rangePicking && (
            <CalendarPicker
              selectedDate={rangePicking === "from" ? rangeFrom : rangeTo}
              min={MIN_DATE}
              max={todaySofia}
              onSelect={(d) => {
                if (rangePicking === "from") setRangeFrom(d);
                else setRangeTo(d);
                setRangePicking(null);
              }}
            />
          )}
          {rangeFrom && rangeTo && rangeFrom > rangeTo && (
            <div style={{ fontSize: 11.5, color: C.down, marginTop: 8 }}>Началната дата трябва да е преди крайната.</div>
          )}
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={!canExport}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "13px 16px",
          borderRadius: 9,
          border: "none",
          background: canExport ? C.gold : C.border,
          color: canExport ? C.bg : C.textFaint,
          fontSize: 14.5,
          fontWeight: 700,
        }}
      >
        {justDownloaded ? <Check size={17} /> : <Download size={17} />}
        {justDownloaded ? "Изтеглено" : "Изтегли CSV"}
      </button>
    </div>
  );
}

/* ---------------------------------- APP ---------------------------------- */

export default function FitnessTracker() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState({});
  const [currentDate, setCurrentDate] = useState(getTodaySofia());
  const [tab, setTab] = useState("today");
  const [saveState, setSaveState] = useState("idle");
  const [showExport, setShowExport] = useState(false);
  const [activeRest, setActiveRest] = useState(null); // { date, exId, setIndex, startedAt }
  const [, restTick] = useState(0);
  const saveTimer = useRef(null);

  useEffect(() => {
    loadAllLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activeRest) return;
    const id = setInterval(() => restTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeRest]);

  const startRest = (date, exId, setIndex) => setActiveRest({ date, exId, setIndex, startedAt: Date.now() });

  const stopRest = () => {
    if (!activeRest) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - activeRest.startedAt) / 1000));
    const exercise = EXERCISE_BY_ID[activeRest.exId];
    const rec = logs[activeRest.date] || { bodyWeight: null, sets: {} };
    const current = rec.sets?.[activeRest.exId] || Array.from({ length: exercise.sets }, () => ({}));
    const nextSets = current.map((s, i) => (i === activeRest.setIndex ? { ...s, restAfterSec: elapsed } : s));
    updateRecord(activeRest.date, { ...rec, sets: { ...rec.sets, [activeRest.exId]: nextSets } });
    if (navigator.vibrate) navigator.vibrate(100);
    setActiveRest(null);
  };

  const cancelRest = () => setActiveRest(null);

  const updateRecord = (date, record) => {
    setLogs((prev) => ({ ...prev, [date]: record }));
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveLog(date, record);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ ...wrapStyle, alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ color: C.textDim, fontSize: 13 }}>Зареждане…</div>
      </div>
    );
  }

  const tabs = [
    { id: "today", label: "Днес", icon: Dumbbell },
    { id: "progress", label: "Прогрес", icon: TrendingUp },
    { id: "history", label: "История", icon: CalendarDays },
    { id: "prs", label: "Рекорди", icon: Trophy },
    { id: "weight", label: "Тегло", icon: Scale },
    { id: "sleep", label: "Сън", icon: Moon },
    { id: "calories", label: "Калории", icon: Flame },
  ];

  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "16px 14px 90px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlateMark size={26} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: displayFont, letterSpacing: 1 }}>
                СИЛА · ДНЕВНИК
              </div>
              <div style={{ fontSize: 10.5, color: C.textFaint }}>
                {saveState === "saving" ? "запазва се…" : saveState === "saved" ? "запазено ✓" : "проследяване на прогреса"}
              </div>
            </div>
          </div>
          {!showExport && (
            <button onClick={() => setShowExport(true)} style={navBtnStyle} aria-label="Резервно копие">
              <Download size={17} color={C.gold} />
            </button>
          )}
        </div>

        <StripeDivider color={tab === "sleep" ? C.steel : C.gold} />

        {showExport ? (
          <ExportPanel logs={logs} onClose={() => setShowExport(false)} />
        ) : (
          <>
            {tab === "today" && (
              <TodayTab
                logs={logs}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                updateRecord={updateRecord}
                activeRest={activeRest}
                startRest={startRest}
                stopRest={stopRest}
              />
            )}
            {tab === "progress" && <ProgressTab logs={logs} />}
            {tab === "history" && <HistoryTab logs={logs} />}
            {tab === "prs" && <PRTab logs={logs} />}
            {tab === "weight" && <WeightTab logs={logs} />}
            {tab === "sleep" && <SleepTab logs={logs} />}
            {tab === "calories" && <CaloriesTab logs={logs} />}
          </>
        )}
      </div>

      {activeRest && (
        <div
          style={{
            position: "fixed",
            bottom: 66,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.surfaceRaised,
              border: `1px solid ${C.gold}66`,
              borderRadius: 30,
              padding: "8px 10px 8px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              maxWidth: "92%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: displayFont }}>
                {formatDuration(Math.floor((Date.now() - activeRest.startedAt) / 1000))}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: C.textFaint,
                  maxWidth: 130,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {EXERCISE_BY_ID[activeRest.exId]?.name}, серия {activeRest.setIndex + 1}
              </span>
            </div>
            <button onClick={stopRest} style={{ ...navBtnStyle, width: 36, height: 36, background: C.gold }} aria-label="Стоп — запази почивката">
              <Check size={16} color={C.bg} />
            </button>
            <button onClick={cancelRest} style={{ ...navBtnStyle, width: 30, height: 30 }} aria-label="Откажи без запазване">
              <X size={14} color={C.textFaint} />
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "center",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div style={{ display: "flex", width: "100%", maxWidth: 460, overflowX: "auto" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const accent = t.id === "sleep" ? C.steel : C.gold;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setShowExport(false);
                }}
                style={{
                  flex: "1 0 58px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "10px 4px 8px",
                  background: "transparent",
                  position: "relative",
                }}
              >
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "30%",
                      right: "30%",
                      height: 2,
                      background: accent,
                      borderRadius: 2,
                    }}
                  />
                )}
                <Icon size={19} color={active ? accent : C.textFaint} />
                <span style={{ fontSize: 10.5, color: active ? accent : C.textFaint, fontWeight: active ? 700 : 400 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const wrapStyle = {
  background: C.bg,
  minHeight: "100vh",
  fontFamily: bodyFont,
  color: C.text,
};
