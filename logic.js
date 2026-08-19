/* HM Lane — logic thuần (không DOM/localStorage) để dễ test.
   state = { done:{}, skip:{}, moves:{}, ex:{} }
   - done/skip khóa theo origISO (ngày gốc của buổi trong plan = danh tính buổi)
   - moves[origISO] = targetISO (dời buổi sang ngày khác trong cùng tuần)
   todayISO, các ISO đều dạng 'YYYY-MM-DD' (so sánh chuỗi = so sánh thời gian). */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.HMLogic = api;
})(this, function () {
  'use strict';
  var DAY = 86400000;

  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }
  function addDaysISO(s, n) { var d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetweenISO(a, b) { return Math.round((parseISO(b) - parseISO(a)) / DAY); }
  function dowOfISO(s) { return parseISO(s).getDay(); } // 0=CN..6=T7
  function round1(x) { return Math.round(x * 10) / 10; }

  function origOf(PLAN, wi, dow) {
    var off = (dow === 0) ? 6 : (dow - 1); // Mon=0..Sun=6 trong tuần neo Thứ Hai
    return addDaysISO(PLAN.START_MONDAY, wi * 7 + off);
  }
  function locate(PLAN, dateISO) {
    return { weekIdx: Math.floor(daysBetweenISO(PLAN.START_MONDAY, dateISO) / 7), dow: dowOfISO(dateISO) };
  }

  function statusOf(cell, done, skip, todayISO) {
    if (cell.kind === 'moved-away') return 'moved';
    var s = cell.effSession;
    if (!s || s.type === 'rest') return 'rest';
    var id = cell.effOrig;
    if (done[id]) return 'done';
    if (skip[id]) return 'skipped';
    if (cell.dateISO < todayISO) return 'missed';
    if (cell.dateISO === todayISO) return 'today';
    return 'planned';
  }

  // Giải tuần: trả về {0..6 -> cell}. cell = {dow,dateISO,origISO,base,effSession,effOrig,kind,movedTo,movedFrom,status}
  function resolveWeek(PLAN, state, wi, todayISO) {
    var done = state.done || {}, skip = state.skip || {}, moves = state.moves || {};
    var wk = PLAN.weeks[wi];
    var cells = {};
    var d;
    for (d = 0; d <= 6; d++) {
      var oISO = origOf(PLAN, wi, d);
      cells[d] = {
        dow: d, dateISO: oISO, origISO: oISO, base: wk.days[d] || null,
        effSession: wk.days[d] || null, effOrig: oISO, kind: 'base', movedTo: null, movedFrom: null
      };
    }
    // Áp dụng move (nguồn thuộc tuần này)
    for (d = 0; d <= 6; d++) {
      var c = cells[d];
      if (c.kind !== 'base') continue;
      var tgt = moves[c.origISO];
      if (!tgt) continue;
      var td = dowOfISO(tgt);
      var tcell = cells[td];
      if (!tcell || tcell.dateISO !== tgt) continue;      // đích không thuộc tuần này
      if (tcell.kind !== 'base') continue;                // đích đã bị dùng
      var tb = tcell.base;
      if (tb && tb.type !== 'rest' && tb.type !== 'mobility') continue; // đích phải là ngày trống
      c.kind = 'moved-away'; c.movedTo = tgt; c.effSession = null; c.effOrig = null;
      tcell.kind = 'moved-in'; tcell.movedFrom = c.origISO; tcell.effSession = c.base; tcell.effOrig = c.origISO;
    }
    for (d = 0; d <= 6; d++) cells[d].status = statusOf(cells[d], done, skip, todayISO);
    return cells;
  }

  // Ngày đích hợp lệ để dời buổi origISO trong tuần wi
  function moveTargetsFor(PLAN, state, wi, origISO, todayISO) {
    var cells = resolveWeek(PLAN, state, wi, todayISO);
    var wk = PLAN.weeks[wi], out = [];
    for (var t = 0; t <= 6; t++) {
      var b = wk.days[t];
      if (!b) continue;
      if (b.type !== 'rest' && b.type !== 'mobility') continue;
      var tISO = origOf(PLAN, wi, t);
      if (tISO < todayISO) continue;       // không dời về quá khứ
      if (tISO === origISO) continue;
      if (cells[t].kind !== 'base') continue; // đã chứa/đã dời đi
      out.push({ dow: t, dateISO: tISO, baseType: b.type });
    }
    out.sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; });
    return out;
  }

  function weekProgress(PLAN, state, wi, todayISO) {
    var cells = resolveWeek(PLAN, state, wi, todayISO);
    var total = 0, done = 0, km = 0, skipped = 0;
    for (var d = 0; d <= 6; d++) {
      var c = cells[d];
      if (c.kind === 'moved-away') continue;
      var s = c.effSession;
      if (!s || s.type === 'rest') continue;
      if (c.status === 'skipped') { skipped++; continue; } // loại khỏi mẫu số
      total++;
      if (c.status === 'done') { done++; if (s.type === 'run' || s.type === 'race') km += s.km || 0; }
    }
    return { total: total, done: done, km: round1(km), skipped: skipped };
  }

  function overall(PLAN, state, todayISO) {
    var totalFixed = 0, doneSessions = 0, kmDone = 0, wi, d;
    for (wi = 0; wi < PLAN.totalWeeks; wi++)
      for (d = 0; d <= 6; d++) {
        var b = PLAN.weeks[wi].days[d];
        if (b && b.type !== 'rest') totalFixed++;
      }
    for (wi = 0; wi < PLAN.totalWeeks; wi++) {
      var cells = resolveWeek(PLAN, state, wi, todayISO);
      for (d = 0; d <= 6; d++) {
        var c = cells[d];
        if (c.status === 'done') {
          doneSessions++;
          var s = c.effSession;
          if (s && (s.type === 'run' || s.type === 'race')) kmDone += s.km || 0;
        }
      }
    }
    // streak: đếm lùi từ hôm nay; done→+1, missed→dừng, còn lại (rest/skipped/moved/planned/today)→trung tính
    var streak = 0, cur = todayISO, i;
    for (i = 0; i < 400; i++) {
      var loc = locate(PLAN, cur);
      if (loc.weekIdx < 0) break;
      if (loc.weekIdx < PLAN.totalWeeks) {
        var st = resolveWeek(PLAN, state, loc.weekIdx, todayISO)[loc.dow].status;
        if (st === 'done') streak++;
        else if (st === 'missed') break;
      }
      cur = addDaysISO(cur, -1);
    }
    return {
      totalSessions: totalFixed, doneSessions: doneSessions, kmDone: round1(kmDone),
      pct: totalFixed ? Math.round(doneSessions / totalFixed * 100) : 0, streak: streak
    };
  }

  return {
    parseISO: parseISO, iso: iso, addDaysISO: addDaysISO, daysBetweenISO: daysBetweenISO,
    dowOfISO: dowOfISO, origOf: origOf, locate: locate,
    resolveWeek: resolveWeek, statusOf: statusOf, moveTargetsFor: moveTargetsFor,
    weekProgress: weekProgress, overall: overall
  };
});
