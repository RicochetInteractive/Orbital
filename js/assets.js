'use strict';
// Recursos locales: funcionan también al abrir el HTML sin servidor.
const spriteSources = {
    "worker": "assets/sprites/worker.png",
    "soldier": "assets/sprites/soldier.png",
    "scout": "assets/sprites/scout.png",
    "medic": "assets/sprites/medic.png",
    "raider": "assets/sprites/raider.png",
    "ground": "assets/sprites/ground.png",
    "ore": "assets/sprites/ore.png",
    "base": "assets/sprites/base.png",
    "depot": "assets/sprites/depot.png",
    "barracks": "assets/sprites/barracks.png",
    "workshop": "assets/sprites/workshop.png",
    "refinery": "assets/sprites/refinery.png",
    "tower": "assets/sprites/tower.png",
    "tank": "assets/sprites/tank.png",
    "towerRed": "assets/sprites/towerRed.png",
    "brute": "assets/sprites/brute.png",
    "drone": "assets/sprites/drone.png",
    "artillery": "assets/sprites/artillery.png",
    "ship": "assets/sprites/ship.png",
    "transport": "assets/sprites/transport.png",
    "plasma": "assets/sprites/plasma.png",
    "lab": "assets/sprites/lab.png",
    "hangar": "assets/sprites/hangar.png",
    "ranger": "assets/sprites/ranger.png",
    "mech": "assets/sprites/mech.png",
    "wraith": "assets/sprites/wraith.png",
    "castle": "assets/sprites/castle.png"
};
const sprites = {};
for (const [key, url] of Object.entries(spriteSources)) {
    const image = new Image();
    image.src = url;
    sprites[key] = image;
}
