/**
 * Dragon & Panda — shared control customizer
 * Keyboard + Xbox / generic gamepad (Gamepad API)
 * Storage: dp_binds_v2 (keyboard) + dp_pad_v2 (xbox)
 */
(function (global) {
  const ACTIONS = [
    { id: 'moveFwd', label: 'Move Forward', defKey: 'KeyW', defPad: 'LS_UP' },
    { id: 'moveBack', label: 'Move Back', defKey: 'KeyS', defPad: 'LS_DOWN' },
    { id: 'moveLeft', label: 'Move Left', defKey: 'KeyA', defPad: 'LS_LEFT' },
    { id: 'moveRight', label: 'Move Right', defKey: 'KeyD', defPad: 'LS_RIGHT' },
    { id: 'look', label: 'Look (mouse / RS)', defKey: 'Mouse', defPad: 'RS' },
    { id: 'interact', label: 'Interact / Use', defKey: 'KeyE', defPad: 'A' },
    { id: 'jump', label: 'Jump / Climb', defKey: 'Space', defPad: 'A_HOLD' },
    { id: 'fly', label: 'Fly / Mount Drone', defKey: 'KeyF', defPad: 'LB' },
    { id: 'drive', label: 'Drive / Mount Dragon', defKey: 'KeyV', defPad: 'RB' },
    { id: 'ability', label: 'Ability (Frost / Suppress)', defKey: 'KeyR', defPad: 'Y' },
    { id: 'shoot', label: 'Shoot / Attack', defKey: 'Mouse0', defPad: 'RT' },
    { id: 'boom', label: 'Boom Orb', defKey: 'KeyB', defPad: 'B' },
    { id: 'douse', label: 'Douse / Water', defKey: 'KeyX', defPad: 'LT' },
    { id: 'cloak', label: 'Cloak', defKey: 'KeyC', defPad: 'X' },
    { id: 'jammer', label: 'Jammer', defKey: 'KeyJ', defPad: 'Y' },
    { id: 'menu', label: 'Controls Mapper', defKey: 'KeyP', defPad: 'Menu' },
    { id: 'avatar1', label: 'Avatar Dragon', defKey: 'Digit1', defPad: 'DPadUp' },
    { id: 'avatar2', label: 'Avatar Panda', defKey: 'Digit2', defPad: 'DPadDown' }
  ];

  const PAD_MAP = {
    A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7,
    Select: 8, Menu: 9, L3: 10, R3: 11,
    DPadUp: 12, DPadDown: 13, DPadLeft: 14, DPadRight: 15
  };

  const DEFAULT_KEYS = Object.fromEntries(ACTIONS.map(a => [a.id, a.defKey]));
  const DEFAULT_PAD = Object.fromEntries(ACTIONS.map(a => [a.id, a.defPad]));

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

  let keyBinds = load('dp_binds_v2', { ...DEFAULT_KEYS });
  let padBinds = load('dp_pad_v2', { ...DEFAULT_PAD });
  let capture = null; // { actionId, device: 'key'|'pad' }
  let listeners = { action: [] };
  let padIndex = -1;
  let lastPadButtons = [];
  let axes = { lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0 };
  let pressed = Object.create(null);
  let justPressed = Object.create(null);

  function emit(action, down) {
    listeners.action.forEach(fn => fn(action, down));
  }

  function onAction(fn) { listeners.action.push(fn); return () => { listeners.action = listeners.action.filter(f => f !== fn); }; }

  // ---- Keyboard ----
  window.addEventListener('keydown', e => {
    if (capture && capture.device === 'key') {
      e.preventDefault();
      if (e.code === 'Escape') { capture = null; renderMapper(); return; }
      keyBinds[capture.actionId] = e.code;
      save('dp_binds_v2', keyBinds);
      capture = null;
      renderMapper();
      return;
    }
    const act = Object.keys(keyBinds).find(id => keyBinds[id] === e.code);
    if (act) {
      if (!pressed[act]) { pressed[act] = true; justPressed[act] = true; emit(act, true); }
      // prevent scroll on space
      if (e.code === 'Space') e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    const act = Object.keys(keyBinds).find(id => keyBinds[id] === e.code);
    if (act && pressed[act]) { pressed[act] = false; emit(act, false); }
  });
  window.addEventListener('mousedown', e => {
    if (e.button === 0) {
      const act = Object.keys(keyBinds).find(id => keyBinds[id] === 'Mouse0');
      if (act) { pressed[act] = true; justPressed[act] = true; emit(act, true); }
    }
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 0) {
      const act = Object.keys(keyBinds).find(id => keyBinds[id] === 'Mouse0');
      if (act) { pressed[act] = false; emit(act, false); }
    }
  });

  // ---- Gamepad poll ----
  function findPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) return pads[i];
    return null;
  }

  function padButtonName(idx) {
    return Object.keys(PAD_MAP).find(k => PAD_MAP[k] === idx) || ('BTN' + idx);
  }

  function pollPad() {
    const pad = findPad();
    if (!pad) {
      padIndex = -1;
      axes = { lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0 };
      return;
    }
    padIndex = pad.index;
    const dead = 0.18;
    const ax = (v) => Math.abs(v) < dead ? 0 : v;
    axes.lx = ax(pad.axes[0] || 0);
    axes.ly = ax(pad.axes[1] || 0);
    axes.rx = ax(pad.axes[2] || 0);
    axes.ry = ax(pad.axes[3] || 0);
    // triggers: buttons 6/7 or axes
    axes.lt = pad.buttons[6] ? pad.buttons[6].value : 0;
    axes.rt = pad.buttons[7] ? pad.buttons[7].value : 0;

    if (capture && capture.device === 'pad') {
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i].pressed && !(lastPadButtons[i] && lastPadButtons[i].pressed)) {
          padBinds[capture.actionId] = padButtonName(i);
          save('dp_pad_v2', padBinds);
          capture = null;
          renderMapper();
          break;
        }
      }
    }

    // edge detect mapped buttons
    ACTIONS.forEach(a => {
      const bind = padBinds[a.id];
      if (!bind || bind === 'LS' || bind === 'RS' || bind.startsWith('LS_') || bind === 'RS') return;
      if (bind === 'A_HOLD') return; // special
      const idx = PAD_MAP[bind];
      if (idx === undefined) return;
      const btn = pad.buttons[idx];
      if (!btn) return;
      const was = lastPadButtons[idx] && lastPadButtons[idx].pressed;
      if (btn.pressed && !was) {
        pressed[a.id] = true; justPressed[a.id] = true; emit(a.id, true);
      } else if (!btn.pressed && was) {
        pressed[a.id] = false; emit(a.id, false);
      }
    });

    // axis as move
    // handled by isDown / getAxes

    lastPadButtons = pad.buttons.map(b => ({ pressed: b.pressed, value: b.value }));
  }

  function tick() {
    justPressed = Object.create(null);
    pollPad();
  }

  function isDown(actionId) {
    if (pressed[actionId]) return true;
    // continuous pad axes for move
    if (actionId === 'moveFwd' && axes.ly < -0.2) return true;
    if (actionId === 'moveBack' && axes.ly > 0.2) return true;
    if (actionId === 'moveLeft' && axes.lx < -0.2) return true;
    if (actionId === 'moveRight' && axes.lx > 0.2) return true;
    if (actionId === 'shoot' && axes.rt > 0.3) return true;
    if (actionId === 'douse' && axes.lt > 0.3) return true;
    return false;
  }

  function wasPressed(actionId) { return !!justPressed[actionId]; }

  function getAxes() { return { ...axes }; }

  function getMoveVector() {
    let x = 0, z = 0;
    if (isDown('moveLeft')) x -= 1;
    if (isDown('moveRight')) x += 1;
    if (isDown('moveFwd')) z -= 1;
    if (isDown('moveBack')) z += 1;
    // pad already included via isDown axes
    const l = Math.hypot(x, z) || 1;
    return { x: x / l, z: z / l, rawX: axes.lx, rawY: axes.ly, lookX: axes.rx, lookY: axes.ry };
  }

  function padConnected() { return findPad() !== null; }

  function resetBinds(device) {
    if (device === 'key' || !device) { keyBinds = { ...DEFAULT_KEYS }; save('dp_binds_v2', keyBinds); }
    if (device === 'pad' || !device) { padBinds = { ...DEFAULT_PAD }; save('dp_pad_v2', padBinds); }
    renderMapper();
  }

  function startCapture(actionId, device) {
    capture = { actionId, device };
    renderMapper();
  }

  // ---- Mapper UI ----
  function renderMapper() {
    const root = document.getElementById('dp-mapper');
    if (!root) return;
    const pad = findPad();
    root.innerHTML = `
      <div class="dp-mapper-head">
        <h3>CONTROLS / XBOX</h3>
        <span class="dp-pad-status">${pad ? '🟢 ' + (pad.id || 'Gamepad').slice(0, 40) : '⚪ No pad — plug Xbox / press any button'}</span>
        <button type="button" class="dp-close" id="dp-mapper-close">×</button>
      </div>
      <p class="dp-hint">Click a row to rebind. Keyboard and Xbox maps are stored separately. Esc cancels capture.</p>
      <div class="dp-tabs">
        <button type="button" class="dp-tab on" data-tab="key">Keyboard</button>
        <button type="button" class="dp-tab" data-tab="pad">Xbox / Pad</button>
      </div>
      <div class="dp-list" id="dp-list-key"></div>
      <div class="dp-list" id="dp-list-pad" style="display:none"></div>
      <div class="dp-actions">
        <button type="button" id="dp-reset-key">Reset Keyboard</button>
        <button type="button" id="dp-reset-pad">Reset Xbox</button>
      </div>
      ${capture ? `<div class="dp-capture">Press ${capture.device === 'key' ? 'a key' : 'a pad button'} for <b>${ACTIONS.find(a => a.id === capture.actionId)?.label}</b>… (Esc cancel)</div>` : ''}
    `;
    const listKey = root.querySelector('#dp-list-key');
    const listPad = root.querySelector('#dp-list-pad');
    ACTIONS.forEach(a => {
      const rowK = document.createElement('div');
      rowK.className = 'dp-row' + (capture && capture.actionId === a.id && capture.device === 'key' ? ' capturing' : '');
      rowK.innerHTML = `<span>${a.label}</span><code>${keyBinds[a.id] || '—'}</code>`;
      rowK.onclick = () => startCapture(a.id, 'key');
      listKey.appendChild(rowK);

      const rowP = document.createElement('div');
      rowP.className = 'dp-row' + (capture && capture.actionId === a.id && capture.device === 'pad' ? ' capturing' : '');
      rowP.innerHTML = `<span>${a.label}</span><code>${padBinds[a.id] || '—'}</code>`;
      rowP.onclick = () => startCapture(a.id, 'pad');
      listPad.appendChild(rowP);
    });
    root.querySelectorAll('.dp-tab').forEach(tab => {
      tab.onclick = () => {
        root.querySelectorAll('.dp-tab').forEach(t => t.classList.remove('on'));
        tab.classList.add('on');
        listKey.style.display = tab.dataset.tab === 'key' ? 'block' : 'none';
        listPad.style.display = tab.dataset.tab === 'pad' ? 'block' : 'none';
      };
    });
    root.querySelector('#dp-mapper-close').onclick = () => { root.classList.remove('open'); capture = null; };
    root.querySelector('#dp-reset-key').onclick = () => resetBinds('key');
    root.querySelector('#dp-reset-pad').onclick = () => resetBinds('pad');
  }

  function openMapper() {
    let root = document.getElementById('dp-mapper');
    if (!root) {
      root = document.createElement('div');
      root.id = 'dp-mapper';
      document.body.appendChild(root);
    }
    root.classList.add('open');
    renderMapper();
  }

  function ensureStyles() {
    if (document.getElementById('dp-mapper-css')) return;
    const s = document.createElement('style');
    s.id = 'dp-mapper-css';
    s.textContent = `
      #dp-mapper{display:none;position:fixed;inset:0;z-index:500;background:rgba(0,0,10,.88);align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#0ff}
      #dp-mapper.open{display:flex}
      #dp-mapper > div, #dp-mapper{flex-direction:column}
      #dp-mapper{padding:16px}
      #dp-mapper .dp-mapper-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;width:min(520px,96vw);margin:0 auto 8px}
      #dp-mapper h3{margin:0;background:linear-gradient(90deg,#f0f,#0ff);-webkit-background-clip:text;background-clip:text;color:transparent}
      #dp-mapper .dp-pad-status{font-size:.75rem;color:#8af;flex:1}
      #dp-mapper .dp-close{background:#0ff2;border:1px solid #0ff;color:#0ff;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:1.2rem}
      #dp-mapper .dp-hint{width:min(520px,96vw);margin:0 auto 10px;font-size:.78rem;color:#9cf}
      #dp-mapper .dp-tabs{width:min(520px,96vw);margin:0 auto 8px;display:flex;gap:6px}
      #dp-mapper .dp-tab{padding:6px 14px;border-radius:8px;border:1px solid #0ff5;background:#0ff15;color:#0ff;cursor:pointer}
      #dp-mapper .dp-tab.on{background:#0ff;color:#000}
      #dp-mapper .dp-list{width:min(520px,96vw);margin:0 auto;max-height:50vh;overflow:auto;background:rgba(0,12,30,.95);border:1px solid #0ff4;border-radius:12px;padding:6px}
      #dp-mapper .dp-row{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid #0ff2;cursor:pointer;font-size:.85rem}
      #dp-mapper .dp-row:hover{background:#0ff18}
      #dp-mapper .dp-row.capturing{background:#f0f3;border-color:#f0f}
      #dp-mapper .dp-row code{color:#ff0;font-size:.8rem}
      #dp-mapper .dp-actions{width:min(520px,96vw);margin:10px auto 0;display:flex;gap:8px}
      #dp-mapper .dp-actions button{flex:1;padding:8px;border-radius:8px;border:1px solid #0ff5;background:#1a0044;color:#0ff;cursor:pointer}
      #dp-mapper .dp-capture{width:min(520px,96vw);margin:12px auto 0;padding:12px;background:#f0f2;border:1px solid #f0f;border-radius:10px;text-align:center;animation:dp-pulse 1s infinite}
      @keyframes dp-pulse{50%{box-shadow:0 0 20px #f0f8}}
    `;
    document.head.appendChild(s);
  }

  // auto open on P / Menu
  window.addEventListener('keydown', e => {
    if (e.code === (keyBinds.menu || 'KeyP') && !capture) { e.preventDefault(); ensureStyles(); openMapper(); }
  });

  // listen for gamepad connect
  window.addEventListener('gamepadconnected', e => {
    console.log('[DP Controls] Gamepad connected', e.gamepad.id);
  });

  global.DPControls = {
    ACTIONS, tick, isDown, wasPressed, getAxes, getMoveVector, padConnected,
    onAction, openMapper, ensureStyles, resetBinds,
    getKeyBinds: () => ({ ...keyBinds }),
    getPadBinds: () => ({ ...padBinds }),
    renderMapper
  };
})(typeof window !== 'undefined' ? window : globalThis);
