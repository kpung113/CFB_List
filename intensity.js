function calculateLivePriorityScore(g) {
      const comp = g.rawEvent?.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      
      const homeConfId = String(home?.team?.conferenceId || home?.team?.conference?.id || '');
      const awayConfId = String(away?.team?.conferenceId || away?.team?.conference?.id || '');
      const isSECGame = (homeConfId === '8' || awayConfId === '8');
      
      const hRank = home?.curatedRank?.current;
      const aRank = away?.curatedRank?.current;
      const hRnk = hRank && hRank <= 25 ? hRank : 99;
      const aRnk = aRank && aRank <= 25 ? aRank : 99;
      const isRanked = (hRnk <= 25 || aRnk <= 25);

      // --- 15-MINUTE PRE-GAME WINDOW CHECK ---
      const gameDate = comp?.date || g.date;
      if (gameDate) {
        const startTime = new Date(gameDate);
        const now = new Date();
        const diffMinutes = (startTime - now) / 60000;
        
        if (diffMinutes >= 0 && diffMinutes <= 15) {
          let baseScore = 4.0; 
          if (isSECGame && isRanked) baseScore = 8.0;
          else if (hRnk <= 10 && aRnk <= 10) baseScore = 8.5;
          else if (isRanked) baseScore = 7.0;
          else if (isSECGame) baseScore = 6.0;

          g._isUpcomingStart = true;
          return Number(baseScore.toFixed(1));
        }
      }
      
      g._isUpcomingStart = false;

      const homeScore = parseInt(g.homeScore || 0);
      const awayScore = parseInt(g.awayScore || 0);
      const margin = Math.abs(homeScore - awayScore);
      const p = g.period || 1;

      let rem = 900;
      const m = (g.statusDetail || '').match(/(\d+):(\d+)/);
      if (m) rem = parseInt(m[1]) * 60 + parseInt(m[2]);
      
      const totalSecondsLeft = Math.max(0, (4 - Math.min(p, 4)) * 900 + rem);
      const timeRemainingFactor = totalSecondsLeft / 3600; 
      const urgencyBonus = (1 - timeRemainingFactor) * 2.0; // Dynamic scaling factor moving up as game progresses

      const top10TeamLosingBy16 = (hRnk <= 10 && homeScore < awayScore && margin > 16) || 
                                  (aRnk <= 10 && awayScore < homeScore && margin > 16);
      
      const unrankedLeadingTop10By10 = (hRnk > 25 && aRnk <= 10 && homeScore > awayScore && margin >= 10) ||
                                       (aRnk > 25 && hRnk <= 10 && awayScore > homeScore && margin >= 10);

      // --- SNOOZEFEST TIER (0.0–2.0) ---
      if (margin > 16 && !top10TeamLosingBy16) {
        if (margin > 30) return 0.0;
        const score = 2.0 - ((margin - 17) / 14) * 2.0;
        return Number(Math.max(0.0, score).toFixed(1));
      }

      // --- LATE-GAME MARGIN CAPS ---
      let maxAllowed = 10.0;
      if (p === 4 && rem <= 600 && margin > 16 && !top10TeamLosingBy16) {
        maxAllowed = Math.min(maxAllowed, 8.0);
      }
      if (p === 4 && rem <= 300 && margin > 10 && !unrankedLeadingTop10By10) {
        maxAllowed = Math.min(maxAllowed, 8.0);
      }
      // --- TURN TV ON NOW! TIER (9.0–10.0) ---
      const isEligibleForTopTier = isSECGame || isRanked;
      const within10OrTop10Upset = (margin <= 10) || unrankedLeadingTop10By10;

      if (isEligibleForTopTier && within10OrTop10Upset && (p >= 3 || unrankedLeadingTop10By10)) {
        if (p >= 4 && (margin <= 4 || unrankedLeadingTop10By10)) {
          let peakScore = 9.0 + urgencyBonus * 0.5;
          if (p === 4 && rem <= 300) peakScore = Math.max(peakScore, 9.5);
          return Math.min(Math.max(Number(peakScore.toFixed(1)), 9.0), maxAllowed);
        }
        let score9 = 8.8 + (urgencyBonus * 0.3);
        return Math.min(Math.max(Number(score9.toFixed(1)), 9.0), maxAllowed);
      }

      // --- GREAT GAME TIER (6.0–8.9) ---
      // SEC or Ranked games with margin <= 16 (sliding down to watchable if margin > 10)
      if (isEligibleForTopTier && margin <= 16) {
        if (margin > 10) {
          // Slide down into Watchable tier if SEC/Ranked game margin exceeds 10 points
          let watchableScore = 4.0 + (urgencyBonus * 0.9);
          return Math.min(Math.max(Number(watchableScore.toFixed(1)), 3.0), 5.9);
        }
        let baseGreat = 6.0;
        let score = baseGreat + (urgencyBonus * 1.4);
        return Math.min(Math.max(Number(score.toFixed(1)), 6.0), Math.min(8.9, maxAllowed));
      }

      // --- WATCHABLE TIER (3.0–5.9) ---
      let baseWatchable = (margin <= 10 && p >= 3) ? 4.2 : 3.2;
      let watchScore = baseWatchable + (urgencyBonus * 1.2);
      return Math.min(Math.max(Number(watchScore.toFixed(1)), 3.0), 5.9);
    }
    
    function renderIntensityMeter(scoreInput, g) {
      const displayScore = Math.min(Math.max(Number(scoreInput), 0), 10).toFixed(1);
      let label = 'Snoozefest', color = '#ef4444', angle = -40;

      if (g && g._isUpcomingStart) {
        label = 'Upcoming Start';
        color = '#38bdf8';
        angle = 0;
      } else if (displayScore >= 9.0) {
        label = 'TURN TV ON NOW!';
        color = '#84cc16';
        angle = 55;
      } else if (displayScore >= 6.0) {
        label = 'Great Game';
        color = '#22c55e';
        angle = 25;
      } else if (displayScore >= 3.0) {
        label = 'Watchable';
        color = '#eab308';
        angle = 0;
      }
return `
        <div class="intensity-container">
          <div class="gauge-wrapper">
            <svg class="gauge-svg" viewBox="0 0 100 55">
              <path d="M 10 50 A 40 40 0 0 1 33.4 18.2" fill="none" stroke="#ef4444" stroke-width="12"/>
              <path d="M 33.4 18.2 A 40 40 0 0 1 66.6 18.2" fill="none" stroke="#eab308" stroke-width="12"/>
              <path d="M 66.6 18.2 A 40 40 0 0 1 90 50" fill="none" stroke="#22c55e" stroke-width="12"/>
              <circle cx="50" cy="50" r="5" fill="#f8fafc"/>
              <g transform="rotate(${angle}, 50, 50)"><polygon points="47,50 53,50 50,14" fill="#f8fafc"/></g>
            </svg>
          </div>
          <div class="intensity-text-group">
            <span class="intensity-label" style="color:${color};">${label}</span>
            <span class="intensity-score">Intensity Score: ${displayScore}</span>
          </div>
        </div>`;
    }
