import { Sky } from './sky.js';
import { Terrain } from './terrain.js';

const sky = new Sky(document.getElementById('sky'));
const terrain = new Terrain(document.getElementById('terrain'));

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  sky.update(dt);
  terrain.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
