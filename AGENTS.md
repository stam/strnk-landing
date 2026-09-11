# Working context

## Design direction

- Focus on the first viewport: STRNK / “Powerful software” on the left, muscular tree-stump mascot on the right.
- The studio camera views the front of the character. Fists face inward toward the trunk and must have correct anatomical handedness: viewer-left is the character's right hand. Thumb roots belong on the corresponding radial palm edge, starting near the wrist and wrapping across the curled fingers. Use a simple clenched mass and thumb, not detailed finger bars.
- Inspect `strnk-logo.svg` and the newly added `assets/strnk-concept.png` before further visual work. Preserve user reference files.
- The user specifically challenged insufficient visual review. Actually inspect solid front, low-angle, and side/elevated renders, then desktop/mobile wireframe screenshots. A successful script or closed mesh alone does not establish visual quality.

## Local tools

- Blender 5.2.1 has the **Blender Lab** MCP extension installed. Its local socket listens on `localhost:9876`. The external Python process speaks MCP to Codex and communicates with that socket.
- Codex’s configured bridge uses `uvx --python 3.11 --from "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp" blender-mcp`. Do not replace this with bare `uvx blender-mcp`, which selects a different project.
