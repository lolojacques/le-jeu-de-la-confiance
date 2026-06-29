// display/arena.js
import { STRATEGY_COLORS } from '../core/strategies.js';

// Couleurs imposées pour la stratification sociale
const CLASS_COLORS = {
    RICH: '#FFD700',    // Gold
    MIDDLE: '#4682B4',  // Blue
    POOR: '#696969'    // Dark Gray
};

export class ArenaRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Dessine l'intégralité de la grille sur le Canvas
     * @param {EvolutionEngine} engine - Le moteur de simulation actuel
     */
    render(engine) {
        const cellWidth = this.canvas.width / engine.width;
        const cellHeight = this.canvas.height / engine.height;
    
        // 1. Dessiner d'abord le fond par défaut et les zones urbaines
        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {
                const posX = x * cellWidth;
                const posY = y * cellHeight;
    
                if (engine.isCapitale(x, y)) {
                    ctx.fillStyle = '#2c1620'; // Teinte pourpre/sombre pour la Capitale prestigieuse
                } else if (engine.isCentreVille(x, y)) {
                    ctx.fillStyle = '#1a2421'; // Teinte émeraude/sombre pour les Centres-villes
                } else {
                    ctx.fillStyle = '#000000'; // Reste de la carte (Périphérie / Campagne)
                }
                ctx.fillRect(posX, posY, cellWidth, cellHeight);
            }
        }
    
        // 2. Dessiner les agents par-dessus cet arrière-plan teinté
        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {
                const agent = engine.grid[y][x];
                if (agent !== null) {
                    this.drawAgent(agent, x, y, cellWidth, cellHeight);
                }
            }
        }
        
        if (cellWidth > 8) {
            this.drawGridLines(engine.width, engine.height, cellWidth, cellHeight);
        }
    }

    /**
     * Dessine un agent individuel (Fond de classe + Symbole de stratégie)
     */
    drawAgent(agent, x, y, cellWidth, cellHeight) {
        const posX = x * cellWidth;
        const posY = y * cellHeight;

        // 1. Dessiner le fond (Classe sociale)
        this.ctx.fillStyle = CLASS_COLORS[agent.class] || '#696969';
        this.ctx.fillRect(posX, posY, cellWidth, cellHeight);

        // 2. Dessiner le symbole central (Stratégie)
        const strategyColor = STRATEGY_COLORS[agent.strategy] || '#FFFFFF';
        this.ctx.fillStyle = strategyColor;

        // On dessine un cercle centré à l'intérieur de la cellule
        const centerX = posX + cellWidth / 2;
        const centerY = posY + cellHeight / 2;
        const radius = Math.min(cellWidth, cellHeight) * 0.35; // Occupe 70% de la cellule

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Ajout d'un léger contour pour détacher le symbole du fond
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    /**
     * Dessine les lignes de la grille pour améliorer la lisibilité spatiale
     */
    drawGridLines(cols, rows, cellWidth, cellHeight) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; // Grille très subtile
        this.ctx.lineWidth = 1;

        // Lignes verticales
        for (let x = 0; x <= cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * cellWidth, 0);
            this.ctx.lineTo(x * cellWidth, this.canvas.height);
            this.ctx.stroke();
        }

        // Lignes horizontales
        for (let y = 0; y <= rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * cellHeight);
            this.ctx.lineTo(this.canvas.width, y * cellHeight);
            this.ctx.stroke();
        }
    }
}
