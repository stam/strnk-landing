# STRNK

A static landing page for **strnk.nl**. STRNK is “stronk” without the O: Dutch for a tree stump, with a nod to “strong.”

## Development

Vanilla JavaScript, Three.js, Vite 4, and Yarn Classic. Vite 4 supports the project's Node 16 environment.

```sh
yarn install
yarn dev
yarn build
yarn preview
```

Deploy `dist/` to static hosting. No backend is required. Fonts load from Google Fonts.

## Repository

- `src/main.js`: model loading, lighting, camera, pointer movement, and reduced motion.
- `src/contour.js`: view-dependent silhouette lines.
- `src/style.css` and `index.html`: responsive landing page.
- `assets/mascot.blend`: editable model; `public/models/mascot.glb`: website export.
- `assets/textures/`: editable textures, also packed into the model.
- `strnk-logo.svg` and `assets/strnk-concept.png`: original visual references.
- [Blender and web workflow](tools/blender/README.md): inspect, render, adjust, export, and review.
- [Mascot art direction](docs/mascot-art-direction.md): visual requirements.

The website builds from the committed GLB; Blender is only needed to change the model.
