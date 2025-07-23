// パフォーマンス最適化されたYouTubeギャラリー

// ========== グローバル変数とキャッシュ ========== //
let isModalOpen = false;
let observer = null;
let scrollTimer = null;
const imageCache = new Map();
const loadedImages = new Set();

// DOM要素のキャッシュ
const domCache = {
    modal: null,
    modalTitle: null,
    videoFrame: null,
    videoGrid: null,
    body: null
};

// ========== ユーティリティ関数 ========== //
// デバウンス関数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// スロットル関数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== 画像遅延読み込み（Intersection Observer） ========== //
function createImageObserver() {
    const options = {
        root: null,
        rootMargin: '50px', // 50px手前から読み込み開始
        threshold: 0.1
    };

    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img); // 一度読み込んだら監視解除
            }
        });
    }, options);
}

// シンプル版：低画質のみの画像読み込み
function loadImage(img) {
    const videoId = img.dataset.videoId;
    if (loadedImages.has(videoId)) return;

    // 低画質のみ使用（hqdefault.jpg = 480x360）
    const imageUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // 直接設定（プリロード不要）
    img.onload = () => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        requestAnimationFrame(() => {
            img.style.opacity = '1';
        });
        
        loadedImages.add(videoId);
        img.onload = null; // メモリ解放
    };
    
    img.onerror = () => {
        console.log(`Image failed for ${videoId}, using placeholder`);
        // エラー時はプレースホルダー表示
        img.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)';
        img.style.opacity = '1';
        loadedImages.add(videoId);
        img.onerror = null; // メモリ解放
    };
    
    img.src = imageUrl;
}

// ========== DOM操作最適化 ========== //
function createVideoCardHTML(video, index) {
    return `
        <div class="video-card" style="animation-delay: ${index * 0.05}s">
            <div class="video-thumbnail" data-video-id="${video.id}" data-title="${video.title}">
                <img data-video-id="${video.id}" 
                     alt="${video.title}"
                     style="opacity: 0; background: #1a1a2e;">
                <div class="play-overlay"></div>
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
            </div>
        </div>
    `;
}

// DocumentFragmentを使用した高速DOM挿入
function generateVideoGrid() {
    const grid = domCache.videoGrid;
    if (!grid) return;

    // DocumentFragmentで一括挿入（リフロー最小化）
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    
    // 全カードのHTMLを一度に生成
    const htmlString = VIDEO_DATA.map((video, index) => 
        createVideoCardHTML(video, index)
    ).join('');
    
    tempDiv.innerHTML = htmlString;
    
    // DocumentFragmentに移動
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    
    // 一括でDOMに挿入
    grid.appendChild(fragment);
    
    // 画像の遅延読み込みを設定
    setupLazyLoading();
    
    // イベントリスナーを設定
    setupEventListeners();
}

// ========== 遅延読み込みセットアップ ========== //
function setupLazyLoading() {
    observer = createImageObserver();
    
    // プレースホルダー画像を持つすべてのimg要素を監視
    const images = domCache.videoGrid.querySelectorAll('img[data-video-id]');
    images.forEach(img => observer.observe(img));
}

// ========== イベント処理最適化 ========== //
function setupEventListeners() {
    // イベント委譲を使用（メモリ効率向上）
    domCache.videoGrid.addEventListener('click', handleVideoClick, { passive: true });
    
    // スクロール最適化
    setupScrollOptimization();
}

// 動画クリック処理（イベント委譲）
function handleVideoClick(event) {
    const thumbnail = event.target.closest('.video-thumbnail');
    if (!thumbnail) return;
    
    const videoId = thumbnail.dataset.videoId;
    const title = thumbnail.dataset.title;
    
    if (videoId && title) {
        openModal(videoId, title);
    }
}

// ========== スクロール最適化 ========== //
function setupScrollOptimization() {
    // スクロール中はホバー効果を無効化
    const optimizedScrollHandler = throttle(() => {
        document.body.classList.add('scrolling');
        
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            document.body.classList.remove('scrolling');
        }, 150);
    }, 16); // 60fps

    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
}

// ========== モーダル関数（最適化版） ========== //
function openModal(videoId, title) {
    if (isModalOpen) return;
    
    const modal = domCache.modal;
    const modalTitle = domCache.modalTitle;
    const videoFrame = domCache.videoFrame;
    
    if (!modal || !modalTitle || !videoFrame) return;
    
    isModalOpen = true;
    
    modalTitle.textContent = title;
    
    // モーダルを表示してからiframeを読み込み（パフォーマンス向上）
    modal.style.display = 'flex';
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
        domCache.body.style.overflow = 'hidden';
        
        // iframeの読み込みを少し遅延
        setTimeout(() => {
            videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
        }, 100);
    });
}

function closeModal() {
    if (!isModalOpen) return;
    
    const modal = domCache.modal;
    const videoFrame = domCache.videoFrame;
    
    if (!modal || !videoFrame) return;
    
    isModalOpen = false;
    
    modal.classList.remove('show');
    
    // アニメーション完了後にiframeをクリア
    setTimeout(() => {
        modal.style.display = 'none';
        videoFrame.src = '';
        domCache.body.style.overflow = 'auto';
    }, 300);
}

// ========== キーボードイベント最適化 ========== //
const handleKeydown = throttle((event) => {
    if (event.key === 'Escape' && isModalOpen) {
        closeModal();
    }
}, 100);

// ========== メモリクリーンアップ ========== //
function cleanup() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    
    clearTimeout(scrollTimer);
    
    // キャッシュクリア
    imageCache.clear();
    loadedImages.clear();
    
    // イベントリスナー削除
    window.removeEventListener('scroll', setupScrollOptimization);
    document.removeEventListener('keydown', handleKeydown);
}

// ========== 初期化とDOM読み込み ========== //
function initializeDOM() {
    // DOM要素をキャッシュ
    domCache.modal = document.getElementById('videoModal');
    domCache.modalTitle = document.getElementById('modalTitle');
    domCache.videoFrame = document.getElementById('videoFrame');
    domCache.videoGrid = document.getElementById('videoGrid');
    domCache.body = document.body;
    
    // 必須要素の存在確認
    if (!domCache.videoGrid) {
        console.error('videoGrid element not found');
        return false;
    }
    
    return true;
}

// ========== メイン初期化 ========== //
document.addEventListener('DOMContentLoaded', function() {
    // DOM初期化
    if (!initializeDOM()) return;
    
    // 動画グリッド生成
    generateVideoGrid();
    
    // グローバルイベントリスナー
    document.addEventListener('keydown', handleKeydown);
    
    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', cleanup);
});

// ========== パフォーマンス監視（開発用） ========== //
if (typeof window !== 'undefined' && window.performance) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}