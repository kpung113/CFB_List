// intensity.js

function calculateLivePriorityScore(g) {
  const comp = g.rawEvent?.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');
  
  const homeConfId = String(home?.team?.conferenceId || home?.team?.conference?.id || '');
  const awayConfId = String(away?.team?.conferenceId || away?.team?.conference?.id || '');
  const homeIsSec = homeConfId === '8';
  const awayIsSec = awayConfId === '8';
  
  const hRank = home?.curatedRank?.current;
  const aRank = away?.curatedRank?.current;
  const hRnk = hRank && hRank <= 25 ? hRank : 99;
  const aRnk = aRank && aRank <= 25 ? aRank : 99;

  const homeScore = parseInt(g.homeScore || 0);
  const awayScore = parseInt(g.awayScore || 0);
  const margin = Math.abs(homeScore - awayScore);
  const p = g.period || 1;

  let rem = 900;
  const m = (g.statusDetail || '').match(/(\d+):(\d+)/);
  if (m) rem = parseInt(m[1]) * 60 + parseInt(m[2]);

  // --- 1. BASELINE MATCHUP WEIGHT ---
  let base = 200;
  const isPower4Team = id => ['8', '5', '4', '1', '151'].includes(id);

  if (homeIsSec && awayIsSec) base = 1200;
  else if (hRnk <= 25 && aRnk <= 25) base = 1000;
  else if (hRnk <= 25 || aRnk <= 25) base = 800;
  else if (isPower4Team(homeConfId) && isPower4Team(awayConfId)) base = 500;

  // --- 2. LATE-GAME "DONE DEAL" OVERRIDES ---
  if (p === 4) {
    const minsLeft = rem / 60;
    if (minsLeft <= 2 && margin > 10) return Math.round(base * 0.15);
    if (minsLeft <= 5 && margin > 16) return Math.round(base * 0.15);
    if (minsLeft <= 10 && margin > 24) return Math.round(base * 0.15);
  }
  if (margin > 16 && p >= 4) return Math.round(base * 0.1);

  // --- 3. MARGIN & RANKED TRAILING DYNAMICS ---
  let marginScore = 0;
  let upsetBoost = 0;

  let rankedTeamTrailing = false;
  if (hRnk <= 25 && homeScore < awayScore) rankedTeamTrailing = true;
  if (aRnk <= 25 && awayScore < homeScore) rankedTeamTrailing = true;

  if (margin === 0) {
    marginScore = 500;
    if (rankedTeamTrailing || (hRnk <= 25 && aRnk <= 25)) upsetBoost += 300;
  } 
  else if (margin <= 8) {
    marginScore = 400;
    if (p >= 3) {
      marginScore += 200;
      if (rankedTeamTrailing) upsetBoost += 400;
    } else {
      marginScore = 150;
    }
  } 
  else if (margin <= 16) {
    marginScore = 250;
    if (rankedTeamTrailing) {
      upsetBoost += 350;
    } else {
      marginScore = 150;
    }
  } 
  else {
    marginScore = margin <= 24 ? 50 : 10;
  }

  // --- 4. TIME & CRUNCH FACTOR ---
  let timeScore = 0;
  if (p === 1) timeScore = 50;
  else if (p === 2) timeScore = 100;
  else if (p === 3) timeScore = 250;
  else if (p === 4) {
    const crunchSecs = 900 - rem;
    timeScore = 400 + Math.round((crunchSecs / 900) * 300);
  }
  else if (p > 4) {
    timeScore = 900;
  }

  const totalRaw = base + marginScore + timeScore + upsetBoost;
  let finalScore = Math.round(totalRaw);

  // --- 5. CAP UNRANKED VS UNRANKED MATCHUPS AT A 7 (Raw equivalent ~1120) ---
  const isUnrankedMatchup = (hRnk > 25 && aRnk > 25);
  if (isUnrankedMatchup) {
    const unrankedCapRaw = 1120;
    if (finalScore > unrankedCapRaw) {
      finalScore = unrankedCapRaw;
    }
  }

  return finalScore;
}

function renderIntensityMeter(rawScore) {
  const displayScore = Math.min(Math.max(Math.round((rawScore / 1600) * 10), 0), 10);

  let label = 'Snoozefest', color = '#ef4444', angle = -40;

  if (displayScore >= 9) {
    label = 'TURN TV ON NOW!';
    color = '#84cc16';
    angle = 55;
  } else if (displayScore >= 6) {
    label = 'Great Game';
    color = '#22c55e';
    angle = 25;
  } else if (displayScore >= 3) {
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
