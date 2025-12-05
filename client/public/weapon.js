// public/weapon.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';

export let WEAPON_DATA = {};

// weapon_data.json 로드
export async function loadWeaponData() {
    try {
        const response = await fetch('./resources/data/weapon_data.json');
        WEAPON_DATA = await response.json();
        console.log('[weapon.js] Weapon data loaded:', WEAPON_DATA);
    } catch (error) {
        console.error('[weapon.js] Failed to load weapon data:', error);
    }
}

export class Weapon {
    constructor(scene, weaponName, position = new THREE.Vector3(0, 0, 0), uuid = null) {
        this.uuid = uuid || THREE.MathUtils.generateUUID();
        this.scene_ = scene;
        this.weaponName = weaponName;
        this.model_ = null;
        console.log('[weapon.js] Weapon constructor:', weaponName);

        if (Object.keys(WEAPON_DATA).length > 0) {
            this.LoadModel_(weaponName, position);
        } else {
            loadWeaponData().then(() => {
                this.LoadModel_(weaponName, position);
            });
        }
    }

    LoadModel_(weaponName, position) {
        console.log('[weapon.js] LoadModel_:', weaponName);
        const loader = new FBXLoader();
        loader.setPath('./resources/weapon/FBX/');

        loader.load(weaponName, (fbx) => {
            const model = fbx;
            if (/AssaultRifle|Pistol|Shotgun|SniperRifle|SubmachineGun/i.test(weaponName)) {
                model.scale.setScalar(0.005);
            } else {
                model.scale.setScalar(0.01);
            }
            model.position.copy(position);

            model.traverse((c) => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            });

            this.scene_.add(model);
            this.model_ = model;
            console.log(`[weapon.js] Weapon model ${weaponName} loaded at`, position);
        }, undefined, (error) => {
            console.error(`[weapon.js] Error loading weapon model ${weaponName}:`, error);
        });
    }
}

// 무작위 무기 이름을 반환하는 함수
export function getRandomWeaponName() {
    console.log('[weapon.js] getRandomWeaponName 호출');
    const weaponNames = Object.keys(WEAPON_DATA).filter(name => name !== 'Potion1_Filled.fbx');
    if (weaponNames.length === 0) {
        console.warn("[weapon.js] No weapons available to spawn (excluding Potion1_Filled.fbx).");
        return null;
    }
    const randomIndex = Math.floor(Math.random() * weaponNames.length);
    console.log('[weapon.js] 선택된 무기:', weaponNames[randomIndex]);
    return weaponNames[randomIndex];
}

// 맵에 무기를 생성하는 함수
export function spawnWeaponOnMap(scene, weaponName, x, y, z, uuid) {
    console.log('[weapon.js] spawnWeaponOnMap:', weaponName, x, y, z);
    const position = new THREE.Vector3(x, y, z);
    const weapon = new Weapon(scene, weaponName, position, uuid);
    return weapon;
}
