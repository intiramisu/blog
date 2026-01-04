document.addEventListener('DOMContentLoaded', () => {
  // ===== 時計と月齢表示 =====
  const timeEl = document.getElementById('current-time');
  const moonCanvas = document.getElementById('moon-canvas');

  if (timeEl && moonCanvas) {
    const moonCtx = moonCanvas.getContext('2d');
    const size = 120;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 45;

    // 月齢を計算（平均朔望月を使用）
    // 2026年1月3日 19:04 JST が満月（月齢≒14.77）を基準に調整
    function getMoonAge(date) {
      // 2026年1月3日 19:04 JST = 2026年1月3日 10:04 UTC
      const fullMoon2026 = new Date(Date.UTC(2026, 0, 3, 10, 4, 0));
      const synodicMonth = 29.530588853;
      const diffDays = (date.getTime() - fullMoon2026.getTime()) / 864e5;
      // 満月時の月齢は約14.77
      let age = (14.77 + diffDays) % synodicMonth;
      return age < 0 ? age + synodicMonth : age;
    }

    // 月のクレーターデータ（実際の月を参考に）
    // {x, y} は -1〜1 の正規化座標、r は半径、depth は深さ
    const craters = [
      // 大きな海（暗い部分）
      { x: -0.3, y: -0.25, r: 0.35, depth: 0.15, type: 'mare' },  // 嵐の大洋
      { x: 0.25, y: -0.1, r: 0.25, depth: 0.12, type: 'mare' },   // 静かの海
      { x: 0.1, y: 0.25, r: 0.2, depth: 0.1, type: 'mare' },      // 豊かの海
      { x: -0.15, y: 0.1, r: 0.18, depth: 0.1, type: 'mare' },    // 雨の海
      { x: 0.4, y: -0.3, r: 0.15, depth: 0.08, type: 'mare' },    // 危機の海
      // クレーター
      { x: -0.55, y: 0.65, r: 0.12, depth: 0.2, type: 'crater' }, // ティコ
      { x: 0.35, y: 0.55, r: 0.08, depth: 0.18, type: 'crater' }, // コペルニクス風
      { x: -0.2, y: -0.55, r: 0.07, depth: 0.15, type: 'crater' },
      { x: 0.5, y: 0.1, r: 0.06, depth: 0.12, type: 'crater' },
      { x: -0.4, y: 0.35, r: 0.05, depth: 0.1, type: 'crater' },
      { x: 0.15, y: -0.45, r: 0.05, depth: 0.1, type: 'crater' },
      { x: -0.6, y: -0.1, r: 0.04, depth: 0.08, type: 'crater' },
      { x: 0.55, y: -0.5, r: 0.04, depth: 0.08, type: 'crater' },
      { x: -0.35, y: -0.4, r: 0.03, depth: 0.06, type: 'crater' },
      { x: 0.3, y: 0.35, r: 0.03, depth: 0.06, type: 'crater' },
    ];

    // クレーターの影響を計算
    function getCraterEffect(nx, ny) {
      let darkening = 0;
      for (const c of craters) {
        const dx = nx - c.x;
        const dy = ny - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < c.r) {
          // クレーター内部
          const normalizedDist = dist / c.r;
          if (c.type === 'mare') {
            // 海は全体的に暗い
            darkening += c.depth * (1 - normalizedDist * 0.3);
          } else {
            // クレーターは縁が明るく中心が暗い
            const craterShape = Math.sin(normalizedDist * Math.PI);
            darkening += c.depth * (1 - craterShape);
          }
        }
      }
      return Math.min(darkening, 0.4);
    }

    // 月を描画
    function drawMoon(age) {
      moonCtx.clearRect(0, 0, size, size);

      // 月齢から位相を計算（0〜1、0=新月, 0.5=満月, 1=新月）
      const phase = (age / 29.530588853) % 1;

      // 月のグロー（控えめに）
      const glowGrad = moonCtx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius + 8);
      glowGrad.addColorStop(0, 'rgba(255, 255, 230, 0.05)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 230, 0)');
      moonCtx.beginPath();
      moonCtx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      moonCtx.fillStyle = glowGrad;
      moonCtx.fill();

      // ピクセル単位で描画
      const imageData = moonCtx.createImageData(size, size);
      const data = imageData.data;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= radius) {
            const idx = (y * size + x) * 4;

            // 球面上の3D座標を計算
            const nx = dx / radius;
            const ny = dy / radius;
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

            // 光源の方向（phase に応じて回転）
            const lightAngle = phase * 2 * Math.PI;
            const lightX = Math.sin(lightAngle);
            const lightZ = -Math.cos(lightAngle);

            // 球面の法線と光源方向の内積
            const dotProduct = nx * lightX + nz * lightZ;

            // 内積を0〜1の明るさ係数に変換
            let lightFactor = (dotProduct + 0.1) / 0.2;
            lightFactor = Math.max(0, Math.min(1, lightFactor));

            // クレーターによる暗さ
            const craterDark = getCraterEffect(nx, ny);

            // 基本の明るさ（縁を少し暗く）
            const edgeDarkening = 1 - (dist / radius) * 0.15;

            // 月の色（クレーターで暗くなる）
            const surfaceBrightness = (1 - craterDark) * edgeDarkening;
            const lightR = 210 * surfaceBrightness;
            const lightG = 208 * surfaceBrightness;
            const lightB = 195 * surfaceBrightness;
            const darkR = 18;
            const darkG = 20;
            const darkB = 32;

            data[idx] = Math.floor(darkR + (lightR - darkR) * lightFactor);
            data[idx + 1] = Math.floor(darkG + (lightG - darkG) * lightFactor);
            data[idx + 2] = Math.floor(darkB + (lightB - darkB) * lightFactor);
            data[idx + 3] = 255;
          }
        }
      }

      moonCtx.putImageData(imageData, 0, 0);

    }

    // 時計を更新
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${hours}:${minutes}:${seconds}`;

      const moonAge = getMoonAge(now);
      drawMoon(moonAge);
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // ===== パーティクル背景 =====
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  const particleCount = 40;
  const connectionDistance = 120;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1,
      life: 0,
      maxLife: Math.random() * 300 + 200,
      opacity: 0
    };
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const p = createParticle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    ctx.fill();
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const baseOpacity = Math.min(particles[i].opacity, particles[j].opacity);
          const opacity = (1 - distance / connectionDistance) * 0.3 * baseOpacity;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function updateParticles() {
    particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const fadeInDuration = 60;
      const fadeOutStart = p.maxLife - 60;

      if (p.life < fadeInDuration) {
        p.opacity = (p.life / fadeInDuration) * 0.6;
      } else if (p.life > fadeOutStart) {
        p.opacity = ((p.maxLife - p.life) / 60) * 0.6;
      } else {
        p.opacity = 0.6;
      }

      if (p.life >= p.maxLife) {
        particles[index] = createParticle();
      }

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    particles.forEach(drawParticle);
    updateParticles();
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', init);
  init();
  animate();

  // ===== 背景シェイプアニメーション =====
  if (typeof anime !== 'undefined') {
    anime.animate('.shape-1', {
      translateX: ['-30%', '30%'],
      translateY: ['-20%', '40%'],
      scale: [1, 1.2, 0.9, 1.1, 1],
      duration: 25000,
      easing: 'easeInOutSine',
      loop: true,
      alternate: true
    });

    anime.animate('.shape-2', {
      translateX: ['30%', '-30%'],
      translateY: ['30%', '-20%'],
      scale: [1.1, 0.9, 1.2, 1],
      duration: 30000,
      easing: 'easeInOutSine',
      loop: true,
      alternate: true
    });

    anime.animate('.shape-3', {
      translateX: ['-20%', '20%'],
      translateY: ['20%', '-30%'],
      scale: [0.9, 1.3, 1],
      duration: 20000,
      easing: 'easeInOutSine',
      loop: true,
      alternate: true
    });
  }

  // ===== スクロールアニメーション =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        setTimeout(() => {
          el.classList.add('is-visible');
        }, delay);
        fadeInObserver.unobserve(el);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.sns-icon-large').forEach((el, i) => {
    el.dataset.delay = i * 100;
    fadeInObserver.observe(el);
  });

  const postsTitle = document.querySelector('.posts-section-title');
  if (postsTitle) fadeInObserver.observe(postsTitle);

  document.querySelectorAll('.post-card').forEach((el, i) => {
    el.dataset.delay = i * 120;
    fadeInObserver.observe(el);
  });

  // ===== スクロールで暗くなるエフェクト =====
  const darknessOverlay = document.querySelector('.darkness-overlay');
  if (darknessOverlay) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const opacity = Math.min(scrollY / windowHeight, 1);
      darknessOverlay.style.opacity = opacity;
    });
  }
});
