function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = isError ? 'show error' : 'show';
    setTimeout(() => toast.className = '', 1500);
}

function switchTab(tabNum) {
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => btn.classList.toggle('active', idx + 1 === tabNum));
    document.querySelectorAll('.tab-content').forEach((content, idx) => content.classList.toggle('active', idx + 1 === tabNum));
}

function openWiki() {
    const t = new Date();
    const mm = String(t.getMonth()+1).padStart(2,'0'), dd = String(t.getDate()).padStart(2,'0');
    window.open(`http://wiki.duzon.com:8080/display/DW/%5BWE1U-QA-Cell%5D+${mm}.${dd}+%3A%3A+2026`, '_blank');
}

function openHelp() { document.getElementById('help_modal').classList.add('show'); }
function closeHelp() { document.getElementById('help_modal').classList.remove('show'); }

function updateCount(inputId, labelId) {
    const text = document.getElementById(inputId).value;
    const count = text.replace(/\n+$/, '').length; 
    document.getElementById(labelId).textContent = (inputId === 'output_box' ? '전체 글자 수: ' : '글자 수: ') + count + '자';
}

function clearText(targetId) {
    if(confirm("내용을 모두 지우시겠습니까?")) {
        document.getElementById(targetId).value = "";
        if(targetId === 'input_box') updateCount('input_box', 'input_count');
        saveConfig(); 
    }
}

function copyToClipboard(text, successMsg) {
    if(!text || !text.trim()) return showToast("⚠️ 복사할 내용이 없습니다.", true);
    navigator.clipboard.writeText(text).then(() => showToast(successMsg));
}

function copyText(targetId) { copyToClipboard(document.getElementById(targetId).value, "✅ 복사 완료!"); }

function toggleSelectAll(masterCb) {
    const cbs = document.querySelectorAll('.history-checkbox');
    cbs.forEach(cb => {
        cb.checked = masterCb.checked;
        cb.closest('.history-item').classList.toggle('selected', masterCb.checked);
    });
}

function renderHistory() {
    const list = document.getElementById('history_list');
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    list.innerHTML = history.length ? '' : '<div class="history-empty">기록이 없습니다.</div>';
    document.getElementById('master_checkbox').checked = false;

    history.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = function(e) {
            const cb = this.querySelector('.history-checkbox');
            if(e.target !== cb) cb.checked = !cb.checked;
            this.classList.toggle('selected', cb.checked);
            const allCbs = document.querySelectorAll('.history-checkbox');
            const checkedCbs = document.querySelectorAll('.history-checkbox:checked');
            document.getElementById('master_checkbox').checked = (allCbs.length > 0 && allCbs.length === checkedCbs.length);
        };
        div.innerHTML = `<input type="checkbox" class="history-checkbox" value="${idx}">
            <div style="flex:1; overflow:hidden;">
                <div class="history-time">${item.time}</div>
                <div class="history-preview">${item.text}</div>
            </div>`;
        list.appendChild(div);
    });
}

function saveHistory(text) {
    if(!text.trim()) return;
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    const t = new Date();
    const timeStr = `${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
    if (history.length && history[0].text === text) return;
    history.unshift({ time: timeStr, text: text });
    if(history.length > 30) history.pop();
    localStorage.setItem('dailyReportHistory', JSON.stringify(history));
    renderHistory();
}

function deleteHistory() {
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    const cbs = document.querySelectorAll('.history-checkbox:checked');
    if(!cbs.length) {
        if(confirm("기록을 전체 삭제하시겠습니까?")) { localStorage.removeItem('dailyReportHistory'); renderHistory(); showToast("✅ 삭제 완료!"); }
        return;
    }
    if(confirm(`${cbs.length}건을 삭제하시겠습니까?`)) {
        let ids = Array.from(cbs).map(cb => parseInt(cb.value)).sort((a,b)=>b-a);
        ids.forEach(id => history.splice(id, 1));
        localStorage.setItem('dailyReportHistory', JSON.stringify(history));
        renderHistory();
    }
}

function createChunkUI(chunks) {
    const container = document.getElementById('chunk_buttons');
    container.innerHTML = '';
    const label = document.getElementById('chunk_label');
    if (chunks.length <= 1) { label.style.display = 'none'; return; }
    label.style.display = 'inline-block';

    chunks.forEach((text, i) => {
        const box = document.createElement('div');
        box.className = 'chunk-box';
        const header = document.createElement('div');
        header.className = 'chunk-header';
        header.onclick = () => box.classList.toggle('open');
        const title = document.createElement('span');
        title.className = 'chunk-title';
        title.textContent = `📦 ${i+1}번 묶음`;
        const info = document.createElement('span');
        info.className = 'chunk-info';
        info.textContent = `(${text.length}자)`;
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-primary';
        copyBtn.style.cssText = 'padding:2px 8px; font-size:10px;';
        copyBtn.textContent = '복사';
        const targetText = text; 
        copyBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(targetText, `✅ ${i+1}번 복사 완료!`); };
        header.appendChild(title); header.appendChild(info); header.appendChild(copyBtn);
        const body = document.createElement('div');
        body.className = 'chunk-body';
        const area = document.createElement('textarea'); area.readOnly = true; area.value = text;
        body.appendChild(area); box.appendChild(header); box.appendChild(body); container.appendChild(box);
    });
}

function mergeHistory() {
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    const cbs = document.querySelectorAll('.history-checkbox:checked');
    if(!cbs.length) return showToast("⚠️ 항목을 선택해주세요!", true);
    let ids = Array.from(cbs).map(cb => parseInt(cb.value)).sort((a,b)=>b-a);
    let merged = ids.map(id => history[id].text).join('\n\n');
    document.getElementById('output_box').value = merged;
    updateCount('output_box', 'output_count');
    createChunkUI(splitReports(merged));
    showToast("✅ 취합 완료!");
}

function splitReports(text) {
    const lines = text.split('\n'), people = []; let curr = [];
    for (let l of lines) {
        if (l.startsWith('■ ')) { if (curr.length) people.push(curr.join('\n')); curr = [l]; }
        else curr.push(l);
    }
    if (curr.length) people.push(curr.join('\n'));
    const chunks = []; let chunk = "";
    for (let p of people) {
        if (chunk.length + p.length + 2 > 4500) { chunks.push(chunk.trim()); chunk = p; }
        else chunk = chunk ? chunk + "\n\n" + p : p;
    }
    if (chunk) chunks.push(chunk.trim());
    return chunks;
}

function processText() {
    const input = document.getElementById('input_box').value.trimEnd().split('\n');
    if (!input.join('').trim()) return showToast("⚠️ 변환할 내용이 없습니다.", true);
    
    const result = []; let isFixed = false, lastWasTitle = false;
    const romanRegex = /^(i{1,3}|iv|v|vi{1,3}|ix|x)\./i;

    for (let line of input) {
        const ind = line.length - line.trimStart().length, clean = line.trim();
        if (!clean) { result.push(""); continue; }
        
        if (clean.startsWith('■') || clean === '[업무]') { isFixed = true; result.push(clean); continue; }
        if (clean.startsWith('[') && clean !== '[업무]') { isFixed = false; result.push(clean); lastWasTitle = true; continue; }
        if (isFixed || ind >= 2) { result.push(line.trimEnd()); lastWasTitle = false; continue; }
        if (lastWasTitle) { result.push(clean); lastWasTitle = false; continue; }
        
        const isRoman = romanRegex.test(clean);
        const isAlpha = /^[a-z]\./.test(clean) && !isRoman; 
        
        if (/^\d/.test(clean) && clean.substring(0,3).includes('.')) {
            result.push(clean);
        }
        else if (isAlpha) {
            result.push("  " + clean);
        }
        else if (isRoman) {
            if (result.length && result[result.length-1].trim().match(/^\d+\./)) {
                result.push("  " + clean);
            } else {
                result.push("    " + clean);
            }
        }
        else if (clean.startsWith('-')) {
            if (result.length && result[result.length-1].trim().match(/^\d+\./)) {
                result.push("  " + clean);
            } else {
                result.push("      " + clean);
            }
        }
        else {
            result.push("        " + clean);
        }
        lastWasTitle = false;
    }
    const out = result.join('\n');
    document.getElementById('output_box').value = out;
    updateCount('output_box', 'output_count');
    saveHistory(out);
    createChunkUI(splitReports(out));
    showToast("✅ 변환 완료!");
}

function saveConfig() {
    const data = { name: document.getElementById('cfg_name').value.trim(), services: document.getElementById('cfg_services').value.trim(), inputBoxText: document.getElementById('input_box').value, smartInputText: document.getElementById('smart_input').value };
    localStorage.setItem('dailyReportConfig', JSON.stringify(data));
}
function loadConfig() {
    const data = JSON.parse(localStorage.getItem('dailyReportConfig'));
    if (data) {
        document.getElementById('cfg_name').value = data.name || "";
        document.getElementById('cfg_services').value = data.services || "";
        document.getElementById('input_box').value = data.inputBoxText || "";
        document.getElementById('smart_input').value = data.smartInputText || "";
        updateCount('input_box', 'input_count');
        if (!data.smartInputText || data.smartInputText.trim() === "") applyFixedFormat(true);
    }
}
function applyFixedFormat(silent = false) {
    const name = document.getElementById('cfg_name').value.trim(), svcs = document.getElementById('cfg_services').value.trim().split(',');
    if (!name || !svcs[0]) return;
    let txt = `■ ${name}\n[업무]\n` + svcs.map(s => s.trim() ? `- ${s.trim()}` : '').filter(s=>s).join('\n');
    document.getElementById('smart_input').value = txt;
    saveConfig(); if(!silent) showToast("✅ 양식 적용 완료!");
}
function copyProgress() {
    const name = document.getElementById('cfg_name').value.trim(); 
    if(!name) return showToast("⚠️ 이름을 먼저 입력해주세요!", true);
    const t = new Date(), txt = `(${name}, 100%, ${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')})`;
    copyToClipboard(txt, `✅ ${txt}`);
}

const ROMANS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
function getNextBullet(lines, type, ind) {
    for (let i = lines.length-1; i>=0; i--) {
        const line = lines[i], clean = line.trim(), lineInd = line.length - line.trimStart().length;
        if (lineInd === ind) {
            if (type === 'num' && /^\d+\./.test(clean)) return (parseInt(clean.match(/^(\d+)/)[1])+1) + ". ";
            if (type === 'alpha' && /^[a-z]\./.test(clean)) return String.fromCharCode(clean.charCodeAt(0)+1) + ". ";
            if (type === 'roman' && /^[ivx]+\./.test(clean)) { 
                const match = clean.match(/^([ivx]+)/i);
                if (match) {
                    let idx = ROMANS.indexOf(match[1].toLowerCase());
                    return (idx !== -1 && idx < ROMANS.length - 1) ? ROMANS[idx+1] + ". " : "i. ";
                }
            }
        }
        if (lineInd < ind && clean) break;
    }
    return { num: '1. ', alpha: 'a. ', roman: 'i. ' }[type] || "- ";
}
function insertAtCursor(ta, txt, del=0) {
    const start = ta.selectionStart, val = ta.value;
    ta.value = val.substring(0, start-del) + txt + val.substring(start);
    ta.selectionStart = ta.selectionEnd = start - del + txt.length;
}
document.getElementById('smart_input').addEventListener('keydown', function(e) {
    if (e.isComposing) return;
    const ta = this, val = ta.value, cursor = ta.selectionStart, linesBefore = val.substring(0, cursor).split('\n'), curr = linesBefore[linesBefore.length-1], clean = curr.trim(), ind = curr.length - curr.trimStart().length, indStr = curr.substring(0, ind);
    if (e.key === 'Enter') {
        if (/^\s*(\d+\. |[a-z]\. |[ivx]+\. |- )$/.test(curr)) {
            e.preventDefault(); let rep = "";
            if (curr.includes("-")) rep = "    " + getNextBullet(linesBefore.slice(0,-1), 'roman', 4);
            else if (/^\s*[ivx]+\./.test(curr)) rep = "  " + getNextBullet(linesBefore.slice(0,-1), 'alpha', 2);
            else if (/^\s*[a-z]\./.test(curr)) rep = getNextBullet(linesBefore.slice(0,-1), 'num', 0);
            insertAtCursor(ta, rep, curr.length); saveConfig(); return;
        }
        if (/^[ivx]+\./i.test(clean)) { e.preventDefault(); insertAtCursor(ta, "\n"+indStr+getNextBullet(linesBefore, 'roman', ind)); saveConfig(); }
        else if (/^\d+\./.test(clean)) { e.preventDefault(); insertAtCursor(ta, "\n"+indStr+getNextBullet(linesBefore, 'num', ind)); saveConfig(); }
        else if (/^[a-z]\./.test(clean)) { e.preventDefault(); insertAtCursor(ta, "\n"+indStr+getNextBullet(linesBefore, 'alpha', ind)); saveConfig(); }
        else if (clean.startsWith("-")) { e.preventDefault(); insertAtCursor(ta, "\n"+indStr+"- "); saveConfig(); }
    } else if (e.key === 'Tab') {
        if (/^\s*\d+\.\s$/.test(curr)) { e.preventDefault(); insertAtCursor(ta, "  "+getNextBullet(linesBefore.slice(0,-1), 'alpha', 2), curr.length); saveConfig(); }
        else if (/^\s*[a-z]\.\s$/.test(curr)) { e.preventDefault(); insertAtCursor(ta, "    "+getNextBullet(linesBefore.slice(0,-1), 'roman', 4), curr.length); saveConfig(); }
        else if (/^\s*[ivx]+\.\s$/.test(curr)) { e.preventDefault(); insertAtCursor(ta, "      - ", curr.length); saveConfig(); }
    } else if (e.key === 'Backspace' && /^\s*(\d+\. |[a-z]\. |[ivx]+\. |- )$/.test(curr)) {
        e.preventDefault(); let rep = "";
        if (curr.includes("-")) rep = "    " + getNextBullet(linesBefore.slice(0,-1), 'roman', 4);
        else if (/^\s*[ivx]+\./.test(curr)) rep = "  " + getNextBullet(linesBefore.slice(0,-1), 'alpha', 2);
        else if (/^\s*[a-z]\./.test(curr)) rep = getNextBullet(linesBefore.slice(0,-1), 'num', 0);
        insertAtCursor(ta, rep, curr.length); saveConfig();
    }
});

window.onload = () => { loadConfig(); renderHistory(); };