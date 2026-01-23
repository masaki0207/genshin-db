// 【重要】ご自身のウェブアプリURLに書き換えてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbyZJ5eAIf1faDyl7rknm8S5BpyYhF0PtGqaW1iyImBhuQ69X8o5KIf8xdBUAq6WDjca/exec";

let allData = { characters: [], artifacts: [] };

// --- 1. 初期化とモード切り替え ---
window.onload = () => {
    loadData();
    const topBtn = document.getElementById('back-to-top');
    window.onscroll = () => { topBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none'; };
    topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
};

function changeMode(mode) {
    document.getElementById('view-mode').style.display = (mode === 'view') ? 'block' : 'none';
    document.getElementById('register-mode').style.display = (mode === 'register') ? 'block' : 'none';
    if (mode === 'view') loadData();
}

function showForm(formId) {
    document.getElementById('char-form-container').style.display = 'none';
    document.getElementById('art-form-container').style.display = 'none';
    document.getElementById(formId).style.display = 'block';
}

// --- 2. データ読み込みと図鑑表示 ---
async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        allData = await response.json();
        updateArtifactCheckboxes(); 
        renderAll();
    } catch (e) { console.error("読み込み失敗:", e); }
}

function renderAll() {
    const charList = document.getElementById('char-list');
    const artList = document.getElementById('art-list');

    // キャラクター図鑑の表示
    charList.innerHTML = allData.characters.slice(1).map(c => `
        <div class="card char-card">
            <div class="card-header">
                <img src="${c[11] || 'https://via.placeholder.com/70?text=No+Icon'}" alt="">
                <div style="flex-grow:1;">
                    <h4>${c[0]} <span class="rarity">★${c[1]}</span></h4>
                    <p class="tag">${c[2] || ''}</p><p class="tag">${c[3] || ''}</p>
                </div>
                <div class="card-btns">
                    <button class="edit-btn" onclick="editItem('characters', '${c[0]}')">編集</button>
                    <button class="delete-btn" onclick="deleteItem('characters', '${c[0]}')">削除</button>
                </div>
            </div>
            <div class="card-content">
                <p><strong>おすすめ武器:</strong> ${c[10] || '未設定'}</p>
                <p><strong>目標チャージ:</strong> <span style="color:#2e7d32; font-weight:bold;">${c[9] || 'なし'}</span></p>
                <hr>
                <p><strong>聖遺物:</strong> ${c[4]}</p>
                <p><strong>メイン:</strong> 砂(${c[5]}) / 杯(${c[6]}) / 冠(${c[7]})</p>
                <p><strong>サブ優先:</strong> <span style="color:#e67e22; font-weight:bold;">${c[8]}</span></p>
            </div>
        </div>
    `).join('');

    // 聖遺物図鑑（自動集計）の表示
    artList.innerHTML = allData.artifacts.slice(1).map(a => {
        const artName = a[0];
        const users = allData.characters.slice(1).filter(c => c[4].includes(artName));
        const getKeepStats = (colIdx) => {
            let stats = users.map(u => u[colIdx]).join(', ').split(',').map(s => s.trim()).filter(s => s);
            return [...new Set(stats)].join(', ') || "なし";
        };

        return `
        <div class="card art-card">
            <div class="card-header">
                <img src="${a[8] || 'https://via.placeholder.com/70?text=No+Image'}" alt="">
                <div style="flex-grow:1;"><h4>${artName}</h4></div>
                <div class="card-btns">
                    <button class="edit-btn" onclick="editItem('artifacts', '${artName}')">編集</button>
                    <button class="delete-btn" onclick="deleteItem('artifacts', '${artName}')">削除</button>
                </div>
            </div>
            <div class="card-content">
                <div class="keep-stats-box">
                    <p style="margin:0; font-weight:bold; color:#d32f2f;">【残すべきメインステ】</p>
                    <p style="margin:2px 0;">砂: ${getKeepStats(5)} / 杯: ${getKeepStats(6)} / 冠: ${getKeepStats(7)}</p>
                </div>
                <p><strong>2セット:</strong> ${a[1] || ''}</p>
                <p><strong>4セット:</strong> ${a[2] || ''}</p>
                <hr>
                <p><strong>使用者:</strong> ${users.map(u => u[0]).join(', ') || 'なし'}</p>
            </div>
        </div>`;
    }).join('');
}

// --- 3. 編集機能（フォームへの復元） ---
function editItem(type, id) {
    changeMode('register');
    if (type === 'characters') {
        showForm('char-form-container');
        const c = allData.characters.find(row => row[0] === id);
        
        document.getElementById('char-name').value = c[0];
        document.getElementById('target-er').value = c[9] || '';
        document.getElementById('recommended-weapons').value = c[10] || '';
        document.getElementById('char-icon-url').value = c[11] || '';

        const setChecks = (name, values) => {
            const vals = values ? values.split(',').map(v => v.trim()) : [];
            document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = vals.includes(el.value));
        };

        setChecks('element', c[2]);
        setChecks('weapon-type', c[3]);
        setChecks('char-art-choice', c[4]);
        setChecks('main-suna', c[5]);
        setChecks('main-sakazuki', c[6]);
        setChecks('main-kanmuri', c[7]);

        // サブステ順位の復元
        const ranks = c[8] ? c[8].split(' ') : [];
        const inputs = document.querySelectorAll('.substat-rank');
        inputs.forEach((input, i) => {
            const val = ranks.find(r => r.startsWith(`${i+1}.`));
            input.value = val ? val.split('.')[1] : '';
        });
    } else {
        showForm('art-form-container');
        const a = allData.artifacts.find(row => row[0] === id);
        document.getElementById('art-name').value = a[0];
        document.getElementById('art-effect-2').value = a[1];
        document.getElementById('art-effect-4').value = a[2];
        document.getElementById('art-img-url').value = a[8];
    }
}

// --- 4. 登録処理 ---
function updateArtifactCheckboxes() {
    const container = document.getElementById('char-target-art-list');
    container.innerHTML = allData.artifacts.slice(1).map(a => `
        <label><input type="checkbox" name="char-art-choice" value="${a[0]}"> ${a[0]}</label>
    `).join('') || '<p style="font-size:0.8rem; color:gray;">聖遺物を先に登録してください</p>';
}

document.getElementById('char-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const charName = document.getElementById('char-name').value;
    const getChecks = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value).join(', ');
    
    // サブステ順位の取得
    const subRankString = Array.from(document.querySelectorAll('.substat-rank'))
        .map((el, i) => el.value ? `${i+1}.${el.value}` : '')
        .filter(s => s).join(' ');

    const payload = {
        sheetName: "characters",
        charName: charName,
        targetArtifactNames: getChecks('char-art-choice'),
        data: [
            charName, 
            document.querySelector('input[name="rarity"]:checked').value,
            getChecks('element'),
            getChecks('weapon-type'),
            getChecks('char-art-choice'),
            getChecks('main-suna'), getChecks('main-sakazuki'), getChecks('main-kanmuri'),
            subRankString,
            document.getElementById('target-er').value,
            document.getElementById('recommended-weapons').value,
            document.getElementById('char-icon-url').value
        ]
    };

    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("保存完了！");
    e.target.reset();
    changeMode('view');
});

document.getElementById('art-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        sheetName: "artifacts",
        data: [
            document.getElementById('art-name').value,
            document.getElementById('art-effect-2').value,
            document.getElementById('art-effect-4').value,
            "", "", "", "", "", 
            document.getElementById('art-img-url').value
        ]
    };
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("聖遺物保存完了！");
    e.target.reset();
    changeMode('view');
});

async function deleteItem(sheet, id) {
    if(!confirm(`${id} を削除しますか？`)) return;
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action: "delete", sheetName: sheet, id: id}) });
    loadData();
}

function filterData() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(query) ? 'flex' : 'none';
    });
}
