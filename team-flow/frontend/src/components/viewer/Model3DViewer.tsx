'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Box,
  Grid3x3,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

interface Model3DViewerProps {
  url: string;
  format: 'glb' | 'gltf' | 'fbx' | 'obj' | 'stl';
  fileName?: string;
}

export function Model3DViewer({ url, format, fileName }: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    animationId: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, -5, -5);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    sceneRef.current = { scene, camera, renderer, controls, animationId: 0 };

    const animate = () => {
      if (!sceneRef.current) return;
      sceneRef.current.controls.update();
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        sceneRef.current = null;
      }
    };
  }, []);

  const loadModel = useCallback(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;
    setLoading(true);
    setError(null);

    const loaderMap: Record<string, any> = {
      glb: GLTFLoader,
      gltf: GLTFLoader,
      fbx: FBXLoader,
      obj: OBJLoader,
      stl: STLLoader,
    };

    const LoaderClass = loaderMap[format];
    if (!LoaderClass) {
      setError(`Formato não suportado: ${format}`);
      setLoading(false);
      return;
    }

    const loader = new LoaderClass();

    const handleLoad = (object: any) => {
      const existing = scene.getObjectByName('model');
      if (existing) scene.remove(existing);

      let model: THREE.Object3D;
      if (format === 'glb' || format === 'gltf') {
        model = object.scene;
      } else {
        model = object;
      }

      if (format === 'stl') {
        const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.3,
          roughness: 0.7,
        });
        if (model instanceof THREE.Mesh) {
          model.material = material;
        } else {
          model.traverse((child: any) => {
            if (child.isMesh) child.material = material;
          });
        }
      }

      model.name = 'model';
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 5 ? 5 / maxDim : 1;
      model.scale.set(scale, scale, scale);
      model.position.sub(center.clone().multiplyScalar(scale));

      scene.add(model);
      setLoading(false);
    };

    const handleError = (err: any) => {
      setError(`Erro ao carregar modelo: ${err.message || 'Erro desconhecido'}`);
      setLoading(false);
    };

    if (format === 'glb' || format === 'gltf') {
      loader.load(url, handleLoad, undefined, handleError);
    } else {
      loader.load(url, handleLoad, undefined, handleError);
    }
  }, [url, format]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    if (sceneRef.current) {
      loadModel();
    }
  }, [loadModel]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, controls } = sceneRef.current;
    const grid = scene.children.find((c) => c instanceof THREE.GridHelper);
    if (grid) grid.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const model = sceneRef.current.scene.getObjectByName('model');
    if (model) {
      model.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => (m.wireframe = wireframe));
          } else {
            child.material.wireframe = wireframe;
          }
        }
      });
    }
  }, [wireframe]);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 bg-gray-800 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4" />
          <span className="text-sm font-medium truncate max-w-[200px]">
            {fileName || url.split('/').pop()}
          </span>
          <span className="text-xs text-gray-400 uppercase">.{format}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded hover:bg-gray-700 ${autoRotate ? 'bg-blue-600' : ''}`}
            title="Rotação automática"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-1.5 rounded hover:bg-gray-700 ${wireframe ? 'bg-blue-600' : ''}`}
            title="Wireframe"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded hover:bg-gray-700 ${showGrid ? 'bg-blue-600' : ''}`}
            title="Grade"
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded hover:bg-gray-700"
            title="Tela cheia"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative bg-slate-800 min-h-[400px]"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              <span className="text-sm text-gray-300">Carregando modelo 3D...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <p className="text-gray-400 text-xs">Formato suportado: GLB, GLTF, FBX, OBJ, STL</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-2 bg-gray-800 text-gray-400 text-xs rounded-b-lg">
        <Monitor className="w-3 h-3" />
        <span>Arraste para girar | Scroll para zoom | Botão direito para mover</span>
      </div>
    </div>
  );
}
