"use strict";
import { smoothNoise, lerp } from "./noise.js";

export function createTerrain(seed = Math.floor(Math.random() * 100000)) {
  let W = 0;
  let H = 0;
  const terrainSeed = seed;

  function getTerrainHeight(x, z) {
    let height = 0;
    let scale = 0.01;
    let amplitude = 50;

    for (let o = 0; o < 5; o++) {
      height +=
        smoothNoise(x * scale, z * scale, terrainSeed + o * 1000) * amplitude;
      scale *= 2;
      amplitude *= 0.5;
    }

    const ridge =
      Math.abs(smoothNoise(x * 0.005, z * 0.005, terrainSeed + 99) - 0.5) * 2;
    height += ridge * 20;

    return height - z * 0.03;
  }

  const CHUNK_SIZE = 2;
  const heightCache = new Map();

  function getCachedHeight(x, z) {
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    if (!heightCache.has(key)) {
      const h = getTerrainHeight(x, z);
      heightCache.set(key, h);
    }
    return heightCache.get(key);
  }

  function resize(width, height) {
    W = width;
    H = height;
  }

  function draw(ctx, camera, dayFactor = 1, skyColor = { r: 0, g: 0, b: 0 }) {
    const camX = camera.x;
    const camY = camera.y;
    const camZ = camera.z;
    const yaw = camera.yaw;
    const pitch = camera.pitch;

    const imageData = ctx.getImageData(0, 0, W, H);
    const buffer = imageData.data;
    const pixelBuffer = new Uint32Array(buffer.buffer);
    const yBuffer = new Uint16Array(W).fill(H);

    const halfW = W >> 1;
    const fovScale = 1.4;
    const scale = 280 / fovScale;

    const zNear = 5,
      zFar = 120;
    const lodFactor = 0.015;

     const fogStrength = 0.0025;
     const fogColorDay = [155, 185, 215];
     const fogColorNight = [40, 50, 80];
      const fogColorBase = [
       lerp(fogColorNight[0], fogColorDay[0], dayFactor),
        lerp(fogColorNight[1], fogColorDay[1], dayFactor),
       lerp(fogColorNight[2], fogColorDay[2], dayFactor),
      ];
      const fogColor = [
        lerp(fogColorBase[0], skyColor.r, 0.4),
        lerp(fogColorBase[1], skyColor.g, 0.4),
        lerp(fogColorBase[2], skyColor.b, 0.4),
    ];

    const sinYaw = Math.sin(yaw),
      cosYaw = Math.cos(yaw);
    const sinPitch = Math.sin(pitch),
      cosPitch = Math.cos(pitch);
    const horizon = H / 2 + pitch * 300;

    const sunX = Math.sin(-Math.PI / 3);
    const sunZ = Math.cos(-Math.PI / 3);
    const ambient = lerp(0.15, 0.35, dayFactor),
      lightIntensity = lerp(0.5, 1.5, dayFactor);
    const slopeStep = 3;

    for (let z = zNear; z < zFar; ) {
      const invZ = 1 / z;
      const pz = z;

      const camXOffset = camX + pz * sinYaw;
      const camZOffset = camZ + pz * cosYaw;

      const zStep = 1 + z * lodFactor;
      const dxStep = Math.max(1, Math.floor(z * lodFactor * 2));
      const stepCosYaw = (pz * cosYaw) / halfW;
      const stepSinYaw = (-pz * sinYaw) / halfW;

      for (let x = 0; x < W; x += dxStep) {
        const xProj = x - halfW;
        const nextXProj = xProj + dxStep;

        const worldX1 = camXOffset + xProj * stepCosYaw;
        const worldZ1 = camZOffset + xProj * stepSinYaw;
        const worldX2 = camXOffset + nextXProj * stepCosYaw;
        const worldZ2 = camZOffset + nextXProj * stepSinYaw;

        const h1 = getCachedHeight(worldX1, worldZ1);
        const h2 = getCachedHeight(worldX2, worldZ2);

        for (let i = 0; i < dxStep; i++) {
          const xi = x + i;
          if (xi >= W) break;

          const t = i / dxStep;
          const worldX = worldX1 * (1 - t) + worldX2 * t;
          const worldZ = worldZ1 * (1 - t) + worldZ2 * t;
          const h = h1 * (1 - t) + h2 * t;

          const projH =
            ((h - camY) * cosPitch - z * sinPitch) * invZ * scale * 1.5;
          const screenY = horizon - projH;

          if (screenY >= yBuffer[xi]) continue;

          const hNorm = Math.min(1, Math.max(0, (h - 10) * 0.008));
          const moisture = smoothNoise(
            worldX * 0.001,
            worldZ * 0.001,
            terrainSeed + 5000,
          );
          const baseNoise = smoothNoise(
            worldX * 0.02,
            worldZ * 0.02,
            terrainSeed + 1234,
          );
          const jitter = smoothNoise(
            worldX * 0.015,
            worldZ * 0.015,
            terrainSeed,
          );

          const shore = Math.pow(Math.max(0, 1 - hNorm * 5), 2);
          const taiga = Math.max(0, (hNorm - 0.65) * 3 + (moisture - 0.6) * 2);
          const forest = Math.max(0, 1 - Math.abs(moisture - 0.55) * 2.5);
          const plains = Math.max(0, (1 - moisture) * 1.6 * (1 - taiga));
          const biomeSum = shore + taiga + forest + plains || 1;

          let r =
            (194 * shore + 120 * plains + 80 * forest + 50 * taiga) / biomeSum;
          let g =
            (178 * shore + 180 * plains + 140 * forest + 100 * taiga) /
            biomeSum;
          let b =
            (128 * shore + 80 * plains + 60 * forest + 50 * taiga) / biomeSum;

          const heightLum = 0.8 + hNorm * 0.25;
          const jitterFactor = 1 + (jitter - 0.5) * 0.08;
          const bump = (baseNoise - 0.5) * 0.1;
          const contour = 1 + Math.sin(h * 0.15) * 0.05;

          r *= heightLum * jitterFactor * contour * (1 + bump);
          g *= heightLum * jitterFactor * 0.98 * contour * (1 + bump);
          b *= heightLum * jitterFactor * 0.96 * contour * (1 + bump);

          const isFar = z > 80;
          let finalLight = 1;

          if (!isFar) {
            const neighborH = getCachedHeight(
              worldX - sunX * slopeStep,
              worldZ - sunZ * slopeStep,
            );
            const slope = (h - neighborH) / slopeStep;
            let lightFactor =
              lightIntensity * Math.max(0, Math.min(1, 0.5 + slope * 0.15));
            finalLight = ambient + lightFactor * (1 - ambient);

            const ao =
              0.85 +
              0.15 *
                Math.min(
                  1,
                  Math.max(0, (h - 5) / 180 + Math.min(0, slope * 0.02)),
                );
            finalLight *= Math.pow(ao, 1.5);
          } else {
            const fakeSlope = (hNorm - 0.5) * 0.4;
            finalLight *= 0.8 + fakeSlope;
          }

          finalLight *= lerp(0.2, 1, dayFactor);

          r = Math.min(255, r * finalLight);
          g = Math.min(255, g * finalLight);
          b = Math.min(255, b * finalLight);

          r = lerp(r, skyColor.r, 0.3);
          g = lerp(g, skyColor.g, 0.3);
          b = lerp(b, skyColor.b, 0.3);

          const yStart = Math.max(0, screenY | 0);
          const yEnd = Math.min(H, yBuffer[xi] | 0);
          if (yStart >= yEnd) continue;

          for (let y = yStart; y < yEnd; y++) {
              const fogAmount = Math.min(
                1,
                (z + Math.abs(y - horizon) * 0.3) * fogStrength,
             );
              const invFog = 1 - fogAmount;

              const fr = r * invFog + fogColor[0] * fogAmount;
              const fg = g * invFog + fogColor[1] * fogAmount;
              const fb = b * invFog + fogColor[2] * fogAmount;

            const idx = y * W + xi;
            pixelBuffer[idx] = (255 << 24) | (fb << 16) | (fg << 8) | (fr | 0);
          }

          yBuffer[xi] = yStart;
        }
      }

      z += zStep;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  return { draw, resize, getTerrainHeight };
}
