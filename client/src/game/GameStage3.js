import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { Ball } from './Ball.js';
import { UI } from '../utils/ui.js';
import { player } from '../utils/player.js';

export class GameStage3 {
  constructor(socket, players, map, spawnedWeapons, onGameEnd) {
    this.socket = socket;
    this.players = {};
    this.localPlayerId = socket.id;
    this.playerInfo = players;
    this.map = map;
    this.onGameEnd = onGameEnd;

    this.ui = new UI({ 
      onBackToLobbyClick: () => {
        if (this.onGameEnd) {
          this.onGameEnd();
        }
      }
    });

    this.Initialize();
    this.gameSpeedMultiplier = 1;
    this.ballSpeedIncreaseInterval = 10;
    this.ballSpeedIncrement = 2;
    this.timeSinceLastBallSpeedIncrease = 0;
    this.currentBallSpeedIncrease = 0;
    this.RAF();
  }

  Initialize() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.gammaFactor = 2.2;

    const container = document.getElementById('container');
    if (!container) {
      console.error('Container element with id "container" not found.');
      return;
    }
    container.appendChild(this.renderer.domElement);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 2000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(-8, 6, 12);
    this.camera.lookAt(0, 2, 0);

    this.scene = new THREE.Scene();
    this.collidables_ = [];
    this.rimCollidables_ = [];
    this.holes_ = [];
    this.balls_ = [];
    this.ballBodies_ = []; // 물리 바디 저장
    this.boundingBodies_ = []; // 바운딩 박스 바디
    this.playerBody_ = null; // 플레이어 물리 바디
    this.isFalling = false;
    this.rimBoxHelpers_ = []; // rim 바운딩 박스 헬퍼
    this.holeBoxHelpers_ = []; // 홀 바운딩 박스 헬퍼

    // 물리 월드 초기화
    this.InitializePhysicsWorld();

    this.holeColors_ = {
      1: 0xFFFFFF, 2: 0xFFFFFF, 3: 0xFFFFFF,
      4: 0xFFFFFF, 5: 0xFFFFFF, 6: 0xFFFFFF
    };
    this.holeHeightAdjustment_ = 0.45;

    this.ballColors_ = {
      1: 0xfefe48, 2: 0x39a8fe, 3: 0xFF0000,
      4: 0x020202, 5: 0xee6e06, 6: 0xa6fe48,
    };

    this.holeCylinderWidthMultiplier_ = 1.1;
    this.boxLengthMultiplier_ = 1.1;

    this.tableBoundaryMinX = -12.594456122070895;
    this.tableBoundaryMaxX = 12.811532052877915;
    this.tableBoundaryMinZ = -14.732399815742233;
    this.tableBoundaryMaxZ = 50.32672684244709;
    this.mapYPosition = -0.1;

    // 카메라 설정 초기화
    this.cameraTargetOffset = new THREE.Vector3(0, 15, 10);
    this.rotationAngle = 4.715;
    this.player_ = null;

    this.SetupLighting();
    this.SetupSkyAndFog();
    this.CreateGround();

    window.addEventListener('resize', () => this.OnWindowResize(), false);
  }

  InitializePhysicsWorld() {
    // 물리 월드 생성
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0);
    this.physicsWorld.defaultContactMaterial.friction = 0.3;
    this.physicsWorld.defaultContactMaterial.restitution = 0.8; // 탄성
    
    // 물리 월드의 시간 스텝
    this.physicsTimeStep = 1 / 60;

    console.log('✅ 물리 월드 초기화 완료');
  }

  SetupLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(60, 100, 10);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.normalBias = 0.02;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1.0;
    directionalLight.shadow.camera.far = 200.0;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0xf6f47f, 0.6);
    this.scene.add(hemisphereLight);
  }

  SetupSkyAndFog() {
    const skyUniforms = {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0x89b2eb) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyGeometry = new THREE.SphereGeometry(1000, 32, 15);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize( vWorldPosition + offset ).y;
          gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0), exponent ), 0.0 ) ), 1.0 );
        }`,
      side: THREE.BackSide,
    });

    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyMesh);
    this.scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);
  }

  CreateGround() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/resources/map.png', (texture) => {
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
      const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
      groundPlane.rotation.x = -Math.PI / 2;
      groundPlane.position.y = -10.0;
      groundPlane.receiveShadow = true;
      this.scene.add(groundPlane);
    });

    const loader = new GLTFLoader();
    loader.load(
      '/resources/Pool-table/table31.glb',
      (gltf) => {
        this.ground = gltf.scene;
        const box = new THREE.Box3().setFromObject(this.ground);
        const minY = box.min.y;
        this.ground.position.y = -minY;

        const size = new THREE.Vector3();
        box.getSize(size);
        const scaleX = 25 / size.x;
        const scaleZ = 50 / size.z;
        this.ground.scale.set(scaleX, scaleX, scaleZ);
        this.ground.updateMatrixWorld(true);

        console.log('=== 테이블 스케일 정보 ===');
        console.log('원본 크기:', size);
        console.log('스케일:', scaleX, scaleZ);

        const mainObject = this.ground.getObjectByName('main');
        if (mainObject) {
          mainObject.updateMatrixWorld(true);
          const mainBox = new THREE.Box3().setFromObject(mainObject);
          this.mainTopY = mainBox.max.y;
          
          console.log('=== mainObject 정보 ===');
          console.log('mainBox min:', mainBox.min);
          console.log('mainBox max:', mainBox.max);
          console.log('mainTopY (테이블 상판 높이):', this.mainTopY);
          console.log('mainBox 높이:', mainBox.max.y - mainBox.min.y);
          
          this.collidables_.push({ boundingBox: mainBox, object: mainObject });
          mainObject.visible = false;
        }

        let groundY = 0;
        if (this.ground) {
          const box = new THREE.Box3().setFromObject(this.ground);
          groundY = box.max.y;
        }

        // 공들을 당구대 위에 생성 (groundY 기반)
        if (mainObject) {
          const mainBox = new THREE.Box3().setFromObject(mainObject);
          this.CreateBalls(mainBox, groundY);
        }
        
        // 플레이어를 당구대 위에 스폰되도록 설정
        // groundY가 실제 당구대의 최상단 높이이므로 이를 기준으로 함
        this.playerSpawnY = groundY + 10;
        
        console.log('=== 플레이어 스폰 정보 ===');
        console.log('mainTopY:', this.mainTopY);
        console.log('groundY (실제 당구대 높이):', groundY);
        console.log('playerSpawnY (최종 스폰 위치):', this.playerSpawnY);

        const desiredHeight = 2.296;
        const commonTargetMaxY = 6.191;

        // ground에서 box로 시작하는 모든 객체 찾아서 처리
        this.ground.traverse((child) => {
          if (!child.name || !child.name.match(/^box\d+$/)) {
            return;
          }

          const boxObject = child;
          boxObject.updateWorldMatrix(true, true);
          const boxBox = new THREE.Box3().setFromObject(boxObject);
          const currentHeight = boxBox.max.y - boxBox.min.y;
          const scaleY = desiredHeight / currentHeight;
          boxObject.scale.y *= scaleY;
          boxObject.scale.x *= this.boxLengthMultiplier_;
          boxObject.scale.z *= this.boxLengthMultiplier_;
          boxObject.updateMatrixWorld(true);

          const adjustedBox = new THREE.Box3().setFromObject(boxObject);
          const currentMaxY = adjustedBox.max.y;
          const offsetY = commonTargetMaxY - currentMaxY;
          boxObject.position.y += offsetY;
          boxObject.updateMatrixWorld(true);

          // box 메시에 검은색 재료 적용
          boxObject.traverse((meshChild) => {
            if (meshChild.isMesh) {
              meshChild.material = new THREE.MeshStandardMaterial({
                color: 0x000000, // 검은색
                metalness: 0.1,
                roughness: 0.8
              });
              meshChild.castShadow = true;
              meshChild.receiveShadow = true;
            }
          });

          boxObject.visible = true; // 보이도록 설정
          // rimCollidables_는 CreateTableRimPhysicsBodies에서 추가됨
        });

        this.ground.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
              child.material.needsUpdate = true;
            }

            if (child.name.includes('hole')) {
              const holeNumberMatch = child.name.match(/hole(\d+)/);
              let holeColor = 0xFFFFFF;
              if (holeNumberMatch && this.holeColors_[holeNumberMatch[1]]) {
                holeColor = this.holeColors_[holeNumberMatch[1]];
              }

              child.position.y += this.holeHeightAdjustment_;
              if (child.material) {
                child.material = new THREE.MeshStandardMaterial({ color: holeColor });
              }
              const box = new THREE.Box3().setFromObject(child);
              this.holes_.push({ object: child, boundingBox: box });
              
              // KDTGame-main 패턴: 원기둥 형태의 바운딩 박스 시각화 추가 (홀)
              const cylinderRadius = ((box.max.x - box.min.x) / 2) * this.holeCylinderWidthMultiplier_;
              const cylinderHeight = box.max.y - box.min.y;
              const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32);
              const cylinderMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000, 
                wireframe: true, 
                transparent: true, 
                opacity: 0.5 
              }); // 빨간색, 와이어프레임, 투명
              const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
              cylinderMesh.visible = false; // 기본적으로 숨김 (디버깅 시 활성화 가능)

              // 원기둥 위치 조정
              cylinderMesh.position.copy(box.getCenter(new THREE.Vector3()));
              cylinderMesh.position.y = box.min.y + cylinderHeight / 2;

              this.scene.add(cylinderMesh);
              this.holeBoxHelpers_.push(cylinderMesh); // 원기둥 메쉬를 헬퍼 배열에 추가
            }
          }
        });

        this.scene.add(this.ground);
        
        // 테이블 가장자리(rim) 물리 바디 생성
        this.CreateTableRimPhysicsBodies();
        
        // 테이블의 모든 메시 부분에 물리 바디 생성
        this.CreateTablePhysicsBodies(this.ground);
        
        this.CreatePlayer(this.playerSpawnY);
      },
      undefined,
      (error) => {
        console.error('GLB 로드 실패:', error);
      }
    );
  }

  CreateTableRimPhysicsBodies() {
    // 테이블의 모든 box 객체들을 자동으로 발견하고 물리 바디 생성
    // KDTGame-main 패턴 적용: BoxHelper 시각화 추가
    console.log('=== 테이블 가장자리(Rim) 물리 바디 생성 시작 ===');
    let rimBodyCount = 0;
    const boxObjectList = [];

    // ground에서 box로 시작하는 모든 객체 찾기
    this.ground.traverse((child) => {
      if (child.name && child.name.match(/^box\d+$/)) {
        boxObjectList.push(child);
      }
    });

    console.log(`발견된 box 메시: ${boxObjectList.length}개`);

    for (const boxObject of boxObjectList) {
      const boxName = boxObject.name;

      // 박스의 현재 스케일과 위치를 고려한 바운딩 박스 계산
      boxObject.updateMatrixWorld(true);
      const adjustedBox = new THREE.Box3().setFromObject(boxObject);
      const size = new THREE.Vector3();
      adjustedBox.getSize(size);

      // 바운딩 박스의 중심과 크기로 물리 바디 생성
      const position = new THREE.Vector3();
      adjustedBox.getCenter(position);

      // Box에 collisionResponse 설정하기 위해 compound shape 사용
      const boxShape = new CANNON.Box(
        new CANNON.Vec3(
          Math.max(size.x / 2, 0.05),
          Math.max(size.y / 2, 0.05),
          Math.max(size.z / 2, 0.05)
        )
      );

      const rimBody = new CANNON.Body({
        mass: 0, // 정적 바디
        shape: boxShape,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        collisionResponse: CANNON.Body.STATIC // 명시적으로 정적 충돌 응답
      });

      // 충돌 여지를 위해 모든 바디와 충돌하도록 설정
      rimBody.collisionFilterGroup = 1;
      rimBody.collisionFilterMask = -1;

      this.physicsWorld.addBody(rimBody);
      this.boundingBodies_.push(rimBody);
      
      // KDTGame-main 패턴: rimCollidables_에 추가
      this.rimCollidables_.push({ boundingBox: adjustedBox, object: boxObject });
      
      // BoxHelper 추가 (테이블 가장자리) - KDTGame-main 패턴
      const rimBoxHelper = new THREE.BoxHelper(boxObject, 0x00ff00); // 초록색
      rimBoxHelper.visible = false; // 기본적으로 숨김 (디버깅 시 활성화 가능)
      this.scene.add(rimBoxHelper);
      this.rimBoxHelpers_.push(rimBoxHelper);
      
      rimBodyCount++;

      console.log(`  ✅ ${boxName} 물리 바디 생성 완료`);
      console.log(`     크기: (${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)}) | 위치: (${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)})`);
    }

    console.log(`✅ 가장자리 물리 바디 ${rimBodyCount}개 생성 완료`);
  }

  CreateTablePhysicsBodies(tableObject) {
    // physicsWorld 존재 확인
    if (!this.physicsWorld) {
      console.error('❌ physicsWorld가 초기화되지 않았습니다. CreateTablePhysicsBodies를 건너뜁니다.');
      return;
    }

    console.log('=== 테이블 메인 메시 물리 바디 생성 시작 ===');
    let meshCount = 0;
    let physicsBodyCount = 0;
    const meshList = [];

    // 테이블의 모든 메시를 순회하며 물리 바디 생성
    tableObject.traverse((child) => {
      if (!child.isMesh) return;

      // box와 hole은 이미 따로 처리했으므로 제외
      if (child.name.includes('box') || child.name.includes('hole')) {
        return;
      }

      meshCount++;
      
      // 각 메시에 대해 바운딩 박스 계산
      const bbox = new THREE.Box3().setFromObject(child);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      
      const position = new THREE.Vector3();
      bbox.getCenter(position);

      meshList.push({
        name: child.name || `unnamed_${meshCount}`,
        size: { x: size.x.toFixed(3), y: size.y.toFixed(3), z: size.z.toFixed(3) },
        position: { x: position.x.toFixed(3), y: position.y.toFixed(3), z: position.z.toFixed(3) }
      });

      // 모든 메시에 대해 물리 바디 생성
      const scaledSize = new THREE.Vector3(
        Math.max(size.x / 2, 0.01),
        Math.max(size.y / 2, 0.01),
        Math.max(size.z / 2, 0.01)
      );

      // 정적 물리 바디 생성 (테이블은 움직이지 않음)
      const boxShape = new CANNON.Box(
        new CANNON.Vec3(scaledSize.x, scaledSize.y, scaledSize.z)
      );

      const physicsBody = new CANNON.Body({
        mass: 0, // 정적 바디
        shape: boxShape,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        collisionResponse: CANNON.Body.STATIC
      });

      // 물리 바디를 월드에 추가
      this.physicsWorld.addBody(physicsBody);
      this.boundingBodies_.push(physicsBody);
      physicsBodyCount++;
    });

    console.log(`✅ 테이블 메인 메시 총 ${meshCount}개 발견`);
    console.log(`✅ 물리 바디 ${physicsBodyCount}개 생성 완료`);
    if (meshList.length > 0) {
      console.log('=== 생성된 메시 목록 ===');
      meshList.forEach(mesh => {
        console.log(`  • ${mesh.name} | 크기: (${mesh.size.x}, ${mesh.size.y}, ${mesh.size.z}) | 위치: (${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z})`);
      });
    }
  }

  CreateBalls(mainBoundingBox, groundY) {
    for (let i = 1; i <= 6; i++) {
      const position = new THREE.Vector3(
          mainBoundingBox.min.x + Math.random() * (mainBoundingBox.max.x - mainBoundingBox.min.x),
          groundY + 0.8,
          mainBoundingBox.min.z + Math.random() * (mainBoundingBox.max.z - mainBoundingBox.min.z)
      );

      const ball = new Ball({
        scene: this.scene,
        position: position,
        mainBoundingBox: mainBoundingBox,
        ballNumber: i,
        ballColor: this.ballColors_[i],
        onMeshLoaded: (mesh) => this.OnBallMeshLoaded(ball, mesh, position)
      }, this.currentBallSpeedIncrease);

      this.balls_.push(ball);
    }
  }

  OnBallMeshLoaded(ball, mesh, position) {
    // physicsWorld 존재 확인
    if (!this.physicsWorld) {
      console.error('❌ physicsWorld가 초기화되지 않았습니다.');
      return;
    }

    // 메시 로드 후 물리 바디 생성
    const ballRadius = 0.075;
    const ballShape = new CANNON.Sphere(ballRadius);
    const ballBody = new CANNON.Body({
      mass: 1,
      shape: ballShape,
      linearDamping: 0.3,
      angularDamping: 0.3,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });

    // 속도 설정 (Vec3 객체 사용)
    const velocity = new CANNON.Vec3(
      (Math.random() * 2 - 1) * 5,
      0,
      (Math.random() * 2 - 1) * 5
    );
    ballBody.velocity = velocity;

    this.physicsWorld.addBody(ballBody);
    this.ballBodies_.push({ mesh: mesh, body: ballBody, ball: ball });
    console.log(`✅ Ball ${ball.ballNumber_} 물리 바디 생성 완료`);
  }

  CreatePlayer(playerY) {
    console.log('=== CreatePlayer 호출 ===');
    console.log('playerY 파라미터:', playerY);
    console.log('this.mainTopY:', this.mainTopY);
    
    this.player_ = new player.Player({
      scene: this.scene,
      position: new THREE.Vector3(0, playerY, 0),
      mainTopY: this.mainTopY,
    });

    // 플레이어 물리 바디 생성
    if (this.physicsWorld) {
      const playerRadius = 0.4; // 플레이어 캡슐 반지름 (작게 설정)
      
      // Kinematic 바디로 설정 (플레이어 움직임을 직접 제어)
      const playerShape = new CANNON.Sphere(playerRadius);
      this.playerBody_ = new CANNON.Body({
        mass: 0, // Kinematic: 플레이어 움직임을 직접 제어
        shape: playerShape,
        type: CANNON.Body.KINEMATIC, // Kinematic 설정
        position: new CANNON.Vec3(0, playerY, 0)
      });
      
      this.physicsWorld.addBody(this.playerBody_);
      this.playerPrevPosition_ = new THREE.Vector3(0, playerY, 0);
      console.log('✅ 플레이어 물리 바디 생성 완료 (Kinematic)');
    }

    // Player 메시 로드가 비동기일 수 있으므로 null 체크
    if (this.player_ && this.player_.mesh_) {
      console.log('=== Player 메시 생성됨 ===');
      console.log('Player spawned at position:', this.player_.mesh_.position);
      console.log('Player 바운딩박스:', this.player_.boundingBox_);
    } else {
      console.log('Player 생성됨 (메시는 비동기 로드)');
    }

    this.cameraTargetOffset = new THREE.Vector3(0, 15, 10);
    this.rotationAngle = 4.715;
  }

  UpdateCamera() {
    if (!this.player_ || !this.player_.mesh_ || !this.cameraTargetOffset) return;

    try {
      const target = this.player_.mesh_.position.clone();
      const offset = this.cameraTargetOffset.clone();
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationAngle);
      const cameraPos = target.clone().add(offset);
      this.camera.position.copy(cameraPos);

      const headOffset = new THREE.Vector3(0, 2, 0);
      const headPosition = target.clone().add(headOffset);
      this.camera.lookAt(headPosition);
    } catch (e) {
      console.error('UpdateCamera error:', e);
    }
  }

  OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  RAF(time) {
    requestAnimationFrame((t) => this.RAF(t));

    if (!this.prevTime) this.prevTime = time || performance.now();
    const delta = ((time || performance.now()) - this.prevTime) * 0.001;
    this.prevTime = time || performance.now();

    // 물리 월드 업데이트
    if (this.physicsWorld) {
      // 플레이어 메시 위치를 물리 바디에 동기화 (Kinematic)
      if (this.player_ && this.player_.mesh_ && this.playerBody_) {
        const currentPos = this.player_.mesh_.position;
        
        // 위치 업데이트
        this.playerBody_.position.x = currentPos.x;
        this.playerBody_.position.y = currentPos.y;
        this.playerBody_.position.z = currentPos.z;
        
        // 속도 계산 (이전 위치와의 차이)
        if (this.playerPrevPosition_) {
          const velocityX = (currentPos.x - this.playerPrevPosition_.x) / delta;
          const velocityY = (currentPos.y - this.playerPrevPosition_.y) / delta;
          const velocityZ = (currentPos.z - this.playerPrevPosition_.z) / delta;
          
          this.playerBody_.velocity.x = velocityX;
          this.playerBody_.velocity.y = velocityY;
          this.playerBody_.velocity.z = velocityZ;
        }
        
        this.playerPrevPosition_.copy(currentPos);
      }

      // 물리 월드 계산
      this.physicsWorld.step(this.physicsTimeStep);

      // 물리 바디와 메시 동기화
      for (const ballData of this.ballBodies_) {
        if (ballData.mesh && ballData.body) {
          ballData.mesh.position.copy(ballData.body.position);
          ballData.mesh.quaternion.copy(ballData.body.quaternion);
        }
      }
    }

    if (this.player_ && this.player_.mesh_) {
      this.timeSinceLastBallSpeedIncrease += delta;
      if (this.timeSinceLastBallSpeedIncrease >= this.ballSpeedIncreaseInterval) {
        this.currentBallSpeedIncrease += this.ballSpeedIncrement;
        this.timeSinceLastBallSpeedIncrease = 0;
        console.log(`Ball speed increased to: ${this.currentBallSpeedIncrease.toFixed(2)}`);
      }

      // box mesh(rim) 충돌 객체 배열 생성
      const rimCollidablesForPlayer = this.rimCollidables_.map(rim => ({
        boundingBox: rim.boundingBox,
        object: rim.object
      }));
      
      const allCollidables = this.collidables_.concat(this.holes_).concat(rimCollidablesForPlayer);
      this.player_.Update(delta, this.rotationAngle, allCollidables, this.rimCollidables_, this.gameSpeedMultiplier);
      this.UpdateCamera();

      if (this.player_.mesh_.position.x < this.tableBoundaryMinX || this.player_.mesh_.position.x > this.tableBoundaryMaxX ||
          this.player_.mesh_.position.z < this.tableBoundaryMinZ || this.player_.mesh_.position.z > this.tableBoundaryMaxZ) {
          this.player_.mesh_.position.y = this.mapYPosition;
      }
    }

    for (const ball of this.balls_) {
      if (!ball.mesh_) continue;
      
      const playerBoundingBox = this.player_ && this.player_.boundingBox_ ? this.player_.boundingBox_ : null;
      ball.Update(delta, this.currentBallSpeedIncrease, this.balls_, this.holes_, playerBoundingBox);

      if (ball.mesh_ && ball.mesh_.position) {
        if (ball.mesh_.position.x < this.tableBoundaryMinX || ball.mesh_.position.x > this.tableBoundaryMaxX ||
            ball.mesh_.position.z < this.tableBoundaryMinZ || ball.mesh_.position.z > this.tableBoundaryMaxZ) {
            ball.mesh_.position.y = this.mapYPosition;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  // KDTGame-main 패턴: 바운딩 박스 헬퍼 토글 함수 (디버깅용)
  ToggleBoxHelpers(visible) {
    for (const helper of this.rimBoxHelpers_) {
      helper.visible = visible;
    }
    for (const helper of this.holeBoxHelpers_) {
      helper.visible = visible;
    }
  }}