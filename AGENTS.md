# Repository instructions

## Delegated visual-work orchestration

- Use the project-scoped agents in `.codex/agents/` for mascot and landing-page delegation. The root/orchestrator owns the full conversation and must spawn children with `fork_turns="none"`.
- Give `art-director` only the user request and visual references; give `visual-critic` only the art brief and final PNGs. Never give either Blender MCP transcripts, terminal/debug output, source code, or exploratory progress captures.
- Give `blender-operator` and `web-developer` only one focused work order plus the relevant excerpt of the approved art brief. The art director owns aesthetic changes; an execution agent must not reinterpret the visual target.
- Run Blender and web execution sequentially, never concurrently. A visual critic may request at most three image-visible corrections; stop after two revise cycles unless the user authorizes further polishing.

- Before visual changes, read [the art direction](docs/mascot-art-direction.md) and inspect `strnk-logo.svg` and `assets/strnk-concept.png`. Preserve user reference files.
- Follow [the Blender and web review loop](tools/blender/README.md). Actually inspect the resulting PNGs; successful scripts or manifold geometry do not establish visual quality.
- Keep reusable automation in `tools/`; generated reviews and one-off experiments belong in ignored `.tmp/`. The `.blend` is the editable source of truth.

## Local environment

- The user runs the Yarn dev server in their own terminal at `http://127.0.0.1:5173/`. Before any build or run command, check that URL/port first. Reuse the running server for browser reviews; do not start a duplicate server or stop/restart the user's server. Only start a dev server if the port check confirms none is running.
- Windows workspace; use PowerShell. Start one persistent PowerShell session, reuse it for shell work, and close it with `exit` after work.
- Yarn 1.22.19 is installed under `C:\Program Files\nodejs`. Plain `yarn` works when the user's `CurrentUser` execution policy (`RemoteSigned`) is loaded. If a sandboxed PowerShell resolves the blocked `yarn.ps1` shim, call `yarn.cmd` explicitly. `yarn.cmd build` is verified from PowerShell.
- Prefer native Blender MCP tools; discover deferred tools and probe `get_blendfile_summary_path_info` first. Connection refused means start Blender and its Lab MCP server, not reinstall the bridge.
- Blender 5.2.1 uses the Blender Lab extension on `localhost:9876`. Bridge setup is in the workflow document.
- The user's Codex config marks this repository trusted, enables the elevated Windows sandbox, and sets routine Blender MCP tools to `approve`. Reconnect or start a new Codex session after config changes so they take effect; do not request approval for each routine PowerShell or Blender MCP call once loaded.
- If `uvx` is missing from an agent's PATH, its verified location is `C:\Users\Jasper\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uvx.exe`.
