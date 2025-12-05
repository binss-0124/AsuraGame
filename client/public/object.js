import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js';

export const object = (() => { //%%수정
  class NatureObject {
    constructor(scene, params = {}) {
      this.scene_ = scene;
      this.models_ = [];
      this.collidables_ = []; // 충돌 대상 오브젝트 배열
      this.debugHelpers_ = [];
      this.hp_ = 100;
      this.isDead_ = false;
      console.log('[object.js] NatureObject 생성됨', params);
      this.LoadModels_();
    }

    TakeDamage(amount) {
      if (this.isDead_) return;
      this.hp_ -= amount;
      if (this.hp_ < 0) this.hp_ = 0;
      console.log(`[object.js] NatureObject 피해: ${amount}, 남은 HP: ${this.hp_}`);
      if (this.hp_ === 0) {
        this.isDead_ = true;
        console.log('[object.js] NatureObject 사망!');
      }
    }

    canTakeDamage() {
      return !this.isDead_;
    }

    LoadModels_() {
      console.log('[object.js] 모델 로딩 시작');
      const fbxLoader = new FBXLoader();
      const gltfLoader = new GLTFLoader();
      const carLoader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();
      // ...existing code...
      // 모델 로딩 완료 후
      console.log('[object.js] 모델 로딩 완료');
    }

    OnModelLoaded_(model, modelInfo, textureLoader) {
      console.log('[object.js] 모델 로드됨:', modelInfo.filename);
      // ...existing code...
    }

    Update(timeElapsed) {
      // ...existing code...
      console.log('[object.js] NatureObject Update 호출', timeElapsed);
    }

    ToggleDebugVisuals(visible) {
      console.log(`[object.js] 디버그 바운딩박스 ${visible ? '표시' : '숨김'}`);
      // ...existing code...
    }

    GetCollidables() {
      console.log('[object.js] GetCollidables 호출');
      return this.collidables_;
    }
  }

  return {
    NPC: NatureObject,
  };
})();
