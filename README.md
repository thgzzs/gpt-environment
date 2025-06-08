# GPT Environment

https://thgzzs.github.io/gpt-environment/

This project demonstrates a minimal first‑person environment rendered on a canvas. Terrain and sky are generated procedurally using JavaScript modules in `src/`. The entry HTML file now lives in the project root so it can be served directly.

## Running the Demo

Serve `index.html` with any static server. For example using the development server from the included `package.json`:

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Building

If you want to bundle the modules, run:

```bash
npm run build
```

The output will be placed in `dist/` by the bundler.
