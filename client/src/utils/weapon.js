import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';

export let WEAPON_DATA = {};

export async function loadWeaponData() {
    try {
        const response = await fetch('./resources/data/weapon_data.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch weapon_data.json: ${response.statusText}`);
        }
        WEAPON_DATA = await response.json();
        console.log('Weapon data loaded successfully:', Object.keys(WEAPON_DATA).length, 'weapons');
    } catch (error) {
        console.error('Failed to load weapon data:', error);
    }
}

export class Weapon {
    constructor(scene, weaponName, position = new THREE.Vector3(0, 0, 0), uuid = null) {
        this.uuid = uuid || THREE.MathUtils.generateUUID();
        this.scene_ = scene;
        this.weaponName = weaponName;
        this.model_ = null;

        if (Object.keys(WEAPON_DATA).length > 0) {
            this.LoadModel_(weaponName, position);
        } else {
            loadWeaponData().then(() => {
                this.LoadModel_(weaponName, position);
            });
        }
    }

    LoadModel_(weaponName, position) {
        const loader = new FBXLoader();
        const modelPath = './resources/weapon/FBX/';
        loader.setPath(modelPath);
        
        const fullPath = modelPath + weaponName;
        console.log(`[Weapon] Loading: ${weaponName}`);
        console.log(`[Weapon] Full path: ${fullPath}`);

        loader.load(weaponName, (fbx) => {
            const model = fbx;
            if (/AssaultRifle|Pistol|Shotgun|SniperRifle|SubmachineGun|Revolver|Bullpup/i.test(weaponName)) {
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
            console.log(`✓ [Weapon] ${weaponName} loaded successfully at`, position);
        }, 
        (progressEvent) => {
            if (progressEvent.lengthComputable) {
                const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
                console.log(`[Weapon] Loading ${weaponName}: ${percentComplete.toFixed(1)}%`);
            }
        },
        (error) => {
            console.error(`✗ [Weapon] Error loading ${weaponName}:`, error);
            console.error(`[Weapon] Failed path: ${fullPath}`);
        });
    }
}

export function getRandomWeaponName() {
    const weaponNames = Object.keys(WEAPON_DATA).filter(name => name !== 'Potion1_Filled.fbx');
    if (weaponNames.length === 0) {
        console.warn("⚠ No weapons available to spawn. WEAPON_DATA is empty.", Object.keys(WEAPON_DATA));
        return null;
    }
    const randomIndex = Math.floor(Math.random() * weaponNames.length);
    const selectedWeapon = weaponNames[randomIndex];
    console.log(`Random weapon selected: ${selectedWeapon} from ${weaponNames.length} available weapons`);
    return selectedWeapon;
}

export function spawnWeaponOnMap(scene, weaponName, x, y, z, uuid) {
    const position = new THREE.Vector3(x, y, z);
    const weapon = new Weapon(scene, weaponName, position, uuid);
    return weapon;
}
