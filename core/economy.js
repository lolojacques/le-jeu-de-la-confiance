  // core/economy.js

/**
 * Calcule la richesse par habitant pour chaque classe selon le coefficient de Gini.
 */
export function calculateClassWealth(totalPopulation, gini) {
    const totalWealth = totalPopulation * 100; // Pool fixe de richesse
    
    // Évite la division par zéro si Gini vaut exactement 1
    const safeGini = Math.min(gini, 0.9999);
    const alpha = (1 + safeGini) / (1 - safeGini);
    
    // Parts cumulées de la population selon la courbe de Lorenz
    const sharePoor = Math.pow(0.4, alpha);
    const shareMiddle = Math.pow(0.9, alpha) - sharePoor;
    const shareRich = 1.0 - Math.pow(0.9, alpha);
    
    // Richesse individuelle par classe
    return {
        POOR: (sharePoor * totalWealth) / (0.4 * totalPopulation),
        MIDDLE: (shareMiddle * totalWealth) / (0.5 * totalPopulation),
        RICH: (shareRich * totalWealth) / (0.1 * totalPopulation)
    };
}

/**
 * Initialise les propriétés socio-économiques d'un agent.
 */
export function createAgent(id, className, startingWealth, baseNoise) {
    let noise, mobilityRange;

    switch (className) {
        case 'RICH':
            noise = baseNoise * 0.5;
            mobilityRange = Infinity; // Partout sur la carte
            break;
        case 'MIDDLE':
            noise = baseNoise * 1.0;
            mobilityRange = 4; // Rayon régional
            break;
        case 'POOR':
        default:
            noise = baseNoise * 2.5;
            mobilityRange = 1; // Uniquement cases adjacentes
            break;
    }

    return {
        id,
        class: className,
        wealth: startingWealth,
        baseNoise: noise, // Niveau de bruit asymétrique
        mobilityRange,
        strategy: 'COPYCAT', // Stratégie initiale par défaut
        score: 0,
        x: 0,
        y: 0
    };
}
