import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

export class PoolBall {
  constructor(params) {
    this.scene = params.scene;
    this.ballNumber = params.ballNumber;
    this.ballColor = params.ballColor;
    this.tableBounds = params.tableBounds;

    // 물리 속성
    this.position = params.position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = 0.5; // 당구공 반지름
    this.friction = 0.98; // 마찰 계수
    this.restitution = 0.8; // 탄성 계수 (반사)
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.mass = 1.0;

    // 메시 생성 (구형)
    this.CreateMesh();
  }

  CreateMesh() {
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.ballColor,
      metalness: 0.3,
      roughness: 0.4
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);

    // 번호 텍스처 (옵션)
    if (this.ballNumber > 1) {
      this.AddBallNumber();
    }
  }

  AddBallNumber() {
    // 당구공에 번호를 표시하는 캔버스 텍스처
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // 배경
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    // 번호
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.ballNumber, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    
    // 캔버스 텍스처를 메시의 材料에 적용 (선택적)
    // this.mesh.material.map = texture;
  }

  Update(delta, allBalls = [], holes = []) {
    if (!this.mesh) return;

    // 마찰 적용
    this.velocity.multiplyScalar(this.friction);

    // 속도가 매우 작으면 멈춤
    if (this.velocity.length() < 0.01) {
      this.velocity.set(0, 0, 0);
    }

    // 위치 업데이트
    this.position.add(this.velocity.clone().multiplyScalar(delta));

    // 다른 공들과의 충돌 감지
    for (const otherBall of allBalls) {
      if (otherBall === this) continue;

      const distance = this.position.distanceTo(otherBall.position);
      const minDistance = this.radius + otherBall.radius;

      if (distance < minDistance) {
        this.HandleBallCollision(otherBall, distance, minDistance);
      }
    }

    // 테이블 벽과의 충돌 감지
    this.HandleWallCollisions();

    // 메시 위치 업데이트
    this.mesh.position.copy(this.position);
  }

  HandleBallCollision(otherBall, distance, minDistance) {
    // 충돌 법선 계산
    const normal = new THREE.Vector3().subVectors(this.position, otherBall.position).normalize();
    
    // 두 공을 분리하여 겹치지 않도록
    const overlap = minDistance - distance;
    const separationVector = normal.clone().multiplyScalar(overlap / 2 + 0.01);
    this.position.add(separationVector);
    otherBall.position.sub(separationVector);

    // 탄성 충돌 (완전 탄성 충돌)
    const relativeVelocity = new THREE.Vector3().subVectors(
      this.velocity,
      otherBall.velocity
    );

    const velocityAlongNormal = relativeVelocity.dot(normal);

    // 공들이 서로 멀어지고 있으면 충돌 처리 안함
    if (velocityAlongNormal >= 0) return;

    // 반발 계수를 사용한 속도 계산
    const e = this.restitution;
    const impulse = -(1 + e) * velocityAlongNormal / 2;

    const impulseVector = normal.clone().multiplyScalar(impulse);
    this.velocity.add(impulseVector);
    otherBall.velocity.sub(impulseVector);
  }

  HandleWallCollisions() {
    const bounds = this.tableBounds;
    const damping = this.restitution;

    // X축 경계
    if (this.position.x - this.radius < bounds.minX) {
      this.position.x = bounds.minX + this.radius;
      this.velocity.x *= -damping;
    } else if (this.position.x + this.radius > bounds.maxX) {
      this.position.x = bounds.maxX - this.radius;
      this.velocity.x *= -damping;
    }

    // Z축 경계
    if (this.position.z - this.radius < bounds.minZ) {
      this.position.z = bounds.minZ + this.radius;
      this.velocity.z *= -damping;
    } else if (this.position.z + this.radius > bounds.maxZ) {
      this.position.z = bounds.maxZ - this.radius;
      this.velocity.z *= -damping;
    }
  }

  // 큐볼을 친다 (외부에서 호출 가능)
  ApplyForce(force) {
    this.velocity.add(force);
  }
}
