// core/engine.js
import { STRATEGIES } from './strategies.js';

// Gains de la matrice du Dilemme du Prisonnier
const PAYOFFS = {
    CC: 3, // Coopération mutuelle
    DD: 1, // Trahison mutuelle
    DC: 5, // Tentation (Trahison sur Coopérateur)
    CD: 0  // Dupe (Coopération face à Trahison)
};

export class EvolutionEngine {
    constructor(width, height, mode = 'Individualist') {
        this.width = width;
        this.height = height;
        this.mode = mode; // 'Individualist' ou 'Community'
        this.grid = Array(height).fill(null).map(() => Array(width).fill(null));
        this.generation = 0;
        this.imitationChance = 0.85; // Probabilité de copier le meilleur voisin
        this.mobilitySpeed = 1.0;    // Fréquence/vitesse globale de déplacement
    }

    /**
     * Phase 1 : Matchmaking & Affrontements
     */
    runMatchmaking() {
        // Réinitialiser les scores de la génération en cours
        this.forEachAgent(agent => { agent.score = 0; });

        // Pour éviter de doubler les matchs, on parcourt et affronte les voisins
        this.forEachAgent((agent, x, y) => {
            const neighbors = this.getNeighbors(x, y);

            neighbors.forEach(nb => {
                // Gestion du mode Communautaire : score nul si même stratégie
                if (this.mode === 'Community' && agent.strategy === nb.strategy) {
                    // Les deux agents ne gagnent rien sur ce match
                    return; 
                }

                const [scoreAgent, scoreNb] = this.playIPDMatch(agent, nb);
                agent.score += scoreAgent;
                // Note : Comme on boucle sur chaque agent, chaque paire se rencontrera deux fois 
                // (une fois en tant qu'agent, une fois en tant que voisin), ce qui équilibre naturellement les scores.
            });
        });
    }

    /**
     * Simule un match de 10 rounds entre deux agents
     */
    playIPDMatch(agentA, agentB) {
        const historyA = [];
        const historyB = [];
        let totalA = 0;
        let totalB = 0;

        for (let round = 0; round < 10; round++) {
            // Décisions pures des stratégies
            let moveA = STRATEGIES[agentA.strategy](historyB);
            let moveB = STRATEGIES[agentB.strategy](historyA);

            // Application du filtre de Bruit (Malentendus)
            if (Math.random() < agentA.baseNoise) moveA = (moveA === 'C') ? 'D' : 'C';
            if (Math.random() < agentB.baseNoise) moveB = (moveB === 'C') ? 'D' : 'C';

            // Enregistrement des historiques (mouvements réels subis)
            historyA.push(moveA);
            historyB.push(moveB);

            // Attribution des points selon la matrice
            if (moveA === 'C' && moveB === 'C') {
                totalA += PAYOFFS.CC;
                totalB += PAYOFFS.CC;
            } else if (moveA === 'D' && moveB === 'D') {
                totalA += PAYOFFS.DD;
                totalB += PAYOFFS.DD;
            } else if (moveA === 'D' && moveB === 'C') {
                totalA += PAYOFFS.DC;
                totalB += PAYOFFS.CD;
            } else if (moveA === 'C' && moveB === 'D') {
                totalA += PAYOFFS.CD;
                totalB += PAYOFFS.DC;
            }
        }

        return [totalA, totalB];
    }

    /**
     * Phase 2 : Évolution Culturelle (Imitation)
     */
    runEvolution() {
        const nextStrategies = new Map(); // Stocke temporairement les changements

        this.forEachAgent((agent, x, y) => {
            const neighbors = this.getNeighbors(x, y);
            if (neighbors.length === 0) return;

            // Trouver le voisin avec le meilleur score
            const bestNeighbor = neighbors.reduce((best, current) => 
                (current.score > best.score) ? current : best, neighbors[0]
            );

            // Si le voisin a mieux réussi, forte probabilité d'imitation (ex: 85%)
            // Remplacer l'ancienne condition par celle-ci :
            if (bestNeighbor.score > agent.score && Math.random() < this.imitationChance) {
                nextStrategies.set(agent.id, bestNeighbor.strategy);
                agent.wealth += agent.score * 0.1; 
            } else {
                agent.wealth += agent.score * 0.1;
            }
        });

        // Appliquer les mutations culturelles en simultané
        this.forEachAgent(agent => {
            if (nextStrategies.has(agent.id)) {
                agent.strategy = nextStrategies.get(agent.id);
            }
        });
    }

    /**
     * Phase 3 : Mobilité Spatiale Asymétrique
     */
    runMobility() {
        this.forEachAgent((agent, x, y) => {
            // Facteur de vitesse global : si le jet rate, l'agent ne bouge pas à ce tour
            if (Math.random() > this.mobilitySpeed) return;
            // Un agent mobile ne cherche à fuir que s'il est "insatisfait" (score faible)
            if (agent.score >= 20) return; 

            const emptyCells = this.getAvailableCellsInRange(x, y, agent.mobilityRange);
            if (emptyCells.length === 0) return;

            // Choisir une case vide au hasard parmi celles disponibles
            const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            
            // Déplacement physique sur la grille
            this.grid[y][x] = null;
            agent.x = targetCell.x;
            agent.y = targetCell.y;
            this.grid[targetCell.y][targetCell.x] = agent;
        });
    }

    /**
     * Étape globale d'une génération
     */
    step() {
        this.runMatchmaking();
        this.runEvolution();
        this.runMobility();
        this.generation++;
    }

    // --- Fonctions Utilitaires de Voisinage ---

    forEachAgent(callback) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] !== null) {
                    callback(this.grid[y][x], x, y);
                }
            }
        }
    }

    getNeighbors(cx, cy) {
        const neighbors = [];
        // Voisinage de Moore (8 directions) avec gestion des bordures (grille torique/sphérique)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = (cx + dx + this.width) % this.width;
                const ny = (cy + dy + this.height) % this.height;
                
                if (this.grid[ny][nx] !== null) {
                    neighbors.push(this.grid[ny][nx]);
                }
            }
        }
        return neighbors;
    }

    getAvailableCellsInRange(cx, cy, range) {
        const cells = [];
        
        if (range === Infinity) {
            // Les RICH peuvent sauter absolument n'importe où sur la grille
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.grid[y][x] === null) cells.push({x, y});
                }
            }
            return cells;
        }

        // Portée limitée pour les MIDDLE (4) et POOR (1)
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const nx = (cx + dx + this.width) % this.width;
                const ny = (cy + dy + this.height) % this.height;
                
                if (this.grid[ny][nx] === null) {
                    cells.push({x: nx, y: ny});
                }
            }
        }
        return cells;
    }
}
