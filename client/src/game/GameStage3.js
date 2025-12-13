import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js';
import { Ball } from './Ball.js';
import { UI } from '../utils/ui.js';
import { player } from '../utils/player.js';

export class GameStage3 {
  constructor(socket, players, map, spawnedWeapons, onGameEnd) {
    console.log('GameStage3 constructor called.');
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
    this.isFalling = false;

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

        for (let i = 1; i <= 16; i++) {
          const boxName = `box${i}`;
          const boxObject = this.ground.getObjectByName(boxName);
          if (!boxObject) continue;

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
              if (holeNumberMatch && this.holeColors_[holeNumberMatch[1]]) {
                holeColor = this.holeColors_[holeNumberMatch[1]];
              }

              child.position.y += this.holeHeightAdjustment_;
              if (child.material) {
                child.material = new THREE.MeshStandardMaterial({ color: holeColor });
              }
              const box = new THREE.Box3().setFromObject(child);
              this.holes_.push({ object: child, boundingBox: box });
            }
          }
        });

        this.scene.add(this.ground);
        this.CreatePlayer(this.playerSpawnY);
      },
      undefined,
      (error) => {
        console.error('GLB 로드 실패:', error);
      }
    );
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
        ballColor: this.ballColors_[i]
      }, this.currentBallSpeedIncrease);

      this.balls_.push(ball);
    }
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

    if (this.player_ && this.player_.mesh_) {
      this.timeSinceLastBallSpeedIncrease += delta;
      if (this.timeSinceLastBallSpeedIncrease >= this.ballSpeedIncreaseInterval) {
        this.currentBallSpeedIncrease += this.ballSpeedIncrement;
        this.timeSinceLastBallSpeedIncrease = 0;
        console.log(`Ball speed increased to: ${this.currentBallSpeedIncrease.toFixed(2)}`);
      }

      const allCollidables = this.collidables_.concat(this.holes_);
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
}
