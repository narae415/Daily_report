/* [기본 토스트 & 탭 로직] */
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

/* [도움말 모달] */
function openHelp() { document.getElementById('help_modal').classList.add('show'); }
function closeHelp() { document.getElementById('help_modal').classList.remove('show'); }
function openJiraHelp() { document.getElementById('jira_help_modal').classList.add('show'); }
function closeJiraHelp() { document.getElementById('jira_help_modal').classList.remove('show'); }

/* [데이터 관리 핵심 로직] */
function updateCount(inputId, labelId) {
    const el = document.getElementById(inputId);
    if(el) {
        const count = el.value.replace(/\n+$/, '').length; 
        const label = document.getElementById(labelId);
        if(label) label.textContent = (inputId.includes('output') ? '전체 글자 수: ' : '글자 수: ') + count + '자';
    }
}

function clearText(targetId) {
    if(confirm("내용을 모두 지우시겠습니까?")) {
        document.getElementById(targetId).value = "";
        const countId = targetId === 'input_box' ? 'input_count' : (targetId === 'jira_input_box' ? 'jira_input_count' : '');
        if(countId) updateCount(targetId, countId);
        saveConfig(); 
    }
}

function copyToClipboard(text, successMsg) {
    if(!text || !text.trim()) return showToast("⚠️ 복사할 내용이 없습니다.", true);
    navigator.clipboard.writeText(text).then(() => showToast(successMsg));
}
function copyText(targetId) { copyToClipboard(document.getElementById(targetId).value, "✅ 복사 완료!"); }

/* [히스토리 시스템] */
function renderHistory() {
    const list = document.getElementById('history_list');
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    list.innerHTML = history.length ? '' : '<div style="text-align:center; color:#888; font-size:12px; padding:20px;">기록이 없습니다.</div>';
    document.getElementById('master_checkbox').checked = false;

    history.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = function(e) {
            const cb = this.querySelector('.history-checkbox');
            if(e.target !== cb) cb.checked = !cb.checked;
            this.classList.toggle('selected', cb.checked);
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
    // 중복 저장 방지
    if (history.length && history[0].text === text) return;
    history.unshift({ time: timeStr, text: text });
    if(history.length > 30) history.pop();
    localStorage.setItem('dailyReportHistory', JSON.stringify(history));
    renderHistory();
}

function saveJiraToHistory() {
    const text = document.getElementById('jira_input_box').value;
    if(!text.trim()) return showToast("⚠️ 붙여넣은 내용이 없습니다.", true);
    saveHistory(text);
    showToast("✅ 히스토리에 적용되었습니다!");
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

function mergeHistory() {
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    const cbs = document.querySelectorAll('.history-checkbox:checked');
    if(!cbs.length) return showToast("⚠️ 항목을 선택해주세요!", true);
    let ids = Array.from(cbs).map(cb => parseInt(cb.value)).sort((a,b)=>b-a);
    let merged = ids.map(id => history[id].text).join('\n\n');
    document.getElementById('output_box').value = merged;
    updateCount('output_box', 'output_count');
    switchTab(1); // 합친 후 바로 변환결과 탭으로 이동
    showToast("✅ 취합 완료!");
}

/* [변환 및 자동 저장] */
function processText() {
    const input = document.getElementById('input_box').value.trimEnd().split('\n');
    if (!input.join('').trim()) return showToast("⚠️ 변환할 내용이 없습니다.", true);
    
    const result = [];
    const romanRegex = /^(i{1,3}|iv|v|vi{1,3}|ix|x)\./i;

    for (let line of input) {
        const clean = line.trim();
        if (!clean) { result.push(""); continue; }
        if (clean.startsWith('■') || clean === '[업무]') { result.push(clean); continue; }
        
        const isRoman = romanRegex.test(clean);
        const isAlpha = /^[a-z]\./.test(clean) && !isRoman; 
        
        if (/^\d/.test(clean)) result.push(clean);
        else if (isAlpha) result.push("  " + clean);
        else if (isRoman) result.push("    " + clean);
        else if (clean.startsWith('-')) result.push("      " + clean);
        else result.push("        " + clean);
    }
    const out = result.join('\n');
    document.getElementById('output_box').value = out;
    updateCount('output_box', 'output_count');
    saveHistory(out);
    showToast("✅ 변환 완료!");
}

function saveConfig() {
    const data = { 
        name: document.getElementById('cfg_name').value, 
        services: document.getElementById('cfg_services').value, 
        input: document.getElementById('input_box').value,
        jira: document.getElementById('jira_input_box').value
    };
    localStorage.setItem('dailyReportConfig', JSON.stringify(data));
}

function loadConfig() {
    const data = JSON.parse(localStorage.getItem('dailyReportConfig'));
    if (data) {
        document.getElementById('cfg_name').value = data.name || "";
        document.getElementById('cfg_services').value = data.services || "";
        document.getElementById('input_box').value = data.input || "";
        document.getElementById('jira_input_box').value = data.jira || "";
        updateCount('input_box', 'input_count');
        updateCount('jira_input_box', 'jira_input_count');
    }
}

function applyFixedFormat() {
    const name = document.getElementById('cfg_name').value.trim();
    const svcs = document.getElementById('cfg_services').value.trim().split(',');
    if (!name) return showToast("⚠️ 이름을 입력해주세요!", true);
    let txt = `■ ${name}\n[업무]\n` + svcs.map(s => s.trim() ? `- ${s.trim()}` : '').filter(s=>s).join('\n');
    document.getElementById('smart_input').value = txt;
    saveConfig();
    showToast("✅ 양식 적용 완료!");
}

function copyProgress() {
    const name = document.getElementById('cfg_name').value.trim(); 
    if(!name) return showToast("⚠️ 이름을 먼저 입력해주세요!", true);
    const t = new Date();
    const txt = `(${name}, 100%, ${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')})`;
    copyToClipboard(txt, `✅ ${txt}`);
}

window.onload = () => { 
    loadConfig(); 
    renderHistory(); 
    document.querySelectorAll('textarea, input').forEach(el => {
        el.addEventListener('input', () => {
            saveConfig();
            if(el.id === 'input_box') updateCount('input_box', 'input_count');
            if(el.id === 'jira_input_box') updateCount('jira_input_box', 'jira_input_count');
        });
    });
};