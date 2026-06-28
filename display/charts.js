// display/charts.js
import { STRATEGY_COLORS } from '../core/strategies.js';

export class AnalyticsCharts {
    constructor(lineChartCanvasId, barycentricCanvasId) {
        this.lineCanvas = document.getElementById(lineChartCanvasId);
        this.baryCanvas = document.getElementById(barycentricCanvasId);
        this.baryCtx = this.baryCanvas.getContext('2d');
        
        this.chart = null;
        this.historyData = [];
        
        this.initLineChart();
        this.initBarycentricTriangle();
    }

    /**
     * Initialise le graphique temporel Chart.js
     */
    initLineChart() {
        const strategies = Object.keys(STRATEGY_COLORS);
        const datasets = strategies.map(strat => ({
            label: strat,
            data: [],
            borderColor: STRATEGY_COLORS[strat],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0, // Optimise les performances sur de longues simulations
            tension: 0.1
        }));

        this.chart = new Chart(this.lineCanvas, {
            type: 'line',
            data: { labels: [], datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Générations' } },
                    y: { title: { display: true, text: 'Nombre d\'agents' }, min: 0 }
                },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12 } }
                }
            }
        });
    }

    /**
     * Calcule la géométrie fixe du triangle équilatéral
     */
    initBarycentricTriangle() {
        const margin = 30;
        const width = this.baryCanvas.width;
        const height = this.baryCanvas.height;

        // Définition des coordonnées cartésiennes des sommets du triangle
        this.triangle = {
            A: { x: width / 2, y: margin }, // Sommet supérieur : ALWAYS_CHEAT
            B: { x: margin, y: height - margin }, // Sommet inférieur gauche : ALWAYS_COOPERATE
            C: { x: width - margin, y: height - margin } // Sommet inférieur droit : COPYCAT
        };
    }

    /**
     * Met à jour l'ensemble des graphiques à chaque génération
     * @param {number} generation - L'index de la génération actuelle
     * @param {Object} counts - Dictionnaire contenant le décompte de chaque stratégie
     */
    update(generation, counts) {
        // 1. Mise à jour du graphique linéaire Chart.js
        this.chart.data.labels.push(generation);
        this.chart.data.datasets.forEach(dataset => {
            const strategyName = dataset.label;
            dataset.data.push(counts[strategyName] || 0);
        });
        this.chart.update('none'); // Mode 'none' pour éviter les animations lourdes à chaque tick

        // 2. Mise à jour et rendu du diagramme barycentrique
        this.renderBarycentric(counts);
    }

    /**
     * Calcule les coordonnées et dessine le point dans le triangle de phase
     */
    renderBarycentric(counts) {
        const ctx = this.baryCtx;
        const { A, B, C } = this.triangle;

        // Effacer le canvas du triangle
        ctx.clearRect(0, 0, this.baryCanvas.width, this.baryCanvas.height);

        // Dessiner l'enveloppe du triangle équilatéral
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.stroke();

        // Légendes aux sommets
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TRICHEUR (A)', A.x, A.y - 10);
        ctx.textAlign = 'right';
        ctx.fillText('ALTRUISTE (B)', B.x - 5, B.y + 5);
        ctx.textAlign = 'left';
        ctx.fillText('COPYCAT (C)', C.x + 5, C.y + 5);

        // Calcul du vecteur de population pour le sous-ensemble des 3 stratégies majeures
        const nA = counts['ALWAYS_CHEAT'] || 0;
        const nB = counts['ALWAYS_COOPERATE'] || 0;
        const nC = counts['COPYCAT'] || 0;
        const totalSubPopulation = nA + nB + nC;

        if (totalSubPopulation === 0) return;

        // Fractions barycentriques (normalisées pour que fA + fB + fC = 1)
        const fA = nA / totalSubPopulation;
        const fB = nB / totalSubPopulation;
        const fC = nC / totalSubPopulation;

        // Conversion en coordonnées cartésiennes
        // Px = fA * Ax + fB * Bx + fC * Cx
        // Py = fA * Ay + fB * By + fC * Cy
        const px = fA * A.x + fB * B.x + fC * C.x;
        const py = fA * A.y + fB * B.y + fC * C.y;

        // Enregistrer la coordonnée dans l'historique pour dessiner une trajectoire (traînée)
        this.historyData.push({ x: px, y: py });
        if (this.historyData.length > 50) this.historyData.shift(); // Conserve les 50 derniers points

        // Dessiner la trajectoire historique (courbe de phase)
        if (this.historyData.length > 1) {
            ctx.strokeStyle = 'rgba(58, 134, 255, 0.4)'; // Traînée bleue semi-transparente
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.historyData[0].x, this.historyData[0].y);
            for (let i = 1; i < this.historyData.length; i++) {
                ctx.lineTo(this.historyData[i].x, this.historyData[i].y);
            }
            ctx.stroke();
        }

        // Dessiner le point d'état actuel (Barycentre)
        ctx.fillStyle = '#FF006E'; // Point rose vif pour l'état actuel
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    /**
     * Réinitialise les graphiques lors d'un Reset de l'arène
     */
    reset() {
        this.chart.data.labels = [];
        this.chart.data.datasets.forEach(dataset => dataset.data = []);
        this.chart.update();
        this.historyData = [];
        this.baryCtx.clearRect(0, 0, this.baryCanvas.width, this.baryCanvas.height);
        this.initBarycentricTriangle();
    }
}
