import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Archive,
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Flame,
  Heart,
  Import,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TimerReset,
  Trash2,
  Upload,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isSameDay,
  parse,
  startOfWeek,
  subDays
} from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './styles.css';

const todayKey = () => format(new Date(), 'yyyy-MM-dd');
const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const categories = ['study', 'exercise', 'personal', 'break'];
const categoryLabels = { study: 'Study', exercise: 'Exercise', personal: 'Personal', break: 'Break' };
const categoryColors = { study: '#4b7f8c', exercise: '#4f7d4b', personal: '#8a6f3d', break: '#b56d43' };
const energyLabels = ['Drained', 'Low', 'Good', 'Energized'];
const completionLabels = {
  full: 'Done',
  partial: 'Good enough',
  showed_up: 'Showed up',
  skipped: 'Skip',
  too_much_today: 'Too much today'
};
const energyRank = { low: 1, medium: 2, high: 3 };
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api/state';

const defaultTemplates = [
  {
    template_id: 'tpl_coding_focus',
    name: 'Coding Focus',
    description: 'A balanced day for study, movement, and quiet progress.',
    category: 'Normal',
    is_rest_day_template: false,
    created_date: todayKey(),
    last_used_date: todayKey(),
    tasks: [
      task('Open the day', '06:30 AM', 25, 30, 'personal', 'Low friction morning setup.', true, 'low', [
        ['Drink water', 3],
        ['Review today', 5],
        ['Choose first task', 7]
      ]),
      task('DSA practice', '07:15 AM', 90, 80, 'study', 'One topic, two solved problems.', true, 'high', [
        ['Open notes', 2],
        ['Read one example', 5],
        ['Solve one problem', 15],
        ['Review mistake', 10]
      ]),
      task('Movement break', '10:00 AM', 30, 35, 'exercise', 'Walk, stretch, or bodyweight work.', false, 'medium'),
      task('Project build block', '04:30 PM', 120, 100, 'study', 'A focused implementation session.', true, 'high'),
      task('Shutdown reflection', '09:30 PM', 20, 25, 'personal', 'Close loops and make tomorrow lighter.', false, 'low')
    ]
  },
  {
    template_id: 'tpl_exam_week',
    name: 'Exam Week',
    description: 'More study capacity with protected recovery blocks.',
    category: 'Intensive',
    is_rest_day_template: false,
    created_date: todayKey(),
    last_used_date: '',
    tasks: [
      task('Formula recall', '06:45 AM', 45, 50, 'study', 'Active recall before distractions.', true, 'medium'),
      task('Past paper block', '09:00 AM', 120, 120, 'study', 'Timed practice with corrections.', true, 'high'),
      task('Recovery walk', '01:00 PM', 25, 30, 'break', 'Keep the brain online.', true, 'low'),
      task('Weak topic review', '06:00 PM', 90, 90, 'study', 'The one topic that would change the score.', true, 'medium')
    ]
  },
  {
    template_id: 'tpl_recovery',
    name: 'Recovery Mode',
    description: 'A rest day that still counts because recovery is part of the plan.',
    category: 'Recovery',
    is_rest_day_template: true,
    created_date: todayKey(),
    last_used_date: '',
    tasks: [
      task('Basic care', '09:00 AM', 20, 30, 'personal', 'Food, water, medication, sunlight.', true, 'low'),
      task('Gentle reset', '03:00 PM', 20, 25, 'break', 'Stretch, tidy one surface, or breathe.', false, 'low'),
      task('Tomorrow preview', '08:30 PM', 10, 20, 'personal', 'One kind choice for tomorrow.', true, 'low')
    ]
  }
];

function task(title, time, duration, points, category, notes, mandatory, energy, microsteps = []) {
  return {
    task_id: uid('task'),
    title,
    time,
    duration_minutes: duration,
    base_points: points,
    partial_points: Math.round(points * 0.7),
    microsteps: microsteps.map(([label, pts]) => ({ id: uid('step'), title: label, points: pts, done: false })),
    category,
    notes,
    is_mandatory: mandatory,
    energy_level_required: energy
  };
}

const initialState = {
  templates: defaultTemplates,
  dailyPlans: {},
  dailyRecords: {},
  userProgress: {
    total_lifetime_points: 0,
    current_level: 1,
    xp_to_next_level: 1000,
    current_streak: 0,
    longest_streak: 0,
    achievements: [],
    streak_history: [],
    freeze_tokens: 1
  },
  activeRoutine: {
    current_template_id: 'tpl_coding_focus',
    started_date: todayKey(),
    planned_end_date: '',
    auto_switch_to_template_id: ''
  },
  externalSchedule: {
    class_schedule: [],
    assignment_deadlines: [],
    exam_dates: []
  },
  reflections: [],
  appMeta: {
    last_opened_date: todayKey(),
    last_backup_date: '',
    last_auto_backup_prompt_date: '',
    backup_warning_dismissed_date: '',
    rollover_review: null,
    install_prompt_dismissed_date: '',
    notification_log: {},
    backend_status: 'checking'
  },
  preferences: {
    pomodoro_settings: { work: 25, break: 5, long_break: 15 },
    notification_preferences: { taskReminders: false, endOfDay: false, weeklyReflection: false },
    compassionate_mode: true,
    theme: 'light',
    show_penalties: false,
    dashboard_mode: 'focus'
  }
};

function normalize(saved) {
  if (!saved) return initialState;
  return {
    ...initialState,
    ...saved,
    templates: saved.templates?.length ? saved.templates : defaultTemplates,
    dailyPlans: saved.dailyPlans || {},
    preferences: { ...initialState.preferences, ...saved.preferences },
    userProgress: { ...initialState.userProgress, ...saved.userProgress },
    externalSchedule: { ...initialState.externalSchedule, ...saved.externalSchedule },
    appMeta: { ...initialState.appMeta, ...saved.appMeta }
  };
}

function loadState() {
  try {
    const raw = window.storage?.getItem ? window.storage.getItem('steady-state') : localStorage.getItem('steady-state');
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return initialState;
  }
}

function saveState(state) {
  const raw = JSON.stringify(state);
  if (window.storage?.setItem) window.storage.setItem('steady-state', raw);
  else localStorage.setItem('steady-state', raw);
}

async function loadBackendState() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Backend unavailable');
  const payload = await response.json();
  return payload.state ? normalize(payload.state) : null;
}

async function saveBackendState(state) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(state)
  });
  if (!response.ok) throw new Error('Backend save failed');
  return response.json();
}

function reducer(state, action) {
  switch (action.type) {
    case 'BACKEND_LOADED':
      return { ...normalize(action.state), appMeta: { ...normalize(action.state).appMeta, backend_status: 'connected' } };
    case 'BACKEND_STATUS':
      if (state.appMeta.backend_status === action.status) return state;
      return { ...state, appMeta: { ...state.appMeta, backend_status: action.status } };
    case 'SET_TEMPLATE':
      return { ...state, activeRoutine: { ...state.activeRoutine, current_template_id: action.id, started_date: todayKey() } };
    case 'SAVE_DAILY_PLAN':
      return {
        ...state,
        dailyPlans: {
          ...state.dailyPlans,
          [action.date]: { date: action.date, name: action.name || format(new Date(action.date), 'MMM d'), tasks: action.tasks }
        }
      };
    case 'DELETE_DAILY_PLAN':
      return { ...state, dailyPlans: Object.fromEntries(Object.entries(state.dailyPlans).filter(([date]) => date !== action.date)) };
    case 'SAVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.some((t) => t.template_id === action.template.template_id)
          ? state.templates.map((t) => (t.template_id === action.template.template_id ? action.template : t))
          : [...state.templates, action.template]
      };
    case 'DELETE_TEMPLATE': {
      const templates = state.templates.filter((t) => t.template_id !== action.id);
      return {
        ...state,
        templates,
        activeRoutine: {
          ...state.activeRoutine,
          current_template_id: templates[0]?.template_id || ''
        }
      };
    }
    case 'DAILY_ROLLOVER':
      return applyDailyRollover(state);
    case 'DISMISS_ROLLOVER':
      return { ...state, appMeta: { ...state.appMeta, rollover_review: null } };
    case 'CARRY_OVER_TASKS':
      return carryOverTasks(state, action.taskIds);
    case 'SKIP_OLD_TASKS':
      return skipOldTasks(state, action.taskIds);
    case 'UPDATE_BACKUP_META':
      return { ...state, appMeta: { ...state.appMeta, last_backup_date: action.date || todayKey() } };
    case 'MARK_AUTO_BACKUP_PROMPTED':
      return { ...state, appMeta: { ...state.appMeta, last_auto_backup_prompt_date: action.date || todayKey() } };
    case 'DISMISS_BACKUP_WARNING':
      return { ...state, appMeta: { ...state.appMeta, backup_warning_dismissed_date: todayKey() } };
    case 'LOG_NOTIFICATION':
      return {
        ...state,
        appMeta: {
          ...state.appMeta,
          notification_log: { ...state.appMeta.notification_log, [action.key]: new Date().toISOString() }
        }
      };
    case 'COMPLETE_TASK':
      return completeTask(state, action);
    case 'RESCHEDULE_TASK':
      return {
        ...state,
        templates: state.templates.map((tpl) =>
          tpl.template_id === action.templateId
            ? { ...tpl, tasks: tpl.tasks.map((item) => item.task_id === action.taskId ? { ...item, time: action.time } : item) }
            : tpl
        )
      };
    case 'SAVE_NOTE':
      return updateCompletion(state, action.date, action.taskId, { sticky_note: action.note });
    case 'SET_ENERGY':
      return updateCompletion(state, action.date, action.taskId, { [action.phase]: action.value });
    case 'TOGGLE_STEP':
      return toggleStep(state, action);
    case 'ADD_REFLECTION':
      return { ...state, reflections: upsertBy(state.reflections, action.reflection, 'week_start_date') };
    case 'ADD_ASSIGNMENT':
      return { ...state, externalSchedule: { ...state.externalSchedule, assignment_deadlines: [...state.externalSchedule.assignment_deadlines, action.item] } };
    case 'DELETE_ASSIGNMENT':
      return { ...state, externalSchedule: { ...state.externalSchedule, assignment_deadlines: state.externalSchedule.assignment_deadlines.filter((item) => item.id !== action.id) } };
    case 'ADD_CLASS':
      return { ...state, externalSchedule: { ...state.externalSchedule, class_schedule: [...state.externalSchedule.class_schedule, action.item] } };
    case 'DELETE_CLASS':
      return { ...state, externalSchedule: { ...state.externalSchedule, class_schedule: state.externalSchedule.class_schedule.filter((item) => item.id !== action.id) } };
    case 'SET_PREF':
      return { ...state, preferences: { ...state.preferences, [action.key]: action.value } };
    case 'IMPORT_STATE':
      return normalize(action.state);
    case 'RESET_DATA':
      return initialState;
    default:
      return state;
  }
}

function completeTask(state, action) {
  const date = action.date || todayKey();
  const tasks = getTasksForDate(state, date);
  const target = tasks.find((item) => item.task_id === action.taskId);
  if (!target) return state;
  const multiplier = streakMultiplier(state.userProgress.current_streak);
  const points = calculatePoints(target, action.completion_type, action.early, multiplier, action.energyMatch);
  const record = getRecord(state, date);
  const existing = record.tasks_completed.find((item) => item.task_id === action.taskId);
  const priorPoints = existing?.points_earned || 0;
  const completion = {
    task_id: action.taskId,
    completion_type: action.completion_type,
    points_earned: points,
    completion_time: new Date().toISOString(),
    energy_before: existing?.energy_before || 3,
    energy_after: existing?.energy_after || 3,
    sticky_note: existing?.sticky_note || '',
    time_spent_minutes: action.time_spent_minutes || target.duration_minutes
  };
  const nextCompletions = existing
    ? record.tasks_completed.map((item) => (item.task_id === action.taskId ? completion : item))
    : [...record.tasks_completed, completion];
  const nextRecord = summarizeRecord({ ...record, tasks_completed: nextCompletions }, tasks);
  const pointsDelta = points - priorPoints;
  const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord, pointsDelta);
  return {
    ...state,
    dailyRecords: { ...state.dailyRecords, [date]: nextRecord },
    userProgress: progress
  };
}

function updateCompletion(state, date, taskId, patch) {
  const record = getRecord(state, date);
  const existing = record.tasks_completed.find((item) => item.task_id === taskId) || {
    task_id: taskId,
    completion_type: 'skipped',
    points_earned: 0,
    completion_time: '',
    energy_before: 3,
    energy_after: 3,
    sticky_note: '',
    time_spent_minutes: 0
  };
  const nextCompletions = record.tasks_completed.some((item) => item.task_id === taskId)
    ? record.tasks_completed.map((item) => (item.task_id === taskId ? { ...item, ...patch } : item))
    : [...record.tasks_completed, { ...existing, ...patch }];
  return { ...state, dailyRecords: { ...state.dailyRecords, [date]: { ...record, tasks_completed: nextCompletions } } };
}

function applyDailyRollover(state) {
  const today = todayKey();
  const lastOpened = state.appMeta.last_opened_date || today;
  if (lastOpened === today) return state;
  const lastDate = subDays(new Date(today), 1);
  const yesterday = format(lastDate, 'yyyy-MM-dd');
  const yesterdayRecord = getRecord({ ...state, activeRoutine: { ...state.activeRoutine, current_template_id: state.dailyRecords[yesterday]?.active_template_id || state.activeRoutine.current_template_id } }, yesterday);
  const yesterdayTemplate = state.templates.find((tpl) => tpl.template_id === yesterdayRecord.active_template_id) || state.templates[0];
  const yesterdayTasks = getTasksForDate(state, yesterday);
  const doneIds = new Set(yesterdayRecord.tasks_completed.filter((item) => ['full', 'partial', 'showed_up', 'skipped', 'too_much_today'].includes(item.completion_type)).map((item) => item.task_id));
  const incomplete = yesterdayTasks.filter((item) => !doneIds.has(item.task_id));
  const brokeStreak = yesterdayRecord.completion_percentage === 0 && !yesterdayRecord.was_rest_day && incomplete.length > 0;
  const nextState = {
    ...state,
    appMeta: {
      ...state.appMeta,
      last_opened_date: today,
      rollover_review: incomplete.length
        ? {
            from_date: yesterday,
            template_id: yesterdayTemplate.template_id,
            incomplete_task_ids: incomplete.map((item) => item.task_id),
            message: `${incomplete.length} task${incomplete.length === 1 ? '' : 's'} incomplete yesterday`
          }
        : null
    },
    dailyRecords: {
      ...state.dailyRecords,
      [yesterday]: summarizeRecord(yesterdayRecord, yesterdayTasks)
    },
    userProgress: brokeStreak ? { ...state.userProgress, current_streak: 0 } : state.userProgress
  };
  return maybeAutoSwitchTemplate(nextState, today);
}

function maybeAutoSwitchTemplate(state, today) {
  const { planned_end_date: end, auto_switch_to_template_id: nextId } = state.activeRoutine;
  if (!end || !nextId || !isAfter(new Date(today), new Date(end))) return state;
  return {
    ...state,
    activeRoutine: {
      ...state.activeRoutine,
      current_template_id: nextId,
      started_date: today,
      planned_end_date: '',
      auto_switch_to_template_id: ''
    }
  };
}

function carryOverTasks(state, taskIds) {
  const review = state.appMeta.rollover_review;
  if (!review?.template_id) return state;
  const sourceTasks = getTasksForDate(state, review.from_date);
  const activeId = state.activeRoutine.current_template_id;
  const tasksToCarry = sourceTasks.filter((item) => taskIds.includes(item.task_id)).map((item) => ({
    ...item,
    task_id: uid('task'),
    title: `${item.title} (carryover)`,
    time: suggestCarryoverTime(item.time)
  }));
  return {
    ...state,
    templates: state.templates.map((tpl) => tpl.template_id === activeId ? { ...tpl, tasks: [...tasksToCarry, ...tpl.tasks] } : tpl),
    appMeta: { ...state.appMeta, rollover_review: null }
  };
}

function skipOldTasks(state, taskIds) {
  const review = state.appMeta.rollover_review;
  if (!review) return state;
  const record = getRecord(state, review.from_date);
  const nextCompletions = [
    ...record.tasks_completed,
    ...taskIds
      .filter((taskId) => !record.tasks_completed.some((item) => item.task_id === taskId))
      .map((taskId) => ({
        task_id: taskId,
        completion_type: 'skipped',
        points_earned: 0,
        completion_time: new Date().toISOString(),
        energy_before: 3,
        energy_after: 3,
        sticky_note: 'Skipped during daily rollover.',
        time_spent_minutes: 0
      }))
  ];
  const tasks = getTasksForDate(state, review.from_date);
  return {
    ...state,
    dailyRecords: {
      ...state.dailyRecords,
      [review.from_date]: summarizeRecord({ ...record, tasks_completed: nextCompletions }, tasks)
    },
    appMeta: { ...state.appMeta, rollover_review: null }
  };
}

function suggestCarryoverTime(time) {
  try {
    return format(addMinutesSafe(parse(time, 'hh:mm a', new Date()), 60), 'hh:mm a');
  } catch {
    return '10:00 AM';
  }
}

function toggleStep(state, action) {
  return {
    ...state,
    templates: state.templates.map((tpl) =>
      tpl.template_id === action.templateId
        ? {
            ...tpl,
            tasks: tpl.tasks.map((item) =>
              item.task_id === action.taskId
                ? { ...item, microsteps: item.microsteps.map((step) => step.id === action.stepId ? { ...step, done: !step.done } : step) }
                : item
            )
          }
        : tpl
    )
  };
}

function getRecord(state, date) {
  return state.dailyRecords[date] || {
    date,
    active_template_id: state.dailyPlans[date] ? `manual:${date}` : state.activeRoutine.current_template_id,
    tasks_completed: [],
    total_points: 0,
    completion_percentage: 0,
    day_notes: '',
    was_rest_day: state.templates.find((tpl) => tpl.template_id === state.activeRoutine.current_template_id)?.is_rest_day_template || false
  };
}

function getTasksForDate(state, date) {
  return state.dailyPlans[date]?.tasks?.length ? state.dailyPlans[date].tasks : getTemplateForDate(state, date).tasks;
}

function getTemplateForDate(state, date) {
  const record = state.dailyRecords[date];
  const templateId = record?.active_template_id && !record.active_template_id.startsWith('manual:') ? record.active_template_id : state.activeRoutine.current_template_id;
  return state.templates.find((tpl) => tpl.template_id === templateId) || state.templates[0] || { tasks: [], name: 'Manual Plan' };
}

function summarizeRecord(record, source) {
  const completeCount = record.tasks_completed.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
  const tasks = Array.isArray(source) ? source : source?.tasks || [];
  const total = tasks.length || 1;
  const totalPoints = record.tasks_completed.reduce((sum, item) => sum + item.points_earned, 0);
  return { ...record, total_points: totalPoints, completion_percentage: Math.round((completeCount / total) * 100) };
}

function calculatePoints(taskItem, type, early = false, streak = 1, energyMatch = false) {
  const base = {
    full: taskItem.base_points,
    partial: taskItem.partial_points,
    showed_up: Math.round(taskItem.base_points * 0.3),
    skipped: 0,
    too_much_today: 0
  }[type] || 0;
  const earlyBonus = early && base > 0 ? Math.round(base * 0.2) : 0;
  const energyBonus = energyMatch && base > 0 ? Math.round(base * 0.1) : 0;
  return Math.round((base + earlyBonus + energyBonus) * streak);
}

function streakMultiplier(streak) {
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  return 1;
}

function recalculateProgress(progress, records, date, record, pointsDelta) {
  const dates = Object.keys({ ...records, [date]: record }).sort();
  let current = 0;
  let longest = progress.longest_streak || 0;
  let prev = null;
  for (const key of dates) {
    const active = ({ ...records, [date]: record })[key].completion_percentage > 0 || ({ ...records, [date]: record })[key].was_rest_day;
    if (!active) continue;
    if (!prev || differenceInCalendarDays(new Date(key), new Date(prev)) === 1) current += 1;
    else current = 1;
    longest = Math.max(longest, current);
    prev = key;
  }
  const xp = Math.max(0, progress.total_lifetime_points + pointsDelta);
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const achievements = new Set(progress.achievements);
  if (xp > 0) achievements.add('First Step');
  if (current >= 7) achievements.add('First Week Complete');
  if (current >= 30) achievements.add('30-Day Warrior');
  if (record.was_rest_day && record.completion_percentage > 0) achievements.add('Recovery Champion');
  if (record.completion_percentage === 100) achievements.add('Perfect Day');
  return {
    ...progress,
    total_lifetime_points: xp,
    current_level: level,
    xp_to_next_level: level * 1000 - xp,
    current_streak: current,
    longest_streak: longest,
    achievements: [...achievements],
    streak_history: dates.map((key) => ({ date: key, completion: ({ ...records, [date]: record })[key].completion_percentage }))
  };
}

function upsertBy(list, item, key) {
  return list.some((entry) => entry[key] === item[key])
    ? list.map((entry) => (entry[key] === item[key] ? item : entry))
    : [item, ...list];
}

const AppContext = createContext(null);
function useApp() {
  return useContext(AppContext);
}

function App() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [view, setView] = useState('today');
  const [toast, setToast] = useState('');
  const [quickMode, setQuickMode] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const activeTemplate = state.templates.find((tpl) => tpl.template_id === state.activeRoutine.current_template_id) || state.templates[0];
  const todayTasks = getTasksForDate(state, todayKey());
  const todayPlan = state.dailyPlans[todayKey()];
  const displayRoutine = useMemo(() => todayPlan ? { ...activeTemplate, name: todayPlan.name || 'Manual Plan', tasks: todayTasks } : activeTemplate, [todayPlan, activeTemplate, todayTasks]);
  const record = getRecord(state, todayKey());
  const insights = useMemo(() => buildInsights(state), [state]);
  const backup = useMemo(() => getBackupStatus(state), [state]);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    let cancelled = false;
    loadBackendState()
      .then((backendState) => {
        if (!cancelled && backendState) dispatch({ type: 'BACKEND_LOADED', state: backendState });
        if (!cancelled && !backendState) dispatch({ type: 'BACKEND_STATUS', status: 'connected' });
      })
      .catch(() => !cancelled && dispatch({ type: 'BACKEND_STATUS', status: 'local fallback' }));
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (state.appMeta.backend_status === 'local fallback') return undefined;
    const id = setTimeout(() => {
      saveBackendState(state)
        .then(() => dispatch({ type: 'BACKEND_STATUS', status: 'connected' }))
        .catch(() => dispatch({ type: 'BACKEND_STATUS', status: 'local fallback' }));
    }, 700);
    return () => clearTimeout(id);
  }, [state]);
  useEffect(() => {
    dispatch({ type: 'DAILY_ROLLOVER' });
    if (new URLSearchParams(window.location.search).get('quick') === '1') setQuickMode(true);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = state.preferences.theme;
  }, [state.preferences.theme]);
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredInstall(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() >= 59 && state.appMeta.last_auto_backup_prompt_date !== todayKey()) {
        createLocalBackupSnapshot(state);
        dispatch({ type: 'MARK_AUTO_BACKUP_PROMPTED' });
        setToast('Daily backup snapshot prepared. Use Backup now to download it.');
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [state]);
  useEffect(() => {
    const id = setInterval(() => scheduleDueNotifications(state, displayRoutine, dispatch), 60_000);
    scheduleDueNotifications(state, displayRoutine, dispatch);
    return () => clearInterval(id);
  }, [state, displayRoutine]);

  const value = { state, dispatch, activeTemplate: displayRoutine, baseTemplate: activeTemplate, todayTasks, record, insights, notify: setToast, backup, setImportPreview };
  const views = {
    today: <Today />,
    schedule: <Timetable />,
    routines: <TemplateManager />,
    progress: <Analytics />,
    student: <StudentTools />,
    reflect: <Reflection />,
    settings: <SettingsPanel />
  };

  return (
    <AppContext.Provider value={value}>
      <div className="app-shell">
        <Sidebar view={view} setView={setView} />
        <main className="workspace">
          <Topbar setView={setView} setQuickMode={setQuickMode} deferredInstall={deferredInstall} setDeferredInstall={setDeferredInstall} />
          <BackupBanner />
          <RolloverReview />
          {views[view]}
        </main>
        <AnimatePresence>{quickMode && <QuickMode onClose={() => setQuickMode(false)} />}</AnimatePresence>
        <AnimatePresence>{importPreview && <ImportPreview preview={importPreview} onClose={() => setImportPreview(null)} />}</AnimatePresence>
        <AnimatePresence>
          {toast && (
            <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onAnimationComplete={() => setTimeout(() => setToast(''), 2200)}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}

function Sidebar({ view, setView }) {
  const items = [
    ['today', Heart, 'Today'],
    ['schedule', CalendarDays, 'Schedule'],
    ['routines', Archive, 'Routines'],
    ['progress', BarChart3, 'Progress'],
    ['student', Clock, 'Student'],
    ['reflect', Pencil, 'Reflect'],
    ['settings', Settings, 'Settings']
  ];
  return (
    <nav className="sidebar">
      <div className="brand"><span>Steady</span><small>Routine tracker</small></div>
      {items.map(([id, Icon, label]) => (
        <button key={id} className={view === id ? 'nav-item active' : 'nav-item'} onClick={() => setView(id)} title={label}>
          <Icon size={20} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Topbar({ setView, setQuickMode, deferredInstall, setDeferredInstall }) {
  const { state, dispatch, activeTemplate } = useApp();
  const themeIcon = state.preferences.theme === 'dark' ? Sun : Moon;
  const ThemeIcon = themeIcon;
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{format(new Date(), 'EEEE, MMM d')}</p>
        <h1>{activeTemplate?.name || 'Today'}</h1>
        <small>Storage: {state.appMeta.backend_status === 'connected' ? 'backend file' : state.appMeta.backend_status}</small>
      </div>
      <div className="top-actions">
        <button className="soft-button" onClick={() => setQuickMode(true)}><Zap size={17} /> Quick</button>
        <button className="soft-button" onClick={() => { exportJson(state); dispatch({ type: 'UPDATE_BACKUP_META' }); }}><ShieldCheck size={17} /> Backup now</button>
        {deferredInstall && (
          <button className="soft-button" onClick={async () => {
            deferredInstall.prompt();
            await deferredInstall.userChoice.catch(() => null);
            setDeferredInstall(null);
          }}><Download size={17} /> Install</button>
        )}
        <button className="icon-button" title="Toggle theme" onClick={() => dispatch({ type: 'SET_PREF', key: 'theme', value: state.preferences.theme === 'dark' ? 'light' : 'dark' })}><ThemeIcon size={19} /></button>
        <button className="soft-button" onClick={() => setView('student')}><Plus size={17} /> Deadline</button>
        <button className="primary-button" onClick={() => dispatch({ type: 'SET_TEMPLATE', id: 'tpl_recovery' })}><Heart size={17} /> Recovery</button>
      </div>
    </header>
  );
}

function BackupBanner() {
  const { state, dispatch, backup } = useApp();
  if (!backup.needsWarning || state.appMeta.backup_warning_dismissed_date === todayKey()) return null;
  return (
    <div className="system-banner">
      <ShieldCheck size={18} />
      <span>{backup.message}</span>
      <button className="soft-button" onClick={() => { exportJson(state); dispatch({ type: 'UPDATE_BACKUP_META' }); }}>Backup now</button>
      <button className="icon-button" title="Dismiss" onClick={() => dispatch({ type: 'DISMISS_BACKUP_WARNING' })}><Check size={16} /></button>
    </div>
  );
}

function RolloverReview() {
  const { state, dispatch } = useApp();
  const review = state.appMeta.rollover_review;
  if (!review) return null;
  const source = state.templates.find((tpl) => tpl.template_id === review.template_id);
  const tasks = (source?.tasks || []).filter((item) => review.incomplete_task_ids.includes(item.task_id));
  return (
    <div className="system-banner rollover">
      <CalendarDays size={18} />
      <div>
        <strong>Welcome back. Day {Math.max(1, state.userProgress.current_streak || 1)} of your routine.</strong>
        <p>{review.message}. Choose what should happen to them.</p>
      </div>
      <div className="rollover-list">{tasks.map((item) => <span className="pill" key={item.task_id}>{item.title}</span>)}</div>
      <button className="primary-button" onClick={() => dispatch({ type: 'CARRY_OVER_TASKS', taskIds: review.incomplete_task_ids })}>Move to today</button>
      <button className="soft-button" onClick={() => dispatch({ type: 'SKIP_OLD_TASKS', taskIds: review.incomplete_task_ids })}>Skip yesterday</button>
      <button className="icon-button" title="Later" onClick={() => dispatch({ type: 'DISMISS_ROLLOVER' })}><ChevronDown size={16} /></button>
    </div>
  );
}

function QuickMode({ onClose }) {
  const { activeTemplate, record, dispatch, insights, notify } = useApp();
  const energySuggestion = getEnergySuggestion(activeTemplate, record);
  const nextTask = energySuggestion || activeTemplate.tasks.find((item) => !record.tasks_completed.some((done) => done.task_id === item.task_id && ['full', 'partial', 'showed_up'].includes(done.completion_type))) || activeTemplate.tasks[0];
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="quick-modal" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 12 }}>
        <div className="section-title">
          <span className="pill"><Zap size={15} /> Quick action</span>
          <button className="icon-button" onClick={onClose}><ChevronDown size={16} /></button>
        </div>
        <h2>{nextTask?.title || 'No task waiting'}</h2>
        <p>{nextTask?.notes || 'A tiny check-in still counts.'}</p>
        {nextTask && <TaskActions taskItem={nextTask} compact />}
        <div className="completion-row">
          <button className="soft-button" onClick={() => {
            const taskItem = activeTemplate.tasks.find((item) => /exercise|movement|walk/i.test(item.title));
            if (taskItem) {
              dispatch({ type: 'COMPLETE_TASK', date: todayKey(), taskId: taskItem.task_id, completion_type: 'full' });
              notify('Exercise marked complete');
            }
          }}><Activity size={16} /> Mark exercise</button>
          <button className="soft-button" onClick={() => notify(insights[0]?.detail || 'No insight yet')}><Sparkles size={16} /> 30 sec review</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ImportPreview({ preview, onClose }) {
  const { dispatch, notify } = useApp();
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="quick-modal" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 12 }}>
        <h2>Verify Import</h2>
        <p>This will replace the current local tracker data with the selected backup.</p>
        <div className="stats-grid">
          <Stat icon={Archive} label="Templates" value={preview.summary.templates} />
          <Stat icon={CalendarDays} label="Daily records" value={preview.summary.records} />
          <Stat icon={Award} label="Achievements" value={preview.summary.achievements} />
          <Stat icon={Zap} label="Lifetime XP" value={preview.summary.xp} />
        </div>
        <div className="completion-row">
          <button className="primary-button" onClick={() => { dispatch({ type: 'IMPORT_STATE', state: preview.state }); notify('Backup imported'); onClose(); }}><Upload size={16} /> Import verified backup</button>
          <button className="soft-button" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Today() {
  const { state, activeTemplate, record, insights } = useApp();
  const nextTask = activeTemplate.tasks.find((item) => !record.tasks_completed.some((done) => done.task_id === item.task_id && ['full', 'partial', 'showed_up'].includes(done.completion_type))) || activeTemplate.tasks[0];
  const pointsToday = record.total_points;
  return (
    <section className="view-grid today-grid">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Just start</p>
          <h2>{nextTask?.title || 'You are clear for today'}</h2>
          <p>{nextTask?.notes || 'Nothing else is asking for attention right now.'}</p>
        </div>
        {nextTask && <TaskActions taskItem={nextTask} compact />}
      </div>
      <StatsOverview pointsToday={pointsToday} />
      <div className="panel span-2">
        <div className="section-title">
          <h2>Today&apos;s Timeline</h2>
          <ProgressPill value={record.completion_percentage} />
        </div>
        <Timeline tasks={activeTemplate.tasks} />
      </div>
      <div className="panel">
        <h2>Helpful Signals</h2>
        <InsightList insights={insights.slice(0, 4)} />
      </div>
      <PomodoroTimer />
    </section>
  );
}

function StatsOverview({ pointsToday }) {
  const { state } = useApp();
  return (
    <div className="stats-grid">
      <Stat icon={Zap} label="Today XP" value={pointsToday} />
      <Stat icon={Flame} label="Streak" value={state.userProgress.current_streak} />
      <Stat icon={Award} label="Level" value={state.userProgress.current_level} />
      <Stat icon={Sparkles} label="Next level" value={state.userProgress.xp_to_next_level} />
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <div className="stat"><Icon size={19} /><span>{label}</span><strong>{value}</strong></div>;
}

function Timetable() {
  const { state, activeTemplate } = useApp();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const selectedTasks = getTasksForDate(state, selectedDate);
  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, index) => format(addDays(weekStart, index), 'yyyy-MM-dd'));
  return (
    <section className="view-grid">
      <div className="panel span-2">
        <div className="section-title">
          <h2>Manual Timetable</h2>
          <span className="muted">Plan each day differently. This week and next week can be completely different.</span>
        </div>
        <div className="week-strip">
          {weekDates.map((date) => (
            <button key={date} className={date === selectedDate ? 'day-chip active' : 'day-chip'} onClick={() => setSelectedDate(date)}>
              <strong>{format(new Date(date), 'EEE')}</strong>
              <span>{format(new Date(date), 'MMM d')}</span>
              <small>{state.dailyPlans[date]?.tasks?.length ? `${state.dailyPlans[date].tasks.length} custom` : 'template'}</small>
            </button>
          ))}
        </div>
        <Timeline tasks={selectedTasks} detailed date={selectedDate} />
      </div>
      <div className="panel">
        <ManualPlanEditor date={selectedDate} setSelectedDate={setSelectedDate} />
      </div>
    </section>
  );
}

function ManualPlanEditor({ date, setSelectedDate }) {
  const { state, dispatch, baseTemplate, notify } = useApp();
  const existing = state.dailyPlans[date];
  const [draft, setDraft] = useState(() => existing?.tasks || []);
  const [name, setName] = useState(existing?.name || `Plan for ${format(new Date(date), 'MMM d')}`);

  useEffect(() => {
    setDraft(existing?.tasks || []);
    setName(existing?.name || `Plan for ${format(new Date(date), 'MMM d')}`);
  }, [date, existing]);

  const updateTask = (id, patch) => setDraft((tasks) => tasks.map((item) => item.task_id === id ? { ...item, ...patch } : item));
  const addManualTask = () => setDraft((tasks) => [...tasks, task('New task', '09:00 AM', 30, 20, 'study', '', false, 'medium')]);
  const copyTemplate = () => setDraft(baseTemplate.tasks.map((item) => ({ ...item, task_id: uid('task'), microsteps: item.microsteps.map((step) => ({ ...step, id: uid('step'), done: false })) })));
  const copyTomorrow = () => {
    const nextDate = format(addDays(new Date(date), 1), 'yyyy-MM-dd');
    dispatch({ type: 'SAVE_DAILY_PLAN', date: nextDate, name: `Plan for ${format(new Date(nextDate), 'MMM d')}`, tasks: draft.map((item) => ({ ...item, task_id: uid('task') })) });
    setSelectedDate(nextDate);
  };

  return (
    <div className="manual-editor">
      <h2>{format(new Date(date), 'EEEE, MMM d')}</h2>
      <label>Plan name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="completion-row">
        <button className="soft-button" onClick={copyTemplate}><Copy size={16} /> Copy active routine</button>
        <button className="soft-button" onClick={addManualTask}><Plus size={16} /> Add task</button>
      </div>
      <div className="manual-task-list">
        {draft.map((item) => (
          <div key={item.task_id} className="manual-task-row">
            <input value={item.title} onChange={(e) => updateTask(item.task_id, { title: e.target.value })} />
            <input value={item.time} onChange={(e) => updateTask(item.task_id, { time: e.target.value })} />
            <input type="number" min="1" value={item.duration_minutes} onChange={(e) => updateTask(item.task_id, { duration_minutes: Number(e.target.value) })} />
            <input type="number" min="0" value={item.base_points} onChange={(e) => updateTask(item.task_id, { base_points: Number(e.target.value), partial_points: Math.round(Number(e.target.value) * 0.7) })} />
            <select value={item.category} onChange={(e) => updateTask(item.task_id, { category: e.target.value })}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select>
            <button className="icon-button" onClick={() => setDraft((tasks) => tasks.filter((taskItem) => taskItem.task_id !== item.task_id))}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div className="completion-row">
        <button className="primary-button" onClick={() => { dispatch({ type: 'SAVE_DAILY_PLAN', date, name, tasks: draft }); notify('Manual day plan saved'); }}><Save size={16} /> Save day</button>
        <button className="soft-button" onClick={copyTomorrow}><CalendarDays size={16} /> Copy to tomorrow</button>
        <button className="soft-button danger" onClick={() => dispatch({ type: 'DELETE_DAILY_PLAN', date })}><Trash2 size={16} /> Use template</button>
      </div>
      <small>Saved daily plans override the active routine for that date only. Leave a day without a manual plan to use your active routine.</small>
    </div>
  );
}

function Timeline({ tasks, detailed = false, date = todayKey() }) {
  const now = format(new Date(), 'hh:mm a');
  return (
    <div className="timeline">
      {isSameDay(new Date(date), new Date()) && <div className="now-line"><Clock size={14} /> {now}</div>}
      {tasks.map((item) => <TaskCard key={item.task_id} taskItem={item} detailed={detailed} date={date} />)}
      {!tasks.length && <div className="empty"><CalendarDays size={28} /><p>No tasks planned for this day yet.</p></div>}
    </div>
  );
}

function TaskCard({ taskItem, detailed, date = todayKey() }) {
  const { state, dispatch, record } = useApp();
  const [open, setOpen] = useState(false);
  const cardRecord = date === todayKey() ? record : getRecord(state, date);
  const done = cardRecord.tasks_completed.find((item) => item.task_id === taskItem.task_id);
  const pct = done ? done.points_earned / Math.max(1, taskItem.base_points) : 0;
  return (
    <article className={`task-card ${done?.completion_type || ''}`} style={{ '--cat': categoryColors[taskItem.category] }}>
      <div className="time-block">
        <strong>{taskItem.time}</strong>
        <span>{taskItem.duration_minutes}m</span>
      </div>
      <div className="task-main">
        <button className="task-head" onClick={() => setOpen(!open)}>
          <span className="category-dot" />
          <span>
            <strong>{taskItem.title}</strong>
            <small>{categoryLabels[taskItem.category]} · {taskItem.energy_level_required} energy · {taskItem.base_points} pts</small>
          </span>
          <ChevronDown size={17} />
        </button>
        <div className="meter"><span style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>
        <TaskActions taskItem={taskItem} date={date} />
        {(open || detailed) && (
          <div className="task-details">
            <p>{taskItem.notes}</p>
            {!state.dailyPlans[date] && <label>Reschedule <input value={taskItem.time} onChange={(e) => dispatch({ type: 'RESCHEDULE_TASK', templateId: state.activeRoutine.current_template_id, taskId: taskItem.task_id, time: e.target.value })} /></label>}
            <EnergyPicker taskId={taskItem.task_id} date={date} />
            <Microsteps taskItem={taskItem} />
            <StickyNote taskId={taskItem.task_id} date={date} />
          </div>
        )}
      </div>
    </article>
  );
}

function TaskActions({ taskItem, compact = false, date = todayKey() }) {
  const { dispatch, notify } = useApp();
  const options = compact ? ['full', 'partial', 'showed_up'] : ['full', 'partial', 'showed_up', 'skipped', 'too_much_today'];
  return (
    <div className="completion-row">
      {options.map((type) => (
        <button key={type} className={type === 'full' ? 'primary-button' : 'soft-button'} onClick={() => {
          dispatch({ type: 'COMPLETE_TASK', date, taskId: taskItem.task_id, completion_type: type, early: isEarly(taskItem.time), energyMatch: true });
          notify(type === 'too_much_today' ? 'Logged gently. Nothing to prove today.' : `${completionLabels[type]} saved`);
        }}>
          {type === 'full' ? <Check size={16} /> : type === 'too_much_today' ? <Heart size={16} /> : <Sparkles size={16} />}
          {completionLabels[type]}
        </button>
      ))}
    </div>
  );
}

function isEarly(time) {
  const planned = parse(time, 'hh:mm a', new Date());
  return isAfter(planned, new Date());
}

function EnergyPicker({ taskId, date = todayKey() }) {
  const { record, dispatch } = useApp();
  const { state } = useApp();
  const pickerRecord = date === todayKey() ? record : getRecord(state, date);
  const completion = pickerRecord.tasks_completed.find((item) => item.task_id === taskId);
  return (
    <div className="energy-grid">
      {['energy_before', 'energy_after'].map((phase) => (
        <label key={phase}>{phase.replace('_', ' ')}
          <select value={completion?.[phase] || 3} onChange={(e) => dispatch({ type: 'SET_ENERGY', date, taskId, phase, value: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} · {energyLabels[value - 1]}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function Microsteps({ taskItem }) {
  const { state, dispatch } = useApp();
  if (!taskItem.microsteps.length) return <p className="muted">No microsteps yet.</p>;
  return (
    <div className="microsteps">
      <button className="soft-button" onClick={() => {
        const first = taskItem.microsteps.find((step) => !step.done);
        if (first) dispatch({ type: 'TOGGLE_STEP', templateId: state.activeRoutine.current_template_id, taskId: taskItem.task_id, stepId: first.id });
      }}><Play size={16} /> First step</button>
      {taskItem.microsteps.map((step) => (
        <label key={step.id} className="check-row">
          <input type="checkbox" checked={step.done} onChange={() => dispatch({ type: 'TOGGLE_STEP', templateId: state.activeRoutine.current_template_id, taskId: taskItem.task_id, stepId: step.id })} />
          <span>{step.title}</span><small>{step.points} pts</small>
        </label>
      ))}
    </div>
  );
}

function StickyNote({ taskId, date = todayKey() }) {
  const { state, record, dispatch } = useApp();
  const noteRecord = date === todayKey() ? record : getRecord(state, date);
  const completion = noteRecord.tasks_completed.find((item) => item.task_id === taskId);
  const [note, setNote] = useState(completion?.sticky_note || '');
  return (
    <div className="note-box">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What helped, what felt hard, or what to remember?" />
      <div className="completion-row">
        <button className="soft-button" onClick={() => dispatch({ type: 'SAVE_NOTE', date, taskId, note })}><Save size={16} /> Save note</button>
        <VoiceButton onText={(text) => setNote((old) => `${old} ${text}`.trim())} />
      </div>
    </div>
  );
}

function VoiceButton({ onText }) {
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  return (
    <button className="soft-button" disabled={!supported} onClick={() => {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.onresult = (event) => onText(event.results[0][0].transcript);
      recognition.onend = () => setListening(false);
      setListening(true);
      recognition.start();
    }}>{listening ? <Pause size={16} /> : <Activity size={16} />} Voice</button>
  );
}

function TemplateManager() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState(null);
  return (
    <section className="view-grid">
      <div className="panel">
        <div className="section-title">
          <h2>Routine Templates</h2>
          <button className="primary-button" onClick={() => setEditing(blankTemplate())}><Plus size={16} /> New</button>
        </div>
        <div className="template-list">
          {state.templates.map((tpl) => (
            <article key={tpl.template_id} className="template-card">
              <div>
                <strong>{tpl.name}</strong>
                <p>{tpl.description}</p>
                <small>{tpl.category} · {tpl.tasks.length} tasks</small>
              </div>
              <div className="completion-row">
                <button className="soft-button" onClick={() => dispatch({ type: 'SET_TEMPLATE', id: tpl.template_id })}><Play size={16} /> Activate</button>
                <button className="icon-button" title="Clone" onClick={() => dispatch({ type: 'SAVE_TEMPLATE', template: { ...tpl, template_id: uid('tpl'), name: `${tpl.name} Copy` } })}><Copy size={16} /></button>
                <button className="icon-button" title="Edit" onClick={() => setEditing(tpl)}><Pencil size={16} /></button>
                <button className="icon-button" title="Delete" onClick={() => dispatch({ type: 'DELETE_TEMPLATE', id: tpl.template_id })}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <TemplateEditor template={editing} setEditing={setEditing} />
    </section>
  );
}

function blankTemplate() {
  return {
    template_id: uid('tpl'),
    name: 'New Routine',
    description: 'A routine that can change with you.',
    category: 'Normal',
    is_rest_day_template: false,
    created_date: todayKey(),
    last_used_date: '',
    tasks: [task('First small task', '09:00 AM', 25, 20, 'personal', '', false, 'low')]
  };
}

function TemplateEditor({ template, setEditing }) {
  const { dispatch } = useApp();
  const [draft, setDraft] = useState(template);
  useEffect(() => setDraft(template), [template]);
  if (!draft) return <div className="panel empty"><Archive size={32} /><p>Select a template to preview and edit it.</p></div>;
  const updateTask = (id, patch) => setDraft({ ...draft, tasks: draft.tasks.map((item) => item.task_id === id ? { ...item, ...patch } : item) });
  return (
    <div className="panel">
      <h2>Template Editor</h2>
      <div className="form-grid">
        <label>Name <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Category <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option>Normal</option><option>Intensive</option><option>Recovery</option></select></label>
        <label className="span-2">Description <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <label className="check-row"><input type="checkbox" checked={draft.is_rest_day_template} onChange={(e) => setDraft({ ...draft, is_rest_day_template: e.target.checked })} /> Rest day template</label>
      </div>
      <div className="editor-tasks">
        {draft.tasks.map((item) => (
          <div key={item.task_id} className="task-editor-row">
            <input value={item.title} onChange={(e) => updateTask(item.task_id, { title: e.target.value })} />
            <input value={item.time} onChange={(e) => updateTask(item.task_id, { time: e.target.value })} />
            <input type="number" value={item.duration_minutes} onChange={(e) => updateTask(item.task_id, { duration_minutes: Number(e.target.value) })} />
            <input type="number" value={item.base_points} onChange={(e) => updateTask(item.task_id, { base_points: Number(e.target.value), partial_points: Math.round(Number(e.target.value) * 0.7) })} />
            <select value={item.category} onChange={(e) => updateTask(item.task_id, { category: e.target.value })}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select>
            <button className="icon-button" onClick={() => setDraft({ ...draft, tasks: draft.tasks.filter((taskItem) => taskItem.task_id !== item.task_id) })}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div className="completion-row">
        <button className="soft-button" onClick={() => setDraft({ ...draft, tasks: [...draft.tasks, task('New task', '12:00 PM', 25, 20, 'study', '', false, 'medium')] })}><Plus size={16} /> Task</button>
        <button className="soft-button" onClick={() => setDraft({ ...draft, tasks: draft.tasks.map((item) => ({ ...item, time: shiftTime(item.time, 30) })) })}><TimerReset size={16} /> Shift 30m</button>
        <button className="primary-button" onClick={() => { dispatch({ type: 'SAVE_TEMPLATE', template: draft }); setEditing(null); }}><Save size={16} /> Save</button>
      </div>
    </div>
  );
}

function shiftTime(value, minutes) {
  try {
    return format(addMinutesSafe(parse(value, 'hh:mm a', new Date()), minutes), 'hh:mm a');
  } catch {
    return value;
  }
}

function addMinutesSafe(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function Analytics() {
  const { state, insights } = useApp();
  const chartData = Object.values(state.dailyRecords).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const categoryData = categoryBreakdown(state);
  return (
    <section className="view-grid">
      <div className="panel span-2">
        <h2>Progress Dashboard</h2>
        <div className="chart">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completion_percentage" stroke="#4b7f8c" strokeWidth={3} />
              <Line type="monotone" dataKey="total_points" stroke="#b56d43" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel">
        <h2>Category Split</h2>
        <div className="chart small">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={78}>
                {categoryData.map((entry) => <Cell key={entry.name} fill={categoryColors[entry.name]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel span-2">
        <h2>Calendar Heatmap</h2>
        <Heatmap />
      </div>
      <div className="panel">
        <h2>Pattern Insights</h2>
        <InsightList insights={insights} />
      </div>
      <TaskAnalysis />
    </section>
  );
}

function Heatmap() {
  const { state } = useApp();
  const days = Array.from({ length: 84 }, (_, index) => format(subDays(new Date(), 83 - index), 'yyyy-MM-dd'));
  return <div className="heatmap">{days.map((day) => <button key={day} title={`${day}: ${state.dailyRecords[day]?.completion_percentage || 0}%`} className="heat-cell" data-level={Math.ceil((state.dailyRecords[day]?.completion_percentage || 0) / 25)} />)}</div>;
}

function TaskAnalysis() {
  const { state, activeTemplate } = useApp();
  const data = activeTemplate.tasks.map((taskItem) => {
    const attempts = Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).filter((item) => item.task_id === taskItem.task_id);
    const success = attempts.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
    return { name: taskItem.title, rate: attempts.length ? Math.round((success / attempts.length) * 100) : 0 };
  });
  return (
    <div className="panel span-2">
      <h2>Task Success Analysis</h2>
      <div className="chart">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#4b7f8c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StudentTools() {
  const { state, dispatch } = useApp();
  const [assignment, setAssignment] = useState({ name: '', due_date: todayKey(), estimated_hours: 2, priority: 'medium' });
  const [klass, setKlass] = useState({ day: 'Monday', time: '10:00 AM', subject: '' });
  const freeBlocks = findFreeBlocks(state.externalSchedule.class_schedule);
  return (
    <section className="view-grid">
      <PomodoroTimer />
      <div className="panel">
        <h2>Assignments & Exams</h2>
        <div className="form-grid">
          <input placeholder="Assignment name" value={assignment.name} onChange={(e) => setAssignment({ ...assignment, name: e.target.value })} />
          <input type="date" value={assignment.due_date} onChange={(e) => setAssignment({ ...assignment, due_date: e.target.value })} />
          <input type="number" value={assignment.estimated_hours} onChange={(e) => setAssignment({ ...assignment, estimated_hours: Number(e.target.value) })} />
          <select value={assignment.priority} onChange={(e) => setAssignment({ ...assignment, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option></select>
        </div>
        <button className="primary-button" onClick={() => {
          if (assignment.name) dispatch({ type: 'ADD_ASSIGNMENT', item: { ...assignment, id: uid('due') } });
        }}><Plus size={16} /> Add deadline</button>
        <div className="list">
          {state.externalSchedule.assignment_deadlines.map((item) => <Deadline key={item.id} item={item} />)}
        </div>
      </div>
      <div className="panel">
        <h2>Class Schedule</h2>
        <div className="form-grid">
          <select value={klass.day} onChange={(e) => setKlass({ ...klass, day: e.target.value })}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day}>{day}</option>)}</select>
          <input value={klass.time} onChange={(e) => setKlass({ ...klass, time: e.target.value })} />
          <input placeholder="Subject" value={klass.subject} onChange={(e) => setKlass({ ...klass, subject: e.target.value })} />
        </div>
        <button className="soft-button" onClick={() => klass.subject && dispatch({ type: 'ADD_CLASS', item: { ...klass, id: uid('class') } })}><Plus size={16} /> Add class</button>
        <div className="list">
          {state.externalSchedule.class_schedule.map((item) => (
            <div className="row" key={item.id}><span>{item.day} · {item.time}</span><strong>{item.subject}</strong><button className="icon-button" onClick={() => dispatch({ type: 'DELETE_CLASS', id: item.id })}><Trash2 size={15} /></button></div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>Free Time Finder</h2>
        <InsightList insights={freeBlocks.map((block) => ({ title: block, detail: 'Candidate study window that avoids recorded classes.' }))} />
      </div>
    </section>
  );
}

function Deadline({ item }) {
  const { dispatch } = useApp();
  const days = Math.max(1, differenceInCalendarDays(new Date(item.due_date), new Date()) + 1);
  const daily = Math.ceil((item.estimated_hours / days) * 10) / 10;
  return (
    <div className="row">
      <span><strong>{item.name}</strong><small>{days} days left · {daily} hrs/day</small></span>
      <button className="icon-button" onClick={() => dispatch({ type: 'DELETE_ASSIGNMENT', id: item.id })}><Trash2 size={15} /></button>
    </div>
  );
}

function PomodoroTimer() {
  const { state } = useApp();
  const settings = state.preferences.pomodoro_settings;
  const [mode, setMode] = useState('work');
  const [seconds, setSeconds] = useState(settings.work * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (seconds === 0) {
      setRunning(false);
      setMode((old) => old === 'work' ? 'break' : 'work');
      setSeconds((mode === 'work' ? settings.break : settings.work) * 60);
    }
  }, [seconds, mode, settings.break, settings.work]);
  return (
    <div className="panel timer-panel">
      <h2>Pomodoro</h2>
      <div className="timer-face">{formatSeconds(seconds)}</div>
      <div className="segmented">
        {['work', 'break', 'long_break'].map((key) => <button key={key} className={mode === key ? 'active' : ''} onClick={() => { setMode(key); setSeconds(settings[key] * 60); }}>{key.replace('_', ' ')}</button>)}
      </div>
      <div className="completion-row">
        <button className="primary-button" onClick={() => setRunning(!running)}>{running ? <Pause size={16} /> : <Play size={16} />}{running ? 'Pause' : 'Start'}</button>
        <button className="soft-button" onClick={() => { setRunning(false); setSeconds(settings[mode] * 60); }}><RotateCcw size={16} /> Reset</button>
      </div>
    </div>
  );
}

function formatSeconds(value) {
  const mins = Math.floor(value / 60).toString().padStart(2, '0');
  const secs = (value % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function Reflection() {
  const { state, dispatch } = useApp();
  const week = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const existing = state.reflections.find((item) => item.week_start_date === week);
  const [draft, setDraft] = useState(existing || { week_start_date: week, what_worked_well: '', what_felt_hard: '', energy_level_overall: 3, tasks_to_modify: [], notes: '' });
  return (
    <section className="view-grid">
      <div className="panel">
        <h2>Weekly Check-in</h2>
        <div className="form-grid">
          <label className="span-2">What worked well?<textarea value={draft.what_worked_well} onChange={(e) => setDraft({ ...draft, what_worked_well: e.target.value })} /></label>
          <label className="span-2">What felt hard?<textarea value={draft.what_felt_hard} onChange={(e) => setDraft({ ...draft, what_felt_hard: e.target.value })} /></label>
          <label>Energy overall<input type="range" min="1" max="5" value={draft.energy_level_overall} onChange={(e) => setDraft({ ...draft, energy_level_overall: Number(e.target.value) })} /></label>
          <label className="span-2">Notes<textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
        </div>
        <button className="primary-button" onClick={() => dispatch({ type: 'ADD_REFLECTION', reflection: draft })}><Save size={16} /> Save reflection</button>
      </div>
      <div className="panel">
        <h2>Reflection History</h2>
        <div className="list">
          {state.reflections.map((item) => <article className="row" key={item.week_start_date}><span><strong>{item.week_start_date}</strong><small>{item.what_worked_well || 'Saved check-in'}</small></span></article>)}
        </div>
      </div>
      <NotesReview />
    </section>
  );
}

function NotesReview() {
  const { state } = useApp();
  const notes = Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed.filter((item) => item.sticky_note).map((item) => ({ date: record.date, note: item.sticky_note })));
  return (
    <div className="panel span-2">
      <h2>Task Notes</h2>
      <div className="list">{notes.map((item, index) => <div className="row" key={`${item.date}-${index}`}><span>{item.date}</span><p>{item.note}</p></div>)}</div>
    </div>
  );
}

function SettingsPanel() {
  const { state, dispatch, notify, backup, setImportPreview } = useApp();
  return (
    <section className="view-grid">
      <div className="panel">
        <h2>Preferences</h2>
        <label className="check-row"><input type="checkbox" checked={state.preferences.compassionate_mode} onChange={(e) => dispatch({ type: 'SET_PREF', key: 'compassionate_mode', value: e.target.checked })} /> Compassionate mode</label>
        <label className="check-row"><input type="checkbox" checked={state.preferences.show_penalties} onChange={(e) => dispatch({ type: 'SET_PREF', key: 'show_penalties', value: e.target.checked })} /> Show penalties</label>
        <label>Theme<select value={state.preferences.theme} onChange={(e) => dispatch({ type: 'SET_PREF', key: 'theme', value: e.target.value })}><option>light</option><option>dark</option></select></label>
      </div>
      <div className="panel">
        <h2>Notifications</h2>
        {Object.entries(state.preferences.notification_preferences).map(([key, value]) => (
          <label key={key} className="check-row"><input type="checkbox" checked={value} onChange={(e) => dispatch({ type: 'SET_PREF', key: 'notification_preferences', value: { ...state.preferences.notification_preferences, [key]: e.target.checked } })} /> {key}</label>
        ))}
        <button className="soft-button" onClick={() => typeof Notification !== 'undefined' && Notification.requestPermission?.()}><Bell size={16} /> Enable browser alerts</button>
      </div>
      <div className="panel">
        <h2>Data</h2>
        <p className="muted">{backup.message}</p>
        <div className="completion-row">
          <button className="soft-button" onClick={() => { exportJson(state); dispatch({ type: 'UPDATE_BACKUP_META' }); }}><Download size={16} /> Export JSON</button>
          <label className="soft-button file-button"><Upload size={16} /> Import JSON<input type="file" accept="application/json" onChange={(e) => importJson(e, setImportPreview, notify)} /></label>
          <button className="soft-button" onClick={() => exportCsv(state)}><Import size={16} /> Export CSV</button>
          <button className="soft-button danger" onClick={() => dispatch({ type: 'RESET_DATA' })}><Trash2 size={16} /> Delete all</button>
        </div>
        <small>Automatic backups are prepared locally at 11:59 PM while the app is open. Browser security may require a tap before downloading a file.</small>
      </div>
      <div className="panel">
        <h2>Achievements</h2>
        <div className="badge-grid">{state.userProgress.achievements.map((item) => <span className="badge" key={item}><Award size={15} /> {item}</span>)}</div>
      </div>
    </section>
  );
}

function ProgressPill({ value }) {
  return <span className="pill">{value}% complete</span>;
}

function InsightList({ insights }) {
  return <div className="insights">{insights.map((item, index) => <article key={index}><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div>;
}

function buildInsights(state) {
  const records = Object.values(state.dailyRecords).sort((a, b) => a.date.localeCompare(b.date));
  const recent = records.slice(-7);
  const allCompletions = records.flatMap((record) => record.tasks_completed.map((item) => ({ ...item, date: record.date })));
  const drops = recent.length >= 3 && recent.slice(-3).every((record) => record.completion_percentage < 45);
  const tooMuch = recent.flatMap((record) => record.tasks_completed).filter((item) => item.completion_type === 'too_much_today').length;
  const energies = allCompletions.map((item) => item.energy_after).filter(Boolean);
  const avgEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 3;
  const timeInsight = timeBucketSuccess(state);
  const energyInsight = energyPatternInsight(state);
  const risky = predictRiskyTask(state);
  const insights = [
    {
      title: drops || tooMuch >= 2 || avgEnergy < 2 ? 'Recovery mode may help' : 'Your plan is still adjustable',
      detail: drops || tooMuch >= 2 || avgEnergy < 2 ? 'Recent signals suggest reducing load for a day or two.' : 'Use completion data as feedback, not judgment.'
    },
    {
      title: timeInsight.title,
      detail: timeInsight.detail
    },
    {
      title: energyInsight.title,
      detail: energyInsight.detail
    },
    {
      title: 'Skip prediction',
      detail: risky || 'After more attempts, this will flag tasks likely to be skipped before they become friction.'
    },
    {
      title: 'Backup health',
      detail: getBackupStatus(state).message
    },
    {
      title: 'Closed-app reminders',
      detail: 'This no-server version can schedule reminders while open or installed. Fully closed reminders need push sync from a backend.'
    },
  ];
  const skipped = frequentlySkipped(state);
  if (skipped) insights.push({ title: 'Often skipped', detail: `${skipped} may need a smaller version, a new time, or a break.` });
  return insights;
}

function timeBucketSuccess(state) {
  const taskMap = new Map();
  state.templates.flatMap((tpl) => tpl.tasks).forEach((item) => taskMap.set(item.task_id, item));
  const buckets = { morning: { attempts: 0, wins: 0 }, afternoon: { attempts: 0, wins: 0 }, evening: { attempts: 0, wins: 0 } };
  Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).forEach((item) => {
    const taskItem = taskMap.get(item.task_id);
    if (!taskItem) return;
    const bucket = getTimeBucket(taskItem.time);
    buckets[bucket].attempts += 1;
    if (['full', 'partial', 'showed_up'].includes(item.completion_type)) buckets[bucket].wins += 1;
  });
  const scored = Object.entries(buckets).filter(([, data]) => data.attempts > 0).map(([name, data]) => ({ name, rate: Math.round((data.wins / data.attempts) * 100), attempts: data.attempts }));
  if (!scored.length) return { title: 'Best time of day', detail: 'After a few days, this will use your real task history.' };
  const best = scored.sort((a, b) => b.rate - a.rate)[0];
  const weak = scored.sort((a, b) => a.rate - b.rate)[0];
  return {
    title: `${capitalize(best.name)} tasks: ${best.rate}% follow-through`,
    detail: weak.name !== best.name && weak.rate < 55
      ? `${capitalize(weak.name)} is at ${weak.rate}%. Try moving one hard task closer to your ${best.name} window.`
      : `Your ${best.name} block is currently the most reliable.`
  };
}

function energyPatternInsight(state) {
  const taskMap = new Map(state.templates.flatMap((tpl) => tpl.tasks).map((item) => [item.task_id, item]));
  const byTime = {};
  const energizers = {};
  Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).forEach((item) => {
    const taskItem = taskMap.get(item.task_id);
    if (!taskItem) return;
    const bucket = getTimeBucket(taskItem.time);
    byTime[bucket] = byTime[bucket] || [];
    if (item.energy_after) byTime[bucket].push(item.energy_after);
    if (item.energy_before && item.energy_after) {
      energizers[taskItem.title] = energizers[taskItem.title] || [];
      energizers[taskItem.title].push(item.energy_after - item.energy_before);
    }
  });
  const peak = Object.entries(byTime)
    .map(([name, values]) => ({ name, avg: values.reduce((a, b) => a + b, 0) / values.length }))
    .sort((a, b) => b.avg - a.avg)[0];
  const energizingTask = Object.entries(energizers)
    .map(([name, values]) => ({ name, avg: values.reduce((a, b) => a + b, 0) / values.length, count: values.length }))
    .filter((item) => item.count >= 2 && item.avg > 0)
    .sort((a, b) => b.avg - a.avg)[0];
  if (energizingTask) return { title: `${energizingTask.name} gives energy`, detail: 'It has raised your energy more than once, so it may be useful before harder work.' };
  if (peak) return { title: `Energy peaks in the ${peak.name}`, detail: `Average tracked energy there is ${peak.avg.toFixed(1)}/4. Match demanding tasks to that window.` };
  return { title: 'Energy insights warming up', detail: 'Track before/after energy a few times and this will start recommending task order.' };
}

function predictRiskyTask(state) {
  const taskMap = new Map(state.templates.flatMap((tpl) => tpl.tasks).map((item) => [item.task_id, item]));
  const stats = {};
  Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).forEach((item) => {
    const taskItem = taskMap.get(item.task_id);
    if (!taskItem) return;
    stats[item.task_id] = stats[item.task_id] || { title: taskItem.title, attempts: 0, misses: 0 };
    stats[item.task_id].attempts += 1;
    if (['skipped', 'too_much_today'].includes(item.completion_type)) stats[item.task_id].misses += 1;
  });
  const risky = Object.values(stats).filter((item) => item.attempts >= 3).map((item) => ({ ...item, rate: item.misses / item.attempts })).sort((a, b) => b.rate - a.rate)[0];
  return risky && risky.rate >= 0.4 ? `${risky.title} has been skipped ${Math.round(risky.rate * 100)}% of attempts. Consider a microstep or a new time.` : '';
}

function inferBestTime(state) {
  const taskMap = new Map();
  state.templates.flatMap((tpl) => tpl.tasks).forEach((item) => taskMap.set(item.task_id, item.time));
  const successful = Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).filter((item) => ['full', 'partial'].includes(item.completion_type));
  const morning = successful.filter((item) => /AM/.test(taskMap.get(item.task_id) || '')).length;
  const evening = successful.length - morning;
  return morning >= evening ? 'Morning tasks currently have the strongest follow-through.' : 'Later tasks currently have the strongest follow-through.';
}

function getTimeBucket(time) {
  try {
    const hour = parse(time, 'hh:mm a', new Date()).getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  } catch {
    return 'afternoon';
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function frequentlySkipped(state) {
  const counts = {};
  Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).forEach((item) => {
    if (['skipped', 'too_much_today'].includes(item.completion_type)) counts[item.task_id] = (counts[item.task_id] || 0) + 1;
  });
  const id = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return state.templates.flatMap((tpl) => tpl.tasks).find((item) => item.task_id === id)?.title;
}

function categoryBreakdown(state) {
  const taskLookup = new Map(state.templates.flatMap((tpl) => tpl.tasks).map((item) => [item.task_id, item]));
  const counts = { study: 0, exercise: 0, personal: 0, break: 0 };
  Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).forEach((done) => {
    const cat = taskLookup.get(done.task_id)?.category;
    if (cat) counts[cat] += done.points_earned;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value: value || 1 }));
}

function findFreeBlocks(classes) {
  const busy = new Set(classes.map((item) => `${item.day}-${item.time}`));
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].flatMap((day) => ['08:00 AM', '02:00 PM', '07:00 PM'].map((time) => `${day} ${time}`)).filter((slot) => !busy.has(slot.replace(' ', '-'))).slice(0, 5);
}

function getEnergySuggestion(template, record) {
  const currentEnergy = averageCurrentEnergy(record);
  const completed = new Set(record.tasks_completed.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).map((item) => item.task_id));
  return template.tasks
    .filter((item) => !completed.has(item.task_id))
    .sort((a, b) => Math.abs(energyRank[a.energy_level_required] - currentEnergy) - Math.abs(energyRank[b.energy_level_required] - currentEnergy))[0];
}

function averageCurrentEnergy(record) {
  const latest = [...record.tasks_completed].reverse().find((item) => item.energy_after || item.energy_before);
  return latest?.energy_after || latest?.energy_before || 2;
}

function getBackupStatus(state) {
  const last = state.appMeta.last_backup_date;
  if (!last) return { days: Infinity, needsWarning: true, message: 'No downloaded backup yet. Make one before trusting browser storage.' };
  const days = differenceInCalendarDays(new Date(todayKey()), new Date(last));
  return {
    days,
    needsWarning: days >= 3,
    message: days === 0 ? 'Last backup: today.' : `Last backup: ${days} day${days === 1 ? '' : 's'} ago.`
  };
}

function createLocalBackupSnapshot(state) {
  try {
    localStorage.setItem('steady-last-auto-backup', JSON.stringify({ created_at: new Date().toISOString(), state }));
  } catch {
    // The visible backup warning still tells the user to download a copy.
  }
}

function scheduleDueNotifications(state, template, dispatch) {
  if (typeof Notification === 'undefined' || !state.preferences.notification_preferences?.taskReminders || Notification.permission !== 'granted') return;
  const record = getRecord(state, todayKey());
  const completed = new Set(record.tasks_completed.map((item) => item.task_id));
  template.tasks.forEach((taskItem) => {
    if (completed.has(taskItem.task_id)) return;
    const mins = minutesUntilTask(taskItem.time);
    const key = `${todayKey()}-${taskItem.task_id}-5min`;
    if (mins >= 0 && mins <= 5 && !state.appMeta.notification_log[key]) {
      showNotification('Gentle reminder', `${taskItem.title} starts in about ${Math.max(1, mins)} min.`);
      dispatch({ type: 'LOG_NOTIFICATION', key });
    }
  });
  const backup = getBackupStatus(state);
  const backupKey = `${todayKey()}-backup-warning`;
  if (backup.needsWarning && !state.appMeta.notification_log[backupKey]) {
    showNotification('Backup reminder', backup.message);
    dispatch({ type: 'LOG_NOTIFICATION', key: backupKey });
  }
}

function minutesUntilTask(time) {
  try {
    const planned = parse(time, 'hh:mm a', new Date());
    return Math.round((planned.getTime() - Date.now()) / 60_000);
  } catch {
    return 9999;
  }
}

function showNotification(title, body) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, { body, icon: '/icon.svg', badge: '/icon.svg' })).catch(() => new Notification(title, { body }));
  } else {
    new Notification(title, { body });
  }
}

function exportJson(state) {
  download(`steady-backup-${todayKey()}.json`, JSON.stringify(state, null, 2), 'application/json');
}

function exportCsv(state) {
  const rows = ['date,total_points,completion_percentage,was_rest_day'];
  Object.values(state.dailyRecords).forEach((record) => rows.push(`${record.date},${record.total_points},${record.completion_percentage},${record.was_rest_day}`));
  download(`steady-analytics-${todayKey()}.csv`, rows.join('\n'), 'text/csv');
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(event, setImportPreview, notify) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = normalize(JSON.parse(reader.result));
      setImportPreview({
        state,
        summary: {
          templates: state.templates.length,
          records: Object.keys(state.dailyRecords).length,
          achievements: state.userProgress.achievements.length,
          xp: state.userProgress.total_lifetime_points
        }
      });
    } catch {
      notify('That file could not be imported');
    }
  };
  reader.readAsText(file);
}

createRoot(document.getElementById('root')).render(<App />);
