// Estado compartido de la partida y referencias a los lienzos. Se carga primero.
'use strict';
const c = document.querySelector('#game'), g = c.getContext('2d'), mini = document.querySelector('#minimap'), mg = mini.getContext('2d'), $ = id => document.getElementById(id), W = 2400, H = 1500, T = 40, COLS = W / T, ROWS = Math.ceil(H / T);
const miniTerrain = document.createElement('canvas');
miniTerrain.width = 210;
miniTerrain.height = 130;
const terrainInk = miniTerrain.getContext('2d');
const camera = { x: 0, y: 0, zoom: 1, dpr: 1 };
let gesture = null, drag = null, pointer = null, ghost = null, mode = '', faction = '', seed = 0, rng, terrain = [], units = [], buildings = [], nodes = [], particles = [], selected = [], ore = 0, plasma = 0, seconds = 0, enemyTimer = 0, aiTimer = 0, trackTimer = 0, aiBank = {}, aiTech = {}, aiPlans = {}, villages = [], ended = false, started = false, last = 0, message = '', messageUntil = 0, lastUi = 0;
let upgrades = { damage: 0, armor: 0, engine: 0 };
