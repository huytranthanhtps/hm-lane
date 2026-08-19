/* HM Lane — logic & render. State lưu trong localStorage. */
(function () {
  'use strict';

  var DAY_MS = 86400000;
  var DOW_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var MONTH_VI = 'THG';
  var STORE_KEY = 'hmlane_v1';

  // ---------- date helpers ----------
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function daysBetween(a, b) { return Math.round((midnight(b) - midnight(a)) / DAY_MS); }
  function fmtDate(d) { return DOW_VI[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_VI + ' ' + (d.getMonth() + 1); }

  var START = parseISO(PLAN.START_MONDAY);   // Thứ Hai tuần 1
  var RACE = parseISO(PLAN.RACE_DATE);

  // date của (weekIndex, dow) trong tuần Mon–Sun
  function dateOf(weekIdx, dow) {
    var offset = (dow === 0) ? 6 : (dow - 1); // Mon=0 ... Sun=6
    return addDays(START, weekIdx * 7 + offset);
  }

  // ---------- storage ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { done: {}, ex: {} }; }
    catch (e) { return { done: {}, ex: {} }; }
  }
  function save(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
  var state = load();

  function isDone(dISO) { return !!state.done[dISO]; }
  function setDone(dISO, v) { if (v) state.done[dISO] = true; else delete state.done[dISO]; save(state); }
  function exChecked(dISO, id) { return !!(state.ex[dISO] && state.ex[dISO][id]); }
  function toggleEx(dISO, id) {
    if (!state.ex[dISO]) state.ex[dISO] = {};
    if (state.ex[dISO][id]) delete state.ex[dISO][id]; else state.ex[dISO][id] = true;
    save(state);
  }

  // ---------- "hôm nay" trong plan ----------
  function locate(d) {
    var wi = Math.floor(daysBetween(START, d) / 7);
    return { weekIdx: wi, dow: d.getDay() };
  }
  var TODAY = midnight(new Date());
  var here = locate(TODAY);
  var monthCursor = { y: TODAY.getFullYear(), m: TODAY.getMonth() };

  function sessionAt(weekIdx, dow) {
    if (weekIdx < 0 || weekIdx >= PLAN.totalWeeks) return null;
    return PLAN.weeks[weekIdx].days[dow] || null;
  }

  // ---------- progress calcs ----------
  function weekProgress(weekIdx) {
    var w = PLAN.weeks[weekIdx], total = 0, done = 0, km = 0;
    for (var dow = 0; dow <= 6; dow++) {
      var s = w.days[dow];
      if (!s || s.type === 'rest') continue;
      total++;
      var di = iso(dateOf(weekIdx, dow));
      if (isDone(di)) { done++; if ((s.type === 'run' || s.type === 'race') && s.km) km += s.km; }
    }
    return { total: total, done: done, km: Math.round(km * 10) / 10 };
  }

  function overall() {
    var totalSessions = 0, doneSessions = 0, kmDone = 0;
    for (var wi = 0; wi < PLAN.totalWeeks; wi++) {
      var w = PLAN.weeks[wi];
      for (var dow = 0; dow <= 6; dow++) {
        var s = w.days[dow];
        if (!s || s.type === 'rest') continue;
        totalSessions++;
        var di = iso(dateOf(wi, dow));
        if (isDone(di)) {
          doneSessions++;
          if ((s.type === 'run' || s.type === 'race') && s.km) kmDone += s.km;
        }
      }
    }
    // streak: đếm lùi từ hôm nay, bỏ qua ngày nghỉ, dừng khi gặp buổi chưa xong
    var streak = 0, cur = TODAY;
    for (var i = 0; i < 400; i++) {
      var loc = locate(cur);
      if (loc.weekIdx < 0) break;
      var s2 = sessionAt(loc.weekIdx, loc.dow);
      if (s2 && s2.type !== 'rest') {
        if (isDone(iso(cur))) streak++; else break;
      }
      cur = addDays(cur, -1);
    }
    return {
      totalSessions: totalSessions, doneSessions: doneSessions,
      kmDone: Math.round(kmDone * 10) / 10, streak: streak,
      pct: totalSessions ? Math.round(doneSessions / totalSessions * 100) : 0,
    };
  }

  // ---------- render helpers ----------
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
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
  function exRows(routine, dISO, interactive) {
    return routine.items.map(function (x) {
      var done = interactive && exChecked(dISO, x.id);
      var key = x.key ? '<span class="keytag">' + x.key + '</span>' : '';
      return '<div class="ex' + (done ? ' done' : '') + '" data-ex="' + x.id + '">' +
        '<span class="ck">' + CHECK + '</span>' +
        '<div class="info"><div class="en">' + x.name + key + '</div><div class="cue">' + x.cue + '</div></div>' +
        '<span class="sets">' + x.sets + '</span></div>';
    }).join('');
  }

  // ---------- TODAY ----------
  function viewToday() {
    if (here.weekIdx < 0) {
      return '<div class="empty"><span class="big">Sắp bắt đầu</span>Kế hoạch khởi động Thứ Hai 17/8/2026.</div>';
    }
    if (here.weekIdx >= PLAN.totalWeeks) {
      return '<div class="empty"><span class="big">Hoàn thành 🎉</span>Bạn đã đi hết 22 tuần. Chúc mừng race!</div>';
    }
    var w = PLAN.weeks[here.weekIdx];
    var s = sessionAt(here.weekIdx, here.dow);
    var dISO = iso(TODAY);
    var toRace = Math.max(0, daysBetween(TODAY, RACE));

    // strip 22 tuần
    var strip = '';
    for (var i = 0; i < PLAN.totalWeeks; i++) {
      var wp = weekProgress(i);
      var cls = i === here.weekIdx ? 'now' : (wp.total > 0 && wp.done === wp.total ? 'done' : '');
      strip += '<i class="' + cls + '"></i>';
    }

    var hero = '<div class="phase-eyebrow">' + w.phaseLabel + '</div>' +
      '<div class="count"><span class="num">' + toRace + '</span><span class="unit">ngày</span></div>' +
      '<div class="count-sub">tới HM 21.1K · 17 THG 1 2027</div>' +
      '<div class="strip">' + strip + '</div>' +
      '<div class="strip-cap"><span>Tuần 1</span><span>Race</span></div>';

    var card = renderSessionCard(s, dISO, true);
    return hero + card;
  }

  function renderSessionCard(s, dISO, interactive) {
    if (!s) return '<div class="card rest"><div class="rail"></div><h2>Không có buổi</h2></div>';
    var done = isDone(dISO);
    var d = parseISO(dISO);
    var cls = 'card ' + (s.type === 'strength' ? 'strength' : s.type);
    var html = '<div class="' + cls + '"><div class="rail"></div>' +
      '<div class="card-top"><span>Hôm nay · ' + fmtDate(d) + '</span>' + typeTag(s.type) + '</div>' +
      '<h2>' + s.title + '</h2>';

    if (s.type === 'run' || s.type === 'race') {
      html += '<div class="metric">' + s.km + ' <small>km</small></div>';
    } else if (s.type === 'strength' || s.type === 'mobility') {
      html += '<div class="metric mint">~' + s.dur + ' <small>phút · tại nhà</small></div>';
    }
    if (s.desc) html += '<div class="desc">' + s.desc + '</div>';
    if (s.tags) html += chips(s.tags);

    // strength/mobility → danh sách bài + why
    if ((s.type === 'strength' || s.type === 'mobility') && s.routine && typeof ROUTINES !== 'undefined') {
      var r = ROUTINES[s.routine];
      if (r) {
        var checked = 0;
        r.items.forEach(function (x) { if (exChecked(dISO, x.id)) checked++; });
        html += '<div class="ex-head"><span class="h">' + r.items.length + ' bài · ' + r.subtitle + '</span>' +
          '<span class="c">' + checked + '/' + r.items.length + ' xong</span></div>';
        html += exRows(r, dISO, interactive);
        if (s.routine === 'A') {
          html += '<div class="why"><b>Vì sao?</b> 2 bài gắn thẻ cổ chân/cẳng chân trực tiếp trị điểm đau 12–15km. Chân khỏe hơn = ít chuột rút ở 15km+.</div>';
        }
      }
    }

    if (s.type !== 'rest') {
      var mint = (s.type === 'strength' || s.type === 'mobility');
      html += '<button class="tick' + (done ? ' done' : (mint ? ' mint' : '')) + '" id="tickBtn" data-date="' + dISO + '">' +
        CHECK + (done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành') + '</button>';
    }
    if (s.type === 'run' && here.weekIdx === 0) {
      html += '<div class="subnote">Tuần này: hôm nay &amp; T6 chạy (5km/buổi = 10km CLB), T5 tập bổ trợ. Cuối tuần bận nên nghỉ.</div>';
    }
    html += '</div>';
    return html;
  }

  // ---------- WEEK ----------
  function viewWeek() {
    if (here.weekIdx < 0 || here.weekIdx >= PLAN.totalWeeks) return viewToday();
    var w = PLAN.weeks[here.weekIdx];
    var wp = weekProgress(here.weekIdx);
    var clbDone = 0;
    for (var dw = 0; dw <= 6; dw++) {
      var ss = w.days[dw];
      if (ss && (ss.type === 'run' || ss.type === 'race') && ss.km && isDone(iso(dateOf(here.weekIdx, dw)))) clbDone += ss.km;
    }
    clbDone = Math.round(clbDone * 10) / 10;

    var head = '<div class="section-title">Tuần ' + w.num + '</div>' +
      '<div class="section-sub">' + w.phaseLabel + ' · mục tiêu ' + w.weekKm + ' km' + (w.deload ? ' · deload' : '') + '</div>';

    var order = [1, 2, 3, 4, 5, 6, 0]; // T2..CN
    var rows = order.map(function (dow) {
      var s = w.days[dow]; if (!s) return '';
      var dt = dateOf(here.weekIdx, dow);
      var dISO = iso(dt);
      var isToday = dISO === iso(TODAY);
      var done = isDone(dISO);
      var right = (s.type === 'run' || s.type === 'race') && s.km ? '<span class="km">' + s.km + ' km</span>' : '';
      var icon = s.type === 'run' || s.type === 'race' ? '🏃' : (s.type === 'strength' ? '💪' : (s.type === 'mobility' ? '🧘' : '·'));
      return '<div class="day' + (done ? ' done' : '') + (isToday ? ' today' : '') + '" data-date="' + dISO + '" data-dow="' + dow + '">' +
        '<span class="dot ' + s.type + '">' + (done ? CHECK : icon) + '</span>' +
        '<div class="meta"><div class="dname">' + s.title + '</div><div class="dsub">' + DOW_VI[dow] + ' ' + dt.getDate() + '/' + (dt.getMonth() + 1) + '</div></div>' +
        right + '</div>';
    }).join('');

    var clbPct = Math.min(100, Math.round(clbDone / 10 * 100));
    var clb = ring(clbPct, '#6FE0C0', clbPct + '%') +
      '<div class="ring-txt"><div class="rt-big">' + clbDone + ' / 10 km</div>' +
      '<div class="rt-lbl">Chỉ tiêu CLB tuần này</div>' +
      '<div class="rt-sub">' + (clbDone >= 10 ? 'Đã đạt ✓' : 'Còn ' + Math.round((10 - clbDone) * 10) / 10 + ' km') + '</div></div>';

    return head + rows + '<div class="ring-card" style="margin-top:18px">' + clb + '</div>';
  }

  // ---------- LANE ----------
  function viewLane() {
    var phases = [];
    var last = null;
    PLAN.weeks.forEach(function (w) {
      if (w.phase !== last) { phases.push({ phase: w.phase, label: w.phaseLabel, weeks: [] }); last = w.phase; }
      phases[phases.length - 1].weeks.push(w);
    });

    var html = '<div class="lane-head"><h2>The Lane</h2><span>19/8 → 17/1</span></div>';
    phases.forEach(function (p) {
      html += '<div class="phase-div">' + p.label + '</div><div class="lane">';
      p.weeks.forEach(function (w) {
        if (w.race) return;
        var wp = weekProgress(w.index);
        var done = wp.total > 0 && wp.done === wp.total;
        var now = w.index === here.weekIdx;
        var label = w.special ? 'Reset · 3×easy' : (w.deload ? 'Deload' : (w.peak ? 'Đỉnh · full HM' : 'Long run'));
        var val = w.special ? '10 km' : w.longRun + ' km';
        html += '<div class="seg' + (done ? ' done' : '') + (now ? ' now' : '') + '" data-week="' + w.index + '">' +
          '<span class="node"></span><span class="wk">W' + w.num + '</span>' +
          '<div class="bar"><span class="lr">' + label + '</span><span class="val">' + val + '</span></div></div>';
      });
      html += '</div>';
    });
    var toRace = Math.max(0, daysBetween(TODAY, RACE));
    html += '<div class="finish"><span class="node"></span>' +
      '<div><div class="rname">Race Day</div><div class="rsub">CN 17/01 · 21.1 KM · còn ' + toRace + ' ngày</div></div>' +
      '<div class="rtime">3:00</div></div>';
    return html;
  }

  // ---------- PROGRESS ----------
  function ring(pct, color, label) {
    var C = 97.4, off = C * (1 - Math.min(100, pct) / 100);
    return '<svg class="ring" viewBox="0 0 36 36">' +
      '<circle cx="18" cy="18" r="15.5" fill="none" stroke="#3A3227" stroke-width="4"/>' +
      '<circle cx="18" cy="18" r="15.5" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 18 18)"/>' +
      '<text x="18" y="20.5" text-anchor="middle" fill="#F2ECE0" font-family="Space Mono, monospace" font-size="7.5" font-weight="700">' + label + '</text></svg>';
  }
  function viewProgress() {
    var o = overall();
    var w = (here.weekIdx >= 0 && here.weekIdx < PLAN.totalWeeks) ? PLAN.weeks[here.weekIdx] : PLAN.weeks[0];
    var toRace = Math.max(0, daysBetween(TODAY, RACE));

    var html = '<div class="section-title">Tiến độ</div>' +
      '<div class="section-sub">' + w.phaseLabel + ' · Tuần ' + w.num + '</div>' +
      '<div class="p-hero"><div class="big">' + o.streak + '</div><div class="lbl">Buổi streak 🔥</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v mint">' + o.doneSessions + '<small> /' + o.totalSessions + '</small></div><div class="k">Buổi hoàn thành</div></div>' +
      '<div class="stat"><div class="v rust">' + o.kmDone + '</div><div class="k">KM đã chạy</div></div>' +
      '<div class="stat"><div class="v">' + toRace + '</div><div class="k">Ngày tới race</div></div>' +
      '<div class="stat"><div class="v">' + o.pct + '<small>%</small></div><div class="k">Chặng hoàn tất</div></div>' +
      '</div>';

    html += '<div class="ring-card">' + ring(o.pct, '#D24E1B', o.pct + '%') +
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

  // ---------- MONTH (heatmap) ----------
  var MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  function activityLevel(s, km) {
    // trả về class màu theo loại buổi + cự ly
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
    var lead = (first.getDay() + 6) % 7;           // Monday-first
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var todayISO = iso(TODAY);

    var head = '<div class="cal-head"><button class="cal-nav" data-mn="prev" aria-label="Tháng trước">‹</button>' +
      '<div class="cal-title">' + MONTH_NAMES[m] + ' ' + y + '</div>' +
      '<button class="cal-nav" data-mn="next" aria-label="Tháng sau">›</button></div>';

    var dows = ['T2','T3','T4','T5','T6','T7','CN'];
    var dowRow = '<div class="cal-dows">' + dows.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>';

    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<div class="cal-cell empty"></div>';

    var monthDone = 0, monthKm = 0;
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(y, m, d);
      var dISO = iso(date);
      var loc = locate(date);
      var s = sessionAt(loc.weekIdx, loc.dow);
      var scheduled = s && s.type !== 'rest';
      var done = scheduled && isDone(dISO);
      var cls = 'cal-cell';
      if (!scheduled) cls += ' rest';
      if (done) {
        var km = (s.type === 'run' || s.type === 'race') ? (s.km || 0) : 0;
        cls += ' ' + activityLevel(s, km);
        monthDone++; if (km) monthKm += km;
      } else if (scheduled && date < TODAY) {
        cls += ' missed';
      } else if (scheduled) {
        cls += ' planned';
      }
      if (dISO === todayISO) cls += ' today';
      var can = scheduled && date <= TODAY ? ' data-caldate="' + dISO + '"' : '';
      cells += '<div class="' + cls + '"' + can + '><span class="dn">' + d + '</span></div>';
    }

    var grid = dowRow + '<div class="cal-grid">' + cells + '</div>';

    var legend = '<div class="cal-legend"><span>Ít</span>' +
      '<i class="lvl-run1"></i><i class="lvl-run2"></i><i class="lvl-run3"></i><i class="lvl-run4"></i>' +
      '<span>Nhiều</span><i class="lvl-str" style="margin-left:10px"></i><span>Bổ trợ</span></div>';

    var summary = '<div class="ring-card cal-sum" style="margin-top:12px">' +
      '<div class="ring-txt" style="flex:1"><div class="rt-big">' + monthDone + ' buổi · ' + (Math.round(monthKm * 10) / 10) + ' km</div>' +
      '<div class="rt-lbl">Đã hoàn thành trong ' + MONTH_NAMES[m].toLowerCase() + '</div>' +
      '<div class="rt-sub">Chạm ngày (hôm nay hoặc quá khứ) để đánh dấu</div></div></div>';

    return head + legend + grid + summary;
  }

  // ---------- router ----------
  var VIEWS = { today: viewToday, week: viewWeek, month: viewMonth, lane: viewLane, progress: viewProgress, exercises: viewExercises };
  var current = 'today';
  var viewEl = document.getElementById('view');
  var navEl = document.getElementById('nav');
  var pillEl = document.getElementById('wkPill');

  function updatePill() {
    var n = (here.weekIdx < 0) ? '—' : (here.weekIdx >= PLAN.totalWeeks ? '22' : ('0' + (here.weekIdx + 1)).slice(-2));
    pillEl.textContent = 'WK ' + n + ' / 22';
  }

  function render() {
    viewEl.innerHTML = VIEWS[current]();
    viewEl.scrollTop = 0;
    bindViewEvents();
  }

  function bindViewEvents() {
    var tick = document.getElementById('tickBtn');
    if (tick) tick.addEventListener('click', function () {
      var d = tick.getAttribute('data-date');
      setDone(d, !isDone(d));
      render();
    });
    // exercise check toggles (chỉ ở Today, interactive)
    if (current === 'today') {
      Array.prototype.forEach.call(viewEl.querySelectorAll('.ex[data-ex]'), function (row) {
        row.addEventListener('click', function () {
          toggleEx(iso(TODAY), row.getAttribute('data-ex'));
          render();
        });
      });
    }
    // week rows → toggle done nhanh
    if (current === 'week') {
      Array.prototype.forEach.call(viewEl.querySelectorAll('.day[data-date]'), function (row) {
        row.addEventListener('click', function () {
          var d = row.getAttribute('data-date');
          setDone(d, !isDone(d));
          render();
        });
      });
    }
    // month: chuyển tháng + chạm ô ngày để tick
    if (current === 'month') {
      Array.prototype.forEach.call(viewEl.querySelectorAll('.cal-nav'), function (btn) {
        btn.addEventListener('click', function () {
          var dir = btn.getAttribute('data-mn') === 'next' ? 1 : -1;
          var nm = monthCursor.m + dir;
          monthCursor = { y: monthCursor.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
          render();
        });
      });
      Array.prototype.forEach.call(viewEl.querySelectorAll('.cal-cell[data-caldate]'), function (cell) {
        cell.addEventListener('click', function () {
          var d = cell.getAttribute('data-caldate');
          setDone(d, !isDone(d));
          render();
        });
      });
    }
  }

  navEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    current = btn.getAttribute('data-tab');
    Array.prototype.forEach.call(navEl.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b === btn);
    });
    render();
  });

  updatePill();
  render();

  // ---------- PWA ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
