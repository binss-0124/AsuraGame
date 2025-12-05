import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

export var hp = (() => { //%%수정
  class HPUI {
    constructor(scene, camera) {
      this.scene = scene;
      this.camera = camera;
      this.health = 100;
      this.maxHealth = 100;
      this.barWidth = 50;
      this.barHeight = 5;
      this.borderRadius = 2;
      this.bgColor = 0xff0000;
      this.fgColor = 0x00ff00;
      this.borderColor = 0x000000;
      this.borderThickness = 1;
      this.position = new THREE.Vector3(10, 10, 0);
      this.visible = true;

      this.init();
    }

    init() {
      this.createHealthBar();
      this.updateHealthBar();
    }

    createHealthBar() {
      const { scene, position, barWidth, barHeight, borderRadius, borderColor, borderThickness } = this;

      // Create the health bar background
      const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight, 1, 1);
      const bgMaterial = new THREE.MeshBasicMaterial({ color: borderColor });
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      bgMesh.position.copy(position);
      scene.add(bgMesh);
      this.bgMesh = bgMesh;

      // Create the health bar foreground
      const fgGeometry = new THREE.PlaneGeometry(barWidth - borderThickness * 2, barHeight - borderThickness * 2, 1, 1);
      const fgMaterial = new THREE.MeshBasicMaterial({ color: this.fgColor });
      const fgMesh = new THREE.Mesh(fgGeometry, fgMaterial);
      fgMesh.position.copy(position);
      fgMesh.position.x += borderThickness;
      fgMesh.position.y -= borderThickness;
      scene.add(fgMesh);
      this.fgMesh = fgMesh;
    }

    updateHealthBar() {
      const { health, maxHealth, fgMesh, barWidth, borderThickness } = this;

      // Calculate the width of the foreground mesh based on the current health
      const fgWidth = (health / maxHealth) * (barWidth - borderThickness * 2);

      // Update the scale of the foreground mesh
      fgMesh.scale.x = fgWidth;
    }

    setHealth(health) {
      this.health = health;
      this.updateHealthBar();
    }

    setPosition(x, y, z) {
      this.position.set(x, y, z);
      this.bgMesh.position.copy(this.position);
      this.fgMesh.position.copy(this.position);
      this.fgMesh.position.x += this.borderThickness;
      this.fgMesh.position.y -= this.borderThickness;
    }

    setVisible(visible) {
      this.visible = visible;
      this.bgMesh.visible = visible;
      this.fgMesh.visible = visible;
    }
  }

  return { HPUI };
})();
