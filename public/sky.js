export class Sky {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({ x: Math.random(), y: Math.random() * 0.5 });
    }
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(dt) {
    this.time += dt;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = (Math.sin(this.time * 0.1) + 1) / 2;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const top = `rgb(${20 + 100 * t}, ${40 + 80 * t}, ${120 + 120 * t})`;
    const bottom = `rgb(${40 + 100 * t}, ${80 + 80 * t}, 200)`;
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 1 - t;
    for (const s of this.stars) {
      ctx.fillRect(s.x * canvas.width, s.y * canvas.height, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}
