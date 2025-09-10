// chartManager.js - チャート管理クラス

class ChartManager {
    constructor() {
        this.mainChart = null;
        this.categoryChart = null;
        this.isInitialized = false;
        
        // デフォルトの販売データ（デモ用）
        this.salesData = {
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
    }

    // チャートの初期化
    init() {
        if (this.isInitialized) return;

        this.initMainChart();
        this.setupResizeHandler();
        this.isInitialized = true;

        console.log('ChartManager初期化完了');
    }

    // メインチャートの初期化
    initMainChart() {
        const ctx = document.getElementById('salesData');
        if (!ctx) {
            console.error('salesData canvas element not found');
            return;
        }

        const canvas = ctx.getContext('2d').canvas;
        canvas.style.width = '100%';
        canvas.style.height = '300px';

        const chartOptions = this.getMainChartOptions();

        this.mainChart = new Chart(ctx, {
            type: 'line',
            data: this.salesData,
            options: chartOptions
        });
    }

    // メインチャートオプション
    getMainChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 },
                        color: '#fff'
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
                        color: '#fff',
                        font: { size: 10 }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 4500,
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    },
                    ticks: {
                        color: '#fff',
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
    }

    // カテゴリチャートの表示
    showCategoryChart(categoryStatistics) {
        this.hideMainChart();
        this.createCategoryChart(categoryStatistics);
        
        const categoryCanvas = document.getElementById('categoryChart');
        categoryCanvas.style.display = 'block';
    }

    // カテゴリチャートの作成
    createCategoryChart(statistics) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) {
            console.error('categoryChart canvas element not found');
            return;
        }

        // 既存のチャートを破棄
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const chartData = this.prepareCategoryChartData(statistics);
        const chartOptions = this.getCategoryChartOptions();

        this.categoryChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        });
    }

    // カテゴリチャートデータの準備
    prepareCategoryChartData(statistics) {
        return {
            labels: statistics.map(stat => stat.name),
            datasets: [
                {
                    label: '平均再生数',
                    data: statistics.map(stat => stat.avgViews),
                    backgroundColor: statistics.map(stat => stat.color.replace('1)', '0.7)')),
                    borderColor: statistics.map(stat => stat.color),
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: '平均高評価数',
                    data: statistics.map(stat => stat.avgLikes),
                    backgroundColor: statistics.map(stat => stat.color.replace('1)', '0.4)')),
                    borderColor: statistics.map(stat => stat.color),
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        };
    }

    // カテゴリチャートオプション
    getCategoryChartOptions() {
        return {
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = Utils.formatNumber(context.parsed.y);
                            return `${label}: ${value}`;
                        }
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    },
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return Utils.formatNumber(value);
                        }
                    },
                    title: {
                        display: true,
                        text: '再生数',
                        color: '#fff'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return Utils.formatNumber(value);
                        }
                    },
                    title: {
                        display: true,
                        text: '高評価数',
                        color: '#fff'
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutCubic'
            }
        };
    }

    // メインチャートの表示
    showMainChart() {
        const salesCanvas = document.getElementById('salesData');
        const categoryCanvas = document.getElementById('categoryChart');
        
        salesCanvas.style.display = 'block';
        categoryCanvas.style.display = 'none';

        if (this.mainChart) {
            this.mainChart.resize();
        }
    }

    // メインチャートの非表示
    hideMainChart() {
        const salesCanvas = document.getElementById('salesData');
        salesCanvas.style.display = 'none';
    }

    // リサイズハンドラーの設定
    setupResizeHandler() {
        const debouncedResize = Utils.debounce(() => {
            if (this.mainChart) {
                this.mainChart.resize();
            }
            if (this.categoryChart) {
                this.categoryChart.resize();
            }
        }, 250);

        window.addEventListener('resize', debouncedResize);
    }

    // チャートデータの更新（将来の拡張用）
    updateMainChartData(newData) {
        if (this.mainChart && newData) {
            this.mainChart.data = newData;
            this.mainChart.update('active');
        }
    }

    // チャートの破棄
    destroy() {
        if (this.mainChart) {
            this.mainChart.destroy();
            this.mainChart = null;
        }
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        this.isInitialized = false;
        console.log('ChartManager破棄完了');
    }

    // ゲッター
    get isMainChartVisible() {
        const canvas = document.getElementById('salesData');
        return canvas && canvas.style.display !== 'none';
    }

    get isCategoryChartVisible() {
        const canvas = document.getElementById('categoryChart');
        return canvas && canvas.style.display === 'block';
    }
}