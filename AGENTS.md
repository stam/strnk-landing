# Working context

## Design direction

- Focus on the first viewport: STRNK / “Powerful software” on the left, muscular tree-stump mascot on the right.
- Hide rear edges; preserve the silhouette. Use a frog’s-eye camera angle.
- Fists face inward toward the trunk. Use a simple clenched mass and thumb, not detailed finger bars.
- Inspect `strnk-logo.svg` and the newly added `assets/strnk-concept.png` before further visual work. Preserve user reference files.
- The user specifically challenged insufficient visual review. Actually inspect solid front, low-angle, and side/elevated renders, then desktop/mobile wireframe screenshots. A successful script or closed mesh alone does not establish visual quality.

## Local tools

- Windows workspace: `C:\Users\Jasper\Code\strnk`. The user uses **Cmder backed by cmd.exe**, not zsh. Honor their explicit preference for Cmder commands, even if session metadata defaults to PowerShell.
- Start a persistent interactive command session with `cmd.exe /k C:\Users\Jasper\Documents\cmder\vendor\init.bat`. Plain `yarn` works there. Sandboxed Node commands previously failed with EPERM; use the normal approval mechanism when necessary.
- Blender 5.2.1 has the **Blender Lab** MCP extension installed. Its local socket listens on `localhost:9876`. The external Python process speaks MCP to Codex and communicates with that socket.
- Codex’s configured bridge uses `uvx --python 3.11 --from "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp" blender-mcp`. Do not replace this with bare `uvx blender-mcp`, which selects a different project.
- The MCP handshake, tool discovery, and a live scene query succeeded. Tools were not exposed directly in this conversation, so `scripts/blender-client.py` was used. It takes the uvx executable and a Blender Python script path, calls `execute_blender_code`, and prints its response.
- `uvx` resolves in the user’s Cmder. Agent-spawned processes sometimes inherited a PATH without it, even after the user restarted. Don’t blame the user’s terminal or repeat shell hunting. The verified executable is `C:\Users\Jasper\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uvx.exe`.
