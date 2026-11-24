// The colour of each family of Unity classes, the same everywhere in the interface.

const FAMILIES: [string, readonly string[]][] = [
  ["texture", ["Texture2D", "Texture3D", "Texture2DArray", "Cubemap", "Sprite", "SpriteAtlas"]],
  [
    "mesh",
    ["Mesh", "MeshFilter", "MeshRenderer", "SkinnedMeshRenderer", "Avatar", "ParticleSystem"],
  ],
  ["material", ["Material", "Shader"]],
  [
    "animation",
    ["AnimationClip", "Animator", "AnimatorController", "AnimatorOverrideController", "Animation"],
  ],
  ["script", ["MonoBehaviour", "MonoScript"]],
  ["scene", ["GameObject", "Transform", "RectTransform"]],
  ["media", ["TextAsset", "AudioClip", "Font", "VideoClip"]],
];

const family = new Map(FAMILIES.flatMap(([name, classes]) => classes.map((c) => [c, name])));

/** The CSS colour of a class, from the theme's class palette. */
export function classColor(name: string): string {
  return `var(--class-${family.get(name) ?? "other"})`;
}
