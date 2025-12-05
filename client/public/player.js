import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';
import { WEAPON_DATA } from './weapon.js';

export const player = (() => {
  class Player {
    constructor(name, health, damage, defense, speed, x, y, z) {
      this.name = name;
      this.health = health;
      this.maxHealth = health;
      this.damage = damage;
      this.defense = defense;
      this.speed = speed;
      this.position = new THREE.Vector3(x, y, z);
      this.rotation = new THREE.Vector3(0, 0, 0);
      this.model = null;
      this.animations = null;
      this.mixer = null;
      this.action = null;
      this.weapon = null;
      this.isAttacking = false;
      this.isDead = false;
    }

    async loadModel(url) {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      this.model = gltf.scene;
      this.animations = gltf.animations;
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    async loadFBX(url) {
      const loader = new FBXLoader();
      const fbx = await loader.loadAsync(url);
      this.model = fbx;
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    setAnimation(actionName) {
      if (this.mixer && this.animations) {
        const clip = this.animations.find((a) => a.name === actionName);
        if (clip) {
          this.action = this.mixer.clipAction(clip);
          this.action.play();
        }
      }
    }

    attack() {
      if (this.isAttacking || this.isDead) return;
      this.isAttacking = true;
      this.setAnimation('attack');
      setTimeout(() => {
        this.isAttacking = false;
      }, 1000);
    }

    takeDamage(amount) {
      if (this.isDead) return;
      const damage = Math.max(0, amount - this.defense);
      this.health -= damage;
      if (this.health <= 0) {
        this.health = 0;
        this.die();
      }
    }

    heal(amount) {
      this.health = Math.min(this.maxHealth, this.health + amount);
    }

    die() {
      this.isDead = true;
      this.setAnimation('die');
      setTimeout(() => {
        this.model.visible = false;
      }, 1000);
    }

    moveForward(distance) {
      const direction = new THREE.Vector3();
      this.getDirection(direction);
      direction.y = 0;
      direction.normalize();
      this.position.add(direction.multiplyScalar(distance));
    }

    moveBackward(distance) {
      const direction = new THREE.Vector3();
      this.getDirection(direction);
      direction.y = 0;
      direction.normalize();
      this.position.add(direction.multiplyScalar(-distance));
    }

    moveLeft(distance) {
      const direction = new THREE.Vector3();
      this.getDirection(direction);
      direction.y = 0;
      direction.normalize();
      const right = new THREE.Vector3(-direction.z, 0, direction.x);
      this.position.add(right.multiplyScalar(-distance));
    }

    moveRight(distance) {
      const direction = new THREE.Vector3();
      this.getDirection(direction);
      direction.y = 0;
      direction.normalize();
      const right = new THREE.Vector3(-direction.z, 0, direction.x);
      this.position.add(right.multiplyScalar(distance));
    }

    getDirection(result) {
      const euler = new THREE.Euler(0, this.rotation.y, 0);
      result.set(0, 0, -1);
      result.applyEuler(euler);
    }

    update(delta) {
      if (this.mixer) this.mixer.update(delta);
    }
  }

  return {
    Player: Player,
  };
})();
