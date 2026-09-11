# Repository instructions

- Before visual work, read [the art direction](docs/mascot-art-direction.md) and inspect `strnk-logo.svg` and `assets/strnk-concept.png`. Preserve user reference files.
- Follow [the Blender and web review loop](tools/blender/README.md). Actually inspect the resulting PNGs; successful scripts or manifold geometry do not establish visual quality.
- Keep reusable automation in `tools/`; generated reviews and one-off experiments belong in ignored `.tmp/`. The `.blend` is the editable source of truth.

## Local environment

- Windows workspace; use PowerShell. Start one persistent PowerShell session, reuse it for shell work, and close it with `exit` after work.
- Yarn 1.22.19 is installed under `C:\Program Files\nodejs`. Plain `yarn` works when the user's `CurrentUser` execution policy (`RemoteSigned`) is loaded. If a sandboxed PowerShell resolves the blocked `yarn.ps1` shim, call `yarn.cmd` explicitly. `yarn.cmd build` is verified from PowerShell.
- Prefer native Blender MCP tools; discover deferred tools and probe `get_blendfile_summary_path_info` first. Connection refused means start Blender and its Lab MCP server, not reinstall the bridge.
- Blender 5.2.1 uses the Blender Lab extension on `localhost:9876`. Bridge setup is in the workflow document.
- The user's Codex config marks this repository trusted, enables the elevated Windows sandbox, and sets routine Blender MCP tools to `approve`. Reconnect or start a new Codex session after config changes so they take effect; do not request approval for each routine PowerShell or Blender MCP call once loaded.
- If `uvx` is missing from an agent's PATH, its verified location is `C:\Users\Jasper\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uvx.exe`.
