import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { MeleeProjectile } from './meleeProjectile.js';

export class AttackSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
  }

  spawnMeleeProjectile({
    position,
    direction,
    weapon,
    attacker,
    onHit,
    type = 'circle',
    angle = Math.PI / 2,
    radius = 3,
    speed
  }) {
    const projectile = new MeleeProjectile({
      scene: this.scene,
      position,
      direction,
      weapon,
      attacker,
      onHit,
      type,
      angle,
      radius,
      speed
    });
    this.projectiles.push(projectile);
    return projectile;
  }

  update(delta, players, npcs) {
    this.projectiles = this.projectiles.filter(p => !p.isDestroyed);
    for (const projectile of this.projectiles) {
      const allTargets = [...Object.values(players).filter(p => p.mesh_ && p !== projectile.attacker), ...npcs.filter(n => n.model_ && n !== projectile.attacker)];
      projectile.update(delta, allTargets);
    }
  }
}
