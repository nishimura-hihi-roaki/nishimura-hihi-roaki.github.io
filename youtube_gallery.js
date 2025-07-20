// モーダルを開く関数
function openModal(videoId, title) {
    const modal = document.getElementById('videoModal');
    const modalTitle = document.getElementById('modalTitle');
    const videoFrame = document.getElementById('videoFrame');
    
    modalTitle.textContent = title;
    videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// モーダルを閉じる関数
function closeModal() {
    const modal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    
    modal.style.display = 'none';
    videoFrame.src = '';
    document.body.style.overflow = 'auto';
}

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// 動画一覧を生成する関数（既存のコードに追加）
function generateVideoGrid() {
    const grid = document.getElementById('videoGrid');
    
    VIDEO_DATA.forEach((video, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.style.animationDelay = `${index * 0.1}s`;
        
        videoCard.innerHTML = `
            <div class="video-thumbnail" onclick="openModal('${video.id}', '${video.title}')">
                <img src="https://img.youtube.com/vi/${video.id}/maxresdefault.jpg" 
                     alt="${video.title}"
                     onerror="this.src='https://img.youtube.com/vi/${video.id}/hqdefault.jpg'">
                <div class="play-overlay"></div>
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
            </div>
        `;
        
        grid.appendChild(videoCard);
    });
}

// ページ読み込み時に動画一覧を生成
document.addEventListener('DOMContentLoaded', function() {
    generateVideoGrid();
});