
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
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [nickname, setNickname] = useState('');
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const currentModelRef = useRef(null);
  const mixerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const loaderRef = useRef(null);

  // Three.js 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1419);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, 320 / 420, 0.1, 1000);
    camera.position.set(0, 1, 2.5);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: false,
      antialias: true
    });
    renderer.setSize(320, 420);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // 조명 설정
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

    // GLTFLoader 초기화
    const loader = new GLTFLoader();
    loaderRef.current = loader;

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

  // 모델 로드 함수
  const loadModel = (characterFile) => {
    if (!sceneRef.current || !loaderRef.current) return;

    // 이전 모델 제거
    if (currentModelRef.current) {
      currentModelRef.current.traverse((object) => {
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
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }

    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }

    const gltfPath = `/resources/Ultimate Animated Character Pack - Nov 2019/glTF/${characterFile}.gltf`;

    loaderRef.current.load(
      gltfPath,
      (gltf) => {
        const model = gltf.scene;
        currentModelRef.current = model;
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

  // 선택된 캐릭터 변경 시 모델 로드
  useEffect(() => {
    if (selectedCharacter) {
      loadModel(selectedCharacter.file);
    } else {
      // 선택이 없으면 기존 모델 제거
      if (currentModelRef.current && sceneRef.current) {
        currentModelRef.current.traverse((object) => {
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
        sceneRef.current.remove(currentModelRef.current);
        currentModelRef.current = null;
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    }
  }, [selectedCharacter]);

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
      <div className="character-select-modal" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'row', width: '1000px', height: '650px', background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2a 50%, #0f1419 100%)', borderRadius: '24px', boxShadow: '0 20px 100px rgba(0,0,0,0.9)', padding: '32px', margin: 'auto', border: '2px solid #00d4ff' }}>
        {/* 좌측: 캐릭터 목록 */}
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', marginRight: '32px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid #00d4ff44', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.6rem', color: '#00ffff', fontWeight: 800, marginBottom: '20px', textShadow: '0 0 12px #00d4ff', textAlign: 'center' }}>캐릭터 선택</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {characters.map((char) => (
              <div
                key={char.file}
                onClick={() => setSelectedCharacter(char)}
                style={{
                  cursor: 'pointer',
                  background: selectedCharacter && selectedCharacter.file === char.file ? 'linear-gradient(135deg, #00d4ff33, #b300ff22)' : 'rgba(30,40,50,0.8)',
                  border: selectedCharacter && selectedCharacter.file === char.file ? '2px solid #00d4ff' : '1px solid #444',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: selectedCharacter && selectedCharacter.file === char.file ? '0 0 20px #00d4ff66' : 'none',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!selectedCharacter || selectedCharacter.file !== char.file) {
                    e.currentTarget.style.boxShadow = '0 0 16px #b300ff66';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = selectedCharacter && selectedCharacter.file === char.file ? '0 0 20px #00d4ff66' : 'none';
                }}
              >
                <img
                  src={`/resources/character/${char.file}.png`}
                  alt={char.name}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    objectFit: 'contain',
                    background: '#1a1f2a'
                  }}
                />
                <div style={{
                  fontSize: '1.1rem',
                  color: selectedCharacter && selectedCharacter.file === char.file ? '#00ffff' : '#ccc',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontFamily: 'Orbitron, sans-serif',
                  textShadow: selectedCharacter && selectedCharacter.file === char.file ? '0 0 8px #00d4ff' : 'none'
                }}>
                  {char.name}
                </div>
                {selectedCharacter && selectedCharacter.file === char.file && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '26px',
                    height: '26px',
                    background: '#00d4ff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    boxShadow: '0 0 12px #00d4ff'
                  }}>
                    ✔
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 3D 모델 미리보기 및 입력 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* 3D 모델 */}
          <div style={{ width: '100%', flex: '1', background: 'linear-gradient(145deg, #1a2a3a 0%, #0a1a2a 100%)', borderRadius: '16px', border: '2px solid #00d4ff', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(0,212,255,0.2)' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }}></canvas>
          </div>

          {/* 캐릭터 이름, 닉네임 입력, 버튼 */}
          <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '2rem', color: '#00ffff', fontWeight: 900, textShadow: '0 0 12px #00d4ff' }}>
              {selectedCharacter ? selectedCharacter.name : '캐릭터를 선택하세요'}
            </div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={12}
              style={{
                width: '100%',
                maxWidth: '320px',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '1.2rem',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #00d4ff',
                background: 'rgba(10,15,30,0.95)',
                color: '#00ffff',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 0 12px rgba(0,212,255,0.2)',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.target.style.boxShadow = '0 0 20px rgba(0,212,255,0.4)'}
              onBlur={e => e.target.style.boxShadow = '0 0 12px rgba(0,212,255,0.2)'}
            />
            <button
              onClick={handleSelect}
              style={{
                padding: '14px 36px',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#fff',
                background: 'linear-gradient(45deg, #ff2e2e, #b300ff)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                boxShadow: '0 0 24px #ff2e2ecc',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 32px #ff2e2ecc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 24px #ff2e2ecc';
              }}
            >
              입장
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .character-select-modal::-webkit-scrollbar {
          width: 8px;
        }
        .character-select-modal::-webkit-scrollbar-track {
          background: rgba(0, 212, 255, 0.05);
          border-radius: 10px;
        }
        .character-select-modal::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00d4ff, #b300ff);
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

export default CharacterSelectModal;
