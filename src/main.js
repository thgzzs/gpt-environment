"use strict";
import { camera, initControls, updateCamera } from "./camera.js";
import { createSky, getSkyColor } from "./sky.js";
import { createTerrain } from "./terrain.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const sky = createSky(camera);
const terrain = createTerrain();
initControls(canvas);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera.aspect = canvas.width / canvas.height;
  sky.resize(canvas.width, canvas.height);
  terrain.resize(canvas.width, canvas.height);
}
window.addEventListener("resize", resize);
resize();

let lastTime = performance.now();
let time = 0;

function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  time += dt;

  updateCamera(terrain.getTerrainHeight);

  sky.render(ctx, time);
  const dayFactor = sky.getDayFactor(time);
  const skyColor = getSkyColor(time);
  terrain.draw(ctx, camera, dayFactor, skyColor);

  requestAnimationFrame(loop);
}

loop();
