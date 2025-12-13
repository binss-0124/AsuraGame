import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js';
import { Ball } from './Ball.js';
import { UI } from '../utils/ui.js';
import { player } from '../utils/player.js';

export class GameStage3 {
  constructor(socket, players, map, spawnedWeapons, onGameEnd) {
    console.log('GameStage3 (Pool Table) constructor called.');
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

    // 카메라 설정
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 2000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 25, 0);
    this.camera.lookAt(0, 0, 0);

    // 씬 설정
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.01);

    // 조명 설정
    this.SetupLighting();
    
    // 게임 상태 초기화
    this.tableLoaded = false;
    this.balls_ = [];
    this.holes_ = [];
    this.tableObject = null;

    // 당구공 색상 설정
    this.ballColors_ = {
      1: 0xfefe48,  // 1번: 흰색 (큐볼)
      2: 0x39a8fe,  // 2번: 파란색
      3: 0xFF0000,  // 3번: 빨간색
      4: 0x020202,  // 4번: 검정
      5: 0xee6e06,  // 5번: 주황색
      6: 0xa6fe48,  // 6번: 초록색
    };

    // 물리 경계 설정
    this.tableBounds = {
      minX: -20,
      maxX: 20,
      minZ: -40,
      maxZ: 40
    };

    // 홀(포켓) 위치 설정
    this.holes_ = [
      { position: new THREE.Vector3(-20, 0.5, -40), radius: 1.5 },
      { position: new THREE.Vector3(0, 0.5, -40), radius: 1.5 },
      { position: new THREE.Vector3(20, 0.5, -40), radius: 1.5 },
      { position: new THREE.Vector3(-20, 0.5, 40), radius: 1.5 },
      { position: new THREE.Vector3(0, 0.5, 40), radius: 1.5 },
      { position: new THREE.Vector3(20, 0.5, 40), radius: 1.5 }
    ];

    this.LoadPoolTable();

    window.addEventListener('resize', () => this.OnWindowResize(), false);
    document.addEventListener('keydown', (e) => this._OnKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._OnKeyUp(e), false);
    document.addEventListener('click', (e) => this.OnMouseClick(e), false);
  }

  SetupLighting() {
    // 주조명
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 80, 50);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);

    // 반구형 조명
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2a2a3e, 0.8);
    this.scene.add(hemisphereLight);

    // 주변 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  LoadPoolTable() {
    // 이미지 맵 (바닥) 생성
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

    // table0.glb 로드
    const loader = new GLTFLoader();
    loader.load(
      '/resources/Pool-table/table0.glb',
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

        const mainObject = this.ground.getObjectByName('main');
        if (mainObject) {
          mainObject.updateMatrixWorld(true);
          const mainBox = new THREE.Box3().setFromObject(mainObject);
          this.mainTopY = mainBox.max.y;
          this.collidables_ = [{ boundingBox: mainBox, object: mainObject }];
          mainObject.visible = false;

          console.log('mainBox:', mainBox);
          console.log('mainTopY:', this.mainTopY);

          this.CreateBalls(mainBox, this.mainTopY);
        }

        let groundY = 0;
        if (this.ground) {
          const box = new THREE.Box3().setFromObject(this.ground);
          groundY = box.max.y;
        }
        this.playerSpawnY = this.mainTopY !== undefined ? this.mainTopY + 0.01 : groundY + 11;

        const desiredHeight = 2.296;
        const commonTargetMaxY = 6.191;

        for (let i = 1; i <= 16; i++) {
          const boxName = `box${i}`;
          const boxObject = this.ground.getObjectByName(boxName);
          if (!boxObject) continue;

          boxObject.updateWorldMatrix(true, true);
          const boxBox = new THREE.Box3().setFromObject(boxObject);
          const currentHeight = boxBox.max.y - boxBox.min.y;
          const scaleY = desiredHeight / currentHeight;
          boxObject.scale.y *= scaleY;
          boxObject.scale.x *= 1.1;
          boxObject.scale.z *= 1.1;
          boxObject.updateMatrixWorld(true);

          const adjustedBox = new THREE.Box3().setFromObject(boxObject);
          const currentMaxY = adjustedBox.max.y;
          const offsetY = commonTargetMaxY - currentMaxY;
          boxObject.position.y += offsetY;
          boxObject.updateMatrixWorld(true);

          if (!this.rimCollidables_) this.rimCollidables_ = [];
          this.rimCollidables_.push({ boundingBox: adjustedBox, object: boxObject });
          boxObject.visible = false;
        }

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
              if (holeNumberMatch && this.holeColors_ && this.holeColors_[holeNumberMatch[1]]) {
                holeColor = this.holeColors_[holeNumberMatch[1]];
              }

              child.position.y += 0.45;
              if (child.material) {
                child.material = new THREE.MeshStandardMaterial({ color: holeColor });
              }
              const box = new THREE.Box3().setFromObject(child);
              if (!this.holes_ || !Array.isArray(this.holes_)) {
                this.holes_ = [];
              }
              this.holes_.push({ object: child, boundingBox: box });
            }
          }
        });

        this.scene.add(this.ground);
        this.CreatePoolPlayer(this.playerSpawnY);
      },
      undefined,
      (error) => {
        console.error('GLB 로드 실패:', error);
      }
    );
  }

  CreateFallbackPoolTable() {
    // 당구대를 Three.js 기하학으로 만들기
    const tableGroup = new THREE.Group();
    
    // 테이블 표면 (상판)
    const tableTopGeometry = new THREE.BoxGeometry(40, 0.5, 80);
    const tableTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016, // 초록색 펠트
      roughness: 0.7,
      metalness: 0.1
    });
    const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.y = 0.25;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // 테이블 다리 (4개 모서리)
    const legGeometry = new THREE.BoxGeometry(2, 5, 2);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // 갈색 나무
      roughness: 0.8
    });

    const legPositions = [
      [-18, -2.5, -38],
      [18, -2.5, -38],
      [-18, -2.5, 38],
      [18, -2.5, 38]
    ];

    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial.clone());
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);
    }

    // 테이블 테두리/쿠션
    const cushionGeometry = new THREE.BoxGeometry(1, 1, 80);
    const cushionMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // 검은색 쿠션
      roughness: 0.5
    });

    // 좌우 쿠션
    const leftCushion = new THREE.Mesh(cushionGeometry, cushionMaterial.clone());
    leftCushion.position.set(-20.5, 0.5, 0);
    leftCushion.castShadow = true;
    tableGroup.add(leftCushion);

    const rightCushion = new THREE.Mesh(cushionGeometry, cushionMaterial.clone());
    rightCushion.position.set(20.5, 0.5, 0);
    rightCushion.castShadow = true;
    tableGroup.add(rightCushion);

    // 상하 쿠션
    const topCushionGeometry = new THREE.BoxGeometry(40, 1, 1);
    const topCushion = new THREE.Mesh(topCushionGeometry, cushionMaterial.clone());
    topCushion.position.set(0, 0.5, -40.5);
    topCushion.castShadow = true;
    tableGroup.add(topCushion);

    const bottomCushion = new THREE.Mesh(topCushionGeometry, cushionMaterial.clone());
    bottomCushion.position.set(0, 0.5, 40.5);
    bottomCushion.castShadow = true;
    tableGroup.add(bottomCushion);

    this.scene.add(tableGroup);
    this.tableLoaded = true;

    console.log('Fallback pool table created successfully');
    
    // 플레이어 생성
    this.CreatePoolPlayer();
    // 당구공 생성
    this.CreateBalls();
  }

  CreateBalls(mainBoundingBox, mainTopY) {
    for (let i = 1; i <= 6; i++) {
      const position = new THREE.Vector3(
          mainBoundingBox.min.x + Math.random() * (mainBoundingBox.max.x - mainBoundingBox.min.x),
          mainTopY + 0.2,
          mainBoundingBox.min.z + Math.random() * (mainBoundingBox.max.z - mainBoundingBox.min.z)
      );

      const ball = new Ball({
        scene: this.scene,
        position: position,
        mainBoundingBox: mainBoundingBox,
        ballNumber: i,
        ballColor: this.ballColors_[i]
      }, 0);

      this.balls_.push(ball);
    }
  }

  CreatePoolPlayer(playerY) {
    this.player_ = new player.Player({
      scene: this.scene,
      position: new THREE.Vector3(0, playerY, 0),
      mainTopY: this.mainTopY,
    });

    this.cameraTargetOffset = new THREE.Vector3(0, 15, 10);
    this.rotationAngle = 4.715;
  }

  OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _OnKeyDown(event) {
    // 플레이어 이동 제어
    if (this.player_) {
      switch(event.key.toLowerCase()) {
        case 'w':
          this.player_.desiredVelocity_.z = -10;
          break;
        case 'a':
          this.player_.desiredVelocity_.x = -10;
          break;
        case 's':
          this.player_.desiredVelocity_.z = 10;
          break;
        case 'd':
          this.player_.desiredVelocity_.x = 10;
          break;
        case 'shift':
          this.player_.desiredVelocity_.multiplyScalar(1.5);
          break;
      }
    }
  }

  _OnKeyUp(event) {
    // 플레이어 이동 정지
    if (this.player_) {
      switch(event.key.toLowerCase()) {
        case 'w':
          if (this.player_.desiredVelocity_.z < 0) {
            this.player_.desiredVelocity_.z = 0;
          }
          break;
        case 'a':
          if (this.player_.desiredVelocity_.x < 0) {
            this.player_.desiredVelocity_.x = 0;
          }
          break;
        case 's':
          if (this.player_.desiredVelocity_.z > 0) {
            this.player_.desiredVelocity_.z = 0;
          }
          break;
        case 'd':
          if (this.player_.desiredVelocity_.x > 0) {
            this.player_.desiredVelocity_.x = 0;
          }
          break;
        case 'k':
          // 쿠 액션
          if (this.balls_.length > 0 && this.balls_[0].velocity.length() < 0.5) {
            // 큐볼 앞에 힘을 가함
            const force = new THREE.Vector3(0, 0, -20);
            this.balls_[0].ApplyForce(force);
          }
          break;
      }
    }
  }

  OnMouseClick(event) {
    // 큐볼이 움직이고 있으면 무시
    if (this.balls_.length > 0 && this.balls_[0].velocity.length() > 0.1) {
      return;
    }

    // 마우스 위치를 정규화된 장치 좌표로 변환
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 레이캐스터 생성
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 모든 공 메시 배열로 변환
    const ballMeshes = this.balls_.map(ball => ball.mesh);
    const intersects = raycaster.intersectObjects(ballMeshes);

    if (intersects.length > 0) {
      // 첫 번째 교점이 큐볼인 경우만
      const hitBall = this.balls_.find(ball => ball.mesh === intersects[0].object);
      if (hitBall && hitBall.ballNumber === 1) {
        // 클릭한 위치와 화면 중심의 차이로 힘을 결정
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const diffX = (event.clientX - centerX) * 0.01;
        const diffY = (event.clientY - centerY) * 0.01;

        // 큐볼에 힘을 가함
        const force = new THREE.Vector3(-diffX, 0, -diffY).multiplyScalar(5);
        hitBall.ApplyForce(force);

        console.log(`Cue ball hit with force: ${force.length().toFixed(2)}`);
      }
    }
  }

  UpdateCamera() {
    // 카메라가 플레이어를 따라다니도록 설정
    if (!this.player_ || !this.player_.mesh_) {
      // 플레이어가 없으면 당구대를 보도록
      this.camera.position.set(0, 30, 40);
      this.camera.lookAt(0, 0, 0);
      return;
    }

    const target = this.player_.mesh_.position.clone();
    const offset = this.cameraTargetOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationAngle);
    const cameraPos = target.clone().add(offset);
    this.camera.position.copy(cameraPos);

    const headOffset = new THREE.Vector3(0, 2, 0);
    const headPosition = target.clone().add(headOffset);
    this.camera.lookAt(headPosition);
  }

  RAF(time) {
    requestAnimationFrame((t) => this.RAF(t));

    if (!this.prevTime) this.prevTime = time || performance.now();
    const delta = Math.min(((time || performance.now()) - this.prevTime) * 0.001, 0.016);
    this.prevTime = time || performance.now();
    this.prevDelta = delta;

    if (this.tableLoaded) {
      // 플레이어 업데이트
      if (this.player_) {
        this.player_.Update(this.prevDelta || 0.016, this.rotationAngle, this.balls_, [], 1);
      }

      // 모든 공 업데이트
      for (let i = 0; i < this.balls_.length; i++) {
        const ball = this.balls_[i];
        ball.Update(delta, this.balls_, this.holes_);

        // 공이 홀에 빠졌는지 확인
        for (const hole of this.holes_) {
          const distance = ball.position.distanceTo(hole.position);
          if (distance < hole.radius) {
            console.log(`Ball ${i + 1} fell into hole`);
            this.RemoveBall(i);
            i--;
            break;
          }
        }
      }

      this.UpdateCamera();
    }

    this.renderer.render(this.scene, this.camera);
  }

  RemoveBall(index) {
    if (index >= 0 && index < this.balls_.length) {
      const ball = this.balls_[index];
      this.scene.remove(ball.mesh);
      this.balls_.splice(index, 1);
    }
  }
}
