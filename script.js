// [중앙 관리] 북마크릿 코드 (공식 문구 적용 완료)
const MY_JIRA_CODE = `javascript:(async function(){try{const userRes=await fetch('/rest/api/2/myself');if(!userRes.ok)throw new Error('Jira 로그인 필요');const userData=await userRes.json();const myId=userData.name.toLowerCase();const jql=encodeURIComponent(\`(assignee = "\${myId}" OR reporter = "\${myId}" OR creator = "\${myId}") AND updated >= startOfWeek()\`);const apiUrl=\`/rest/api/2/search?jql=\${jql}&maxResults=50\`;const response=await fetch(apiUrl);if(!response.ok)throw new Error('데이터 로드 실패');const data=await response.json();const issues=data.issues||[];const now=new Date();const krTime=new Date(now.getTime()+(9*60*60*1000));const todayStr=krTime.toISOString().split('T')[0];const allKeys=new Set(issues.map(i=>i.key));let dailyCompleted=[],dailyUpdated=[],todayAlert=[],pending=[],weekly=[];const doneStatuses=["완료","DONE","처리완료","RESOLVED","CLOSED","검수완료","업데이트 대기","업데이트","종료"];const unconfirmedStatuses=["TO DO","접수","OPEN","할 일"];const qaStatuses=["검수요청","QA검토"];issues.forEach(issue=>{const fields=issue.fields,key=issue.key,summary=fields.summary,status=fields.status?fields.status.name:"상태없음",statusUpper=status.toUpperCase();const fieldsStr=JSON.stringify(fields).toLowerCase();if(fieldsStr.includes(myId)){if(key.includes("HELP")&&fields.issuelinks){const hasLinkInList=fields.issuelinks.some(link=>{const linkedKey=(link.inwardIssue?.key)||(link.outwardIssue?.key);return linkedKey&&allKeys.has(linkedKey)});if(hasLinkInList)return}const createdDate=fields.created.split('T')[0],updatedDate=fields.updated.split('T')[0],createdDisplay=new Date(fields.created).toLocaleString('ko-KR').slice(0,-3),updatedDisplay=new Date(fields.updated).toLocaleString('ko-KR').slice(0,-3);let reportItem=\`   [\${key}] \${summary}\\n   └ 상태: \${status} | 접수: \${createdDisplay} | 수정: \${updatedDisplay}\`;if(key.includes("WQA")){let desc=fields.description||"설명 없음";let indentedDesc=desc.split('\\n').map(line=>\`      \${line}\`).join('\\n');reportItem+=\` \\n   └ 설명:\\n\${indentedDesc}\`}weekly.push(reportItem);if(createdDate===todayStr||updatedDate===todayStr){if(doneStatuses.some(ds=>status.includes(ds)||statusUpper.includes(ds.toUpperCase())))dailyCompleted.push(reportItem);else dailyUpdated.push(reportItem)}const isUnconfirmed=unconfirmedStatuses.some(us=>statusUpper.includes(us)),isQaTarget=qaStatuses.some(qs=>status.includes(qs));if(isUnconfirmed||isQaTarget){let label=isQaTarget?"🔍 [검수필요]":"❓ [미확인]";pending.push(\`   \${label} \${key} - \${summary} (\${status})\`)}if(createdDate===todayStr&&isUnconfirmed){todayAlert.push(\`   🚨 [오늘접수-미확인] \${key} - \${summary}\`)}else if(updatedDate===todayStr&&isQaTarget){todayAlert.push(\`   🚨 [오늘변경-검수요청] \${key} - \${summary}\`)}}});let res=\`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n📅 [금일 업무 내역] - \${todayStr}\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n✅ 1. 당일 처리 완료\\n\${dailyCompleted.length?dailyCompleted.join('\\n\\n'):'   - 완료 내역 없음'}\\n\\n📝 2. 당일 상태 값 수정 발생\\n\${dailyUpdated.length?dailyUpdated.join('\\n\\n'):'   - 수정 내역 없음'}\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n⚠️ [미처리 알림 (미확인/검수요청)]\\n\${todayAlert.length?todayAlert.join('\\n'):'   - 특이사항 없음'}\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n🗓️ [주간 활동 내역 종합]\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\${weekly.length?weekly.join('\\n\\n'):'   - 활동 내역 없음'}\`;const t=document.createElement("textarea");t.value=res;document.body.appendChild(t);t.select();document.execCommand("copy");document.body.removeChild(t);const appWin=window.open("${window.location.href}","DailyReport");let sent=false;const doSend=()=>{if(!sent){sent=true;try{appWin.postMessage({type:"jira_data",data:res},"*");}catch(err){}}};window.addEventListener("message",function h(e){if(e.data&&e.data.type==="daily_report_ready"){window.removeEventListener("message",h);doSend();}});setTimeout(doSend,1500);}catch(e){alert(e.message)}})();`;

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
    window.open(`http://wiki.duzon.com:8080/display/DW/%5BWE1U-QA-Cell%5D+${mm}.${dd}+%3A%3A+${t.getFullYear()}`, '_blank');
}

function openSettings() { document.getElementById('settings_modal').classList.add('show'); }
function closeSettings() { document.getElementById('settings_modal').classList.remove('show'); }
function saveSettings() { saveConfig(); closeSettings(); showToast("✅ 설정이 저장되었습니다."); }

function openHelp() { document.getElementById('help_modal').classList.add('show'); }
function closeHelp() { document.getElementById('help_modal').classList.remove('show'); }
function openJiraHelp() { document.getElementById('jira_help_modal').classList.add('show'); }
function closeJiraHelp() { document.getElementById('jira_help_modal').classList.remove('show'); }

function copyBookmarkCode() {
    const el = document.createElement('textarea');
    el.value = MY_JIRA_CODE;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast("✅ 스크립트가 클립보드에 복사되었습니다.");
}

function updateCount(inputId, labelId) {
    const el = document.getElementById(inputId);
    if(el) {
        const count = el.value.replace(/\n+$/, '').length; 
        document.getElementById(labelId).textContent = (inputId.includes('output') ? '전체 글자 수: ' : '글자 수: ') + count + '자';
    }
}

function clearText(targetId) {
    if(confirm("해당 영역의 내용을 모두 삭제하시겠습니까?")) {
        document.getElementById(targetId).value = "";
        saveConfig();
        if(targetId === 'input_box') updateCount('input_box', 'input_count');
        if(targetId === 'output_box') { updateCount('output_box', 'output_count'); renderSets([]); }
        if(targetId === 'jira_input_box') updateCount('jira_input_box', 'jira_input_count');
    }
}

function copyToClipboard(text, successMsg) {
    if(!text || !text.trim()) return showToast("⚠️ 복사할 내용이 없습니다.", true);
    navigator.clipboard.writeText(text).then(() => showToast(successMsg));
}
function copyText(targetId) { copyToClipboard(document.getElementById(targetId).value, "✅ 복사 완료"); }

function renderHistory() {
    const list = document.getElementById('history_list');
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    list.innerHTML = history.length ? '' : '<div style="text-align:center; color:#888; font-size:12px; padding:20px;">저장된 내역이 없습니다.</div>';
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
            <div style="flex:1;"><div class="history-time">${item.time}</div><div class="history-preview">${item.text}</div></div>`;
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
    if(!cbs.length) return;
    if(!confirm("선택한 내역을 삭제하시겠습니까?")) return;
    let ids = Array.from(cbs).map(cb => parseInt(cb.value)).sort((a,b)=>b-a);
    ids.forEach(id => history.splice(id, 1));
    localStorage.setItem('dailyReportHistory', JSON.stringify(history));
    renderHistory();
}

function mergeHistory() {
    let history = JSON.parse(localStorage.getItem('dailyReportHistory')) || [];
    const cbs = document.querySelectorAll('.history-checkbox:checked');
    if(!cbs.length) return;
    let ids = Array.from(cbs).map(cb => parseInt(cb.value)).sort((a,b)=>b-a);
    let merged = ids.map(id => history[id].text).join('\n\n');
    document.getElementById('output_box').value = merged;
    updateCount('output_box', 'output_count');
    const sets = splitIntoSets(merged);
    renderSets(sets);
    switchTab(1);
    showToast(sets.length > 1 ? `✅ ${sets.length}개 세트로 분할 취합되었습니다.` : "✅ 선택 내역이 취합되었습니다.");
}

function splitIntoSets(text, maxLen = 4500) {
    // ■ 이름 기준으로 사람별 블록 분리
    const lines = text.split('\n');
    const blocks = [];
    let cur = '';
    for (const line of lines) {
        if (line.startsWith('■') && cur.trim()) {
            blocks.push(cur.trim());
            cur = line;
        } else {
            cur = cur ? cur + '\n' + line : line;
        }
    }
    if (cur.trim()) blocks.push(cur.trim());

    if (blocks.length <= 1) return [text];

    // 4500자 기준으로 세트 묶기
    const sets = [];
    let setContent = '';
    for (const block of blocks) {
        const sep = setContent ? '\n\n' : '';
        if (setContent && (setContent + sep + block).length > maxLen) {
            sets.push(setContent);
            setContent = block;
        } else {
            setContent = setContent + sep + block;
        }
    }
    if (setContent) sets.push(setContent);
    return sets;
}

function renderSets(sets) {
    const container = document.getElementById('sets_container');
    if (!container) return;
    if (sets.length <= 1) { container.style.display = 'none'; return; }
    window._mergedSets = sets;
    container.style.display = 'block';
    container.innerHTML = sets.map((s, i) => {
        const preview = s.slice(0, 80).replace(/\n/g, ' ').replace(/</g, '&lt;');
        const full = s.replace(/</g, '&lt;');
        return `<div class="set-item">
            <div class="set-header" onclick="toggleSet(this)">
                <span class="set-title">${i + 1}번 세트 <span class="set-chars">(${s.length}자)</span></span>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="set-toggle">▼</span>
                    <button class="btn btn-copy btn-action" onclick="event.stopPropagation();copySetText(${i})">복사</button>
                </div>
            </div>
            <div class="set-preview">${preview}…</div>
            <div class="set-full"><textarea readonly class="set-textarea">${full}</textarea></div>
        </div>`;
    }).join('');
}

function toggleSet(header) {
    const item = header.closest('.set-item');
    const full = item.querySelector('.set-full');
    const preview = item.querySelector('.set-preview');
    const arrow = header.querySelector('.set-toggle');
    const isOpen = item.classList.contains('open');
    item.classList.toggle('open', !isOpen);
    full.style.display = isOpen ? 'none' : 'block';
    preview.style.display = isOpen ? 'block' : 'none';
    arrow.textContent = isOpen ? '▼' : '▲';
}

function copySetText(idx) {
    copyToClipboard(window._mergedSets[idx], `✅ ${idx + 1}번 세트 복사 완료`);
}

function processText() {
    const input = document.getElementById('input_box').value.trimEnd().split('\n');
    const result = [];
    const romanRegex = /^(i{1,3}|iv|v|vi{1,3}|ix|x)\./i;
    
    // 추가: 현재 어느 괄호(섹션) 안에 있는지 기억하는 변수
    let currentSection = ""; 

    for (let line of input) {
        const clean = line.trim();
        if (!clean) { result.push(""); continue; }
        
        // ■ 이름 또는 [업무], [조직도] 등은 들여쓰기 없이 그대로 출력
        if (clean.startsWith('■') || /^\[.*\]$/.test(clean)) { 
            if (/^\[.*\]$/.test(clean)) {
                currentSection = clean; // 괄호를 만나면 현재 섹션 업데이트
            }
            result.push(clean); 
            continue; 
        }
        
        // 핵심 수정: 현재 섹션이 [업무]일 때 하이픈(-)으로 시작하면 들여쓰기 안 함
        if (currentSection === '[업무]' && clean.startsWith('-')) {
            result.push(clean);
            continue;
        }

        // 기존 넘버링 들여쓰기 규칙 (1. -> a. -> i. -> -)
        if (/^\d/.test(clean)) result.push(clean);
        else if (/^[a-z]\./.test(clean) && !romanRegex.test(clean)) result.push("  " + clean);
        else if (romanRegex.test(clean)) result.push("    " + clean);
        else if (clean.startsWith('-')) result.push("      " + clean);
        else result.push("        " + clean);
    }
    
    const out = result.join('\n');
    document.getElementById('output_box').value = out;
    updateCount('output_box', 'output_count');
    saveHistory(out);
    showToast("✅ 변환 및 저장 완료");
    const popupEl = document.getElementById('cfg_show_popup');
    if (!popupEl || popupEl.checked) showCompletePopup();
}

function showCompletePopup() { document.getElementById('complete_modal').classList.add('show'); }
function closeCompletePopup() { document.getElementById('complete_modal').classList.remove('show'); }

function loadJiraFromClipboard() {
    navigator.clipboard.readText().then(text => {
        if(!text.trim()) return showToast("⚠️ 클립보드가 비어있습니다.", true);
        document.getElementById('jira_input_box').value = text;
        updateCount('jira_input_box', 'jira_input_count');
        saveConfig();
        saveHistory(text);
        showToast("✅ 불러오기 완료. 히스토리에 저장됐습니다.");
    }).catch(() => showToast("⚠️ 클립보드 접근 권한이 필요합니다.", true));
}

function saveConfig() {
    const popupEl = document.getElementById('cfg_show_popup');
    const data = { name: document.getElementById('cfg_name').value, services: document.getElementById('cfg_services').value, input: document.getElementById('input_box').value, jira: document.getElementById('jira_input_box').value, showPopup: popupEl ? popupEl.checked : true };
    localStorage.setItem('dailyReportConfig', JSON.stringify(data));
}
function loadConfig() {
    const data = JSON.parse(localStorage.getItem('dailyReportConfig'));
    if (data) {
        document.getElementById('cfg_name').value = data.name || "";
        document.getElementById('cfg_services').value = data.services || "";
        document.getElementById('input_box').value = data.input || "";
        document.getElementById('jira_input_box').value = data.jira || "";
        const popupEl = document.getElementById('cfg_show_popup');
        if (popupEl) popupEl.checked = data.showPopup !== false;
    }
}

function copyProgress() {
    const name = document.getElementById('cfg_name').value.trim();
    if (!name) return showToast("⚠️ 이름을 먼저 입력해주세요.", true);
    const t = new Date();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    copyToClipboard(`(${name} , 100% , ${mm}/${dd})`, "✅ 진행률 복사 완료");
}

function applyFixedFormat() {
    const name = document.getElementById('cfg_name').value.trim();
    const svcs = document.getElementById('cfg_services').value.trim().split(',');
    if (!name) return showToast("⚠️ 설정에서 이름을 먼저 입력해주세요.", true);
    const current = document.getElementById('input_box').value;
    if (current.trim() && !confirm("작성창의 내용이 초기화됩니다. 계속하시겠습니까?")) return;
    let txt = `■ ${name}\n[업무]\n` + svcs.map(s => s.trim() ? `- ${s.trim()}` : '').filter(s => s).join('\n');
    document.getElementById('input_box').value = txt;
    updateCount('input_box', 'input_count');
    saveConfig();
    showToast("✅ 기본 양식이 적용되었습니다.");
}

// ===== 스마트 넘버링 (일보고 작성 탭) =====

const ROMAN_NUMS = ['i','ii','iii','iv','v','vi','vii','viii','ix','x',
                    'xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx'];
function toRoman(n) { return ROMAN_NUMS[n - 1] || String(n); }

function getListPrefix(level, count) {
    if (level === 0) return count + '. ';
    if (level === 1) return String.fromCharCode(96 + count) + '. ';
    if (level === 2) return toRoman(count) + '. ';
    return '- ';
}

function parseSmartLine(line) {
    const spaces = (line.match(/^( *)/) || ['',''])[1].length;
    const level = Math.min(3, Math.floor(spaces / 2));
    const stripped = line.slice(spaces);
    let m = null;
    if (level === 0) m = stripped.match(/^\d+\. ([\s\S]*)/);
    else if (level === 1) m = stripped.match(/^[a-z]+\. ([\s\S]*)/);
    else if (level === 2) m = stripped.match(/^[ivxlcdm]+\. ([\s\S]*)/i);
    else m = stripped.match(/^- ([\s\S]*)/);
    if (m) return { isList: true, level, content: m[1] };
    return { isList: false, level: 0, content: line };
}

function renderSmartLines(parsed) {
    const cnt = [0, 0, 0, 0];
    return parsed.map(p => {
        if (!p.isList) {
            cnt.fill(0);
            return p.content;
        }
        cnt[p.level]++;
        for (let i = p.level + 1; i < 4; i++) cnt[i] = 0;
        return '  '.repeat(p.level) + getListPrefix(p.level, cnt[p.level]) + p.content;
    }).join('\n');
}

function getLineCtx(value, pos) {
    const before = value.slice(0, pos);
    const lineIdx = (before.match(/\n/g) || []).length;
    const lineStart = before.lastIndexOf('\n') + 1;
    return { lineIdx, lineStart, col: pos - lineStart };
}

function cursorAt(rendered, lineIdx, col) {
    const lines = rendered.split('\n');
    const ls = lines.slice(0, lineIdx).reduce((s, l) => s + l.length + 1, 0);
    return ls + Math.min(col, (lines[lineIdx] || '').length);
}

function handleSmartKey(e) {
    if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Backspace') return;
    const ta = e.target;
    const { value, selectionStart: pos, selectionEnd: posEnd } = ta;
    const lines = value.split('\n');
    const { lineIdx, col } = getLineCtx(value, pos);
    const line = lines[lineIdx];
    const p = parseSmartLine(line);
    const indLen = p.level * 2;
    const prefixLen = p.isList ? (line.length - indLen - p.content.length) : 0;
    const contentOffset = Math.max(0, col - indLen - prefixLen);
    const allP = lines.map(parseSmartLine);

    if (e.key === 'Tab') {
        if (!p.isList) return;
        e.preventDefault();
        // 여러 줄 선택 시: 선택된 모든 줄 일괄 들여쓰기/내어쓰기
        if (pos !== posEnd) {
            const startLineIdx = lineIdx;
            const { lineIdx: endLineIdx } = getLineCtx(value, posEnd);
            for (let i = startLineIdx; i <= endLineIdx; i++) {
                if (!allP[i].isList) continue;
                const nl = e.shiftKey ? Math.max(0, allP[i].level - 1) : Math.min(3, allP[i].level + 1);
                allP[i] = { isList: true, level: nl, content: allP[i].content };
            }
            const rendered = renderSmartLines(allP);
            ta.value = rendered;
            const newStart = cursorAt(rendered, startLineIdx, 0);
            const newEnd = cursorAt(rendered, endLineIdx, rendered.split('\n')[endLineIdx].length);
            ta.selectionStart = newStart;
            ta.selectionEnd = newEnd;
            saveConfig();
            return;
        }
        const newLevel = e.shiftKey ? Math.max(0, p.level - 1) : Math.min(3, p.level + 1);
        if (newLevel === p.level) return;
        allP[lineIdx] = { isList: true, level: newLevel, content: p.content };
        const rendered = renderSmartLines(allP);
        const newLine = rendered.split('\n')[lineIdx];
        const newPLen = newLine.length - newLevel * 2 - p.content.length;
        ta.value = rendered;
        ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx, newLevel * 2 + newPLen + contentOffset);
        saveConfig();
        return;
    }

    if (e.key === 'Enter') {
        if (!p.isList) return;
        if (pos !== posEnd) return; // 선택 범위 있으면 브라우저 기본 동작 후 renumber
        e.preventDefault();
        if (!p.content.trim()) {
            allP[lineIdx] = p.level > 0
                ? { isList: true, level: p.level - 1, content: '' }
                : { isList: false, level: 0, content: '' };
            const rendered = renderSmartLines(allP);
            const newLine = rendered.split('\n')[lineIdx];
            ta.value = rendered;
            ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx, newLine.length);
            saveConfig();
            return;
        }
        const before = p.content.slice(0, contentOffset);
        const after = p.content.slice(contentOffset);
        allP[lineIdx] = { isList: true, level: p.level, content: before };
        allP.splice(lineIdx + 1, 0, { isList: true, level: p.level, content: after });
        const rendered = renderSmartLines(allP);
        const newLine = rendered.split('\n')[lineIdx + 1];
        const newPLen = newLine.length - p.level * 2 - after.length;
        ta.value = rendered;
        ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx + 1, p.level * 2 + newPLen);
        saveConfig();
        return;
    }

    if (e.key === 'Backspace' && pos === posEnd) {
        if (!p.isList || col > indLen + prefixLen) return;
        e.preventDefault();
        if (!p.content) {
            if (lineIdx > 0) {
                const prevLen = lines[lineIdx - 1].length;
                allP.splice(lineIdx, 1);
                const rendered = renderSmartLines(allP);
                ta.value = rendered;
                ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx - 1, prevLen);
            } else if (p.level > 0) {
                allP[lineIdx] = { isList: true, level: p.level - 1, content: '' };
                const rendered = renderSmartLines(allP);
                const newLine = rendered.split('\n')[lineIdx];
                ta.value = rendered;
                ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx, newLine.length);
            }
        } else if (p.level > 0) {
            allP[lineIdx] = { isList: true, level: p.level - 1, content: p.content };
            const rendered = renderSmartLines(allP);
            const newLine = rendered.split('\n')[lineIdx];
            const newPLen = newLine.length - (p.level - 1) * 2 - p.content.length;
            ta.value = rendered;
            ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx, (p.level - 1) * 2 + newPLen);
        } else {
            allP[lineIdx] = { isList: false, level: 0, content: p.content };
            const rendered = renderSmartLines(allP);
            ta.value = rendered;
            ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx, 0);
        }
        saveConfig();
    }
}

function handleSmartPaste(e) {
    setTimeout(() => renumberSmartInput(e.target), 0);
}

function renumberSmartInput(ta) {
    if (!ta) ta = document.getElementById('input_box');
    const pos = ta.selectionStart;
    const oldLines = ta.value.split('\n');
    const { lineIdx, col } = getLineCtx(ta.value, pos);
    const parsed = oldLines.map(parseSmartLine);
    const rendered = renderSmartLines(parsed);
    if (rendered !== ta.value) {
        // prefix 길이 변화를 반영해 커서를 content 기준으로 재계산
        const p = parsed[lineIdx];
        const oldIndLen = p.level * 2;
        const oldLine = oldLines[lineIdx] || '';
        const oldPrefixLen = p.isList ? (oldLine.length - oldIndLen - p.content.length) : 0;
        const contentOffset = Math.max(0, col - oldIndLen - oldPrefixLen);
        const newRenderedLines = rendered.split('\n');
        const newLine = newRenderedLines[lineIdx] || '';
        const newPrefixLen = p.isList ? (newLine.length - oldIndLen - p.content.length) : 0;
        const newCol = p.isList ? oldIndLen + newPrefixLen + contentOffset : col;
        ta.value = rendered;
        ta.selectionStart = ta.selectionEnd = cursorAt(rendered, lineIdx, newCol);
        saveConfig();
    }
}

function toggleSelectAll(masterCb) {
    document.querySelectorAll('.history-checkbox').forEach(cb => {
        cb.checked = masterCb.checked;
        cb.closest('.history-item').classList.toggle('selected', masterCb.checked);
    });
}

window.onload = () => { 
    loadConfig(); renderHistory(); 
    const display = document.getElementById('bookmark_code_display');
    if(display) display.value = MY_JIRA_CODE;
    document.querySelectorAll('textarea, input').forEach(el => {
        el.addEventListener('input', () => {
            saveConfig();
            if(el.id === 'input_box') { updateCount('input_box', 'input_count'); renumberSmartInput(el); }
            if(el.id === 'jira_input_box') updateCount('jira_input_box', 'jira_input_count');
        });
    });
    const inputBox = document.getElementById('input_box');
    inputBox.addEventListener('keydown', handleSmartKey);
    inputBox.addEventListener('paste', handleSmartPaste);

    // 북마크릿으로 열린 경우 ready 신호 전송
    if (window.opener) {
        window.opener.postMessage({ type: 'daily_report_ready' }, '*');
    }
    // 북마크릿에서 전송한 Jira 데이터 수신
    window.addEventListener('message', (e) => {
        if (!e.data || e.data.type !== 'jira_data') return;
        const text = e.data.data;
        if (!text || !text.trim()) return;
        document.getElementById('jira_input_box').value = text;
        updateCount('jira_input_box', 'jira_input_count');
        saveConfig();
        saveHistory(text);
        switchTab(2);
        showToast('✅ 적용 완료되었습니다.');
    });
};