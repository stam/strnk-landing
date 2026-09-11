# Blender and web review loop

**Inspect scene → adjust in Blender → render PNGs → Codex inspects PNGs → repeat → export → review website.**

`assets/mascot.blend` is the source of truth. The current model is in **STRNK Concept**; earlier scenes remain for reference. Only meshes with a truthy `mascot_export` custom property belong in previews and exports. Studio ground, cameras, and lights are excluded.

## Connect and inspect

Prefer native Blender MCP tools and first call `get_blendfile_summary_path_info`. Blender and its Blender Lab MCP server must be running. The matching bridge command is:

```text
uvx --python 3.11 --from "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp" blender-mcp
```

Open the repository's blend file and confirm the active scene with `scene_report.py`. It prints JSON with scene names, objects, export tags, and evaluated mesh counts/non-manifold edges. It does not save or modify the source.

Run scripts through MCP's `execute_blender_code` using `runpy`, so paths resolve correctly:

```python
import runpy
result = runpy.run_path(
    r'C:\Users\Jasper\Code\strnk\tools\blender\scene_report.py',
    run_name='__main__',
)['result']
```

Substitute `render_preview.py` or `export_web.py` for subsequent steps. The same snippet works in Blender's Python Console. For background Blender Python, from PowerShell at the repository root (with Blender on PATH):

```powershell
blender --background assets/mascot.blend --scene "STRNK Concept" --python-exit-code 1 --python tools/blender/scene_report.py
blender --background assets/mascot.blend --scene "STRNK Concept" --python-exit-code 1 --python tools/blender/render_preview.py
blender --background assets/mascot.blend --scene "STRNK Concept" --python-exit-code 1 --python tools/blender/export_web.py
```

Background commands read the saved file; use MCP or the console to review unsaved live edits.

## Model loop

1. Read the [art direction](../../docs/mascot-art-direction.md) and inspect both reference images before visual edits.
2. Inspect the scene report, then make a focused change with Blender MCP / Blender Python.
3. Run `render_preview.py`. It renders tagged meshes in a temporary solid-shaded scene to `.tmp/blender/preview/front.png`, `low-angle.png`, and `side-elevated.png`. It restores the source scene and removes temporary objects; it does not save the blend. Camera framing is fixed for the repository's mascot scale.
4. Open **all three PNGs** with Codex's image viewer. Check silhouette, thumb handedness, roots, and readable planes. Adjust and repeat until they satisfy the art direction.
5. Run `export_web.py` in Object Mode. It rejects missing tags, empty meshes, and non-manifold evaluated geometry, exports tagged meshes to `public/models/mascot.glb`, restores selection, and saves `assets/mascot.blend`. This intentionally writes both assets. Review their changes before committing.

## Web loop

1. Start `yarn.cmd dev` in PowerShell and use the URL Vite reports. (`yarn` also works when PowerShell permits the installed `yarn.ps1` shim.)
2. Capture browser reviews with the reusable helper (requires `uvx` and installed Microsoft Edge):

   ```powershell
   uvx --python 3.11 --from playwright python tools/web/capture_preview.py http://127.0.0.1:5173/
   ```

   It writes PNGs to `.tmp/web/`, waits for `.scene.ready` and fonts, and fails for page errors or horizontal overflow.
3. Inspect desktop/mobile solid and wireframe PNGs, plus front and elevated side views. Check composition, silhouette, lighting, clipping, and small-screen fit. Debug URLs `?camera=front`, `?camera=side`, and `?view=wireframe` work only in development.
4. Adjust web layout/lighting directly; return to the model loop for geometry changes. Recapture and inspect after adjustments, then run `yarn.cmd build`.

Generated files under `.tmp/` are ignored and replaceable. Historical experiments and reviews are archived under `.tmp/archive/`; they are not required for this workflow. Keep future one-off scripts in `.tmp/blender/`, and promote reusable operations into `tools/`.
