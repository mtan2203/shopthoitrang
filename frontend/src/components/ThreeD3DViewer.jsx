import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeD3DViewer = ({ 
  modelUrl, 
  selectedColor = '#ffffff',
  onColorChange,
  width = "100%",
  height = 500 
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actualWidth, setActualWidth] = useState(500);

  // Danh sách màu sắc có sẵn
  const availableColors = [
    { name: 'Trắng', value: '#ffffff' },
    { name: 'Đen', value: '#000000' },
    { name: 'Đỏ', value: '#ff0000' },
    { name: 'Xanh dương', value: '#0000ff' },
    { name: 'Xanh lá', value: '#00ff00' },
    { name: 'Vàng', value: '#ffff00' },
    { name: 'Tím', value: '#800080' },
    { name: 'Hồng', value: '#ffc0cb' },
    { name: 'Cam', value: '#ffa500' },
    { name: 'Xám', value: '#808080' },
    { name: 'Nâu', value: '#8b4513' },
    { name: 'Xanh navy', value: '#000080' },
    { name: 'Xanh mint', value: '#98fb98' },
    { name: 'Vàng gold', value: '#ffd700' },
    { name: 'Bạc', value: '#c0c0c0' },
    { name: 'Đỏ đậm', value: '#8b0000' }
  ];

  // Tính toán width thực tế
  useEffect(() => {
    if (width === "100%" && mountRef.current) {
      const handleResize = () => {
        if (mountRef.current) {
          setActualWidth(mountRef.current.offsetWidth);
        }
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      setActualWidth(parseInt(width) || 500);
    }
  }, [width]);

  useEffect(() => {
    if (!modelUrl || !actualWidth) return;

    // Khởi tạo Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Khởi tạo camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      actualWidth / height, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 5);

    // Khởi tạo renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(actualWidth, height);
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Thêm renderer vào DOM
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Thêm ánh sáng
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(-1, 1, 1);
    scene.add(pointLight);

    // Khởi tạo controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Load FBX model
    const loader = new FBXLoader();
    loader.load(
      modelUrl,
      (object) => {
        setLoading(false);
        
        // Scale và position model
        object.scale.setScalar(0.01);
        object.position.set(0, -1, 0);
        
        // Thêm shadows
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Tạo material mới có thể thay đổi màu
            child.material = new THREE.MeshLambertMaterial({
              color: selectedColor
            });
          }
        });

        scene.add(object);
        modelRef.current = object;
        
        // Fit model vào camera view
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        camera.position.set(center.x, center.y, center.z + cameraZ * 1.5);
        camera.lookAt(center);
        controls.target.copy(center);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading FBX:', error);
        setError('Không thể tải model 3D');
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl, actualWidth, height]);

  // Cập nhật màu sắc khi selectedColor thay đổi
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.setHex(selectedColor.replace('#', '0x'));
        }
      });
    }
  }, [selectedColor]);

  const handleColorChange = (color) => {
    if (onColorChange) {
      onColorChange(color);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Vui lòng kiểm tra file 3D</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 3D Viewer Container */}
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải model 3D...</p>
            </div>
          </div>
        )}
        <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden" style={{ height }} />
      </div>

      {/* Color Picker */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Chọn màu sắc</h3>
        
        {/* Màu sắc có sẵn - Hình tròn nhỏ xinh */}
        <div className="grid grid-cols-8 gap-3 mb-6">
          {availableColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-300 hover:scale-125 hover:shadow-lg ${
                selectedColor === color.value 
                  ? 'border-gray-800 shadow-lg ring-2 ring-blue-400 ring-offset-2' 
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {selectedColor === color.value && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom color picker - Gọn gàng hơn */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Màu tùy chỉnh</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                style={{ 
                  WebkitAppearance: 'none',
                  border: 'none',
                  borderRadius: '50%',
                  overflow: 'hidden'
                }}
              />
              <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-gray-300 pointer-events-none"></div>
            </div>
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#ffffff"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeD3DViewer;