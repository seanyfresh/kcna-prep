/* Readiness model: blends accuracy with practice coverage per domain,
   weights by the real KCNA domain weights, and produces an honest
   "predicted score" + pass-likelihood + recommended focus. */
window.Readiness = (function () {
  const CONF_TARGET = 15; // questions per domain for full confidence

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function compute() {
    const domains = KCNA.all();
    const stats = Progress.stats();
    const totalWeight = KCNA.totalWeight() || 1;

    let totalAnswered = 0;
    let weightedScore = 0;        // Σ weight * (accuracy * confidence) — the readiness number
    let weightedAccuracyAssessed = 0; // Σ (weight·confidence) * accuracy — confidence-shrunk
    let assessedConfWeight = 0;   // Σ weight·confidence (denominator for predicted score)
    let assessedWeight = 0;       // Σ weight of assessed domains (for "material assessed")

    const perDomain = domains.map((d) => {
      const st = stats[d.id] || { answered: 0, correct: 0, recent: [] };
      const answered = st.answered;
      const accuracy = answered ? st.correct / answered : 0;
      // recency-weighted accuracy gives more credit to recent improvement
      const recent = st.recent || [];
      const recentAcc = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : accuracy;
      const blendedAcc = answered ? (0.5 * accuracy + 0.5 * recentAcc) : 0;
      const confidence = clamp(answered / CONF_TARGET, 0, 1);
      const score = blendedAcc * (0.55 + 0.45 * confidence); // penalize thin coverage
      const wfrac = (d.weight || 0) / totalWeight;

      totalAnswered += answered;
      weightedScore += wfrac * score;
      if (answered > 0) {
        // Down-weight thinly-covered domains so a few lucky answers in a
        // high-weight domain can't inflate the predicted score.
        weightedAccuracyAssessed += (d.weight || 0) * confidence * blendedAcc;
        assessedConfWeight += (d.weight || 0) * confidence;
        assessedWeight += (d.weight || 0);
      }

      return {
        id: d.id, name: d.name, weight: d.weight,
        answered, accuracy, blendedAcc, confidence,
        score, // 0..1 readiness contribution per unit
        masteryPct: Math.round(blendedAcc * 100),
        scorePct: Math.round(score * 100),
        coverage: Math.round(confidence * 100),
        questionsAvailable: (d.questions || []).length,
      };
    });

    const readiness = Math.round(weightedScore * 100); // overall readiness 0..100
    const predictedScore = assessedConfWeight ? Math.round((weightedAccuracyAssessed / assessedConfWeight) * 100) : 0;

    // pass likelihood heuristic combines readiness, coverage, and assessed share
    const assessedShare = assessedWeight / totalWeight;
    let likelihood, likelihoodClass;
    if (totalAnswered < 20) { likelihood = 'Not yet assessed'; likelihoodClass = 'muted'; }
    else if (readiness >= 78 && assessedShare > 0.85 && totalAnswered >= 90) { likelihood = 'High'; likelihoodClass = 'good'; }
    else if (readiness >= 70) { likelihood = 'Moderate'; likelihoodClass = 'warn'; }
    else if (readiness >= 55) { likelihood = 'Building'; likelihoodClass = 'warn'; }
    else { likelihood = 'Low'; likelihoodClass = 'bad'; }

    let level, levelClass;
    if (totalAnswered < 20) { level = 'Not started'; levelClass = 'muted'; }
    else if (readiness < 45) { level = 'Building foundation'; levelClass = 'bad'; }
    else if (readiness < 62) { level = 'Developing'; levelClass = 'warn'; }
    else if (readiness < 78) { level = 'Approaching ready'; levelClass = 'warn'; }
    else { level = 'Exam ready'; levelClass = 'good'; }

    // weakest assessed domains + unassessed flagged separately
    const assessed = perDomain.filter((d) => d.answered >= 3).slice().sort((a, b) => a.score - b.score);
    const unassessed = perDomain.filter((d) => d.answered < 3);

    return {
      readiness, predictedScore, passPct: KCNA.meta.passPct,
      likelihood, likelihoodClass, level, levelClass,
      totalAnswered, assessedShare,
      perDomain, weakest: assessed.slice(0, 3), unassessed,
    };
  }

  function colorClass(pct) {
    if (pct >= 75) return 'good';
    if (pct >= 55) return 'warn';
    return 'bad';
  }

  return { compute, colorClass };
})();
