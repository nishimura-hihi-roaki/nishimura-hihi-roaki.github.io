// Sales Dashboard JavaScript - 日付別表示機能追加版

// グローバル変数
let allYouTubeData = [];
let availableDates = [];
let currentView = 'all'; // 'daily' or 'all'

// 販売データの定義（軽量化）
const salesData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
        {
            label: "Front",
            borderColor: "rgba(195, 40, 96, 1)",
            pointBackgroundColor: "rgba(195, 40, 96, 1)",
            data: [3400, 3000, 2500, 4500, 2500, 3400, 3000],
            fill: false,
            tension: 0.3
        },
        {
            label: "Middle",
            borderColor: "rgba(255, 172, 100, 1)",
            pointBackgroundColor: "rgba(255, 172, 100, 1)",
            data: [1900, 1700, 2100, 3600, 2200, 2500, 2000],
            fill: false,
            tension: 0.3
        },
        {
            label: "Back",
            borderColor: "rgba(88, 188, 116, 1)",
            pointBackgroundColor: "rgba(88, 188, 116, 1)",
            data: [1000, 1400, 1100, 2600, 2000, 900, 1400],
            fill: false,
            tension: 0.3
        }
    ]
};

// チャートオプションの定義（軽量化）
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 11 }
            }
        }
    },
    elements: {
        point: {
            radius: 4,
            borderWidth: 1,
            hoverRadius: 6
        },
        line: {
            borderWidth: 2
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: {
                color: '#666',
                font: { size: 10 }
            }
        },
        y: {
            beginAtZero: true,
            max: 4500,
            grid: {
                color: "rgba(225, 255, 255, 0.1)"
            },
            ticks: {
                color: '#666',
                stepSize: 1000,
                font: { size: 10 }
            }
        }
    },
    animation: {
        duration: 1000,
        easing: 'easeOutCubic'
    }
};

// Chart.js チャートの初期化
function initChart() {
    const ctx = document.getElementById('salesData').getContext('2d');
    
    const canvas = ctx.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    
    return new Chart(ctx, {
        type: 'line',
        data: salesData,
        options: chartOptions
    });
}

// ダッシュボードの初期化
function initDashboard() {
    const chart = initChart();
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            chart.resize();
        }, 250);
    });
    
    return { chart };
}

// YouTubeデータを取得してテーブルに表示
async function fetchYouTubeData() {
    try {
        showTableLoading();
        const response = await fetch('https://script.google.com/macros/s/AKfycbyuJJHMMKtAyijttT1-RAJBF2q3l3RfwcStdqgEdlggCGBL0pWKUGdm5nuREoWftwpr/exec');
        const data = await response.json();
        
        // 全データをグローバル変数に保存
        allYouTubeData = data.slice(1); // ヘッダー行を除外
        
        // 利用可能な日付を取得してソート（新しい順）
        availableDates = [...new Set(allYouTubeData.map(row => getDateOnly(row[0])))].sort((a, b) => new Date(b) - new Date(a));

        // 日付セレクターを作成・更新
        createDateSelector();
        
        // デフォルト表示（全期間最高再生数）
        showAllTimeData();
        
    } catch (error) {
        console.error('データの取得に失敗しました:', error);
        showTableError('データの取得に失敗しました');
    }
}

// 日付セレクターを作成
function createDateSelector() {
    // 既存の日付セレクターがあれば削除
    const existingSelector = document.getElementById('dateSelector');
    if (existingSelector) {
        existingSelector.remove();
    }
    
    // 日付セレクターのHTML要素を作成
    const selectorHTML = `
        <div id="dateSelector" style="background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: none;">
            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                <label for="dateSelect" style="font-weight: 500; color: #333;">日付を選択:</label>
                <select id="dateSelect" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    <option value="">日付を選択してください...</option>
                </select>
                <button id="loadDateBtn" style="background: #4fc3f7; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">表示</button>
                <button id="refreshDataBtn" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">データ更新</button>
            </div>
            <div id="currentViewInfo" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;"></div>
        </div>
    `;
    
    // h2要素の前に挿入
    const h2Element = document.querySelector('.mainChart h2');
    h2Element.insertAdjacentHTML('beforebegin', selectorHTML);
    
    // 日付オプションを追加
    const dateSelect = document.getElementById('dateSelect');
    availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDateForDisplay(date);
        dateSelect.appendChild(option);
    });
    
    // 表示切り替えボタンを作成
    createViewToggleButtons();
    
    // イベントリスナーを設定
    setupDateSelectorEvents();
}

// 表示切り替えボタンを作成
function createViewToggleButtons() {
    // 既存のコントロールを更新
    const titleBar = document.getElementById('titleBar');
    const controlsContainer = titleBar.querySelector('.controls')?.parentElement;
    
    if (controlsContainer) {
        controlsContainer.innerHTML = `
            <span class="controls activeControl" id="allTimeBtn">全期間最高再生数</span>
            <span class="controls" id="dailyRankBtn">日別ランキング</span>
        `;
        
        // イベントリスナーを設定
        document.getElementById('allTimeBtn').addEventListener('click', () => switchToAllTimeView());
        document.getElementById('dailyRankBtn').addEventListener('click', () => switchToDailyView());
    }
}
function createViewToggleButtons() {
    document.getElementById('allTimeBtn').addEventListener('click', switchToAllTimeView);
    document.getElementById('dailyRankBtn').addEventListener('click', switchToDailyView);
}
// 日付セレクターのイベントリスナー設定
function setupDateSelectorEvents() {
    // 日付選択時
    document.getElementById('dateSelect').addEventListener('change', (e) => {
        if (e.target.value && currentView === 'daily') {
            showDailyData(e.target.value);
        }
    });
    
    // 表示ボタン
    document.getElementById('loadDateBtn').addEventListener('click', () => {
        const selectedDate = document.getElementById('dateSelect').value;
        if (selectedDate) {
            showDailyData(selectedDate);
        } else {
            alert('日付を選択してください');
        }
    });
    
    // データ更新ボタン
    document.getElementById('refreshDataBtn').addEventListener('click', () => {
        fetchYouTubeData();
    });
}

// 全期間表示に切り替え
function switchToAllTimeView() {
    currentView = 'all';
    document.getElementById('allTimeBtn').classList.add('activeControl');
    document.getElementById('dailyRankBtn').classList.remove('activeControl');
    document.getElementById('dateSelector').style.display = 'none';
    
    showAllTimeData();
}

// 日別表示に切り替え
function switchToDailyView() {
    currentView = 'daily';
    document.getElementById('dailyRankBtn').classList.add('activeControl');
    document.getElementById('allTimeBtn').classList.remove('activeControl');
    document.getElementById('dateSelector').style.display = 'block';
    
    // 最新日付を自動選択
    if (availableDates.length > 0) {
        const dateSelect = document.getElementById('dateSelect');
        dateSelect.value = availableDates[0];
        showDailyData(availableDates[0]);
    }
}

// 全期間最高再生数データを表示（元の機能）
function showAllTimeData() {
    const seenUrls = new Set();
    const youtubeData = allYouTubeData
        .filter(row => !seenUrls.has(row[10]) && seenUrls.add(row[10]))
        .sort((a, b) => Number(b[7]) - Number(a[7]))
        .slice(0, 50);

    updateTable(youtubeData);
    updateCurrentViewInfo('全期間での最高再生数 TOP50');
    updateTableTitle('今月の急上昇最大再生数ランキング');
}

function getDateOnly(dateString) {
    const match = dateString.match(/^(\d{4}\/\d{2}\/\d{2})/);
    return match ? match[1] : dateString;
}

function showDailyData(selectedDate) {
    if (!selectedDate) return;

    // 日付部分だけでフィルタリング
    const dailyData = allYouTubeData
        .filter(row => getDateOnly(row[0]) === selectedDate)
        .sort((a, b) => Number(a[1]) - Number(b[1])) // 順位順
        .slice(0, 50);

    if (dailyData.length === 0) {
        showTableError(`${selectedDate}のデータが見つかりませんでした`);
        return;
    }

    updateTable(dailyData);
    updateCurrentViewInfo(`${selectedDate}の急上昇ランキング TOP${dailyData.length}`);
    updateTableTitle(`${selectedDate} - 急上昇ランキング`);
}


// テーブルを動的に更新（元の関数を改良）
function updateTable(data) {
    const table = document.querySelector('table');
    
    // 既存のテーブル内容をクリア
    table.innerHTML = '';
    
    // ヘッダー行を作成
    const headerRow = table.insertRow();
    const headers = ['日付', '順位(当時)', 'タイトル', 'チャンネル', 'ジャンル','再生数', '高評価'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    // データ行を作成
    data.forEach(row => {
        const tr = table.insertRow();
        
        // 日付
        const dateCell = tr.insertCell();
        dateCell.textContent = row[0];
        
        // 順位
        const rankCell = tr.insertCell();
        rankCell.textContent = row[1];
        
        // タイトル（リンク付き）
        const titleCell = tr.insertCell();
        const link = document.createElement('a');
        link.href = row[10]; // URL
        link.textContent = row[2]; // タイトル
        link.target = '_blank';
        link.style.color = '#4fc3f7';
        link.style.textDecoration = 'none';
        titleCell.appendChild(link);
        
        // チャンネル
        const channelCell = tr.insertCell();
        channelCell.textContent = row[3];
        
        // ジャンル
        const genreCell = tr.insertCell();
        genreCell.textContent = row[5]; 
        
        // 再生数（フォーマット）
        const viewsCell = tr.insertCell();
        viewsCell.textContent = formatNumber(row[7]);
        
        // 高評価（フォーマット）
        const likesCell = tr.insertCell();
        likesCell.textContent = formatNumber(row[8]);
    });
}

// 表示中の情報を更新
function updateCurrentViewInfo(info) {
    const infoElement = document.getElementById('currentViewInfo');
    if (infoElement) {
        infoElement.textContent = `表示中: ${info}`;
    }
}

// テーブルタイトルを更新
function updateTableTitle(title) {
    const titleElement = document.querySelector('.mainChart h2');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// 日付表示用フォーマット
function formatDateForDisplay(dateString) {
    return dateString; // AM/PM付きのまま表示
}


// テーブルローディング表示
function showTableLoading() {
    const table = document.querySelector('table');
    table.innerHTML = `
        <tr>
            <th colspan="7" style="text-align: center; padding: 40px;">
                データを読み込み中...
                <div style="margin-top: 10px;">
                    <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #ddd; border-top: 2px solid #4fc3f7; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </th>
        </tr>
    `;
    
    // CSS アニメーションを追加
    if (!document.getElementById('spinAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinAnimation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// テーブルエラー表示
function showTableError(message) {
    const table = document.querySelector('table');
    table.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; color: #e74c3c; padding: 40px;">
                ${message}
            </td>
        </tr>
    `;
}

// 数値をフォーマット（1,234,567 形式）
function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    return parseInt(num).toLocaleString();
}

// ページ読み込み後に実行
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = initDashboard();
    
    // YouTubeデータを取得してテーブルを更新
    fetchYouTubeData();
});