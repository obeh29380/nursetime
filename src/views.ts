import type { Feeding, Diaper } from "./db";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDatetime(dt: string | null): string {
  if (!dt) return "—";
  return dt.slice(0, 16).replace("T", " ");
}

function calcDuration(started: string, ended: string | null): string {
  if (!ended) return "";
  const diff = new Date(ended).getTime() - new Date(started).getTime();
  if (diff <= 0) return "";
  const totalSecs = Math.floor(diff / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtTime(dt: string): string {
  return dt.slice(11, 16);
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #1a1a1a;
  background: #f2f4f6;
}
.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
}
header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1.5rem;
}
.header-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: .75rem 1rem;
}
header h1 { font-size: 1.2rem; margin: 0; }

/* Breast timer buttons */
.breast-section {
  display: grid;
  grid-template-columns: 3rem 1fr 1fr 1fr;
  gap: .75rem;
  margin-bottom: 1rem;
}
.breast-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .2rem;
  padding: 1.25rem .75rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  min-height: 110px;
  width: 100%;
  font-family: inherit;
  transition: border-color .15s, background .15s;
}
.breast-btn:hover { border-color: #3b82f6; background: #eff6ff; }
.breast-btn.active { border-color: #10b981; background: #ecfdf5; }
.breast-btn.active:hover { border-color: #059669; }
.breast-icon { font-size: 1.75rem; line-height: 1; }
.breast-label { font-size: 1rem; font-weight: 700; }
.breast-timer {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
  font-variant-numeric: tabular-nums;
  letter-spacing: .05em;
  min-height: 1.75rem;
}
.breast-status { font-size: .8rem; color: #6b7280; }
.breast-btn.active .breast-status { color: #065f46; font-weight: 500; }
.breast-col { display: flex; flex-direction: column; gap: .4rem; }
.cancel-btn {
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: #fff5f5;
  color: #dc2626;
  font-size: .75rem;
  font-weight: 500;
  padding: .3rem .5rem;
  cursor: pointer;
  font-family: inherit;
  min-height: 30px;
  transition: background .1s;
}
.cancel-btn:hover { background: #fee2e2; }
.diaper-col { display: flex; flex-direction: column; gap: .4rem; }
.diaper-btn {
  flex: 1;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: .78rem;
  font-weight: 600;
  padding: .35rem .4rem;
  transition: border-color .15s, background .15s;
  width: 100%;
}
.diaper-btn:hover { border-color: #a78bfa; background: #f5f3ff; }

/* Forms */
.form-row { display: flex; gap: .75rem; flex-wrap: wrap; }
.form-field { display: flex; flex-direction: column; gap: .2rem; flex: 1; min-width: 120px; }
label { font-size: .78rem; color: #555; font-weight: 500; }
input[type="datetime-local"],
textarea {
  padding: .45rem .6rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: .9rem;
  font-family: inherit;
  width: 100%;
  background: #fff;
}
input[type="datetime-local"]:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,.15);
}
textarea { resize: vertical; min-height: 56px; }
select {
  padding: .45rem .6rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: .9rem;
  font-family: inherit;
  width: 100%;
  background: #fff;
}
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,.15);
}
.form-actions { margin-top: .75rem; display: flex; gap: .5rem; flex-wrap: wrap; }
button {
  padding: .45rem .9rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: .875rem;
  font-family: inherit;
  font-weight: 500;
  min-height: 38px;
  transition: background .1s;
}
.btn-primary   { background: #3b82f6; color: #fff; }
.btn-primary:hover   { background: #2563eb; }
.btn-danger    { background: #ef4444; color: #fff; }
.btn-danger:hover    { background: #dc2626; }
.btn-secondary { background: #e5e7eb; color: #374151; }
.btn-secondary:hover { background: #d1d5db; }
.btn-sm { padding: .3rem .65rem; font-size: .8rem; min-height: 32px; }

/* Feeding timeline */
#feedings-list { display: flex; flex-direction: column; gap: .5rem; }
.tl-row {
  display: grid;
  grid-template-columns: 3rem 1fr 1fr 1fr;
  column-gap: .75rem;
  align-items: stretch;
}
.tl-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: .2rem;
}
.tl-node {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #e5e7eb;
  color: #555;
  font-size: .58rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: -.02em;
}
.tl-line {
  flex: 1;
  width: 2px;
  background: #e5e7eb;
  margin-top: .2rem;
}
.tl-row:last-child .tl-line { display: none; }
.tl-cell { min-width: 0; }
.tl-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: .5rem .65rem;
  cursor: pointer;
  transition: background .1s, border-color .1s;
}
.tl-card:hover { background: #eff6ff; border-color: #93c5fd; }
.tl-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .4rem;
}
.feeding-duration {
  font-size: .9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1a1a1a;
}
.tl-actions { display: flex; justify-content: flex-end; margin-top: .2rem; }
.diaper-type { font-size: .875rem; font-weight: 600; }
.tl-edit-form {
  grid-column: 2 / -1;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: .75rem;
}
.empty { color: #999; font-size: .9rem; text-align: center; padding: 2rem 0; }
`;

const SCRIPT = `
const _state = { left: null, right: null };

function toggleBreast(side) {
  _state[side] ? _stopBreast(side) : _startBreast(side);
}

function _startBreast(side) {
  const startTime = new Date();
  const ivId = setInterval(() => _tick(side), 1000);
  _state[side] = { startTime, ivId };
  document.getElementById('btn-' + side).classList.add('active');
  document.getElementById('status-' + side).textContent = '授乳終了';
  document.getElementById('cancel-' + side).style.display = '';
  _tick(side);
}

function _stopBreast(side) {
  const { startTime, ivId } = _state[side];
  clearInterval(ivId);
  _state[side] = null;
  document.getElementById('btn-' + side).classList.remove('active');
  document.getElementById('timer-' + side).textContent = '';
  document.getElementById('status-' + side).textContent = '授乳開始';
  document.getElementById('cancel-' + side).style.display = 'none';
  htmx.ajax('POST', '/feedings', {
    target: '#feedings-list',
    swap: 'afterbegin',
    values: {
      started_at: _dtStr(startTime),
      ended_at: _dtStr(new Date()),
      memo: side === 'left' ? '左' : '右'
    }
  });
}

function _tick(side) {
  const elapsed = Date.now() - _state[side].startTime.getTime();
  const m = Math.floor(elapsed / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  document.getElementById('timer-' + side).textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function _dtStr(d) {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) +
    'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function recordDiaper(type) {
  htmx.ajax('POST', '/diapers', {
    target: '#feedings-list',
    swap: 'afterbegin',
    values: { changed_at: _dtStr(new Date()), type }
  });
}

function cancelBreast(side) {
  clearInterval(_state[side].ivId);
  _state[side] = null;
  document.getElementById('btn-' + side).classList.remove('active');
  document.getElementById('timer-' + side).textContent = '';
  document.getElementById('status-' + side).textContent = '授乳開始';
  document.getElementById('cancel-' + side).style.display = 'none';
}
`;

export function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nursetime</title>
  <script src="/htmx.min.js"></script>
  <style>${CSS}</style>
</head>
<body>
  <header>
    <div class="header-inner"><h1>🍼 Nursetime</h1></div>
  </header>
  <div class="container">${body}</div>
  <script>${SCRIPT}</script>
</body>
</html>`;
}

export function breastButtons(): string {
  return `
<div class="breast-section">
  <div></div>
  <div class="breast-col">
    <button class="breast-btn" id="btn-left" onclick="toggleBreast('left')" type="button">
      <span class="breast-icon">🤱</span>
      <span class="breast-label">左</span>
      <span class="breast-timer" id="timer-left"></span>
      <span class="breast-status" id="status-left">授乳開始</span>
    </button>
    <button class="cancel-btn" id="cancel-left" onclick="cancelBreast('left')" type="button" style="display:none">キャンセル</button>
  </div>
  <div class="breast-col">
    <button class="breast-btn" id="btn-right" onclick="toggleBreast('right')" type="button">
      <span class="breast-icon">🤱</span>
      <span class="breast-label">右</span>
      <span class="breast-timer" id="timer-right"></span>
      <span class="breast-status" id="status-right">授乳開始</span>
    </button>
    <button class="cancel-btn" id="cancel-right" onclick="cancelBreast('right')" type="button" style="display:none">キャンセル</button>
  </div>
  <div class="diaper-col">
    <button class="diaper-btn" onclick="recordDiaper('\u3046\u3093\u3061')" type="button">💩 \u3046\u3093\u3061</button>
    <button class="diaper-btn" onclick="recordDiaper('\u304a\u3057\u3063\u3053')" type="button">💧 \u304a\u3057\u3063\u3053</button>
    <button class="diaper-btn" onclick="recordDiaper('\u4e21\u65b9')" type="button">🔄 \u4e21\u65b9</button>
  </div>
</div>`;
}

export function feedingItem(f: Feeding): string {
  const isLeft = f.memo === "左";
  const duration = calcDuration(f.started_at, f.ended_at);
  const card = `<div class="tl-card"
      hx-get="/feedings/${f.id}/edit"
      hx-target="#feeding-${f.id}"
      hx-swap="outerHTML"
      role="button"
      tabindex="0"
      title="クリックして編集"
      onkeydown="if(event.key==='Enter'||event.key===' ')this.click()">
      <div class="tl-card-row">
        <span class="feeding-duration">${duration || "—"}</span>
        <button class="btn-sm btn-danger"
          onclick="event.stopPropagation()"
          hx-delete="/feedings/${f.id}"
          hx-target="#feeding-${f.id}"
          hx-swap="outerHTML"
          hx-confirm="この記録を削除しますか？">削除</button>
      </div>
    </div>`;
  return `
<div class="tl-row" id="feeding-${f.id}">
  <div class="tl-time">
    <div class="tl-node">${fmtTime(f.started_at)}</div>
    <div class="tl-line"></div>
  </div>
  <div class="tl-cell">${isLeft ? card : ""}</div>
  <div class="tl-cell">${isLeft ? "" : card}</div>
  <div class="tl-cell"></div>
</div>`;
}

export function feedingEditForm(f: Feeding): string {
  return `
<div class="tl-row" id="feeding-${f.id}">
  <div class="tl-time">
    <div class="tl-node">${fmtTime(f.started_at)}</div>
    <div class="tl-line"></div>
  </div>
  <div class="tl-edit-form">
    <form hx-put="/feedings/${f.id}"
      hx-target="#feeding-${f.id}"
      hx-swap="outerHTML">
      <div class="form-row">
        <div class="form-field">
          <label>開始時刻 *</label>
          <input type="datetime-local" name="started_at" value="${f.started_at.slice(0, 16)}" required>
        </div>
        <div class="form-field">
          <label>終了時刻</label>
          <input type="datetime-local" name="ended_at" value="${f.ended_at ? f.ended_at.slice(0, 16) : ""}">
        </div>
      </div>
      <div class="form-field" style="margin-top:.5rem">
        <label>メモ</label>
        <textarea name="memo">${f.memo ? esc(f.memo) : ""}</textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary btn-sm">保存</button>
        <button type="button" class="btn-secondary btn-sm"
          hx-get="/feedings/${f.id}"
          hx-target="#feeding-${f.id}"
          hx-swap="outerHTML">キャンセル</button>
      </div>
    </form>
  </div>
</div>`;
}

export function diaperItem(d: Diaper): string {
  return `
<div class="tl-row" id="diaper-${d.id}">
  <div class="tl-time">
    <div class="tl-node">${fmtTime(d.changed_at)}</div>
    <div class="tl-line"></div>
  </div>
  <div class="tl-cell"></div>
  <div class="tl-cell"></div>
  <div class="tl-cell">
    <div class="tl-card"
      hx-get="/diapers/${d.id}/edit"
      hx-target="#diaper-${d.id}"
      hx-swap="outerHTML"
      role="button"
      tabindex="0"
      title="クリックして編集"
      onkeydown="if(event.key==='Enter'||event.key===' ')this.click()">
      <div class="tl-card-row">
        <span class="diaper-type">${esc(d.type)}</span>
        <button class="btn-sm btn-danger"
          onclick="event.stopPropagation()"
          hx-delete="/diapers/${d.id}"
          hx-target="#diaper-${d.id}"
          hx-swap="outerHTML"
          hx-confirm="この記録を削除しますか？">削除</button>
      </div>
    </div>
  </div>
</div>`;
}

export function diaperEditForm(d: Diaper): string {
  return `
<div class="tl-row" id="diaper-${d.id}">
  <div class="tl-time">
    <div class="tl-node">${fmtTime(d.changed_at)}</div>
    <div class="tl-line"></div>
  </div>
  <div class="tl-edit-form">
    <form hx-put="/diapers/${d.id}"
      hx-target="#diaper-${d.id}"
      hx-swap="outerHTML">
      <div class="form-row">
        <div class="form-field">
          <label>時刻 *</label>
          <input type="datetime-local" name="changed_at" value="${d.changed_at.slice(0, 16)}" required>
        </div>
        <div class="form-field">
          <label>種類</label>
          <select name="type">
            <option value="うんち"${d.type === "うんち" ? " selected" : ""}>💩 うんち</option>
            <option value="おしっこ"${d.type === "おしっこ" ? " selected" : ""}>💧 おしっこ</option>
            <option value="両方"${d.type === "両方" ? " selected" : ""}>🔄 両方</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary btn-sm">保存</button>
        <button type="button" class="btn-secondary btn-sm"
          hx-get="/diapers/${d.id}"
          hx-target="#diaper-${d.id}"
          hx-swap="outerHTML">キャンセル</button>
      </div>
    </form>
  </div>
</div>`;
}

export function allRecords(feedingItems: Feeding[], diaperItems: Diaper[]): string {
  type Row = { time: string; html: string };
  const rows: Row[] = [
    ...feedingItems.map(f => ({ time: f.started_at, html: feedingItem(f) })),
    ...diaperItems.map(d => ({ time: d.changed_at, html: diaperItem(d) })),
  ];
  rows.sort((a, b) => b.time.localeCompare(a.time));
  if (rows.length === 0) {
    return `<p class="empty">まだ記録がありません。</p>`;
  }
  return rows.map(r => r.html).join("");
}
