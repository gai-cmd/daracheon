/*
 * 대라천 상세페이지 인라인 편집기 (editor.js)
 * - 의존성·빌드 없음. apply.js(window.DetailEditCore) 다음에 로드한다.
 * - UI 는 #de-root 하나의 Shadow DOM 안에만 만든다. 페이지 요소에는 편집 중인 글 상자의
 *   contenteditable/spellcheck 속성 외에는 아무것도 붙이지 않는다(레이아웃 이동 없음, 내보내기에 흔적 없음).
 * - 서버에서 온 문자열은 textContent 로만, 글 HTML 은 core.sanitize 를 거쳐서만 DOM 에 넣는다. innerHTML 로 문자열을 넣지 않는다.
 * - API 주소는 항상 location.origin + '/api/...' (문서에 <base> 가 있어 루트 상대 경로는 쓸 수 없다).
 */
(function () {
  'use strict';
  if (window.__deEditor) return;
  window.__deEditor = 1;

  var core = window.DetailEditCore;
  var ORIGIN = location.origin;
  var NAMES = ['texts', 'images', 'bgs', 'hidden'];
  var MAX_W = 1720;
  var MAX_BYTES = 3.5 * 1024 * 1024;
  var WARN_FS = 22;
  var SLUG = (function () {
    var m = document.querySelector('meta[name="de-page"]');
    var s = m && m.getAttribute('content');
    return s || location.pathname.replace(/\/+$/, '').split('/').pop().replace(/\.html$/, '');
  })();
  var DOC_PATH = '/api/admin/detail-edits/' + encodeURIComponent(SLUG);
  var LIST_URL = ORIGIN + '/admin/detail-concepts';
  var DRAFT_KEY = 'de-draft:' + SLUG;

  // 상태 ---------------------------------------------------------------
  var S = {
    loaded: false, version: 0, updatedAt: null, saving: false, leaving: false,
    savedCanon: '', dirty: false, hist: [], hi: -1, removed: {}, orph: {},
    edit: null, hov: {}, cur: null, items: [], panel: null, imgCtx: null, dlg: null,
    collapsed: false, mx: -1, my: -1,
    pop: null, tbFor: null, co: null, coT: 0, sorig: [], sidx: {}
  };
  var R = null; // core.registry()
  var M = { block: new Map(), img: new Map(), bg: new Map(), sec: new Map() };
  var K = { texts: {}, images: {}, bgs: {}, hidden: {} };
  var UI = {};
  var host, root, raf = 0, uid = 0, draftTimer = 0;

  // 유틸 ---------------------------------------------------------------
  function h(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (kids || []).forEach(function (c) {
      if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function btn(label, act, extra) {
    var p = { type: 'button', 'data-act': act, text: label };
    if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
    return h('button', p);
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function inDoc(a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; }
  function up(n, map) {
    for (; n && n.nodeType === 1; n = n.parentElement) { if (map.has(n)) return n; }
    return null;
  }
  function fromUI(e) { return e.composedPath().indexOf(host) !== -1; }
  function safe(fn) { try { return fn(); } catch { return null; } }
  function toHex(c) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('');
  }

  // 문서 모델 ----------------------------------------------------------
  // 배치(layout)는 순서가 의미를 가지는 sequence 만 그대로 두고 나머지는 키로 정렬해, 같은 상태면 같은 문자열이 되게 한다.
  function canonLayout(L) {
    if (!L) return null;
    var o = {}, nn = function (v) { return v == null ? null : v; };
    if (L.sequence && L.sequence.length) o.sequence = L.sequence.map(itemKey);
    if (L.clones && L.clones.length) o.clones = L.clones.map(function (c) { return [c.id, c.of]; }).sort();
    var g = (L.gaps || []).filter(function (e) { return e.top != null || e.bottom != null; }).map(function (e) { return [e.k, nn(e.top), nn(e.bottom)]; }).sort();
    if (g.length) o.gaps = g;
    var b = (L.secbg || []).map(function (e) { return [e.k, String(e.color).toLowerCase()]; }).sort();
    if (b.length) o.secbg = b;
    return Object.keys(o).length ? o : null;
  }
  // 문자열, {k}, {c} 어느 형태로 와도 항목(item) 문자열로 읽는다
  function itemKey(e) { return typeof e === 'string' ? e : e && (e.k || e.c) || null; }
  function canon(d) {
    var o = {};
    NAMES.forEach(function (n) {
      o[n] = (d[n] || []).slice().sort(function (a, b) { return a.k < b.k ? -1 : a.k > b.k ? 1 : 0; }).map(function (e) {
        var r = {};
        Object.keys(e).sort().forEach(function (k) { if (e[k] != null) r[k] = e[k]; });
        return r;
      });
    });
    var l = canonLayout(d.layout);
    if (l) o.layout = l;
    return JSON.stringify(o);
  }
  // 코어가 모으는 변경분 중 살아 있는 키만 + 적용 못 한 수정(orphan)은 편집기가 직접 보관한다.
  function buildDoc() {
    var c = core.collect() || {};
    var d = {};
    NAMES.forEach(function (n) {
      d[n] = (c[n] || []).filter(function (e) { return K[n][e.k]; });
    });
    Object.keys(S.orph).forEach(function (k) {
      if (!S.removed[k]) d[S.orph[k].name].push(S.orph[k].entry);
    });
    var L = liveLayout(c.layout);
    if (canonLayout(L)) d.layout = clone(L);
    return d;
  }
  // 사용자가 목록에서 지운 배치 고아 항목('L|종류|키')을 뺀 배치
  function liveLayout(L) {
    if (!L) return L;
    var o = clone(L), dead = function (t, k) { return S.removed['L|' + t + '|' + k]; };
    if (o.clones) o.clones = o.clones.filter(function (c) { return !dead('c', c.id); });
    if (o.sequence) o.sequence = o.sequence.filter(function (e) { var x = itemKey(e); return !dead('s', x) && !dead('c', x); });
    if (o.gaps) o.gaps = o.gaps.filter(function (e) { return !dead('g', e.k) && !dead('c', e.k); });
    if (o.secbg) o.secbg = o.secbg.filter(function (e) { return !dead('b', e.k) && !dead('c', e.k); });
    return o;
  }
  // 글·이미지 고아의 '지움' 표시는 저장·불러오기 뒤에 비우되, 배치 고아('L|')는 코어가 계속 들고 있으므로 남긴다
  function resetRemoved() {
    var keep = {};
    Object.keys(S.removed).forEach(function (k) { if (k.indexOf('L|') === 0) keep[k] = 1; });
    S.removed = keep;
  }
  function indexRegistry() {
    R = core.registry();
    M = { block: new Map(), img: new Map(), bg: new Map(), sec: new Map() };
    K = { texts: {}, images: {}, bgs: {}, hidden: {} };
    R.blocks.forEach(function (v, k) { K.texts[k] = 1; if (!M.block.has(v.el)) M.block.set(v.el, k); });
    R.images.forEach(function (v, k) { K.images[k] = 1; M.img.set(v.el, k); });
    R.bgs.forEach(function (v, k) { K.bgs[k] = 1; M.bg.set(v.el, k); });
    S.sorig = []; S.sidx = {};
    R.sections.forEach(function (v, k) {
      K.hidden[k] = 1; M.sec.set(v.el, k);
      if (v.kind !== 'clone') { S.sidx[k] = S.sorig.length; S.sorig.push(k); }
    });
    var items = [];
    M.block.forEach(function (k, el) { items.push({ kind: 'text', el: el, key: k }); });
    M.img.forEach(function (k, el) { items.push({ kind: 'img', el: el, key: k }); });
    M.bg.forEach(function (k, el) { items.push({ kind: 'bg', el: el, key: k }); });
    items.sort(function (a, b) { return inDoc(a.el, b.el); });
    S.items = items;
  }
  function calcOrph(doc) {
    var o = {};
    NAMES.forEach(function (n) {
      (doc[n] || []).forEach(function (e) { if (!K[n][e.k]) o[e.k] = { name: n, entry: clone(e) }; });
    });
    return o;
  }
  // 편집 모드에서는 숨긴 섹션도 레이아웃에 남겨 줄무늬로 흐리게 보여 준다 -> 코어의 숨김 규칙을 떼어 낸다.
  function unhideInEdit() {
    var st = document.getElementById('de-style');
    var sh = st && st.sheet;
    if (!sh) return;
    for (var i = sh.cssRules.length - 1; i >= 0; i--) {
      if (/data-de-hidden/.test(sh.cssRules[i].cssText)) sh.deleteRule(i);
    }
  }
  // 대상 문서와 현재 상태를 비교해 달라진 키만 코어 API 로 맞춘다 (되돌리기·최신본·복원 공용)
  function setTo(target) {
    stopEdit();
    syncClones(target);
    var cur = core.collect() || {};
    function idx(d, n) { var m = {}; (d[n] || []).forEach(function (e) { if (K[n][e.k]) m[e.k] = e; }); return m; }
    function keys(a, b) { var u = {}; Object.keys(a).forEach(function (k) { u[k] = 1; }); Object.keys(b).forEach(function (k) { u[k] = 1; }); return Object.keys(u); }
    function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
    var a = idx(cur, 'texts'), b = idx(target, 'texts');
    keys(a, b).forEach(function (k) {
      if (same(a[k], b[k])) return;
      if (a[k]) core.revert('text', k);
      var e = b[k];
      if (!e) return;
      if (e.html != null) core.setBlockHtml(k, e.html);
      if (e.fs != null || e.color != null) core.setBlockStyle(k, { fs: e.fs == null ? null : e.fs, color: e.color == null ? null : e.color });
    });
    a = idx(cur, 'images'); b = idx(target, 'images');
    keys(a, b).forEach(function (k) {
      if (same(a[k], b[k])) return;
      if (a[k]) core.revert('image', k);
      var e = b[k];
      if (!e) return;
      var o = {};
      if (e.src != null) o.src = e.src;
      if (e.alt != null) o.alt = e.alt;
      core.setImage(k, o);
    });
    a = idx(cur, 'bgs'); b = idx(target, 'bgs');
    keys(a, b).forEach(function (k) {
      if (same(a[k], b[k])) return;
      if (a[k]) core.revert('bg', k);
      if (b[k] && b[k].src != null) core.setBg(k, b[k].src);
    });
    a = idx(cur, 'hidden'); b = idx(target, 'hidden');
    keys(a, b).forEach(function (k) {
      if (!!a[k] !== !!b[k]) core.setHidden(k, !!b[k]);
    });
    layoutTo(target, cur.layout || {});
    unhideInEdit();
  }
  // 복제본을 대상 문서에 맞춘다: 없어진 것은 지우고, 모자란 것은 원본에서 다시 만든다 (코어는 번호를 가장 작은 빈 번호로 붙이므로 필요한 번호가 나올 때까지 만들고 남는 것은 지운다)
  function syncClones(target) {
    var want = {}, changed = false;
    ((target.layout || {}).clones || []).forEach(function (c) { want[c.id] = c.of; });
    var rg = core.registry(), curC = ((safe(function () { return core.collect(); }) || {}).layout || {}).clones || [];
    curC.forEach(function (c) {
      var rec = rg.sections.get(c.id);
      if (rec && rec.kind === 'clone' && want[c.id] !== c.of) { core.removeClone(c.id); changed = true; }
    });
    Object.keys(want).forEach(function (id) {
      var src = rg.sections.get(want[id]);
      if (rg.sections.has(id) || !src || src.kind === 'clone') return;
      var made = [], n = 0, got;
      while (n++ < 45) { got = safe(function () { return core.cloneSection(want[id]); }); if (!got) break; if (got === id) break; made.push(got); }
      made.forEach(function (x) { core.removeClone(x); });
      changed = true;
    });
    if (changed) reindex();
  }
  // 복제본이 생기거나 없어진 뒤 편집기 쪽 색인과 낡은 참조를 정리한다
  function reindex() {
    indexRegistry();
    S.cur = null; S.hov = {}; S.hovDirty = true;
  }
  // 배치(순서·여백·배경색)를 대상 문서에 맞춘다. 순서는 코어의 moveSection('up') 만으로 그룹마다 맞춘다.
  function layoutTo(target, curL) {
    var L = target.layout || {}, g;
    var want = L.sequence ? L.sequence.map(itemKey).filter(Boolean) : S.sorig;
    (safe(function () { return core.layout.groups(); }) || []).forEach(function (grp) {
      var keys = grp.keys.map(itemKey), order = want.filter(function (x) { return keys.indexOf(x) >= 0; });
      keys.forEach(function (x) { if (order.indexOf(x) < 0) order.push(x); });
      order.forEach(function (x, i) {
        var j = keys.indexOf(x);
        while (j > i) { if (!core.moveSection(x, 'up')) return; keys.splice(j - 1, 0, keys.splice(j, 1)[0]); j--; }
      });
    });
    function byK(arr) { var m = {}; (arr || []).forEach(function (e) { if (R.sections.has(e.k)) m[e.k] = e; }); return m; }
    var nn = function (v) { return v == null ? null : v; };
    var a = byK(curL.gaps), b = byK(L.gaps);
    Object.keys(a).concat(Object.keys(b)).forEach(function (k) {
      var x = a[k] || {}, y = b[k] || {};
      if (nn(x.top) !== nn(y.top) || nn(x.bottom) !== nn(y.bottom)) core.setGap(k, { top: nn(y.top), bottom: nn(y.bottom) });
    });
    a = byK(curL.secbg); b = byK(L.secbg);
    Object.keys(a).concat(Object.keys(b)).forEach(function (k) {
      g = b[k] ? b[k].color : null;
      if ((a[k] ? a[k].color : null) !== g) core.setSectionBg(k, g);
    });
  }

  // 되돌리기/다시 실행 ---------------------------------------------------
  function snapKey(s) { return canon(s.doc) + '|' + s.removed.slice().sort().join(','); }
  // co: 같은 조작이 이어지는 입력(색 고르기, 여백 숫자 입력)은 되돌리기 한 단계로 묶는다
  function record(co) {
    var s = { doc: clone(buildDoc()), removed: Object.keys(S.removed) };
    var c = snapKey(s), now = Date.now();
    if (S.hi >= 0 && snapKey(S.hist[S.hi]) === c) return;
    if (co && co === S.co && S.hi > 0 && S.hi === S.hist.length - 1 && now - S.coT < 2000) { S.hist[S.hi] = s; S.coT = now; return; }
    S.co = co || null; S.coT = now;
    S.hist.length = S.hi + 1;
    S.hist.push(s);
    if (S.hist.length > 100) S.hist.shift();
    S.hi = S.hist.length - 1;
  }
  function applySnap(s) {
    setTo(s.doc);
    S.removed = {};
    s.removed.forEach(function (k) { S.removed[k] = 1; });
    afterChange(true);
  }
  function undo() {
    flush();
    if (S.hi <= 0) { setStatus('더 이상 되돌릴 수 없습니다.'); return; }
    S.co = null; S.hi--; applySnap(S.hist[S.hi]);
  }
  function redo() {
    flush();
    if (S.hi >= S.hist.length - 1) { setStatus('다시 실행할 내용이 없습니다.'); return; }
    S.co = null; S.hi++; applySnap(S.hist[S.hi]);
  }
  function refreshDirty() {
    S.dirty = canon(buildDoc()) !== S.savedCanon;
    UI.dirty.hidden = !S.dirty;
    UI.reopen.setAttribute('data-dirty', S.dirty ? '1' : '');
    UI.reopen.textContent = S.dirty ? '편집 바 열기 ●' : '편집 바 열기';
  }
  // 변경이 확정될 때마다 부른다: 이력 기록, 더티 표시, 임시 저장, 화면 갱신
  function afterChange(skipRecord, co) {
    if (!skipRecord) record(co);
    refreshDirty();
    scheduleDraft();
    refreshOrph();
    refreshPanel();
    syncPop();
    renderNow();
  }

  // 임시 저장 (localStorage) ---------------------------------------------
  function scheduleDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 500);
  }
  function writeDraft() {
    clearTimeout(draftTimer);
    safe(function () {
      if (S.dirty) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ baseVersion: S.version, savedAt: new Date().toISOString(), doc: buildDoc() }));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    });
  }
  function offerDraft(serverDoc) {
    var raw = safe(function () { return localStorage.getItem(DRAFT_KEY); });
    var d = safe(function () { return JSON.parse(raw); });
    if (!d || !d.doc || !d.savedAt) return;
    if (canon(d.doc) === S.savedCanon) { safe(function () { localStorage.removeItem(DRAFT_KEY); }); return; }
    var srv = serverDoc.updatedAt ? new Date(serverDoc.updatedAt).getTime() : 0;
    if (new Date(d.savedAt).getTime() <= srv) { safe(function () { localStorage.removeItem(DRAFT_KEY); }); return; }
    var behind = d.baseVersion < S.version;
    dialog({
      title: '저장하지 않은 임시 저장본이 있습니다',
      body: fmtTime(d.savedAt) + '에 이 브라우저에 임시 저장된 수정입니다.' + (behind ? ' 그 뒤 서버에 더 새로운 저장본(v' + S.version + ')이 생겼으니, 복구 후 저장하면 그 내용 위에 덮어씁니다.' : ''),
      buttons: [{ label: '복구하기', value: 'ok', primary: true }, { label: '버리기', value: 'drop' }]
    }).then(function (v) {
      if (v === 'ok') { setTo(d.doc); S.orph = calcOrph(d.doc); resetRemoved(); afterChange(); setStatus('임시 저장본을 복구했습니다. 저장하면 서버에 반영됩니다.', 'warn'); }
      else if (v === 'drop') safe(function () { localStorage.removeItem(DRAFT_KEY); });
    });
  }

  // 서버 통신 ----------------------------------------------------------
  function api(method, path, body) {
    var opt = { method: method, credentials: 'same-origin', cache: 'no-store', headers: {} };
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    var ctl = window.AbortController ? new AbortController() : null;
    if (ctl) { opt.signal = ctl.signal; setTimeout(function () { ctl.abort(); }, 30000); }
    return fetch(ORIGIN + path, opt).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch { j = null; }
        return { status: r.status, ok: r.ok, json: j || {} };
      });
    });
  }
  // 서버 메시지는 4xx(한국어로 만든 안내)만 쓰고, 5xx 는 원문(영어일 수 있음) 대신 고정 문구를 쓴다
  function msgOf(r, fb) { return r.status < 500 && r.json && typeof r.json.message === 'string' && r.json.message ? r.json.message : fb; }

  function loadServerDoc() {
    return api('GET', DOC_PATH).then(function (r) {
      if (r.status === 401) throw { code: 401 };
      if (!r.ok || !r.json.success || !r.json.doc) throw { code: r.status, message: msgOf(r, '') };
      return r.json.doc;
    });
  }

  function save(over) {
    if (!S.loaded || S.saving) return Promise.resolve();
    flush();
    refreshDirty();
    if (!S.dirty && over === undefined) { setStatus('저장할 변경 사항이 없습니다.'); return Promise.resolve(); }
    var doc = buildDoc();
    var note = UI.note.value.trim().slice(0, 200);
    var body = { baseVersion: typeof over === 'number' ? over : S.version, doc: doc };
    if (note) body.note = note;
    S.saving = true;
    UI.save.disabled = true;
    setStatus('저장하는 중…');
    writeDraft();
    return api('PUT', DOC_PATH, body).then(function (r) {
      S.saving = false; UI.save.disabled = false;
      if (r.ok && r.json.success) {
        S.version = r.json.version;
        S.updatedAt = r.json.updatedAt || S.updatedAt;
        S.savedCanon = canon(doc);
        Object.keys(S.removed).forEach(function (k) { delete S.orph[k]; });
        resetRemoved();
        UI.note.value = '';
        refreshDirty();
        if (!S.dirty) safe(function () { localStorage.removeItem(DRAFT_KEY); });
        refreshOrph(); refreshPanel();
        var d = new Date();
        setStatus('저장했습니다 · v' + S.version + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()), 'ok');
        return true;
      }
      if (r.status === 409) return conflict(r.json.currentVersion);
      if (r.status === 401) return expired();
      var m = r.status === 413 ? '수정 내용이 너무 커서 저장하지 못했습니다. 이미지를 줄이거나 일부 수정을 되돌려 주세요.'
        : r.status === 403 ? '이 요청은 허용되지 않았습니다. 관리자 페이지에서 다시 열어 주세요.'
        : msgOf(r, '저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요. (오류 ' + r.status + ')');
      setStatus(m, 'error');
      return dialog({ title: '저장하지 못했습니다', body: m, alert: true, buttons: [{ label: '닫기', value: 'x', primary: true }] });
    }, function () {
      S.saving = false; UI.save.disabled = false;
      setStatus('네트워크 오류로 저장하지 못했습니다.', 'error');
      return dialog({
        title: '저장하지 못했습니다', alert: true,
        body: '네트워크에 연결할 수 없습니다. 수정 내용은 이 브라우저에 임시 저장되어 있습니다.',
        buttons: [{ label: '다시 시도', value: 'retry', primary: true }, { label: '닫기', value: 'x' }]
      }).then(function (v) { if (v === 'retry') return save(); });
    });
  }
  function conflict(cur) {
    setStatus('다른 곳에서 먼저 저장되었습니다.', 'warn');
    return dialog({
      title: '다른 곳에서 먼저 저장되었습니다', alert: true,
      body: '서버에는 v' + cur + '이 있고, 지금 화면은 v' + S.version + ' 기준입니다. 어떻게 할까요?',
      buttons: [
        { label: '최신본 불러오기', value: 'load', primary: true },
        { label: '내 수정으로 덮어쓰기', value: 'over' },
        { label: '취소', value: 'x' }
      ]
    }).then(function (v) {
      if (v === 'over') return save(typeof cur === 'number' ? cur : S.version);
      if (v === 'load') return reloadServer('최신본을 불러왔습니다. 내 수정은 실행 취소(Ctrl+Z)로 되살릴 수 있습니다.');
    });
  }
  function expired() {
    writeDraft();
    setStatus('로그인이 만료되어 저장하지 못했습니다.', 'error');
    return dialog({
      title: '로그인이 만료되었습니다', alert: true,
      body: '수정 내용은 이 브라우저에 임시 저장해 두었습니다. 새 탭에서 다시 로그인한 뒤 「다시 저장」을 눌러 주세요.',
      buttons: [{ label: '다시 저장', value: 'retry', primary: true }, { label: '로그인 창 열기', value: 'login' }, { label: '닫기', value: 'x' }]
    }).then(function (v) {
      if (v === 'login') { window.open(LIST_URL, '_blank', 'noopener'); return expired(); }
      if (v === 'retry') return save();
    });
  }
  function reloadServer(msg) {
    return loadServerDoc().then(function (doc) {
      setTo(doc);
      S.version = doc.version | 0; S.updatedAt = doc.updatedAt;
      S.orph = calcOrph(doc); resetRemoved();
      S.savedCanon = canon(buildDoc());
      afterChange();
      if (msg) setStatus(msg, 'ok');
    }, function (e) {
      if (e && e.code === 401) return expired();
      setStatus('서버에서 최신본을 불러오지 못했습니다.', 'error');
    });
  }

  // 오버레이 렌더링 -----------------------------------------------------
  function schedule() { if (!raf) raf = requestAnimationFrame(render); }
  function renderNow() { if (raf) cancelAnimationFrame(raf); raf = 0; render(); }
  function place(div, r) {
    if (!r || (r.width <= 0 && r.height <= 0)) { div.hidden = true; return; }
    div.hidden = false;
    var s = div.style;
    s.left = r.left + 'px'; s.top = r.top + 'px'; s.width = r.width + 'px'; s.height = r.height + 'px';
  }
  function rectOf(el) { return el && el.isConnected ? el.getBoundingClientRect() : null; }
  function render() {
    raf = 0;
    if (S.hovDirty) { S.hovDirty = false; updateHover(); }
    var barH = UI.bar.hidden ? 0 : UI.bar.offsetHeight;
    var hov = S.hov;
    var target = hov.img || hov.block || hov.bg || null;
    place(UI.hov, !S.edit || target !== S.edit.el ? rectOf(target) : null);
    place(UI.edt, S.edit ? rectOf(S.edit.el) : null);
    place(UI.cur, S.cur ? rectOf(S.cur.el) : null);
    // 이미지 교체 배지
    var ie = hov.img || hov.bg, ir = rectOf(ie);
    UI.badge.hidden = !ir;
    if (ir) { UI.badge.style.left = clamp(ir.left + 8, 4, innerWidth - 110) + 'px'; UI.badge.style.top = clamp(Math.max(ir.top, barH) + 8, barH + 4, innerHeight - 34) + 'px'; }
    // 섹션 도구 모음: 팝오버가 열려 있으면 그 섹션에 고정, 아니면 마우스 아래 섹션(없으면 키보드로 고른 항목의 섹션)
    var pse = S.pop && R.sections.get(S.pop.item), se = pse ? pse.el : hov.sec || (S.cur ? up(S.cur.el, M.sec) : null);
    updateSecTool(se, barH, !pse && !!hov.sec);
    placePop(barH);
    // 숨긴 섹션 줄무늬
    var n = 0;
    M.sec.forEach(function (k, el) {
      if (!el.hasAttribute('data-de-hidden')) return;
      var r = el.getBoundingClientRect(), d = UI.strips[n];
      if (!d) { d = h('div', { class: 'strip' }, [h('span', { text: '숨김 처리됨' })]); UI.layer.appendChild(d); UI.strips[n] = d; }
      n++;
      if (r.bottom < 0 || r.top > innerHeight) d.hidden = true; else place(d, r);
    });
    for (; n < UI.strips.length; n++) UI.strips[n].hidden = true;
    // 복제본 꼬리표
    var m = 0;
    (R ? R.sections : new Map()).forEach(function (rec) {
      if (rec.kind !== 'clone') return;
      var r = rec.el.getBoundingClientRect(), d = UI.ctags[m];
      if (r.bottom < barH + 4 || r.top > innerHeight || r.width <= 0) return;
      if (!d) { d = h('div', { class: 'ctag', text: '복제본', 'aria-hidden': 'true' }); UI.layer.appendChild(d); UI.ctags[m] = d; }
      m++;
      d.hidden = false;
      d.style.left = clamp(r.left, 0, Math.max(0, innerWidth - 70)) + 'px';
      d.style.top = Math.max(r.top, barH) + 'px';
    });
    for (; m < UI.ctags.length; m++) UI.ctags[m].hidden = true;
    // 패널 위치, 미니 툴바
    UI.panel.style.top = (barH + 8) + 'px';
    UI.panel.style.maxHeight = Math.max(160, innerHeight - barH - 16) + 'px';
    positionTool(barH);
  }
  function positionTool(barH) {
    var t = UI.tool;
    if (!S.edit) { t.hidden = true; return; }
    var r = rectOf(S.edit.el);
    if (!r) { t.hidden = true; return; }
    t.hidden = false;
    var w = t.offsetWidth, hh = t.offsetHeight;
    var top = r.top - hh - 6;
    if (top < barH + 4) top = Math.min(r.bottom + 6, innerHeight - hh - 4);
    t.style.left = clamp(r.left, 4, Math.max(4, innerWidth - w - 4)) + 'px';
    t.style.top = clamp(top, barH + 4, Math.max(barH + 4, innerHeight - hh - 4)) + 'px';
  }
  function pick(t) {
    var r = { block: up(t, M.block), sec: up(t, M.sec), bg: up(t, M.bg), img: null };
    if (t.tagName === 'IMG' && M.img.has(t)) r.img = t;
    return r;
  }
  // 이벤트 대상(target)이 아니라 좌표로 고른다: 그 점 아래 겹친 요소를 위에서부터 훑어 처음 만나는 글 상자 / 이미지 / CSS 배경을 쓴다.
  // 이미지 위에 글 없는 덮개(그라데이션, 반투명, 이미지를 품은 부모의 ::before/::after)가 얹힌 곳이 11개 페이지에 13곳 있어서다.
  function ownText(n) {
    for (var c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3 && /\S/.test(c.nodeValue)) return true; }
    return false;
  }
  function alphaOf(c) {
    var m = /rgba?\(([^)]*)\)/.exec(c || '');
    if (!m) return 0;
    var q = m[1].split(',');
    return q.length > 3 ? parseFloat(q[3]) : 1;
  }
  function paints(cs) { return alphaOf(cs.backgroundColor) >= 1 || (cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)); }
  // 이 요소가 그 아래의 것을 가리는가? 글 없는 투명/반투명/그라데이션 덮개는 지나치고, 불투명한 면이나 (편집 대상이 아닌) 글자는 멈춘다.
  function blocksBelow(el, below) {
    if (ownText(el)) return true;
    var wraps = below.some(function (o) { return el.contains(o); });
    if (wraps) { // 자기 안의 요소보다 위에 그려진다 = 자기 ::before/::after 덮개. 상자 자신의 배경은 아래에 깔리므로 보지 않는다
      return ['::before', '::after'].some(function (ps) { var c = getComputedStyle(el, ps); return c.content !== 'none' && c.display !== 'none' && paints(c); });
    }
    return paints(getComputedStyle(el));
  }
  function hitAt(x, y) {
    var st = document.elementsFromPoint(x, y), p = {};
    if (!st.length) return p;
    p.sec = up(st[0], M.sec);
    for (var i = 0; i < st.length; i++) {
      var q = pick(st[i]);
      if (q.block) { p.block = q.block; break; }
      if (q.img) { p.img = q.img; break; }
      if (q.bg) { p.bg = q.bg; break; }
      if (blocksBelow(st[i], st.slice(i + 1))) break;
    }
    return p;
  }
  function sameHov(a, b) { return a.block === b.block && a.img === b.img && a.bg === b.bg && a.sec === b.sec; }
  function updateHover() {
    var p = S.mx >= 0 ? hitAt(S.mx, S.my) : {};
    if (!sameHov(p, S.hov)) S.hov = p;
  }

  // 글 편집 ------------------------------------------------------------
  function caretAt(x, y) {
    var r = null;
    if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) {
      var p = document.caretPositionFromPoint(x, y);
      if (p) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); r.collapse(true); }
    }
    return r;
  }
  // 캐럿 위치를 글자 수로 저장/복원 (setBlockHtml 이 노드를 새로 만들기 때문)
  function walkLen(el, stop) {
    var n = 0, found = false;
    (function rec(node) {
      for (var c = node.firstChild; c && !found; c = c.nextSibling) {
        if (c === stop.node && c.nodeType === 3) { n += stop.off; found = true; return; }
        if (c === stop.node) { found = true; return; }
        if (c.nodeType === 3) n += c.length;
        else if (c.nodeName === 'BR') n += 1;
        else rec(c);
      }
    })(el);
    return n;
  }
  function saveCaret(el) {
    var sel = getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) return null;
    var a = sel.anchorNode, o = sel.anchorOffset, pos;
    if (a.nodeType === 3) pos = walkLen(el, { node: a, off: o });
    else {
      var ch = a.childNodes[o];
      pos = ch ? walkLen(el, { node: ch, off: 0 }) : walkLen(el, { node: null, off: 0 });
    }
    return pos;
  }
  function restoreCaret(el, pos) {
    if (pos == null) return;
    var left = pos, range = document.createRange(), done = false;
    (function rec(node) {
      for (var c = node.firstChild; c && !done; c = c.nextSibling) {
        if (c.nodeType === 3) {
          if (left <= c.length) { range.setStart(c, left); done = true; return; }
          left -= c.length;
        } else if (c.nodeName === 'BR') {
          if (left === 0) { range.setStartBefore(c); done = true; return; }
          left -= 1;
        } else rec(c);
      }
    })(el);
    if (!done) { range.selectNodeContents(el); range.collapse(false); } else range.collapse(true);
    var sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }

  function startEdit(el, cx, cy) {
    var key = M.block.get(el);
    if (!key || (S.edit && S.edit.el === el)) return;
    stopEdit();
    closePop();
    closePanelIf('image');
    var ed = S.edit = { el: el, key: key, last: core.sanitize(el.innerHTML), timer: 0, composing: false };
    ed.on = {
      input: onInput, paste: onPaste, beforeinput: onBeforeInput, focusout: onFocusOut,
      // 한글 등 IME 조합 중에는 글 상자 노드를 갈아 끼우면 조합이 깨져 글자가 겹쳐 들어간다 -> 조합이 끝날 때까지 확정을 미룬다
      compositionstart: function () { ed.composing = true; },
      compositionend: function () { ed.composing = false; arm(ed); },
      drop: function (e) { e.preventDefault(); }, dragover: function (e) { e.preventDefault(); }
    };
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    Object.keys(ed.on).forEach(function (t) { el.addEventListener(t, ed.on[t]); });
    el.focus({ preventScroll: true });
    var r = cx != null ? caretAt(cx, cy) : null;
    var sel = getSelection();
    if (r && el.contains(r.startContainer)) { sel.removeAllRanges(); sel.addRange(r); }
    else { var rr = document.createRange(); rr.selectNodeContents(el); rr.collapse(false); sel.removeAllRanges(); sel.addRange(rr); }
    syncTool();
    renderNow(); // 툴바가 클릭 직후 바로 보이도록 즉시 그린다
  }
  function commit(keepCaret) {
    var ed = S.edit;
    if (!ed || ed.composing) return false;
    clearTimeout(ed.timer);
    var html = core.sanitize(ed.el.innerHTML);
    if (html === ed.last) return false;
    var pos = keepCaret ? saveCaret(ed.el) : null;
    core.setBlockHtml(ed.key, html);
    ed.last = core.sanitize(ed.el.innerHTML);
    if (keepCaret) restoreCaret(ed.el, pos);
    afterChange();
    return true;
  }
  function flush() { if (S.edit) commit(true); }
  function stopEdit() {
    var ed = S.edit;
    if (!ed) return;
    if (ed.composing) { // 조합 중에 편집을 끝내야 하면 먼저 브라우저가 조합을 확정하게 한다 (blur 로 마지막 글자를 잃지 않음)
      ed.composing = false;
      Object.keys(ed.on).forEach(function (t) { ed.el.removeEventListener(t, ed.on[t]); });
      ed.on = {};
      safe(function () { ed.el.blur(); });
    }
    commit(false);
    S.edit = null;
    Object.keys(ed.on).forEach(function (t) { ed.el.removeEventListener(t, ed.on[t]); });
    ed.el.removeAttribute('contenteditable');
    ed.el.removeAttribute('spellcheck');
    UI.tool.hidden = true;
    safe(function () { ed.el.blur(); });
    schedule();
  }
  // 입력이 멈춘 뒤 700ms 에 확정한다 (조합 중이면 조합이 끝날 때 다시 건다)
  function arm(ed) {
    clearTimeout(ed.timer);
    ed.timer = setTimeout(function () { if (S.edit === ed && !ed.composing) commit(true); }, 700);
  }
  function onInput() {
    var ed = S.edit;
    if (!ed) return;
    S.dirty = true; UI.dirty.hidden = false;
    arm(ed);
    schedule();
  }
  function insertPlain(t) {
    t.replace(/\r\n?/g, '\n').split('\n').forEach(function (p, i) {
      if (i) document.execCommand('insertLineBreak');
      if (p) document.execCommand('insertText', false, p);
    });
  }
  function onPaste(e) {
    e.preventDefault();
    var cd = e.clipboardData || window.clipboardData;
    insertPlain(cd ? cd.getData('text/plain') || '' : '');
  }
  // Enter 는 새 블록(div/p)이 아니라 <br> 로 처리한다
  function onBeforeInput(e) {
    if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') {
      e.preventDefault();
      lineBreak();
    } else if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop' || e.inputType === 'insertFromYank') {
      e.preventDefault();
    }
  }
  // 이 자리에 <br> 를 넣으면 화면에 줄바꿈으로 나타나는가? (flex/grid 칸 안의 <br>, CSS 로 감춘 <br> 는 보이지 않는다)
  function breakVisible() {
    var ed = S.edit, sel = getSelection();
    if (!ed || !sel.rangeCount) return true;
    if (/flex|grid/.test(getComputedStyle(ed.el).display)) return false;
    var n = sel.getRangeAt(0).startContainer, p = n.nodeType === 1 ? n : n.parentElement;
    if (!p || !ed.el.contains(p)) return true;
    if (/flex|grid/.test(getComputedStyle(p).display)) return false;
    var probe = document.createElement('br');
    p.appendChild(probe);
    var shown = getComputedStyle(probe).display !== 'none';
    p.removeChild(probe);
    return shown;
  }
  // Enter 와 Shift+Enter 는 항상 <br> 한 개. 줄바꿈이 보이지 않는 글 상자에서는 넣지 않고 알려 준다.
  function lineBreak() {
    if (!breakVisible()) { setStatus('이 글 상자에서는 줄바꿈이 화면에 나타나지 않아 넣지 않았습니다.', 'warn'); return; }
    document.execCommand('insertLineBreak');
  }
  function onFocusOut(e) {
    var rt = e.relatedTarget;
    if (rt === host || (rt && S.edit && S.edit.el.contains(rt))) return;
    if (!rt && !document.hasFocus()) return;
    stopEdit();
  }

  // 미니 툴바 (글자 서식)
  function curStyle(key) {
    var c = core.collect() || {}, e = null;
    (c.texts || []).forEach(function (x) { if (x.k === key) e = x; });
    return { fs: e && e.fs != null ? e.fs : null, color: e && e.color != null ? e.color : null };
  }
  function effFs() { return S.edit ? Math.round(parseFloat(getComputedStyle(S.edit.el).fontSize)) : 0; }
  function syncTool() {
    if (!S.edit) return;
    var fs = effFs();
    UI.fs.value = fs;
    UI.color.value = toHex(getComputedStyle(S.edit.el).color);
    UI.warn.hidden = fs >= WARN_FS;
    UI.warn.textContent = '글자 크기 ' + fs + 'px · 40대 이상 독자 기준 최소 ' + WARN_FS + 'px';
  }
  function setStyle(patch) {
    if (!S.edit) return;
    flush();
    var cs = curStyle(S.edit.key);
    var fs = 'fs' in patch ? patch.fs : cs.fs, color = 'color' in patch ? patch.color : cs.color;
    core.setBlockStyle(S.edit.key, { fs: fs, color: color });
    afterChange();
    syncTool();
  }
  function setFs(v) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) { syncTool(); return; }
    setStyle({ fs: clamp(n, 10, 200) });
  }
  function execBold() {
    if (!S.edit) return;
    S.edit.el.focus({ preventScroll: true });
    document.execCommand('bold');
    onInput();
  }
  function revertBlock() {
    if (!S.edit) return;
    var ed = S.edit;
    core.revert('text', ed.key);
    ed.last = core.sanitize(ed.el.innerHTML);
    afterChange();
    syncTool();
  }

  // 섹션 ---------------------------------------------------------------
  function toggleSection(key) {
    var rec = R.sections.get(key);
    if (!rec) return;
    stopEdit();
    var hid = !rec.el.hasAttribute('data-de-hidden');
    core.setHidden(key, hid);
    unhideInEdit();
    afterChange();
    setStatus(hid ? '섹션을 숨겼습니다. 저장하면 공개 페이지에서 사라집니다.' : '섹션을 다시 보이게 했습니다.');
  }

  // 섹션 배치: 위치 이동 · 여백 · 배경색 --------------------------------------
  var DIRS = { up: '위로 한 칸', down: '아래로 한 칸', top: '맨 위로', bottom: '맨 아래로' };
  var EDGE_TIP = '같은 구역 안에서만 옮길 수 있어요';
  var RISK_TIP = '위치에 따라 모양이 달라질 수 있어요';
  function groupsNow() { return safe(function () { return core.layout.groups(); }) || []; }
  function posOf(item) {
    var gs = groupsNow();
    for (var i = 0; i < gs.length; i++) {
      var j = gs[i].keys.map(itemKey).indexOf(item);
      if (j >= 0) return { i: j, n: gs[i].keys.length };
    }
    return null;
  }
  // 코어가 내장 상수로 알려 주는 "옮기면 모양이 달라지는 섹션 / 배경색이 안 보이는 섹션" (원본 문서 순서의 인덱스)
  function riskOf(item) {
    var r = safe(function () { return core.layout.risk(); }) || {}, i = S.sidx[item];
    return { order: i != null && (r.order || []).indexOf(i) >= 0, bg: i != null && (r.bgNoEffect || []).indexOf(i) >= 0 };
  }
  function tbItem() { return S.pop ? S.pop.item : S.tbFor ? M.sec.get(S.tbFor) : null; }
  function layoutOf() { var c = safe(function () { return core.collect(); }); return (c && c.layout) || {}; }
  function curGap(item) {
    var e = (layoutOf().gaps || []).filter(function (x) { return x.k === item; })[0] || {};
    return { top: e.top == null ? null : e.top, bottom: e.bottom == null ? null : e.bottom };
  }
  function curBg(item) {
    var e = (layoutOf().secbg || []).filter(function (x) { return x.k === item; })[0];
    return e ? String(e.color).toLowerCase() : null;
  }
  var MAX_CLONES = 40;
  function isClone(item) { var r = R.sections.get(item); return !!r && r.kind === 'clone'; }
  function cloneCount() { return ((layoutOf().clones) || []).length; }
  function cloneSec(item) {
    var rec = R.sections.get(item);
    if (!rec || rec.kind === 'clone') return;
    if (cloneCount() >= MAX_CLONES) { setStatus('복제본은 한 페이지에 ' + MAX_CLONES + '개까지 만들 수 있어요.', 'warn'); return; }
    stopEdit(); closePop();
    var id = safe(function () { return core.cloneSection(item); });
    if (!id) { setStatus('복제하지 못했습니다.', 'error'); return; }
    reindex();
    afterChange();
    var nr = R.sections.get(id);
    if (nr) {
      var r = nr.el.getBoundingClientRect(), bh = UI.bar.hidden ? 0 : UI.bar.offsetHeight;
      if (r.top < bh + 8 || r.top > innerHeight - 80) safe(function () { window.scrollBy({ top: r.top - bh - 60, left: 0, behavior: 'instant' }); });
    }
    schedule();
    setStatus('섹션을 복제했습니다. 복제본은 원본 바로 아래에 있고, 글과 이미지를 따로 고칠 수 있어요.');
  }
  function delClone(item) {
    var rec = R.sections.get(item);
    if (!rec || rec.kind !== 'clone') return Promise.resolve();
    stopEdit();
    return dialog({
      title: '복제본을 삭제할까요?',
      body: '이 복제본과 안에서 고친 글·이미지가 함께 사라집니다. 저장하기 전에는 실행 취소(Ctrl+Z)로 되살릴 수 있어요.',
      buttons: [{ label: '삭제', value: 'ok', primary: true }, { label: '취소', value: 'x' }]
    }).then(function (v) {
      if (v !== 'ok' || !R.sections.has(item)) return;
      closePop();
      if (!safe(function () { return core.removeClone(item); })) { setStatus('삭제하지 못했습니다.', 'error'); return; }
      reindex();
      afterChange();
      setStatus('복제본을 삭제했습니다.');
    });
  }
  function moveSec(item, dir) {
    var rec = R.sections.get(item);
    if (!rec) return;
    stopEdit();
    var y0 = rec.el.getBoundingClientRect().top;
    if (!safe(function () { return core.moveSection(item, dir); })) { setStatus('더 옮길 수 없습니다. ' + EDGE_TIP + '.', 'warn'); return; }
    // 옮긴 섹션이 보던 자리에 그대로 보이도록 스크롤을 맞춘다 (도구 모음이 마우스 아래에 남는다)
    var dy = rec.el.getBoundingClientRect().top - y0;
    if (dy && safe(function () { window.scrollBy({ top: dy, left: 0, behavior: 'instant' }); }) === null) window.scrollBy(0, dy);
    afterChange();
    var risky = riskOf(item).order;
    setStatus('섹션을 ' + DIRS[dir] + ' 옮겼습니다. 저장하면 공개 페이지에 반영됩니다.' + (risky ? ' 이 섹션은 ' + RISK_TIP + '. 화면을 확인해 주세요.' : ''), risky ? 'warn' : '');
  }
  // WCAG 대비 계산
  function rgbOf(c) {
    var m = /rgba?\(([^)]*)\)/.exec(c || '');
    if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
  }
  function lum(c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  // 섹션 안 글 상자(최대 50개) 가운데 새 바탕색과 대비가 모자란 곳의 수. 자기 바탕을 따로 칠한 상자(카드 등)는 섹션 바탕 위에 있지 않으므로 뺀다.
  function lowContrast(sec, hex) {
    var bg = rgbOf('rgb(' + [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }).join(',') + ')'), n = 0, bad = 0;
    R.blocks.forEach(function (v) {
      var el = v.el;
      if (n >= 50 || el === sec || !sec.contains(el) || !el.getClientRects().length) return;
      for (var a = el; a && a !== sec; a = a.parentElement) { if (paints(getComputedStyle(a))) return; }
      var cs = getComputedStyle(el), c = rgbOf(cs.color);
      if (!c) return;
      n++;
      var t = c.a < 1 ? { r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a) } : c;
      var fs = parseFloat(cs.fontSize), large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      if (ratio(t, bg) < (large ? 3 : 4.5)) bad++;
    });
    return bad;
  }
  function baseBg(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) { var c = getComputedStyle(n).backgroundColor; if (alphaOf(c) >= 1) return toHex(c); }
    return '#ffffff';
  }
  function openPop(kind, item) {
    if (S.pop && S.pop.kind === kind && S.pop.item === item) { closePop(true); return; }
    stopEdit();
    S.pop = { kind: kind, item: item };
    UI.popT.textContent = kind === 'gap' ? '섹션 여백' : '섹션 배경색';
    UI.pop.setAttribute('aria-label', UI.popT.textContent);
    UI.popGap.hidden = kind !== 'gap'; UI.popBg.hidden = kind !== 'bg';
    syncPop(true);
    renderNow();
    (kind === 'gap' ? UI.gt : UI.bgc).focus({ preventScroll: true });
  }
  function closePop(refocus) {
    var P = S.pop;
    if (!P) return;
    S.pop = null; UI.pop.hidden = true;
    renderNow();
    if (refocus) (P.kind === 'gap' ? UI.gapBtn : UI.bgBtn).focus({ preventScroll: true });
  }
  // 팝오버 안의 값을 코어 상태에 맞춘다 (되돌리기·원본으로 뒤에도 호출). force 가 아니면 입력 중인 칸은 건드리지 않는다.
  function syncPop(force) {
    var P = S.pop;
    if (!P) return;
    var rec = R.sections.get(P.item);
    if (!rec) { closePop(); return; }
    if (P.kind === 'gap') {
      var cg = safe(function () { return core.computedGap(P.item); }) || { top: 0, bottom: 0 }, o = curGap(P.item);
      [['top', UI.gt], ['bottom', UI.gb]].forEach(function (x) {
        if (!force && root.activeElement === x[1]) return;
        x[1].value = String(o[x[0]] != null ? o[x[0]] : clamp(Math.round(cg[x[0]]), 0, 400));
      });
      return;
    }
    var c = curBg(P.item), v = c || baseBg(rec.el), bad = c ? lowContrast(rec.el, c) : 0;
    if (UI.bgc.value !== v) UI.bgc.value = v;
    UI.bgStrong.hidden = !riskOf(P.item).bg;
    UI.bgWarn.hidden = !bad;
    UI.bgWarn.textContent = bad ? '글자와 대비가 낮아요 (' + bad + '곳)' : '';
  }
  function onGapInput(side, fld, final) {
    var P = S.pop;
    if (!P || P.kind !== 'gap') return;
    var raw = fld.value.trim(), v = raw === '' ? null : Math.round(Number(raw)), o = curGap(P.item);
    o[side] = v == null || isNaN(v) ? null : clamp(v, 0, 400);
    core.setGap(P.item, o);
    afterChange(false, 'gap:' + P.item + ':' + side);
    if (final) syncPop(true);
  }
  function onBgInput() {
    var P = S.pop;
    if (!P || P.kind !== 'bg') return;
    core.setSectionBg(P.item, UI.bgc.value);
    afterChange(false, 'bg:' + P.item);
  }
  function revertGap() {
    var P = S.pop;
    if (!P) return;
    core.setGap(P.item, { top: null, bottom: null });
    afterChange(); syncPop(true);
    setStatus('여백을 원본으로 되돌렸습니다.');
  }
  function revertBgColor() {
    var P = S.pop;
    if (!P) return;
    core.setSectionBg(P.item, null);
    afterChange(); syncPop(true);
    setStatus('배경색을 원본으로 되돌렸습니다.');
  }
  // 호버 도구 모음 배치·상태 갱신 (render 에서 부른다). 포인터가 도구 모음 자리 위에 있을 때 막 나타난 도구 모음이 아래 글 상자를 가리지 않게 한다.
  function updateSecTool(se, barH, byHover) {
    var tb = UI.sectool, sr = rectOf(se), item = se && M.sec.get(se);
    if (!sr || !item || S.dlg || (!S.pop && (sr.bottom <= barH + 2 || sr.top >= innerHeight - 2))) { tb.hidden = true; S.tbFor = null; return; }
    var lbl = se.hasAttribute('data-de-hidden') ? '섹션 보이기' : '섹션 숨기기', pos = posOf(item) || { i: 0, n: 1 }, cl = isClone(item), full = cloneCount() >= MAX_CLONES;
    UI.cloneBtn.hidden = cl || typeof core.cloneSection !== 'function'; UI.delBtn.hidden = !cl; UI.ctag.hidden = !cl; UI.secbtn.hidden = cl;
    UI.cloneBtn.disabled = full;
    UI.cloneBtn.title = full ? '복제본은 ' + MAX_CLONES + '개까지 만들 수 있어요' : UI.cloneBtn.getAttribute('data-tip');
    if (UI.secbtn.textContent !== lbl) UI.secbtn.textContent = lbl;
    [[UI.mvUp, pos.i === 0], [UI.mvTop, pos.i === 0], [UI.mvDown, pos.i >= pos.n - 1], [UI.mvBottom, pos.i >= pos.n - 1]].forEach(function (x) {
      x[0].disabled = x[1];
      x[0].title = x[1] ? EDGE_TIP : x[0].getAttribute('data-tip');
    });
    UI.risk.hidden = !riskOf(item).order;
    UI.gapBtn.setAttribute('aria-expanded', S.pop && S.pop.kind === 'gap' ? 'true' : 'false');
    UI.bgBtn.setAttribute('aria-expanded', S.pop && S.pop.kind === 'bg' ? 'true' : 'false');
    tb.hidden = false;
    tb.style.left = '4px';
    var tw = tb.offsetWidth, th = tb.offsetHeight;
    var left = clamp(sr.right - tw - 4, 4, Math.max(4, innerWidth - tw - 4));
    var top = clamp(Math.max(sr.top, barH) + 8, barH + 4, Math.max(barH + 4, innerHeight - th - 4));
    if (byHover && !S.pop && S.tbFor !== se && S.mx >= left && S.mx <= left + tw && S.my >= top && S.my <= top + th) { tb.hidden = true; S.tbFor = null; return; }
    S.tbFor = se;
    tb.style.left = left + 'px'; tb.style.top = top + 'px';
    var ae = root.activeElement;
    if (ae && ae.disabled && tb.contains(ae)) (cl ? UI.delBtn : UI.secbtn).focus({ preventScroll: true });
  }
  function placePop(barH) {
    var P = UI.pop;
    P.hidden = !S.pop || UI.sectool.hidden;
    if (P.hidden) return;
    P.style.left = '4px';
    var pw = P.offsetWidth, ph = P.offsetHeight, tr = UI.sectool.getBoundingClientRect(), br = (S.pop.kind === 'gap' ? UI.gapBtn : UI.bgBtn).getBoundingClientRect();
    var pt = tr.bottom + 4;
    if (pt + ph > innerHeight - 4) pt = Math.max(barH + 4, tr.top - ph - 4);
    P.style.left = clamp(br.left, 4, Math.max(4, innerWidth - pw - 4)) + 'px';
    P.style.top = pt + 'px';
  }

  // 이미지 -------------------------------------------------------------
  function urlOfBg(el) {
    var m = /url\((['"]?)(.*?)\1\)/.exec(getComputedStyle(el).backgroundImage || '');
    return m ? m[2] : '';
  }
  function curUrl(c) { return c.kind === 'img' ? c.rec.el.src : urlOfBg(c.rec.el); }
  // 돋보기처럼 <img> 와 CSS 배경이 "같은 원본 파일" 을 칠하는 짝. 한쪽을 바꾸거나 되돌리면 짝도 함께 처리한다.
  //  - <img> 를 고르면: 원래 주소가 같은 모든 CSS 배경
  //  - 배경을 고르면: 원래 주소가 같은 다른 배경 + 그 배경과 같은 부모 안에 있고 원래 주소가 같은 <img>
  function absUrl(u) { try { return new URL(String(u || ''), document.baseURI).href; } catch { return String(u || ''); } }
  function linksOf(c) {
    var out = [];
    if (c.kind === 'img') {
      var a = absUrl(c.rec.origSrc);
      R.bgs.forEach(function (v, k) { if (absUrl(v.origUrl) === a) out.push({ kind: 'bg', key: k }); });
    } else {
      var b = absUrl(c.rec.origUrl), scope = c.rec.el.parentElement;
      R.bgs.forEach(function (v, k) { if (k !== c.key && absUrl(v.origUrl) === b) out.push({ kind: 'bg', key: k }); });
      R.images.forEach(function (v, k) { if (scope && scope.contains(v.el) && absUrl(v.origSrc) === b) out.push({ kind: 'img', key: k }); });
    }
    return out;
  }
  function setPic(x, url) { if (x.kind === 'img') core.setImage(x.key, { src: url }); else core.setBg(x.key, url); }
  function revertPic(x) { core.revert(x.kind === 'img' ? 'image' : 'bg', x.key); }
  function openImage(kind, key) {
    stopEdit();
    var rec = kind === 'img' ? R.images.get(key) : R.bgs.get(key);
    if (!rec) return;
    S.imgCtx = { kind: kind, key: key, rec: rec };
    openPanel('image');
  }
  function imgErr(e) {
    var s = e && e.status;
    if (s === 401) { writeDraft(); return '로그인이 만료되었습니다. 새 탭에서 다시 로그인한 뒤 올려 주세요. (수정 내용은 임시 저장됩니다)'; }
    if (s === 413) return '파일이 너무 큽니다. 더 작은 이미지를 올려 주세요.';
    if (s === 415) return '지원하지 않는 형식입니다. png, jpg, webp, gif만 올릴 수 있습니다.';
    if (s === 0) return '네트워크 오류로 올리지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';
    if (e && e.decode) return '이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.';
    return s >= 400 && s < 500 && e.message ? e.message : '업로드하지 못했습니다. 잠시 뒤 다시 시도해 주세요.' + (s ? ' (오류 ' + s + ')' : '');
  }
  function loadBitmap(file) {
    if (window.createImageBitmap) return createImageBitmap(file).catch(function () { throw { decode: 1 }; });
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej({ decode: 1 }); };
      im.src = u;
    });
  }
  function hasAlpha(cv) {
    var d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    for (var i = 3; i < d.length; i += 64) { if (d[i] < 250) return true; }
    return false;
  }
  function toBlob(cv, type, q) {
    return new Promise(function (res) { cv.toBlob(res, type, q); });
  }
  function fit(cv, type, qi, qs) {
    return toBlob(cv, type, qs[qi]).then(function (b) {
      if (b && b.size <= MAX_BYTES) return b;
      if (qi < qs.length - 1) return fit(cv, type, qi + 1, qs);
      if (cv.width < 500) return b;
      var c2 = document.createElement('canvas');
      c2.width = Math.round(cv.width * 0.85); c2.height = Math.round(cv.height * 0.85);
      c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height);
      return fit(c2, type, 0, qs);
    });
  }
  // 1720px 보다 넓거나 3.5MB 보다 크면 줄여서 다시 인코딩 (플랫폼 본문 한도 4.5MB 보다 작게)
  function prepare(file) {
    return loadBitmap(file).then(function (bm) {
      var w = bm.width, hh = bm.height;
      if (file.size <= MAX_BYTES && w <= MAX_W) { if (bm.close) bm.close(); return { file: file, note: '' }; }
      var sc = Math.min(1, MAX_W / w);
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(w * sc)); cv.height = Math.max(1, Math.round(hh * sc));
      cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height);
      if (bm.close) bm.close();
      var alpha = file.type !== 'image/jpeg' && hasAlpha(cv);
      var type = alpha ? 'image/webp' : 'image/jpeg';
      return fit(cv, type, 0, [0.9, 0.8, 0.7, 0.6]).then(function (b) {
        if (!b || b.size > 4.2 * 1024 * 1024) throw { status: 413 };
        var base = (file.name || 'image').replace(/\.[^.]+$/, '');
        var out = new File([b], base + (b.type === 'image/webp' ? '.webp' : '.jpg'), { type: b.type });
        return { file: out, note: file.type === 'image/gif' ? ' (움직이는 GIF는 첫 장면만 올라갑니다)' : '' };
      });
    });
  }
  function upload(file, onProg) {
    return new Promise(function (res, rej) {
      var fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('subdir', 'detail-concepts');
      var x = new XMLHttpRequest();
      x.open('POST', ORIGIN + '/api/admin/upload');
      x.timeout = 90000;
      x.upload.onprogress = function (e) { if (e.lengthComputable) onProg(e.loaded / e.total); };
      x.onload = function () {
        var j = {};
        try { j = JSON.parse(x.responseText) || {}; } catch { j = {}; }
        if (x.status >= 200 && x.status < 300 && j.success && j.url) res(j);
        else rej({ status: x.status, message: typeof j.message === 'string' ? j.message : '' });
      };
      x.onerror = x.ontimeout = function () { rej({ status: 0 }); };
      x.send(fd);
    });
  }
  function handleFile(file) {
    var P = UI.ip;
    if (!file || !P) return;
    var c = S.imgCtx;
    P.msg.textContent = ''; P.msg.setAttribute('data-kind', '');
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      P.msg.textContent = '지원하지 않는 형식입니다. png, jpg, webp, gif만 올릴 수 있습니다.'; P.msg.setAttribute('data-kind', 'error'); return;
    }
    P.prog.hidden = false; P.prog.removeAttribute('value');
    P.msg.textContent = '이미지를 준비하는 중…';
    prepare(file).then(function (p) {
      P.msg.textContent = '올리는 중…';
      return upload(p.file, function (f) { P.prog.value = f; }).then(function (j) { return { j: j, note: p.note }; });
    }).then(function (o) {
      var url = new URL(o.j.url, ORIGIN).href; // 로컬 저장소는 '/uploads/...' 로 주므로 <base> 와 무관하게 이 문서 기준 절대 주소로 만든다
      if (S.imgCtx !== c) return;
      var pair = linksOf(c);
      setPic(c, url);
      pair.forEach(function (x) { setPic(x, url); });
      P.prog.hidden = true;
      afterChange();
      P.msg.textContent = '이미지를 교체했습니다.' + (pair.length ? ' 같은 사진을 쓰는 확대(돋보기) 부분도 함께 바뀌었습니다.' : '') + o.note; P.msg.setAttribute('data-kind', 'ok');
    }).catch(function (e) {
      P.prog.hidden = true;
      P.msg.textContent = imgErr(e); P.msg.setAttribute('data-kind', 'error');
    });
  }

  // 패널 ---------------------------------------------------------------
  function panelTitle(n) { return { sections: '섹션 목록', history: '변경 이력', export: '내보내기', image: '이미지 교체', orphans: '적용되지 못한 수정' }[n]; }
  function openPanel(name) {
    closePop();
    if (name !== 'image') stopEdit();
    S.panel = name;
    UI.panel.hidden = false;
    refreshPanel(true);
    UI.panel.focus({ preventScroll: true });
    schedule();
  }
  function closePanel() { S.panel = null; UI.ip = null; UI.panel.hidden = true; schedule(); }
  function closePanelIf(n) { if (S.panel === n) closePanel(); }
  function refreshPanel(full) {
    if (!S.panel) return;
    var p = S.panel;
    if (p === 'image' && UI.ip && !full) { syncImage(); return; }
    if (p === 'history' && !full) return;
    UI.pt.textContent = panelTitle(p);
    UI.panel.setAttribute('aria-label', panelTitle(p));
    var ctl = function () { return Array.prototype.slice.call(UI.pb.querySelectorAll('button,input')); };
    var fi = full ? -1 : ctl().indexOf(root.activeElement); // 다시 그릴 때 키보드 포커스 위치 유지
    UI.pb.textContent = '';
    UI.ip = null;
    ({ sections: buildSections, history: buildHistory, export: buildExport, image: buildImage, orphans: buildOrphans })[p](UI.pb);
    if (fi >= 0 && ctl()[fi]) ctl()[fi].focus({ preventScroll: true });
  }
  // 섹션이 원본과 달라졌는가: 숨김·여백·배경색·순서·안쪽 글/이미지/배경 수정
  function secChanged(item, rec, moved) {
    if (moved || safe(function () { return core.isChanged('hidden', item) || core.isChanged('gap', item) || core.isChanged('secbg', item); })) return true;
    var hit = false;
    [['text', R.blocks], ['image', R.images], ['bg', R.bgs]].forEach(function (x) {
      if (!hit) x[1].forEach(function (v, k) { if (!hit && rec.el.contains(v.el) && safe(function () { return core.isChanged(x[0], k); })) hit = true; });
    });
    return hit;
  }
  // 그룹마다 원본 순서와 달라진 원본 섹션 (복제본은 따지지 않는다)
  function movedSet() {
    var out = {};
    groupsNow().forEach(function (g) {
      var ks = g.keys.map(itemKey).filter(function (k) { return !isClone(k); });
      var by = ks.slice().sort(function (a, c) { return S.sidx[a] - S.sidx[c]; });
      ks.forEach(function (k, i) { if (by[i] !== k) out[k] = 1; });
    });
    return out;
  }
  function buildSections(b) {
    var rows = [], mv = movedSet();
    R.sections.forEach(function (rec, k) { rows.push({ k: k, rec: rec }); });
    rows.sort(function (a, c) { return inDoc(a.rec.el, c.rec.el); });
    if (!rows.length) { b.appendChild(h('p', { class: 'dim', text: '이 페이지에서 나눌 수 있는 섹션이 없습니다.' })); return; }
    var ul = h('ul', { class: 'list' });
    rows.forEach(function (r, i) {
      var hid = r.rec.el.hasAttribute('data-de-hidden'), cl = r.rec.kind === 'clone', pos = posOf(r.k) || { i: 0, n: 1 }, chg = secChanged(r.k, r.rec, mv[r.k]);
      var n = i + 1, mk = (cl ? ['복제본'] : []).concat(chg ? ['변경됨'] : []);
      function rb(label, act, tip, dis, fn) {
        var o = { 'aria-label': n + '번 섹션 ' + tip, 'data-item': r.k, onclick: fn };
        if (dis) { o.disabled = true; o.title = EDGE_TIP; } else o.title = tip;
        return btn(label, act, o);
      }
      ul.appendChild(h('li', { class: (hid ? 'off ' : '') + (cl ? 'clone' : ''), 'data-item': r.k }, [
        h('span', { class: 'lbl', text: n + '. ' + (cl ? '복제본 · ' : '') + (r.rec.label || '(이름 없음)') + (hid ? ' · 숨김' : '') }),
        mk.length ? h('span', { class: 'mk', 'data-act': 'sec-mark', text: mk.join(' · ') }) : null,
        rb('▲', 'sec-row-up', '위로 한 칸 옮기기', pos.i === 0, function () { rowMove(r.k, 'up', 'sec-row-up'); }),
        rb('▼', 'sec-row-down', '아래로 한 칸 옮기기', pos.i >= pos.n - 1, function () { rowMove(r.k, 'down', 'sec-row-down'); }),
        btn('이동', 'sec-go', { 'aria-label': n + '번 섹션으로 이동', 'data-item': r.k, onclick: function () { r.rec.el.scrollIntoView({ block: 'start', behavior: 'auto' }); schedule(); } }),
        cl ? btn('삭제', 'sec-row-del', { 'aria-label': n + '번 복제본 삭제', onclick: function () { delClone(r.k); } })
          : btn(hid ? '보이기' : '숨기기', 'sec-toggle-row', { 'aria-pressed': hid ? 'true' : 'false', 'aria-label': n + '번 섹션 ' + (hid ? '보이기' : '숨기기'), onclick: function () { toggleSection(r.k); } })
      ]));
    });
    b.appendChild(ul);
  }
  // 목록에서 옮긴 뒤에도 키보드 초점이 그 섹션의 같은 단추에 남게 한다 (끝에 닿아 꺼졌으면 '이동' 단추로)
  function rowMove(item, dir, act) {
    moveSec(item, dir);
    if (S.panel !== 'sections') return;
    var q = function (a) { return UI.pb.querySelector('[data-item="' + item + '"][data-act="' + a + '"]'); };
    var t = q(act);
    if (!t || t.disabled) t = q('sec-go');
    if (t) t.focus({ preventScroll: true });
  }
  function countsText(c) {
    var t = [];
    if (c.texts) t.push('글 ' + c.texts);
    if (c.images) t.push('이미지 ' + c.images);
    if (c.bgs) t.push('배경 ' + c.bgs);
    if (c.hidden) t.push('숨김 ' + c.hidden);
    if (c.layout) t.push('배치 ' + c.layout);
    return t.length ? t.join(' · ') : '수정 없음';
  }
  function buildHistory(b) {
    var box = h('div', { class: 'hist' }, [h('p', { class: 'dim', text: '불러오는 중…' })]);
    b.appendChild(box);
    api('GET', DOC_PATH + '/history').then(function (r) {
      if (r.status === 401) { box.textContent = ''; box.appendChild(h('p', { class: 'err', text: '로그인이 만료되었습니다.' })); expired(); return; }
      if (!r.ok || !r.json.success) throw 0;
      box.textContent = '';
      var vs = r.json.versions || [];
      if (!vs.length) { box.appendChild(h('p', { class: 'dim', text: '아직 저장된 이력이 없습니다.' })); return; }
      var ul = h('ul', { class: 'list' });
      vs.forEach(function (v) {
        var cur = v.version === S.version;
        ul.appendChild(h('li', { 'data-version': v.version }, [
          h('span', { class: 'lbl' }, [
            h('b', { text: 'v' + v.version + (cur ? ' (현재)' : '') }),
            h('span', { class: 'dim', text: ' ' + fmtTime(v.updatedAt) + ' · ' + (v.updatedBy || '알 수 없음') }),
            h('span', { class: 'dim blk', text: countsText(v.counts || {}) }),
            v.note ? h('span', { class: 'blk', text: v.note }) : null
          ]),
          cur ? null : btn('복원', 'restore', { 'aria-label': 'v' + v.version + '으로 복원', onclick: function () { restore(v.version); } })
        ]));
      });
      box.appendChild(ul);
    }).catch(function () {
      box.textContent = '';
      box.appendChild(h('p', { class: 'err', text: '이력을 불러오지 못했습니다.' }));
      box.appendChild(btn('다시 시도', 'hist-retry', { onclick: function () { refreshPanel(true); } }));
    });
  }
  function restore(v) {
    dialog({
      title: 'v' + v + '으로 복원할까요?',
      body: (S.dirty ? '저장하지 않은 수정은 사라집니다. ' : '') + '복원하면 그 내용이 새 버전으로 저장되고, 지금까지의 이력은 그대로 남습니다.',
      buttons: [{ label: '복원', value: 'ok', primary: true }, { label: '취소', value: 'x' }]
    }).then(function (a) {
      if (a !== 'ok') return;
      setStatus('복원하는 중…');
      return api('POST', DOC_PATH + '/history', { version: v, baseVersion: S.version }).then(function (r) {
        if (r.ok && r.json.success) return reloadServer('v' + v + ' 내용을 새 버전(v' + r.json.version + ')으로 복원했습니다.').then(function () { refreshPanel(true); });
        if (r.status === 401) return expired();
        if (r.status === 409) { setStatus('그사이 다른 곳에서 저장되었습니다. 이력을 새로 불러왔습니다.', 'warn'); return reloadServer().then(function () { refreshPanel(true); }); }
        setStatus(msgOf(r, '복원하지 못했습니다. (오류 ' + r.status + ')'), 'error');
      }, function () { setStatus('네트워크 오류로 복원하지 못했습니다.', 'error'); });
    });
  }
  function buildExport(b) {
    b.appendChild(h('p', { text: '지금 화면의 모습 그대로 HTML 파일 하나로 내려받습니다. 숨긴 섹션은 빠지고, 저장하지 않은 수정도 포함됩니다.' }));
    b.appendChild(btn('HTML 내려받기', 'export-go', { class: 'primary', onclick: exportHtml }));
  }
  function exportHtml() {
    stopEdit();
    var base = (document.querySelector('base') || {}).href || document.baseURI;
    if (base.slice(-1) !== '/') base += '/';
    var html;
    try { html = core.exportHtml({ base: base }); } catch { setStatus('내보내지 못했습니다.', 'error'); return; }
    var d = new Date();
    var name = SLUG + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.html';
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    var a = h('a', { href: url, download: name, hidden: true });
    root.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    setStatus(name + ' 파일을 내려받았습니다.', 'ok');
  }
  function orphList() {
    return Object.keys(S.orph).filter(function (k) { return !S.removed[k]; }).map(function (k) { return { k: k, o: S.orph[k] }; }).concat(layOrphList());
  }
  // 이 페이지에서 찾을 수 없는 섹션·원본을 가리키는 배치 항목 (원문이 바뀐 경우)
  function layOrphList() {
    var L = liveLayout(layoutOf()) || {}, out = [], ok = function (x) { return R.sections.has(x); };
    var cid = {};
    (L.clones || []).forEach(function (c) {
      cid[c.id] = 1;
      if (!ok(c.id) || !ok(c.of)) out.push({ k: 'L|c|' + c.id, lay: '복제본', txt: c.id + ' (원본 ' + c.of + ')', clone: c.id });
    });
    (L.sequence || []).forEach(function (e) { var x = itemKey(e); if (x && !ok(x) && !cid[x]) out.push({ k: 'L|s|' + x, lay: '순서', txt: x }); });
    (L.gaps || []).forEach(function (e) { if (!ok(e.k)) out.push({ k: 'L|g|' + e.k, lay: '여백', txt: e.k }); });
    (L.secbg || []).forEach(function (e) { if (!ok(e.k)) out.push({ k: 'L|b|' + e.k, lay: '배경색', txt: e.k + ' ' + e.color }); });
    return out;
  }
  // 고아 한 건 지우기 (복제본이면 그 복제본 안에서 고친 수정도 함께)
  function dropOrph(x) {
    S.removed[x.k] = 1;
    if (x.clone) Object.keys(S.orph).forEach(function (k) { if (k.indexOf(x.clone + '!') === 0) S.removed[k] = 1; });
  }
  function refreshOrph() {
    var n = orphList().length;
    UI.orphBtn.hidden = !n;
    UI.orphBtn.textContent = '원문이 바뀌어 적용되지 못한 수정 ' + n + '건';
  }
  function buildOrphans(b) {
    var l = orphList();
    if (!l.length) { b.appendChild(h('p', { class: 'dim', text: '적용되지 못한 수정이 없습니다.' })); return; }
    b.appendChild(h('p', { class: 'dim', text: '원문이 바뀌어 이 페이지에서 찾을 수 없는 수정입니다. 삭제한 뒤 저장하면 서버에서도 지워집니다.' }));
    var kind = { texts: '글', images: '이미지', bgs: '배경', hidden: '섹션' };
    var ul = h('ul', { class: 'list' });
    l.forEach(function (x) {
      ul.appendChild(h('li', {}, [
        h('span', { class: 'lbl' }, [h('b', { text: (x.lay ? '배치 · ' + x.lay : kind[x.o.name]) + ' ' }), x.lay ? x.txt : x.o.entry.o || x.o.entry.src || x.k]),
        btn('삭제', 'orph-del', { onclick: function () { dropOrph(x); afterChange(); } })
      ]));
    });
    b.appendChild(ul);
    b.appendChild(btn('모두 삭제', 'orph-del-all', { onclick: function () { l.forEach(dropOrph); afterChange(); } }));
  }
  function buildImage(b) {
    var c = S.imgCtx;
    var P = UI.ip = {};
    P.pv = h('img', { class: 'pv', alt: '현재 이미지 미리보기' });
    P.file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', hidden: true, 'data-act': 'file' });
    P.file.addEventListener('change', function () { handleFile(P.file.files[0]); P.file.value = ''; });
    P.drop = h('div', { class: 'drop', role: 'group', 'aria-label': '이미지 끌어다 놓기', 'data-act': 'drop' }, [
      h('span', { text: '여기에 이미지를 끌어다 놓거나' }), btn('파일 선택', 'pick', { onclick: function () { P.file.click(); } })
    ]);
    P.drop.addEventListener('dragover', function (e) { e.preventDefault(); P.drop.setAttribute('data-over', '1'); });
    P.drop.addEventListener('dragleave', function () { P.drop.removeAttribute('data-over'); });
    P.drop.addEventListener('drop', function (e) { e.preventDefault(); P.drop.removeAttribute('data-over'); handleFile(e.dataTransfer && e.dataTransfer.files[0]); });
    P.prog = h('progress', { max: 1, hidden: true, 'aria-label': '업로드 진행률' });
    P.msg = h('p', { class: 'msg', role: 'status' });
    b.appendChild(P.pv); b.appendChild(P.file); b.appendChild(P.drop); b.appendChild(P.prog); b.appendChild(P.msg);
    if (c.kind === 'img') {
      P.alt = h('input', { type: 'text', 'aria-label': '대체 텍스트(alt)', 'data-act': 'alt', placeholder: '이미지를 설명하는 문장' });
      P.alt.addEventListener('change', function () {
        flush();
        core.setImage(c.key, { alt: P.alt.value });
        afterChange();
      });
      b.appendChild(h('label', { class: 'fld' }, [h('span', { text: '대체 텍스트(alt)' }), P.alt]));
    }
    b.appendChild(btn('원본으로', 'img-revert', { onclick: function () {
      var pair = linksOf(c);
      revertPic(c);
      pair.forEach(revertPic);
      P.msg.textContent = '원본 이미지로 되돌렸습니다.'; afterChange();
    } }));
    syncImage();
  }
  function syncImage() {
    var c = S.imgCtx, P = UI.ip;
    if (!c || !P) return;
    P.pv.src = curUrl(c);
    if (P.alt && document.activeElement !== P.alt && root.activeElement !== P.alt) P.alt.value = c.rec.el.getAttribute('alt') || '';
  }

  // 대화 상자 ----------------------------------------------------------
  function dialog(o) {
    if (S.dlg) closeDlg('x');
    S.hov = {}; schedule();
    return new Promise(function (resolve) {
      var id = 'dt' + (++uid), first = null;
      var bs = o.buttons.map(function (b) {
        var n = btn(b.label, 'dlg-' + b.value, { class: b.primary ? 'primary' : '', onclick: function () { closeDlg(b.value); } });
        if (b.primary) first = n;
        return n;
      });
      var box = h('div', { class: 'dlg', role: o.alert ? 'alertdialog' : 'dialog', 'aria-modal': 'true', 'aria-labelledby': id }, [
        h('h2', { id: id, text: o.title }), h('p', { text: o.body }), h('div', { class: 'row' }, bs)
      ]);
      UI.dlgbg.textContent = ''; UI.dlgbg.appendChild(box); UI.dlgbg.hidden = false;
      S.dlg = { resolve: resolve, ret: root.activeElement || document.activeElement };
      (first || bs[0]).focus();
    });
  }
  function closeDlg(v) {
    var d = S.dlg;
    if (!d) return;
    S.dlg = null; UI.dlgbg.hidden = true; UI.dlgbg.textContent = '';
    if (d.ret && d.ret.focus && d.ret.isConnected) safe(function () { d.ret.focus({ preventScroll: true }); });
    d.resolve(v);
  }

  // 나가기 · 접기 -------------------------------------------------------
  function leave() {
    flush(); refreshDirty();
    var go = function () { S.leaving = true; location.href = LIST_URL; };
    if (!S.dirty) { go(); return; }
    dialog({
      title: '저장하지 않은 수정이 있습니다', body: '저장하지 않고 나가면 수정한 내용이 사라집니다.',
      buttons: [{ label: '저장하고 나가기', value: 'save', primary: true }, { label: '저장하지 않고 나가기', value: 'go' }, { label: '취소', value: 'x' }]
    }).then(function (v) {
      if (v === 'go') { safe(function () { localStorage.removeItem(DRAFT_KEY); }); go(); }
      else if (v === 'save') save().then(function () { if (!S.dirty) go(); });
    });
  }
  function setCollapsed(c) {
    S.collapsed = c;
    UI.bar.hidden = c; UI.reopen.hidden = !c;
    if (c) { stopEdit(); closePop(); closePanel(); }
    schedule();
    (c ? UI.reopen : UI.toggle).focus({ preventScroll: true });
  }
  function setStatus(msg, kind) {
    UI.status.textContent = msg || '';
    UI.status.setAttribute('data-kind', kind || '');
  }

  // 키보드로 항목 이동 (Alt+↑/↓, Enter)
  function moveCursor(dir) {
    if (!S.items.length) return;
    var i = S.cur ? S.items.indexOf(S.cur) : -1;
    if (i < 0) {
      var top = (UI.bar.hidden ? 0 : UI.bar.offsetHeight) + 4;
      i = dir > 0 ? -1 : S.items.length;
      for (var j = 0; j < S.items.length; j++) { if (S.items[j].el.getBoundingClientRect().bottom > top) { i = dir > 0 ? j - 1 : j + 1; break; } }
    }
    var n = clamp(i + dir, 0, S.items.length - 1);
    S.cur = S.items[n];
    var fa = root.activeElement || document.activeElement;
    if (fa && fa.blur) fa.blur();
    S.cur.el.scrollIntoView({ block: 'center', behavior: 'auto' });
    var lbl = S.cur.kind === 'text' ? '글' : '이미지';
    setStatus(lbl + ' ' + (n + 1) + '/' + S.items.length + ' — Enter로 ' + (S.cur.kind === 'text' ? '편집' : '교체') + ', Esc로 해제');
    schedule();
  }
  function activateCursor() {
    var c = S.cur;
    if (!c) return false;
    S.cur = null;
    if (c.kind === 'text') startEdit(c.el, null, null); else openImage(c.kind, c.key);
    return true;
  }

  // 전역 이벤트 --------------------------------------------------------
  function onKey(e) {
    var path = e.composedPath(), tgt = path[0], ui = path.indexOf(host) !== -1;
    var field = ui && tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA');
    var mod = e.metaKey || e.ctrlKey, k = e.key;
    if (S.dlg && k === 'Tab') {
      var f = Array.prototype.slice.call(UI.dlgbg.querySelectorAll('button')), ae = root.activeElement;
      if (f.length) {
        if (e.shiftKey && ae === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && ae === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
      return;
    }
    if (S.dlg && k !== 'Escape') return;
    // <summary> 안에서는 브라우저가 Space/Enter 를 "펼치기/접기" 로 가로채 글자가 들어가지 않는다 -> 직접 넣는다 (IME 조합 중에는 건드리지 않음)
    if (S.edit && !ui && !mod && !e.altKey && !e.isComposing && e.keyCode !== 229 && (k === ' ' || k === 'Enter') && S.edit.el.closest('summary')) {
      e.preventDefault();
      if (k === ' ') document.execCommand('insertText', false, ' '); else lineBreak();
      return;
    }
    if (mod && !e.altKey) {
      var l = k.toLowerCase();
      if (l === 's') { e.preventDefault(); save(); return; }
      if ((l === 'z' || l === 'y') && !field) { e.preventDefault(); if (l === 'y' || e.shiftKey) redo(); else undo(); return; }
      if (l === 'b' && S.edit && !ui) { e.preventDefault(); execBold(); return; }
    }
    if (k === 'Escape') {
      if (e.isComposing) return;
      e.preventDefault();
      if (S.dlg) closeDlg('x');
      else if (S.edit) stopEdit();
      else if (S.pop) closePop(true);
      else if (S.panel) closePanel();
      else if (S.cur) { S.cur = null; schedule(); }
      else setCollapsed(!S.collapsed);
      return;
    }
    if (e.altKey && !mod && ui && (k === 'ArrowDown' || k === 'ArrowUp') && !S.dlg) {
      var ae2 = root.activeElement, it2 = null, li2 = null;
      if (ae2 && UI.sectool.contains(ae2)) it2 = tbItem();
      else if (ae2 && S.panel === 'sections' && UI.pb.contains(ae2) && (li2 = ae2.closest('li'))) it2 = li2.getAttribute('data-item');
      if (it2 && R.sections.has(it2)) {
        e.preventDefault();
        var dr = k === 'ArrowUp' ? 'up' : 'down';
        if (li2) rowMove(it2, dr, ae2.getAttribute('data-act') === 'sec-go' ? 'sec-go' : dr === 'up' ? 'sec-row-up' : 'sec-row-down'); else moveSec(it2, dr);
        return;
      }
    }
    if (e.altKey && !mod && (k === 'ArrowDown' || k === 'ArrowUp') && !S.dlg) { e.preventDefault(); if (S.edit) stopEdit(); moveCursor(k === 'ArrowDown' ? 1 : -1); return; }
    if (k === 'Enter' && S.cur && !S.edit && !ui && !S.dlg && (tgt === document.body || tgt === document.documentElement)) { e.preventDefault(); activateCursor(); }
  }
  function onClick(e) {
    if (fromUI(e)) return;
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    if (t.closest && (t.closest('a') || t.closest('summary'))) e.preventDefault(); // 링크 이동, <details> 접힘/펼침 차단 (키보드로 일으킨 클릭 포함)
    if (e.button !== 0) return;
    if (S.edit && S.edit.el.contains(t)) return;
    var p = e.detail ? hitAt(e.clientX, e.clientY) : pick(t);
    if (p.img) { e.preventDefault(); openImage('img', M.img.get(p.img)); return; }
    if (p.block) { e.preventDefault(); startEdit(p.block, e.clientX, e.clientY); }
  }
  function onDown(e) {
    if (fromUI(e)) return;
    closePop();
    if (S.edit && !S.edit.el.contains(e.target)) stopEdit();
  }
  function onMove(e) {
    if (fromUI(e)) return;
    S.mx = e.clientX; S.my = e.clientY; S.hovDirty = true;
    schedule();
  }
  function onScroll() { S.hovDirty = true; schedule(); }

  // UI 생성 ------------------------------------------------------------
  var CSS = ':host{all:initial!important;position:fixed!important;left:0!important;top:0!important;width:0!important;height:0!important;display:block!important;z-index:2147483647!important;pointer-events:none!important;overflow:visible!important}' +
    '*{box-sizing:border-box;margin:0}[hidden]{display:none!important}' +
    '.ui{font:13px/1.45 system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;color:#f4f1ea;letter-spacing:0;text-transform:none;text-align:left;font-weight:400;font-style:normal;direction:ltr;text-shadow:none;-webkit-text-size-adjust:100%}' +
    'button,input{font:inherit;color:inherit;letter-spacing:0}' +
    'button{border:1px solid #4a463d;background:#2c2a26;border-radius:6px;padding:5px 10px;cursor:pointer;min-height:30px;white-space:nowrap}' +
    'button:hover{background:#3b3832}button:disabled{opacity:.5;cursor:default}' +
    'button.primary{background:#e0b84f;border-color:#e0b84f;color:#1b1a18;font-weight:600}button.primary:hover{background:#f0c85f}' +
    'button:focus-visible,input:focus-visible,[tabindex]:focus-visible{outline:2px solid #ffd54a;outline-offset:2px}' +
    'input{background:#12110f;border:1px solid #4a463d;border-radius:6px;padding:4px 8px;min-height:30px}' +
    '.layer{position:fixed;left:0;top:0;width:100vw;height:100vh;overflow:hidden;pointer-events:none}' +
    '.layer>div{position:absolute}' +
    '.hov{box-shadow:0 0 0 2px #fff,0 0 0 4px #1a73e8}.edt{box-shadow:0 0 0 2px #fff,0 0 0 4px #e0b84f}.cur{box-shadow:0 0 0 3px #fff,0 0 0 6px #7a3df0}' +
    '.strip{background:repeating-linear-gradient(135deg,rgba(15,15,15,.62) 0 14px,rgba(255,255,255,.28) 14px 28px)}' +
    '.strip span{position:absolute;left:8px;top:8px;background:#1b1a18;color:#ffd54a;padding:2px 8px;border-radius:4px;font-weight:600}' +
    '.chip{position:fixed;pointer-events:auto;background:#1a73e8;border-color:#fff;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4)}.chip:hover{background:#2f86ff}.chip.sec{background:#1b1a18;border-color:#e0b84f;color:#ffd54a}' +
    '.bar{position:fixed;left:0;right:0;top:0;pointer-events:auto;background:#1b1a18;border-bottom:1px solid #3a372f;box-shadow:0 2px 10px rgba(0,0,0,.35);padding:6px 10px;display:flex;flex-wrap:wrap;align-items:center;gap:6px}' +
    '.bar .ttl{font-weight:700;max-width:26ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dot{color:#ff9d57;font-size:16px;line-height:1}' +
    '.bar .sp{flex:1 1 8px}.bar .note{flex:0 1 170px;min-width:90px}' +
    '.status{flex:1 1 200px;min-width:120px;color:#cfc9bc}[data-kind=ok]{color:#7ee787}[data-kind=warn]{color:#ffd54a}[data-kind=error]{color:#ff8a80}' +
    '.reopen{position:fixed;right:8px;top:8px;pointer-events:auto;background:#1b1a18;border-color:#e0b84f}' +
    '.tool{position:fixed;pointer-events:auto;background:#1b1a18;border:1px solid #4a463d;border-radius:8px;padding:6px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;max-width:min(560px,calc(100vw - 8px));box-shadow:0 4px 14px rgba(0,0,0,.45)}' +
    '.tool .num{width:64px}.tool .clr{display:flex;align-items:center;gap:4px}.tool input[type=color]{padding:0;width:34px;height:30px}' +
    '.tool .warn{flex:1 0 100%;color:#ffd54a;font-size:12px}' +
    '.sectool{position:fixed;pointer-events:auto;display:flex;flex-wrap:wrap;align-items:center;gap:4px;max-width:min(560px,calc(100vw - 8px));background:#1b1a18;border:1px solid #4a463d;border-radius:8px;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,.4)}' +
    '.ctag{background:#e0b84f;color:#1b1a18;font-weight:700;font-size:12px;padding:2px 8px;border-radius:4px}.layer>.ctag{position:absolute;border-radius:0 0 6px 0;font-size:11px;padding:1px 8px}.mk{color:#e0b84f;font-size:12px;white-space:nowrap}.list li.clone{border-color:#e0b84f}' +
    '.sectool button{min-height:28px;padding:2px 8px}.sectool .chip{position:static;box-shadow:none}.sectool .risk{color:#ffd54a;border-color:#ffd54a;padding:2px 6px}' +
    '.pop{position:fixed;pointer-events:auto;width:min(300px,calc(100vw - 8px));background:#1b1a18;border:1px solid #e0b84f;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 24px rgba(0,0,0,.5)}' +
    '.popbody{display:flex;flex-direction:column;gap:8px}.pop .row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.pop .clr{display:flex;align-items:center;gap:4px}.pop .num{width:78px}.pop input[type=color]{padding:0;width:44px;height:32px}.pop .warn{color:#ffd54a;font-size:12px}' +
    '.panel{position:fixed;right:8px;width:min(360px,calc(100vw - 16px));overflow:auto;pointer-events:auto;background:#1b1a18;border:1px solid #4a463d;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.5)}' +
    '.panel header{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #3a372f;position:sticky;top:0;background:#1b1a18}.panel h2{font-size:14px}' +
    '.pb{padding:10px;display:flex;flex-direction:column;gap:10px}.dim{color:#a9a392}.err{color:#ff8a80}.blk{display:block}' +
    '.list{list-style:none;padding:0;display:flex;flex-direction:column;gap:6px}.list li{display:flex;align-items:center;gap:6px;border:1px solid #3a372f;border-radius:6px;padding:6px 8px}.list li.off{opacity:.7}.lbl{flex:1;min-width:0;overflow-wrap:anywhere}' +
    '.pv{max-width:100%;max-height:180px;object-fit:contain;background:#000;border-radius:6px;align-self:center}' +
    '.drop{border:2px dashed #6b6558;border-radius:8px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}.drop[data-over]{border-color:#e0b84f;background:#26231d}' +
    '.fld{display:flex;flex-direction:column;gap:4px}progress{width:100%}.msg{min-height:1.2em}' +
    '.dlgbg{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:auto;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px}' +
    '.dlg{background:#1b1a18;border:1px solid #e0b84f;border-radius:10px;padding:16px;width:min(440px,100%);display:flex;flex-direction:column;gap:12px}.dlg h2{font-size:15px}.dlg .row{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}';

  function mount() {
    host = document.createElement('div');
    host.id = 'de-root';
    root = host.attachShadow({ mode: 'open' });
    UI.layer = h('div', { class: 'layer', 'aria-hidden': 'true' }, [
      UI.hov = h('div', { class: 'hov', hidden: true }), UI.edt = h('div', { class: 'edt', hidden: true }), UI.cur = h('div', { class: 'cur', hidden: true })
    ]);
    UI.strips = []; UI.ctags = [];
    UI.badge = btn('이미지 교체', 'img-badge', { class: 'chip', hidden: true, onclick: function () {
      var p = S.hov, el = p.img || p.bg;
      if (el) openImage(p.img ? 'img' : 'bg', (p.img ? M.img : M.bg).get(el));
    } });
    UI.secbtn = btn('섹션 숨기기', 'sec-toggle', { class: 'chip sec', onclick: function () { var it = tbItem(); if (it) toggleSection(it); } });
    function mv(label, act, dir) {
      var tip = DIRS[dir] + ' 옮기기';
      return btn(label, act, { title: tip, 'data-tip': tip, 'aria-label': '섹션을 ' + tip, onclick: function () { var it = tbItem(); if (it) moveSec(it, dir); } });
    }
    UI.mvUp = mv('▲ 위로', 'sec-up', 'up'); UI.mvDown = mv('▼ 아래로', 'sec-down', 'down');
    UI.mvTop = mv('⤒ 맨 위', 'sec-top', 'top'); UI.mvBottom = mv('⤓ 맨 아래', 'sec-bottom', 'bottom');
    UI.risk = btn('⚠', 'sec-risk', { class: 'risk', hidden: true, title: RISK_TIP, 'aria-label': RISK_TIP, onclick: function () { setStatus('이 섹션은 ' + RISK_TIP + '. 옮긴 뒤 화면을 꼭 확인해 주세요.', 'warn'); } });
    UI.gapBtn = btn('여백', 'sec-gap', { title: '섹션 위·아래 여백', 'aria-expanded': 'false', onclick: function () { var it = tbItem(); if (it) openPop('gap', it); } });
    UI.bgBtn = btn('배경색', 'sec-bg', { title: '섹션 배경색', 'aria-expanded': 'false', onclick: function () { var it = tbItem(); if (it) openPop('bg', it); } });
    UI.ctag = h('span', { class: 'ctag', text: '복제본', hidden: true });
    UI.cloneBtn = btn('⧉ 복제', 'sec-clone', { title: '이 섹션을 복제해 바로 아래에 둡니다', 'data-tip': '이 섹션을 복제해 바로 아래에 둡니다', 'aria-label': '섹션 복제', onclick: function () { var it = tbItem(); if (it) cloneSec(it); } });
    UI.delBtn = btn('삭제', 'sec-del', { hidden: true, title: '이 복제본을 삭제합니다', 'aria-label': '복제본 삭제', onclick: function () { var it = tbItem(); if (it) delClone(it); } });
    UI.sectool = h('div', { class: 'sectool', role: 'toolbar', 'aria-label': '섹션 도구', hidden: true }, [UI.risk, UI.ctag, UI.mvUp, UI.mvDown, UI.mvTop, UI.mvBottom, UI.cloneBtn, UI.delBtn, UI.gapBtn, UI.bgBtn, UI.secbtn]);
    // 여백·배경색 팝오버
    function gf(side, label) {
      var f = h('input', { type: 'number', min: 0, max: 400, step: 4, class: 'num', 'aria-label': label + ' 여백(px)', 'data-act': 'gap-' + side });
      f.addEventListener('input', function () { onGapInput(side, f, false); });
      f.addEventListener('change', function () { onGapInput(side, f, true); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onGapInput(side, f, true); } });
      return f;
    }
    UI.gt = gf('top', '위'); UI.gb = gf('bottom', '아래');
    UI.popGap = h('div', { class: 'popbody', hidden: true }, [
      h('div', { class: 'row' }, [h('label', { class: 'clr' }, [h('span', { text: '위' }), UI.gt, h('span', { text: 'px' })]), h('label', { class: 'clr' }, [h('span', { text: '아래' }), UI.gb, h('span', { text: 'px' })])]),
      h('p', { class: 'dim', text: '섹션 바깥쪽 간격입니다. 칸을 비우면 원래 값을 씁니다.' }),
      h('div', { class: 'row' }, [btn('원본으로', 'gap-revert', { onclick: revertGap })])
    ]);
    UI.bgc = h('input', { type: 'color', 'aria-label': '섹션 배경색', 'data-act': 'bg-color' });
    UI.bgc.addEventListener('input', onBgInput);
    UI.bgStrong = h('p', { class: 'warn', 'data-act': 'bg-noeffect', hidden: true, text: '이 섹션은 안쪽 요소가 바탕을 덮고 있어서 배경색을 바꿔도 거의 보이지 않아요.' });
    UI.bgWarn = h('p', { class: 'warn', role: 'status', 'data-act': 'bg-warn', hidden: true });
    UI.popBg = h('div', { class: 'popbody', hidden: true }, [
      h('div', { class: 'row' }, [UI.bgc, btn('원본으로', 'bg-revert', { onclick: revertBgColor })]),
      h('p', { class: 'dim', 'data-act': 'bg-note', text: '섹션 바탕에만 적용돼요. 안쪽 요소가 자체 배경을 가진 섹션에서는 안 보일 수 있어요' }),
      UI.bgStrong, UI.bgWarn
    ]);
    UI.popT = h('strong');
    UI.pop = h('div', { class: 'pop', role: 'group', hidden: true }, [UI.popT, UI.popGap, UI.popBg]);
    // 미니 툴바: 버튼을 눌러도 글 상자의 선택이 풀리지 않도록 mousedown 기본 동작을 막는다
    UI.fs = h('input', { type: 'number', min: 10, max: 200, step: 1, 'aria-label': '글자 크기(px)', class: 'num', 'data-act': 'fs-input' });
    UI.fs.addEventListener('change', function () { setFs(UI.fs.value); });
    UI.fs.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); setFs(UI.fs.value); } });
    UI.color = h('input', { type: 'color', 'aria-label': '글자색', 'data-act': 'color' });
    UI.color.addEventListener('input', function () { setStyle({ color: UI.color.value }); });
    UI.warn = h('p', { class: 'warn', role: 'status', hidden: true, 'data-act': 'fs-warn' });
    UI.tool = h('div', { class: 'tool', role: 'toolbar', 'aria-label': '글자 서식', hidden: true }, [
      btn('굵게', 'bold', { title: '굵게 (Ctrl+B)', 'aria-keyshortcuts': 'Control+B', onclick: execBold }),
      btn('A−', 'fs-dec', { 'aria-label': '글자 크기 줄이기', onclick: function () { setFs(effFs() - 2); } }),
      UI.fs,
      btn('A+', 'fs-inc', { 'aria-label': '글자 크기 키우기', onclick: function () { setFs(effFs() + 2); } }),
      h('label', { class: 'clr' }, [h('span', { text: '글자색' }), UI.color]),
      btn('원본으로', 'revert', { onclick: revertBlock }),
      UI.warn
    ]);
    UI.tool.addEventListener('mousedown', function (e) { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
    UI.dirty = h('span', { class: 'dot', hidden: true, title: '저장하지 않은 변경이 있습니다', role: 'img', 'aria-label': '저장하지 않은 변경이 있습니다', text: '●' });
    UI.status = h('span', { class: 'status', role: 'status', 'aria-live': 'polite', 'data-act': 'status' });
    UI.note = h('input', { type: 'text', class: 'note', maxlength: 200, placeholder: '변경 메모 (선택)', 'aria-label': '변경 메모(선택)', 'data-act': 'note' });
    UI.save = btn('저장', 'save', { class: 'primary', title: '저장 (Ctrl/⌘+S)', 'aria-keyshortcuts': 'Control+S', onclick: function () { save(); } });
    UI.toggle = btn('접기', 'collapse', { title: '편집 바 접기 (Esc)', 'aria-expanded': 'true', onclick: function () { setCollapsed(true); } });
    UI.orphBtn = btn('', 'orphans', { hidden: true, onclick: function () { openPanel('orphans'); } });
    UI.bar = h('div', { class: 'bar', role: 'toolbar', 'aria-label': '상세페이지 편집' }, [
      h('span', { class: 'ttl', title: document.title, text: document.title || SLUG }), UI.dirty, UI.save, UI.note,
      btn('실행 취소', 'undo', { title: '실행 취소 (Ctrl/⌘+Z)', onclick: undo }),
      btn('다시 실행', 'redo', { title: '다시 실행 (Ctrl/⌘+Shift+Z)', onclick: redo }),
      btn('섹션 목록', 'sections', { onclick: function () { openPanel('sections'); } }),
      btn('이력', 'history', { onclick: function () { openPanel('history'); } }),
      btn('내보내기', 'export', { onclick: function () { openPanel('export'); } }),
      UI.orphBtn, UI.status, h('span', { class: 'sp' }),
      UI.toggle, btn('나가기', 'exit', { onclick: leave })
    ]);
    UI.reopen = btn('편집 바 열기', 'reopen', { class: 'reopen', hidden: true, onclick: function () { setCollapsed(false); } });
    UI.pt = h('h2'); UI.pb = h('div', { class: 'pb' });
    UI.panel = h('aside', { class: 'panel', hidden: true, tabindex: -1, role: 'complementary' }, [
      h('header', {}, [UI.pt, btn('닫기', 'panel-close', { onclick: closePanel })]), UI.pb
    ]);
    UI.dlgbg = h('div', { class: 'dlgbg', hidden: true });
    root.appendChild(h('style', { text: CSS }));
    root.appendChild(h('div', { class: 'ui' }, [UI.layer, UI.badge, UI.sectool, UI.pop, UI.tool, UI.bar, UI.reopen, UI.panel, UI.dlgbg]));
    document.documentElement.appendChild(host);
  }

  function listen() {
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && !S.dlg) { S.hov = {}; schedule(); } }, true);
    document.addEventListener('auxclick', function (e) { if (!fromUI(e) && e.target.closest && e.target.closest('a')) e.preventDefault(); }, true);
    document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
    // 안전망: 어떤 경로로든 <details> 가 접히거나 펼쳐지면 처음 상태로 되돌린다 (페이지 모습이 편집 도구 때문에 달라지지 않게)
    var det = new WeakMap();
    Array.prototype.forEach.call(document.querySelectorAll('details'), function (d) { det.set(d, d.open); });
    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (d && d.tagName === 'DETAILS' && det.has(d) && d.open !== det.get(d)) d.open = det.get(d);
    }, true);
    document.addEventListener('dragstart', function (e) { if (!fromUI(e) && e.target.tagName === 'IMG') e.preventDefault(); }, true);
    // 파일을 페이지 위에 놓았을 때 브라우저가 그 파일로 이동해 버리는 것을 막는다
    window.addEventListener('dragover', function (e) { e.preventDefault(); });
    window.addEventListener('drop', function (e) { e.preventDefault(); });
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', schedule);
    window.addEventListener('beforeunload', function (e) {
      if (S.leaving) return;
      if (S.edit) flush();
      if (S.dirty) { writeDraft(); e.preventDefault(); e.returnValue = ''; }
    });
    if (window.ResizeObserver) safe(function () { new ResizeObserver(schedule).observe(document.documentElement); });
  }

  function fatal(e) {
    var m = e && e.code === 401 ? '로그인이 필요합니다. 관리자 페이지에서 다시 로그인한 뒤 열어 주세요.'
      : '편집 내용을 불러오지 못했습니다.' + (e && e.code ? ' (오류 ' + e.code + ')' : ' 네트워크를 확인해 주세요.');
    setStatus(m, 'error');
    UI.save.disabled = true;
    if (!UI.retry) { UI.retry = btn('다시 불러오기', 'retry', { onclick: function () { UI.retry.remove(); UI.retry = null; boot(); } }); UI.bar.insertBefore(UI.retry, UI.status); }
  }

  function start(doc) {
    S.version = doc.version | 0; S.updatedAt = doc.updatedAt || null;
    try { core.init({ doc: doc, mode: 'edit' }); } catch { if (!safe(function () { return core.registry(); })) { setStatus('편집 도구를 시작하지 못했습니다.', 'error'); return; } }
    indexRegistry();
    unhideInEdit();
    S.orph = calcOrph(doc);
    S.savedCanon = canon(buildDoc());
    S.loaded = true; UI.save.disabled = false;
    record();
    refreshDirty(); refreshOrph();
    setStatus('글이나 이미지를 눌러 바로 고치세요. Alt+↑↓ 로 항목 이동, Enter 로 편집.');
    UI.bar.setAttribute('data-ready', '1');
    schedule();
    offerDraft(doc);
  }
  function boot() {
    setStatus('불러오는 중…');
    loadServerDoc().then(start, fatal);
  }

  function init() {
    if (!window.DetailEditCore) { if (init.n++ < 30) setTimeout(init, 100); else mountError(); return; }
    core = window.DetailEditCore;
    mount(); listen(); boot();
  }
  init.n = 0;
  function mountError() { core = {}; mount(); setStatus('편집 도구(apply.js)를 불러오지 못했습니다. 페이지를 새로고침해 주세요.', 'error'); UI.save.disabled = true; }
  init();
})();
