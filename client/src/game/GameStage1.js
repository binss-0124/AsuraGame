import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js';
import { player } from '../utils/player.js';
import { object } from '../utils/object.js';
import { math } from '../utils/math.js';
import { hp } from '../utils/hp.js';
import { WEAPON_DATA, loadWeaponData, spawnWeaponOnMap, getRandomWeaponName } from '../utils/weapon.js';
import { AttackSystem } from '../utils/attackSystem.js';
import { UI } from '../utils/ui.js';

export class GameStage1 {
  constructor(socket, players, map, spawnedWeapons, onGameEnd) {
    this.socket = socket;
    this.players = {};
    this.localPlayerId = socket.id;
    this.playerInfo = players;
    this.map = map;
    this.spawnedWeapons = spawnedWeapons;
    this.spawnedWeaponObjects = [];
    this.onGameEnd = onGameEnd;
    this.ui = new UI({ 
      onBackToLobbyClick: () => {
        if (this.onGameEnd) {
          this.onGameEnd();
        }
      }
    });

    this.Initialize().then(() => {
      this.RAF();
      this.SetupSocketEvents();
    });
  }

  async Initialize() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.gammaFactor = 2.2;
    document.getElementById('container').appendChild(this.renderer.domElement);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 2000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(-8, 6, 12);
    this.camera.lookAt(0, 2, 0);

    this.scene = new THREE.Scene();

    this.SetupLighting();
    this.SetupSkyAndFog();
    this.CreateGround();
    this.attackSystem = new AttackSystem(this.scene);
    this.CreateLocalPlayer();

    await loadWeaponData();
    for (const weaponData of this.spawnedWeapons) {
      const weapon = spawnWeaponOnMap(this.scene, weaponData.weaponName, weaponData.x, weaponData.y, weaponData.z, weaponData.uuid);
      this.spawnedWeaponObjects.push(weapon);
    }
    this.mapBounds = { minX: -40, maxX: 40, minZ: -40, maxZ: 40 };
    this.damageTimer = 0;
    this.damageInterval = 0.5;
    this.damageAmount = 25;
    this.isRespawning = false;

    window.addEventListener('resize', () => this.OnWindowResize(), false);
    document.addEventListener('keydown', (e) => this._OnKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._OnKeyUp(e), false);
  }

  SetupLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(60, 100, 10);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001;
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
    const capitalizedMapName = this.map.charAt(0).toUpperCase() + this.map.slice(1);
    const grassTexture = textureLoader.load(`/resources/${capitalizedMapName}.png`);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(1, 1);

    const groundGeometry = new THREE.PlaneGeometry(80, 80, 10, 10);
    const groundMaterial = new THREE.MeshLambertMaterial({ map: grassTexture });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  getRandomPosition() {
    const maxAttempts = 100;
    const playerHalfWidth = 0.65;
    const playerHalfDepth = 0.65;
    const playerHeight = 3.2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * 80 - 40;
      const z = Math.random() * 80 - 40;
      let y = 0.5;

      const collidables = this.npc_.GetCollidables();
      const checkPosition = new THREE.Vector3(x, 100, z);
      const raycaster = new THREE.Raycaster(checkPosition, new THREE.Vector3(0, -1, 0));

      let highestY = -Infinity;
      let objectFound = false;

      for (const collidable of collidables) {
        const intersects = raycaster.intersectObject(collidable.model, true);
        if (intersects.length > 0) {
          const intersection = intersects[0];
          if (intersection.point.y > highestY) {
            highestY = intersection.point.y;
            objectFound = true;
          }
        }
      }

      if (objectFound) {
        y = highestY + 0.1;
      }

      const tempPlayerBox = new THREE.Box3(
        new THREE.Vector3(x - playerHalfWidth, y, z - playerHalfDepth),
        new THREE.Vector3(x + playerHalfWidth, y + playerHeight, z + playerHalfDepth)
      );

      let isColliding = false;
      for (const collidable of collidables) {
        if (tempPlayerBox.intersectsBox(collidable.boundingBox)) {
          isColliding = true;
          break;
        }
      }

      if (!isColliding) {
        return new THREE.Vector3(x, y, z);
      }
    }

    console.warn("Failed to find a non-colliding spawn position after multiple attempts.");
    return new THREE.Vector3(0, 0.5, 0);
  }

  CreateLocalPlayer() {
    const npcPos = new THREE.Vector3(0, 0, -4);
    this.npc_ = new object.NPC(this.scene, npcPos);

    const localPlayerData = this.playerInfo.find(p => p.id === this.localPlayerId);

    this.player_ = new player.Player({
      scene: this.scene,
      onDebugToggle: (visible) => this.npc_.ToggleDebugVisuals(visible),
      character: localPlayerData.character,
      nickname: localPlayerData.nickname,
      hpUI: new hp.HPUI(this.scene, this.renderer, localPlayerData.nickname, this.localPlayerId, this.onPlayerDeath.bind(this)),
      getRespawnPosition: () => this.getRandomPosition(),
      attackSystem: this.attackSystem,
      socket: this.socket,
      onLoad: () => {
        const initialPosition = this.getRandomPosition();
        this.player_.SetPosition([initialPosition.x, initialPosition.y, initialPosition.z]);
      }
    });

    this.cameraTargetOffset = new THREE.Vector3(0, 15, 10);
    this.rotationAngle = 4.715;
  }

  onPlayerDeath(victimId, attackerId) {
    console.log(`Player ${victimId} died. Attacker: ${attackerId}`);
    this.socket.emit('playerDied', { victimId: victimId, attackerId: attackerId });
  }

  OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  UpdateCamera() {
    if (!this.player_ || !this.player_.mesh_) return;

    const target = this.player_.mesh_.position.clone();
    const offset = this.cameraTargetOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationAngle);
    const cameraPos = target.clone().add(offset);
    this.camera.position.copy(cameraPos);

    const headOffset = new THREE.Vector3(0, 2, 0);
    const headPosition = target.clone().add(headOffset);
    this.camera.lookAt(headPosition);
  }

  SetupSocketEvents() {
    this.socket.on('gameUpdate', (data) => {
      if (data.playerId === this.localPlayerId) return;

      let otherPlayer = this.players[data.playerId];
      if (!otherPlayer) {
        const remotePlayerData = this.playerInfo.find(p => p.id === data.playerId);
        otherPlayer = new player.Player({
          scene: this.scene,
          character: remotePlayerData.character,
          nickname: remotePlayerData.nickname,
          isRemote: true,
          playerId: remotePlayerData.id,
          hpUI: new hp.HPUI(this.scene, this.renderer, remotePlayerData.nickname, remotePlayerData.id, this.onPlayerDeath.bind(this)),
          attackSystem: this.attackSystem,
          socket: this.socket
        });
        this.players[data.playerId] = otherPlayer;
      }
      otherPlayer.SetPosition(data.position);
      otherPlayer.SetRotation(data.rotation);
      if (data.animation) {
        otherPlayer.SetRemoteAnimation(data.animation);
      }
      if (data.hp !== undefined) {
        otherPlayer.hp_ = data.hp;
        if (otherPlayer.hpUI) {
          otherPlayer.hpUI.updateHP(data.hp);
        }
        if (data.hp <= 0 && !otherPlayer.isDead_) {
          otherPlayer.isDead_ = true;
          otherPlayer.SetRemoteAnimation('Death');
        } else if (data.hp > 0 && otherPlayer.isDead_) {
          otherPlayer.isDead_ = false;
          otherPlayer.SetRemoteAnimation('Idle');
        }
      }
      if (data.equippedWeapon !== undefined) {
        const currentEquippedWeapon = otherPlayer.currentWeaponModel ? otherPlayer.currentWeaponModel.userData.weaponName : null;
        if (data.equippedWeapon !== currentEquippedWeapon) {
          if (data.equippedWeapon) {
            otherPlayer.EquipWeapon(data.equippedWeapon);
          } else {
            otherPlayer.UnequipWeapon();
          }
        }
      }
    });

    this.socket.on('playerJoined', (playerId) => {
      console.log(`Player ${playerId} joined the room.`);
    });

    this.socket.on('playerLeft', (playerId) => {
      console.log(`Player ${playerId} left the room.`);
      const otherPlayer = this.players[playerId];
      if (otherPlayer) {
        this.scene.remove(otherPlayer.mesh_);
        delete this.players[playerId];
      }
    });

    this.socket.on('weaponPickedUp', (weaponUuid) => {
      const pickedUpWeapon = this.spawnedWeaponObjects.find(w => w.uuid === weaponUuid);
      if (pickedUpWeapon) {
        this.scene.remove(pickedUpWeapon.model_);
        this.spawnedWeaponObjects = this.spawnedWeaponObjects.filter(w => w.uuid !== weaponUuid);
        console.log(`Weapon ${weaponUuid} removed from scene.`);
      }
    });

    this.socket.on('weaponSpawned', (weaponData) => {
      const weapon = spawnWeaponOnMap(this.scene, weaponData.weaponName, weaponData.x, weaponData.y, weaponData.z, weaponData.uuid);
      this.spawnedWeaponObjects.push(weapon);
      console.log(`Weapon ${weaponData.uuid} spawned on scene.`);
    });

    this.socket.on('playerAttack', (data) => {
      if (data.playerId === this.localPlayerId) return;
      const otherPlayer = this.players[data.playerId];
      if (otherPlayer) {
        otherPlayer.PlayAttackAnimation(data.animationName);
      }
    });

    this.socket.on('hpUpdate', (data) => {
      console.log(`[Main] Received hpUpdate: playerId=${data.playerId}, hp=${data.hp}`);
      const targetPlayer = (data.playerId === this.localPlayerId) ? this.player_ : this.players[data.playerId];
      if (targetPlayer) {
        const oldHp = targetPlayer.hp_;
        targetPlayer.hp_ = data.hp;
        if (data.attackerId) {
          targetPlayer.hpUI.setLastAttacker(data.attackerId);
        }
        targetPlayer.hpUI.updateHP(data.hp);
        console.log(`[Main] ${targetPlayer.nickname_}'s HP updated to: ${targetPlayer.hp_}`);

        if (data.hp <= 0 && !targetPlayer.isDead_) {
          targetPlayer.isDead_ = true;
          targetPlayer.SetAnimation_('Death');
          if (data.playerId === this.localPlayerId) {
            targetPlayer.DisableInput_();
            targetPlayer.respawnTimer_ = targetPlayer.respawnDelay_;
            if (targetPlayer.overlay) {
              targetPlayer.overlay.style.visibility = 'visible';
              targetPlayer.startCountdown();
            }
          }
        } else if (data.hp > 0 && targetPlayer.isDead_) {
          targetPlayer.isDead_ = false;
          targetPlayer.Respawn_();
        } else if (data.hp < oldHp) {
          if (data.playerId === this.localPlayerId && targetPlayer.hitEffect) {
            targetPlayer.hitEffect.style.opacity = '1';
            setTimeout(() => {
              targetPlayer.hitEffect.style.opacity = '0';
            }, 100);
          }
          if (targetPlayer.hp_ > 0) {
            targetPlayer.SetAnimation_('receievehit');
          }
        }
      }
    });
  }

  _OnKeyDown(event) {
    if (event.code === 'Tab') {
      event.preventDefault();
      this.ui.showScoreboard();
    }
    switch (event.keyCode) {
      case 69: // E key
        if (this.player_ && this.player_.mesh_) {
          const playerPosition = this.player_.mesh_.position;
          let pickedUp = false;
          for (let i = 0; i < this.spawnedWeaponObjects.length; i++) {
            const weapon = this.spawnedWeaponObjects[i];
            if (weapon.model_) {
              const distance = playerPosition.distanceTo(weapon.model_.position);
              if (distance < 2.0) {
                this.scene.remove(weapon.model_);
                this.spawnedWeaponObjects.splice(i, 1);
                this.socket.emit('weaponPickedUp', weapon.uuid);
                this.player_.EquipWeapon(weapon.weaponName);
                this.socket.emit('weaponEquipped', weapon.weaponName);
                pickedUp = true;

                const newWeaponName = getRandomWeaponName();
                if (newWeaponName) {
                  const newSpawnPosition = this.getRandomPosition();
                  const newWeaponUuid = THREE.MathUtils.generateUUID();
                  const newWeapon = spawnWeaponOnMap(this.scene, newWeaponName, newSpawnPosition.x, newSpawnPosition.y, newSpawnPosition.z, newWeaponUuid);
                  this.spawnedWeaponObjects.push(newWeapon);
                  this.socket.emit('weaponSpawned', {
                    weaponName: newWeaponName,
                    x: newSpawnPosition.x,
                    y: newSpawnPosition.y,
                    z: newSpawnPosition.z,
                    uuid: newWeaponUuid
                  });
                }
                break;
              }
            }
          }
        }
        break;
      case 74: // J key
        if (this.player_ && this.player_.mesh_) {
          let attackAnimation = 'SwordSlash';
          if (this.player_.currentWeaponModel && this.player_.currentWeaponModel.userData.weaponName) {
            const weaponName = this.player_.currentWeaponModel.userData.weaponName;
            if (/Pistol|Shotgun|SniperRifle|AssaultRifle|Bow/i.test(weaponName)) {
              attackAnimation = 'Shoot_OneHanded';
            } else if (/Sword|Axe|Dagger|Hammer/i.test(weaponName)) {
              attackAnimation = 'SwordSlash';
            }
          }
          this.player_.PlayAttackAnimation(attackAnimation);
          this.socket.emit('playerAttack', attackAnimation);
        }
        break;
    }
  }

  _OnKeyUp(event) {
    if (event.code === 'Tab') {
      this.ui.hideScoreboard();
    }
  }

  RAF(time) {
    requestAnimationFrame((t) => this.RAF(t));

    if (!this.prevTime) this.prevTime = time || performance.now();
    const delta = ((time || performance.now()) - this.prevTime) * 0.001;
    this.prevTime = time || performance.now();

    if (this.player_ && this.player_.mesh_) {
      this.player_.Update(delta, this.rotationAngle, this.npc_.GetCollidables());
      this.UpdateCamera();

      this.socket.emit('gameUpdate', {
        playerId: this.localPlayerId,
        position: this.player_.mesh_.position.toArray(),
        rotation: this.player_.mesh_.rotation.toArray(),
        animation: this.player_.currentAnimationName_,
        hp: this.player_.hp_,
        equippedWeapon: this.player_.currentWeaponModel ? this.player_.currentWeaponModel.userData.weaponName : null,
        isAttacking: this.player_.isAttacking_
      });

      const playerPos = this.player_.mesh_.position;
      const isOutOfBounds = (
        playerPos.x < this.mapBounds.minX ||
        playerPos.x > this.mapBounds.maxX ||
        playerPos.z < this.mapBounds.minZ ||
        playerPos.z > this.mapBounds.maxZ
      );
      
      if (isOutOfBounds) {
        this.damageTimer += delta;
        if (this.damageTimer >= this.damageInterval) {
          if (!this.player_.isDead_) {
            // 로컬에서 즉시 HP 감소
            this.player_.hp_ -= this.damageAmount;
            if (this.player_.hp_ < 0) this.player_.hp_ = 0;
            console.log(`[GameStage1] 경계 밖 데미지: 위치=(${playerPos.x.toFixed(2)}, ${playerPos.z.toFixed(2)}) | HP: ${this.player_.hp_}`);
            
            // 서버에 알림
            this.socket.emit('playerDamage', { targetId: this.localPlayerId, damage: this.damageAmount, attackerId: null });
          }
          this.damageTimer = 0;
        }
      } else {
        this.damageTimer = 0;
      }

      if (this.player_.hpUI) {
        this.player_.hpUI.updateHP(this.player_.hp_);
      }
    }

    for (const id in this.players) {
      this.players[id].Update(delta);
    }

    if (this.npc_) {
      this.npc_.Update(delta);
    }

    this.attackSystem.update(delta, Object.values(this.players), [this.npc_]);

    this.renderer.render(this.scene, this.camera);
  }
}
