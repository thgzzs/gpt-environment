export class Terrain {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offset = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(dt) {
    const { ctx, canvas } = this;
    this.offset += dt * 50;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#228B22';
    const h = canvas.height;
    for (let x = 0; x < canvas.width; x++) {
      const y = h * 0.6 + Math.sin((x + this.offset) * 0.01) * 20;
      ctx.fillRect(x, y, 1, h - y);
    }
  }
}
