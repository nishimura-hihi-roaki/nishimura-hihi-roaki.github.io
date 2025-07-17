
        // スムーススクロール機能：メニュークリック時の滑らかなスクロール
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // スクロール時のヘッダー効果：スクロール時にヘッダーの背景を変更
        window.addEventListener('scroll', function() {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(0, 0, 0, 0.95)';
            } else {
                header.style.background = 'rgba(0, 0, 0, 0.9)';
            }
        });

        // フェードインアニメーション：スクロール時に要素を表示
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // フェードイン対象の要素を監視
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });

        // コンタクトフォーム送信処理：フォーム送信時の処理
        document.querySelector('.contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // フォームデータを取得
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // 送信成功メッセージ（実際のメール送信機能は別途実装が必要）
            alert('メッセージを送信しました。ありがとうございます！');
            
            // フォームをリセット
            this.reset();
        });

        // ページロード時のアニメーション：ページが読み込まれた時の初期化
        window.addEventListener('load', function() {
            document.body.style.opacity = '1';
        });
    