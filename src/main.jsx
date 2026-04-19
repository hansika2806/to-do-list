import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Archive,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  History,
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
  bucketList: [],
  journalEntries: [],
  recentActions: [],
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
    backend_status: 'checking',
    backend_error: ''
  },
  preferences: {
    pomodoro_settings: { work: 25, break: 5, long_break: 15 },
    notification_preferences: { taskReminders: false, endOfDay: false, weeklyReflection: false },
    compassionate_mode: true,
    show_penalties: false,
    theme: 'light'
  },
  schedulePreferences: {
    lunchBreak: { start: '12:00 PM', end: '01:00 PM' },
    commuteBuffer: 30,
    betweenClassBuffer: 15,
    workingHours: { earliest: '07:00 AM', latest: '10:00 PM' }
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
  const response = await fetch(API_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Backend load failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  if (payload.ok === false) throw new Error(payload.error || 'Backend load failed');
  return payload.state ? normalize(payload.state) : null;
}

async function saveBackendState(state) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      state: state
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || `Backend save failed: ${response.status}`);
  return payload;
}

function reducer(state, action) {
  switch (action.type) {
    case 'BACKEND_LOADED':
      return { ...normalize(action.state), appMeta: { ...normalize(action.state).appMeta, backend_status: 'connected', backend_error: '' } };
    case 'BACKEND_STATUS':
      if (state.appMeta.backend_status === action.status && state.appMeta.backend_error === (action.error || '')) return state;
      return { ...state, appMeta: { ...state.appMeta, backend_status: action.status, backend_error: action.error || '' } };
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
    case 'MARK_ROUTINE_DAY':
      return markRoutineDay(state, action.templateId, action.date, action.completion_type || 'full');
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
    case 'COMPLETE_TASK': {
      const nextState = completeTask(state, action);
      const target = getTasksForDate(state, action.date || todayKey()).find(t => t.task_id === action.taskId);
      if (target) {
          const item = { id: uid('act'), timestamp: new Date().toISOString(), type: 'complete_task', description: `Completed "${target.title}"`, canUndo: true, undoData: { taskId: action.taskId, date: action.date || todayKey() } };
          const limitActions = (list) => [item, ...list].slice(0, 50).map(a => format(new Date(a.timestamp), 'yyyy-MM-dd') === todayKey() ? a : { ...a, canUndo: false });
          return { ...nextState, recentActions: limitActions(nextState.recentActions || []) };
      }
      return nextState;
    }
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
    case 'UNDO_TASK': {
      const date = action.date || todayKey();
      const targetId = action.taskId;
      const record = getRecord(state, date);
      const tasks = getTasksForDate(state, date);
      const existing = record.tasks_completed.find((item) => item.task_id === targetId);
      if (!existing) return state;

      const priorPoints = existing.points_earned || 0;
      const pointsDelta = (existing.subtask_points || 0) - priorPoints;
      
      const nextComp = { ...existing, completion_type: 'in_progress', points_earned: existing.subtask_points || 0 };
      const nextCompletions = (existing.subtask_points || 0) > 0 || existing.sticky_note 
        ? record.tasks_completed.map((item) => item.task_id === targetId ? nextComp : item)
        : record.tasks_completed.filter((item) => item.task_id !== targetId);

      const nextRecord = summarizeRecord({ ...record, tasks_completed: nextCompletions }, tasks);
      const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord, pointsDelta);

      return {
        ...state,
        dailyRecords: { ...state.dailyRecords, [date]: nextRecord },
        userProgress: progress
      };
    }
    case 'DELETE_TASK_PERMANENT': {
      const targetId = action.taskId;
      const nextTemplates = state.templates.map(tpl => ({ ...tpl, tasks: tpl.tasks.filter(t => t.task_id !== targetId) }));
      const nextPlans = {};
      Object.entries(state.dailyPlans).forEach(([date, plan]) => {
         nextPlans[date] = { ...plan, tasks: plan.tasks.filter(t => t.task_id !== targetId) };
      });
      const stateWithDeletedTask = { ...state, templates: nextTemplates, dailyPlans: nextPlans };
      const nextRecords = {};
      Object.entries(state.dailyRecords).forEach(([date, record]) => {
         const cleanedRecord = {
            ...record, 
            tasks_completed: record.tasks_completed.filter(t => t.task_id !== targetId)
         };
         nextRecords[date] = summarizeRecord(cleanedRecord, getTasksForDate(stateWithDeletedTask, date));
      });
      const nextUserProgress = recalculateProgress(state.userProgress, nextRecords);
      
      const target = getTasksForDate(state, action.date || todayKey()).find(t => t.task_id === targetId);
      const logItem = target ? { id: uid('act'), timestamp: new Date().toISOString(), type: 'delete_task', description: `Deleted task "${target.title}"`, canUndo: false, undoData: null } : null;
      const recentActions = logItem ? [logItem, ...(state.recentActions || [])].slice(0, 50).map(a => format(new Date(a.timestamp), 'yyyy-MM-dd') === todayKey() ? a : { ...a, canUndo: false }) : state.recentActions;

      return {
         ...state,
         templates: nextTemplates,
         dailyPlans: nextPlans,
         dailyRecords: nextRecords,
         userProgress: nextUserProgress,
         recentActions
      };
    }
    case 'DELETE_TASK_TODAY': {
      const activeId = state.dailyRecords[action.date]?.active_template_id || state.activeRoutine.current_template_id;
      const existingPlan = state.dailyPlans[action.date];
      const record = state.dailyRecords[action.date];
      const nextRecord = record ? { ...record, tasks_completed: record.tasks_completed.filter((item) => item.task_id !== action.taskId) } : null;
      if (existingPlan) {
        const nextPlan = { ...existingPlan, tasks: existingPlan.tasks.filter((t) => t.task_id !== action.taskId) };
        const nextRecords = nextRecord ? { ...state.dailyRecords, [action.date]: summarizeRecord(nextRecord, nextPlan.tasks) } : state.dailyRecords;
        return {
          ...state,
          dailyPlans: { ...state.dailyPlans, [action.date]: nextPlan },
          dailyRecords: nextRecords,
          userProgress: recalculateProgress(state.userProgress, nextRecords)
        };
      } else {
        const tpl = state.templates.find((tpl) => tpl.template_id === activeId);
        if (!tpl) return state;
        const newTasks = tpl.tasks.filter((t) => t.task_id !== action.taskId);
        const nextPlan = { date: action.date, name: `Manual Plan`, tasks: newTasks };
        const nextRecords = nextRecord ? { ...state.dailyRecords, [action.date]: summarizeRecord(nextRecord, newTasks) } : state.dailyRecords;
        return {
          ...state,
          dailyPlans: { ...state.dailyPlans, [action.date]: nextPlan },
          dailyRecords: nextRecords,
          userProgress: recalculateProgress(state.userProgress, nextRecords)
        };
      }
    }
    case 'SET_PREF':
      return { ...state, preferences: { ...state.preferences, [action.key]: action.value } };
    case 'IMPORT_STATE':
      return normalize(action.state);
    case 'RESET_DATA':
      return initialState;
    case 'ADD_BUCKET_ITEM':
      return { ...state, bucketList: [action.item, ...state.bucketList] };
    case 'TOGGLE_BUCKET_ITEM':
      return { ...state, bucketList: state.bucketList.map(item => item.id === action.id ? { ...item, completed: !item.completed } : item) };
    case 'DELETE_BUCKET_ITEM':
      return { ...state, bucketList: state.bucketList.filter(item => item.id !== action.id) };
    case 'ADD_JOURNAL_ENTRY':
      return { ...state, journalEntries: [action.entry, ...state.journalEntries] };
    case 'DELETE_JOURNAL_ENTRY':
      return { ...state, journalEntries: state.journalEntries.filter(e => e.id !== action.id) };
    case 'LOG_RECENT_ACTION': {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) return state; // handled implicitly below
      const limitActions = (list) => {
         const today = todayKey();
         const updated = [action.item, ...list].slice(0, 50);
         return updated.map(item => format(new Date(item.timestamp), 'yyyy-MM-dd') === today ? item : { ...item, canUndo: false });
      };
      return { ...state, recentActions: limitActions(state.recentActions || []) };
    }
    case 'MARK_ACTION_UNDONE':
      return {
        ...state,
        recentActions: (state.recentActions || []).map((item) => item.id === action.id ? { ...item, canUndo: false } : item)
      };
    default:
      return state;
  }
}

function completeTask(state, action) {
  const date = action.date || todayKey();
  const tasks = action.templateId && !state.dailyPlans[date]
    ? state.templates.find((tpl) => tpl.template_id === action.templateId)?.tasks || []
    : getTasksForDate(state, date);
  const target = tasks.find((item) => item.task_id === action.taskId);
  if (!target) return state;
  const multiplier = streakMultiplier(state.userProgress.current_streak);
  const points = calculatePoints(target, action.completion_type, action.early, multiplier, action.energyMatch);
  const record = {
    ...getRecord(state, date),
    active_template_id: action.templateId && !state.dailyPlans[date] ? action.templateId : getRecord(state, date).active_template_id
  };
  const existing = record.tasks_completed.find((item) => item.task_id === action.taskId);
  const priorPoints = existing?.points_earned || 0;
  const completion = {
    task_id: action.taskId,
    completion_type: action.completion_type,
    points_earned: points + (existing?.subtask_points || 0),
    subtask_points: existing?.subtask_points || 0,
    completed_microstep_ids: existing?.completed_microstep_ids || [],
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
  const pointsDelta = completion.points_earned - priorPoints;
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
    time_spent_minutes: 0,
    subtask_points: 0,
    completed_microstep_ids: []
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

function markRoutineDay(state, templateId, date, completionType) {
  const template = state.templates.find((tpl) => tpl.template_id === templateId);
  if (!template) return state;
  const record = state.dailyRecords[date] || {
    date,
    active_template_id: templateId,
    tasks_completed: [],
    total_points: 0,
    completion_percentage: 0,
    day_notes: '',
    was_rest_day: template.is_rest_day_template
  };
  const priorPoints = record.total_points || 0;
  const tasksCompleted = template.tasks.map((taskItem) => ({
    task_id: taskItem.task_id,
    completion_type: completionType,
    points_earned: calculatePoints(taskItem, completionType),
    completion_time: new Date().toISOString(),
    energy_before: 3,
    energy_after: 3,
    sticky_note: completionType === 'full' ? 'Routine marked complete from calendar.' : '',
    time_spent_minutes: completionType === 'full' ? taskItem.duration_minutes : 0
  }));
  const nextRecord = summarizeRecord({ ...record, active_template_id: templateId, tasks_completed: tasksCompleted }, template.tasks);
  const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord, nextRecord.total_points - priorPoints);
  return {
    ...state,
    dailyRecords: { ...state.dailyRecords, [date]: nextRecord },
    userProgress: progress
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
  const tasks = action.date && state.dailyPlans[action.date] ? state.dailyPlans[action.date].tasks : state.templates.find((tpl) => tpl.template_id === action.templateId)?.tasks || [];
  const taskObj = tasks.find(t => t.task_id === action.taskId);
  const stepObj = taskObj?.microsteps.find(s => s.id === action.stepId);
  if (!stepObj) return state;

  const date = action.date || todayKey();
  const record = getRecord(state, date);
  const existing = record.tasks_completed.find(item => item.task_id === action.taskId);
  const completedIds = existing?.completed_microstep_ids || [];
  const isDone = !completedIds.includes(action.stepId);
  const pointsForStep = stepObj.points || 0;
  const comp = existing || {
    task_id: action.taskId, completion_type: 'in_progress', points_earned: 0,
    completion_time: new Date().toISOString(), energy_before: 3, energy_after: 3, sticky_note: '', time_spent_minutes: 0,
    subtask_points: 0,
    completed_microstep_ids: []
  };
  
  const pointShift = isDone ? pointsForStep : -pointsForStep;
  const nextIds = isDone ? [...completedIds, action.stepId] : completedIds.filter((id) => id !== action.stepId);
  const nextComp = { ...comp, subtask_points: Math.max(0, (comp.subtask_points || 0) + pointShift), completed_microstep_ids: nextIds };
  const finalComp = { ...nextComp, points_earned: existing && existing.completion_type !== 'in_progress' ? comp.points_earned : (comp.points_earned + pointShift) };
  
  const shouldKeepCompletion = finalComp.completion_type !== 'in_progress' || finalComp.subtask_points > 0 || finalComp.sticky_note;
  const nextCompletions = existing
    ? (shouldKeepCompletion ? record.tasks_completed.map(item => item.task_id === action.taskId ? finalComp : item) : record.tasks_completed.filter(item => item.task_id !== action.taskId))
    : [...record.tasks_completed, finalComp];
  const nextRecord = summarizeRecord({ ...record, tasks_completed: nextCompletions }, tasks);
  const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord, pointShift);

  return { ...state, dailyRecords: { ...state.dailyRecords, [date]: nextRecord }, userProgress: progress };
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
  const tasks = Array.isArray(source) ? source : source?.tasks || [];
  const taskIds = new Set(tasks.map((item) => item.task_id));
  const relevantCompletions = taskIds.size ? record.tasks_completed.filter((item) => taskIds.has(item.task_id)) : [];
  const completeCount = relevantCompletions.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
  const total = tasks.length || 1;
  const totalPoints = relevantCompletions.reduce((sum, item) => sum + item.points_earned, 0);
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

function recalculateProgress(progress, records, date, record) {
  const mergedRecords = date && record ? { ...records, [date]: record } : records;
  const dates = Object.keys(mergedRecords).sort();
  let current = 0;
  let longest = 0;
  let prev = null;
  for (const key of dates) {
    const active = mergedRecords[key].completion_percentage > 0 || mergedRecords[key].was_rest_day;
    if (!active) continue;
    if (!prev || differenceInCalendarDays(new Date(key), new Date(prev)) === 1) current += 1;
    else current = 1;
    longest = Math.max(longest, current);
    prev = key;
  }
  const xp = Math.max(0, Object.values(mergedRecords).reduce((sum, item) => sum + (item.total_points || 0), 0));
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const achievements = new Set();
  if (xp > 0) achievements.add('First Step');
  if (current >= 7) achievements.add('First Week Complete');
  if (current >= 30) achievements.add('30-Day Warrior');
  if (Object.values(mergedRecords).some((item) => item.was_rest_day && item.completion_percentage > 0)) achievements.add('Recovery Champion');
  if (Object.values(mergedRecords).some((item) => item.completion_percentage === 100)) achievements.add('Perfect Day');
  return {
    ...progress,
    total_lifetime_points: xp,
    current_level: level,
    xp_to_next_level: level * 1000 - xp,
    current_streak: current,
    longest_streak: longest,
    achievements: [...achievements],
    streak_history: dates.map((key) => ({ date: key, completion: mergedRecords[key].completion_percentage }))
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
      .catch((error) => !cancelled && dispatch({ type: 'BACKEND_STATUS', status: 'backend error', error: error.message }));
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (state.appMeta.backend_status === 'local fallback') return undefined;
    const id = setTimeout(() => {
      saveBackendState(state)
        .then(() => dispatch({ type: 'BACKEND_STATUS', status: 'connected' }))
        .catch((error) => dispatch({ type: 'BACKEND_STATUS', status: 'backend error', error: error.message }));
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
    bucket: <BucketListView />,
    journal: <JournalView />,
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
    ['bucket', ClipboardList, 'Bucket List'],
    ['journal', BookOpen, 'Journal'],
    ['student', Clock, 'Student Hub'],
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
        <small title={state.appMeta.backend_error}>Storage: {state.appMeta.backend_status === 'connected' ? 'backend database' : state.appMeta.backend_status}</small>
      </div>
      <div className="top-actions">
        <button className="soft-button" onClick={() => window.dispatchEvent(new CustomEvent('open-journal'))}><BookOpen size={17} /> Quick Journal</button>
        <button className="soft-button" onClick={() => setView('student')}><Clock size={17} /> Find Free Time</button>
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
  if (state.appMeta.backend_status === 'backend error') {
    return (
      <div className="system-banner error">
        <ShieldCheck size={18} />
        <span>Backend save is failing: {state.appMeta.backend_error}</span>
        <button className="soft-button" onClick={() => window.open(API_URL.replace('/api/state', '/api/debug'), '_blank')}>Debug API</button>
      </div>
    );
  }
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
          <TaskEditCard
            key={item.task_id}
            item={item}
            onChange={(patch) => updateTask(item.task_id, patch)}
            onDelete={() => setDraft((tasks) => tasks.filter((taskItem) => taskItem.task_id !== item.task_id))}
          />
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
  const isComplete = done && ['full', 'partial', 'showed_up'].includes(done.completion_type);
  const showDetails = open || detailed || (!isComplete && taskItem.microsteps.length > 0);
  return (
    <article className={`task-card ${done?.completion_type || ''} ${isComplete ? 'is-completed' : ''}`} style={{ '--cat': categoryColors[taskItem.category] }}>
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
          {isComplete && <span className="status-pill"><Check size={14} /> {completionLabels[done.completion_type]}</span>}
          <ChevronDown size={17} />
        </button>
        <div className="meter"><span style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>
        {isComplete ? (
          <div className="completed-row">
            <Check size={17} />
            <span>Task completed / {done.points_earned} points earned</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="soft-button" onClick={() => dispatch({ type: 'UNDO_TASK', date, taskId: taskItem.task_id })}>Undo</button>
              <button className="soft-button" onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'View details'}</button>
            </div>
          </div>
        ) : (
          <TaskActions taskItem={taskItem} date={date} />
        )}
        {showDetails && (
          <div className="task-details">
            {taskItem.notes && (open || detailed) && <p>{taskItem.notes}</p>}
            {(open || detailed) && !state.dailyPlans[date] && <label>Reschedule <input value={taskItem.time} onChange={(e) => dispatch({ type: 'RESCHEDULE_TASK', templateId: state.activeRoutine.current_template_id, taskId: taskItem.task_id, time: e.target.value })} /></label>}
            {(open || detailed) && <EnergyPicker taskId={taskItem.task_id} date={date} />}
            <Microsteps taskItem={taskItem} date={date} />
            {(open || detailed) && <StickyNote taskId={taskItem.task_id} date={date} />}
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
      {!compact && (
        <button className="icon-button danger" title="Delete permanently" onClick={() => {
          if (confirm(`Delete "${taskItem.title}"?\n\nThis will permanently scrub the task from your routines, delete all associated sticky notes and completions, and remove its data globally.\n\nContinue?`)) {
            dispatch({ type: 'DELETE_TASK_PERMANENT', date, taskId: taskItem.task_id });
            notify('Task completely erased from tracker');
          }
        }}>
          <Trash2 size={16} />
        </button>
      )}
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

function Microsteps({ taskItem, date = todayKey() }) {
  const { state, dispatch } = useApp();
  const dayRecord = getRecord(state, date);
  const completion = dayRecord.tasks_completed.find((item) => item.task_id === taskItem.task_id);
  const completedIds = completion?.completed_microstep_ids || [];
  if (!taskItem.microsteps.length) return <p className="muted">No microsteps yet.</p>;
  return (
    <div className="microsteps">
      <button className="soft-button" onClick={() => {
        const first = taskItem.microsteps.find((step) => !completedIds.includes(step.id));
        if (first) dispatch({ type: 'TOGGLE_STEP', templateId: state.activeRoutine.current_template_id, taskId: taskItem.task_id, stepId: first.id, date });
      }}><Play size={16} /> First step</button>
      {taskItem.microsteps.map((step) => (
        <label key={step.id} className="check-row">
          <input type="checkbox" checked={completedIds.includes(step.id)} onChange={() => dispatch({ type: 'TOGGLE_STEP', templateId: state.activeRoutine.current_template_id, taskId: taskItem.task_id, stepId: step.id, date })} />
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
        {!editing && (() => {
          const activeTpl = state.templates.find(t => t.template_id === state.activeRoutine.current_template_id) || state.templates[0];
          return activeTpl ? (
            <div style={{ marginTop: '2rem' }}>
              <RoutineCalendar template={activeTpl} />
            </div>
          ) : null;
        })()}
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
          <TaskEditCard
            key={item.task_id}
            item={item}
            onChange={(patch) => updateTask(item.task_id, patch)}
            onDelete={() => setDraft({ ...draft, tasks: draft.tasks.filter((taskItem) => taskItem.task_id !== item.task_id) })}
          />
        ))}
      </div>
      <RoutineCalendar template={draft} />
      <div className="completion-row">
        <button className="soft-button" onClick={() => setDraft({ ...draft, tasks: [...draft.tasks, task('New task', '12:00 PM', 25, 20, 'study', '', false, 'medium')] })}><Plus size={16} /> Task</button>
        <button className="soft-button" onClick={() => setDraft({ ...draft, tasks: draft.tasks.map((item) => ({ ...item, time: shiftTime(item.time, 30) })) })}><TimerReset size={16} /> Shift 30m</button>
        <button className="primary-button" onClick={() => { dispatch({ type: 'SAVE_TEMPLATE', template: draft }); setEditing(null); }}><Save size={16} /> Save</button>
      </div>
    </div>
  );
}

function TaskEditCard({ item, onChange, onDelete }) {
  const updateMicrostep = (id, patch) => onChange({
    microsteps: item.microsteps.map((step) => step.id === id ? { ...step, ...patch } : step)
  });
  return (
    <div className="task-edit-card">
      <div className="task-edit-grid">
        <label className="span-2">Task title
          <input placeholder="Study DSA, class, gym, revision..." value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
        </label>
        <label>Time
          <input placeholder="09:00 AM" value={item.time} onChange={(e) => onChange({ time: e.target.value })} />
        </label>
        <label>Duration
          <input type="number" min="1" value={item.duration_minutes} onChange={(e) => onChange({ duration_minutes: Number(e.target.value) })} />
        </label>
        <label>Points
          <input type="number" min="0" value={item.base_points} onChange={(e) => onChange({ base_points: Number(e.target.value), partial_points: Math.round(Number(e.target.value) * 0.7) })} />
        </label>
        <label>Category
          <select value={item.category} onChange={(e) => onChange({ category: e.target.value })}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</select>
        </label>
        <label>Energy
          <select value={item.energy_level_required} onChange={(e) => onChange({ energy_level_required: e.target.value })}><option>low</option><option>medium</option><option>high</option></select>
        </label>
        <label className="span-2">Notes
          <textarea value={item.notes || ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="What exactly counts as doing this task?" />
        </label>
      </div>
      <div className="subtask-editor">
        <div className="section-title">
          <h3>Subtasks</h3>
          <button className="soft-button" onClick={() => onChange({ microsteps: [...item.microsteps, { id: uid('step'), title: 'New subtask', points: 1, done: false }] })}><Plus size={15} /> Subtask</button>
        </div>
        {item.microsteps.map((step) => (
          <div className="subtask-row" key={step.id}>
            <input value={step.title} onChange={(e) => updateMicrostep(step.id, { title: e.target.value })} />
            <input type="number" min="0" value={step.points} onChange={(e) => updateMicrostep(step.id, { points: Number(e.target.value) })} />
            <button className="icon-button" onClick={() => onChange({ microsteps: item.microsteps.filter((micro) => micro.id !== step.id) })}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <button className="soft-button danger" onClick={onDelete}><Trash2 size={16} /> Delete task</button>
    </div>
  );
}

function RoutineCalendar({ template }) {
  const { state, dispatch, notify } = useApp();
  const [addingTask, setAddingTask] = useState(false);
  const days = Array.from({ length: 14 }, (_, index) => format(subDays(new Date(), index), 'yyyy-MM-dd'));
  
  return (
    <div className="habit-grid-container" style={{ marginTop: '1rem' }}>
      <div className="section-title">
        <h3>Routine Habit Tracker</h3>
        <button className="soft-button" onClick={() => setAddingTask(true)}><Plus size={16} /> Add Task</button>
      </div>
      {addingTask && (
        <div className="row" style={{ marginBottom: '1rem', background: 'var(--surface-2)' }}>
           <input id="new-habit-input" placeholder="Task title (e.g. Meditate, Read)..." style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--line)', color: 'var(--text)' }} />
           <button className="primary-button" onClick={() => {
              const title = document.getElementById('new-habit-input').value;
              if (title) {
                 const newTpl = { ...template, tasks: [...template.tasks, task(title, '12:00 PM', 15, 10, template.category?.toLowerCase() === 'recovery' ? 'personal' : 'study', '', false, 'medium')] };
                 dispatch({ type: 'SAVE_TEMPLATE', template: newTpl });
                 setAddingTask(false);
              }
           }}>Save to routine</button>
           <button className="soft-button danger" onClick={() => setAddingTask(false)}>Cancel</button>
        </div>
      )}
      <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{ padding: '0.8rem', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)' }}>Timeline</th>
              {template.tasks.map(t => <th key={t.task_id} title={t.title} style={{ padding: '0.8rem', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)', fontSize: '0.85rem', fontWeight: 600 }}>{t.title.length > 18 ? t.title.slice(0, 15)+'...' : t.title}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map(date => {
              const record = state.dailyRecords[date] || { tasks_completed: [] };
              return (
                <tr key={date}>
                  <td style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ minWidth: '3ch' }}>{format(new Date(date), 'd')}</strong>
                      <small>{format(new Date(date), 'MMM, EEE')}</small>
                    </div>
                  </td>
                  {template.tasks.map(t => {
                    const done = record.tasks_completed.find(item => item.task_id === t.task_id);
                    const isComplete = done && ['full', 'partial', 'showed_up'].includes(done.completion_type);
                    return (
                      <td key={t.task_id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)', textAlign: 'center' }}>
                        <button className="icon-button" style={{ width: '32px', height: '32px', background: isComplete ? 'var(--primary)' : 'var(--surface-2)', color: isComplete ? 'white' : 'var(--muted)', margin: 'auto', border: isComplete ? 'none' : '1px solid var(--line)' }} onClick={() => {
                          if (isComplete) {
                            dispatch({ type: 'UNDO_TASK', date, taskId: t.task_id });
                            notify('Task undone for ' + format(new Date(date), 'MMM d'));
                          } else {
                            dispatch({ type: 'COMPLETE_TASK', date, templateId: template.template_id, taskId: t.task_id, completion_type: 'full' });
                            notify('Task logged!');
                          }
                        }}>
                          {isComplete ? <Check size={16} /> : <div style={{width: 16, height: 16}}/>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
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
  const categoryData = categoryBreakdown(state);
  const summary = progressSummary(state);
  return (
    <section className="view-grid">
      <div className="stats-grid span-2">
        <Stat icon={CalendarDays} label="Tracked days" value={summary.days} />
        <Stat icon={Check} label="Past tasks done" value={summary.completedTasks} />
        <Stat icon={Clock} label="Pending today" value={
          Math.max(0, getTasksForDate(state, todayKey()).length - (getRecord(state, todayKey()).tasks_completed.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length))
        } />
        <Stat icon={BarChart3} label="Avg completion" value={`${summary.avgCompletion}%`} />
      </div>
      <RecentActionsFeed />
      <div className="panel">
        <h2>Category Split</h2>
        {categoryData.some((entry) => entry.value > 0) ? (
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
        ) : <p className="muted">No completed task data yet.</p>}
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
  return (
    <div className="heatmap">
      {days.map((day) => {
        const record = state.dailyRecords[day];
        const summary = record ? summarizeRecord(record, getTasksForDate(state, day)) : null;
        const completion = summary?.completion_percentage || 0;
        const points = summary?.total_points || 0;
        return (
          <button
            key={day}
            title={`${day}: ${completion}% complete, ${points} pts`}
            aria-label={`${day}: ${completion}% complete, ${points} points`}
            className="heat-cell"
            data-level={Math.ceil(completion / 25)}
          />
        );
      })}
    </div>
  );
}

function TaskAnalysis() {
  const { state } = useApp();
  const tasks = allKnownTasks(state);
  const data = tasks.map((taskItem) => {
    const attempts = Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).filter((item) => item.task_id === taskItem.task_id);
    const success = attempts.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
    return { name: taskItem.title, rate: attempts.length ? Math.round((success / attempts.length) * 100) : 0, attempts };
  }).filter((item) => item.attempts.length > 0);
  return (
    <div className="panel span-2">
      <h2>Task Success Analysis</h2>
      {data.length ? <div className="chart">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#4b7f8c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <p className="muted">Complete or skip tasks to generate precise task analysis.</p>}
    </div>
  );
}

function StudentTools() {
  const { state, dispatch } = useApp();
  const [assignment, setAssignment] = useState({ name: '', due_date: todayKey(), estimated_hours: 2, priority: 'medium' });
  const [klass, setKlass] = useState({ day: 'Monday', time: '10:00 AM', duration_minutes: 60, subject: '' });
  const [freeDate, setFreeDate] = useState(todayKey());
  const freeBlocks = findFreeBlocks(state, freeDate);
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
          <input type="number" min="15" step="15" value={klass.duration_minutes} onChange={(e) => setKlass({ ...klass, duration_minutes: Number(e.target.value) })} />
          <input placeholder="Subject" value={klass.subject} onChange={(e) => setKlass({ ...klass, subject: e.target.value })} />
        </div>
        <button className="soft-button" onClick={() => klass.subject && dispatch({ type: 'ADD_CLASS', item: { ...klass, id: uid('class') } })}><Plus size={16} /> Add class</button>
        <div className="list">
          {state.externalSchedule.class_schedule.map((item) => (
            <div className="row" key={item.id}><span>{item.day} / {item.time}<small>{item.duration_minutes || 60} min</small></span><strong>{item.subject}</strong><button className="icon-button" onClick={() => dispatch({ type: 'DELETE_CLASS', id: item.id })}><Trash2 size={15} /></button></div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>Free Time Finder</h2>
        <label>Date <input type="date" value={freeDate} onChange={(e) => setFreeDate(e.target.value)} /></label>
        <InsightList insights={freeBlocks.map((block) => ({ title: block.title, detail: block.detail }))} />
      </div>
    </section>
  );
}

function Deadline({ item }) {
  const { state, dispatch, notify } = useApp();
  const days = Math.max(1, differenceInCalendarDays(new Date(item.due_date), new Date()) + 1);
  const daily = Math.max(0.5, Math.ceil((item.estimated_hours / days) * 10) / 10);
  return (
    <div className="row">
      <span><strong>{item.name}</strong><small>{days} days left · {daily} hrs/day</small></span>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button className="icon-button" title="Add to Today" onClick={() => {
          const date = todayKey();
          const newTask = task(`Study: ${item.name}`, '05:00 PM', Math.round(daily * 60), 30, 'study', `Goal: ${daily} hours`, false, 'high');
          const existingPlan = state.dailyPlans[date];
          if (existingPlan) {
            dispatch({ type: 'SAVE_DAILY_PLAN', date, name: existingPlan.name, tasks: [...existingPlan.tasks, newTask] });
          } else {
            const tpl = state.templates.find((t) => t.template_id === state.activeRoutine.current_template_id);
            dispatch({ type: 'SAVE_DAILY_PLAN', date, name: `Manual Plan`, tasks: [...(tpl?.tasks || []).map(t => ({...t, task_id: uid('task')})), newTask] });
          }
          notify('Added study task to Today');
        }}><Plus size={15} /></button>
        <button className="icon-button danger" onClick={() => dispatch({ type: 'DELETE_ASSIGNMENT', id: item.id })}><Trash2 size={15} /></button>
      </div>
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
  const taskLookup = new Map(allKnownTasks(state).map((item) => [item.task_id, item]));
  const counts = { study: 0, exercise: 0, personal: 0, break: 0 };
  Object.values(state.dailyRecords).flatMap((record) => record.tasks_completed).forEach((done) => {
    const cat = taskLookup.get(done.task_id)?.category;
    if (cat) counts[cat] += done.points_earned;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function progressSummary(state) {
  const records = Object.entries(state.dailyRecords).map(([date, record]) => summarizeRecord(record, getTasksForDate(state, date)));
  const completedTasks = records.flatMap((record) => record.tasks_completed).filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
  const points = records.reduce((sum, record) => sum + (record.total_points || 0), 0);
  const avgCompletion = records.length ? Math.round(records.reduce((sum, record) => sum + (record.completion_percentage || 0), 0) / records.length) : 0;
  return { days: records.length, completedTasks, points, avgCompletion };
}

function allKnownTasks(state) {
  const map = new Map();
  state.templates.flatMap((tpl) => tpl.tasks).forEach((item) => map.set(item.task_id, item));
  Object.values(state.dailyPlans).flatMap((plan) => plan.tasks || []).forEach((item) => map.set(item.task_id, item));
  return [...map.values()];
}

function findFreeBlocks(state, date) {
  const prefs = state.schedulePreferences;
  const dayName = format(new Date(date), 'EEEE');
  const commute = prefs.commuteBuffer || 30;
  const classBusy = state.externalSchedule.class_schedule
    .filter((item) => item.day === dayName)
    .map((item) => {
       const block = toBusyBlock(item.time, item.duration_minutes || 60, `Class: ${item.subject}`);
       return block ? { start: block.start - commute, end: block.end + prefs.betweenClassBuffer, label: block.label } : null;
    });
  const taskBusy = getTasksForDate(state, date).map((item) => toBusyBlock(item.time, item.duration_minutes, `Task: ${item.title}`));
  const lunch = toBusyBlock(prefs.lunchBreak.start, timeToMinutes(prefs.lunchBreak.end) - timeToMinutes(prefs.lunchBreak.start), 'Lunch Break');
  
  const busy = [...classBusy, ...taskBusy, lunch].filter(Boolean).sort((a, b) => a.start - b.start);
  const merged = mergeBusyBlocks(busy);
  
  const startLimit = timeToMinutes(prefs.workingHours.earliest);
  const endLimit = timeToMinutes(prefs.workingHours.latest);
  const gaps = [];
  let cursor = startLimit;
  
  merged.forEach((block) => {
    if (block.start > endLimit || block.end < startLimit) return;
    const gapStart = Math.max(cursor, startLimit);
    const gapEnd = Math.min(block.start, endLimit);
    if (gapEnd - gapStart >= 30) gaps.push({ start: gapStart, end: gapEnd });
    cursor = Math.max(cursor, block.end);
  });
  if (endLimit - cursor >= 30) gaps.push({ start: cursor, end: endLimit });
  
  return gaps.map((gap) => {
    const mins = gap.end - gap.start;
    const isShort = mins <= 45;
    const isBest = mins >= 120;
    const hrs = (mins / 60).toFixed(1);
    const icon = isBest ? '⭐' : isShort ? '⚠️' : '✅';
    const tag = isBest ? 'Best slot' : isShort ? 'Short break' : 'Good slot';
    return {
      title: `${minutesToClock(gap.start)} - ${minutesToClock(gap.end)} [${hrs > 1 ? hrs + ' hrs' : mins + ' min'}] ${icon}`,
      detail: `${tag}. Fits tasks requiring up to ${mins} minutes.`,
      isBest
    };
  });
}

function toBusyBlock(time, duration, label) {
  const start = timeToMinutes(time);
  if (start === null) return null;
  return { start, end: start + Number(duration || 0), label };
}

function mergeBusyBlocks(blocks) {
  return blocks.reduce((merged, block) => {
    const last = merged[merged.length - 1];
    if (!last || block.start > last.end) merged.push({ ...block });
    else last.end = Math.max(last.end, block.end);
    return merged;
  }, []);
}

function timeToMinutes(time) {
  try {
    const parsed = parse(time, 'hh:mm a', new Date());
    return parsed.getHours() * 60 + parsed.getMinutes();
  } catch {
    return null;
  }
}

function minutesToClock(value) {
  const date = new Date();
  date.setHours(Math.floor(value / 60), value % 60, 0, 0);
  return format(date, 'hh:mm a');
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
function BucketListView() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  
  const items = state.bucketList.filter(item => {
    if (filter === 'incomplete') return !item.completed;
    if (filter === 'high' || filter === 'medium' || filter === 'low') return item.priority === filter;
    if (filter !== 'all') return item.category.toLowerCase() === filter.toLowerCase();
    return true;
  });

  return (
    <section className="view-grid">
      <div className="panel span-2">
        <h2>Bucket List & Projects</h2>
        <div className="row" style={{marginBottom: '1rem', background: 'var(--surface-2)'}}>
           <input placeholder="New Project / Goal" value={title} onChange={(e) => setTitle(e.target.value)} style={{flex: 1}}/>
           <input placeholder="Category (e.g. Tech, Academic)" value={category} onChange={(e) => setCategory(e.target.value)} style={{width: '150px'}}/>
           <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
           </select>
           <button className="primary-button" onClick={() => {
              if (!title) return;
              dispatch({ type: 'ADD_BUCKET_ITEM', item: { id: uid('bucket'), title, category, priority, notes, completed: false, created: new Date().toISOString() } });
              setTitle(''); setNotes('');
           }}>Add</button>
        </div>
        <textarea placeholder="Optional notes, sub-tasks, prerequisites..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{width: '100%', marginBottom: '1rem', background: 'var(--surface)'}} />
        
        <div className="filters" style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
           <button className={`soft-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
           <button className={`soft-button ${filter === 'incomplete' ? 'active' : ''}`} onClick={() => setFilter('incomplete')}>Incomplete</button>
           <button className={`soft-button ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>🔴 High</button>
           {Array.from(new Set(state.bucketList.map(i => i.category))).filter(Boolean).map(c => 
              <button key={c} className={`soft-button ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
           )}
        </div>

        <div className="list">
          {items.length === 0 ? <p className="muted">No items found.</p> : items.map(item => (
            <div key={item.id} className="row" style={{ alignItems: 'flex-start', opacity: item.completed ? 0.6 : 1, padding: '1rem', border: '1px solid var(--line)', borderRadius: '8px' }}>
               <button className="icon-button" onClick={() => dispatch({ type: 'TOGGLE_BUCKET_ITEM', id: item.id })}>
                 {item.completed ? <Check size={18} /> : <div style={{width: 18, height: 18, border: '1px solid var(--line)', borderRadius: 3}}/>}
               </button>
               <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                  <strong>{item.title}</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    <span className="badge">{item.priority === 'high' ? '🔴 High' : item.priority === 'low' ? '⚪ Low' : '🟡 Med'}</span>
                    {item.category && <span className="badge">{item.category}</span>}
                    <span className="badge" style={{opacity: 0.7}}>Added {item.created.split('T')[0]}</span>
                  </div>
                  {item.notes && <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{item.notes}</p>}
               </div>
               <button className="soft-button danger" onClick={() => dispatch({ type: 'DELETE_BUCKET_ITEM', id: item.id })}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JournalView() {
  const { state, dispatch, todayTasks } = useApp();
  const [content, setContent] = useState('');
  const [linkedTask, setLinkedTask] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
     const handler = () => document.getElementById('journal-input')?.focus();
     window.addEventListener('open-journal', handler);
     return () => window.removeEventListener('open-journal', handler);
  }, []);

  const entries = state.journalEntries.filter(e => {
     if (filter === 'linked') return !!e.linkedTaskId;
     if (filter === 'standalone') return !e.linkedTaskId;
     return true;
  });

  return (
    <section className="view-grid">
      <div className="panel span-2">
        <h2>Mental Peace Journal</h2>
        <p className="muted">Dump your overwhelming thoughts here to clear your workspace.</p>
        <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <textarea id="journal-input" placeholder="What's making your day difficult?" value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem', background: 'var(--surface)' }} />
          <div className="row">
            <select value={linkedTask} onChange={(e) => setLinkedTask(e.target.value)} style={{ flex: 1 }}>
               <option value="">No task linked (Standalone entry)</option>
               {todayTasks.map(t => <option key={t.task_id} value={t.task_id}>📌 {t.title}</option>)}
            </select>
            <button className="primary-button" onClick={() => {
               if (!content.trim()) return;
               const taskName = linkedTask ? todayTasks.find(t => t.task_id === linkedTask)?.title : null;
               dispatch({ type: 'ADD_JOURNAL_ENTRY', entry: { id: uid('journal'), date: new Date().toISOString(), content, linkedTaskId: linkedTask, linkedTaskName: taskName } });
               setContent(''); setLinkedTask('');
            }}>Save Entry</button>
          </div>
        </div>

        <div className="filters" style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
           <button className={`soft-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Entries</button>
           <button className={`soft-button ${filter === 'linked' ? 'active' : ''}`} onClick={() => setFilter('linked')}>Task-Linked</button>
           <button className={`soft-button ${filter === 'standalone' ? 'active' : ''}`} onClick={() => setFilter('standalone')}>Standalone</button>
        </div>

        <div className="list">
          {entries.length === 0 ? <p className="muted">No entries yet.</p> : entries.map(entry => (
             <div key={entry.id} className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="row" style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                   <span>{format(new Date(entry.date), 'MMM d, p')}</span>
                   {entry.linkedTaskName && <span>📌 {entry.linkedTaskName}</span>}
                   <button className="icon-button" style={{ marginLeft: 'auto' }} onClick={() => dispatch({ type: 'DELETE_JOURNAL_ENTRY', id: entry.id })}><Trash2 size={14} /></button>
                </div>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function RecentActionsFeed() {
  const { state, dispatch } = useApp();
  const today = todayKey();
  
  return (
    <div className="panel span-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <h2>Recent Actions</h2>
      <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>View today's history and undo mistakes.</p>
      <div className="list">
         {(!state.recentActions || state.recentActions.length === 0) ? <p className="muted">No actions recorded today.</p> : null}
         {state.recentActions?.map(action => {
            const isToday = format(new Date(action.timestamp), 'yyyy-MM-dd') === today;
            return (
              <div key={action.id} className="row" style={{ padding: '0.5rem', borderBottom: '1px solid var(--line)', background: action.canUndo ? 'var(--surface)' : 'var(--surface-2)', opacity: action.canUndo ? 1 : 0.6 }}>
                 <div style={{ flex: 1 }}>
                    <small style={{ color: 'var(--muted)', display: 'block' }}>{format(new Date(action.timestamp), 'h:mm a')} • {isToday ? 'Today' : 'Past'}</small>
                    <span style={{ fontSize: '0.9rem' }}>{action.description}</span>
                 </div>
                 {action.canUndo && isToday && (
                    <button className="soft-button danger" onClick={() => {
                        dispatch({ type: 'MARK_ACTION_UNDONE', id: action.id });
                        if (action.type === 'complete_task') dispatch({ type: 'UNDO_TASK', taskId: action.undoData.taskId, date: action.undoData.date });
                        if (action.type === 'delete_task') {
                            window.dispatchEvent(new CustomEvent('notify', { detail: 'Restore completely deleted tasks is not yet fully automated.' }));
                        }
                    }}>Undo</button>
                 )}
                 {!action.canUndo && <Check size={14} style={{ color: 'var(--muted)' }} />}
              </div>
            );
         })}
      </div>
    </div>
  );
}
