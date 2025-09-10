// viewManager.js - ビュー管理クラス

class ViewManager {
    constructor(dataManager, chartManager, tableManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.tableManager = tableManager;
        
        this.currentView = 'all'; // 'all', 'daily', 'category'
        this.isInitialized = false;
        
        // UI要素の参照
        this.elements = {
            allTimeBtn: null,
            dailyRankBtn: null,
            categoryViewBtn: null,
            dateSelector: null,
            dateSelect: null,
            loadDateBtn: null,
            refreshDataBtn: null,
            dashboardBtn: null
        };
    }

    // ViewManagerの初期化
    init() {
        if (this.isInitialized) return;

        this.initElements();
        this.setupEventListeners();
        this.updateDateSelector();
        
        this.isInitialized = true;
        console.log('ViewManager初期化完了');
    }

    // UI要素の初期化
    initElements() {
        const elementIds = Object.keys(this.elements);
        
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        });
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 表示切り替えボタン
        if (this.elements.allTimeBtn) {
            this.elements.allTimeBtn.addEventListener('click', () => {
                this.switchToAllTimeView();
            });
        }

        if (this.elements.dailyRankBtn) {
            this.elements.dailyRankBtn.addEventListener('click', () => {
                this.switchToDailyView();
            });
        }

        if (this.elements.dashboardBtn) {
            this.elements.dashboardBtn.addEventListener('click', () => {
                this.showCategoryViewBtn();
                this.switchToCategoryView();
            });
        }

        // 日付選択
        if (this.elements.dateSelect) {
            this.elements.dateSelect.addEventListener('change', (e) => {
                if (e.target.value && this.currentView === 'daily') {
                    this.showDailyData(e.target.value);
                }
            });
        }

        // 表示ボタン
        if (this.elements.loadDateBtn) {
            this.elements.loadDateBtn.addEventListener('click', () => {
                const selectedDate = this.elements.dateSelect?.value;
                if (selectedDate) {
                    this.showDailyData(selectedDate);
                } else {
                    alert('日付を選択してください');
                }
            });
        }

        // データ更新ボタン
        if (this.elements.refreshDataBtn) {
            this.elements.refreshDataBtn.addEventListener('click', () => {
                this.refreshCurrentView();
            });
        }
    }

    // 全期間表示に切り替え
    switchToAllTimeView() {
        this.currentView = 'all';
        this.updateControlButtons('all');
        this.hideDateSelector();
        this.chartManager.showMainChart();
        
        this.showAllTimeData();
    }

    // 日別表示に切り替え
    switchToDailyView() {
        this.currentView = 'daily';
        this.updateControlButtons('daily');
        this.showDateSelector();
        this.chartManager.showMainChart();
        
        // 最新日付を自動選択
        const availableDates = this.dataManager.getAvailableDates;
        if (availableDates.length > 0 && this.elements.dateSelect) {
            this.elements.dateSelect.value = availableDates[0];
            this.showDailyData(availableDates[0]);
        }
    }

    // カテゴリ分析表示に切り替え
    async switchToCategoryView() {
        this.currentView = 'category';
        this.updateControlButtons('category');
        this.hideDateSelector();
        
        try {
            this.tableManager.showLoading('カテゴリ分析データを取得中...');
            this.tableManager.updateTitle('カテゴリ分析 - データ取得中...');
            
            // カテゴリデータを取得
            const categoryData = await this.dataManager.fetchMultipleCategoriesData();
            const statistics = this.dataManager.prepareCategoryStatistics();
            
            // チャートを表示
            this.chartManager.showCategoryChart(statistics);
            
            // テーブルには全体データを表示
            const allData = categoryData.find(cat => cat.name === '全体')?.data || [];
            this.tableManager.updateTable(allData.slice(0, 20));
            this.tableManager.updateTitle('カテゴリ分析 - 全体ランキング TOP20');
            this.tableManager.updateViewInfo(`カテゴリ別データ分析 (${categoryData.length}カテゴリ)`);
            
        } catch (error) {
            console.error('カテゴリ分析データの取得に失敗:', error);
            this.tableManager.showError('カテゴリ分析データの取得に失敗しました');
        }
    }

    // 全期間最高再生数データを表示
    showAllTimeData() {
        const data = this.dataManager.getAllTimeTopData(50);
        this.tableManager.updateTable(data);
        this.tableManager.updateTitle('今月の急上昇最大再生数ランキング');
        this.tableManager.updateViewInfo('全期間での最高再生数 TOP50');
    }

    // 日別データを表示
    showDailyData(selectedDate) {
        if (!selectedDate) return;

        const dailyData = this.dataManager.getDailyData(selectedDate, 50);
        
        if (dailyData.length === 0) {
            this.tableManager.showError(`${selectedDate}のデータが見つかりませんでした`);
            return;
        }

        this.tableManager.updateTable(dailyData);
        this.tableManager.updateTitle(`${selectedDate} - 急上昇ランキング`);
        this.tableManager.updateViewInfo(`${selectedDate}の急上昇ランキング TOP${dailyData.length}`);
    }

    // コントロールボタンの状態更新
    updateControlButtons(activeView) {
        // 全てのボタンから activeControl クラスを削除
        ['allTimeBtn', 'dailyRankBtn', 'categoryViewBtn'].forEach(btnId => {
            const btn = this.elements[btnId];
            if (btn) {
                btn.classList.remove('activeControl');
            }
        });

        // アクティブなボタンに activeControl クラスを追加
        const activeButtonMap = {
            'all': 'allTimeBtn',
            'daily': 'dailyRankBtn',
            'category': 'categoryViewBtn'
        };

        const activeBtn = this.elements[activeButtonMap[activeView]];
        if (activeBtn) {
            activeBtn.classList.add('activeControl');
        }
    }

    // 日付セレクターの表示
    showDateSelector() {
        if (this.elements.dateSelector) {
            this.elements.dateSelector.style.display = 'block';
        }
    }

    // 日付セレクターの非表示
    hideDateSelector() {
        if (this.elements.dateSelector) {
            this.elements.dateSelector.style.display = 'none';
        }
    }

    // カテゴリビューボタンの表示
    showCategoryViewBtn() {
        if (this.elements.categoryViewBtn) {
            this.elements.categoryViewBtn.style.display = 'inline-block';
        }
    }

    // 日付セレクターの更新
    updateDateSelector() {
        if (!this.elements.dateSelect) return;

        const availableDates = this.dataManager.getAvailableDates;
        
        // 既存のオプションをクリア
        this.elements.dateSelect.innerHTML = '<option value="">日付を選択してください...</option>';
        
        // 日付オプションを追加
        availableDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = Utils.formatDateForDisplay(date);
            this.elements.dateSelect.appendChild(option);
        });
    }

    // 現在のビューを更新
    async refreshCurrentView() {
        try {
            switch (this.currentView) {
                case 'all':
                    this.dataManager.clearCache();
                    await this.dataManager.fetchYouTubeData();
                    this.updateDateSelector();
                    this.showAllTimeData();
                    break;
                    
                case 'daily':
                    this.dataManager.clearCache();
                    await this.dataManager.fetchYouTubeData();
                    this.updateDateSelector();
                    const currentDate = this.elements.dateSelect?.value;
                    if (currentDate) {
                        this.showDailyData(currentDate);
                    }
                    break;
                    
                case 'category':
                    this.dataManager.clearCache();
                    await this.switchToCategoryView();
                    break;
                    
                default:
                    console.warn(`Unknown view: ${this.currentView}`);
            }
        } catch (error) {
            console.error('ビューの更新に失敗:', error);
            this.tableManager.showError('データの更新に失敗しました');
        }
    }

    // 初期データの読み込み
    async loadInitialData() {
        try {
            this.tableManager.showLoading();
            await this.dataManager.fetchYouTubeData();
            this.updateDateSelector();
            this.switchToAllTimeView(); // デフォルトビューを表示
        } catch (error) {
            console.error('初期データの読み込みに失敗:', error);
            this.tableManager.showError('初期データの読み込みに失敗しました');
        }
    }

    // ゲッター
    get getCurrentView() { return this.currentView; }
    get getIsInitialized() { return this.isInitialized; }
}