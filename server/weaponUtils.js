const fs = require('fs');
const path = require('path');


let WEAPON_DATA = {};
let weaponDataLoaded = false;

async function loadWeaponData() {
    try {
        // client/public 경로로 수정
        const dataPath = path.join(__dirname, '..', 'client', 'public', 'resources', 'data', 'weapon_data.json');
        console.log(`Server: Attempting to load weapon data from: ${dataPath}`);
        const data = await fs.promises.readFile(dataPath, 'utf8');
        WEAPON_DATA = JSON.parse(data);
        weaponDataLoaded = true;
        console.log(`Server: ✓ Weapon data loaded successfully. Total weapons: ${Object.keys(WEAPON_DATA).length}`);
        console.log(`Server: Available weapons: ${Object.keys(WEAPON_DATA).slice(0, 5).join(', ')}...`);
        return true;
    } catch (error) {
        console.error('Server: ✗ Failed to load weapon data:', error.message);
        weaponDataLoaded = false;
        return false;
    }
}

async function getRandomWeaponName() {
    // 만약 아직 로드되지 않았으면 로드 시도
    if (!weaponDataLoaded) {
        console.warn("Server: Weapon data not loaded yet, loading now...");
        await loadWeaponData();
    }
    
    const weaponNames = Object.keys(WEAPON_DATA).filter(name => name !== 'Potion1_Filled.fbx');
    if (weaponNames.length === 0) {
        console.warn("Server: No weapons available to spawn. WEAPON_DATA keys:", Object.keys(WEAPON_DATA));
        return null;
    }
    const randomIndex = Math.floor(Math.random() * weaponNames.length);
    const selectedWeapon = weaponNames[randomIndex];
    console.log(`Server: Random weapon selected: ${selectedWeapon}`);
    return selectedWeapon;
}

// Load weapon data when the module is first loaded
loadWeaponData().then(() => {
    console.log('Server: Weapon module initialized with data');
}).catch((error) => {
    console.error('Server: Failed to initialize weapon module:', error);
});

module.exports = {
    WEAPON_DATA,
    loadWeaponData,
    getRandomWeaponName
};
