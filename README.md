# Temnorid Arena: Maps

`temnorid-arena-maps` is the Temnorid Arena arenas stored as Scene JSON, with spawns and objective sites.

It is a game package: it holds Temnorid Arena's own rules and content, built on the **IT-Kamianets 3D Engine** packages.

### Logic

An arena is a level, so it is data, not code: a `3d-scene-schema` document loaded through `3d-unity-scene`, with its models loaded by id through `3d-unity-assets`.

This package adds what the match needs from a map: team spawn points, objective sites, buy zones, and bounds, read by `temnorid-arena-core`. The server and clients load the same Scene JSON, so they always agree on the map.

### Status

Version 0.1.

* `ArenaMap`: loads an arena (Scene JSON TextAsset) with its prop libraries through `3d-unity-scene` and `3d-unity-assets`, registers its `spawn` markers as `IArenaSpawns`.
* **First arena** (`Runtime/Arenas/first-arena.scene.json`, generated, schema 1.1.0): a 40 × 40 m stone floor, four 4 m walls, a central platform, 8 pillars and 6 crates for cover (`surface:stone` / `surface:wood` tags for footsteps), and 8 spawn points facing the centre. Props are placeholder-only assets (`arena-props.library.json`) until models exist.

Checked: both files validate against their schemas; in Play mode the arena loads with 31 objects and 8 spawn points.

### Roadmap

* Arena Scene JSON format (spawns, sites, buy zones)
* Loading an arena
* First arena
* Map selection and rotation
* Map preview images
