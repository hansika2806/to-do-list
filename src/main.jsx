import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileText,
  Filter,
  Flame,
  Heart,
  History,
  Import,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Target,
  TimerReset,
  Trash2,
  Upload,
  X,
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
import { EssayReaderView } from './EssayReaderView';

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
const prepChecklistItems = [
  ['done', 'Done'],
  ['revisionDone', 'Revision done'],
  ['notesPrepDone', 'Notes prepared'],
  ['pyqPracticeDone', 'PYQ and practice done'],
  ['shortNotesPrepDone', 'Short notes prepared'],
  ['mistakesReviewDone', 'Error list and mistakes reviewed']
];
const prepNumberItems = [
  ['examsDone', 'Exam sets done'],
  ['extraQuestionsSolved', 'Extra questions solved']
];
const examTypes = ['Placement', 'Government', 'Higher Studies', 'Internship', 'Coding Contest'];
const examStatuses = ['Not Started', 'Preparing', 'Revision', 'Mock Tests', 'Completed'];
const examPriorities = ['High', 'Medium', 'Low'];
const examResourceKinds = ['Website', 'Official Notice', 'Application Form', 'Syllabus', 'Mock Test', 'Question Paper', 'Course', 'YouTube', 'Playlist', 'PDF', 'Drive', 'Notes'];
const linkResourceKinds = new Set(examResourceKinds.filter((kind) => kind !== 'Notes'));
const examPriorityMeta = {
  High: { label: 'High', mark: '⭐' },
  Medium: { label: 'Medium', mark: '🟡' },
  Low: { label: 'Low', mark: '⚪' }
};
const defaultWeeklyGoals = [
  'Revise core syllabus topics',
  'Solve one timed mock test',
  'Update short notes and mistakes list',
  'Review previous year or company questions'
];

const prepSyllabi = {
  gate: {
    title: 'GATE CS Prep',
    subtitle: 'Computer Science and Information Technology syllabus',
    source: 'GATE 2026 CS syllabus',
    overview: 'Use this as a clean checklist for GATE Computer Science preparation.',
    sections: [
      {
        title: 'Engineering Mathematics',
        chapters: [
          {
            title: 'Discrete Mathematics',
            topics: [
              'Propositional and first order logic',
              'Sets, relations, functions, partial orders and lattices',
              'Monoids and groups',
              'Graphs covering connectivity, matching and colouring',
              'Combinatorics including counting, recurrence relations and generating functions'
            ]
          },
          {
            title: 'Linear Algebra',
            topics: [
              'Matrices and determinants',
              'Systems of linear equations',
              'Eigenvalues and eigenvectors',
              'LU decomposition'
            ]
          },
          {
            title: 'Calculus',
            topics: [
              'Limits, continuity and differentiability',
              'Maxima and minima',
              'Mean value theorem',
              'Integration'
            ]
          },
          {
            title: 'Probability and Statistics',
            topics: [
              'Random variables',
              'Uniform, normal, exponential, Poisson and binomial distributions',
              'Mean, median, mode and standard deviation',
              'Conditional probability and Bayes theorem'
            ]
          }
        ]
      },
      {
        title: 'Digital Logic',
        chapters: [
          {
            title: 'Boolean Algebra & Minimization',
            topics: [
              'Boolean algebra and canonical forms',
              'Minimization of Boolean expressions'
            ]
          },
          {
            title: 'Combinational Circuits',
            topics: [
              'Design of combinational circuits',
              'Multiplexers, decoders, and adders'
            ]
          },
          {
            title: 'Sequential Circuits',
            topics: [
              'Latches and flip-flops',
              'Registers and counters',
              'State minimization and design'
            ]
          },
          {
            title: 'Number Representations',
            topics: [
              'Number representations and computer arithmetic',
              'Fixed and floating point arithmetic'
            ]
          }
        ]
      },
      {
        title: 'Computer Organization and Architecture',
        chapters: [
          {
            title: 'Machine Instructions & Addressing',
            topics: [
              'Machine instructions',
              'Addressing modes'
            ]
          },
          {
            title: 'CPU Design',
            topics: [
              'ALU and datapath design',
              'Control unit (hardwired and microprogrammed)'
            ]
          },
          {
            title: 'Pipelining',
            topics: [
              'Instruction pipelining',
              'Pipeline hazards (structural, data, control)'
            ]
          },
          {
            title: 'Memory Hierarchy',
            topics: [
              'Cache memory (mapping, replacement, writes)',
              'Main memory and secondary storage'
            ]
          },
          {
            title: 'I/O Interface',
            topics: [
              'I/O interface (interrupt and DMA mode)'
            ]
          }
        ]
      },
      {
        title: 'Programming and Data Structures',
        chapters: [
          {
            title: 'Programming in C',
            topics: [
              'Programming in C syntax and control',
              'Recursion and parameter passing'
            ]
          },
          {
            title: 'Linear Data Structures',
            topics: [
              'Arrays',
              'Stacks and queues',
              'Linked lists'
            ]
          },
          {
            title: 'Non-Linear Data Structures',
            topics: [
              'Trees and binary search trees',
              'Binary heaps and graphs'
            ]
          }
        ]
      },
      {
        title: 'Algorithms',
        chapters: [
          {
            title: 'Searching & Sorting',
            topics: [
              'Searching algorithms (linear, binary)',
              'Sorting algorithms (comparison & non-comparison)',
              'Hashing techniques'
            ]
          },
          {
            title: 'Asymptotic Analysis',
            topics: [
              'Asymptotic worst case time and space complexity'
            ]
          },
          {
            title: 'Design Techniques',
            topics: [
              'Greedy and divide-and-conquer techniques',
              'Dynamic programming'
            ]
          },
          {
            title: 'Graph Algorithms',
            topics: [
              'Graph traversals (BFS, DFS)',
              'Minimum spanning trees',
              'Shortest paths'
            ]
          }
        ]
      },
      {
        title: 'Theory of Computation',
        chapters: [
          {
            title: 'Regular Languages',
            topics: [
              'Regular expressions and finite automata',
              'Minimization of DFA'
            ]
          },
          {
            title: 'Context-Free Languages',
            topics: [
              'Context-free grammars and languages',
              'Push-down automata (PDA)'
            ]
          },
          {
            title: 'Pumping Lemma & Closure',
            topics: [
              'Pumping lemma for regular and CFLs',
              'Closure properties of families of languages'
            ]
          },
          {
            title: 'Turing Machines',
            topics: [
              'Turing machines',
              'Undecidability and halting problem'
            ]
          }
        ]
      },
      {
        title: 'Compiler Design',
        chapters: [
          {
            title: 'Lexical Analysis & Parsing',
            topics: [
              'Lexical analysis and token recognition',
              'Top-down and bottom-up parsing'
            ]
          },
          {
            title: 'Translation & Runtime',
            topics: [
              'Syntax-directed translation',
              'Runtime environments',
              'Intermediate code generation'
            ]
          },
          {
            title: 'Code Optimization',
            topics: [
              'Local optimization',
              'Data flow analyses (constant propagation, liveness, CSE)'
            ]
          }
        ]
      },
      {
        title: 'Operating System',
        chapters: [
          {
            title: 'Process Management',
            topics: [
              'System calls',
              'Processes and threads',
              'Interprocess communication'
            ]
          },
          {
            title: 'Concurrency & Deadlocks',
            topics: [
              'Concurrency and synchronization (semaphores, mutexes)',
              'Deadlock characterization, prevention, and avoidance'
            ]
          },
          {
            title: 'CPU Scheduling',
            topics: [
              'CPU scheduling algorithms'
            ]
          },
          {
            title: 'Memory Management',
            topics: [
              'Memory management and virtual memory',
              'Page replacement algorithms'
            ]
          },
          {
            title: 'File & I/O Systems',
            topics: [
              'File systems and directory structures',
              'Disk scheduling and I/O interface'
            ]
          }
        ]
      },
      {
        title: 'Databases',
        chapters: [
          {
            title: 'Database Design',
            topics: [
              'ER model',
              'Relational model (relational algebra, tuple calculus)',
              'Integrity constraints'
            ]
          },
          {
            title: 'SQL & Normal forms',
            topics: [
              'SQL queries',
              'Normal forms and database normalization'
            ]
          },
          {
            title: 'File Org & Indexing',
            topics: [
              'File organization',
              'Indexing (B and B+ trees)'
            ]
          },
          {
            title: 'Transactions & Concurrency',
            topics: [
              'Transactions and ACID properties',
              'Concurrency control and serializability'
            ]
          }
        ]
      },
      {
        title: 'Computer Networks',
        chapters: [
          {
            title: 'Layering Concepts',
            topics: [
              'OSI and TCP/IP protocol stacks',
              'Packet, circuit and virtual circuit switching'
            ]
          },
          {
            title: 'Data Link Layer',
            topics: [
              'Framing and error detection/correction',
              'MAC protocols and Ethernet bridging'
            ]
          },
          {
            title: 'Network Layer',
            topics: [
              'Routing protocols',
              'IPv4, CIDR, and fragmentation',
              'ARP, DHCP, ICMP and NAT'
            ]
          },
          {
            title: 'Transport Layer',
            topics: [
              'Flow control and congestion control',
              'UDP, TCP, and sockets'
            ]
          },
          {
            title: 'Application Layer',
            topics: [
              'DNS, SMTP, POP3, HTTP, FTP'
            ]
          }
        ]
      }
    ]
  },
  jam: {
    title: 'JAM MS Prep',
    subtitle: 'Mathematical Statistics syllabus',
    source: 'JAM 2026 Mathematical Statistics syllabus',
    overview: 'A topic-by-topic syllabus map for JAM Mathematical Statistics.',
    sections: [
      {
        title: 'Sequences and Series of Real Numbers',
        chapters: [
          {
            title: 'Sequences and Series',
            topics: [
              'Sequences, convergence and limits',
              'Cauchy and monotonic sequences',
              'Limit superior and inferior',
              'Infinite series and convergence tests',
              'Absolute, conditional and alternating series',
              'Power series and radius of convergence'
            ]
          }
        ]
      },
      {
        title: 'Differential and Integral Calculus',
        chapters: [
          {
            title: 'Calculus of One Variable',
            topics: [
              'Limits, continuity and differentiability',
              'Rolle and Lagrange mean value theorems',
              'Taylor\'s theorem and indeterminate forms',
              'Maxima, minima and inflection points'
            ]
          },
          {
            title: 'Calculus of Two Variables',
            topics: [
              'Limits, continuity and partial differentiation',
              'Hessian matrix and saddle points',
              'Constrained optimization with Lagrange multipliers'
            ]
          },
          {
            title: 'Integral Calculus',
            topics: [
              'Single and double integrals',
              'Fundamental theorems of calculus',
              'Beta and Gamma integrals',
              'Change of variables and order of integration',
              'Arc lengths, areas and volumes'
            ]
          }
        ]
      },
      {
        title: 'Matrices and Determinants',
        chapters: [
          {
            title: 'Vector Spaces & Linear Algebra',
            topics: [
              'Vector spaces, basis and dimension',
              'Linear dependence and independence'
            ]
          },
          {
            title: 'Matrix Algebra',
            topics: [
              'Matrices, determinants and inverse',
              'Rank, nullity and systems of linear equations',
              'Eigenvalues, eigenvectors and Cayley-Hamilton',
              'Quadratic forms'
            ]
          }
        ]
      },
      {
        title: 'Descriptive Statistics and Probability',
        chapters: [
          {
            title: 'Descriptive Statistics',
            topics: [
              'Central tendency and dispersion',
              'Moments, skewness and kurtosis',
              'Correlation and regression'
            ]
          },
          {
            title: 'Probability Theory',
            topics: [
              'Sample spaces and event algebra',
              'Axiomatic probability and properties',
              'Conditional probability and Bayes theorem'
            ]
          }
        ]
      },
      {
        title: 'Univariate Distributions',
        chapters: [
          {
            title: 'Random Variables & Expectations',
            topics: [
              'Cumulative distribution function (CDF)',
              'Probability mass/density functions (PMF/PDF)',
              'Expectation, moments and MGF',
              'Markov and Chebyshev inequalities'
            ]
          },
          {
            title: 'Standard Univariate Distributions',
            topics: [
              'Discrete: Bernoulli, Binomial, Poisson, Geometric, Negative Binomial, Hypergeometric',
              'Continuous: Uniform, Exponential, Gamma, Beta, Normal, Cauchy, Double Exponential'
            ]
          }
        ]
      },
      {
        title: 'Multivariate Distributions',
        chapters: [
          {
            title: 'Bivariate & Multivariate Random Variables',
            topics: [
              'Joint, marginal and conditional distributions',
              'Independence of random variables',
              'Bivariate transformations and Jacobian method',
              'Covariance, correlation and joint MGF',
              'Bivariate normal and Multinomial distributions'
            ]
          }
        ]
      },
      {
        title: 'Limit Theorems',
        chapters: [
          {
            title: 'Convergence & Law of Large Numbers',
            topics: [
              'Convergence in probability, mean square, almost surely, in distribution',
              'Weak Law of Large Numbers (WLLN)',
              'Strong Law of Large Numbers (SLLN)',
              'Central Limit Theorem (CLT)'
            ]
          }
        ]
      },
      {
        title: 'Sampling Distributions',
        chapters: [
          {
            title: 'Order Statistics & Standard Sampling Distributions',
            topics: [
              'Random samples, parameters and statistics',
              'Order statistics (smallest and largest)',
              'Chi-square, t, and F distributions'
            ]
          }
        ]
      },
      {
        title: 'Estimation',
        chapters: [
          {
            title: 'Point & Interval Estimation',
            topics: [
              'Unbiasedness, consistency and efficiency',
              'Sufficiency and completeness',
              'Rao-Blackwell and Lehmann-Scheffe theorems',
              'Cramer-Rao inequality and UMVUE',
              'Methods of estimation (MLE, Moments, Least Squares)',
              'Confidence intervals'
            ]
          }
        ]
      },
      {
        title: 'Testing of Hypotheses',
        chapters: [
          {
            title: 'Hypothesis Testing',
            topics: [
              'Null/alternative hypotheses, Type I & II errors',
              'Power function and critical region',
              'Neyman-Pearson lemma and MP tests',
              'UMP tests and Likelihood Ratio tests'
            ]
          }
        ]
      },
      {
        title: 'Nonparametric Methods',
        chapters: [
          {
            title: 'Nonparametric Tests',
            topics: [
              'Runs test for randomness',
              'Kolmogorov-Smirnov one-sample test',
              'Sign tests (one and two sample)',
              'Wilcoxon signed-rank and Mann-Whitney tests'
            ]
          }
        ]
      },
      {
        title: 'Stochastic Processes',
        chapters: [
          {
            title: 'Markov Chains & Poisson Processes',
            topics: [
              'Discrete time Markov chains',
              'Transition probability matrices and state classification',
              'Stationary and limiting distributions',
              'Poisson process and waiting times'
            ]
          }
        ]
      }
    ]
  },
  mstat: {
    title: 'M.Stat Prep',
    subtitle: 'PSA and PSB syllabus',
    source: 'M.Stat PSA/PSB 2026 syllabus',
    overview: 'The M.Stat entrance syllabus grouped into Mathematics and Statistics/Probability.',
    sections: [
      {
        title: 'Progressions and Trigonometry',
        chapters: [
          {
            title: 'Progressions',
            topics: [
              'Arithmetic progression',
              'Geometric progression',
              'Harmonic progression'
            ]
          },
          {
            title: 'Trigonometry',
            topics: [
              'Trigonometric functions and identities'
            ]
          }
        ]
      },
      {
        title: 'Coordinate Geometry',
        chapters: [
          {
            title: 'Two-Dimensional Coordinate Geometry',
            topics: [
              'Straight lines and circles',
              'Parabolas, ellipses, and hyperbolas'
            ]
          }
        ]
      },
      {
        title: 'Sets, Functions and Combinatorics',
        chapters: [
          {
            title: 'Sets and Functions',
            topics: [
              'Elementary set theory',
              'Functions and relations'
            ]
          },
          {
            title: 'Combinatorics',
            topics: [
              'Permutations and combinations',
              'Binomial and multinomial theorems'
            ]
          }
        ]
      },
      {
        title: 'Algebra and Complex Numbers',
        chapters: [
          {
            title: 'Algebra',
            topics: [
              'Theory of equations'
            ]
          },
          {
            title: 'Complex Numbers',
            topics: [
              'Complex numbers and properties',
              'De Moivre theorem'
            ]
          }
        ]
      },
      {
        title: 'Linear Algebra',
        chapters: [
          {
            title: 'Vector Spaces',
            topics: [
              'Vector spaces and subspaces',
              'Basis and dimension'
            ]
          },
          {
            title: 'Matrix Theory',
            topics: [
              'Determinants, rank, trace, and inverse of a matrix',
              'Systems of linear equations',
              'Eigenvalues and eigenvectors of matrices'
            ]
          }
        ]
      },
      {
        title: 'Calculus',
        chapters: [
          {
            title: 'Calculus of One Variable',
            topics: [
              'Limit and continuity of functions of one variable',
              'Differentiation and integration',
              'Applications of differential calculus (maxima and minima)'
            ]
          }
        ]
      },
      {
        title: 'Probability Foundations',
        chapters: [
          {
            title: 'Probability Foundations',
            topics: [
              'Sample space and probability',
              'Combinatorial and conditional probability',
              'Independence and Bayes theorem'
            ]
          },
          {
            title: 'Random Variables Foundations',
            topics: [
              'Random variables and probability functions',
              'Expectations, moments, and moment generating functions'
            ]
          }
        ]
      },
      {
        title: 'Distributions',
        chapters: [
          {
            title: 'Univariate Distributions',
            topics: [
              'Standard univariate discrete and continuous distributions',
              'Distribution of functions of a random variable'
            ]
          },
          {
            title: 'Multivariate Distributions',
            topics: [
              'Joint, marginal and conditional distributions',
              'Multinomial, bivariate normal and multivariate normal distributions',
              'Order statistics'
            ]
          }
        ]
      },
      {
        title: 'Limit Theorems & Sampling',
        chapters: [
          {
            title: 'Sampling Distributions',
            topics: [
              'Sampling distributions of statistics'
            ]
          },
          {
            title: 'Limit Theorems',
            topics: [
              'Weak Law of Large Numbers (WLLN)',
              'Central Limit Theorem (CLT)'
            ]
          }
        ]
      },
      {
        title: 'Descriptive Statistics & Regression',
        chapters: [
          {
            title: 'Descriptive Statistics',
            topics: [
              'Descriptive statistical measures',
              'Pearson and Spearman correlation'
            ]
          },
          {
            title: 'Regression',
            topics: [
              'Simple and multiple linear regression'
            ]
          }
        ]
      },
      {
        title: 'Estimation and Testing',
        chapters: [
          {
            title: 'Estimation Theory',
            topics: [
              'Unbiasedness, minimum variance, and sufficiency',
              'Maximum likelihood and method of moments estimation'
            ]
          },
          {
            title: 'Hypothesis Testing',
            topics: [
              'Tests of hypotheses and Neyman-Pearson lemma applications',
              'Confidence intervals and regression inference'
            ]
          }
        ]
      },
      {
        title: 'Design of Experiments and Sampling',
        chapters: [
          {
            title: 'Design of Experiments',
            topics: [
              'CRD, RBD, LSD and their analyses',
              'Analysis of Variance (ANOVA)',
              'Elements of factorial designs'
            ]
          },
          {
            title: 'Sampling Theory',
            topics: [
              'SRSWR and SRSWOR',
              'Stratified sampling'
            ]
          }
        ]
      }
    ]
  }
};

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
      task('Weak topic review', '06:00 PM', 90, 90, 'study', 'The one topic that would make the exam feel lighter.', true, 'medium')
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
    base_points: 0,
    partial_points: 0,
    microsteps: microsteps.map(([label]) => ({ id: uid('step'), title: label, points: 0, done: false })),
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
  examPrep: [],
  prepProgress: {},
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
    theme: 'light',
    reminders: []
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
  const merged = {
    ...initialState,
    ...saved,
    templates: saved.templates?.length ? saved.templates : defaultTemplates,
    dailyPlans: saved.dailyPlans || {},
    bucketList: (saved.bucketList || []).map(normalizeBucketItem),
    journalEntries: (saved.journalEntries || []).map(normalizeJournalEntry),
    examPrep: (saved.examPrep || []).map(normalizeExamPrep),
    prepProgress: saved.prepProgress || {},
    preferences: { ...initialState.preferences, ...saved.preferences },
    userProgress: { ...initialState.userProgress, ...saved.userProgress },
    externalSchedule: { ...initialState.externalSchedule, ...saved.externalSchedule },
    appMeta: { ...initialState.appMeta, ...saved.appMeta }
  };
  return rebuildDerivedState(merged);
}

function loadState() {
  try {
    const raw = window.storage?.getItem ? window.storage.getItem('steady-state') : localStorage.getItem('steady-state');
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return initialState;
  }
}

function stripScoringState(state) {
  const cleanTask = (item) => {
    const { base_points, partial_points, ...taskItem } = item;
    return {
      ...taskItem,
      microsteps: (item.microsteps || []).map(({ points, ...step }) => step)
    };
  };
  const cleanCompletion = (item) => {
    const { points_earned, subtask_points, ...completion } = item;
    return completion;
  };
  const cleanRecord = (record) => {
    const { total_points, ...entry } = record;
    return {
      ...entry,
      tasks_completed: (record.tasks_completed || []).map(cleanCompletion)
    };
  };
  const { total_lifetime_points, current_level, xp_to_next_level, achievements, ...userProgress } = state.userProgress || {};
  return {
    ...state,
    templates: (state.templates || []).map((template) => ({ ...template, tasks: (template.tasks || []).map(cleanTask) })),
    dailyPlans: Object.fromEntries(Object.entries(state.dailyPlans || {}).map(([date, plan]) => [date, { ...plan, tasks: (plan.tasks || []).map(cleanTask) }])),
    dailyRecords: Object.fromEntries(Object.entries(state.dailyRecords || {}).map(([date, record]) => [date, cleanRecord(record)])),
    userProgress
  };
}

function saveState(state) {
  const raw = JSON.stringify(stripScoringState(state));
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
      state: stripScoringState(state)
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

      const nextComp = { ...existing, completion_type: 'in_progress', points_earned: 0 };
      const nextCompletions = (existing.subtask_points || 0) > 0 || existing.sticky_note 
        ? record.tasks_completed.map((item) => item.task_id === targetId ? nextComp : item)
        : record.tasks_completed.filter((item) => item.task_id !== targetId);

      const nextRecord = summarizeRecord({ ...record, tasks_completed: nextCompletions }, tasks);
      const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord);

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
    case 'UPDATE_PREP_PROGRESS': {
      const current = state.prepProgress?.[action.key] || {};
      return {
        ...state,
        prepProgress: {
          ...state.prepProgress,
          [action.key]: { ...current, ...action.patch }
        }
      };
    }
    case 'ADD_REMINDER':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          reminders: [...(state.preferences.reminders || []), { id: uid('reminder'), text: action.text }]
        }
      };
    case 'UPDATE_REMINDER':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          reminders: (state.preferences.reminders || []).map((item) => item.id === action.id ? { ...item, text: action.text } : item)
        }
      };
    case 'DELETE_REMINDER':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          reminders: (state.preferences.reminders || []).filter((item) => item.id !== action.id)
        }
      };
    case 'IMPORT_STATE':
      return normalize(action.state);
    case 'RESET_DATA':
      return initialState;
    case 'ADD_BUCKET_ITEM':
      return { ...state, bucketList: [action.item, ...state.bucketList] };
    case 'TOGGLE_BUCKET_ITEM':
      return {
        ...state,
        bucketList: state.bucketList.map(item => {
          if (item.id !== action.id) return item;
          const nextDone = !item.completed;
          return {
            ...item,
            completed: nextDone,
            status: nextDone ? 'done' : 'in_progress',
            completedDate: nextDone ? todayKey() : ''
          };
        })
      };
    case 'UPDATE_BUCKET_ITEM':
      return {
        ...state,
        bucketList: state.bucketList.map(item => item.id === action.id ? { ...item, ...action.patch } : item)
      };
    case 'TOGGLE_BUCKET_CHECK':
      return {
        ...state,
        bucketList: state.bucketList.map(item => item.id === action.id ? {
          ...item,
          checklist: (item.checklist || []).map(step => step.id === action.stepId ? { ...step, done: !step.done } : step)
        } : item)
      };
    case 'ADD_BUCKET_CHECK':
      return {
        ...state,
        bucketList: state.bucketList.map(item => item.id === action.id ? {
          ...item,
          checklist: [...(item.checklist || []), { id: uid('check'), title: action.title, done: false }]
        } : item)
      };
    case 'DELETE_BUCKET_CHECK':
      return {
        ...state,
        bucketList: state.bucketList.map(item => item.id === action.id ? {
          ...item,
          checklist: (item.checklist || []).filter(step => step.id !== action.stepId)
        } : item)
      };
    case 'ADD_BUCKET_LINK':
      return {
        ...state,
        bucketList: state.bucketList.map(item => item.id === action.id ? {
          ...item,
          links: [...(item.links || []), { id: uid('link'), title: action.title, url: action.url }]
        } : item)
      };
    case 'DELETE_BUCKET_LINK':
      return {
        ...state,
        bucketList: state.bucketList.map(item => item.id === action.id ? {
          ...item,
          links: (item.links || []).filter(link => link.id !== action.linkId)
        } : item)
      };
    case 'DELETE_BUCKET_ITEM':
      return { ...state, bucketList: state.bucketList.filter(item => item.id !== action.id) };
    case 'ADD_EXAM_PREP':
      return { ...state, examPrep: [normalizeExamPrep(action.exam), ...(state.examPrep || [])] };
    case 'UPDATE_EXAM_PREP':
      return {
        ...state,
        examPrep: (state.examPrep || []).map((exam) => exam.id === action.id ? normalizeExamPrep({ ...exam, ...action.patch }) : exam)
      };
    case 'DELETE_EXAM_PREP':
      return { ...state, examPrep: (state.examPrep || []).filter((exam) => exam.id !== action.id) };
    case 'TOGGLE_EXAM_GOAL':
      return {
        ...state,
        examPrep: (state.examPrep || []).map((exam) => exam.id === action.id ? normalizeExamPrep({
          ...exam,
          weeklyGoals: (exam.weeklyGoals || []).map((goal) => goal.id === action.goalId ? { ...goal, done: !goal.done } : goal)
        }) : exam)
      };
    case 'ADD_EXAM_GOAL':
      return {
        ...state,
        examPrep: (state.examPrep || []).map((exam) => exam.id === action.id ? normalizeExamPrep({
          ...exam,
          weeklyGoals: [...(exam.weeklyGoals || []), { id: uid('goal'), title: action.title, done: false }]
        }) : exam)
      };
    case 'DELETE_EXAM_GOAL':
      return {
        ...state,
        examPrep: (state.examPrep || []).map((exam) => exam.id === action.id ? normalizeExamPrep({
          ...exam,
          weeklyGoals: (exam.weeklyGoals || []).filter((goal) => goal.id !== action.goalId)
        }) : exam)
      };
    case 'ADD_EXAM_RESOURCE':
      return {
        ...state,
        examPrep: (state.examPrep || []).map((exam) => exam.id === action.id ? normalizeExamPrep({
          ...exam,
          resources: [...(exam.resources || []), { id: uid('resource'), label: action.label, url: action.url, kind: action.kind }]
        }) : exam)
      };
    case 'DELETE_EXAM_RESOURCE':
      return {
        ...state,
        examPrep: (state.examPrep || []).map((exam) => exam.id === action.id ? normalizeExamPrep({
          ...exam,
          resources: (exam.resources || []).filter((resource) => resource.id !== action.resourceId)
        }) : exam)
      };
    case 'ADD_JOURNAL_ENTRY':
      return { ...state, journalEntries: [action.entry, ...state.journalEntries] };
    case 'UPDATE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry => entry.id === action.id ? { ...entry, ...action.patch } : entry)
      };
    case 'ADD_JOURNAL_FOLLOWUP':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry => entry.id === action.id ? {
          ...entry,
          followUps: [...(entry.followUps || []), { text: action.text, timestamp: new Date().toISOString() }]
        } : entry)
      };
    case 'TOGGLE_JOURNAL_TODO':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry => entry.id === action.id ? {
          ...entry,
          tasks: (entry.tasks || []).map((taskItem, index) => taskItem.id === action.taskId
            ? { ...taskItem, completed: !taskItem.completed, number: index + 1 }
            : { ...taskItem, number: index + 1 })
        } : entry)
      };
    case 'UPDATE_JOURNAL_TODO':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry => entry.id === action.id ? {
          ...entry,
          tasks: (entry.tasks || []).map((taskItem, index) => taskItem.id === action.taskId
            ? { ...taskItem, text: action.text, number: index + 1 }
            : { ...taskItem, number: index + 1 })
        } : entry)
      };
    case 'ADD_JOURNAL_TODO':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry => entry.id === action.id ? {
          ...entry,
          tasks: [...(entry.tasks || []), { id: uid('todo'), number: (entry.tasks || []).length + 1, text: '', completed: false }]
        } : entry)
      };
    case 'DELETE_JOURNAL_TODO':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry => entry.id === action.id ? {
          ...entry,
          tasks: (entry.tasks || []).filter(taskItem => taskItem.id !== action.taskId).map((taskItem, index) => ({ ...taskItem, number: index + 1 }))
        } : entry)
      };
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
  const points = 0;
  const record = {
    ...getRecord(state, date),
    active_template_id: action.templateId && !state.dailyPlans[date] ? action.templateId : getRecord(state, date).active_template_id
  };
  const existing = record.tasks_completed.find((item) => item.task_id === action.taskId);
  const completion = {
    task_id: action.taskId,
    completion_type: action.completion_type,
    points_earned: points,
    subtask_points: 0,
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
  const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord);
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
  const tasksCompleted = template.tasks.map((taskItem) => ({
    task_id: taskItem.task_id,
    completion_type: completionType,
    points_earned: 0,
    completion_time: new Date().toISOString(),
    energy_before: 3,
    energy_after: 3,
    sticky_note: completionType === 'full' ? 'Routine marked complete from calendar.' : '',
    time_spent_minutes: completionType === 'full' ? taskItem.duration_minutes : 0
  }));
  const nextRecord = summarizeRecord({ ...record, active_template_id: templateId, tasks_completed: tasksCompleted }, template.tasks);
  const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord);
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
  const pointsForStep = 0;
  const comp = existing || {
    task_id: action.taskId, completion_type: 'in_progress', points_earned: 0,
    completion_time: new Date().toISOString(), energy_before: 3, energy_after: 3, sticky_note: '', time_spent_minutes: 0,
    subtask_points: 0,
    completed_microstep_ids: []
  };
  
  const pointShift = 0;
  const nextIds = isDone ? [...completedIds, action.stepId] : completedIds.filter((id) => id !== action.stepId);
  const nextComp = { ...comp, subtask_points: Math.max(0, (comp.subtask_points || 0) + pointShift), completed_microstep_ids: nextIds };
  const finalComp = { ...nextComp, points_earned: existing && existing.completion_type !== 'in_progress' ? comp.points_earned : (comp.points_earned + pointShift) };
  
  const shouldKeepCompletion = finalComp.completion_type !== 'in_progress' || finalComp.completed_microstep_ids.length > 0 || finalComp.sticky_note;
  const nextCompletions = existing
    ? (shouldKeepCompletion ? record.tasks_completed.map(item => item.task_id === action.taskId ? finalComp : item) : record.tasks_completed.filter(item => item.task_id !== action.taskId))
    : [...record.tasks_completed, finalComp];
  const nextRecord = summarizeRecord({ ...record, tasks_completed: nextCompletions }, tasks);
  const progress = recalculateProgress(state.userProgress, state.dailyRecords, date, nextRecord);

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

function rebuildDerivedState(state) {
  const dailyRecords = Object.fromEntries(
    Object.entries(state.dailyRecords || {}).map(([date, record]) => [date, summarizeRecord(record, getTasksForDate(state, date))])
  );
  return {
    ...state,
    dailyRecords,
    userProgress: recalculateProgress(state.userProgress, dailyRecords)
  };
}

function summarizeRecord(record, source) {
  const tasks = Array.isArray(source) ? source : source?.tasks || [];
  const taskIds = new Set(tasks.map((item) => item.task_id));
  const relevantCompletions = taskIds.size ? record.tasks_completed.filter((item) => taskIds.has(item.task_id)) : [];
  const completeCount = relevantCompletions.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
  const total = tasks.length || 1;
  return {
    ...record,
    tasks_completed: relevantCompletions,
    total_points: 0,
    completion_percentage: Math.min(100, Math.round((completeCount / total) * 100))
  };
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
  const achievements = new Set();
  return {
    ...progress,
    total_lifetime_points: 0,
    current_level: 1,
    xp_to_next_level: 0,
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
    bucket: <RichBucketListView />,
    exams: <ExamPreparationTracker />,
    journal: <JournalView />,
    student: <StudentTools />,
    gate: <PrepSyllabusPage kind="gate" />,
    jam: <PrepSyllabusPage kind="jam" />,
    mstat: <PrepSyllabusPage kind="mstat" />,
    reflect: <Reflection />,
    settings: <SettingsPanel />,
    essay: <EssayReaderView />
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
    ['exams', Target, 'Exam Tracker'],
    ['journal', BookOpen, 'Journal'],
    ['student', Clock, 'Student Hub'],
    ['gate', ClipboardList, 'GATE CS'],
    ['jam', ClipboardList, 'JAM MS'],
    ['mstat', ClipboardList, 'M.Stat'],
    ['reflect', Pencil, 'Reflect'],
    ['settings', Settings, 'Settings'],
    ['essay', Play, 'Essay Reader']
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
        </div>
        <div className="completion-row">
          <button className="primary-button" onClick={() => { dispatch({ type: 'IMPORT_STATE', state: preview.state }); notify('Backup imported'); onClose(); }}><Upload size={16} /> Import verified backup</button>
          <button className="soft-button" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PrepSyllabusPage({ kind }) {
  const { state } = useApp();
  const syllabus = prepSyllabi[kind];
  const stats = prepExamStats(kind, syllabus, state.prepProgress);
  return (
    <section className="prep-page">
      <div className="prep-hero">
        <p className="eyebrow">{syllabus.source}</p>
        <h2>{syllabus.title}</h2>
        <p>{syllabus.subtitle}</p>
        <div className="prep-hero-meta">
          <span className="pill">{stats.completed}/{stats.total} chapters complete</span>
          <span className="pill">{stats.average}% tracked</span>
        </div>
      </div>
      <div className="prep-layout">
        <aside className="prep-index">
          <h2>Subjects</h2>
          {syllabus.sections.map((section, index) => (
            <a key={section.title} href={`#${kind}-${index + 1}`}>
              <span>{index + 1}. {section.title}</span>
              <small>{prepSectionPercent(kind, index, section, state.prepProgress)}%</small>
            </a>
          ))}
        </aside>
        <div className="prep-content">
          <div className="panel">
            <h2>Overview</h2>
            <p>{syllabus.overview}</p>
          </div>
          {syllabus.sections.map((section, index) => (
            <PrepChapterCard kind={kind} section={section} index={index} key={section.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function prepTopicKey(kind, sectionIndex, chapterIndex) {
  return `${kind}:${sectionIndex}:${chapterIndex}`;
}

function prepChapterPercent(chapter, progress = {}) {
  if (!chapter || !chapter.topics || !chapter.topics.length) {
    return progress.done ? 100 : 0;
  }
  const doneCount = chapter.topics.filter((_, i) => Boolean(progress.topicsDone?.[i])).length;
  return Math.round((doneCount / chapter.topics.length) * 100);
}

function prepSectionPercent(kind, sectionIndex, section, progress = {}) {
  if (!section.chapters || !section.chapters.length) return 0;
  const sum = section.chapters.reduce((total, chapter, chapterIndex) => {
    const key = prepTopicKey(kind, sectionIndex, chapterIndex);
    return total + prepChapterPercent(chapter, progress?.[key]);
  }, 0);
  return Math.round(sum / section.chapters.length);
}

function prepExamStats(kind, syllabus, progress = {}) {
  const chapterPercents = [];
  let totalChapters = 0;
  let completedChapters = 0;

  syllabus.sections.forEach((section, sectionIndex) => {
    section.chapters.forEach((chapter, chapterIndex) => {
      totalChapters++;
      const key = prepTopicKey(kind, sectionIndex, chapterIndex);
      const chapterProg = progress?.[key] || {};
      const pct = prepChapterPercent(chapter, chapterProg);
      chapterPercents.push(pct);
      if (pct === 100) {
        completedChapters++;
      }
    });
  });

  const average = totalChapters ? Math.round(chapterPercents.reduce((sum, percent) => sum + percent, 0) / totalChapters) : 0;
  return { total: totalChapters, completed: completedChapters, average };
}

function PrepChapterCard({ kind, section, index }) {
  const { state, dispatch } = useApp();
  const [selectedChapter, setSelectedChapter] = useState(0);
  const chapter = section.chapters[selectedChapter] || null;
  const key = prepTopicKey(kind, index, selectedChapter);
  const progress = state.prepProgress?.[key] || {};
  const percent = prepChapterPercent(chapter, progress);
  const sectionPercent = prepSectionPercent(kind, index, section, state.prepProgress);
  const update = (patch) => dispatch({ type: 'UPDATE_PREP_PROGRESS', key, patch: { ...patch, updated_at: new Date().toISOString() } });

  const toggleTopic = (topicIndex) => {
    const currentTopicsDone = progress.topicsDone || {};
    const nextTopicsDone = {
      ...currentTopicsDone,
      [topicIndex]: !currentTopicsDone[topicIndex]
    };
    // Automatically compute if all topics are done
    const allDone = chapter.topics.every((_, i) => Boolean(nextTopicsDone[i]));
    update({
      topicsDone: nextTopicsDone,
      done: allDone
    });
  };

  const toggleChapterDone = (checked) => {
    const nextTopicsDone = {};
    if (chapter && chapter.topics) {
      chapter.topics.forEach((_, i) => {
        nextTopicsDone[i] = checked;
      });
    }
    update({
      topicsDone: nextTopicsDone,
      done: checked
    });
  };

  return (
    <article className="prep-section" id={`${kind}-${index + 1}`}>
      <div className="prep-section-head">
        <div>
          <span className="pill">Subject {index + 1}</span>
          <h2>{section.title}</h2>
        </div>
        <strong>{sectionPercent}%</strong>
      </div>
      <div className="prep-topic-list">
        {section.chapters.map((item, chapIndex) => {
          const chapKey = prepTopicKey(kind, index, chapIndex);
          const chapProg = state.prepProgress?.[chapKey] || {};
          const chapPct = prepChapterPercent(item, chapProg);
          return (
            <button
              className={selectedChapter === chapIndex ? 'prep-topic active' : 'prep-topic'}
              key={item.title}
              onClick={() => setSelectedChapter(chapIndex)}
            >
              <span>{item.title}</span>
              <small>{chapPct}%</small>
            </button>
          );
        })}
      </div>
      {chapter && (
        <div className="prep-workbox">
          {/* Column 1: Topics Checklist */}
          <div className="prep-subtopics-container">
            <span className="pill">Syllabus Coverage</span>
            <div className="prep-subtopics-list">
              {chapter.topics.map((subtopic, subIndex) => {
                const isDone = Boolean(progress.topicsDone?.[subIndex]);
                return (
                  <label className="subtopic-row" key={subIndex}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleTopic(subIndex)}
                    />
                    <span className={isDone ? "subtopic-text completed" : "subtopic-text"}>
                      {subtopic}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="prep-coverage-summary">
              <strong>{percent}%</strong>
              <small>
                {chapter.topics.filter((_, i) => Boolean(progress.topicsDone?.[i])).length} of {chapter.topics.length} done
              </small>
            </div>
          </div>

          {/* Column 2: Preparation Milestones */}
          <div className="prep-checklist">
            {prepChecklistItems.map(([field, label]) => (
              <label className="check-row" key={field}>
                <input
                  type="checkbox"
                  checked={field === 'done' ? Boolean(progress[field]) : Boolean(progress[field])}
                  onChange={(event) => {
                    if (field === 'done') {
                      toggleChapterDone(event.target.checked);
                    } else {
                      update({ [field]: event.target.checked });
                    }
                  }}
                />
                <span className={field === 'done' && progress.done ? "milestone-text done" : "milestone-text"}>
                  {label}
                </span>
              </label>
            ))}
          </div>

          {/* Column 3: Metrics Counters */}
          <div className="prep-counts">
            {prepNumberItems.map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  type="number"
                  min="0"
                  value={progress[field] || 0}
                  onChange={(event) => update({ [field]: Number(event.target.value) })}
                />
              </label>
            ))}
          </div>

          {/* Column 4: Chapter Notes */}
          <label className="prep-notes">
            Chapter notes
            <textarea
              value={progress.notes || ''}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Write formulas, doubts, traps, solved sources, or what to revise next..."
            />
          </label>
        </div>
      )}
    </article>
  );
}

function Today() {
  const { state, activeTemplate, record, insights } = useApp();
  const nextTask = activeTemplate.tasks.find((item) => !record.tasks_completed.some((done) => done.task_id === item.task_id && ['full', 'partial', 'showed_up'].includes(done.completion_type))) || activeTemplate.tasks[0];
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
      <ThingsToRemember />
      <StatsOverview />
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

function ThingsToRemember() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const reminders = state.preferences.reminders || [];
  const addReminder = () => {
    if (!draft.trim()) return;
    dispatch({ type: 'ADD_REMINDER', text: draft.trim() });
    setDraft('');
  };
  return (
    <div className="panel remember-box">
      <button className="remember-head" onClick={() => setOpen(!open)}>
        <span><Sparkles size={18} /> Things to Remember</span>
        <ChevronDown size={16} className={open ? 'open' : ''} />
      </button>
      {open && (
        <div className="remember-body">
          <ul>
            {reminders.map((item) => (
              <li key={item.id}>
                <span className="pin-dot" title="Persistent reminder">Pin</span>
                <input value={item.text} onChange={(e) => dispatch({ type: 'UPDATE_REMINDER', id: item.id, text: e.target.value })} />
                <button className="icon-button danger" title="Delete reminder" onClick={() => dispatch({ type: 'DELETE_REMINDER', id: item.id })}><X size={15} /></button>
              </li>
            ))}
          </ul>
          <div className="remember-add">
            <input placeholder="Add new reminder..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addReminder(); }} />
            <button className="soft-button" onClick={addReminder}><Plus size={15} /> Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsOverview() {
  const { state } = useApp();
  const todayRecord = getRecord(state, todayKey());
  const todayTasks = getTasksForDate(state, todayKey());
  const doneToday = todayRecord.tasks_completed.filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
  const pendingToday = Math.max(0, todayTasks.length - doneToday);
  return (
    <div className="stats-grid">
      <Stat icon={Check} label="Done today" value={doneToday} />
      <Stat icon={Clock} label="Pending today" value={pendingToday} />
      <Stat icon={Flame} label="Streak" value={state.userProgress.current_streak} />
      <Stat icon={Sparkles} label="Today" value={`${todayRecord.completion_percentage}%`} />
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
  const isComplete = done && ['full', 'partial', 'showed_up'].includes(done.completion_type);
  const completedSteps = done?.completed_microstep_ids?.length || 0;
  const stepPct = taskItem.microsteps.length ? completedSteps / taskItem.microsteps.length : 0;
  const pct = isComplete ? 1 : stepPct;
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
            <small>{categoryLabels[taskItem.category]} / {taskItem.energy_level_required} energy</small>
          </span>
          {isComplete && <span className="status-pill"><Check size={14} /> {completionLabels[done.completion_type]}</span>}
          <ChevronDown size={17} />
        </button>
        <div className="meter"><span style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>
        {isComplete ? (
          <div className="completed-row">
            <Check size={17} />
            <span>Task completed</span>
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
          <span>{step.title}</span>
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
  const activeTpl = state.templates.find(t => t.template_id === state.activeRoutine.current_template_id) || state.templates[0];

  if (editing) {
    return (
      <section className="view-grid">
        <TemplateEditor template={editing} setEditing={setEditing} />
      </section>
    );
  }

  return (
    <div className="routine-fullpage-layout" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Active Routine Header */}
      <div className="panel" style={{ borderTop: '4px solid var(--primary)', padding: '1.5rem', margin: 0 }}>
        <div className="section-title" style={{ margin: 0, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.2rem' }}>{activeTpl ? activeTpl.name : 'No Active Routine'}</h2>
            <p className="muted" style={{ margin: 0 }}>{activeTpl ? activeTpl.description : 'Create a routine to start tracking your daily habits.'}</p>
          </div>
          <div className="completion-row">
            {activeTpl && <button className="primary-button" onClick={() => setEditing(activeTpl)}><Pencil size={16} /> Edit Routine & Tasks</button>}
          </div>
        </div>
      </div>

      {/* Whole Page Spreadsheet Habit Tracker */}
      {activeTpl && <RoutineCalendar template={activeTpl} />}

      {/* Routine Templates Library */}
      <div className="panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <div className="section-title" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.2rem' }}>Routine Library</h2>
            <p className="muted" style={{ margin: 0 }}>Switch or create habit templates</p>
          </div>
          <button className="primary-button" onClick={() => setEditing(blankTemplate())}><Plus size={16} /> New Template</button>
        </div>
        <div className="template-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {state.templates.filter(t => t.template_id !== state.activeRoutine.current_template_id).map((tpl) => (
            <article key={tpl.template_id} className="template-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.4rem' }}>{tpl.name}</strong>
                <p style={{ marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.9rem', minHeight: '40px' }}>{tpl.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  <span className="badge" style={{ background: 'color-mix(in srgb, var(--surface-2) 50%, transparent)' }}>{tpl.category}</span>
                  <span className="badge" style={{ background: 'color-mix(in srgb, var(--surface-2) 50%, transparent)' }}>{tpl.tasks.length} tasks</span>
                </div>
              </div>
              <div className="completion-row" style={{ marginTop: 'auto' }}>
                <button className="primary-button" style={{ flex: 1 }} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); dispatch({ type: 'SET_TEMPLATE', id: tpl.template_id }); }}><Play size={16} /> Activate</button>
                <button className="icon-button" title="Clone" onClick={() => dispatch({ type: 'SAVE_TEMPLATE', template: { ...tpl, template_id: uid('tpl'), name: `${tpl.name} Copy` } })}><Copy size={16} /></button>
                <button className="icon-button" title="Edit" onClick={() => setEditing(tpl)}><Pencil size={16} /></button>
                <button className="icon-button danger" title="Delete" onClick={() => dispatch({ type: 'DELETE_TEMPLATE', id: tpl.template_id })}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
          {state.templates.length <= 1 && (
            <div className="empty" style={{ minHeight: '160px', gridColumn: '1 / -1', background: 'var(--surface-2)', borderRadius: '8px' }}>
              <Archive size={28} style={{ marginBottom: '0.5rem', color: 'var(--muted)' }} />
              <p>No other templates in your library.</p>
              <button className="soft-button" style={{ marginTop: '1rem' }} onClick={() => setEditing(blankTemplate())}><Plus size={16} /> Create one</button>
            </div>
          )}
        </div>
      </div>
    </div>
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
  
  if (!draft) return null;
  
  const updateTask = (id, patch) => setDraft({ ...draft, tasks: draft.tasks.map((item) => item.task_id === id ? { ...item, ...patch } : item) });
  
  return (
    <div className="panel span-3" style={{ padding: '1.5rem' }}>
      <div className="section-title" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="icon-button" onClick={() => setEditing(null)} title="Back to Routines"><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{template.template_id.startsWith('tpl') ? 'Edit Routine' : 'Create Routine'}</h2>
        </div>
        <div className="completion-row">
          <button className="soft-button" onClick={() => setEditing(null)}>Cancel</button>
          <button className="primary-button" onClick={() => { dispatch({ type: 'SAVE_TEMPLATE', template: draft }); setEditing(null); }}><Save size={16} /> Save Routine</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ marginBottom: '1rem' }}>General Settings</h3>
          <div className="form-grid" style={{ background: 'var(--surface-2)', padding: '1.25rem', borderRadius: '8px' }}>
            <label>Name <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Morning Focus" /></label>
            <label>Category <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option>Normal</option><option>Intensive</option><option>Recovery</option></select></label>
            <label className="span-2">Description <textarea style={{ minHeight: '80px' }} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What is the purpose of this routine?" /></label>
            <label className="check-row span-2" style={{ marginTop: '0.5rem' }}><input type="checkbox" checked={draft.is_rest_day_template} onChange={(e) => setDraft({ ...draft, is_rest_day_template: e.target.checked })} /> <strong>Rest day template</strong> (Prevents streak loss)</label>
          </div>
        </div>
        
        <div style={{ flex: '1.2 1 400px' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Tasks & Habits</h3>
            <div className="completion-row">
              <button className="soft-button" onClick={() => setDraft({ ...draft, tasks: draft.tasks.map((item) => ({ ...item, time: shiftTime(item.time, 30) })) })} title="Shift all tasks by 30 minutes"><TimerReset size={16} /> Shift 30m</button>
              <button className="primary-button" onClick={() => setDraft({ ...draft, tasks: [...draft.tasks, task('New task', '12:00 PM', 25, 20, 'study', '', false, 'medium')] })}><Plus size={16} /> Add Task</button>
            </div>
          </div>
          <div className="editor-tasks" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem', display: 'grid', gap: '0.75rem' }}>
            {draft.tasks.length === 0 && (
              <div className="empty" style={{ minHeight: '120px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                <p>No tasks added yet.</p>
              </div>
            )}
            {draft.tasks.map((item) => (
              <TaskEditCard
                key={item.task_id}
                item={item}
                onChange={(patch) => updateTask(item.task_id, patch)}
                onDelete={() => setDraft({ ...draft, tasks: draft.tasks.filter((taskItem) => taskItem.task_id !== item.task_id) })}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Tracker Preview</h3>
        <div style={{ opacity: 0.8, pointerEvents: 'none' }}>
          <RoutineCalendar template={draft} />
        </div>
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
          <button className="soft-button" onClick={() => onChange({ microsteps: [...item.microsteps, { id: uid('step'), title: 'New subtask', points: 0, done: false }] })}><Plus size={15} /> Subtask</button>
        </div>
        {item.microsteps.map((step) => (
          <div className="subtask-row" key={step.id}>
            <input value={step.title} onChange={(e) => updateMicrostep(step.id, { title: e.target.value })} />
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
  const [cellSize, setCellSize] = useState('accessible'); // 'compact' | 'accessible' (48px) | 'jumbo' (58px)
  const [columnWidthMode, setColumnWidthMode] = useState('wide'); // 'comfortable' (220px) | 'wide' (280px) | 'compact' (170px)
  const [horizonDays, setHorizonDays] = useState(14); // 7 | 14 | 30 | 60
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const days = useMemo(() => {
    return Array.from({ length: horizonDays }, (_, index) => format(subDays(new Date(), index), 'yyyy-MM-dd'));
  }, [horizonDays]);

  if (!template || !template.tasks) return null;

  // Extract unique categories for filtering
  const categoriesList = useMemo(() => {
    const cats = new Set(template.tasks.map(t => t.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [template.tasks]);

  const filteredTasks = useMemo(() => {
    return template.tasks.filter(t => {
      const matchCat = selectedCategory === 'all' || (t.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [template.tasks, selectedCategory, searchQuery]);

  // Calculations for habit statistics banner
  const stats = useMemo(() => {
    let totalCells = 0;
    let completedCells = 0;
    let todayCompletedCount = 0;
    let todayTotalCount = template.tasks.length;
    const todayStr = todayKey();

    days.forEach(date => {
      const rec = state.dailyRecords[date] || { tasks_completed: [] };
      template.tasks.forEach(t => {
        totalCells++;
        const done = rec.tasks_completed.find(item => item.task_id === t.task_id);
        const isComp = done && ['full', 'partial', 'showed_up'].includes(done.completion_type);
        if (isComp) {
          completedCells++;
          if (date === todayStr) todayCompletedCount++;
        }
      });
    });

    const rate = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;
    return { rate, completedCells, totalCells, todayCompletedCount, todayTotalCount };
  }, [days, state.dailyRecords, template.tasks]);

  // Size definitions for checklist touch targets
  const sizeStyles = {
    compact: { btnSize: 42, iconSize: 20, cellPadding: '0.6rem 0.75rem' },
    accessible: { btnSize: 52, iconSize: 24, cellPadding: '0.85rem 1rem' },
    jumbo: { btnSize: 64, iconSize: 30, cellPadding: '1rem 1.25rem' }
  }[cellSize];

  // Column width settings for spreadsheet mode
  const minColWidth = {
    compact: '190px',
    comfortable: '240px',
    wide: '300px',
    giant: '360px'
  }[columnWidthMode];

  const handleToggleTask = (date, taskId, currentIsComplete) => {
    if (currentIsComplete) {
      dispatch({ type: 'UNDO_TASK', date, taskId });
      notify('Task reset for ' + format(new Date(date), 'MMM d'));
    } else {
      dispatch({ type: 'COMPLETE_TASK', date, templateId: template.template_id, taskId, completion_type: 'full' });
      notify('Task logged!');
    }
  };

  const handleMarkAllToday = () => {
    const todayStr = todayKey();
    let markedCount = 0;
    template.tasks.forEach(t => {
      const rec = state.dailyRecords[todayStr] || { tasks_completed: [] };
      const done = rec.tasks_completed.find(item => item.task_id === t.task_id);
      if (!done || !['full', 'partial', 'showed_up'].includes(done.completion_type)) {
        dispatch({ type: 'COMPLETE_TASK', date: todayStr, templateId: template.template_id, taskId: t.task_id, completion_type: 'full' });
        markedCount++;
      }
    });
    if (markedCount > 0) {
      notify(`🎉 All ${markedCount} tasks marked complete for today!`);
    } else {
      notify('Today is already 100% completed!');
    }
  };

  // Helper to generate Excel column letters (A, B, C... Z, AA...)
  const getColLetter = (idx) => {
    let letter = '';
    while (idx >= 0) {
      letter = String.fromCharCode((idx % 26) + 65) + letter;
      idx = Math.floor(idx / 26) - 1;
    }
    return letter;
  };

  return (
    <div className={`habit-tracker-wrapper ${isExpanded ? 'is-fullscreen' : ''}`}>
      {/* Top Banner with Stats & Action */}
      <div className="habit-stats-banner">
        <div className="habit-stats-meta">
          <div className="stats-badge-pill primary-pill">
            <Flame size={18} style={{ color: 'var(--accent)' }} />
            <span><strong>{stats.rate}%</strong> Habit Consistency</span>
          </div>
          <div className="stats-badge-pill">
            <CheckCircle2 size={18} style={{ color: 'var(--good)' }} />
            <span>Today: <strong>{stats.todayCompletedCount}/{stats.todayTotalCount}</strong> Tasks Done</span>
          </div>
        </div>

        <div className="habit-quick-actions">
          <button className="primary-button quick-today-btn" onClick={handleMarkAllToday}>
            <Sparkles size={16} /> Mark Today 100% Done
          </button>
        </div>
      </div>

      {/* Main Controls & Toolbar */}
      <div className="habit-tracker-toolbar">
        <div className="habit-toolbar-left">
          <h3 className="habit-tracker-heading">
            <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
            Routine Habit Spreadsheet
          </h3>
          <span className="badge" style={{ background: 'var(--surface-2)', fontWeight: 600 }}>
            {template.tasks.length} Column Habits
          </span>
        </div>

        <div className="habit-toolbar-right">
          {/* Task Search Input */}
          <div className="spreadsheet-search-box">
            <Search size={14} style={{ color: 'var(--muted)' }} />
            <input 
              placeholder="Search column..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="spreadsheet-search-input"
            />
            {searchQuery && (
              <button className="icon-button" style={{ width: 22, height: 22 }} onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Touch Size Controls */}
          <div className="size-selector-group" title="Target Checkbox Size">
            <span className="control-label"><Sliders size={14} /> Size:</span>
            <button 
              className={`size-btn ${cellSize === 'compact' ? 'active' : ''}`}
              onClick={() => setCellSize('compact')}
            >
              Small
            </button>
            <button 
              className={`size-btn ${cellSize === 'accessible' ? 'active' : ''}`}
              onClick={() => setCellSize('accessible')}
            >
              🎯 Big Accessible
            </button>
            <button 
              className={`size-btn ${cellSize === 'jumbo' ? 'active' : ''}`}
              onClick={() => setCellSize('jumbo')}
            >
              🚀 XL Jumbo
            </button>
          </div>

          {/* Column Width Selector */}
          <div className="size-selector-group" title="Column Width">
            <span className="control-label">Width:</span>
            <button 
              className={`size-btn ${columnWidthMode === 'comfortable' ? 'active' : ''}`}
              onClick={() => setColumnWidthMode('comfortable')}
            >
              Std
            </button>
            <button 
              className={`size-btn ${columnWidthMode === 'wide' ? 'active' : ''}`}
              onClick={() => setColumnWidthMode('wide')}
            >
              Wide Excel
            </button>
          </div>

          {/* Horizon Days Selector */}
          <div className="size-selector-group">
            <span className="control-label">Range:</span>
            {[7, 14, 30, 60].map(n => (
              <button 
                key={n}
                className={`size-btn ${horizonDays === n ? 'active' : ''}`}
                onClick={() => setHorizonDays(n)}
              >
                {n}D
              </button>
            ))}
          </div>

          {/* Expand Fullscreen button */}
          <button 
            className="icon-button soft-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse View' : 'Fullscreen / Expand Tracker'}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Add task button */}
          <button className="primary-button" onClick={() => setAddingTask(true)}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Category filter tabs if tasks have multiple categories */}
      {categoriesList.length > 2 && (
        <div className="habit-category-tabs">
          <span className="control-label" style={{ fontSize: '0.82rem', alignSelf: 'center' }}>
            <Filter size={14} /> Filter Category:
          </span>
          {categoriesList.map(cat => (
            <button
              key={cat}
              className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All Tasks' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Inline Add Task Form */}
      {addingTask && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="row add-habit-row"
        >
          <input 
            id="new-habit-input" 
            placeholder="New Task / Habit Title (e.g. Solve 2 DSA Questions)..." 
            style={{ flex: 1 }}
            autoFocus
          />
          <button className="primary-button" onClick={() => {
            const title = document.getElementById('new-habit-input')?.value;
            if (title) {
              const newTpl = { ...template, tasks: [...template.tasks, task(title, '12:00 PM', 15, 10, template.category?.toLowerCase() === 'recovery' ? 'personal' : 'study', '', false, 'medium')] };
              dispatch({ type: 'SAVE_TEMPLATE', template: newTpl });
              setAddingTask(false);
              notify(`Added "${title}" to your routine!`);
            }
          }}>Save to Routine</button>
          <button className="soft-button danger" onClick={() => setAddingTask(false)}>Cancel</button>
        </motion.div>
      )}

      {/* The Big Accessible Matrix Table */}
      <div className="habit-table-container">
        <table className="habit-grid-table">
          <thead>
            <tr>
              <th className="sticky-col-header">
                <div className="timeline-header-box">
                  <span className="timeline-header-title">Timeline (Date)</span>
                  <span className="timeline-header-sub">{days.length} Days View</span>
                </div>
              </th>
              {filteredTasks.map((t, idx) => {
                // Calculate task consistency rate
                let taskDoneCount = 0;
                days.forEach(d => {
                  const rec = state.dailyRecords[d] || { tasks_completed: [] };
                  const done = rec.tasks_completed.find(item => item.task_id === t.task_id);
                  if (done && ['full', 'partial', 'showed_up'].includes(done.completion_type)) taskDoneCount++;
                });
                const taskPct = Math.round((taskDoneCount / days.length) * 100);

                return (
                  <th key={t.task_id} className="habit-header-cell" style={{ minWidth: minColWidth }}>
                    <div className="habit-header-content">
                      <div className="habit-col-letter-row">
                        <span className="col-letter-badge">{getColLetter(idx)}</span>
                        <span className="badge mini-badge">{t.category || 'general'}</span>
                        {t.duration_minutes && <span className="habit-duration"><Clock size={11} /> {t.duration_minutes}m</span>}
                      </div>
                      <div className="habit-category-bar" style={{ background: categoryColors[t.category] || 'var(--primary)' }} />
                      <div className="habit-header-title-row">
                        <strong className="habit-title-text" title={t.title}>{t.title}</strong>
                      </div>
                      <div className="task-consistency-meter" title={`${taskDoneCount} of ${days.length} days completed (${taskPct}%)`}>
                        <div className="consistency-bar-bg">
                          <div className="consistency-bar-fill" style={{ width: `${taskPct}%` }} />
                        </div>
                        <span className="consistency-text">{taskDoneCount}/{days.length} ({taskPct}% done)</span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {days.map((date, rowIndex) => {
              const record = state.dailyRecords[date] || { tasks_completed: [] };
              const isToday = date === todayKey();
              
              // Count completion for this date
              let dayDoneCount = 0;
              filteredTasks.forEach(t => {
                const done = record.tasks_completed.find(item => item.task_id === t.task_id);
                if (done && ['full', 'partial', 'showed_up'].includes(done.completion_type)) dayDoneCount++;
              });
              const dayPct = filteredTasks.length ? Math.round((dayDoneCount / filteredTasks.length) * 100) : 0;

              return (
                <tr key={date} className={`habit-row ${isToday ? 'is-today' : ''}`}>
                  <td className="sticky-date-cell">
                    <div className="date-cell-box">
                      <span className="row-index-num">#{rowIndex + 1}</span>
                      <div className="date-left">
                        <span className="date-number">{format(new Date(date), 'd')}</span>
                        <div className="date-text-stack">
                          <span className="date-month">{format(new Date(date), 'MMM')}</span>
                          <span className="date-day">{format(new Date(date), 'EEE')}</span>
                        </div>
                      </div>
                      <div className="date-right">
                        {isToday ? (
                          <span className="today-badge">
                            <span className="today-dot" /> TODAY
                          </span>
                        ) : (
                          <span className="row-progress-text">{dayDoneCount}/{filteredTasks.length}</span>
                        )}
                        <div className="row-progress-mini" title={`${dayDoneCount}/${filteredTasks.length} done`}>
                          <div className="row-progress-fill" style={{ width: `${dayPct}%`, background: dayPct === 100 ? 'var(--good)' : 'var(--primary)' }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {filteredTasks.map(t => {
                    const done = record.tasks_completed.find(item => item.task_id === t.task_id);
                    const isComplete = done && ['full', 'partial', 'showed_up'].includes(done.completion_type);
                    const dateFormatted = format(new Date(date), 'MMM d, EEE');

                    return (
                      <td 
                        key={t.task_id} 
                        className="habit-check-cell"
                        style={{ padding: sizeStyles.cellPadding, minWidth: minColWidth }}
                      >
                        <motion.button 
                          type="button"
                          role="checkbox"
                          aria-checked={isComplete}
                          aria-label={`Task ${t.title} for ${dateFormatted}: ${isComplete ? 'Completed' : 'Not completed'}`}
                          whileTap={{ scale: 0.88 }}
                          whileHover={{ scale: 1.08 }}
                          className={`habit-big-check-btn ${cellSize} ${isComplete ? 'is-complete' : ''}`}
                          style={{
                            width: `${sizeStyles.btnSize}px`,
                            height: `${sizeStyles.btnSize}px`,
                          }}
                          onClick={() => handleToggleTask(date, t.task_id, isComplete)}
                          title={`${t.title} (${dateFormatted})\nStatus: ${isComplete ? 'Done ✓ (Click to Undo)' : 'Incomplete (Click to Complete)'}`}
                        >
                          <AnimatePresence mode="wait">
                            {isComplete ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 45 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                className="check-icon-wrapper"
                              >
                                <Check size={sizeStyles.iconSize} strokeWidth={3.2} color="#ffffff" />
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="empty"
                                className="empty-check-indicator"
                              />
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="spreadsheet-footer-row">
              <td className="sticky-date-cell footer-sticky-cell">
                <div className="footer-title-box">
                  <strong>📊 Column Totals</strong>
                  <small>Completion Rate</small>
                </div>
              </td>
              {filteredTasks.map(t => {
                let taskDoneCount = 0;
                days.forEach(d => {
                  const rec = state.dailyRecords[d] || { tasks_completed: [] };
                  const done = rec.tasks_completed.find(item => item.task_id === t.task_id);
                  if (done && ['full', 'partial', 'showed_up'].includes(done.completion_type)) taskDoneCount++;
                });
                const taskPct = Math.round((taskDoneCount / days.length) * 100);
                return (
                  <td key={t.task_id} className="spreadsheet-footer-cell" style={{ minWidth: minColWidth }}>
                    <div className="footer-cell-stat">
                      <strong>{taskDoneCount} / {days.length} Days</strong>
                      <span className="footer-pct-badge">{taskPct}% Total</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
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
        return (
          <button
            key={day}
            title={`${day}: ${completion}% complete`}
            aria-label={`${day}: ${completion}% complete`}
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
  const timeStats = Object.entries(buckets).filter(([, data]) => data.attempts > 0).map(([name, data]) => ({ name, rate: Math.round((data.wins / data.attempts) * 100), attempts: data.attempts }));
  if (!timeStats.length) return { title: 'Best time of day', detail: 'After a few days, this will use your real task history.' };
  const best = timeStats.sort((a, b) => b.rate - a.rate)[0];
  const weak = timeStats.sort((a, b) => a.rate - b.rate)[0];
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
    if (cat && ['full', 'partial', 'showed_up'].includes(done.completion_type)) counts[cat] += 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function progressSummary(state) {
  const records = Object.entries(state.dailyRecords).map(([date, record]) => summarizeRecord(record, getTasksForDate(state, date)));
  const activeRecords = records.filter((record) => record.tasks_completed.length > 0 || record.completion_percentage > 0);
  const completedTasks = activeRecords.flatMap((record) => record.tasks_completed).filter((item) => ['full', 'partial', 'showed_up'].includes(item.completion_type)).length;
  const avgCompletion = activeRecords.length ? Math.round(activeRecords.reduce((sum, record) => sum + (record.completion_percentage || 0), 0) / activeRecords.length) : 0;
  return { days: activeRecords.length, completedTasks, avgCompletion };
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
  download(`steady-backup-${todayKey()}.json`, JSON.stringify(stripScoringState(state), null, 2), 'application/json');
}

function exportCsv(state) {
  const rows = ['date,completion_percentage,was_rest_day'];
  Object.values(state.dailyRecords).forEach((record) => rows.push(`${record.date},${record.completion_percentage},${record.was_rest_day}`));
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
          records: Object.keys(state.dailyRecords).length
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

const bucketStatusLabels = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
};

function normalizeBucketItem(item) {
  const checklist = Array.isArray(item.checklist) ? item.checklist : parseChecklistText(item.notes || '');
  const links = Array.isArray(item.links) ? item.links : [];
  const tags = Array.isArray(item.tags) ? item.tags : parseTags(item.tags || '');
  const done = item.completed || item.status === 'done';
  return {
    ...item,
    status: done ? 'done' : item.status || (checklist.some((step) => step.done) ? 'in_progress' : 'not_started'),
    completed: done,
    progress: Number(item.progress || 0),
    startDate: item.startDate || '',
    deadline: item.deadline || '',
    completedDate: done ? item.completedDate || todayKey() : item.completedDate || '',
    links,
    checklist,
    tags
  };
}

function parseChecklistText(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/^[-*\[\] xX]+/, '').trim())
    .filter(Boolean)
    .map((title) => ({ id: uid('check'), title, done: false }));
}

function parseTags(text) {
  return String(text || '').split(',').map((tag) => tag.trim()).filter(Boolean);
}

function bucketProgress(item) {
  if (item.status === 'done' || item.completed) return 100;
  const checklist = item.checklist || [];
  if (checklist.length) return Math.round((checklist.filter((step) => step.done).length / checklist.length) * 100);
  return Math.max(0, Math.min(100, Number(item.progress || 0)));
}

function RichBucketListView() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('not_started');
  const [startDate, setStartDate] = useState(todayKey());
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const items = state.bucketList.map(normalizeBucketItem);
  const filtered = items.filter((item) => {
    if (filter === 'incomplete') return item.status !== 'done';
    if (Object.keys(bucketStatusLabels).includes(filter)) return item.status === filter;
    if (['high', 'medium', 'low'].includes(filter)) return item.priority === filter;
    if (filter !== 'all') return item.category?.toLowerCase() === filter.toLowerCase() || item.tags?.some((tag) => tag.toLowerCase() === filter.toLowerCase());
    return true;
  });
  const dynamicFilters = Array.from(new Set(items.flatMap((item) => [item.category, ...(item.tags || [])]).filter(Boolean)));

  const addItem = () => {
    if (!title.trim()) return;
    const links = linkUrl.trim() ? [{ id: uid('link'), title: linkTitle.trim() || linkUrl.trim(), url: linkUrl.trim() }] : [];
    dispatch({
      type: 'ADD_BUCKET_ITEM',
      item: {
        id: uid('bucket'),
        title: title.trim(),
        category: category.trim(),
        priority,
        status,
        completed: status === 'done',
        progress: status === 'done' ? 100 : 0,
        startDate,
        deadline,
        completedDate: status === 'done' ? todayKey() : '',
        links,
        checklist: parseChecklistText(checklistText),
        tags: parseTags(tags),
        notes: '',
        created: new Date().toISOString()
      }
    });
    setTitle('');
    setCategory('');
    setPriority('medium');
    setStatus('not_started');
    setStartDate(todayKey());
    setDeadline('');
    setTags('');
    setChecklistText('');
    setLinkTitle('');
    setLinkUrl('');
  };

  return (
    <section className="view-grid bucket-page">
      <div className="panel span-2 bucket-workspace">
        <h2>Bucket List & Projects</h2>
        <div className="bucket-create">
          <label className="bucket-title-field">Name
            <input placeholder="Certification, side project, research idea..." value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>Category
            <input placeholder="Tech, Academic..." value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label>Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(bucketStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>Deadline
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <label className="span-2">Tags
            <input placeholder="certification, side-project, research, urgent" value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <label>Link title
            <input placeholder="Course page" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
          </label>
          <label>URL
            <input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </label>
          <label className="span-2">Checklist
            <textarea placeholder="One sub-task per line: module 1, docs, prerequisite..." value={checklistText} onChange={(e) => setChecklistText(e.target.value)} />
          </label>
          <button className="primary-button bucket-add" onClick={addItem}><Plus size={16} /> Add</button>
        </div>

        <div className="filters bucket-filters">
          {[
            ['all', 'All'],
            ['incomplete', 'Incomplete'],
            ['not_started', 'Not Started'],
            ['in_progress', 'In Progress'],
            ['blocked', 'Blocked'],
            ['done', 'Done'],
            ['high', 'High']
          ].map(([id, label]) => (
            <button key={id} className={`soft-button ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>
          ))}
          {dynamicFilters.map((name) => (
            <button key={name} className={`soft-button ${filter === name ? 'active' : ''}`} onClick={() => setFilter(name)}>{name}</button>
          ))}
        </div>

        <div className="bucket-list">
          {filtered.length === 0 ? <p className="muted">No items found.</p> : filtered.map((item) => <BucketItemCard key={item.id} item={item} />)}
        </div>
      </div>
    </section>
  );
}

function BucketItemCard({ item }) {
  const { dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [checkTitle, setCheckTitle] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const progress = bucketProgress(item);
  const doneCount = (item.checklist || []).filter((step) => step.done).length;

  const updateStatus = (nextStatus) => {
    dispatch({
      type: 'UPDATE_BUCKET_ITEM',
      id: item.id,
      patch: {
        status: nextStatus,
        completed: nextStatus === 'done',
        completedDate: nextStatus === 'done' ? item.completedDate || todayKey() : ''
      }
    });
  };

  const addCheck = () => {
    if (!checkTitle.trim()) return;
    dispatch({ type: 'ADD_BUCKET_CHECK', id: item.id, title: checkTitle.trim() });
    setCheckTitle('');
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    dispatch({ type: 'ADD_BUCKET_LINK', id: item.id, title: linkTitle.trim() || linkUrl.trim(), url: linkUrl.trim() });
    setLinkTitle('');
    setLinkUrl('');
  };

  return (
    <article className={`bucket-card status-${item.status}`}>
      <div className="bucket-card-head">
        <button className="icon-button" title="Mark done" onClick={() => dispatch({ type: 'TOGGLE_BUCKET_ITEM', id: item.id })}>
          {item.completed ? <Check size={18} /> : <div className="empty-check" />}
        </button>
        <button className="bucket-title-button" onClick={() => setOpen(!open)}>
          <strong>{item.title}</strong>
          <small>{item.category || 'Uncategorized'} · {item.priority} priority</small>
        </button>
        <span className={`status-badge status-${item.status}`}>{bucketStatusLabels[item.status]}</span>
        <button className="icon-button" title={open ? 'Collapse' : 'Expand'} onClick={() => setOpen(!open)}><ChevronDown size={16} /></button>
        <button className="icon-button danger" title="Delete" onClick={() => dispatch({ type: 'DELETE_BUCKET_ITEM', id: item.id })}><Trash2 size={16} /></button>
      </div>

      <div className="bucket-summary-grid">
        <div className="bucket-block">
          <small>Progress</small>
          <strong>{progress}%</strong>
          <div className="meter bucket-meter"><span style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="bucket-block">
          <small>Dates</small>
          <span>{item.startDate || 'No start'} | {item.deadline || 'No deadline'} | {item.completedDate || 'Not completed'}</span>
        </div>
        <div className="bucket-block">
          <small>Checklist</small>
          <span>{doneCount}/{item.checklist?.length || 0} done</span>
        </div>
        <div className="bucket-block">
          <small>Links</small>
          <span>{item.links?.length || 0} saved</span>
        </div>
      </div>

      {open && (
        <div className="bucket-details">
          <div className="bucket-detail-section">
            <h3>Status</h3>
            <select value={item.status} onChange={(e) => updateStatus(e.target.value)}>
              {Object.entries(bucketStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="bucket-detail-section">
            <h3>Progress</h3>
            <input type="range" min="0" max="100" value={item.progress || progress} onChange={(e) => dispatch({ type: 'UPDATE_BUCKET_ITEM', id: item.id, patch: { progress: Number(e.target.value) } })} />
          </div>

          <div className="bucket-detail-section">
            <h3>Dates</h3>
            <div className="bucket-date-grid">
              <label>Start<input type="date" value={item.startDate || ''} onChange={(e) => dispatch({ type: 'UPDATE_BUCKET_ITEM', id: item.id, patch: { startDate: e.target.value } })} /></label>
              <label>Deadline<input type="date" value={item.deadline || ''} onChange={(e) => dispatch({ type: 'UPDATE_BUCKET_ITEM', id: item.id, patch: { deadline: e.target.value } })} /></label>
              <label>Completed<input type="date" value={item.completedDate || ''} onChange={(e) => dispatch({ type: 'UPDATE_BUCKET_ITEM', id: item.id, patch: { completedDate: e.target.value } })} /></label>
            </div>
          </div>

          <div className="bucket-detail-section">
            <h3>Tags</h3>
            <input value={(item.tags || []).join(', ')} onChange={(e) => dispatch({ type: 'UPDATE_BUCKET_ITEM', id: item.id, patch: { tags: parseTags(e.target.value) } })} />
            <div className="bucket-tags">{(item.tags || []).map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div>
          </div>

          <div className="bucket-detail-section">
            <h3>Checklist</h3>
            <div className="bucket-checklist">
              {(item.checklist || []).map((step) => (
                <label className="check-row" key={step.id}>
                  <input type="checkbox" checked={step.done} onChange={() => dispatch({ type: 'TOGGLE_BUCKET_CHECK', id: item.id, stepId: step.id })} />
                  <span>{step.title}</span>
                  <button type="button" className="icon-button danger" onClick={() => dispatch({ type: 'DELETE_BUCKET_CHECK', id: item.id, stepId: step.id })}><Trash2 size={14} /></button>
                </label>
              ))}
            </div>
            <div className="bucket-inline-add">
              <input placeholder="New sub-task" value={checkTitle} onChange={(e) => setCheckTitle(e.target.value)} />
              <button className="soft-button" onClick={addCheck}><Plus size={15} /> Add</button>
            </div>
          </div>

          <div className="bucket-detail-section">
            <h3>Links</h3>
            <div className="bucket-links">
              {(item.links || []).map((link) => (
                <div className="bucket-link-row" key={link.id}>
                  <a href={link.url} target="_blank" rel="noreferrer">{link.title}</a>
                  <button className="icon-button danger" onClick={() => dispatch({ type: 'DELETE_BUCKET_LINK', id: item.id, linkId: link.id })}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="bucket-inline-add bucket-link-add">
              <input placeholder="Title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
              <input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <button className="soft-button" onClick={addLink}><Plus size={15} /> Add</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function LegacyJournalView() {
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

const journalTags = ['work-stress', 'comparison', 'freeze-moment', 'overwhelm', 'small-win', 'accepting-care', 'academic', 'family', 'friends'];
const journalTypeLabels = { diary: 'Diary', thoughts: 'Thoughts', todo: 'To-Do' };

function normalizeResourceKind(kind) {
  return examResourceKinds.includes(kind) ? kind : 'Website';
}

function normalizeResourceUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:|file:)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isOpenableResource(resource) {
  return Boolean(resource.url) && linkResourceKinds.has(resource.kind) && /^(https?:|mailto:|tel:|file:)/i.test(resource.url);
}

function normalizeExamPrep(exam = {}) {
  const goals = Array.isArray(exam.weeklyGoals) && exam.weeklyGoals.length
    ? exam.weeklyGoals
    : defaultWeeklyGoals.map((title) => ({ id: uid('goal'), title, done: false }));
  return {
    id: exam.id || uid('exam'),
    name: exam.name || 'New Exam',
    type: examTypes.includes(exam.type) ? exam.type : 'Placement',
    targetYear: exam.targetYear || String(new Date().getFullYear()),
    attemptDate: exam.attemptDate || todayKey(),
    registrationDeadline: exam.registrationDeadline || '',
    priority: examPriorities.includes(exam.priority) ? exam.priority : 'Medium',
    status: examStatuses.includes(exam.status) ? exam.status : 'Not Started',
    progress: Math.max(0, Math.min(100, Number(exam.progress || 0))),
    pattern: {
      rounds: exam.pattern?.rounds || '',
      duration: exam.pattern?.duration || '',
      syllabus: exam.pattern?.syllabus || '',
      difficulty: exam.pattern?.difficulty || '',
      negativeMarking: exam.pattern?.negativeMarking || '',
      cutoffEstimate: exam.pattern?.cutoffEstimate || ''
    },
    resources: Array.isArray(exam.resources) ? exam.resources.map((resource) => ({
      id: resource.id || uid('resource'),
      kind: normalizeResourceKind(resource.kind),
      label: resource.label || resource.url || 'Resource',
      url: normalizeResourceUrl(resource.url)
    })) : [],
    weeklyGoals: goals.map((goal) => ({ id: goal.id || uid('goal'), title: goal.title || '', done: Boolean(goal.done) })).filter((goal) => goal.title),
    notes: exam.notes || ''
  };
}

function createExamDraft() {
  return normalizeExamPrep({
    id: uid('exam'),
    name: '',
    attemptDate: addDays(new Date(), 60).toISOString().slice(0, 10),
    registrationDeadline: addDays(new Date(), 30).toISOString().slice(0, 10)
  });
}

function examCountdown(date) {
  if (!date) return 'No date set';
  const days = differenceInCalendarDays(new Date(`${date}T00:00:00`), new Date());
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days left`;
}

function examProgress(exam) {
  if (exam.status === 'Completed') return 100;
  return Math.max(0, Math.min(100, Number(exam.progress || 0)));
}

function ExamPreparationTracker() {
  const { state, dispatch, notify } = useApp();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const exams = (state.examPrep || []).map(normalizeExamPrep);
  const selected = exams.find((exam) => exam.id === selectedId);
  const filtered = exams
    .filter((exam) => typeFilter === 'All' || exam.type === typeFilter)
    .filter((exam) => {
      const text = [exam.name, exam.type, exam.status, exam.targetYear].join(' ').toLowerCase();
      return text.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => new Date(a.attemptDate || '2999-12-31') - new Date(b.attemptDate || '2999-12-31'));

  const saveDraft = () => {
    const exam = normalizeExamPrep(draft);
    if (!exam.name.trim()) return;
    dispatch({ type: 'ADD_EXAM_PREP', exam });
    setDraft(null);
    setSelectedId(exam.id);
    notify('Exam added to your preparation tracker');
  };

  return (
    <section className="exam-page">
      <div className="exam-hero panel">
        <div>
          <p className="eyebrow">Placement and final year prep</p>
          <h2>Exam Preparation Tracker</h2>
          <p>Keep every target exam, deadline, resource, and weekly promise in one motivating dashboard.</p>
        </div>
        <div className="exam-hero-stats">
          <span><strong>{exams.length}</strong> exams</span>
          <span><strong>{exams.filter((exam) => exam.status === 'Completed').length}</strong> completed</span>
          <span><strong>{exams.filter((exam) => exam.priority === 'High').length}</strong> high priority</span>
        </div>
      </div>

      <div className="exam-toolbar">
        <label className="exam-search"><Search size={17} /><input placeholder="Search exams, status, year..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by exam type">
          <option>All</option>
          {examTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <button className="primary-button" onClick={() => setDraft(createExamDraft())}><Plus size={17} /> Add Exam</button>
      </div>

      {filtered.length ? (
        <div className="exam-grid">
          {filtered.map((exam) => <ExamCard key={exam.id} exam={exam} onOpen={() => setSelectedId(exam.id)} />)}
        </div>
      ) : (
        <div className="panel exam-empty">
          <Target size={38} />
          <h2>{exams.length ? 'No exams match your filters' : 'No exams yet'}</h2>
          <p>{exams.length ? 'Try another search or exam type.' : 'Add your first placement, government, higher studies, internship, or coding contest target.'}</p>
          <button className="primary-button" onClick={() => setDraft(createExamDraft())}><Plus size={17} /> Add Exam</button>
        </div>
      )}

      <AnimatePresence>
        {selected && <ExamDetailModal exam={selected} onClose={() => setSelectedId('')} />}
        {draft && <ExamAddModal draft={draft} setDraft={setDraft} onSave={saveDraft} onClose={() => setDraft(null)} />}
      </AnimatePresence>
    </section>
  );
}

function ExamCard({ exam, onOpen }) {
  const progress = examProgress(exam);
  const priority = examPriorityMeta[exam.priority];
  const visibleResources = (exam.resources || []).filter((item) => item.label || item.url).slice(0, 3);
  const hiddenResourceCount = Math.max(0, (exam.resources || []).length - visibleResources.length);
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <motion.article className="exam-card" onClick={onOpen} onKeyDown={handleKeyDown} tabIndex={0} aria-label={`Open ${exam.name} details`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <div className="exam-card-top">
        <span className="pill">{exam.type}</span>
        <span className={`exam-priority ${exam.priority.toLowerCase()}`}>{priority.mark} {priority.label}</span>
      </div>
      <h3>{exam.name}</h3>
      <div className="exam-meta-grid">
        <span><small>Target Year</small>{exam.targetYear}</span>
        <span><small>Attempt</small>{exam.attemptDate ? format(new Date(`${exam.attemptDate}T00:00:00`), 'MMM d, yyyy') : 'Not set'}</span>
        <span><small>Register By</small>{exam.registrationDeadline ? format(new Date(`${exam.registrationDeadline}T00:00:00`), 'MMM d, yyyy') : 'Not set'}</span>
        <span><small>Countdown</small>{examCountdown(exam.attemptDate)}</span>
      </div>
      <div className="exam-card-footer">
        <span className={`exam-status ${exam.status.toLowerCase().replaceAll(' ', '-')}`}>{exam.status}</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="exam-card-resources" aria-label={`${exam.name} resources`}>
        {visibleResources.length ? visibleResources.map((item) => (
          isOpenableResource(item) ? (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
              <LinkIcon size={14} />
              <span>{item.label}</span>
              <small>{item.kind}</small>
            </a>
          ) : (
            <span className="exam-card-resource-note" key={item.id} onClick={(event) => event.stopPropagation()}>
              {item.kind === 'PDF' ? <FileText size={14} /> : <LinkIcon size={14} />}
              <span>{item.label}</span>
              <small>{item.kind}</small>
            </span>
          )
        )) : (
          <span className="exam-card-resource-empty">No resources saved</span>
        )}
        {hiddenResourceCount > 0 && <span className="exam-card-resource-more">+{hiddenResourceCount} more</span>}
      </div>
    </motion.article>
  );
}

function ExamAddModal({ draft, setDraft, onSave, onClose }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="quick-modal exam-modal" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 12 }}>
        <div className="exam-modal-head">
          <div>
            <p className="eyebrow">New target</p>
            <h2>Add Exam</h2>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="exam-form-grid">
          <label>Exam Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="TCS NQT, GATE, CAT, Codeforces Round..." /></label>
          <label>Type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{examTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Target Year<input value={draft.targetYear} onChange={(event) => setDraft({ ...draft, targetYear: event.target.value })} /></label>
          <label>Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>{examPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          <label>Attempt Date<input type="date" value={draft.attemptDate} onChange={(event) => setDraft({ ...draft, attemptDate: event.target.value })} /></label>
          <label>Registration Deadline<input type="date" value={draft.registrationDeadline} onChange={(event) => setDraft({ ...draft, registrationDeadline: event.target.value })} /></label>
        </div>
        <div className="completion-row">
          <button className="primary-button" onClick={onSave}><Save size={16} /> Save Exam</button>
          <button className="soft-button" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExamDetailModal({ exam, onClose }) {
  const { dispatch, notify } = useApp();
  const [resource, setResource] = useState({ kind: 'Website', label: '', url: '' });
  const [goal, setGoal] = useState('');
  const update = (patch) => dispatch({ type: 'UPDATE_EXAM_PREP', id: exam.id, patch });
  const updatePattern = (field, value) => update({ pattern: { ...exam.pattern, [field]: value } });
  const addResource = () => {
    if (!resource.label.trim() && !resource.url.trim()) return;
    const nextResource = {
      kind: normalizeResourceKind(resource.kind),
      label: resource.label.trim() || resource.url.trim() || 'Resource',
      url: normalizeResourceUrl(resource.url)
    };
    dispatch({ type: 'ADD_EXAM_RESOURCE', id: exam.id, ...nextResource });
    setResource({ kind: 'Website', label: '', url: '' });
    notify('Resource saved');
  };
  const addGoal = () => {
    if (!goal.trim()) return;
    dispatch({ type: 'ADD_EXAM_GOAL', id: exam.id, title: goal.trim() });
    setGoal('');
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="quick-modal exam-detail-modal" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 12 }}>
        <div className="exam-modal-head">
          <div>
            <p className="eyebrow">{exam.type} • {examCountdown(exam.attemptDate)}</p>
            <h2>{exam.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="exam-detail-layout">
          <div className="exam-detail-main">
            <section className="exam-detail-section">
              <div className="section-title"><h2>Exam Pattern</h2></div>
              <div className="exam-form-grid">
                <label>Rounds<input value={exam.pattern.rounds} onChange={(event) => updatePattern('rounds', event.target.value)} placeholder="Aptitude, coding, interview..." /></label>
                <label>Duration<input value={exam.pattern.duration} onChange={(event) => updatePattern('duration', event.target.value)} placeholder="180 minutes" /></label>
                <label>Difficulty<input value={exam.pattern.difficulty} onChange={(event) => updatePattern('difficulty', event.target.value)} placeholder="Moderate to hard" /></label>
                <label>Negative Marking<input value={exam.pattern.negativeMarking} onChange={(event) => updatePattern('negativeMarking', event.target.value)} placeholder="Yes / No / section wise" /></label>
                <label>Cutoff Estimate<input value={exam.pattern.cutoffEstimate} onChange={(event) => updatePattern('cutoffEstimate', event.target.value)} placeholder="Expected safe score" /></label>
                <label className="span-2">Syllabus<textarea value={exam.pattern.syllabus} onChange={(event) => updatePattern('syllabus', event.target.value)} placeholder="Quant, reasoning, OS, DBMS, DSA..." /></label>
              </div>
            </section>

            <section className="exam-detail-section">
              <div className="section-title"><h2>Resources</h2></div>
              <div className="exam-resource-add">
                <select value={resource.kind} onChange={(event) => setResource({ ...resource, kind: event.target.value })}>
                  {examResourceKinds.map((kind) => <option key={kind}>{kind}</option>)}
                </select>
                <input placeholder="Label, like Official website" value={resource.label} onChange={(event) => setResource({ ...resource, label: event.target.value })} />
                <input type="url" placeholder="https://example.com or file note" value={resource.url} onChange={(event) => setResource({ ...resource, url: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') addResource(); }} />
                <button className="soft-button" onClick={addResource}><Save size={16} /> Save Resource</button>
              </div>
              <div className="exam-resource-list">
                {exam.resources.length ? exam.resources.map((item) => (
                  <div className="exam-resource" key={item.id}>
                    {item.kind === 'PDF' ? <FileText size={16} /> : <LinkIcon size={16} />}
                    <span><strong>{item.kind}</strong>{item.label}</span>
                    {isOpenableResource(item) ? <a href={item.url} target="_blank" rel="noreferrer">Open</a> : <small className="muted">{item.url}</small>}
                    <button className="icon-button danger" onClick={() => dispatch({ type: 'DELETE_EXAM_RESOURCE', id: exam.id, resourceId: item.id })}><Trash2 size={14} /></button>
                  </div>
                )) : <p className="muted">No resources saved yet.</p>}
              </div>
            </section>
          </div>

          <aside className="exam-detail-side">
            <section className="exam-detail-section">
              <div className="section-title"><h2>Status</h2></div>
              <label>Preparation Status<select value={exam.status} onChange={(event) => update({ status: event.target.value, progress: event.target.value === 'Completed' ? 100 : exam.progress })}>{examStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Overall Progress<input type="range" min="0" max="100" value={examProgress(exam)} onChange={(event) => update({ progress: Number(event.target.value), status: Number(event.target.value) === 100 ? 'Completed' : exam.status })} /></label>
              <div className="exam-progress-big"><strong>{examProgress(exam)}%</strong><div className="progress-track"><span style={{ width: `${examProgress(exam)}%` }} /></div></div>
              <button className="soft-button" onClick={() => { update({ status: 'Completed', progress: 100 }); notify('Exam marked completed'); }}><Check size={16} /> Mark Completed</button>
            </section>

            <section className="exam-detail-section">
              <div className="section-title"><h2>Weekly Goals</h2></div>
              <div className="exam-goals">
                {exam.weeklyGoals.map((item) => (
                  <label className="exam-goal" key={item.id}>
                    <input type="checkbox" checked={item.done} onChange={() => dispatch({ type: 'TOGGLE_EXAM_GOAL', id: exam.id, goalId: item.id })} />
                    <span>{item.title}</span>
                    <button className="icon-button danger" type="button" onClick={() => dispatch({ type: 'DELETE_EXAM_GOAL', id: exam.id, goalId: item.id })}><X size={13} /></button>
                  </label>
                ))}
              </div>
              <div className="exam-goal-add">
                <input placeholder="Add weekly goal" value={goal} onChange={(event) => setGoal(event.target.value)} />
                <button className="soft-button" onClick={addGoal}><Plus size={15} /></button>
              </div>
            </section>

            <section className="exam-detail-section">
              <div className="section-title"><h2>Why It Matters</h2></div>
              <textarea value={exam.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="Write the personal reason this exam matters to you." />
            </section>
            <button className="soft-button danger" onClick={() => { dispatch({ type: 'DELETE_EXAM_PREP', id: exam.id }); onClose(); }}><Trash2 size={16} /> Delete Exam</button>
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
}

function normalizeJournalEntry(entry) {
  if (entry.type === 'todo') {
    const tasks = (entry.tasks || []).map((taskItem, index) => ({
      id: taskItem.id || uid('todo'),
      number: index + 1,
      text: taskItem.text || '',
      completed: Boolean(taskItem.completed)
    }));
    return { ...entry, title: entry.title || '', tasks, timestamp: entry.timestamp || entry.date || new Date().toISOString(), processed: Boolean(entry.processed), archived: Boolean(entry.archived) };
  }
  return {
    id: entry.id || uid('journal'),
    type: entry.type === 'thoughts' ? 'thoughts' : 'diary',
    title: entry.title || '',
    subject: entry.subject || entry.linkedTaskName || '',
    content: entry.content || '',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    timestamp: entry.timestamp || entry.date || new Date().toISOString(),
    followUps: Array.isArray(entry.followUps) ? entry.followUps : [],
    processed: Boolean(entry.processed),
    archived: Boolean(entry.archived)
  };
}

function journalStamp(date = new Date()) {
  return format(new Date(date), 'EEE, MMM d, h:mm a');
}

function JournalView() {
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState('diary');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [todoTasks, setTodoTasks] = useState([{ id: uid('drafttodo'), text: '', completed: false }]);
  const [filter, setFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('time');
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [lastEntryId, setLastEntryId] = useState('');

  useEffect(() => {
     const handler = () => document.getElementById('journal-content-input')?.focus();
     window.addEventListener('open-journal', handler);
     return () => window.removeEventListener('open-journal', handler);
  }, []);

  useEffect(() => {
    if (!lastEntryId) return;
    document.getElementById(`journal-entry-${lastEntryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lastEntryId, state.journalEntries.length]);

  const entries = state.journalEntries.map(normalizeJournalEntry);
  const filteredEntries = entries
    .filter((entry) => showArchived ? entry.archived : !entry.archived)
    .filter((entry) => filter === 'all' || entry.type === filter)
    .filter((entry) => journalMatchesSearch(entry, search))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const groupedEntries = groupJournalEntries(filteredEntries, groupBy);

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setContent('');
    setSelectedTags([]);
    setTodoTasks([{ id: uid('drafttodo'), text: '', completed: false }]);
  };

  const saveEntry = () => {
    const id = uid('journal');
    if (mode === 'todo') {
      const tasks = todoTasks
        .filter((taskItem) => taskItem.text.trim())
        .map((taskItem, index) => ({ id: uid('todo'), number: index + 1, text: taskItem.text.trim(), completed: Boolean(taskItem.completed) }));
      if (!title.trim() && !tasks.length) return;
      dispatch({ type: 'ADD_JOURNAL_ENTRY', entry: { id, type: 'todo', title: title.trim(), tasks, timestamp: new Date().toISOString(), processed: false, archived: false } });
    } else {
      if (!content.trim()) return;
      dispatch({
        type: 'ADD_JOURNAL_ENTRY',
        entry: {
          id,
          type: mode,
          title: title.trim(),
          subject: subject.trim(),
          content: content.trim(),
          tags: selectedTags,
          timestamp: new Date().toISOString(),
          followUps: [],
          processed: false,
          archived: false
        }
      });
    }
    setLastEntryId(id);
    resetForm();
  };

  return (
    <section className="view-grid journal-page">
      <div className="panel span-2 journal-workspace">
        <h2>Mental Peace Journal</h2>
        <div className="journal-composer">
          <div className="journal-tabs">
            {['diary', 'thoughts', 'todo'].map((type) => (
              <button key={type} className={mode === type ? 'active' : ''} onClick={() => setMode(type)}>{journalTypeLabels[type]}</button>
            ))}
          </div>

          {mode !== 'todo' ? (
            <div className={`journal-entry-form ${mode}`}>
              <div className="journal-form-grid">
                <input placeholder={mode === 'diary' ? 'Group related entries...' : 'Quick title...'} value={title} onChange={(e) => setTitle(e.target.value)} />
                <input placeholder={mode === 'diary' ? 'Category or topic...' : 'Subject...'} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <textarea
                id="journal-content-input"
                className={mode === 'diary' ? 'journal-textarea-large' : 'journal-textarea-medium'}
                placeholder={mode === 'diary' ? 'Write your diary entry...' : 'Capture your thought...'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <JournalTagPicker selected={selectedTags} onChange={setSelectedTags} />
              <div className="journal-save-row">
                <small>{journalStamp()}</small>
                <button className="primary-button" onClick={saveEntry}><Save size={16} /> Save</button>
              </div>
            </div>
          ) : (
            <div className="journal-todo-box">
              <input placeholder="To-do list name..." value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="journal-todo-draft">
                {todoTasks.map((taskItem, index) => (
                  <div className="journal-todo-line" key={taskItem.id}>
                    <span>{index + 1}.</span>
                    <input type="checkbox" checked={taskItem.completed} onChange={() => setTodoTasks((tasks) => tasks.map((item) => item.id === taskItem.id ? { ...item, completed: !item.completed } : item))} />
                    <input placeholder="Task" value={taskItem.text} onChange={(e) => setTodoTasks((tasks) => tasks.map((item) => item.id === taskItem.id ? { ...item, text: e.target.value } : item))} />
                    <button className="icon-button danger" onClick={() => setTodoTasks((tasks) => {
                      const next = tasks.filter((item) => item.id !== taskItem.id);
                      return next.length ? next : [{ id: uid('drafttodo'), text: '', completed: false }];
                    })}><X size={15} /></button>
                  </div>
                ))}
              </div>
              <button className="soft-button" onClick={() => setTodoTasks((tasks) => [...tasks, { id: uid('drafttodo'), text: '', completed: false }])}><Plus size={16} /> Add task</button>
              <div className="journal-save-row">
                <small>{journalStamp()}</small>
                <button className="primary-button" onClick={saveEntry}><Save size={16} /> Save</button>
              </div>
            </div>
          )}
        </div>

        <div className="journal-filterbar">
          <div className="journal-filter-buttons">
            <span>Show:</span>
            {[
              ['all', 'All'],
              ['diary', 'Diary'],
              ['thoughts', 'Thoughts'],
              ['todo', 'To-Do']
            ].map(([id, label]) => <button key={id} className={`soft-button ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>)}
          </div>
          <label>Group by:
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="time">Time</option>
              <option value="title">Title</option>
              <option value="subject">Subject</option>
            </select>
          </label>
          <button className="soft-button" onClick={() => setShowArchived(!showArchived)}>{showArchived ? 'Hide Archived' : 'View Archived'}</button>
          <label className="journal-search"><Search size={16} /><input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        </div>

        <div className="journal-entry-list">
          {groupedEntries.length === 0 ? <p className="muted">No entries yet.</p> : groupedEntries.map((group) => (
            <JournalGroup key={group.key} group={group} groupBy={groupBy} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JournalTagPicker({ selected, onChange }) {
  return (
    <div className="journal-tags">
      {journalTags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button key={tag} className={`tag-button ${active ? 'active' : ''}`} onClick={() => onChange(active ? selected.filter((item) => item !== tag) : [...selected, tag])}>
            #{tag}
          </button>
        );
      })}
    </div>
  );
}

function journalMatchesSearch(entry, term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    entry.title,
    entry.subject,
    entry.content,
    ...(entry.tags || []),
    ...(entry.tasks || []).map((taskItem) => taskItem.text)
  ].join(' ').toLowerCase();
  return haystack.includes(needle);
}

function groupJournalEntries(entries, groupBy) {
  if (groupBy === 'time') return entries.map((entry) => ({ key: entry.id, label: '', entries: [entry], expanded: true }));
  const groups = new Map();
  entries.forEach((entry) => {
    const label = (groupBy === 'title' ? entry.title : entry.subject) || 'Untitled';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(entry);
  });
  return [...groups.entries()].map(([label, items]) => ({ key: label, label: `${label} (${items.length})`, entries: items }));
}

function JournalGroup({ group, groupBy }) {
  const [open, setOpen] = useState(true);
  if (groupBy === 'time') return group.entries.map((entry) => <JournalEntryCard key={entry.id} entry={entry} />);
  return (
    <div className="journal-group">
      <button className="journal-group-head" onClick={() => setOpen(!open)}>{group.label}<ChevronDown size={16} /></button>
      {open && group.entries.map((entry) => <JournalEntryCard key={entry.id} entry={entry} />)}
    </div>
  );
}

function JournalEntryCard({ entry }) {
  const { dispatch } = useApp();
  const [followOpen, setFollowOpen] = useState(false);
  const [followText, setFollowText] = useState('');
  if (entry.type === 'todo') return <JournalTodoCard entry={entry} />;
  const saveFollowUp = () => {
    if (!followText.trim()) return;
    dispatch({ type: 'ADD_JOURNAL_FOLLOWUP', id: entry.id, text: followText.trim() });
    setFollowText('');
  };
  return (
    <article id={`journal-entry-${entry.id}`} className={`journal-entry-card ${entry.type}`}>
      <div className="journal-card-top">
        <strong>{journalTypeLabels[entry.type]}</strong>
        <div className="journal-actions">
          {entry.processed && <span className="processed-badge">Processed</span>}
          <button className="icon-button" title="Archive" onClick={() => dispatch({ type: 'UPDATE_JOURNAL_ENTRY', id: entry.id, patch: { archived: !entry.archived } })}><Archive size={15} /></button>
          <button className="icon-button danger" title="Delete" onClick={() => dispatch({ type: 'DELETE_JOURNAL_ENTRY', id: entry.id })}><Trash2 size={15} /></button>
        </div>
      </div>
      <small>{journalStamp(entry.timestamp)}</small>
      <div className="journal-meta">
        <span>Title: {entry.title || 'Untitled'}</span>
        <span>Subject: {entry.subject || 'None'}</span>
      </div>
      <p className="journal-content">{entry.content}</p>
      <div className="journal-card-tags">{(entry.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
      <button className="journal-follow-toggle" onClick={() => setFollowOpen(!followOpen)}>Follow-up <ChevronDown size={15} /></button>
      {followOpen && (
        <div className="journal-followups">
          {(entry.followUps || []).map((item, index) => <p key={`${item.timestamp}-${index}`}><em>{journalStamp(item.timestamp)}: {item.text}</em></p>)}
          <textarea placeholder="What helped? Update on this..." value={followText} onChange={(e) => setFollowText(e.target.value)} />
          <button className="soft-button" onClick={saveFollowUp}><Save size={15} /> Save Follow-up</button>
        </div>
      )}
      <button className="soft-button" onClick={() => dispatch({ type: 'UPDATE_JOURNAL_ENTRY', id: entry.id, patch: { processed: true } })}><Check size={16} /> {entry.processed ? 'Processed' : 'Mark Processed'}</button>
    </article>
  );
}

function JournalTodoCard({ entry }) {
  const { dispatch } = useApp();
  const completed = (entry.tasks || []).filter((taskItem) => taskItem.completed).length;
  return (
    <article id={`journal-entry-${entry.id}`} className="journal-entry-card todo-card">
      <div className="journal-card-top">
        <strong>To-Do List</strong>
        <div className="journal-actions">
          {entry.processed && <span className="processed-badge">Processed</span>}
          <button className="icon-button" title="Archive" onClick={() => dispatch({ type: 'UPDATE_JOURNAL_ENTRY', id: entry.id, patch: { archived: !entry.archived } })}><Archive size={15} /></button>
          <button className="icon-button danger" title="Delete" onClick={() => dispatch({ type: 'DELETE_JOURNAL_ENTRY', id: entry.id })}><Trash2 size={15} /></button>
        </div>
      </div>
      <small>{journalStamp(entry.timestamp)}</small>
      <div className="journal-meta"><span>Title: {entry.title || 'Untitled'}</span></div>
      <div className="journal-todo-list">
        {(entry.tasks || []).map((taskItem, index) => (
          <div className="journal-todo-line saved" key={taskItem.id}>
            <span>{index + 1}.</span>
            <input type="checkbox" checked={taskItem.completed} onChange={() => dispatch({ type: 'TOGGLE_JOURNAL_TODO', id: entry.id, taskId: taskItem.id })} />
            <input className={taskItem.completed ? 'done' : ''} value={taskItem.text} onChange={(e) => dispatch({ type: 'UPDATE_JOURNAL_TODO', id: entry.id, taskId: taskItem.id, text: e.target.value })} />
            <button className="icon-button danger" onClick={() => dispatch({ type: 'DELETE_JOURNAL_TODO', id: entry.id, taskId: taskItem.id })}><X size={15} /></button>
          </div>
        ))}
      </div>
      <button className="soft-button" onClick={() => dispatch({ type: 'ADD_JOURNAL_TODO', id: entry.id })}><Plus size={15} /> Add task</button>
      <small>{completed} of {entry.tasks?.length || 0} completed</small>
      <button className="soft-button" onClick={() => dispatch({ type: 'UPDATE_JOURNAL_ENTRY', id: entry.id, patch: { processed: true } })}><Check size={16} /> {entry.processed ? 'Processed' : 'Mark Processed'}</button>
    </article>
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
