// Generates the first arena (Scene JSON 1.1.0) and its placeholder asset library.
// Usage (from this package's folder): node Tools~/make-first-arena.cjs Runtime/Arenas
const fs = require('fs');
const path = require('path');
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });

const r = (n) => Math.round(n * 10000) / 10000;
// Unity yaw (degrees, left-handed) -> schema quaternion (right-handed: x and y flip sign).
const yawQ = (deg) => {
	const h = (deg * Math.PI) / 360;
	return { x: 0, y: r(-Math.sin(h)), z: 0, w: r(Math.cos(h)) };
};
// Unity position -> schema position (z flips).
const pos = (x, y, z) => ({ x: r(x), y: r(y), z: r(-z) });
const T = (p, q, s) => (s ? { position: p, rotation: q, scale: s } : { position: p, rotation: q });
const ident = { x: 0, y: 0, z: 0, w: 1 };

const objects = [];
const half = 20, wallHeight = 4;

objects.push({
	id: 'floor', name: 'Floor', type: 'FLOOR', parentId: null,
	// Floor's local -Z (schema) points up: +90 deg about x in schema terms.
	transform: T(pos(0, 0, 0), { x: 0.7071068, y: 0, z: 0, w: 0.7071068 }),
	boundary: [{ x: -half, y: -half }, { x: half, y: -half }, { x: half, y: half }, { x: -half, y: half }],
	metadata: { tags: ['surface:stone'] },
});

objects.push({ id: 'walls', name: 'Walls', type: 'GROUP', parentId: null, transform: T(pos(0, 0, 0), ident) });
const walls = [
	['wall-north', 0, half, 0],
	['wall-south', 0, -half, 180],
	['wall-east', half, 0, 90],
	['wall-west', -half, 0, -90],
];
for (const [id, x, z, yaw] of walls) {
	objects.push({
		id, name: id, type: 'WALL_FACE', parentId: 'walls',
		transform: T(pos(x, 0, z), yawQ(yaw)),
		boundary: [{ x: -half, y: 0 }, { x: half, y: 0 }, { x: half, y: wallHeight }, { x: -half, y: wallHeight }],
		metadata: { tags: ['surface:stone'] },
	});
}

objects.push({ id: 'cover', name: 'Cover', type: 'GROUP', parentId: null, transform: T(pos(0, 0, 0), ident) });
const box = (w, h, d) => ({ min: { x: r(-w / 2), y: 0, z: r(-d / 2) }, max: { x: r(w / 2), y: r(h), z: r(d / 2) } });

objects.push({
	id: 'platform', name: 'Central platform', type: 'PROP', parentId: 'cover',
	transform: T(pos(0, 0, 0), ident), volume: box(6, 1.2, 6), asset: 'arena/platform',
	metadata: { tags: ['surface:stone'] },
});

const pillars = [[-8, -8], [8, -8], [-8, 8], [8, 8], [0, -13], [0, 13], [-13, 0], [13, 0]];
pillars.forEach(([x, z], i) => objects.push({
	id: `pillar-${i + 1}`, name: 'Pillar', type: 'PROP', parentId: 'cover',
	transform: T(pos(x, 0, z), yawQ(45)), volume: box(1.2, 4, 1.2), asset: 'arena/pillar',
	metadata: { tags: ['surface:stone'] },
}));

const crates = [[-4, 9, 10], [5, -10, -20], [-11, -4, 30], [12, 5, 0], [-6, -14, 15], [9, 14, -10]];
crates.forEach(([x, z, yaw], i) => objects.push({
	id: `crate-${i + 1}`, name: 'Crate', type: 'PROP', parentId: 'cover',
	transform: T(pos(x, 0, z), yawQ(yaw)), volume: box(1.2, 1.2, 1.2), asset: 'arena/crate',
	metadata: { tags: ['surface:wood'] },
}));

[[0, -7, 0], [0, 7, 0]].forEach(([x, z, yaw], i) => objects.push({
	id: `low-wall-${i + 1}`, name: 'Low wall', type: 'PROP', parentId: 'cover',
	transform: T(pos(x, 0, z), yawQ(yaw)), volume: box(3, 1, 0.6), asset: 'arena/low-wall',
	metadata: { tags: ['surface:stone'] },
}));
[[-15, 10], [15, -10]].forEach(([x, z], i) => objects.push({
	id: `broken-pillar-${i + 1}`, name: 'Broken pillar', type: 'PROP', parentId: 'cover',
	transform: T(pos(x, 0, z), yawQ(15)), volume: box(1.2, 2.2, 1.2), asset: 'arena/broken-pillar',
	metadata: { tags: ['surface:stone'] },
}));

objects.push({ id: 'spawns', name: 'Spawns', type: 'GROUP', parentId: null, transform: T(pos(0, 0, 0), ident) });
for (let i = 0; i < 8; i++) {
	const angle = (i / 8) * 2 * Math.PI;
	const x = Math.sin(angle) * 16, z = Math.cos(angle) * 16;
	// Face the centre: Unity yaw of the direction (-x, -z).
	const yaw = (Math.atan2(-x, -z) * 180) / Math.PI;
	objects.push({
		id: `spawn-${i + 1}`, name: `Spawn ${i + 1}`, type: 'MARKER', parentId: 'spawns',
		transform: T(pos(x, 0.05, z), yawQ(yaw)),
		metadata: { tags: ['spawn'] },
		asset: 'arena/spawn-circle',
	});
}

// Corner braziers (fire and light come later; the model has a "flame" node for them).
objects.push({ id: 'decor', name: 'Decor', type: 'GROUP', parentId: null, transform: T(pos(0, 0, 0), ident) });
[[-17, -17], [17, -17], [-17, 17], [17, 17]].forEach(([x, z], i) => objects.push({
	id: `brazier-${i + 1}`, name: 'Brazier', type: 'PROP', parentId: 'decor',
	transform: T(pos(x, 0, z), ident), volume: box(0.8, 1.4, 0.8), asset: 'arena/brazier',
	metadata: { tags: ['surface:metal'] },
}));

// A banner on each wall, hung 0.6 m up, its front facing into the arena.
[['north', 0, half - 0.25, 180], ['south', 0, -half + 0.25, 0], ['east', half - 0.25, 0, -90], ['west', -half + 0.25, 0, 90]].forEach(([side, x, z, yaw]) => objects.push({
	id: `banner-${side}`, name: 'Banner', type: 'PROP', parentId: 'decor',
	transform: T(pos(x, 0.6, z), yawQ(yaw)), asset: 'arena/banner',
}));

// Rubble is decoration: no volume, so nothing to bump into.
[[-18, -10, 20], [17, 12, -35]].forEach(([x, z, yaw], i) => objects.push({
	id: `rubble-${i + 1}`, name: 'Rubble', type: 'PROP', parentId: 'decor',
	transform: T(pos(x, 0, z), yawQ(yaw)), asset: 'arena/rubble',
}));

const scene = {
	schemaVersion: '1.1.0',
	sceneId: 'first-arena',
	createdAt: '2026-10-14T00:00:00Z',
	updatedAt: '2026-10-14T00:00:00Z',
	units: 'meters',
	coordinateSystem: 'right-handed-y-up',
	origin: T(pos(0, 0, 0), ident),
	objects,
	metadata: { tags: ['arena', 'temnorid-arena'], properties: { title: 'First arena', game: 'temnorid-arena' } },
};
fs.writeFileSync(path.join(out, 'first-arena.scene.json'), JSON.stringify(scene, null, 2) + '\n');

const library = {
	schemaVersion: '1.0.0',
	libraryId: 'temnorid-arena-props',
	units: 'meters',
	assets: [
		{ id: 'arena/platform', name: 'Central platform', kind: 'model', bounds: box(6, 1.2, 6), placeholder: { shape: 'box', color: { r: 0.42, g: 0.4, b: 0.38 } } },
		{ id: 'arena/pillar', name: 'Pillar', kind: 'model', bounds: box(1.2, 4, 1.2), placeholder: { shape: 'box', color: { r: 0.55, g: 0.52, b: 0.48 } } },
		{ id: 'arena/crate', name: 'Crate', kind: 'model', bounds: box(1.2, 1.2, 1.2), placeholder: { shape: 'box', color: { r: 0.55, g: 0.36, b: 0.2 } } },
		{ id: 'arena/low-wall', name: 'Low wall', kind: 'model', bounds: box(3, 1, 0.6), placeholder: { shape: 'box', color: { r: 0.55, g: 0.52, b: 0.48 } } },
		{ id: 'arena/broken-pillar', name: 'Broken pillar', kind: 'model', bounds: box(1.2, 2.2, 1.2), placeholder: { shape: 'box', color: { r: 0.55, g: 0.52, b: 0.48 } } },
		{ id: 'arena/rubble', name: 'Rubble', kind: 'model', bounds: box(2, 0.5, 1.5), placeholder: { shape: 'box', color: { r: 0.5, g: 0.47, b: 0.43 } } },
		{ id: 'arena/brazier', name: 'Brazier', kind: 'model', bounds: box(0.8, 1.4, 0.8), placeholder: { shape: 'capsule', color: { r: 0.25, g: 0.22, b: 0.2 } } },
		{ id: 'arena/banner', name: 'Banner', kind: 'model', bounds: { min: { x: -0.6, y: 0, z: -0.15 }, max: { x: 0.6, y: 3, z: 0.15 } }, placeholder: { shape: 'box', color: { r: 0.3, g: 0.12, b: 0.15 } } },
		{ id: 'arena/spawn-circle', name: 'Spawn circle', kind: 'model', bounds: { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 0.02, z: 1 } }, placeholder: { shape: 'box', color: { r: 0.4, g: 0.6, b: 0.9 } } },
	],
};
fs.writeFileSync(path.join(out, 'arena-props.library.json'), JSON.stringify(library, null, 2) + '\n');
console.log('objects', objects.length);
