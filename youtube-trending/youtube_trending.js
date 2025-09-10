// YouTube Trending Dashboard JavaScript - 改良版

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

        // 日付セレクターを更新
        updateDateSelector();
        
        // デフォルト表示（全期間最高再生数）
        showAllTimeData();
        
    } catch (error) {
        console.error('データの取得に失敗しました:', error);
        showTableError('データの取得に失敗しました');
    }
}

// カテゴリ別YouTubeデータ取得（GAS Webアプリ呼び出し - JSONP版）
async function fetchYouTubeDataByCategory(category = "All") {
    try {
        console.log(`カテゴリ "${category}" のデータ取得中...`);

        // JSONPを使用してGASからデータを取得
        const data = await new Promise((resolve, reject) => {
            const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const script = document.createElement('script');
            const gasUrl = 'https://script.google.com/macros/s/AKfycbwYLE7XorPdhO1TJGZFzzaPmgorckF1pf4elNaG-gcUdr2EZd1SO5USH4rTbn5qguDA/exec';
            
            let isCompleted = false; // 重複実行防止フラグ
            
            // クリーンアップ関数
            const cleanup = () => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
            
            // グローバルコールバック関数を定義
            window[callbackName] = function(responseData) {
                if (isCompleted) return;
                isCompleted = true;
                
                cleanup();
                resolve(responseData);
            };
            
            // エラーハンドリング
            script.onerror = function() {
                if (isCompleted) return;
                isCompleted = true;
                
                cleanup();
                reject(new Error(`GASへの接続に失敗しました`));
            };
            
            // タイムアウト処理（10秒）
            const timeoutId = setTimeout(() => {
                if (isCompleted) return;
                isCompleted = true;
                
                cleanup();
                reject(new Error(`データ取得がタイムアウトしました`));
            }, 10000);
            
            // スクリプトタグを作成してリクエスト実行
            script.src = `${gasUrl}?category=${encodeURIComponent(category)}&callback=${callbackName}`;
            document.head.appendChild(script);
        });

        console.log(`カテゴリ "${category}" のデータ取得完了:`, data);
        return data;

    } catch (error) {
        console.error(`カテゴリ "${category}" のデータ取得に失敗:`, error);
        throw error;
    }
}

// 日付セレクターを更新
function updateDateSelector() {
    const dateSelect = document.getElementById('dateSelect');
    
    // 既存のオプションをクリア（最初のデフォルトオプション以外）
    dateSelect.innerHTML = '<option value="">日付を選択してください...</option>';
    
    // 日付オプションを追加
    availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDateForDisplay(date);
        dateSelect.appendChild(option);
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // 表示切り替えボタン
    document.getElementById('allTimeBtn').addEventListener('click', switchToAllTimeView);
    document.getElementById('dailyRankBtn').addEventListener('click', switchToDailyView);
    
    // 日付選択
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

// 全期間最高再生数データを表示
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

// 日付部分のみを取得
function getDateOnly(dateString) {
    const match = dateString.match(/^(\d{4}\/\d{2}\/\d{2})/);
    return match ? match[1] : dateString;
}

// 日別データを表示
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

// テーブルを動的に更新
function updateTable(data) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // ヘッダーを設定
    thead.innerHTML = '';
    const headerRow = thead.insertRow();
    const headers = ['日付', '順位(当時)', 'タイトル', 'チャンネル', 'ジャンル','再生数', '高評価'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    // データ行をクリアして新しいデータを追加
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = tbody.insertRow();
        
        // 日付
        tr.insertCell().textContent = row[0];
        
        // 順位
        tr.insertCell().textContent = row[1];
        
        // タイトル（リンク付き）
        const titleCell = tr.insertCell();
        const link = document.createElement('a');
        link.href = row[10]; // URL
        link.textContent = row[2]; // タイトル
        link.target = '_blank';
        link.className = 'table-link';
        titleCell.appendChild(link);
        
        // チャンネル
        tr.insertCell().textContent = row[3];
        
        // ジャンル
        tr.insertCell().textContent = row[5];
        
        // 再生数（フォーマット）
        tr.insertCell().textContent = formatNumber(row[7]);
        
        // 高評価（フォーマット）
        tr.insertCell().textContent = formatNumber(row[8]);
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
    const titleElement = document.getElementById('tableTitle');
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
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    thead.innerHTML = `
        <tr>
            <th colspan="7" class="loading-message">
                データを読み込み中...
                <div style="margin-top: 10px;">
                    <div class="spinner"></div>
                </div>
            </th>
        </tr>
    `;
    tbody.innerHTML = '';
}

// テーブルエラー表示
function showTableError(message) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    thead.innerHTML = `
        <tr>
            <td colspan="7" class="error-message">
                ${message}
            </td>
        </tr>
    `;
    tbody.innerHTML = '';
}

// 数値をフォーマット（1,234,567 形式）
function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    return parseInt(num).toLocaleString();
}

// ページ読み込み後に実行
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = initDashboard();
    
    // イベントリスナーを設定
    setupEventListeners();
    
    // YouTubeデータを取得してテーブルを更新
    fetchYouTubeData();
});