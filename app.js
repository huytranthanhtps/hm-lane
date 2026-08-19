/* HM Lane — render + tương tác. Logic thuần ở logic.js (HMLogic). */
(function () {
  'use strict';
  var L = window.HMLogic;
  var DOW_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  var STORE_KEY = 'hmlane_v1';

  var iso = L.iso, parseISO = L.parseISO;
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  var TODAY_ISO = iso(midnight(new Date()));
  var RACE = parseISO(PLAN.RACE_DATE);
  var toRaceDays = Math.max(0, L.daysBetweenISO(TODAY_ISO, PLAN.RACE_DATE));
  var here = L.locate(PLAN, TODAY_ISO);

  // ---------- storage ----------
  function load() {
    var s;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { s = {}; }
    s.done = s.done || {}; s.skip = s.skip || {}; s.moves = s.moves || {}; s.ex = s.ex || {};
    return s;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  var state = load();

  function isDone(id) { return !!state.done[id]; }
  function setDone(id, v) { if (v) state.done[id] = true; else delete state.done[id]; save(); }
  function setSkip(id, v) { if (v) state.skip[id] = true; else delete state.skip[id]; save(); }
  function setMove(id, t) { if (t) state.moves[id] = t; else delete state.moves[id]; save(); }
  function exChecked(sid, id) { return !!(state.ex[sid] && state.ex[sid][id]); }
  function toggleEx(sid, id) {
    if (!state.ex[sid]) state.ex[sid] = {};
    if (state.ex[sid][id]) delete state.ex[sid][id]; else state.ex[sid][id] = true;
    save();
  }

  var ui = { movePicker: false };

  // ---------- render helpers ----------
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  function fmtDate(d) { return DOW_VI[d.getDay()] + ' ' + d.getDate() + ' THG ' + (d.getMonth() + 1); }
  function shortISO(dISO) { var d = parseISO(dISO); return DOW_VI[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); }
  function typeTag(t) {
    if (t === 'run' || t === 'race') return '<span class="tag run">Chạy</span>';
    if (t === 'strength') return '<span class="tag str">Bổ trợ</span>';
    if (t === 'mobility') return '<span class="tag str">Mobility</span>';
    return '<span class="tag rest">Nghỉ</span>';
  }
  function chips(arr) {
    if (!arr || !arr.length) return '';
    return '<div class="chips">' + arr.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('') + '</div>';
  }
  function exRows(routine, sid) {
    return routine.items.map(function (x) {
      var d = exChecked(sid, x.id);
      var key = x.key ? '<span class="keytag">' + x.key + '</span>' : '';
      return '<div class="ex' + (d ? ' done' : '') + '" data-act="toggle-ex" data-sess="' + sid + '" data-id="' + x.id + '">' +
        '<span class="ck">' + CHECK + '</span>' +
        '<div class="info"><div class="en">' + x.name + key + '</div><div class="cue">' + x.cue + '</div></div>' +
        '<span class="sets">' + x.sets + '</span></div>';
    }).join('');
  }
  function isMovable(s) { return s && (s.type === 'run' || s.type === 'strength' || s.type === 'mobility'); }

  // ---------- TODAY ----------
  function viewToday() {
    if (here.weekIdx < 0)
      return '<div class="empty"><span class="big">Sắp bắt đầu</span>Kế hoạch khởi động Thứ Hai 17/8/2026.</div>';
    if (here.weekIdx >= PLAN.totalWeeks)
      return '<div class="empty"><span class="big">Hoàn thành 🎉</span>Bạn đã đi hết 22 tuần. Chúc mừng race!</div>';

    var w = PLAN.weeks[here.weekIdx];
    var cells = L.resolveWeek(PLAN, state, here.weekIdx, TODAY_ISO);
    var cell = cells[here.dow];

    var strip = '';
    for (var i = 0; i < PLAN.totalWeeks; i++) {
      var wp = L.weekProgress(PLAN, state, i, TODAY_ISO);
      var cls = i === here.weekIdx ? 'now' : (wp.total > 0 && wp.done === wp.total ? 'done' : '');
      strip += '<i class="' + cls + '"></i>';
    }
    var hero = '<div class="phase-eyebrow">' + w.phaseLabel + '</div>' +
      '<div class="count"><span class="num">' + toRaceDays + '</span><span class="unit">ngày</span></div>' +
      '<div class="count-sub">tới HM 21.1K · 17 THG 1 2027</div>' +
      '<div class="strip">' + strip + '</div>' +
      '<div class="strip-cap"><span>Tuần 1</span><span>Race</span></div>';

    return hero + todayCard(cell);
  }

  function todayCard(cell) {
    var dateHdr = fmtDate(parseISO(cell.dateISO));
    // Buổi hôm nay đã dời đi nơi khác
    if (cell.kind === 'moved-away') {
      return '<div class="card rest"><div class="rail"></div>' +
        '<div class="card-top"><span>Hôm nay · ' + dateHdr + '</span></div>' +
        '<h2>Ngày trống</h2>' +
        '<div class="state-note">Buổi <b>' + cell.base.title + '</b> đã dời sang <b>' + shortISO(cell.movedTo) + '</b>.' +
        '<button class="link-btn" data-act="unmove" data-id="' + cell.origISO + '">Hoàn tác</button></div></div>';
    }
    var s = cell.effSession;
    if (!s) return '<div class="card rest"><div class="rail"></div><h2>Không có buổi</h2></div>';

    var id = cell.effOrig;
    var done = cell.status === 'done', skipped = cell.status === 'skipped';
    var cls = 'card ' + (s.type === 'strength' ? 'strength' : s.type);
    var fromNote = cell.movedFrom ? ' · <span class="from">dời từ ' + shortISO(cell.movedFrom) + '</span>' : '';
    var html = '<div class="' + cls + (skipped ? ' skipped' : '') + '"><div class="rail"></div>' +
      '<div class="card-top"><span>Hôm nay · ' + dateHdr + fromNote + '</span>' + typeTag(s.type) + '</div>' +
      '<h2>' + s.title + '</h2>';

    if (s.type === 'run' || s.type === 'race') {
      html += '<div class="metric">' + s.km + ' <small>km</small></div>';
      if (s.pace) html += '<div class="pace"><span class="pl">Pace gợi ý</span><b>' + s.pace + '</b>' +
        (s.paceNote ? '<i>' + s.paceNote + '</i>' : '') + '</div>';
    } else if (s.type === 'strength' || s.type === 'mobility') {
      html += '<div class="metric mint">~' + s.dur + ' <small>phút · tại nhà</small></div>';
    }
    if (s.desc) html += '<div class="desc">' + s.desc + '</div>';
    if (s.tags) html += chips(s.tags);

    if ((s.type === 'strength' || s.type === 'mobility') && s.routine && typeof ROUTINES !== 'undefined') {
      var r = ROUTINES[s.routine];
      if (r) {
        var checked = 0;
        r.items.forEach(function (x) { if (exChecked(id, x.id)) checked++; });
        html += '<div class="ex-head"><span class="h">' + r.items.length + ' bài · ' + r.subtitle + '</span>' +
          '<span class="c">' + checked + '/' + r.items.length + ' xong</span></div>';
        html += exRows(r, id);
        if (s.routine === 'A') html += '<div class="why"><b>Vì sao?</b> 2 bài gắn thẻ cổ chân/cẳng chân trực tiếp trị điểm đau 12–15km. Chân khỏe hơn = ít chuột rút ở 15km+.</div>';
      }
    }

    // Actions
    if (skipped) {
      html += '<div class="state-note">Đã bỏ qua buổi này.' +
        '<button class="link-btn" data-act="unskip" data-id="' + id + '">Hoàn tác</button></div>';
    } else {
      var mint = (s.type === 'strength' || s.type === 'mobility');
      html += '<button class="tick' + (done ? ' done' : (mint ? ' mint' : '')) + '" data-act="' + (done ? 'undone' : 'done') + '" data-id="' + id + '">' +
        CHECK + (done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành') + '</button>';
      if (!done && s.type !== 'race') {
        var movable = isMovable(s);
        html += '<div class="actions">' +
          '<button class="btn-ghost" data-act="skip" data-id="' + id + '">Bỏ qua hôm nay</button>' +
          (movable ? '<button class="btn-ghost" data-act="move-open">Dời sang ngày khác</button>' : '') +
          '</div>';
        if (ui.movePicker && movable) html += movePicker(cell);
      }
      if (cell.kind === 'moved-in')
        html += '<div class="state-sub"><button class="link-btn" data-act="unmove" data-id="' + id + '">↩ Trả về ' + shortISO(cell.movedFrom) + '</button></div>';
    }

    if (s.type === 'run' && here.weekIdx === 0 && cell.kind === 'base')
      html += '<div class="subnote">Tuần này: hôm nay &amp; T6 chạy (5km/buổi = 10km CLB), T5 tập bổ trợ. Cuối tuần bận nên nghỉ.</div>';

    return html + '</div>';
  }

  function movePicker(cell) {
    var tg = L.moveTargetsFor(PLAN, state, here.weekIdx, cell.effOrig, TODAY_ISO);
    var opts = tg.length
      ? tg.map(function (t) { return '<button class="mp-opt" data-act="move-to" data-id="' + cell.effOrig + '" data-to="' + t.dateISO + '">' + shortISO(t.dateISO) + '</button>'; }).join('')
      : '<span class="mp-empty">Không còn ngày trống trong tuần này</span>';
    return '<div class="move-picker"><div class="mp-h">Dời sang ngày trống cùng tuần</div>' +
      '<div class="mp-opts">' + opts + '</div>' +
      '<button class="link-btn" data-act="move-cancel">Huỷ</button></div>';
  }

  // ---------- WEEK ----------
  function viewWeek() {
    if (here.weekIdx < 0 || here.weekIdx >= PLAN.totalWeeks) return viewToday();
    var w = PLAN.weeks[here.weekIdx];
    var cells = L.resolveWeek(PLAN, state, here.weekIdx, TODAY_ISO);
    var wp = L.weekProgress(PLAN, state, here.weekIdx, TODAY_ISO);

    var head = '<div class="section-title">Tuần ' + w.num + '</div>' +
      '<div class="section-sub">' + w.phaseLabel + ' · mục tiêu ' + w.weekKm + ' km' + (w.deload ? ' · deload' : '') + '</div>';

    var order = [1, 2, 3, 4, 5, 6, 0];
    var rows = order.map(function (dow) {
      var c = cells[dow];
      var d = parseISO(c.dateISO);
      var dsub = DOW_VI[dow] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
      if (c.kind === 'moved-away') {
        return '<div class="day moved">' +
          '<span class="dot rest">→</span>' +
          '<div class="meta"><div class="dname">' + c.base.title + '</div><div class="dsub">' + dsub + ' · dời sang ' + shortISO(c.movedTo) + '</div></div></div>';
      }
      var s = c.effSession;
      if (!s) return '';
      var isToday = c.dateISO === TODAY_ISO;
      var st = c.status;
      var icon = (s.type === 'run' || s.type === 'race') ? '🏃' : (s.type === 'strength' ? '💪' : (s.type === 'mobility' ? '🧘' : '·'));
      var right = (s.type === 'run' || s.type === 'race') && s.km ? '<span class="km">' + s.km + ' km</span>' : '';
      var sub = dsub + (c.movedFrom ? ' · dời từ ' + shortISO(c.movedFrom) : (s.pace ? ' · ' + s.pace : ''));
      var clickable = s.type !== 'rest';
      return '<div class="day ' + st + (isToday ? ' today' : '') + '"' +
        (clickable ? ' data-act="toggle-done" data-id="' + c.effOrig + '"' : '') + '>' +
        '<span class="dot ' + s.type + '">' + (st === 'done' ? CHECK : (st === 'skipped' ? '–' : icon)) + '</span>' +
        '<div class="meta"><div class="dname">' + s.title + '</div><div class="dsub">' + sub + '</div></div>' +
        right + '</div>';
    }).join('');

    var clbPct = Math.min(100, Math.round(wp.km / 10 * 100));
    var clb = ring(clbPct, '#6FE0C0', clbPct + '%') +
      '<div class="ring-txt"><div class="rt-big">' + wp.km + ' / 10 km</div>' +
      '<div class="rt-lbl">Chỉ tiêu CLB tuần này</div>' +
      '<div class="rt-sub">' + (wp.km >= 10 ? 'Đã đạt ✓' : 'Còn ' + Math.round((10 - wp.km) * 10) / 10 + ' km') +
      (wp.skipped ? ' · ' + wp.skipped + ' buổi bỏ qua' : '') + '</div></div>';

    return head + rows + '<div class="ring-card" style="margin-top:18px">' + clb + '</div>';
  }

  // ---------- MONTH ----------
  function activityLevel(s, km) {
    if (s.type === 'strength' || s.type === 'mobility') return 'lvl-str';
    var k = km || 0;
    if (k <= 5) return 'lvl-run1';
    if (k <= 10) return 'lvl-run2';
    if (k <= 16) return 'lvl-run3';
    return 'lvl-run4';
  }
  function viewMonth() {
    var y = monthCursor.y, m = monthCursor.m;
    var first = new Date(y, m, 1);
    var lead = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var head = '<div class="cal-head"><button class="cal-nav" data-act="mn-prev" aria-label="Tháng trước">‹</button>' +
      '<div class="cal-title">' + MONTH_NAMES[m] + ' ' + y + '</div>' +
      '<button class="cal-nav" data-act="mn-next" aria-label="Tháng sau">›</button></div>';
    var dows = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    var dowRow = '<div class="cal-dows">' + dows.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>';

    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<div class="cal-cell empty"></div>';
    var monthDone = 0, monthKm = 0;
    for (var d = 1; d <= daysInMonth; d++) {
      var dISO = iso(new Date(y, m, d));
      var loc = L.locate(PLAN, dISO);
      var cls = 'cal-cell', clickId = '';
      if (loc.weekIdx >= 0 && loc.weekIdx < PLAN.totalWeeks) {
        var c = L.resolveWeek(PLAN, state, loc.weekIdx, TODAY_ISO)[loc.dow];
        var st = c.status, s = c.effSession;
        if (st === 'done') {
          var km = (s.type === 'run' || s.type === 'race') ? (s.km || 0) : 0;
          cls += ' ' + activityLevel(s, km);
          monthDone++; if (km) monthKm += km;
          clickId = c.effOrig;
        } else if (st === 'skipped') { cls += ' skipped'; clickId = c.effOrig; }
        else if (st === 'moved') { cls += ' moved'; }
        else if (st === 'missed') { cls += ' missed'; clickId = c.effOrig; }
        else if (st === 'today') { cls += ' planned'; clickId = c.effOrig; }
        else if (st === 'planned') { cls += ' planned'; }
        else { cls += ' rest'; }
      } else { cls += ' rest'; }
      if (dISO === TODAY_ISO) cls += ' today';
      var attr = clickId ? ' data-act="toggle-done" data-id="' + clickId + '"' : '';
      cells += '<div class="' + cls + '"' + attr + '><span class="dn">' + d + '</span></div>';
    }
    var grid = dowRow + '<div class="cal-grid">' + cells + '</div>';
    var legend = '<div class="cal-legend"><span>Ít</span>' +
      '<i class="lvl-run1"></i><i class="lvl-run2"></i><i class="lvl-run3"></i><i class="lvl-run4"></i>' +
      '<span>Nhiều</span><i class="lvl-str" style="margin-left:10px"></i><span>Bổ trợ</span></div>';
    var summary = '<div class="ring-card cal-sum" style="margin-top:12px">' +
      '<div class="ring-txt" style="flex:1"><div class="rt-big">' + monthDone + ' buổi · ' + (Math.round(monthKm * 10) / 10) + ' km</div>' +
      '<div class="rt-lbl">Đã hoàn thành trong ' + MONTH_NAMES[m].toLowerCase() + '</div>' +
      '<div class="rt-sub">Chạm ngày (hôm nay/quá khứ) để tick · xám = bỏ qua · nét đứt xanh = đã dời</div></div></div>';
    return head + legend + grid + summary;
  }

  // ---------- LANE ----------
  function viewLane() {
    var phases = [], last = null;
    PLAN.weeks.forEach(function (w) {
      if (w.phase !== last) { phases.push({ label: w.phaseLabel, weeks: [] }); last = w.phase; }
      phases[phases.length - 1].weeks.push(w);
    });
    var html = '<div class="lane-head"><h2>The Lane</h2><span>19/8 → 17/1</span></div>';
    phases.forEach(function (p) {
      html += '<div class="phase-div">' + p.label + '</div><div class="lane">';
      p.weeks.forEach(function (w) {
        if (w.race) return;
        var wp = L.weekProgress(PLAN, state, w.index, TODAY_ISO);
        var done = wp.total > 0 && wp.done === wp.total;
        var now = w.index === here.weekIdx;
        var label = w.special ? 'Reset · 3 buổi' : (w.deload ? 'Deload' : (w.peak ? 'Đỉnh · full HM' : 'Long run'));
        var val = w.special ? '10 km' : w.longRun + ' km';
        html += '<div class="seg' + (done ? ' done' : '') + (now ? ' now' : '') + '">' +
          '<span class="node"></span><span class="wk">W' + w.num + '</span>' +
          '<div class="bar"><span class="lr">' + label + '</span><span class="val">' + val + '</span></div></div>';
      });
      html += '</div>';
    });
    html += '<div class="finish"><span class="node"></span>' +
      '<div><div class="rname">Race Day</div><div class="rsub">CN 17/01 · 21.1 KM · còn ' + toRaceDays + ' ngày</div></div>' +
      '<div class="rtime">3:00</div></div>';
    return html;
  }

  // ---------- PROGRESS ----------
  function ring(pct, color, label) {
    var C = 97.4, off = C * (1 - Math.min(100, pct) / 100);
    return '<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#3A3227" stroke-width="4"/>' +
      '<circle cx="18" cy="18" r="15.5" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 18 18)"/>' +
      '<text x="18" y="20.5" text-anchor="middle" fill="#F2ECE0" font-family="Space Mono, monospace" font-size="7.5" font-weight="700">' + label + '</text></svg>';
  }
  function viewProgress() {
    var o = L.overall(PLAN, state, TODAY_ISO);
    var w = (here.weekIdx >= 0 && here.weekIdx < PLAN.totalWeeks) ? PLAN.weeks[here.weekIdx] : PLAN.weeks[0];
    var html = '<div class="section-title">Tiến độ</div>' +
      '<div class="section-sub">' + w.phaseLabel + ' · Tuần ' + w.num + '</div>' +
      '<div class="p-hero"><div class="big">' + o.streak + '</div><div class="lbl">Buổi streak 🔥</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v mint">' + o.doneSessions + '<small> /' + o.totalSessions + '</small></div><div class="k">Buổi hoàn thành</div></div>' +
      '<div class="stat"><div class="v rust">' + o.kmDone + '</div><div class="k">KM đã chạy</div></div>' +
      '<div class="stat"><div class="v">' + toRaceDays + '</div><div class="k">Ngày tới race</div></div>' +
      '<div class="stat"><div class="v">' + o.pct + '<small>%</small></div><div class="k">Chặng hoàn tất</div></div>' +
      '</div>' +
      '<div class="ring-card">' + ring(o.pct, '#D24E1B', o.pct + '%') +
      '<div class="ring-txt"><div class="rt-big">' + w.phaseLabel + '</div><div class="rt-lbl">Giai đoạn hiện tại</div>' +
      '<div class="rt-sub">Long run tối đa: 21 km @ W16</div></div></div>';
    return html;
  }

  // ---------- EXERCISES ----------
  function viewExercises() {
    var html = '<div class="section-title">Bài tập</div><div class="section-sub">Thư viện bổ trợ · thiết bị tại nhà</div>';
    ['A', 'B', 'MOB'].forEach(function (k) {
      var r = ROUTINES[k];
      html += '<div class="routine"><h3>' + r.title + '</h3><div class="rsub">' + r.subtitle + '</div>' +
        '<div class="rfocus">' + r.focus + '</div>';
      html += r.items.map(function (x) {
        var key = x.key ? '<span class="keytag">' + x.key + '</span>' : '';
        return '<div class="ex" style="cursor:default"><span class="ck" style="border-color:var(--line-soft)"></span>' +
          '<div class="info"><div class="en">' + x.name + key + '</div><div class="cue">' + x.cue + '</div></div>' +
          '<span class="sets">' + x.sets + '</span></div>';
      }).join('');
      html += '</div>';
    });
    return html;
  }

  // ---------- router + events ----------
  var VIEWS = { today: viewToday, week: viewWeek, month: viewMonth, lane: viewLane, progress: viewProgress, exercises: viewExercises };
  var monthCursor = { y: parseISO(TODAY_ISO).getFullYear(), m: parseISO(TODAY_ISO).getMonth() };
  var current = 'today';
  var viewEl = document.getElementById('view');
  var navEl = document.getElementById('nav');
  var pillEl = document.getElementById('wkPill');

  function updatePill() {
    var n = (here.weekIdx < 0) ? '—' : (here.weekIdx >= PLAN.totalWeeks ? '22' : ('0' + (here.weekIdx + 1)).slice(-2));
    pillEl.textContent = 'WK ' + n + ' / 22';
  }
  function render() { viewEl.innerHTML = VIEWS[current](); viewEl.scrollTop = 0; }

  // single delegated handler (viewEl không bị thay thế, chỉ innerHTML con)
  viewEl.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (act === 'done' || act === 'toggle-done') { setDone(id, !isDone(id)); ui.movePicker = false; }
    else if (act === 'undone') { setDone(id, false); }
    else if (act === 'skip') { setSkip(id, true); ui.movePicker = false; }
    else if (act === 'unskip') { setSkip(id, false); }
    else if (act === 'move-open') { ui.movePicker = true; }
    else if (act === 'move-cancel') { ui.movePicker = false; }
    else if (act === 'move-to') { setMove(id, t.getAttribute('data-to')); ui.movePicker = false; }
    else if (act === 'unmove') { setMove(id, null); ui.movePicker = false; }
    else if (act === 'toggle-ex') { toggleEx(t.getAttribute('data-sess'), id); }
    else if (act === 'mn-prev' || act === 'mn-next') {
      var nm = monthCursor.m + (act === 'mn-next' ? 1 : -1);
      monthCursor = { y: monthCursor.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    } else return;
    render();
  });

  navEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    current = btn.getAttribute('data-tab');
    ui.movePicker = false;
    Array.prototype.forEach.call(navEl.querySelectorAll('button'), function (b) { b.classList.toggle('active', b === btn); });
    render();
  });

  updatePill();
  render();

  if ('serviceWorker' in navigator)
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
