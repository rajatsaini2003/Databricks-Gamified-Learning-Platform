class ScoreCalculator {
    calculate(validationResult, timeSpent, difficulty) {
        let score = 0;
        
        // Base score from Gemini validation
        score += (validationResult.correctnessScore || 0); // Max 100
        score += (validationResult.qualityScore || 0);     // Max 30
        score += (validationResult.performanceScore || 0); // Max 50
        
        // Max base score = 180
        
        // Time bonus (Max 20)
        // Assume difficulty dictates "standard time". 
        // Simple logic: if timeSpent < standardTime, give bonus.
        // For MVP, just giving flat bonus if correct and fast-ish
        if (validationResult.correct && timeSpent < 300) { // Under 5 mins
            score += 20;
        } else if (validationResult.correct && timeSpent < 600) { // Under 10 mins
            score += 10;
        }

        // Difficulty multiplier
        // 1 star = 1x, 5 star = 1.5x ? 
        // Keeping it simple for now, raw score. 
        // Maybe cap at 200.
        
        return Math.min(score, 200);
    }

    calculateXP(score, difficulty) {
        // XP = Score * Difficulty Multiplier
        return Math.floor(score * (1 + (difficulty * 0.1)));
    }
}

module.exports = new ScoreCalculator();