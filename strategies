// core/strategies.js

export const STRATEGIES = {
    ALWAYS_CHEAT: () => 'D',
    
    ALWAYS_COOPERATE: () => 'C',
    
    COPYCAT: (opponentHistory) => {
        // Commence par Coopérer, puis imite le dernier coup
        if (opponentHistory.length === 0) return 'C';
        return opponentHistory[opponentHistory.length - 1];
    },
    
    GRUDGER: (opponentHistory) => {
        // Coopère jusqu'à la première trahison, puis trahit à vie
        if (opponentHistory.includes('D')) return 'D';
        return 'C';
    },
    
    COPYKITTEN: (opponentHistory) => {
        // Plus indulgent : ne trahit que si l'autre a trahi deux fois de suite
        if (opponentHistory.length < 2) return 'C';
        const lastMove = opponentHistory[opponentHistory.length - 1];
        const prevMove = opponentHistory[opponentHistory.length - 2];
        return (lastMove === 'D' && prevMove === 'D') ? 'D' : 'C';
    }
};

// Couleurs haute visibilité pour l'affichage Canvas
export const STRATEGY_COLORS = {
    ALWAYS_CHEAT: '#E63946',      // Rouge agressif
    ALWAYS_COOPERATE: '#4C9A2A',  // Vert d'eau altruiste
    COPYCAT: '#3A86FF',           // Bleu réactif
    GRUDGER: '#8338EC',           // Violet rancunier
    COPYKITTEN: '#FF006E'         // Rose tolérant
};
