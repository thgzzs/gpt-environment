"use strict";
import { fractalNoise, lerpColor, lerp, smoothStep } from "./noise.js";

const dayCyclePeriod = 60;

export function getDayFactor(time) {
  return (
    0.5 + 0.5 * Math.sin((2 * Math.PI * time) / dayCyclePeriod - Math.PI / 2)
  );
}

export function getSkyColor(time) {
  const daySkyBottom = { r: 165, g: 200, b: 255 };
  const nightSkyBottom = { r: 10, g: 10, b: 40 };
  const sunriseColor = { r: 255, g: 140, b: 70 };
  const nightHorizonColor = { r: 15, g: 10, b: 30 };
  const softPurple = { r: 180, g: 150, b: 200 };

  const dayFactor = getDayFactor(time);
  const skyBottomColor = lerpColor(nightSkyBottom, daySkyBottom, dayFactor);
  const horizonBase =
    dayFactor <= 0.33
      ? lerpColor(nightHorizonColor, sunriseColor, smoothStep(0, 0.33, dayFactor))
      : dayFactor <= 0.66
        ? lerpColor(
            sunriseColor,
            softPurple,
            smoothStep(0.33, 0.66, dayFactor),
          )
        : lerpColor(
            softPurple,
            skyBottomColor,
            smoothStep(0.66, 1, dayFactor),
          );
  const horizonColor = lerpColor(horizonBase, skyBottomColor, 0.4);
  return horizonColor;
}

export function createSky(camera) {
  const offRes = 6;
  const offCanvas = document.createElement("canvas");
  const offCtx = offCanvas.getContext("2d");
  offCtx.imageSmoothingEnabled = true;

  const cloudPlaneY = 240,
    cloudScale = 0.025,
    cloudSpeed = 1,
    threshold = 0.5;
  const voidPlaneY = 0;
  const fogStart = 1,
    fogEnd = 5000;
  const voidFogStart = 1,
    voidFogEnd = 2000;
  const perspectiveExponent = 0.45;

  const daySkyTop = { r: 120, g: 180, b: 240 };
  const daySkyBottom = { r: 165, g: 200, b: 255 };
  const nightSkyTop = { r: 0, g: 0, b: 20 };
  const nightSkyBottom = { r: 10, g: 10, b: 40 };
  const sunriseColor = { r: 255, g: 140, b: 70 };
  const nightHorizonColor = { r: 15, g: 10, b: 30 };
  const softPurple = { r: 180, g: 150, b: 200 };
  const cloudColorDay = { r: 255, g: 255, b: 255 };
  const cloudColorNight = { r: 80, g: 80, b: 100 };

  const sunDir = { x: 0.3, y: 0.5, z: 0.7 };
  const sunMag = Math.hypot(sunDir.x, sunDir.y, sunDir.z);
  sunDir.x /= sunMag;
  sunDir.y /= sunMag;
  sunDir.z /= sunMag;

  const tonedDownHorizon = (horizon, base, factor = 0.4) =>
    lerpColor(horizon, base, factor);

  const starCount = 500;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    const phi = 2 * Math.PI * Math.random();
    const cosTheta = Math.random();
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const x = sinTheta * Math.cos(phi);
    const y = cosTheta;
    const z = sinTheta * Math.sin(phi);
    stars.push({
      x,
      y,
      z,
      twinkleOffset: Math.random() * Math.PI * 2,
      baseBrightness: 0.8 + Math.random() * 0.4,
    });
  }

  let cw = 0,
    ch = 0;

  function resize(width, height) {
    cw = width;
    ch = height;
    offCanvas.width = Math.ceil(width / offRes);
    offCanvas.height = Math.ceil(height / offRes);
  }

  function fogBlend(distance) {
    let t = (distance - fogStart) / (fogEnd - fogStart);
    return Math.max(0, Math.min(1, t * t * (3 - 2 * t)));
  }

  function voidFogBlend(distance) {
    let t = (distance - voidFogStart) / (voidFogEnd - voidFogStart);
    return Math.max(0, Math.min(1, t * t * (3 - 2 * t)));
  }

  function render(ctx, time) {
    const wOff = offCanvas.width,
      hOff = offCanvas.height;
    const dayFactor = getDayFactor(time);
    const skyTopColor = lerpColor(nightSkyTop, daySkyTop, dayFactor);
    const skyBottomColor = lerpColor(nightSkyBottom, daySkyBottom, dayFactor);
    let horizonColor = tonedDownHorizon(
      dayFactor <= 0.33
        ? lerpColor(
            nightHorizonColor,
            sunriseColor,
            smoothStep(0, 0.33, dayFactor),
          )
        : dayFactor <= 0.66
          ? lerpColor(
              sunriseColor,
              softPurple,
              smoothStep(0.33, 0.66, dayFactor),
            )
          : lerpColor(
              softPurple,
              skyBottomColor,
              smoothStep(0.66, 1, dayFactor),
            ),
      skyBottomColor,
      0.4,
    );
    const baseSkyColor = skyBottomColor;
    const dynamicCloudColor = lerpColor(
      cloudColorNight,
      cloudColorDay,
      dayFactor,
    );

    const cosPitch = Math.cos(camera.pitch),
      sinPitch = Math.sin(camera.pitch);
    const cosYaw = Math.cos(camera.yaw),
      sinYaw = Math.sin(camera.yaw);
    const forward = {
      x: cosPitch * sinYaw,
      y: sinPitch,
      z: cosPitch * cosYaw,
    };
    const right = {
      x: Math.sin(camera.yaw + Math.PI / 2),
      y: 0,
      z: Math.cos(camera.yaw + Math.PI / 2),
    };
    const up = {
      x: forward.y * right.z - forward.z * right.y,
      y: forward.z * right.x - forward.x * right.z,
      z: forward.x * right.y - forward.y * right.x,
    };
    const scale = Math.tan(camera.fov / 2);

    const nightAlpha = 1 - dayFactor;
    function fadeToBlack(color, alpha) {
      return {
        r: Math.round(color.r * (1 - alpha)),
        g: Math.round(color.g * (1 - alpha)),
        b: Math.round(color.b * (1 - alpha)),
      };
    }
    const fadedTop = fadeToBlack(skyTopColor, nightAlpha * 0.5);
    const fadedBottom = fadeToBlack(skyBottomColor, nightAlpha * 0.7);

    const skyGrad = offCtx.createLinearGradient(0, 0, 0, hOff);
    skyGrad.addColorStop(0, `rgb(${fadedTop.r},${fadedTop.g},${fadedTop.b})`);
    skyGrad.addColorStop(
      1,
      `rgb(${fadedBottom.r},${fadedBottom.g},${fadedBottom.b})`,
    );
    offCtx.fillStyle = skyGrad;
    offCtx.fillRect(0, 0, wOff, hOff);

    const imgData = offCtx.getImageData(0, 0, wOff, hOff);
    const data = imgData.data;

    for (let py = 0; py < hOff; py++) {
      const ndcY = 1 - 2 * (py / hOff);
      for (let px = 0; px < wOff; px++) {
        const ndcX = 2 * (px / wOff) - 1;
        let rayX =
          forward.x +
          ndcX * scale * camera.aspect * right.x +
          ndcY * scale * up.x;
        let rayY =
          forward.y +
          ndcX * scale * camera.aspect * right.y +
          ndcY * scale * up.y;
        let rayZ =
          forward.z +
          ndcX * scale * camera.aspect * right.z +
          ndcY * scale * up.z;
        const len = Math.hypot(rayX, rayY, rayZ);
        rayX /= len;
        rayY /= len;
        rayZ /= len;

        let col = baseSkyColor;
        if (rayY > 0) {
          let tRaw = (cloudPlaneY - camera.y) / rayY;
          const adjust = lerp(
            1,
            5,
            Math.max(0, Math.min(1, (0.2 - rayY) / 0.2)),
          );
          tRaw *= adjust;
          if (tRaw > 0) {
            const tEff =
              (cloudPlaneY - camera.y) *
              Math.pow(tRaw / (cloudPlaneY - camera.y), perspectiveExponent);
            let wx = camera.x + rayX * tEff + time * cloudSpeed;
            let wz = camera.z + rayZ * tEff + time * cloudSpeed;
            const n = fractalNoise(wx * cloudScale, wz * cloudScale);
            const cloudFactor = Math.min(Math.max((n - threshold) / 0.1, 0), 1);
            const cloudBase = {
              r: lerp(baseSkyColor.r, dynamicCloudColor.r, cloudFactor),
              g: lerp(baseSkyColor.g, dynamicCloudColor.g, cloudFactor),
              b: lerp(baseSkyColor.b, dynamicCloudColor.b, cloudFactor),
            };
            const dist = Math.min(tRaw, fogEnd);
            const fogFactor = fogBlend(dist);
            let cloudFinal = {
              r: lerp(cloudBase.r, horizonColor.r, fogFactor),
              g: lerp(cloudBase.g, horizonColor.g, fogFactor),
              b: lerp(cloudBase.b, horizonColor.b, fogFactor),
            };
            const light = Math.max(
              0,
              rayX * sunDir.x + rayY * sunDir.y + rayZ * sunDir.z,
            );
            cloudFinal.r = Math.min(255, cloudFinal.r * (1 + 0.1 * light));
            cloudFinal.g = Math.min(255, cloudFinal.g * (1 + 0.1 * light));
            cloudFinal.b = Math.min(255, cloudFinal.b * (1 + 0.1 * light));
            col = cloudFinal;
          }
        } else {
          let tRaw = (voidPlaneY - camera.y) / rayY;
          if (tRaw > 0) {
            const dist = Math.min(tRaw, voidFogEnd);
            const distBlend = voidFogBlend(dist);
            const tonedVoid = lerpColor(
              horizonColor,
              { r: 255, g: 255, b: 255 },
              0.2,
            );
            col = lerpColor(baseSkyColor, tonedVoid, distBlend);
          }
        }
        const idx = (py * wOff + px) * 4;
        data[idx] = col.r | 0;
        data[idx + 1] = col.g | 0;
        data[idx + 2] = col.b | 0;
        data[idx + 3] = 255;
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    ctx.fillStyle = `rgb(${baseSkyColor.r},${baseSkyColor.g},${baseSkyColor.b})`;
    ctx.fillRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offCanvas, 0, 0, cw, ch);

    const starVisibility = 1 - dayFactor;
    if (starVisibility > 0.01) {
      const starFogFactor = fogBlend(4000);
      for (const s of stars) {
        const cx = s.x * right.x + s.y * right.y + s.z * right.z;
        const cy = s.x * up.x + s.y * up.y + s.z * up.z;
        const cz = s.x * forward.x + s.y * forward.y + s.z * forward.z;
        if (cz <= 0) continue;
        const ndcX = cx / (cz * scale * camera.aspect);
        const ndcY = cy / (cz * scale);
        const sx = (ndcX + 1) * 0.5 * cw;
        const sy = (1 - ndcY) * 0.5 * ch;
        const twinkle = 0.8 + 0.2 * Math.sin(time * 5 + s.twinkleOffset);
        const finalBrightness =
          s.baseBrightness * twinkle * starVisibility * (1 - starFogFactor);
        if (finalBrightness <= 0.01) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255,255,255,${finalBrightness})`;
        ctx.fill();
      }
    }
  }

  return { resize, render, getDayFactor };
}
