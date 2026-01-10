const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// 日本語フォントを登録
registerFont(path.join(__dirname, 'fonts', 'NotoSansJP-Bold.ttf'), { family: 'Noto Sans JP', weight: 'bold' });
registerFont(path.join(__dirname, 'fonts', 'NotoSansJP-Light.ttf'), { family: 'Noto Sans JP', weight: '300' });

const width = 1200;
const height = 630;

// 月齢計算
const SYNODIC_MONTH = 29.530588853;
const FULL_MOON_2026 = new Date(Date.UTC(2026, 0, 3, 10, 4, 0));
const FULL_MOON_AGE = 14.77;

function getMoonAge(date) {
  const diffDays = (date.getTime() - FULL_MOON_2026.getTime()) / 864e5;
  let age = (FULL_MOON_AGE + diffDays) % SYNODIC_MONTH;
  return age < 0 ? age + SYNODIC_MONTH : age;
}

async function generateOGP() {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ===== 背景グラデーション（深い藍〜墨色） =====
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0a0e1a');
  bgGradient.addColorStop(0.5, '#0d1321');
  bgGradient.addColorStop(1, '#06080f');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // ===== カラフルなグロウシェイプ（トップページ風） =====
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
  drawGlowShape(80, 60, 350, [
    'rgba(118, 75, 162, 0.4)',
    'rgba(102, 126, 234, 0.2)'
  ]);

  // ピンクのシェイプ（右下）
  drawGlowShape(1100, 550, 320, [
    'rgba(245, 87, 108, 0.35)',
    'rgba(240, 147, 251, 0.15)'
  ]);

  // シアンのシェイプ（中央右寄り）
  drawGlowShape(850, 300, 280, [
    'rgba(0, 242, 254, 0.25)',
    'rgba(79, 172, 254, 0.1)'
  ]);

  // ===== 星々（控えめに） =====
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.2 + 0.3;
    const opacity = Math.random() * 0.4 + 0.1;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }

  // ===== 月のテクスチャを読み込み =====
  const moonTexturePath = path.join(__dirname, '..', 'static', 'images', 'moon-texture.jpg');
  let moonTexture = null;

  try {
    moonTexture = await loadImage(moonTexturePath);
  } catch (e) {
    console.log('Moon texture not found, using fallback');
  }

  // ===== 月を描画 =====
  const moonX = 750;
  const moonY = 280;
  const moonRadius = 180;
  const moonAge = getMoonAge(new Date());
  const phase = (moonAge / SYNODIC_MONTH) % 1;

  // 月光のグロー（多層）
  const glowLayers = [
    { radius: moonRadius * 2.2, opacity: 0.03 },
    { radius: moonRadius * 1.8, opacity: 0.05 },
    { radius: moonRadius * 1.4, opacity: 0.08 },
    { radius: moonRadius * 1.15, opacity: 0.12 },
  ];

  glowLayers.forEach(layer => {
    const glowGrad = ctx.createRadialGradient(
      moonX, moonY, moonRadius * 0.9,
      moonX, moonY, layer.radius
    );
    glowGrad.addColorStop(0, `rgba(255, 252, 235, ${layer.opacity})`);
    glowGrad.addColorStop(0.5, `rgba(255, 250, 220, ${layer.opacity * 0.4})`);
    glowGrad.addColorStop(1, 'rgba(255, 248, 210, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, layer.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 月本体をテクスチャで描画
  if (moonTexture) {
    // テクスチャから月を描画
    const tempCanvas = createCanvas(moonRadius * 2, moonRadius * 2);
    const tempCtx = tempCanvas.getContext('2d');

    const lightAngle = phase * 2 * Math.PI;
    const lightX = Math.sin(lightAngle);
    const lightZ = -Math.cos(lightAngle);

    const texWidth = moonTexture.width;
    const texHeight = moonTexture.height;

    // テクスチャをオフスクリーンキャンバスに描画
    const texCanvas = createCanvas(texWidth, texHeight);
    const texCtx = texCanvas.getContext('2d');
    texCtx.drawImage(moonTexture, 0, 0);
    const texData = texCtx.getImageData(0, 0, texWidth, texHeight);

    const imageData = tempCtx.createImageData(moonRadius * 2, moonRadius * 2);
    const data = imageData.data;
    const size = moonRadius * 2;
    const center = moonRadius;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= moonRadius) {
          const idx = (y * size + x) * 4;
          const nx = dx / moonRadius;
          const ny = dy / moonRadius;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

          // テクスチャサンプリング
          const u = (nx + 1) / 2;
          const v = (ny + 1) / 2;
          const texX = Math.floor(u * texWidth * 0.5 + texWidth * 0.25) % texWidth;
          const texY = Math.floor(v * texHeight) % texHeight;
          const texIdx = (texY * texWidth + texX) * 4;

          const texR = texData.data[texIdx];
          const texG = texData.data[texIdx + 1];
          const texB = texData.data[texIdx + 2];

          // ライティング
          const dotProduct = nx * lightX + nz * lightZ;
          const terminator = 0.12;
          let lightFactor = (dotProduct + terminator) / (2 * terminator);
          lightFactor = Math.max(0, Math.min(1, lightFactor));
          lightFactor = lightFactor * lightFactor * (3 - 2 * lightFactor);

          const ambientLight = 0.08;
          const limbDarkening = 0.85 + 0.15 * nz;
          const brightness = (ambientLight + (1 - ambientLight) * lightFactor) * limbDarkening;

          const shadowTint = 1 - lightFactor;
          data[idx] = Math.floor(Math.min(255, texR * brightness * (1 - shadowTint * 0.05)));
          data[idx + 1] = Math.floor(Math.min(255, texG * brightness));
          data[idx + 2] = Math.floor(Math.min(255, texB * brightness * (1 + shadowTint * 0.1)));
          data[idx + 3] = 255;
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, moonX - moonRadius, moonY - moonRadius);
  } else {
    // フォールバック: シンプルな月
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
  }

  // ===== テキスト =====
  // メインタイトル「備忘録」- 左側に大きく
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // タイトル
  ctx.font = 'bold 72px "Noto Sans JP"';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText('備忘録', 80, height / 2 - 10);

  // サブテキスト
  ctx.font = '300 22px "Noto Sans JP"';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('— intiramisu', 85, height / 2 + 50);

  // ===== 装飾ライン =====
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, height / 2 + 85);
  ctx.lineTo(320, height / 2 + 85);
  ctx.stroke();

  // ===== 保存 =====
  const outputDir = path.join(__dirname, '..', 'static');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'og-image.png');
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));

  console.log(`OGP image generated: ${outputPath}`);
  console.log(`Moon age: ${moonAge.toFixed(1)} days`);
}

generateOGP().catch(console.error);
