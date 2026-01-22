// 【重要】ご自身のウェブアプリURLに書き換えてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbw2H7TBw2W4e_eaklGHzTZOOYYB5rg33aAJRm6FXonJrDL-akCE1Qms1VxIyh6a1Upz/exec";

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

// --- 2. データ読み込みと自動集計表示 ---
async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        allData = await response.json();
        updateArtifactCheckboxes(); // キャラ登録用の聖遺物選択肢を更新
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
                <img src="${c[9] || 'https://via.placeholder.com/70?text=No+Icon'}" alt="">
                <div style="flex-grow:1;">
                    <h4>${c[0]} <span class="rarity">★${c[1]}</span></h4>
                    <p class="tag">${c[2] || ''}</p>
                </div>
                <div class="card-btns">
                    <button class="edit-btn" onclick="editItem('characters', '${c[0]}')">編集</button>
                    <button class="delete-btn" onclick="deleteItem('characters', '${c[0]}')">削除</button>
                </div>
            </div>
            <div class="card-content">
                <p><strong>おすすめ聖遺物:</strong> ${c[4]}</p>
                <p><strong>メイン:</strong> 砂(${c[5]}) 杯(${c[6]}) 冠(${c[7]})</p>
                <p><strong>優先サブ:</strong> ${c[8]}</p>
            </div>
        </div>
    `).join('');

    // 聖遺物図鑑（自動集計）の表示
    artList.innerHTML = allData.artifacts.slice(1).map(a => {
        const artName = a[0];
        // この聖遺物を使っている全キャラを抽出
        const users = allData.characters.slice(1).filter(c => c[4].includes(artName));
        
        // 砂・杯・冠のステータスをキャラ全員分から集計して重複を消す
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
                <p style="color:#d32f2f; font-weight:bold;">【残すべきメインステ】</p>
                <p><strong>砂:</strong> ${getKeepStats(5)}</p>
                <p><strong>杯:</strong> ${getKeepStats(6)}</p>
                <p><strong>冠:</strong> ${getKeepStats(7)}</p>
                <hr>
                <p><strong>2セット:</strong> ${a[1] || '未登録'}</p>
                <p><strong>4セット:</strong> ${a[2] || '未登録'}</p> <hr>
                <p><strong>おすすめキャラ:</strong> ${users.map(u => u[0]).join(', ') || 'なし'}</p>
            </div>
        </div>`;
    }).join('');
}

// --- 3. 編集機能 ---
function editItem(type, id) {
    changeMode('register');
    if (type === 'characters') {
        showForm('char-form-container');
        const c = allData.characters.find(row => row[0] === id);
        document.getElementById('char-name').value = c[0];
        document.getElementById('char-icon-url').value = c[9];
        // チェックボックス類の復元処理
        const setChecks = (name, values) => {
            const vals = values.split(',').map(v => v.trim());
            document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = vals.includes(el.value));
        };
        setChecks('element', c[2]);
        setChecks('char-art-choice', c[4]);
        setChecks('main-suna', c[5]);
        setChecks('main-sakazuki', c[6]);
        setChecks('main-kanmuri', c[7]);
        setChecks('sub-stats', c[8]);
    } else {
        showForm('art-form-container');
        const a = allData.artifacts.find(row => row[0] === id);
        document.getElementById('art-name').value = a[0];
        document.getElementById('art-effect-2').value = a[1];
        document.getElementById('art-effect-4').value = a[2];
        document.getElementById('art-img-url').value = a[8];
    }
}

// --- 4. 登録・送信処理 ---
function updateArtifactCheckboxes() {
    const container = document.getElementById('char-target-art-list');
    if (allData.artifacts.length <= 1) return;
    container.innerHTML = allData.artifacts.slice(1).map(a => `
        <label><input type="checkbox" name="char-art-choice" value="${a[0]}"> ${a[0]}</label>
    `).join('');
}

document.getElementById('char-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const charName = document.getElementById('char-name').value;
    const selectedArts = Array.from(document.querySelectorAll('input[name="char-art-choice"]:checked')).map(el => el.value).join(', ');
    const getVals = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value).join(', ');

    const payload = {
        sheetName: "characters",
        charName: charName,
        targetArtifactNames: selectedArts, // GAS側で使用者更新に使う
        data: [
            charName, document.querySelector('input[name="rarity"]:checked').value,
            getVals('element'), "武器種固定", selectedArts,
            getVals('main-suna'), getVals('main-sakazuki'), getVals('main-kanmuri'),
            getVals('sub-stats'), document.getElementById('char-icon-url').value
        ]
    };
    await sendData(payload);
    alert("保存しました");
    e.target.reset();
    changeMode('view');
});

document.getElementById('art-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const artName = document.getElementById('art-name').value;
    const payload = {
        sheetName: "artifacts",
        data: [
            artName, document.getElementById('art-effect-2').value,
            document.getElementById('art-effect-4').value,
            "", "", "", "", "", document.getElementById('art-img-url').value
        ]
    };
    await sendData(payload);
    alert("聖遺物を保存しました");
    e.target.reset();
    changeMode('view');
});

async function sendData(p) { await fetch(GAS_URL, {method: "POST", body: JSON.stringify(p)}); }

async function deleteItem(sheet, id) {
    if(!confirm(`${id} を削除しますか？`)) return;
    await sendData({action: "delete", sheetName: sheet, id: id});
    loadData();
}

function filterData() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(query) ? 'flex' : 'none';
    });

}
