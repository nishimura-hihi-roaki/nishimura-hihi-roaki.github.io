// Sales Dashboard JavaScript

// 販売データの定義
const salesData = {
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    datasets: [
        {
            label: "Front",
            backgroundColor: "rgba(195, 40, 96, 0.1)",
            borderColor: "rgba(195, 40, 96, 1)",
            pointBackgroundColor: "rgba(195, 40, 96, 1)",
            pointBorderColor: "#202b33",
            pointHoverBorderColor: "rgba(225,225,225,0.9)",
            data: [3400, 3000, 2500, 4500, 2500, 3400, 3000],
            fill: true,
            tension: 0.4
        },
        {
            label: "Middle",
            backgroundColor: "rgba(255, 172, 100, 0.1)",
            borderColor: "rgba(255, 172, 100, 1)",
            pointBackgroundColor: "rgba(255, 172, 100, 1)",
            pointBorderColor: "#202b33",
            pointHoverBorderColor: "rgba(225,225,225,0.9)",
            data: [1900, 1700, 2100, 3600, 2200, 2500, 2000],
            fill: true,
            tension: 0.4
        },
        {
            label: "Back",
            backgroundColor: "rgba(19, 71, 34, 0.3)",
            borderColor: "rgba(88, 188, 116, 1)",
            pointBackgroundColor: "rgba(88, 188, 116, 1)",
            pointBorderColor: "#202b33",
            pointHoverBorderColor: "rgba(225,225,225,0.9)",
            data: [1000, 1400, 1100, 2600, 2000, 900, 1400],
            fill: true,
            tension: 0.4
        }
    ]
};

// チャートオプションの定義
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8
        }
    },
    elements: {
        point: {
            radius: 6,
            borderWidth: 2,
            hoverRadius: 8
        },
        line: {
            borderWidth: 3
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: '#666',
                font: {
                    size: 11
                }
            }
        },
        y: {
            beginAtZero: true,
            max: 4500,
            grid: {
                color: "rgba(225, 255, 255, 0.1)",
                lineWidth: 1
            },
            ticks: {
                color: '#666',
                stepSize: 500,
                font: {
                    size: 11
                },
                callback: function(value) {
                    return value.toLocaleString();
                }
            }
        }
    },
    interaction: {
        intersect: false,
        mode: 'index'
    },
    animation: {
        duration: 2000,
        easing: 'easeInOutCubic'
    }
};

// プログレスバーの設定オブジェクト
const progressConfigs = {
    credit: {
        color: '#e81760',
        value: 0.8,
        elementId: '#creditSales'
    },
    channel: {
        color: '#e88e3c',
        value: 0.64,
        elementId: '#channelSales'
    },
    direct: {
        color: '#2bab51',
        value: 0.34,
        elementId: '#directSales'
    }
};

// Chart.js チャートの初期化
function initChart() {
    const ctx = document.getElementById('salesData').getContext('2d');
    
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: salesData,
        options: chartOptions
    });

    return salesChart;
}

// プログレスバーの作成
function createProgressBar(config) {
    return new ProgressBar.Circle(config.elementId, {
        color: config.color,
        strokeWidth: 6,
        trailWidth: 3,
        duration: 2000,
        easing: 'easeInOut',
        text: {
            value: '0%',
            style: {
                color: '#333',
                fontSize: '16px',
                fontWeight: 'bold'
            }
        },
        step: function(state, bar) {
            bar.setText((bar.value() * 100).toFixed(0) + "%");
        }
    });
}

// プログレスバーのアニメーション開始
function animateProgressBars(progressBars) {
    setTimeout(() => {
        progressBars.credit.animate(progressConfigs.credit.value);
        progressBars.channel.animate(progressConfigs.channel.value);
        progressBars.direct.animate(progressConfigs.direct.value);
    }, 500);
}

// ダッシュボードの初期化
function initDashboard() {
    // チャートを初期化
    const chart = initChart();
    
    // プログレスバーを作成
    const progressBars = {
        credit: createProgressBar(progressConfigs.credit),
        channel: createProgressBar(progressConfigs.channel),
        direct: createProgressBar(progressConfigs.direct)
    };
    
    // アニメーションを開始
    animateProgressBars(progressBars);
    
    // ウィンドウリサイズ時のチャート更新
    window.addEventListener('resize', () => {
        chart.resize();
    });
    
    return {
        chart,
        progressBars
    };
}

// ページ読み込み後に実行
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = initDashboard();
    
    // デバッグ用：グローバルオブジェクトとして公開
    window.salesDashboard = dashboard;
    
    console.log('Sales Dashboard initialized successfully');
});