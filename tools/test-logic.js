/* Test logic skip/move/stats. Chạy: node tools/test-logic.js */
const PLAN = require('../plan.js');
const L = require('../logic.js');

const TODAY = '2026-08-19'; // Thứ Tư, tuần 1
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; } else { fail++; console.log('  ✗ FAIL:', name, extra !== undefined ? JSON.stringify(extra) : ''); } }

function freshState() { return { done: {}, skip: {}, moves: {}, ex: {} }; }
const oWed = L.origOf(PLAN, 0, 3); // hôm nay T4
const oThu = L.origOf(PLAN, 0, 4); // T5 strength
const oFri = L.origOf(PLAN, 0, 5); // T6 run
const oSat = L.origOf(PLAN, 0, 6); // T7 rest
const oSun = L.origOf(PLAN, 0, 0); // CN rest

console.log('origISO: Wed', oWed, 'Thu', oThu, 'Fri', oFri, 'Sat', oSat, 'Sun', oSun);

// 1. Trạng thái mặc định
let st = freshState();
let c = L.resolveWeek(PLAN, st, 0, TODAY);
ok('Wed=today', c[3].status === 'today', c[3].status);
ok('Wed session Easy Run', c[3].effSession.title === 'Easy Run');
ok('Thu strength planned', c[4].status === 'planned' && c[4].effSession.type === 'strength', c[4].status);
ok('Fri run planned', c[5].status === 'planned');
ok('Sat rest', c[6].status === 'rest');

// 2. Skip hôm nay
st = freshState(); st.skip[oWed] = true;
c = L.resolveWeek(PLAN, st, 0, TODAY);
ok('skip → status skipped', c[3].status === 'skipped', c[3].status);
let wp = L.weekProgress(PLAN, st, 0, TODAY);
ok('skip loại khỏi mẫu số (total giảm)', wp.skipped === 1, wp);
let ov = L.overall(PLAN, st, TODAY);
ok('skip không phá streak / không tính done', ov.streak === 0 && ov.doneSessions === 0, ov);

// 3. Ngày đích hợp lệ để dời buổi Wed
st = freshState();
let tgts = L.moveTargetsFor(PLAN, st, 0, oWed, TODAY);
let tgtDates = tgts.map(t => t.dateISO);
ok('targets = Sat & Sun (T7,CN nghỉ; loại Thu strength, loại Mon/Tue quá khứ)',
  tgtDates.length === 2 && tgtDates.includes(oSat) && tgtDates.includes(oSun), tgtDates);

// 4. Dời Wed → Sat
st = freshState(); st.moves[oWed] = oSat;
c = L.resolveWeek(PLAN, st, 0, TODAY);
ok('Wed moved-away', c[3].kind === 'moved-away' && c[3].status === 'moved', c[3]);
ok('Sat moved-in giữ Easy Run', c[6].kind === 'moved-in' && c[6].effSession.title === 'Easy Run', c[6].kind);
ok('Sat status planned (tương lai)', c[6].status === 'planned', c[6].status);
ok('effOrig của Sat = danh tính buổi Wed', c[6].effOrig === oWed, c[6].effOrig);

// 5. Hoàn thành buổi đã dời (done khóa theo origISO=Wed)
st = freshState(); st.moves[oWed] = oSat; st.done[oWed] = true;
c = L.resolveWeek(PLAN, st, 0, TODAY);
ok('Sat (moved-in) = done', c[6].status === 'done', c[6].status);
ok('Wed vẫn moved (không phải missed)', c[3].status === 'moved', c[3].status);
wp = L.weekProgress(PLAN, st, 0, TODAY);
ok('buổi dời tính đúng 1 lần + km vào tuần', wp.done === 1 && wp.km === 5, wp);

// 6. Không cho 2 buổi vào cùng 1 ngày đích
st = freshState(); st.moves[oWed] = oSat; st.moves[oFri] = oSat; // cả Wed & Fri cùng nhắm Sat
c = L.resolveWeek(PLAN, st, 0, TODAY);
// Sat chỉ chứa 1 (buổi xử lý trước = Wed, dow3 < dow5). Fri không dời được vào Sat đã bị chiếm.
ok('đích bị chiếm → move thứ 2 bị bỏ qua', c[6].effOrig === oWed && c[5].kind === 'base', {sat: c[6].effOrig, fri: c[5].kind});
tgts = L.moveTargetsFor(PLAN, st, 0, oFri, TODAY);
ok('Sat không còn là target cho Fri', tgts.every(t => t.dateISO !== oSat), tgts.map(t => t.dateISO));

// 7. Done bình thường (không move) → streak tăng
st = freshState(); st.done[oWed] = true;
ov = L.overall(PLAN, st, TODAY);
ok('done hôm nay → streak=1, doneSessions=1, km=5', ov.streak === 1 && ov.doneSessions === 1 && ov.kmDone === 5, ov);

// 8. Long run có thể dời sang mobility (CN) ở tuần thường
const oLong = L.origOf(PLAN, 1, 6); // W2 long run (T7)
const wiTodayForW2 = L.origOf(PLAN, 1, 1); // dùng 1 ngày trong W2 làm "today" để targets tương lai
tgts = L.moveTargetsFor(PLAN, { done: {}, skip: {}, moves: {}, ex: {} }, 1, oLong, oLong);
// tại đúng ngày long run, target = CN (mobility) cùng tuần (Mon đã quá khứ so với T7)
ok('W2 long run có thể dời sang CN (mobility)', tgts.some(t => t.baseType === 'mobility'), tgts);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
