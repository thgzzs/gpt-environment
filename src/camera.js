"use strict";
export const camera = {
  x: 256,
  y: 100,
  z: 0,
  yaw: 0,
  pitch: 0,
  fov: 1.2,
  aspect: 1,
};

let velocityX = 0;
let velocityY = 0;
let velocityZ = 0;

const acceleration = 0.2;
const friction = 0.15;
const gravity = -0.3;
const jumpStrength = 2.5;
const playerHeight = 20;

let mouseLocked = false;
const keys = {};
let isGrounded = false;
const sensitivity = 0.002;

export function initControls(canvas) {
  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === " " && isGrounded) {
      velocityY = jumpStrength;
    }
  });
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  canvas.onclick = () => canvas.requestPointerLock();
  document.addEventListener("pointerlockchange", () => {
    mouseLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener("mousemove", (e) => {
    if (mouseLocked) {
      camera.yaw += e.movementX * sensitivity;
      camera.pitch -= e.movementY * sensitivity;
      camera.pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, camera.pitch),
      );
    }
  });
}

export function updateCamera(getHeight) {
  const maxSpeed = 2.5;
  const sinYaw = Math.sin(camera.yaw);
  const cosYaw = Math.cos(camera.yaw);

  const forward = [sinYaw, 0, cosYaw];
  const right = [cosYaw, 0, -sinYaw];

  let dirX = 0,
    dirZ = 0;
  if (keys["w"]) {
    dirX += forward[0];
    dirZ += forward[2];
  }
  if (keys["s"]) {
    dirX -= forward[0];
    dirZ -= forward[2];
  }
  if (keys["a"]) {
    dirX -= right[0];
    dirZ -= right[2];
  }
  if (keys["d"]) {
    dirX += right[0];
    dirZ += right[2];
  }

  const dirLength = Math.hypot(dirX, dirZ);
  if (dirLength > 0) {
    dirX /= dirLength;
    dirZ /= dirLength;
  }

  velocityX += dirX * acceleration;
  velocityZ += dirZ * acceleration;

  const effectiveFriction = friction * (isGrounded ? 1 : 0.5);
  velocityX *= 1 - effectiveFriction;
  velocityZ *= 1 - effectiveFriction;

  const speed = Math.hypot(velocityX, velocityZ);
  if (speed > maxSpeed) {
    const s = maxSpeed / speed;
    velocityX *= s;
    velocityZ *= s;
  }

  camera.x += velocityX;
  camera.z += velocityZ;

  velocityY += gravity;
  camera.y += velocityY;

  const groundY = getHeight(camera.x, camera.z) + playerHeight;
  if (camera.y <= groundY) {
    camera.y = groundY;
    velocityY = 0;
    isGrounded = true;
  } else {
    isGrounded = false;
  }
}
