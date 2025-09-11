// tableManager.js - テーブル管理クラス

class TableManager {
    constructor() {
        this.table = null;
        this.thead = null;
        this.tbody = null;
        this.isInitialized = false;
        
        // テーブルヘッダー定義
        this.headers = ['日付', '順位(当時)', 'タイトル', 'チャンネル', 'ジャンル','再生数', '高評価'];
    }

    // テーブルマネージャーの初期化
    init() {
        if (this.isInitialized) return;

        this.table = document.getElementById('dataTable');
        if (!this.table) {
            console.error('dataTable element not found');
            return;
        }

        this.thead = this.table.querySelector('thead');
        this.tbody = this.table.querySelector('tbody');

        if (!this.thead || !this.tbody) {
            console.error('thead or tbody elements not found');
            return;
        }

        this.isInitialized = true;
        console.log('TableManager初期化完了');
    }

    // テーブルデータの更新
    updateTable(data, title = '') {
        if (!this.isInitialized) {
            console.error('TableManager not initialized');
            return;
        }

        this.clearTable();
        this.createHeader();
        this.populateData(data);
        
        if (title) {
            this.updateTitle(title);
        }

        console.log(`テーブル更新: ${data.length}件のデータを表示`);
    }

    // ヘッダーの作成
    createHeader() {
        this.thead.innerHTML = '';
        const headerRow = this.thead.insertRow();
        
        this.headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
    }

    // データの投入
    populateData(data) {
        this.tbody.innerHTML = '';
        
        data.forEach(row => {
            const tr = this.tbody.insertRow();
            
            // 日付
            this.createCell(tr, row[0]);
            
            // 順位
            this.createCell(tr, row[1]);
            
            // タイトル（リンク付き）
            this.createLinkCell(tr, row[2], row[10]);
            
            // チャンネル
            this.createCell(tr, row[3]);
            
            // ジャンル
            this.createCell(tr, row[5]);
            
            // 再生数（短縮フォーマット）
            this.createCell(tr, Utils.formatNumberShort(row[7]));
            
            // 高評価（短縮フォーマット）
            this.createCell(tr, Utils.formatNumberShort(row[8]));
        });
    }

    // 通常のセルを作成
    createCell(row, content) {
        const cell = row.insertCell();
        cell.textContent = content || '';
        return cell;
    }

    // リンク付きセルを作成
    createLinkCell(row, text, url) {
        const cell = row.insertCell();
        
        if (url && url.trim() !== '') {
            const link = document.createElement('a');
            link.href = url;
            link.textContent = text || '';
            link.target = '_blank';
            link.className = 'table-link';
            link.rel = 'noopener noreferrer'; // セキュリティ対策
            cell.appendChild(link);
        } else {
            cell.textContent = text || '';
        }
        
        return cell;
    }

    // テーブルのクリア
    clearTable() {
        if (this.thead) this.thead.innerHTML = '';
        if (this.tbody) this.tbody.innerHTML = '';
    }

    // ローディング表示
    showLoading(message = 'データを読み込み中...') {
        this.clearTable();
        
        this.thead.innerHTML = `
            <tr>
                <th colspan="${this.headers.length}" class="loading-message">
                    ${message}
                    <div style="margin-top: 10px;">
                        <div class="spinner"></div>
                    </div>
                </th>
            </tr>
        `;
    }

    // エラー表示
    showError(message = 'データの取得に失敗しました') {
        this.clearTable();
        
        this.thead.innerHTML = `
            <tr>
                <th colspan="${this.headers.length}" class="error-message">
                    ${message}
                </th>
            </tr>
        `;
    }

    // テーブルタイトルの更新
    updateTitle(title) {
        const titleElement = document.getElementById('tableTitle');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // 現在の表示情報を更新
    updateViewInfo(info) {
        const infoElement = document.getElementById('currentViewInfo');
        if (infoElement) {
            infoElement.textContent = `表示中: ${info}`;
        }
    }

    // テーブルの行数を取得
    getRowCount() {
        return this.tbody ? this.tbody.rows.length : 0;
    }

    // 特定の行を取得
    getRow(index) {
        return this.tbody && this.tbody.rows[index] ? this.tbody.rows[index] : null;
    }

    // テーブルの可視性を制御
    show() {
        if (this.table) {
            this.table.style.display = 'table';
        }
    }

    hide() {
        if (this.table) {
            this.table.style.display = 'none';
        }
    }

    // テーブルデータをCSV形式で出力（将来の拡張用）
    exportToCSV() {
        if (!this.tbody || this.tbody.rows.length === 0) {
            console.warn('出力するデータがありません');
            return '';
        }

        const rows = [];
        
        // ヘッダー行
        rows.push(this.headers.join(','));
        
        // データ行
        Array.from(this.tbody.rows).forEach(row => {
            const cells = Array.from(row.cells).map(cell => {
                // リンクがある場合はテキストのみを取得
                return cell.textContent.replace(/,/g, '');
            });
            rows.push(cells.join(','));
        });

        return rows.join('\n');
    }

    // 統計情報の表示（将来の拡張用）
    showStatistics(data) {
        if (!data || data.length === 0) return;

        const viewsStats = Utils.getDataStatistics(data, 7);
        const likesStats = Utils.getDataStatistics(data, 8);

        const statsHtml = `
            <div class="table-statistics">
                <p>データ件数: ${data.length}件</p>
                <p>再生数 - 平均: ${Utils.formatNumberShort(viewsStats.avg)} | 最大: ${Utils.formatNumberShort(viewsStats.max)}</p>
                <p>高評価数 - 平均: ${Utils.formatNumberShort(likesStats.avg)} | 最大: ${Utils.formatNumberShort(likesStats.max)}</p>
            </div>
        `;

        // 統計情報を表示する要素があれば更新
        const statsElement = document.getElementById('tableStatistics');
        if (statsElement) {
            statsElement.innerHTML = statsHtml;
        }
    }
}