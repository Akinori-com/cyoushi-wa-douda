/**
 * 朝の会 体調確認アプリ スクリプト
 * Web Speech API (音声読み上げ) + Web Audio API (効果音) + パーティクル演出
 */

document.addEventListener('DOMContentLoaded', () => {
  // 要素の取得
  const gridContainer = document.querySelector('.grid-container');
  const cards = document.querySelectorAll('.status-card');
  const modal = document.getElementById('result-modal');
  const modalCard = document.getElementById('modal-card');
  const modalImageWrapper = document.getElementById('modal-image-wrapper');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnToggleVoice = document.getElementById('btn-toggle-voice');
  const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  // 設定フラグ
  let isVoiceEnabled = true;

  // ==========================================
  // カードのシャッフル機能（上段3つ・下段4つを維持してランダム並び替え）
  // ==========================================
  function shuffleCards(animate = false) {
    if (!gridContainer) return;
    const cardList = Array.from(gridContainer.querySelectorAll('.status-card'));
    if (cardList.length === 0) return;

    // Fisher-Yates アルゴリズムで配列をシャッフル
    for (let i = cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }

    // DOMに再配置し、先頭3つをcard-top（上段用）、残り4つをcard-bottom（下段用）に設定
    cardList.forEach((card, index) => {
      if (index < 3) {
        card.classList.add('card-top');
        card.classList.remove('card-bottom');
      } else {
        card.classList.add('card-bottom');
        card.classList.remove('card-top');
      }

      if (animate) {
        card.classList.remove('card-shuffle-anim');
        // リフローを発生させてアニメーションを再実行
        void card.offsetWidth;
        card.classList.add('card-shuffle-anim');
      }

      gridContainer.appendChild(card);
    });
  }

  // 初回ロード時にシャッフル実行
  shuffleCards(false);

  // ==========================================
  // Web Audio API による効果音生成
  // ==========================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 優しいチャイム音・ファンファーレの再生
  function playTone(type) {
    if (!isVoiceEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === 'genki' || type === 'wakuwaku') {
      // 明るいメロディ (ド・ミ・ソ・ド↑)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'onaka') {
      // ぽこぽこ音 (ソ・ド↑)
      const freqs = [392.00, 523.25, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } else {
      // 優しいオルゴール調の音 (ミ・ソ)
      const freqs = [659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    }
  }

  // ボタンクリック用の軽いタップ音
  function playClickSound() {
    if (!isVoiceEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // ==========================================
  // Web Speech API による日本語音声読み上げ
  // ==========================================
  function speak(text) {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;

    // 現在の音声をキャンセルして新しく話す
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.95; // 子ども向けに少しゆっくり聞き取りやすく
    utterance.pitch = 1.15; // 少し高めで明るいトーン

    // 日本語音声の取得
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.includes('ja') || v.lang.includes('JP'));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  // 音声リスト読み込み（一部ブラウザ向け対応）
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  // ==========================================
  // パーティクル・花吹雪エフェクト
  // ==========================================
  let particles = [];
  let animationId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 4;
      this.size = Math.random() * 12 + 8;
      this.opacity = 1;
      this.gravity = 0.25;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 10;
      this.isStar = Math.random() > 0.4;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.98;
      this.rotation += this.rotationSpeed;
      this.opacity -= 0.015;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(this.opacity, 0);
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;

      if (this.isStar) {
        // 星型
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * 0.0174533) * this.size, -Math.sin((18 + i * 72) * 0.0174533) * this.size);
          ctx.lineTo(Math.cos((54 + i * 72) * 0.0174533) * (this.size / 2), -Math.sin((54 + i * 72) * 0.0174533) * (this.size / 2));
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // 紙吹雪型
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      }
      ctx.restore();
    }
  }

  function createParticles(x, y) {
    const colors = ['#ff4081', '#ffd700', '#00e676', '#00b0ff', '#aa00ff', '#ff9100'];
    particles = [];
    for (let i = 0; i < 45; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push(new Particle(x, y, color));
    }
    if (!animationId) {
      animateParticles();
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].opacity <= 0 || particles[i].y > canvas.height + 50) {
        particles.splice(i, 1);
      }
    }
    if (particles.length > 0) {
      animationId = requestAnimationFrame(animateParticles);
    } else {
      animationId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ==========================================
  // カード選択処理
  // ==========================================
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      const label = card.dataset.label;
      const speech = card.dataset.speech;
      const message = card.dataset.message;

      // クリック位置取得（パーティクル発生源）
      const rect = card.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      // 1. 効果音 & パーティクル
      playTone(id);
      createParticles(clickX, clickY);

      // 2. 音声読み上げ
      speak(speech);

      // 3. モーダル内容の反映
      const cardCloneImgWrapper = card.querySelector('.image-wrapper').cloneNode(true);
      modalImageWrapper.innerHTML = '';
      modalImageWrapper.appendChild(cardCloneImgWrapper);

      // クラスの付け替え（モーダルの枠線や背景色をカードに合わせる）
      modalCard.className = `modal-card card-${id}`;
      modalTitle.textContent = label;
      modalMessage.textContent = message;

      // 4. モーダル表示
      setTimeout(() => {
        modal.classList.remove('hidden');
      }, 200);
    });
  });

  // ==========================================
  // モーダル操作
  // ==========================================
  // つぎのおともだち（リセット＆シャッフル）
  btnNext.addEventListener('click', () => {
    playClickSound();
    modal.classList.add('hidden');
    speak('つぎのおともだち、どうぞ！');
    // 次の児童のためにカードをシャッフル
    setTimeout(() => {
      shuffleCards(true);
    }, 150);
  });

  // もういちどえらぶ（閉じるだけ）
  btnBack.addEventListener('click', () => {
    playClickSound();
    modal.classList.add('hidden');
  });

  // モーダル外側クリックで閉じる
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // ==========================================
  // コントロールボタン制御
  // ==========================================
  // 手動ならびかえ（シャッフル）
  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      playClickSound();
      shuffleCards(true);
    });
  }

  // 音声ON/OFF切り替え
  btnToggleVoice.addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;
    if (isVoiceEnabled) {
      btnToggleVoice.innerHTML = '<span class="icon">🔊</span><span class="btn-label">おんせい ON</span>';
      btnToggleVoice.classList.remove('active-off');
      speak('おんせいを つけます');
    } else {
      btnToggleVoice.innerHTML = '<span class="icon">🔇</span><span class="btn-label">おんせい OFF</span>';
      btnToggleVoice.classList.add('active-off');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  });

  // 全画面表示切り替え
  btnToggleFullscreen.addEventListener('click', () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
      btnToggleFullscreen.innerHTML = '<span class="icon">✕</span><span class="btn-label">もどす</span>';
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      btnToggleFullscreen.innerHTML = '<span class="icon">⛶</span><span class="btn-label">ぜんめん</span>';
    }
  });

  // ==========================================
  // 画像の自動拡張子フォールバック処理
  // ==========================================
  const supportedExts = ['.png', '.gif', '.jpg', '.jpeg', '.webp'];
  
  cards.forEach(card => {
    const id = card.dataset.id;
    const img = card.querySelector('.status-img');
    const fallbackIcon = card.querySelector('.fallback-icon');
    if (!img) return;

    let extIndex = 0;
    
    // 画像ロード失敗時のハンドラー
    img.onerror = function() {
      extIndex++;
      if (extIndex < supportedExts.length) {
        // 次の拡張子を試す (例: images/genki.gif, images/genki.jpg)
        img.src = `images/${id}${supportedExts[extIndex]}?t=${Date.now()}`;
      } else {
        // 全拡張子で失敗した場合は絵文字フォールバックを表示
        img.style.display = 'none';
        if (fallbackIcon) {
          fallbackIcon.style.display = 'flex';
        }
      }
    };

    img.onload = function() {
      img.style.display = 'block';
      if (fallbackIcon) {
        fallbackIcon.style.display = 'none';
      }
    };
  });

  // 全画面状態の変化を監視
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      btnToggleFullscreen.innerHTML = '<span class="icon">⛶</span><span class="btn-label">ぜんめん</span>';
    } else {
      btnToggleFullscreen.innerHTML = '<span class="icon">✕</span><span class="btn-label">もどす</span>';
    }
  });
});
