// main.js - メインアプリケーション

class YouTubeDashboardApp {
    constructor() {
        this.dataManager = null;
        this.chartManager = null;
        this.tableManager = null;
        this.viewManager = null;
        this.isInitialized = false;
    }

    // アプリケーションの初期化
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            console.log('YouTube Dashboard App 初期化開始...');
            
            // 各マネージャーのインスタンス化
            this.dataManager = new DataManager();
            this.chartManager = new ChartManager();
            this.tableManager = new TableManager();
            
            // ViewManagerは他のマネージャーに依存するため最後に初期化
            this.viewManager = new ViewManager(
                this.dataManager, 
                this.chartManager, 
                this.tableManager
            );

            // 各マネージャーを初期化
            this.chartManager.init();
            this.tableManager.init();
            this.viewManager.init();

            // 初期データの読み込み
            await this.viewManager.loadInitialData();

            // グローバルエラーハンドリングの設定
            this.setupGlobalErrorHandling();

            this.isInitialized = true;
            console.log('YouTube Dashboard App 初期化完了');

        } catch (error) {
            console.error('アプリケーションの初期化に失敗:', error);
            this.showInitializationError(error);
        }
    }

    // 初期化エラーの表示
    showInitializationError(error) {
        const container = document.getElementById('container');
        if (container) {
            container.innerHTML = `
                <div style="
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    background: linear-gradient(135deg, rgba(65,131,155,1) 0%, rgba(51,98,123,1) 100%);
                    color: white;
                    text-align: center;
                    font-family: 'Lato', sans-serif;
                ">
                    <div>
                        <h1>アプリケーションの初期化に失敗しました</h1>
                        <p>エラー: ${error.message}</p>
                        <button 
                            onclick="location.reload()" 
                            style="
                                padding: 10px 20px; 
                                background: #4fc3f7; 
                                color: white; 
                                border: none; 
                                border-radius: 5px; 
                                cursor: pointer;
                                font-size: 16px;
                                margin-top: 20px;
                            "
                        >
                            ページを再読み込み
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // グローバルエラーハンドリングの設定
    setupGlobalErrorHandling() {
        // 未処理のPromise rejection
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // ユーザーに通知（必要に応じて）
            if (event.reason && event.reason.message) {
                this.showErrorNotification(`エラーが発生しました: ${event.reason.message}`);
            }
            
            // デフォルトの動作を防止
            event.preventDefault();
        });

        // 一般的なJavaScriptエラー
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            
            if (event.error && event.error.message) {
                this.showErrorNotification(`予期しないエラーが発生しました: ${event.error.message}`);
            }
        });
    }

    // エラー通知の表示
    showErrorNotification(message) {
        // 簡単な通知システム（将来的にはより洗練されたものに置き換え可能）
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: 'Lato', sans-serif;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 5秒後に自動削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // クリックで削除
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // アプリケーションの破棄（必要に応じて）
    destroy() {
        try {
            if (this.chartManager) {
                this.chartManager.destroy();
            }
            
            if (this.dataManager) {
                this.dataManager.clearCache();
            }

            this.dataManager = null;
            this.chartManager = null;
            this.tableManager = null;
            this.viewManager = null;
            this.isInitialized = false;

            console.log('YouTube Dashboard App 破棄完了');

        } catch (error) {
            console.error('アプリケーションの破棄に失敗:', error);
        }
    }

    // 開発者向けデバッグ情報の出力
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentView: this.viewManager?.getCurrentView || 'unknown',
            dataCount: this.dataManager?.getAllData?.length || 0,
            availableDates: this.dataManager?.getAvailableDates?.length || 0,
            categoryDataCount: this.dataManager?.getCategoryData?.length || 0,
            chartVisible: {
                main: this.chartManager?.isMainChartVisible || false,
                category: this.chartManager?.isCategoryChartVisible || false
            },
            tableRowCount: this.tableManager?.getRowCount() || 0
        };
    }

    // パフォーマンス情報の取得
    getPerformanceInfo() {
        const performance = window.performance;
        
        return {
            loadTime: performance.now(),
            navigation: performance.navigation?.type || 'unknown',
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            } : 'not available'
        };
    }

    // ゲッター
    get managers() {
        return {
            data: this.dataManager,
            chart: this.chartManager,
            table: this.tableManager,
            view: this.viewManager
        };
    }
}

// グローバル変数として app インスタンスを作成
let app = null;

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // アプリケーションのインスタンス化と初期化
        app = new YouTubeDashboardApp();
        await app.init();

        // 開発環境でのデバッグ情報出力
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('=== YouTube Dashboard Debug Info ===');
            console.log('App Info:', app.getDebugInfo());
            console.log('Performance Info:', app.getPerformanceInfo());
            console.log('===================================');

            // グローバルスコープに app を公開（開発用）
            window.app = app;
        }

    } catch (error) {
        console.error('アプリケーション起動エラー:', error);
    }
});
  
  
// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', function() {
    if (app && app.isInitialized) {
        app.destroy();
    }
});