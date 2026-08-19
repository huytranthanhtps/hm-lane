/* HM Lane — dữ liệu kế hoạch 22 tuần.
   Tuần được neo vào Thứ Hai 17/8/2026. Hôm nay 19/8/2026 = Thứ Tư của Tuần 1.
   Mọi buổi sinh theo luật từ bảng WEEKS + khung tuần chuẩn. */

const START_MONDAY = '2026-08-17'; // Thứ Hai của Tuần 1
const RACE_DATE = '2027-01-17';    // Chủ Nhật, Tuần 22
const GOAL_PACE = '8:34/km';       // pace mục tiêu 3h HM

// [longRun km, phase, cờ]  — index 0 = Tuần 1
const WEEKS_SPEC = [
  { lr: 0,  phase: 'reset',    note: 'special' },              // W1 (partial)
  { lr: 6,  phase: 'reset' },                                  // W2
  { lr: 8,  phase: 'reset' },                                  // W3
  { lr: 10, phase: 'base' },                                   // W4
  { lr: 8,  phase: 'base',     deload: true },                 // W5
  { lr: 12, phase: 'base' },                                   // W6
  { lr: 14, phase: 'base' },                                   // W7
  { lr: 11, phase: 'base',     deload: true },                 // W8
  { lr: 16, phase: 'base' },                                   // W9
  { lr: 17, phase: 'specific', goalPace: 4 },                  // W10
  { lr: 13, phase: 'specific', deload: true },                 // W11
  { lr: 18, phase: 'specific', goalPace: 5, fuel: true },      // W12
  { lr: 19, phase: 'specific', goalPace: 6, fuel: true },      // W13
  { lr: 15, phase: 'specific', deload: true },                 // W14
  { lr: 20, phase: 'specific', goalPace: 8, fuel: true },      // W15
  { lr: 21, phase: 'specific', goalPace: 8, fuel: true, peak: true }, // W16
  { lr: 16, phase: 'peak' },                                   // W17
  { lr: 18, phase: 'peak',     goalPace: 6, fuel: true },      // W18
  { lr: 14, phase: 'peak' },                                   // W19
  { lr: 12, phase: 'taper' },                                  // W20
  { lr: 8,  phase: 'taper' },                                  // W21
  { lr: 0,  phase: 'taper',    race: true },                   // W22
];

const PHASE_LABEL = {
  reset: 'Reset — lấy lại nền',
  base: 'Nền tảng',
  specific: 'Chuyên biệt',
  peak: 'Đỉnh + giảm tải',
  taper: 'Taper',
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(n);

// Buổi chạy easy — km suy ra từ long run của tuần
function easyKm(lr, factor, lo, hi) {
  if (lr <= 0) return lo;
  return clamp(round(lr * factor), lo, hi);
}

// Sinh 7 ngày (dow 0=CN..6=T7) cho một tuần
function buildWeek(idx) {
  const spec = WEEKS_SPEC[idx];
  const days = {}; // dow -> session

  // Tuần 1 đặc biệt: chỉ T4/T5/T6, bận cuối tuần
  if (spec.note === 'special') {
    days[1] = rest('Nghỉ');                       // T2
    days[2] = rest('Nghỉ · chưa bắt đầu');        // T3
    days[3] = run('Easy Run', 3.5, 'Chạy lại nhẹ, run-walk thoải mái — thở còn nói chuyện được.', ['Zone 2', 'Cadence 170+', 'Không gắng sức']); // T4 (hôm nay)
    days[4] = run('Easy Run', 3.5, 'Tiếp tục nhẹ nhàng. Nếu cổ chân/gối khó chịu thì đi bộ xen kẽ.', ['Zone 2', 'Run-walk OK']); // T5
    days[5] = run('Easy Run', 3.0, 'Buổi cuối trong tuần — gom đủ ~10km chỉ tiêu CLB.', ['Zone 2', 'CLB 10km']); // T6
    days[6] = rest('Nghỉ · bận');                 // T7
    days[0] = rest('Nghỉ · bận');                 // CN
    return finalizeWeek(idx, spec, days, 10);
  }

  // Tuần đua
  if (spec.race) {
    days[1] = rest('Nghỉ hoàn toàn');
    days[2] = run('Shakeout + strides', 5, 'Chạy nhẹ giữ chân nhạy, 4×20s tăng tốc nhẹ cuối buổi.', ['Easy', '4× strides']);
    days[3] = mobility('Mobility + nghỉ');
    days[4] = run('Shakeout', 4, 'Rất nhẹ, thả lỏng. Chuẩn bị đồ đua, ngủ sớm.', ['Rất easy']);
    days[5] = rest('Nghỉ · nạp carb, uống đủ nước');
    days[6] = mobility('Mobility nhẹ · chuẩn bị race');
    days[0] = race();
    return finalizeWeek(idx, spec, days, 21.1);
  }

  // Khung tuần chuẩn (W2..W21)
  const e1 = easyKm(spec.lr, 0.45, 4, 8);
  const e2 = easyKm(spec.lr, 0.40, 4, 7);
  const withStrides = spec.phase !== 'reset';

  days[1] = rest('Nghỉ');                                       // T2
  days[2] = run('Easy Run', e1, easyDesc(spec), easyTags(spec)); // T3
  days[3] = strength('A');                                       // T4
  days[4] = withStrides                                          // T5
    ? run('Easy + Strides', e2, 'Chạy easy rồi 4–6×20s tăng tốc nhẹ (không chạy nước rút). Cải thiện guồng chân.', ['Zone 2', 'Strides'])
    : run('Easy Run', e2, easyDesc(spec), easyTags(spec));
  days[5] = strength('B');                                       // T6
  days[6] = longRun(spec);                                       // T7
  days[0] = mobility('Mobility · giãn cơ');                     // CN

  const weekKm = e1 + e2 + spec.lr;
  return finalizeWeek(idx, spec, days, weekKm);
}

function easyDesc(spec) {
  if (spec.deload) return 'Tuần deload — chạy nhẹ, ưu tiên phục hồi. Đừng cố tăng tốc.';
  return 'Chạy easy Zone 2, nhịp thở nói chuyện được. Nền aerobic là gốc.';
}
function easyTags(spec) {
  const t = ['Zone 2'];
  if (spec.deload) t.push('Deload'); else t.push('Cadence 170+');
  return t;
}

function longRun(spec) {
  const tags = ['Long run', 'Pace đều'];
  let desc = 'Long run — chạy chậm và đều. Đừng ra quân nhanh; 10km đầu luôn nhẹ hơn cảm giác.';
  if (spec.deload) desc = 'Long run tuần deload — ngắn hơn để phục hồi, giữ đều.';
  if (spec.goalPace) {
    tags.push(`${spec.goalPace}km @ mục tiêu`);
    desc += ` Chạy ${spec.lr - spec.goalPace}km đầu easy, ${spec.goalPace}km cuối ở pace mục tiêu (${GOAL_PACE}).`;
  }
  if (spec.fuel) {
    tags.push('Tập điện giải');
    desc += ' Tập uống nước + điện giải mỗi ~5km để chống chuột rút.';
  }
  if (spec.peak) tags.push('Đủ cự ly HM');
  return { type: 'run', title: 'Long Run', km: spec.lr, desc, tags };
}

function run(title, km, desc, tags) { return { type: 'run', title, km, desc, tags: tags || [] }; }
function strength(which) { return { type: 'strength', title: `Strength ${which}`, routine: which, dur: 35 }; }
function mobility(title) {
  return { type: 'mobility', title, dur: 15,
    desc: 'Giãn cổ chân, bắp chân và cơ gấp hông (quan trọng vì bạn ngồi nhiều). Có thể foam roll.',
    routine: 'MOB' };
}
function rest(title) { return { type: 'rest', title, desc: 'Nghỉ ngơi để cơ thể hồi phục. Ngủ đủ, uống đủ nước.' }; }
function race() {
  return { type: 'race', title: 'RACE DAY', km: 21.1,
    desc: 'Xuất phát chậm hơn cảm giác. Uống điện giải đều. Mục tiêu: về đích dưới 3h, không chuột rút. Bạn đã tập đủ.',
    tags: ['21.1 km', 'Mục tiêu 3:00', 'Đều & bình tĩnh'] };
}

function finalizeWeek(idx, spec, days, weekKm) {
  return {
    index: idx,                 // 0-based
    num: idx + 1,               // hiển thị W1..W22
    phase: spec.phase,
    phaseLabel: PHASE_LABEL[spec.phase],
    longRun: spec.lr,
    deload: !!spec.deload,
    peak: !!spec.peak,
    race: !!spec.race,
    special: spec.note === 'special',
    weekKm: Math.round(weekKm * 10) / 10,
    days,
  };
}

const PLAN = {
  START_MONDAY, RACE_DATE, GOAL_PACE,
  weeks: WEEKS_SPEC.map((_, i) => buildWeek(i)),
  totalWeeks: WEEKS_SPEC.length,
};

if (typeof module !== 'undefined') module.exports = PLAN;
