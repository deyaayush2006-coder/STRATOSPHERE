# 3D models

Drop `.glb` / `.gltf` exports here and reference them from the dashboard, on a
project or on one of its parts, as `/models/<file>.glb`.

They do not go through the media library: that is built around images — it
reads their dimensions, makes thumbnails and filters on image content types —
and a binary CAD export fits none of it. Video paths already work the same way.

Two things worth doing before committing one:

- **Export as glTF binary (.glb), not .gltf + separate buffers.** A .gltf
  references its geometry as sibling files, and only the one path you typed in
  the dashboard is being served.
- **Keep it under about 10 MB.** The whole file downloads before anything can
  be drawn, and this is a club site people open on phones. Decimate the mesh in
  your CAD tool rather than shipping print-resolution geometry — the viewer is
  about 500px tall.
