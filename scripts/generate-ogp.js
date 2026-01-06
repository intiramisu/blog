const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// 日本語フォントを登録
registerFont(path.join(__dirname, 'fonts', 'NotoSansJP-Bold.ttf'), { family: 'Noto Sans JP', weight: 'bold' });
registerFont(path.join(__dirname, 'fonts', 'NotoSansJP-Light.ttf'), { family: 'Noto Sans JP', weight: '300' });

const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// ===== 背景 =====
ctx.fillStyle = '#08090f';
ctx.fillRect(0, 0, width, height);

// ===== グラデーションシェイプ（ぼかし風） =====
function drawGlowShape(x, y, radius, colors) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// 紫のシェイプ（左上）
drawGlowShape(100, 80, 450, [
  'rgba(118, 75, 162, 0.5)',
  'rgba(102, 126, 234, 0.25)'
]);

// ピンクのシェイプ（右下）
drawGlowShape(1100, 550, 400, [
  'rgba(245, 87, 108, 0.45)',
  'rgba(240, 147, 251, 0.2)'
]);

// シアンのシェイプ（中央）
drawGlowShape(650, 350, 350, [
  'rgba(0, 242, 254, 0.35)',
  'rgba(79, 172, 254, 0.15)'
]);

// ===== パーティクルと線 =====
const particles = [];
const particleCount = 50;

// パーティクル生成
for (let i = 0; i < particleCount; i++) {
  particles.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.5 + 1,
    opacity: Math.random() * 0.5 + 0.2
  });
}

// 線を描画
ctx.lineWidth = 0.5;
const connectionDistance = 150;

for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    const dx = particles[i].x - particles[j].x;
    const dy = particles[i].y - particles[j].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < connectionDistance) {
      const opacity = (1 - distance / connectionDistance) * 0.25;
      ctx.beginPath();
      ctx.moveTo(particles[i].x, particles[i].y);
      ctx.lineTo(particles[j].x, particles[j].y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.stroke();
    }
  }
}

// パーティクルを描画
particles.forEach(p => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
  ctx.fill();
});

// ===== 月を描画 =====
const moonX = 600;
const moonY = 250;
const moonRadius = 85;

// 月のグロー
const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius + 30);
moonGlow.addColorStop(0, 'rgba(255, 255, 230, 0.1)');
moonGlow.addColorStop(1, 'transparent');
ctx.fillStyle = moonGlow;
ctx.beginPath();
ctx.arc(moonX, moonY, moonRadius + 30, 0, Math.PI * 2);
ctx.fill();

// 月本体（クレーター表現付き）
const moonGradient = ctx.createRadialGradient(
  moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
  moonX, moonY, moonRadius
);
moonGradient.addColorStop(0, '#e8e6d9');
moonGradient.addColorStop(0.7, '#c5c3b8');
moonGradient.addColorStop(1, '#a0a095');

ctx.beginPath();
ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
ctx.fillStyle = moonGradient;
ctx.fill();

// クレーター（暗い斑点）
const craters = [
  { x: -0.25, y: -0.2, r: 0.3, opacity: 0.15 },
  { x: 0.2, y: 0.1, r: 0.2, opacity: 0.12 },
  { x: -0.1, y: 0.3, r: 0.15, opacity: 0.1 },
  { x: 0.35, y: -0.25, r: 0.12, opacity: 0.08 },
];

craters.forEach(c => {
  ctx.beginPath();
  ctx.arc(
    moonX + c.x * moonRadius,
    moonY + c.y * moonRadius,
    c.r * moonRadius,
    0, Math.PI * 2
  );
  ctx.fillStyle = `rgba(80, 80, 75, ${c.opacity})`;
  ctx.fill();
});

// ===== タイトルテキスト =====
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// サイトタイトル
ctx.font = 'bold 72px "Noto Sans JP"';
ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
ctx.fillText('備忘録', width / 2, height / 2 + 95);

// サブテキスト
ctx.font = '300 28px "Noto Sans JP"';
ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
ctx.fillText('intiramisu.github.io', width / 2, height / 2 + 160);

// ===== 保存 =====
const outputDir = path.join(__dirname, '..', 'static');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'og-image.png');
fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));

console.log(`OGP image generated: ${outputPath}`);
