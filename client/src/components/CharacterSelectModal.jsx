import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './CharacterSelectModal.css';

const characters = [
  { name: '용병', file: 'BlueSoldier_Female' },
  { name: '학생', file: 'Casual_Male' },
  { name: '래퍼', file: 'Casual2_Female' },
  { name: '백수', file: 'Casual3_Female' },
  { name: '요리사', file: 'Chef_Hat' },
  { name: '총잡이', file: 'Cowboy_Female' },
  { name: '의사', file: 'Doctor_Female_Young' },
  { name: '고블린', file: 'Goblin_Female' },
  { name: '대머리 고블린', file: 'Goblin_Male' },
  { name: '관장', file: 'Kimono_Female' },
  { name: '황금기사', file: 'Knight_Golden_Male' },
  { name: '흑기사', file: 'Knight_Male' },
  { name: '닌자', file: 'Ninja_Male' },
  { name: '사막닌자', file: 'Ninja_Sand' },
  { name: '폭주족', file: 'Viking_Male' },
  { name: '신사', file: 'OldClassy_Male' },
  { name: '해적', file: 'Pirate_Male' },
  { name: '개', file: 'Pug' },
  { name: '군인', file: 'Soldier_Male' },
  { name: '마법사', file: 'Elf' },
  { name: '킹스맨', file: 'Suit_Male' },
  { name: '바이킹', file: 'VikingHelmet' },
  { name: '대마법사', file: 'Wizard' },
  { name: '노동자', file: 'Worker_Female' },
  { name: '좀비', file: 'Zombie_Male' },
  { name: '소', file: 'Cow' },
];

function CharacterSelectModal({ onClose, onSelect }) {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [nickname, setNickname] = useState('');
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.js 씬 설정
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, 320 / 420, 0.1, 1000);
    camera.position.set(0, 1, 2.5);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true
    });
    renderer.setSize(320, 420);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 1, 2);
    scene.add(frontLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

    // 애니메이션 루프
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (mixerRef.current) mixerRef.current.update(0.016);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    loadCharacterModel(selectedCharacter.file);
  }, [selectedCharacter]);

  const loadCharacterModel = (characterFile) => {
    if (!sceneRef.current) return;

    // 이전 모델 제거
    if (modelRef.current) {
      modelRef.current.traverse((object) => {
        if (object.isMesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }

    // 새 모델 로드
    const loader = new GLTFLoader();
    const gltfPath = `/resources/Ultimate Animated Character Pack - Nov 2019/glTF/${characterFile}.gltf`;
    
    loader.load(
      gltfPath,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        sceneRef.current.add(model);

        // 모델 크기 및 위치 조정
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.scale.set(3.0 / size, 3.0 / size, 3.0 / size);
        model.position.y = -1.25;

        // 애니메이션
        if (gltf.animations && gltf.animations.length) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const victoryAnim = gltf.animations.find(anim => 
            anim.name.toLowerCase().includes('victory')
          );
          if (victoryAnim) {
            const action = mixerRef.current.clipAction(victoryAnim);
            action.play();
          }
        }
      },
      undefined,
      (error) => {
        console.error('GLTF 로드 오류:', error);
      }
    );
  };

  const handleSelect = () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    onSelect({
      character: selectedCharacter.file,
      nickname: nickname.trim(),
    });
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="character-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="character-grid-panel">
          <div className="character-grid">
            {characters.map((char) => (
              <div
                key={char.file}
                className={`character-card ${selectedCharacter.file === char.file ? 'selected' : ''}`}
                onClick={() => setSelectedCharacter(char)}
              >
                <img
                  src={`/resources/character/${char.file}.png`}
                  alt={char.name}
                />
                <div className="character-name">{char.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="character-preview-panel">
          <div className="preview-canvas-container">
            {/* 선택된 캐릭터만 3D로 미리보기 (이미지 겹침 제거) */}
            <canvas ref={canvasRef}></canvas>
          </div>
          <h3 className="preview-character-name">{selectedCharacter.name}</h3>
          <input
            type="text"
            className="input-field nickname-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={12}
          />
          <button className="btn-primary enter-btn" onClick={handleSelect}>
            입장
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterSelectModal;
