declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, Vector3 } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement: HTMLElement);
    enabled: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    update(): void;
    dispose(): void;
    target: Vector3;
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, Group, AnimationClip } from 'three';
  export class GLTFLoader extends Loader {
    load(url: string, onLoad: (gltf: { scene: Group; animations: AnimationClip[] }) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  }
}

declare module 'three/examples/jsm/loaders/FBXLoader' {
  import { Loader, Group } from 'three';
  export class FBXLoader extends Loader {
    load(url: string, onLoad: (object: Group) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  }
}

declare module 'three/examples/jsm/loaders/OBJLoader' {
  import { Loader, Group } from 'three';
  export class OBJLoader extends Loader {
    load(url: string, onLoad: (object: Group) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  }
}

declare module 'three/examples/jsm/loaders/STLLoader' {
  import { Loader, BufferGeometry } from 'three';
  export class STLLoader extends Loader {
    load(url: string, onLoad: (geometry: BufferGeometry) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  }
}
