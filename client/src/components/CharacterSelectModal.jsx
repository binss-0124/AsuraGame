
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
        model.scale.set(2.3 / size, 2.3 / size, 2.3 / size);
        model.position.y = -1.95;

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
    if (!selectedCharacter) {
      alert('캐릭터를 선택해주세요.');
      return;
    }
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
      <div className="character-select-modal" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'row', width: '1600px', height: '650px', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1f3a 50%, #0f2a50 100%)', borderRadius: '0px', boxShadow: '0 0 40px rgba(0, 150, 255, 0.3), 0 0 80px rgba(100, 50, 200, 0.2)', padding: '32px', margin: 'auto', border: '4px solid #0099ff', position: 'relative', overflow: 'hidden' }}>
        {/* 스캔라인 효과 */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, rgba(0, 150, 255, 0.02) 0px, rgba(0, 150, 255, 0.02) 2px, transparent 2px, transparent 4px)', pointerEvents: 'none' }}></div>
        
        {/* 좌측: 캐릭터 목록 */}
        <div style={{ flex: '0 0 700px', display: 'flex', flexDirection: 'column', marginRight: '32px', background: 'linear-gradient(135deg, #0f1a2a 0%, #1a2a4a 50%, #0f2a50 100%)', borderRadius: '0px', border: '3px solid #00ff88', padding: '24px 16px', overflowY: 'auto', maxHeight: '570px', position: 'relative', zIndex: 1, boxShadow: '0 0 20px rgba(0, 255, 136, 0.2) inset' }}>
          <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '1.8rem', color: '#00ffff', fontWeight: 900, marginBottom: '20px', textShadow: '0 0 10px rgba(0, 255, 255, 0.9), 0 0 20px rgba(0, 150, 255, 0.6)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>캐릭터 선택</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '18px' }}>
            {characters.map((char) => (
              <div
                key={char.file}
                onClick={() => setSelectedCharacter(char)}
                style={{
                  cursor: 'pointer',
                  background: selectedCharacter && selectedCharacter.file === char.file ? 'linear-gradient(145deg, rgba(0, 255, 136, 0.15), rgba(0, 150, 255, 0.1))' : 'linear-gradient(145deg, #0f1a2a 0%, #1a2a4a 50%, #0f2a50 100%)',
                  border: selectedCharacter && selectedCharacter.file === char.file ? '3px solid #00ff88' : '3px solid #0099ff',
                  borderRadius: '2px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  boxShadow: selectedCharacter && selectedCharacter.file === char.file ? '0 0 30px rgba(0, 255, 136, 0.7), 0 0 50px rgba(0, 150, 255, 0.5), inset 0 0 20px rgba(0, 255, 136, 0.15)' : '0 0 15px rgba(0, 150, 255, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.8)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  if (!selectedCharacter || selectedCharacter.file !== char.file) {
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 136, 0.7), inset 0 0 15px rgba(0, 255, 136, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.15) translateY(-8px) skewY(-2deg)';
                    e.currentTarget.style.borderColor = '#00ff88';
                  }
                }}
                onMouseLeave={e => {
                  if (!selectedCharacter || selectedCharacter.file !== char.file) {
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.8)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#0099ff';
                  }
                }}
              >
                <img
                  src={`/resources/character/${char.file}.png`}
                  alt={char.name}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '0px',
                    marginBottom: '8px',
                    objectFit: 'contain',
                    background: '#0a0a0a',
                    border: '2px solid rgba(0, 150, 255, 0.5)',
                    boxShadow: '0 4px 15px rgba(0, 150, 255, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.8)',
                    filter: 'brightness(1.1) contrast(1.2)'
                  }}
                />
                <div style={{
                  fontSize: '1rem',
                  color: selectedCharacter && selectedCharacter.file === char.file ? '#00ff88' : '#ccc',
                  fontWeight: 900,
                  textAlign: 'center',
                  fontFamily: 'Arial Black, sans-serif',
                  textShadow: selectedCharacter && selectedCharacter.file === char.file ? '0 0 8px rgba(0, 255, 136, 0.8), 0 0 3px rgba(0, 150, 255, 0.6)' : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
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
                    background: '#00ff88',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f2a50',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    boxShadow: '0 0 15px rgba(0, 255, 136, 0.9)'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 3D 모델 미리보기 및 입력 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {/* 3D 모델 */}
          <div style={{ width: '100%', flex: '1', background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 50, 80, 0.8) 50%, rgba(20, 20, 20, 0.8) 100%)', borderRadius: '0px', border: '3px solid #ff4400', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.9)', position: 'relative', overflow: 'hidden' }}>
            {/* 캔버스 스캔라인 */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, rgba(255, 0, 0, 0.02) 0px, rgba(255, 0, 0, 0.02) 1px, transparent 1px, transparent 2px)', pointerEvents: 'none', zIndex: 2 }}></div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '0px', filter: 'brightness(1.15) contrast(1.1)' }}></canvas>
          </div>

          {/* 캐릭터 이름, 닉네임 입력 */}
          <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '2.2rem', color: '#00ffff', fontWeight: 900, textShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 150, 255, 0.9), 0 0 30px rgba(0, 150, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                fontFamily: 'Arial Black, sans-serif',
                fontSize: '1.1rem',
                padding: '12px 16px',
                borderRadius: '2px',
                border: '2px solid #0099ff',
                background: 'rgba(20, 30, 50, 0.95)',
                color: '#00ffff',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 0 15px rgba(0, 150, 255, 0.5)',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onFocus={e => e.target.style.boxShadow = '0 0 25px rgba(0, 150, 255, 0.8), inset 0 0 10px rgba(0, 255, 136, 0.3)'}
              onBlur={e => e.target.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.5)'}
            />
          </div>

          {/* 입장 버튼 - 우측 하단 */}
          <button
            onClick={handleSelect}
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              padding: '14px 28px',
              fontFamily: 'Arial Black, sans-serif',
              fontSize: '1.3rem',
              fontWeight: 900,
              color: '#0f2a50',
              background: 'linear-gradient(145deg, #00ff88, #00ffff)',
              border: '3px solid #00ff88',
              borderRadius: '2px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.8), inset 0 0 10px rgba(0, 255, 255, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              zIndex: 2
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.12) skewY(-2deg)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 255, 136, 1), 0 0 60px rgba(0, 150, 255, 0.8), inset 0 0 15px rgba(0, 255, 255, 0.4)';
              e.currentTarget.style.background = 'linear-gradient(145deg, #00ffff, #00ff88)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.8), inset 0 0 10px rgba(0, 255, 255, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(145deg, #00ff88, #00ffff)';
            }}
          >
            입장
          </button>
        </div>
      </div>
      <style>{`
        .character-select-modal::-webkit-scrollbar {
          width: 8px;
        }
        .character-select-modal::-webkit-scrollbar-track {
          background: rgba(0, 150, 255, 0.1);
          border-radius: 0px;
        }
        .character-select-modal::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00ff88, #00ffff);
          border-radius: 0px;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
        }
      `}</style>
    </div>
  );
}

export default CharacterSelectModal;
