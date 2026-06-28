// ui/controls.js
import { EvolutionEngine } from '../core/engine.js';
import { ArenaRenderer } from '../display/arena.js';
import { AnalyticsCharts } from '../display/charts.js';
import { calculateClassWealth, createAgent } from '../core/economy.js';
import { STRATEGIES } from '../core/strategies.js';

// Configuration de la grille
const GRID_WIDTH = 40;
const GRID_HEIGHT = 40;
const FILL_RATE = 0.75; // 75% de la grille est remplie pour laisser de la place aux migrations

let engine, renderer, charts;
let animationId = null;
let isRunning = false;
let isDrawing = false;
let GRID_WIDTH = 40;
let GRID_HEIGHT = 40;

// --- INITIALISATION ---

function init() {
    // 1. Initialisation des composants graphiques
    renderer = new ArenaRenderer('arena-canvas');
    charts = new AnalyticsCharts('line-chart', 'barycentric-canvas');
    
    // Injecter dynamiquement le sélecteur de stratégie pour le pinceau (Brush Tool)
    injectBrushUI();

    // 2. Configuration initiale et reset du moteur
    resetSimulation();

    // 3. Liaison des écouteurs d'événements UI
    setupEventListeners();
}

/**
 * Génère une nouvelle population selon les paramètres des curseurs
 */
function resetSimulation() {
    if (animationId) cancelAnimationFrame(animationId);
    isRunning = false;
    updateActionButtons();
    // Lecture dynamique de la taille choisie
    const size = parseInt(document.getElementById('arena-size-selector').value);
    GRID_WIDTH = size;
    GRID_HEIGHT = size;

    const gini = parseFloat(document.getElementById('gini-slider').value);
    const baseNoise = parseFloat(document.getElementById('noise-slider').value) / 100;
    const mode = document.querySelector('input[name="game-mode"]:checked').value;

    engine = new EvolutionEngine(GRID_WIDTH, GRID_HEIGHT, mode);
    engine.imitationChance = parseFloat(document.getElementById('imitation-slider').value) / 100;
    engine.mobilitySpeed = parseFloat(document.getElementById('mobility-speed-slider').value) / 100;
    
    charts.reset();

    const totalCells = GRID_WIDTH * GRID_HEIGHT;
    const totalAgents = Math.floor(totalCells * FILL_RATE);

    // Calcul de la répartition de la population (10% Riches, 50% Classes Moyennes, 40% Pauvres)
    const countRich = Math.floor(totalAgents * 0.1);
    const countMiddle = Math.floor(totalAgents * 0.5);
    const countPoor = totalAgents - countRich - countMiddle;

    // Calcul de la fortune de départ par classe selon Gini
    const classWealth = calculateClassWealth(totalAgents, gini);

    // Génération de la liste à plat des agents
    const agentsList = [];
    let idCounter = 0;

    for (let i = 0; i < countRich; i++)  agentsList.push(createAgent(idCounter++, 'RICH', classWealth.RICH, baseNoise));
    for (let i = 0; i < countMiddle; i++) agentsList.push(createAgent(idCounter++, 'MIDDLE', classWealth.MIDDLE, baseNoise));
    for (let i = 0; i < countPoor; i++)   agentsList.push(createAgent(idCounter++, 'POOR', classWealth.POOR, baseNoise));

    // Distribution des stratégies de manière équitable au départ
    const strategyNames = Object.keys(STRATEGIES);
    agentsList.forEach((agent, index) => {
        agent.strategy = strategyNames[index % strategyNames.length];
    });

    // Placement aléatoire sur la grille
    const coordinates = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) coordinates.push({ x, y });
    }
    shuffleArray(coordinates);

    agentsList.forEach((agent, index) => {
        const coord = coordinates[index];
        agent.x = coord.x;
        agent.y = coord.y;
        engine.grid[coord.y][coord.x] = agent;
    });

    // Rendu initial
    renderer.render(engine);
    updateAnalytics();
}

// --- BOUCLE DE SIMULATION ---

function simulationLoop() {
    if (!isRunning) return;

    engine.step();
    renderer.render(engine);
    updateAnalytics();

    animationId = requestAnimationFrame(simulationLoop);
}

function updateAnalytics() {
    const counts = {};
    Object.keys(STRATEGIES).forEach(strat => counts[strat] = 0);

    let totalWealthRich = 0, countRich = 0;
    let totalWealthPoor = 0, countPoor = 0;

    engine.forEachAgent(agent => {
        // Compte des stratégies pour les graphiques
        counts[agent.strategy]++;

        // Calcul des richesses accumulées
        if (agent.class === 'RICH') {
            totalWealthRich += agent.wealth;
            countRich++;
        } else if (agent.class === 'POOR') {
            totalWealthPoor += agent.wealth;
            countPoor++;
        }
    });

    // Calcul des moyennes
    const avgRich = countRich > 0 ? (totalWealthRich / countRich) : 0;
    const avgPoor = countPoor > 0 ? (totalWealthPoor / countPoor) : 0;
    const gapRatio = avgPoor > 0 ? (avgRich / avgPoor) : avgRich;

    // Injection dans le tableau de bord HTML
    document.getElementById('stat-wealth-rich').textContent = avgRich.toFixed(1);
    document.getElementById('stat-wealth-poor').textContent = avgPoor.toFixed(1);
    document.getElementById('stat-wealth-gap').textContent = gapRatio.toFixed(1) + "x";
    document.getElementById('stat-migrations').textContent = engine.lastTurnMigrations || 0;

    charts.update(engine.generation, counts);
}

// --- GESTION DES ÉVÉNEMENTS & BRUSH TOOL ---

function setupEventListeners() {
    // Boutons de contrôle
    document.getElementById('btn-play').addEventListener('click', () => {
        if (!isRunning) { isRunning = true; updateActionButtons(); simulationLoop(); }
    });
    document.getElementById('btn-pause').addEventListener('click', () => {
        isRunning = false; updateActionButtons(); if (animationId) cancelAnimationFrame(animationId);
    });
    document.getElementById('btn-step').addEventListener('click', () => {
        if (!isRunning) { engine.step(); renderer.render(engine); updateAnalytics(); }
    });
    document.getElementById('btn-reset').addEventListener('click', resetSimulation);
    document.getElementById('arena-size-selector').addEventListener('change', resetSimulation);

    // Sliders & Radios (Changements à la volée ou requérant un reset)
    const giniSlider = document.getElementById('gini-slider');
    giniSlider.addEventListener('input', (e) => {
        document.getElementById('gini-val').textContent = e.target.value;
    });
    
    const noiseSlider = document.getElementById('noise-slider');
    noiseSlider.addEventListener('input', (e) => {
        document.getElementById('noise-val').textContent = e.target.value;
        // Met à jour dynamiquement le bruit des agents existants sans reset la grille
        const newNoise = parseFloat(e.target.value) / 100;
        engine.forEachAgent(agent => {
            if (agent.class === 'RICH') agent.baseNoise = newNoise * 0.5;
            if (agent.class === 'MIDDLE') agent.baseNoise = newNoise * 1.0;
            if (agent.class === 'POOR') agent.baseNoise = newNoise * 2.5;
        });
    });

    // Écouteur pour la Flexibilité Culturelle
    const imitationSlider = document.getElementById('imitation-slider');
    imitationSlider.addEventListener('input', (e) => {
        document.getElementById('imitation-val').textContent = e.target.value;
        engine.imitationChance = parseFloat(e.target.value) / 100;
    });
    
    // Écouteur pour la Vitesse de Migration
    const mobilitySpeedSlider = document.getElementById('mobility-speed-slider');
    mobilitySpeedSlider.addEventListener('input', (e) => {
        document.getElementById('mobility-val').textContent = e.target.value;
        engine.mobilitySpeed = parseFloat(e.target.value) / 100;
    });

    document.querySelectorAll('input[name="game-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => { engine.mode = e.target.value; });
    });

    // Interactions Pinceau (Souris sur le Canvas)
    const canvas = document.getElementById('arena-canvas');
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; applyBrush(e); });
    canvas.addEventListener('mousemove', (e) => { if (isDrawing) applyBrush(e); });
    window.addEventListener('mouseup', () => { isDrawing = false; });
}

/**
 * Calcule la case pointée et écrase sa stratégie si la simulation est en pause
 */
function applyBrush(event) {
    if (isRunning) return; // Le pinceau est bloqué pendant que le jeu tourne

    const canvas = document.getElementById('arena-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Position exacte de la souris dans le canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const cellWidth = canvas.width / GRID_WIDTH;
    const cellHeight = canvas.height / GRID_HEIGHT;

    const gridX = Math.floor(mouseX / cellWidth);
    const gridY = Math.floor(mouseY / cellHeight);

    // Sécurité hors-limites
    if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
        const agent = engine.grid[gridY][gridX];
        const selectedStrategy = document.getElementById('brush-strat-selector').value;
        
        if (agent !== null) {
            agent.strategy = selectedStrategy;
            renderer.render(engine); // Rafraîchir l'affichage instantanément
        }
    }
}

// --- UTILITAIRES ---

function injectBrushUI() {
    const parent = document.querySelector('.controls-panel');
    const brushGroup = document.createElement('div');
    brushGroup.className = 'control-group';
    brushGroup.innerHTML = `
        <label for="brush-strat-selector">🎨 Pinceau (Mode Pause) :</label>
        <select id="brush-strat-selector" style="width:100%; padding:5px; margin-top:5px; background:#222; color:#fff; border:1px solid #444;">
            ${Object.keys(STRATEGIES).map(strat => `<option value="${strat}">${strat}</option>`).join('')}
        </select>
    `;
    // Insérer juste avant les boutons d'actions
    parent.insertBefore(brushGroup, document.querySelector('.action-buttons'));
}

function updateActionButtons() {
    document.getElementById('btn-play').disabled = isRunning;
    document.getElementById('btn-pause').disabled = !isRunning;
    document.getElementById('btn-step').disabled = isRunning;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Lancement automatique au chargement du script
window.addEventListener('DOMContentLoaded', init);
