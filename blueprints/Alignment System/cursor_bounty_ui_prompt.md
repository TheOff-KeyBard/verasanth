# Cursor Prompt — Bounty Board UI
# Paste this entire prompt into Cursor

---

Implement the bounty board UI. This touches index.html only — no backend changes.
The endpoints already exist from the previous alignment pass.

The UI has three parts:
1. A Standing panel added to the sidebar (always visible, updates with refreshSidebar)
2. A Bounty Board overlay (triggered from the Ember Post in market_square)
3. A Post Bounty form inside the overlay

Match the existing design language exactly:
- Colors: --bg, --panel, --panel2, --text, --muted, --accent, --danger, --ok, --border
- Overlays follow the existing combat-overlay / board-overlay / dialogue-overlay pattern
- Buttons use existing .btn, .primary, .danger class patterns
- The `render()` function handles markdown-style text formatting

---

## PART 1 — Standing Panel (Sidebar)

### HTML

Add this block to the sidebar div, between `#wallet-panel` and `#inv-panel`:

```html
<!-- ── Standing Panel ─────────────────────────────────────────── -->
<div id="standing-panel">
  <div id="standing-title">Standing</div>
  <div id="standing-archetype-label"></div>
  <div id="standing-archetype-flavor"></div>

  <div class="standing-row">
    <span class="standing-stat-name">Mercy</span>
    <div class="standing-bar-bg">
      <div class="standing-bar-fill mercy-bar" id="bar-mercy"></div>
      <div class="standing-bar-center"></div>
    </div>
  </div>

  <div class="standing-row">
    <span class="standing-stat-name">Order</span>
    <div class="standing-bar-bg">
      <div class="standing-bar-fill order-bar" id="bar-order"></div>
      <div class="standing-bar-center"></div>
    </div>
  </div>

  <div class="standing-row">
    <span class="standing-stat-name">Heat</span>
    <div class="standing-bar-bg heat-bar-bg">
      <div class="standing-bar-fill heat-bar" id="bar-heat"></div>
    </div>
  </div>

  <div id="bounty-indicator" style="display:none">
    <span id="bounty-indicator-icon">⚠</span>
    <span id="bounty-indicator-text">Bounty Active</span>
  </div>
</div>
```

### CSS

Add to the `<style>` block, after the existing `#wallet-panel` styles:

```css
#standing-panel {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

#standing-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}

#standing-archetype-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 3px;
}

#standing-archetype-flavor {
  font-size: 11px;
  color: var(--muted);
  font-style: italic;
  margin-bottom: 10px;
  line-height: 1.4;
}

.standing-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.standing-stat-name {
  font-size: 11px;
  color: var(--muted);
  width: 36px;
  flex-shrink: 0;
}

.standing-bar-bg {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,.06);
  border-radius: 999px;
  position: relative;
  overflow: visible;
}

/* Center tick mark — for mercy and order bars (bidirectional) */
.standing-bar-center {
  position: absolute;
  left: 50%;
  top: -2px;
  width: 1px;
  height: 10px;
  background: rgba(255,255,255,.2);
  transform: translateX(-50%);
}

/* Mercy/Order bars: fill from center outward */
.mercy-bar {
  position: absolute;
  height: 100%;
  border-radius: 999px;
  background: var(--ok);       /* green = merciful */
  transition: all .4s ease;
}

.order-bar {
  position: absolute;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);   /* purple = ordered */
  transition: all .4s ease;
}

/* Heat bar: fills left to right, color shifts with value */
.heat-bar-bg {
  overflow: hidden; /* clip heat bar, no center tick */
}

.heat-bar {
  height: 100%;
  border-radius: 999px;
  background: rgba(167,173,189,.4); /* grey when clean */
  transition: all .4s ease;
}

#bounty-indicator {
  margin-top: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255,92,122,.35);
  background: rgba(255,92,122,.08);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

#bounty-indicator-icon {
  color: var(--danger);
  font-size: 12px;
}

#bounty-indicator-text {
  color: var(--danger);
}
```

### JavaScript — updateStanding()

Add this function after `updateWallet()`:

```javascript
const ARCHETYPE_FLAVOR = {
  'Protector':  'The city notes you with something close to approval.',
  'Vigilante':  'You make your own law. The city watches, undecided.',
  'Wanderer':   'No particular stain. No particular record.',
  'Enforcer':   'Reliable. Cold. The ledger approves.',
  'Mercenary':  'A weapon that can be pointed. Someone is always looking.',
  'Predator':   'The city has noted the pattern.',
  'Survivor':   'Neutral. For now.',
  'Cutpurse':   "The city does not forget what you've taken from it.",
  'Ruffian':    'Grommash is watching.',
  'Killer':     'There is a notice with your name on it.',
  'Butcher':    'The wardens move differently when you enter a room.',
  'Dread':      'The city holds its breath when you pass.',
  'Ash Wraith': 'You are the thing people warn others about.',
};

function updateStanding(data) {
  const { archetype, mercy_score, order_score, crime_heat,
          has_bounty, bounty_reward } = data;

  document.getElementById('standing-archetype-label').textContent = archetype || 'Survivor';
  document.getElementById('standing-archetype-flavor').textContent =
    ARCHETYPE_FLAVOR[archetype] || ARCHETYPE_FLAVOR['Survivor'];

  // ── Mercy bar (bidirectional, centered) ──────────────────────
  // Scale: -200 to +200 → bar fills from center (50%) left (cruel) or right (merciful)
  const mercyPct = ((mercy_score || 0) + 200) / 400; // 0.0 – 1.0
  const mercyEl  = document.getElementById('bar-mercy');
  if (mercy_score >= 0) {
    // Merciful: fill right from center
    mercyEl.style.left   = '50%';
    mercyEl.style.right  = '';
    mercyEl.style.width  = (mercyPct - 0.5) * 100 + '%';
    mercyEl.style.background = 'var(--ok)';
  } else {
    // Cruel: fill left from center
    mercyEl.style.left   = '';
    mercyEl.style.right  = '50%';
    mercyEl.style.width  = (0.5 - mercyPct) * 100 + '%';
    mercyEl.style.background = 'var(--danger)';
  }

  // ── Order bar (bidirectional, centered) ──────────────────────
  const orderPct = ((order_score || 0) + 200) / 400;
  const orderEl  = document.getElementById('bar-order');
  if (order_score >= 0) {
    orderEl.style.left   = '50%';
    orderEl.style.right  = '';
    orderEl.style.width  = (orderPct - 0.5) * 100 + '%';
    orderEl.style.background = 'var(--accent)';
  } else {
    orderEl.style.left   = '';
    orderEl.style.right  = '50%';
    orderEl.style.width  = (0.5 - orderPct) * 100 + '%';
    orderEl.style.background = 'rgba(255,180,80,.7)'; /* amber for chaos */
  }

  // ── Heat bar (left to right, 0–20 scale) ─────────────────────
  const heatPct = Math.min(1, (crime_heat || 0) / 20) * 100;
  const heatEl  = document.getElementById('bar-heat');
  heatEl.style.width = heatPct + '%';
  // Color shifts: grey → amber → red
  if (crime_heat >= 11) {
    heatEl.style.background = 'var(--danger)';
  } else if (crime_heat >= 4) {
    heatEl.style.background = 'rgba(255,180,80,.8)';
  } else {
    heatEl.style.background = 'rgba(167,173,189,.4)';
  }

  // ── Bounty indicator ─────────────────────────────────────────
  const indicator = document.getElementById('bounty-indicator');
  if (has_bounty) {
    indicator.style.display = 'flex';
    document.getElementById('bounty-indicator-text').textContent =
      `Bounty Active — ${bounty_reward} AM`;
  } else {
    indicator.style.display = 'none';
  }
}
```

### Wire into refreshSidebar()

Update `refreshSidebar()` to fetch alignment alongside the existing calls:

```javascript
async function refreshSidebar() {
  try {
    const [charData, walletData, invData, alignData] = await Promise.all([
      GET('/api/character'),
      GET('/api/wallet'),
      GET('/api/inventory'),
      GET('/api/alignment'),
    ]);
    updateCharPanel(charData);
    updateWallet(walletData);
    updateInventory(invData.items);
    updateStanding(alignData);
  } catch(e) {}
}
```

---

## PART 2 — Bounty Board Overlay

### HTML

Add this overlay div after the existing `#board-overlay` block:

```html
<!-- ── Bounty Board Overlay ──────────────────────────────────── -->
<div id="bounty-overlay">
  <div id="bounty-box">

    <div id="bounty-header">
      <div id="bounty-header-left">
        <span id="bounty-title">The Warden's Post</span>
        <span id="bounty-subtitle">Official bounties, witnessed and sealed.</span>
      </div>
      <button id="bounty-close" onclick="closeBountyBoard()">✕</button>
    </div>

    <!-- Tab bar -->
    <div id="bounty-tabs">
      <button class="bounty-tab active" id="tab-official"
              onclick="switchBountyTab('official')">Official</button>
      <button class="bounty-tab" id="tab-player"
              onclick="switchBountyTab('player')">Player</button>
      <button class="bounty-tab" id="tab-post"
              onclick="switchBountyTab('post')">Post a Bounty</button>
    </div>

    <!-- Official bounties list -->
    <div id="bounty-pane-official" class="bounty-pane">
      <div id="official-list"></div>
    </div>

    <!-- Player bounties list -->
    <div id="bounty-pane-player" class="bounty-pane" style="display:none">
      <div id="player-list"></div>
    </div>

    <!-- Post a bounty form -->
    <div id="bounty-pane-post" class="bounty-pane" style="display:none">
      <div id="post-form">
        <div class="post-field">
          <label class="post-label">Target name</label>
          <input id="post-target" type="text" placeholder="Player name" autocomplete="off"/>
        </div>
        <div class="post-field">
          <label class="post-label">Reason <span class="post-optional">(optional)</span></label>
          <input id="post-reason" type="text" placeholder="Why the city should care" autocomplete="off"/>
        </div>
        <div class="post-field">
          <label class="post-label">Reward (AM)</label>
          <input id="post-reward" type="number" min="50" placeholder="Minimum 50"/>
        </div>
        <div id="post-fee-note">Posting fee: 25 AM. Total deducted on submit.</div>
        <button class="btn primary" onclick="submitBounty()">Post Bounty</button>
        <div id="post-result"></div>
      </div>
    </div>

  </div>
</div>
```

### CSS

Add after the `#bounty-indicator` styles:

```css
#bounty-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(4px);
  z-index: 300;
  place-items: center;
}

#bounty-overlay.open {
  display: grid;
}

#bounty-box {
  width: min(680px, 96vw);
  max-height: 80vh;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#bounty-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

#bounty-header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

#bounty-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

#bounty-subtitle {
  font-size: 11px;
  color: var(--muted);
  font-style: italic;
}

#bounty-close {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  padding: 2px 6px;
  cursor: pointer;
}

#bounty-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 16px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.bounty-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  font-size: 13px;
  padding: 6px 12px 8px;
  cursor: pointer;
  border-radius: 0;
}

.bounty-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.bounty-pane {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

/* Bounty card */
.bounty-card {
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.bounty-card-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.bounty-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.bounty-card-meta {
  font-size: 11px;
  color: var(--muted);
}

.bounty-card-reason {
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
}

.bounty-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.bounty-reward {
  font-size: 15px;
  font-weight: 700;
  color: var(--ok);
}

.bounty-reward-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.bounty-claim-btn {
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid rgba(87,212,143,.3);
  background: rgba(87,212,143,.08);
  color: var(--ok);
  cursor: pointer;
}

.bounty-empty {
  color: var(--muted);
  font-style: italic;
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
}

/* Post form */
.post-field {
  margin-bottom: 14px;
}

.post-label {
  display: block;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 5px;
}

.post-optional {
  font-style: italic;
  text-transform: none;
  letter-spacing: 0;
}

#post-fee-note {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 14px;
}

#post-result {
  margin-top: 10px;
  font-size: 13px;
  min-height: 20px;
}
```

### JavaScript — Bounty Board Functions

Add these functions after `closeBoard()`:

```javascript
// ── Bounty Board ─────────────────────────────────────────────────

let currentBountyTab = 'official';

async function openBountyBoard() {
  currentBountyTab = 'official';
  document.getElementById('bounty-overlay').classList.add('open');
  await loadBountyTab('official');
}

function closeBountyBoard() {
  document.getElementById('bounty-overlay').classList.remove('open');
}

function switchBountyTab(tab) {
  currentBountyTab = tab;

  // Update tab button states
  document.querySelectorAll('.bounty-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  // Show correct pane
  document.querySelectorAll('.bounty-pane').forEach(p => p.style.display = 'none');
  document.getElementById(`bounty-pane-${tab}`).style.display = '';

  // Update header subtitle
  const subtitles = {
    official: 'Official bounties, witnessed and sealed.',
    player:   'Bounties posted at the market noticeboard.',
    post:     'Post a bounty. 25 AM fee + reward held in escrow.',
  };
  document.getElementById('bounty-subtitle').textContent = subtitles[tab];

  if (tab === 'official' || tab === 'player') loadBountyTab(tab);
}

async function loadBountyTab(tab) {
  const listEl = document.getElementById(tab === 'official' ? 'official-list' : 'player-list');
  listEl.innerHTML = '<div class="bounty-empty">Loading...</div>';

  try {
    const data = await GET(`/api/bounties/${tab}`);
    const bounties = data.bounties || [];

    if (!bounties.length) {
      listEl.innerHTML = `<div class="bounty-empty">${
        tab === 'official'
          ? 'No official bounties active. The ledger is clean.'
          : 'No player bounties posted.'
      }</div>`;
      return;
    }

    listEl.innerHTML = '';
    bounties.forEach(b => {
      const expires = b.expires_at
        ? formatTimeRemaining(b.expires_at)
        : 'No expiry';

      const card = document.createElement('div');
      card.className = 'bounty-card';
      card.innerHTML = `
        <div class="bounty-card-left">
          <div class="bounty-card-name">${escapeHtml(b.target_name)}</div>
          <div class="bounty-card-meta">
            ${tab === 'official'
              ? `Archetype: ${escapeHtml(b.archetype || '—')} &nbsp;·&nbsp; Last seen: ${escapeHtml(b.last_location || '—')}`
              : `Posted by: ${escapeHtml(b.poster_name || 'Anonymous')}`
            }
            &nbsp;·&nbsp; Expires: ${expires}
          </div>
          ${b.reason ? `<div class="bounty-card-reason">"${escapeHtml(b.reason)}"</div>` : ''}
        </div>
        <div class="bounty-card-right">
          <div>
            <div class="bounty-reward">${b.reward} AM</div>
            <div class="bounty-reward-label">Reward</div>
          </div>
          <button class="bounty-claim-btn" onclick="claimBounty(${b.id}, this)">
            Claim
          </button>
        </div>
      `;
      listEl.appendChild(card);
    });
  } catch(e) {
    listEl.innerHTML = `<div class="bounty-empty">${e.message}</div>`;
  }
}

async function claimBounty(bountyId, btn) {
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const result = await POST(`/api/bounties/claim/${bountyId}`);
    btn.textContent = 'Claimed';
    btn.style.borderColor = 'rgba(87,212,143,.6)';
    // Refresh sidebar to show new AM balance
    await refreshSidebar();
    // Show feedback in game log
    log(`<em>${result.message || `Bounty claimed. ${result.reward} AM added.`}</em>`);
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Claim';
    log(`<em>${e.message}</em>`);
  }
}

async function submitBounty() {
  const target = document.getElementById('post-target').value.trim();
  const reason = document.getElementById('post-reason').value.trim();
  const reward = parseInt(document.getElementById('post-reward').value);
  const resultEl = document.getElementById('post-result');

  if (!target) {
    resultEl.style.color = 'var(--danger)';
    resultEl.textContent = 'Target name required.';
    return;
  }
  if (!reward || reward < 50) {
    resultEl.style.color = 'var(--danger)';
    resultEl.textContent = 'Minimum reward is 50 AM.';
    return;
  }

  resultEl.style.color = 'var(--muted)';
  resultEl.textContent = 'Posting...';

  try {
    const result = await POST('/api/bounties/post', { target_name: target, reason, reward });
    resultEl.style.color = 'var(--ok)';
    resultEl.textContent = result.message || 'Bounty posted.';
    // Clear form
    document.getElementById('post-target').value = '';
    document.getElementById('post-reason').value = '';
    document.getElementById('post-reward').value = '';
    await refreshSidebar();
  } catch(e) {
    resultEl.style.color = 'var(--danger)';
    resultEl.textContent = e.message;
  }
}

// ── Utility helpers ───────────────────────────────────────────────

function formatTimeRemaining(expiresAtMs) {
  const remaining = expiresAtMs - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3_600_000);
  const mins  = Math.floor((remaining % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0)   return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

## PART 3 — Wire the Ember Post Trigger

### Update doBoard()

The existing `doBoard()` function reads the Ember Post. Replace it to open the
bounty board overlay when the player is in `market_square`, and fall back to 
the text board otherwise:

```javascript
async function doBoard() {
  // If in market_square, the Ember Post opens the bounty board
  // For now open bounty board from anywhere — location check can be added later
  try {
    await openBountyBoard();
  } catch(e) {
    log(`<em>${e.message}</em>`);
  }
}
```

### Add POST helper if missing

Check whether a `POST` helper exists alongside `GET`. If not, add:

```javascript
async function POST(path, body) {
  return api('POST', path, body);
}
```

### Add Escape key handler for new overlay

In the existing `keydown` event listener, add the bounty overlay to the 
escape key closes:

```javascript
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDialogue();
    closeBoard();
    closeBountyBoard();  // ← add this line
    document.getElementById('combat-overlay').classList.remove('open');
  }
});
```

---

## VERIFICATION CHECKLIST

- [ ] Standing panel visible in sidebar on load, updates every `refreshSidebar()`
- [ ] Mercy bar fills right (green) when positive, left (red) when negative
- [ ] Order bar fills right (purple) when positive, left (amber) when negative
- [ ] Heat bar empty when clean, amber at heat 4+, red at heat 11+
- [ ] Bounty indicator hidden when no bounty, visible with reward amount when active
- [ ] Clicking Ember Post (doBoard) opens bounty overlay
- [ ] Official tab loads and displays official bounties with archetype + last location
- [ ] Player tab loads and displays player-posted bounties with poster + reason
- [ ] Post tab form validates (min 50 AM reward, target required)
- [ ] Post tab deducts AM and shows success message
- [ ] Claim button pays reward, disables itself, refreshes sidebar balance
- [ ] Escape key closes overlay
- [ ] All three bars show direction only — no numbers visible to player

---

## WHAT THIS DOES NOT DO (next pass)

- Location-gating the board to wardens_post / market_square
- Expired bounty cleanup (backend cron — separate pass)
- Noticeboard in market_square as separate access point for player bounties
- Grommash dialogue referencing player's active bounties (NPC conditional pass)
