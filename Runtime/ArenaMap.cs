using System.Collections.Generic;
using ITKamianets.Engine.Assets;
using ITKamianets.Engine.Assets.Model;
using ITKamianets.Engine.Core;
using ITKamianets.Engine.Scene;
using Temnorid.Arena.Core;
using UnityEngine;

namespace Temnorid.Arena.Maps
{
    /// <summary>
    /// Loads an arena from Scene JSON when the scene starts: floor, walls and cover, with props
    /// from the arena's asset library, and its <c>spawn</c> markers as the match's spawn points
    /// (<see cref="IArenaSpawns"/>, registered in <c>EngineServices</c>). The server and every
    /// client load the same file locally, so they always agree on the map.
    /// </summary>
    public class ArenaMap : MonoBehaviour, IArenaSpawns
    {
        [Tooltip("The arena (3d-scene-schema JSON).")]
        [SerializeField] private TextAsset arena;

        [Tooltip("Asset libraries (3d-asset-schema JSON) for the arena's props.")]
        [SerializeField] private TextAsset[] assetLibraries = new TextAsset[0];

        [Tooltip("Floors and walls. Empty: a plain lit material.")]
        [SerializeField] private Material surfaceMaterial;

        private readonly List<Pose> _spawns = new List<Pose>();

        public LoadedScene Loaded { get; private set; }

        public IReadOnlyList<Pose> SpawnPoints => _spawns;

        private void Awake()
        {
            if (arena != null)
            {
                Load(arena.text);
            }
        }

        private void OnDestroy()
        {
            if (EngineServices.TryGet<IArenaSpawns>(out var current) && ReferenceEquals(current, this))
            {
                EngineServices.Remove<IArenaSpawns>();
            }
        }

        /// <summary>Loads an arena, replacing the one shown now.</summary>
        public LoadedScene Load(string sceneJson)
        {
            if (Loaded != null)
            {
                Destroy(Loaded.gameObject);
            }

            var assets = EngineAssets.Default;
            foreach (var library in assetLibraries)
            {
                if (library != null)
                {
                    assets.AddLibrary(AssetJson.Deserialize(library.text), null);
                }
            }

            if (surfaceMaterial == null)
            {
                var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
                surfaceMaterial = new Material(shader) { name = "Arena surface", color = new Color(0.62f, 0.6f, 0.56f) };
                surfaceMaterial.SetColor("_BaseColor", surfaceMaterial.color);
            }

            Loaded = SceneLoader.Load(sceneJson, transform, new SceneLoadOptions
            {
                SurfaceMaterial = surfaceMaterial,
                AssetResolver = assets,
            });

            _spawns.Clear();
            foreach (var spawn in Loaded.FindByTag("spawn"))
            {
                _spawns.Add(new Pose(spawn.transform.position, spawn.transform.rotation));
            }

            EngineServices.Set<IArenaSpawns>(this);
            EngineLog.Info("Arena", $"Arena '{Loaded.SceneId}': {Loaded.Objects.Length} objects, {_spawns.Count} spawn points.");
            return Loaded;
        }
    }
}
