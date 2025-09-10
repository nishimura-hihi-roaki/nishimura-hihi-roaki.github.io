// YouTube Trending Dashboard JavaScript - カテゴリ分析機能追加版

// グローバル変数
let allYouTubeData = [];
let categoryData = [];
let availableDates = [];
let currentView = 'all'; // 'daily', 'all', 'category'
let categoryChart = null;

// カテゴリ別のデータを取得してグラフ表示
async function showCategoryAnalysis() {
    try {
        showTableLoading();
        updateTableTitle('カテゴリ分析 - データ取得中...');
        
        // 全カテゴリのデータを並列取得
        const categories = ['All', '音楽', 'エンターテイメント', 'ゲーム', 'ハウツーとスタイル', 'ペットと動物'];
        const promises = categories.map(category => fetchYouTubeDataByCategory(category));
        const results = await Promise.all(promises);
        
        // カテゴリ別データを整理
        categoryData = categories.map((category, index) => ({
            name: category === 'All' ? '全体' : category,
            data: results[index].slice(1), // ヘッダー除去
            color: getCategoryColor(category)
        }));
        
        // カテゴリ分析グラフを表示
        showCategoryChart();
        
        // テーブルには全体データを表示
        const allData = results[0].slice(1);
        updateTable(allData.slice(0, 20)); // 上位20件
        updateTableTitle('カテゴリ分析 - 全体ランキング TOP20');
        updateCurrentViewInfo(`カテゴリ別データ分析 (${categories.length}カテゴリ)`);
        
    } catch (error) {
        console.error('カテゴリ分析データの取得に失敗:', error);
        showTableError('カテゴリ分析データの取得に失敗しました');
    }
}

// カテゴリ別色を取得
function getCategoryColor(category) {
    const colors = {
        'All': 'rgba(79, 195, 247, 1)',
        '音楽': 'rgba(236, 21, 97, 1)',
        'エンターテイメント': 'rgba(255, 153, 57, 1)',
        'ゲーム': 'rgba(43, 171, 81, 1)',
        'ハウツーとスタイル': 'rgba(156, 39, 176, 1)',
        'ペットと動物': 'rgba(255, 193, 7, 1)'
    };
    return colors[category] || 'rgba(158, 158, 158, 1)';
}

// カテゴリ分析グラフを表示
function showCategoryChart() {
    // メインチャートを非表示、カテゴリチャートを表示
    document.getElementById('salesData').style.display = 'none';
    document.getElementById('categoryChart').style.display = 'block';
    
    // カテゴリ別の統計データを計算
    const chartData = prepareCategoryChartData();
    
    // 既存のチャートを破棄
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // 新しいチャートを作成
    const ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'カテゴリ別平均統計',
                    color: '#fff',
                    font: { size: 16 }
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#fff',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    },
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutCubic'
            }
        }
    });
}

// カテゴリチャート用データを準備
function prepareCategoryChartData() {
    const categories = categoryData.filter(cat => cat.name !== '全体');
    
    // 各カテゴリの平均再生数と平均高評価数を計算
    const avgViewsData = categories.map(cat => {
        const views = cat.data.map(row => parseInt(row[7]) || 0);
        return views.length > 0 ? views.reduce((a, b) => a + b, 0) / views.length : 0;
    });
    
    const avgLikesData = categories.map(cat => {
        const likes = cat.data.map(row => parseInt(row[8]) || 0);
        return likes.length > 0 ? likes.reduce((a, b) => a + b, 0) / likes.length : 0;
    });
    
    return {
        labels: categories.map(cat => cat.name),
        datasets: [
            {
                label: '平均再生数',
                data: avgViewsData,
                backgroundColor: categories.map(cat => cat.color.replace('1)', '0.7)')),
                borderColor: categories.map(cat => cat.color),
                borderWidth: 2
            },
            {
                label: '平均高評価数',
                data: avgLikesData,
                backgroundColor: categories.map(cat => cat.color.replace('1)', '0.4)')),
                borderColor: categories.map(cat => cat.color),
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    };
}

// メインチャートに戻す
function showMainChart() {
    document.getElementById('salesData').style.display = 'block';
    document.getElementById('categoryChart').style.display = 'none';
}

// カテゴリ別表示に切り替え
function switchToCategoryView() {
    currentView = 'category';
    document.getElementById('allTimeBtn').classList.remove('activeControl');
    document.getElementById('dailyRankBtn').classList.remove('activeControl');
    document.getElementById('categoryViewBtn').classList.add('activeControl');
    document.getElementById('dateSelector').style.display = 'none';
    
    showCategoryAnalysis();
}

// イベントリスナーの設定（既存に追加）
function setupEventListeners() {
    // 表示切り替えボタン
    document.getElementById('allTimeBtn').addEventListener('click', () => {
        switchToAllTimeView();
        showMainChart();
    });
    
    document.getElementById('dailyRankBtn').addEventListener('click', () => {
        switchToDailyView();
        showMainChart();
    });
    
    // カテゴリ分析ボタン（サイドメニューから）
    document.getElementById('dashboardBtn').addEventListener('click', () => {
        // カテゴリビューボタンを表示
        document.getElementById('categoryViewBtn').style.display = 'inline-block';
        switchToCategoryView();
    });
    
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
        if (currentView === 'category') {
            showCategoryAnalysis();
        } else {
            fetchYouTubeData();
        }
    });
}

// 全期間表示に切り替え（修正版）
function switchToAllTimeView() {
    currentView = 'all';
    document.getElementById('allTimeBtn').classList.add('activeControl');
    document.getElementById('dailyRankBtn').classList.remove('activeControl');
    document.getElementById('categoryViewBtn').classList.remove('activeControl');
    document.getElementById('dateSelector').style.display = 'none';
    
    showAllTimeData();
}

// 日別表示に切り替え（修正版）
function switchToDailyView() {
    currentView = 'daily';
    document.getElementById('dailyRankBtn').classList.add('activeControl');
    document.getElementById('allTimeBtn').classList.remove('activeControl');
    document.getElementById('categoryViewBtn').classList.remove('activeControl');
    document.getElementById('dateSelector').style.display = 'block';
    
    // 最新日付を自動選択
    if (availableDates.length > 0) {
        const dateSelect = document.getElementById('dateSelect');
        dateSelect.value = availableDates[0];
        showDailyData(availableDates[0]);
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
            
            // タイムアウト処理（15秒）
            const timeoutId = setTimeout(() => {
                if (isCompleted) return;
                isCompleted = true;
                
                cleanup();
                reject(new Error(`データ取得がタイムアウトしました`));
            }, 15000);
            
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

// 既存の関数はそのまま維持（fetchYouTubeData, updateTable, formatNumber など）

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
            if (categoryChart) {
                categoryChart.resize();
            }
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