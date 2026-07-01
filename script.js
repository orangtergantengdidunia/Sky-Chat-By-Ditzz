/* =========================================================
   MATCH CENTER — Data system & interactions
   Everything on screen is derived from `matchData`.
   Use window.matchAPI.updateScore/updateTeams/updateTimer/updateStatus
   to drive the board from any external feed.
   ========================================================= */

const matchData = {
  teamLeft: "ARGENTINA",
  teamRight: "FRANCE",
  codeLeft: "ARG",
  codeRight: "FRA",
  scoreLeft: 2,
  scoreRight: 1,
  minute: 89,
  second: 45,
  status: "LIVE",       // LIVE | HALF | FINAL
  league: "FIFA WORLD CUP · FINAL",
  stadium: "LUSAIL STADIUM",
  matchday: "MATCHDAY 07",
  possessionLeft: 54,
  lastEvent: "⚽ GOAL — MESSI 87'"
};

/* ---------------------------------------------------------
   DOM references
--------------------------------------------------------- */
const el = {
  teamNameLeft: document.getElementById("team-name-left"),
  teamNameRight: document.getElementById("team-name-right"),
  teamCodeLeft: document.getElementById("team-code-left"),
  teamCodeRight: document.getElementById("team-code-right"),
  crestInitialLeft: document.getElementById("crest-initial-left"),
  crestInitialRight: document.getElementById("crest-initial-right"),
  scoreLeft: document.getElementById("score-left"),
  scoreRight: document.getElementById("score-right"),
  timer: document.getElementById("timer"),
  statusPill: document.getElementById("status-pill"),
  statusLabel: document.getElementById("status-label"),
  leagueName: document.getElementById("league-name"),
  stadiumName: document.getElementById("stadium-name"),
  matchday: document.getElementById("matchday"),
  possLeft: document.getElementById("poss-left"),
  possRight: document.getElementById("poss-right"),
  lastEvent: document.getElementById("last-event"),
};

/* ---------------------------------------------------------
   UPDATE FUNCTIONS — single source of truth rendering
--------------------------------------------------------- */

function updateTeams() {
  el.teamNameLeft.textContent = matchData.teamLeft;
  el.teamNameRight.textContent = matchData.teamRight;
  el.teamCodeLeft.textContent = matchData.codeLeft;
  el.teamCodeRight.textContent = matchData.codeRight;
  el.crestInitialLeft.textContent = matchData.teamLeft.charAt(0);
  el.crestInitialRight.textContent = matchData.teamRight.charAt(0);
  el.leagueName.textContent = matchData.league;
  el.stadiumName.textContent = matchData.stadium;
  el.matchday.textContent = matchData.matchday;
  el.possLeft.textContent = matchData.possessionLeft + "%";
  el.possRight.textContent = (100 - matchData.possessionLeft) + "%";
  el.lastEvent.textContent = matchData.lastEvent;
}

function pad(n) { return n.toString().padStart(2, "0"); }

function updateTimer() {
  const min = matchData.minute > 90 ? `90+${matchData.minute - 90}` : pad(matchData.minute);
  el.timer.textContent = `${min}:${pad(matchData.second)}`;
}

function flashScore(target) {
  target.classList.remove("is-pulsing");
  // force reflow so the animation can restart
  void target.offsetWidth;
  target.classList.add("is-pulsing");
}

function updateScore(newLeft = matchData.scoreLeft, newRight = matchData.scoreRight) {
  const leftChanged = newLeft !== matchData.scoreLeft;
  const rightChanged = newRight !== matchData.scoreRight;

  matchData.scoreLeft = newLeft;
  matchData.scoreRight = newRight;

  el.scoreLeft.textContent = matchData.scoreLeft;
  el.scoreRight.textContent = matchData.scoreRight;

  if (leftChanged) flashScore(el.scoreLeft);
  if (rightChanged) flashScore(el.scoreRight);
}

function updateStatus(status = matchData.status) {
  matchData.status = status;
  el.statusPill.classList.remove("is-final", "is-half");

  if (status === "FINAL") {
    el.statusPill.classList.add("is-final");
    el.statusLabel.textContent = "FULL TIME";
  } else if (status === "HALF") {
    el.statusPill.classList.add("is-half");
    el.statusLabel.textContent = "HALF TIME";
  } else {
    el.statusLabel.textContent = "LIVE";
  }
}

/* ---------------------------------------------------------
   LIVE CLOCK — advances the match minute/second in real time
--------------------------------------------------------- */
let clockHandle = null;

function startClock() {
  if (clockHandle) clearInterval(clockHandle);
  clockHandle = setInterval(() => {
    if (matchData.status !== "LIVE") return;

    matchData.second++;
    if (matchData.second >= 60) {
      matchData.second = 0;
      matchData.minute++;
    }
    if (matchData.minute >= 91) {
      matchData.minute = 90;
      matchData.second = 0;
      updateStatus("FINAL");
      clearInterval(clockHandle);
    }
    updateTimer();
  }, 1000);
}

/* ---------------------------------------------------------
   AMBIENT PARTICLE FIELD (canvas) — subtle floating light motes
--------------------------------------------------------- */
(function particleField() {
  const canvas = document.getElementById("fx-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeParticles() {
    const count = Math.round((w * h) / 28000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.18 + 0.04),
      vx: (Math.random() - 0.5) * 0.08,
      a: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.5 ? "216,175,92" : "87,229,240"
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("resize", () => { resize(); makeParticles(); });
  resize();
  makeParticles();
  if (!prefersReducedMotion) requestAnimationFrame(tick);
})();

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
function init() {
  updateTeams();
  updateTimer();
  updateStatus(matchData.status);
  updateScore(matchData.scoreLeft, matchData.scoreRight);
  startClock();

  // gentle possession drift for a "living" bottom bar
  setInterval(() => {
    if (matchData.status !== "LIVE") return;
    const drift = Math.round((Math.random() - 0.5) * 4);
    matchData.possessionLeft = Math.min(70, Math.max(30, matchData.possessionLeft + drift));
    el.possLeft.textContent = matchData.possessionLeft + "%";
    el.possRight.textContent = (100 - matchData.possessionLeft) + "%";
  }, 6000);
}

document.addEventListener("DOMContentLoaded", init);

/* Expose a small public API so the board can be driven externally,
   e.g. matchAPI.updateScore(3, 1) on a real goal event. */
window.matchAPI = { matchData, updateScore, updateTeams, updateTimer, updateStatus };
