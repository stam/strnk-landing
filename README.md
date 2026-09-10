# STRNK

A static landing page for **strnk.nl**. STRNK is “stronk” without the O: Dutch for a tree stump, with a nod to “strong.” The first viewport pairs the wordmark and “Powerful software” with a stylized 3D mascot.

## Development

Uses vanilla JavaScript, Three.js, Vite 4, and Yarn Classic. Vite 4 was selected for the installed Node 16 environment.

```sh
yarn install
yarn dev
yarn build
yarn preview
```

Deploy `dist/` to static hosting. No backend is required. Fonts currently load from Google Fonts.

## Files

- `src/main.js`: GLB loading, monochrome edges, camera, pointer movement, and reduced-motion handling.
- `src/contour.js`: view-dependent silhouette lines, preserving outlines when minor edges are filtered out.
- `src/style.css` and `index.html`: responsive first viewport.
- `assets/mascot.blend`: editable Blender source; `public/models/mascot.glb`: website export.
- `strnk-logo.svg`: original logo reference. `assets/strnk-concept.png` is a newly added reference to inspect.
- `scripts/`: Blender generation history, MCP client, and active-scene export helper.

## Model workflow

Use Blender Lab’s MCP extension, with its matching external Python bridge—not the unrelated PyPI project with the same `blender-mcp` name. The bridge source is:

```text
git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp
```

Inspect the active scene before running scripts. `scripts/export-mascot.py` validates manifold edges, exports only selected meshes in the active scene, and saves the open `.blend`. It changes files and selection.

See [AGENTS.md](AGENTS.md) for the design direction, local connection details, and handoff status.
