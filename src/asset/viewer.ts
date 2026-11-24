// A GLB model in a canvas: orbiting, framed to fit, with its skeleton, a wireframe and its
// animations on request. three.js is imperative, so this stays a class the component drives.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** The bytes of a file a model names by a path relative to itself, if there is one. */
export type FileOf = (path: string) => Promise<Uint8Array | undefined>;

export class Viewer {
  readonly #renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  readonly #scene = new THREE.Scene();
  readonly #camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
  readonly #controls: OrbitControls;
  readonly #timer = new THREE.Timer();
  readonly #resize: ResizeObserver;
  #model?: THREE.Object3D;
  #skeleton?: THREE.SkeletonHelper;
  #mixer?: THREE.AnimationMixer;
  #clips: THREE.AnimationClip[] = [];

  constructor(host: HTMLElement) {
    this.#renderer.setPixelRatio(window.devicePixelRatio);
    host.append(this.#renderer.domElement);
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(2, 4, 3);
    this.#scene.add(sun);
    this.#resize = new ResizeObserver(() => this.#fitCanvas(host));
    this.#resize.observe(host);
    this.#renderer.setAnimationLoop((time) => this.#frame(time));
  }

  /**
   * Shows the model `bytes` holds, with the images it names read through `fileOf`, and returns
   * the names of its animations.
   */
  async load(bytes: Uint8Array, fileOf: FileOf): Promise<string[]> {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const images = await imageUrls(buffer as ArrayBuffer, fileOf);
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => images.get(url) ?? url);
    const gltf = await new GLTFLoader(manager).parseAsync(buffer as ArrayBuffer, "");
    for (const url of images.values()) URL.revokeObjectURL(url);
    withoutVertexColors(gltf.scene);
    this.#model = gltf.scene;
    this.#scene.add(gltf.scene);
    this.#skeleton = new THREE.SkeletonHelper(gltf.scene);
    this.#skeleton.visible = false;
    this.#scene.add(this.#skeleton);
    this.#mixer = new THREE.AnimationMixer(gltf.scene);
    this.#clips = gltf.animations;
    this.#frameModel(gltf.scene);
    return gltf.animations.map((clip, i) => clip.name || `#${i + 1}`);
  }

  showSkeleton(shown: boolean) {
    if (this.#skeleton) this.#skeleton.visible = shown;
  }

  showWireframe(shown: boolean) {
    this.#model?.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const materials: THREE.Material[] = [node.material].flat();
      for (const material of materials) {
        if ("wireframe" in material) material.wireframe = shown;
      }
    });
  }

  /** Plays the animation at `index`, or none when it is negative. */
  play(index: number) {
    this.#mixer?.stopAllAction();
    const clip = this.#clips[index];
    if (clip) this.#mixer?.clipAction(clip).play();
  }

  dispose() {
    this.#renderer.setAnimationLoop(null);
    this.#resize.disconnect();
    this.#controls.dispose();
    this.#model?.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        for (const material of [node.material].flat()) material.dispose();
      }
    });
    this.#renderer.dispose();
    this.#renderer.domElement.remove();
  }

  /** Puts the camera where the whole of `model` is in view. */
  #frameModel(model: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length() || 1;
    const distance = size / (2 * Math.tan(THREE.MathUtils.degToRad(this.#camera.fov) / 2));
    this.#camera.near = size / 100;
    this.#camera.far = size * 100;
    this.#camera.position.copy(center).add(new THREE.Vector3(0, size * 0.1, distance));
    this.#camera.updateProjectionMatrix();
    this.#controls.target.copy(center);
    this.#controls.update();
  }

  #fitCanvas(host: HTMLElement) {
    const { clientWidth: width, clientHeight: height } = host;
    if (width === 0 || height === 0) return;
    this.#renderer.setSize(width, height);
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
  }

  #frame(time: number) {
    this.#timer.update(time);
    this.#mixer?.update(this.#timer.getDelta());
    this.#controls.update();
    this.#renderer.render(this.#scene, this.#camera);
  }
}

/** An object URL for each image the GLB file in `buffer` names by path, by that path. */
async function imageUrls(buffer: ArrayBuffer, fileOf: FileOf): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  for (const path of imagePaths(buffer)) {
    const bytes = await fileOf(path);
    if (bytes) urls.set(path, URL.createObjectURL(new Blob([bytes as BlobPart])));
  }
  return urls;
}

/** The paths of the images a GLB file names, read from its JSON chunk, the first after the header. */
function imagePaths(buffer: ArrayBuffer): string[] {
  const length = new DataView(buffer).getUint32(12, true);
  const json: { images?: { uri?: string }[] } = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 20, length)),
  );
  return (json.images ?? []).flatMap((image) => (image.uri ? [image.uri] : []));
}

/**
 * Draws the meshes of `scene` without their vertex colours. Game shaders keep other data in them,
 * such as outline widths, so tinting the base colour with them, as glTF says, miscolours a model.
 */
function withoutVertexColors(scene: THREE.Object3D) {
  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    for (const material of [node.material].flat()) material.vertexColors = false;
  });
}
