/* global process */
// Prints App Store screenshot demo data as JSON for the simulator's native
// storage (see scripts/app-store-screenshots.sh). Nothing here ships in the
// app: it is written straight into a simulator's UserDefaults.
const now = Date.now();
const iso = (hoursAgo) => new Date(now - hoursAgo * 3_600_000).toISOString();
const ash = { small: 3, normal: 5, heavy: 10, boss: 20 };
const quadrant = (u, i) => (u === 'high' ? (i === 'high' ? 'doNow' : 'quickBurn') : (i === 'high' ? 'schedule' : 'backlog'));

const task = (id, title, nextAction, difficulty, urgency, importance, createdHoursAgo, burnedHoursAgo) => ({
  id,
  title,
  body: '',
  nextAction,
  category: 'task',
  priority: urgency === 'high' ? 'high' : importance === 'high' ? 'medium' : 'low',
  stage: burnedHoursAgo === undefined ? 'spark' : 'flame',
  difficulty,
  urgency,
  importance,
  quadrant: quadrant(urgency, importance),
  ashPoints: ash[difficulty],
  burned: burnedHoursAgo !== undefined,
  ...(burnedHoursAgo !== undefined ? { burnedAt: iso(burnedHoursAgo) } : {}),
  isBurning: false,
  completed: burnedHoursAgo !== undefined,
  createdAt: iso(createdHoursAgo),
  updatedAt: iso(burnedHoursAgo ?? createdHoursAgo),
});

const seeds = [
  task('demo-1', '確定申告の書類をそろえる', '源泉徴収票を探す', 'heavy', 'high', 'high', 30),
  task('demo-2', '先延ばししていた返信をする', '2分だけ文面を書く', 'normal', 'high', 'high', 20),
  task('demo-3', '歯医者の予約を取る', '', 'small', 'high', 'low', 12),
  task('demo-4', '部屋の机まわりを片付ける', 'いらない紙を3枚捨てる', 'normal', 'low', 'high', 50),
  task('demo-5', '企画書のたたき台を作る', '見出しだけ書く', 'boss', 'low', 'high', 70),
  task('demo-6', '洗濯物をたたむ', '', 'small', 'low', 'low', 8),
  task('demo-7', '請求書を送る', '', 'normal', 'high', 'high', 60, 49),
  task('demo-8', '古い服をまとめて寄付する', '', 'heavy', 'low', 'high', 90, 26),
  task('demo-9', '健康診断の予約', '', 'small', 'high', 'high', 40, 25),
  task('demo-10', 'プレゼン資料を仕上げる', '', 'boss', 'high', 'high', 100, 3),
  task('demo-11', '銀行の手続き', '', 'normal', 'high', 'low', 30, 2),
];

const today = new Date(now);
const day = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const streak = { currentStreak: 3, lastBurnDate: day(today), longestStreak: 5 };

const which = process.argv[2];
process.stdout.write(JSON.stringify(which === 'streak' ? streak : seeds));
