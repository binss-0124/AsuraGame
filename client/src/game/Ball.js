import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js';

export class Ball {
  constructor(params, currentBallSpeedIncrease = 0) {
    this.scene_ = params.scene;
    this.position_ = params.position.clone();
    this.mainBoundingBox_ = params.mainBoundingBox;
    this.ballNumber_ = params.ballNumber;
    this.ballColor_ = params.ballColor;
    this.onMeshLoaded_ = params.onMeshLoaded; // 메시 로드 콜백

    // 테이블 경계 설정
    if (this.mainBoundingBox_) {
      this.tableBounds_ = {
        minX: this.mainBoundingBox_.min.x,
        maxX: this.mainBoundingBox_.max.x,
        minZ: this.mainBoundingBox_.min.z,
        maxZ: this.mainBoundingBox_.max.z
      };
    } else {
      // 기본 경계값
      this.tableBounds_ = {
        minX: -12.5,
        maxX: 12.5,
        minZ: -14.5,
        maxZ: 50.5
      };
    }

    // 초기 속도에 누적된 공 속도 증가량 적용
    this.initialSpeed_ = 5;
    this.velocity_ = new THREE.Vector3(
        (Math.random() * 2 - 1) * (this.initialSpeed_ + currentBallSpeedIncrease),
        0,
        (Math.random() * 2 - 1) * (this.initialSpeed_ + currentBallSpeedIncrease)
    );

    this.LoadModel_();
  }

  LoadModel_() {
    const loader = new GLTFLoader();
    loader.load(`/resources/Pool-table/${this.ballNumber_}ball.glb`, (gltf) => {
      this.mesh_ = gltf.scene;
      this.mesh_.scale.set(40, 40, 40);
      this.mesh_.position.copy(this.position_);
      this.mesh_.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (this.ballColor_ !== undefined) {
            child.material = new THREE.MeshStandardMaterial({ color: this.ballColor_ });
          } else {
            const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
            child.material = new THREE.MeshStandardMaterial({ color: randomColor });
          }
        }
      });
      this.scene_.add(this.mesh_);

      this.boundingBox_ = new THREE.Box3().setFromObject(this.mesh_);
      console.log(`Ball ${this.ballNumber_} loaded successfully at position:`, this.mesh_.position);
      
      // 메시 로드 완료 후 콜백 실행
      if (this.onMeshLoaded_) {
        this.onMeshLoaded_(this.mesh_);
      }
    }, undefined, (error) => {
      console.error(`Error loading ball ${this.ballNumber_}ball.glb:`, error);
    });
  }

  Update(delta, currentBallSpeedIncrease = 0, allBalls = [], allHoles = [], playerBoundingBox = null) {
    if (!this.mesh_) {
      return;
    }

    // 공의 이동 속도에 누적된 증가량 적용
    this.position_.add(this.velocity_.clone().normalize().multiplyScalar((this.initialSpeed_ + currentBallSpeedIncrease) * delta));

    // 홀과의 충돌 감지 및 반사
    for (const hole of allHoles) {
      if (this.boundingBox_.intersectsBox(hole.boundingBox)) {
        console.log(`Ball ${this.ballNumber_} collided with a hole!`);

        const ballCenter = this.boundingBox_.getCenter(new THREE.Vector3());
        const holeCenter = hole.boundingBox.getCenter(new THREE.Vector3());

        const ballMin = this.boundingBox_.min;
        const ballMax = this.boundingBox_.max;
        const holeMin = hole.boundingBox.min;
        const holeMax = hole.boundingBox.max;

        const xOverlap = Math.min(ballMax.x, holeMax.x) - Math.max(ballMin.x, holeMin.x);
        const zOverlap = Math.min(ballMax.z, holeMax.z) - Math.max(ballMin.z, holeMin.z);

        let normal = new THREE.Vector3();

        if (xOverlap < zOverlap) {
          if (ballCenter.x < holeCenter.x) {
            normal.set(-1, 0, 0);
            this.position_.x = holeMin.x - (ballMax.x - ballMin.x) / 2;
          } else {
            normal.set(1, 0, 0);
            this.position_.x = holeMax.x + (ballMax.x - ballMin.x) / 2;
          }
        } else {
          if (ballCenter.z < holeCenter.z) {
            normal.set(0, 0, -1);
            this.position_.z = holeMin.z - (ballMax.z - ballMin.z) / 2;
          } else {
            normal.set(0, 0, 1);
            this.position_.z = holeMax.z + (ballMax.z - ballMin.z) / 2;
          }
        }

        this.velocity_.reflect(normal);

        const epsilon = 0.001;

        if (xOverlap < zOverlap) {
          if (ballCenter.x < holeCenter.x) {
            this.position_.x = holeMin.x - (ballMax.x - ballMin.x) / 2 - epsilon;
          } else {
            this.position_.x = holeMax.x + (ballMax.x - ballMin.x) / 2 + epsilon;
          }
        } else {
          if (ballCenter.z < holeCenter.z) {
            this.position_.z = holeMin.z - (ballMax.z - ballMin.z) / 2 - epsilon;
          } else {
            this.position_.z = holeMax.z + (ballMax.z - ballMin.z) / 2 + epsilon;
          }
        }

        this.mesh_.position.copy(this.position_);
        this.boundingBox_.setFromObject(this.mesh_);

        break;
      }
    }

    // 다른 공들과의 충돌 감지 및 반사
    for (const otherBall of allBalls) {
      if (otherBall === this) continue;

      if (this.boundingBox_.intersectsBox(otherBall.boundingBox_)) {
        const normal = new THREE.Vector3().subVectors(this.position_, otherBall.position_).normalize();

        this.velocity_.reflect(normal);
        otherBall.velocity_.reflect(normal.clone().negate());

        const overlapDirection = new THREE.Vector3().subVectors(this.position_, otherBall.position_).normalize();
        this.position_.add(overlapDirection.multiplyScalar(0.1));
        otherBall.position_.sub(overlapDirection.multiplyScalar(0.1));

        this.mesh_.position.copy(this.position_);
        otherBall.mesh_.position.copy(otherBall.position_);
        this.boundingBox_.setFromObject(this.mesh_);
        otherBall.boundingBox_.setFromObject(otherBall.mesh_);
      }
    }

    // 플레이어와의 충돌 감지
    if (playerBoundingBox && this.boundingBox_.intersectsBox(playerBoundingBox)) {
      console.log(`Ball ${this.ballNumber_} collided with player!`);
      const normal = new THREE.Vector3().subVectors(this.position_, playerBoundingBox.getCenter(new THREE.Vector3())).normalize();
      this.velocity_.reflect(normal);
    }

    // 속도 감소 (마찰)
    this.velocity_.multiplyScalar(0.98);

    // 테이블 경계 처리
    if (this.tableBounds_) {
      if (this.position_.x < this.tableBounds_.minX) {
        this.position_.x = this.tableBounds_.minX;
        this.velocity_.x *= -0.8;
      } else if (this.position_.x > this.tableBounds_.maxX) {
        this.position_.x = this.tableBounds_.maxX;
        this.velocity_.x *= -0.8;
      }

      if (this.position_.z < this.tableBounds_.minZ) {
        this.position_.z = this.tableBounds_.minZ;
        this.velocity_.z *= -0.8;
      } else if (this.position_.z > this.tableBounds_.maxZ) {
        this.position_.z = this.tableBounds_.maxZ;
        this.velocity_.z *= -0.8;
      }
    }

    // 메쉬 위치 업데이트
    this.mesh_.position.copy(this.position_);

    // 바운딩 박스 업데이트
    if (this.boundingBox_) {
      this.boundingBox_.setFromObject(this.mesh_);
    }
  }
}

