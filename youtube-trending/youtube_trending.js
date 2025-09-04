// Sales Dashboard JavaScript - 軽量化版

// 販売データの定義（軽量化）
const salesData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
        {
            label: "Front",
            borderColor: "rgba(195, 40, 96, 1)",
            pointBackgroundColor: "rgba(195, 40, 96, 1)",
            data: [3400, 3000, 2500, 4500, 2500, 3400, 3000],
            fill: false, // fillを無効化してパフォーマンス向上
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
        // tooltipの詳細設定を削除（デフォルトを使用）
    },
    elements: {
        point: {
            radius: 4, // より小さく
            borderWidth: 1,
            hoverRadius: 6
        },
        line: {
            borderWidth: 2 // より細く
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
                stepSize: 1000, // ステップを大きくしてティック数を減らす
                font: { size: 10 }
            }
        }
    },
    // アニメーション時間を短縮
    animation: {
        duration: 1000,
        easing: 'easeOutCubic'
    }
};

// Chart.js チャートの初期化
function initChart() {
    const ctx = document.getElementById('salesData').getContext('2d');
    
    // canvas要素に明示的にサイズを設定
    const canvas = ctx.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    
    return new Chart(ctx, {
        type: 'line',
        data: salesData,
        options: chartOptions
    });
}

// ダッシュボードの初期化（プログレスバー削除版）
function initDashboard() {
    const chart = initChart();
    
    // リサイズイベントにthrottlingを追加
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
        const response = await fetch('https://script.google.com/macros/s/AKfycbyuJJHMMKtAyijttT1-RAJBF2q3l3RfwcStdqgEdlggCGBL0pWKUGdm5nuREoWftwpr/exec');
        const data = await response.json();
        
        // 再生数で降順にソートしてから50件取得
        const youtubeData = data.slice(1).sort((a,b) => Number(b[7]) - Number(a[7])).slice(0,50);

        
        updateTable(youtubeData);
        
    } catch (error) {
        console.error('データの取得に失敗しました:', error);
        // エラー時は元のテーブルを表示
    }
}

// テーブルを動的に更新
function updateTable(data) {
    const table = document.querySelector('table');
    
    // 既存のテーブル内容をクリア
    table.innerHTML = '';
    
    // ヘッダー行を作成
    const headerRow = table.insertRow();
    const headers = ['日付', '順位', 'タイトル', 'チャンネル', 'ジャンル','再生数', '高評価'];
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