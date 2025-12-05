import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

export var hp = (() => { //%%수정
  class HPUI {
    constructor(scene, renderer, playerName = 'Player', playerId, onDeath = null) { //%%수정됨
      this.scene = scene;
      this.renderer = renderer;
      this.playerName = playerName;
      this.playerId = playerId; //%%수정됨
      this.hp = 100;
      this.maxHp = 100; // Max HP is always 100 for players
      this.onDeath = onDeath; //%%수정됨
      this.lastAttackerId = null; //%%수정됨

      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.canvas.width = 256; // Increased width for better text rendering
      this.canvas.height = 64; // Increased height for better bar and text

      this.texture = new THREE.CanvasTexture(this.canvas);
      this.material = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
      this.sprite = new THREE.Sprite(this.material);
      this.sprite.scale.set(2.2, 0.55, 1); // Adjust scale to fit above head
      this.scene.add(this.sprite);

      this.playerMesh = null;
      this.headBone = null;
      this.offset = new THREE.Vector3(0, 1.9, 0); // Offset above the character's head

      this.drawUI();
    }

    setPlayerTarget(playerMesh, headBone) {
      this.playerMesh = playerMesh;
      this.headBone = headBone;
    }

    updateHP(newHp) {
      this.hp = newHp;
      if (this.hp <= 0) {
        this.hp = 0;
        if (this.onDeath) {
          this.onDeath(this.playerId, this.lastAttackerId); //%%수정됨
        }
      }
      this.drawUI();
    }

    setLastAttacker(attackerId) {
      this.lastAttackerId = attackerId; //%%수정됨
    }

    drawUI() {
      var ctx = this.context; //%%수정
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Player Name
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.playerName, this.canvas.width / 2, this.canvas.height / 4);

      // HP Bar Background
      var barWidth = this.canvas.width * 0.8; //%%수정
      var barHeight = this.canvas.height / 4; //%%수정
      var barX = (this.canvas.width - barWidth) / 2; //%%수정
      var barY = this.canvas.height / 2 + 5; // Position below name //%%수정
      ctx.fillStyle = '#555';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // HP Bar Fill
      var hpWidth = (this.hp / this.maxHp) * barWidth; //%%수정
      ctx.fillStyle = 'red';
      ctx.fillRect(barX, barY, hpWidth, barHeight);

      // HP Text
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`${Math.round(this.hp)} / ${this.maxHp}`, this.canvas.width / 2, barY + barHeight / 2 + 5);

      this.texture.needsUpdate = true;
    }

    updatePosition() {
      if (this.playerMesh && this.headBone) {
        var headWorldPosition = new THREE.Vector3(); //%%수정
        this.headBone.getWorldPosition(headWorldPosition);
        this.sprite.position.copy(headWorldPosition).add(this.offset);
      } else if (this.playerMesh) {
        // headBone이 없는 경우를 대비하여 기존 로직 유지 (fallback)
        var playerWorldPosition = new THREE.Vector3(); //%%수정
        this.playerMesh.getWorldPosition(playerWorldPosition);
        this.sprite.position.copy(playerWorldPosition).add(this.offset);
      }
    }

    hide() {
      this.sprite.visible = false;
    }

    show() {
      this.sprite.visible = true;
    }

    dispose() {
      this.scene.remove(this.sprite);
      this.material.dispose();
      this.texture.dispose();
    }
  }

  return { HPUI };
})();