import * as THREE from 'three';

// Generates stylized cartoon canvas textures for Three.js
export function createCartoonWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm cartoon parquet base
  ctx.fillStyle = '#b45309'; // warm amber/brown
  ctx.fillRect(0, 0, 512, 512);

  const plankHeight = 64;
  const plankCount = 512 / plankHeight;

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankHeight;
    // Varying plank shades
    const shadeOffset = (i % 3) * 12;
    ctx.fillStyle = `rgb(${180 + shadeOffset}, ${83 + shadeOffset / 2}, 9)`;
    ctx.fillRect(0, y, 512, plankHeight - 4);

    // Dark outline border for cartoon style
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, y, 512, plankHeight);

    // Staggered vertical plank divides
    const offset = (i % 2) * 128;
    for (let x = offset; x < 512; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + plankHeight);
      ctx.stroke();

      // Small cartoon nail dots
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + 12, y + 16, 3, 0, Math.PI * 2);
      ctx.arc(x + 12, y + plankHeight - 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wood grain swirls
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, y + 25);
    ctx.bezierCurveTo(100, y + 15, 200, y + 45, 300, y + 20);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createCartoonCheckeredFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const tileSize = 64;
  for (let y = 0; y < 256; y += tileSize) {
    for (let x = 0; x < 256; x += tileSize) {
      const isBlack = (x / tileSize + y / tileSize) % 2 === 0;
      ctx.fillStyle = isBlack ? '#1e293b' : '#f8fafc';
      ctx.fillRect(x, y, tileSize, tileSize);

      // Cartoon thick border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, tileSize, tileSize);

      // Subtle shine highlight on white tiles
      if (!isBlack) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(x + 6, y + 6, 16, 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createCartoonWallpaperTexture(themeColor: string = '#1e1b4b', stripeColor: string = '#312e81'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = themeColor;
  ctx.fillRect(0, 0, 256, 256);

  // Vertical cartoon vintage stripes
  ctx.fillStyle = stripeColor;
  for (let x = 0; x < 256; x += 32) {
    ctx.fillRect(x, 0, 16, 256);
  }

  // Vintage fleur-de-lis / diamond crests
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (let y = 32; y < 256; y += 64) {
    for (let x = 16; x < 256; x += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Wainscoting base trim at bottom
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 240, 256, 16);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 220, 256, 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createSpookyPortraitTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Ornate gold frame
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 308);

  // Canvas interior
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 20, 216, 280);

  // Spooky Count / Lady cartoon portrait
  ctx.fillStyle = '#475569';
  // Face
  ctx.beginPath();
  ctx.ellipse(128, 120, 45, 55, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Spooky yellow glowing eyes
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(112, 115, 10, 0, Math.PI * 2);
  ctx.arc(144, 115, 10, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupils that stare
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(114, 115, 4, 0, Math.PI * 2);
  ctx.arc(146, 115, 4, 0, Math.PI * 2);
  ctx.fill();

  // Vampire/ghost teeth
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(115, 148);
  ctx.lineTo(141, 148);
  ctx.stroke();

  // Ornate collar / coat
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(80, 290);
  ctx.lineTo(128, 175);
  ctx.lineTo(176, 290);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createWardrobeLouverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark mahogany wood
  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 0, 256, 512);

  // Border frame
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 242, 498);

  // Vertical center divide
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(128, 14);
  ctx.lineTo(128, 498);
  ctx.stroke();

  // Louver slats (slits to peek through!)
  ctx.fillStyle = '#0f172a';
  for (let y = 40; y < 460; y += 22) {
    // Left door slat
    ctx.fillRect(24, y, 92, 10);
    // Right door slat
    ctx.fillRect(140, y, 92, 10);
  }

  // Brass cartoon handles
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(114, 230, 8, 36, 4);
  ctx.roundRect(134, 230, 8, 36, 4);
  ctx.fill();
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createCarpetRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Ornate royal crimson carpet
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 256, 384);

  // Gold fringe borders
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 236, 364);

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 216, 344);

  // Center medallion
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.ellipse(128, 192, 60, 90, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(128, 192, 24, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
