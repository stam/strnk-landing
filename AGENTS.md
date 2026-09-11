# Repository instructions

- Before visual work, read [the art direction](docs/mascot-art-direction.md) and inspect `strnk-logo.svg` and `assets/strnk-concept.png`. Preserve user reference files.
- Follow [the Blender and web review loop](tools/blender/README.md). Actually inspect the resulting PNGs; successful scripts or manifold geometry do not establish visual quality.
- Keep reusable automation in `tools/`; generated reviews and one-off experiments belong in ignored `.tmp/`. The `.blend` is the editable source of truth.

## Local environment

- Windows workspace; use the user's Cmder backed by `cmd.exe`. Start one persistent session with `cmd.exe /k C:\Users\Jasper\Documents\cmder\vendor\init.bat`, reuse it, and close it with `exit` after work. Plain `yarn` works there.
- Prefer native Blender MCP tools; discover deferred tools and probe `get_blendfile_summary_path_info` first. Connection refused means start Blender and its Lab MCP server, not reinstall the bridge.
- Blender 5.2.1 uses the Blender Lab extension on `localhost:9876`. Bridge setup is in the workflow document.
- Routine Blender MCP approval is configured in the user's Codex config; reconnect to pick up changes. This does not grant unrelated shell, Node, or browser approvals. Use normal escalation when necessary.
- If `uvx` is missing from an agent's PATH, its verified location is `C:\Users\Jasper\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uvx.exe`.
