"use strict";
export function rand(x, z, seed = 0) {
  const h = x * 374761393 + z * 668265263 + seed * 14449;
  const n = (h ^ (h >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

export function interpolate(a, b, t) {
  const ft = t * Math.PI;
  const f = (1 - Math.cos(ft)) * 0.5;
  return a * (1 - f) + b * f;
}

export function smoothNoise(x, z, seed = 0) {
  const intX = Math.floor(x);
  const intZ = Math.floor(z);
  const fracX = x - intX;
  const fracZ = z - intZ;

  const v1 = rand(intX, intZ, seed);
  const v2 = rand(intX + 1, intZ, seed);
  const v3 = rand(intX, intZ + 1, seed);
  const v4 = rand(intX + 1, intZ + 1, seed);

  const i1 = interpolate(v1, v2, fracX);
  const i2 = interpolate(v3, v4, fracX);

  return interpolate(i1, i2, fracZ);
}

const seed = Math.random() * 10000;
export const fract = (x) => x - Math.floor(x);

export function noise(x, z) {
  return fract(Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothNoiseSky(x, z) {
  const xi = Math.floor(x),
    zi = Math.floor(z);
  const xf = x - xi,
    zf = z - zi;
  return lerp(
    lerp(noise(xi, zi), noise(xi + 1, zi), xf),
    lerp(noise(xi, zi + 1), noise(xi + 1, zi + 1), xf),
    zf,
  );
}

export function fractalNoise(x, z, octaves = 4) {
  let total = 0,
    amplitude = 1,
    frequency = 1,
    maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    total += smoothNoiseSky(x * frequency, z * frequency) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / maxAmp;
}

export function lerpColor(a, b, t) {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

export function smoothStep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
