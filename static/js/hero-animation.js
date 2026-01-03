document.addEventListener('DOMContentLoaded', () => {
  const { animate, createTimeline, stagger } = anime;

  // パーティクルCanvas
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  const particleCount = 40;  // 少なめに
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
      maxLife: Math.random() * 300 + 200,  // 200〜500フレームで消える
      opacity: 0
    };
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const p = createParticle();
      p.life = Math.random() * p.maxLife;  // 初期状態をばらけさせる
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
          // 両方のパーティクルのopacityを考慮
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

      // フェードイン・フェードアウト
      const fadeInDuration = 60;
      const fadeOutStart = p.maxLife - 60;

      if (p.life < fadeInDuration) {
        p.opacity = (p.life / fadeInDuration) * 0.6;
      } else if (p.life > fadeOutStart) {
        p.opacity = ((p.maxLife - p.life) / 60) * 0.6;
      } else {
        p.opacity = 0.6;
      }

      // 寿命が尽きたら再生成
      if (p.life >= p.maxLife) {
        particles[index] = createParticle();
      }

      // 画面端で跳ね返る
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    particles.forEach(drawParticle);
    updateParticles();
    requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', init);
  init();
  animateParticles();

  // タイトルの文字アニメーション
  const tl = createTimeline({
    defaults: {
      easing: 'easeOutExpo'
    }
  });

  tl.add('.hero-title .letter', {
    opacity: [0, 1],
    translateY: [50, 0],
    rotateZ: () => [(Math.random() - 0.5) * 20, 0],
    delay: stagger(60),
    duration: 1000
  })
  .add('.hero-subtitle', {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 800
  }, '-=500')
  .add('.social-icon', {
    opacity: [0, 1],
    translateY: [30, 0],
    scale: [0, 1],
    delay: stagger(80),
    duration: 600
  }, '-=300');

  // 背景シェイプのアニメーション - ゆっくり流れる
  animate('.shape-1', {
    translateX: ['-30%', '30%'],
    translateY: ['-20%', '40%'],
    scale: [1, 1.2, 0.9, 1.1, 1],
    duration: 25000,
    easing: 'easeInOutSine',
    loop: true,
    alternate: true
  });

  animate('.shape-2', {
    translateX: ['30%', '-30%'],
    translateY: ['30%', '-20%'],
    scale: [1.1, 0.9, 1.2, 1],
    duration: 30000,
    easing: 'easeInOutSine',
    loop: true,
    alternate: true
  });

  animate('.shape-3', {
    translateX: ['-20%', '20%'],
    translateY: ['20%', '-30%'],
    scale: [0.9, 1.3, 1],
    duration: 20000,
    easing: 'easeInOutSine',
    loop: true,
    alternate: true
  });

  // ソーシャルアイコンのホバー
  document.querySelectorAll('.social-icon').forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      animate(icon, {
        scale: 1.15,
        rotate: [0, 5, -5, 0],
        duration: 400,
        easing: 'easeOutElastic(1, .6)'
      });
    });
    icon.addEventListener('mouseleave', () => {
      animate(icon, {
        scale: 1,
        rotate: 0,
        duration: 300,
        easing: 'easeOutQuad'
      });
    });
  });
});
