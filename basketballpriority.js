function calculateLivePriorityScore(g, currentSport) {
      const comp = g.rawEvent?.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      
      const isConf23Game = hasConf23(g.rawEvent);
      const hRank = home?.curatedRank?.current;
      const aRank = away?.curatedRank?.current;
      const hRnk = hRank && hRank <= 25 ? hRank : 99;
      const aRnk = aRank && aRank <= 25 ? aRank : 99;
      const isRanked = (hRnk <= 25 || aRnk <= 25);
      const isRankedVsRanked = (hRnk <= 25 && aRnk <= 25);

      const gameDate = comp?.date || g.date;
      if (gameDate) {
        const diffMinutes = (new Date(gameDate) - new Date()) / 60000;
        if (diffMinutes >= 0 && diffMinutes <= 15) {
          let baseScore = 4.0;
          if (isRankedVsRanked) baseScore = 8.0;
          else if (hRnk <= 10 && aRnk <= 10) baseScore = 8.5;
          else if (isRanked) baseScore = 7.0;
          else if (isConf23Game) baseScore = 6.0;
          g._isUpcomingStart = true;
          return Number(baseScore.toFixed(1));
        }
      }
      g._isUpcomingStart = false;

      const homeScore = parseInt(g.homeScore || 0);
      const awayScore = parseInt(g.awayScore || 0);
      const margin = Math.abs(homeScore - awayScore);
      const p = g.period || 1;

      const isWomens = currentSport === 'wbb';
      const isSecondHalf = isWomens ? (p >= 3) : (p >= 2);
      const periodSeconds = isWomens ? 600 : 1200;
      let rem = periodSeconds;
      const m = (g.statusDetail || '').match(/(\d+):(\d+)/);
      if (m) rem = parseInt(m[1]) * 60 + parseInt(m[2]);

      const totalPeriods = isWomens ? 4 : 2;
      const timeRemainingFactor = Math.max(0, (totalPeriods - Math.min(p, totalPeriods)) * periodSeconds + rem) / (totalPeriods * periodSeconds); 

      const top10TeamLosingBy15 = (hRnk <= 10 && homeScore < awayScore && margin > 15) || (aRnk <= 10 && awayScore < homeScore && margin > 15);
      const unrankedLeadingRanked = (hRnk > 25 && aRnk <= 25 && homeScore > awayScore) || (aRnk > 25 && hRnk <= 25 && awayScore > homeScore);
      const rankedTeamLosing = (hRnk <= 25 && homeScore < awayScore) || (aRnk <= 25 && awayScore < homeScore);

      if (isRankedVsRanked && margin < 10 && !top10TeamLosingBy15) {
        let score = 7.5 + ((10 - margin) * 0.1) + ((1 - timeRemainingFactor) * 1.3);
        return Math.min(Math.max(Number(score.toFixed(1)), 6.0), 8.9);
      }

      if (margin > 15 && !top10TeamLosingBy15) {
        if (margin > 30) return 0.0;
        return Number(Math.max(0.0, 2.0 - ((margin - 16) / 14) * 2.0).toFixed(1));
      }

      const urgencyBonus = (1 - timeRemainingFactor) * 1.5;

      const isLateGame = isWomens ? (p >= 4) : (p >= 2);
      if (isLateGame && (top10TeamLosingBy15 || (margin < 10 && rankedTeamLosing))) {
        let score9 = 9.0 + (urgencyBonus * 0.2) + ((10 - margin) * 0.02);
        return Math.min(Number(score9.toFixed(1)), 9.4);
      }

      if ((!isSecondHalf && unrankedLeadingRanked) || (isSecondHalf && margin < 10) || (isSecondHalf && unrankedLeadingRanked && margin <= 15)) {
        let base = (!isSecondHalf && unrankedLeadingRanked) ? 6.5 : 7.2;
        return Math.min(Math.max(Number((base + urgencyBonus + ((15 - margin) * 0.05)).toFixed(1)), 6.0), 8.9);
      }

      if ((!isSecondHalf && (hRnk <= 25 || aRnk <= 25 || (hRnk > 25 && aRnk > 25))) || (isSecondHalf && margin >= 10 && margin <= 15 && !unrankedLeadingRanked)) {
        let base = !isSecondHalf ? 4.0 : 4.5;
        return Math.min(Math.max(Number((base + (urgencyBonus * 0.5)).toFixed(1)), 3.0), 5.9);
      }

      return Number((3.5 + urgencyBonus).toFixed(1));
}

function renderIntensityMeter(scoreInput, g) {
      const displayScore = Math.min(Math.max(Number(scoreInput), 0), 10).toFixed(1);
      let label = 'Snoozefest', color = '#ef4444', angle = -40;

      if (g && g._isUpcomingStart) {
        label = 'Upcoming Start'; color = '#38bdf8'; angle = 0;
      } else if (displayScore >= 9.0) {
        label = 'TURN TV ON NOW!'; color = '#84cc16'; angle = 55;
      } else if (displayScore >= 6.0) {
        label = 'Great Game'; color = '#22c55e'; angle = 25;
      } else if (displayScore >= 3.0) {
        label = 'Watchable'; color = '#eab308'; angle = 0;
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

function renderGames(live, upcoming, finals, currentSport, createCardFunc) {
      const container = document.getElementById("games-container");
      container.innerHTML = "";
      if (!live.length && !upcoming.length && !finals.length) {
        container.innerHTML = "<p style='text-align:center; color:var(--sub); margin-top:40px;'>No matching games found for today.</p>";
        return;
      }

      const appendSection = (title, list, isCompleted) => {
        if (!list.length) return;
        const header = document.createElement("div");
        header.className = "tier-header";
        header.innerText = title;
        container.appendChild(header);
        list.forEach(g => container.appendChild(createCardFunc(g, isCompleted, currentSport)));
      };

      appendSection("Live Games", live, false);
      appendSection("Upcoming Today", upcoming, false);
      appendSection("Completed Games", finals, true);
}
