const shieldToggle = document.getElementById('toggle-shield');
const shieldStatus = document.getElementById('shield-status');
const thruster = document.getElementById('thruster');
const thrusterOutput = document.getElementById('thruster-output');
const coreStatus = document.getElementById('core-status');
const chips = document.querySelectorAll('.chip');
const telemetry = document.getElementById('telemetry');
const signal = document.getElementById('signal');
const spectra = document.getElementById('spectra');
const grav = document.getElementById('grav');
const drift = document.getElementById('drift');
const sync = document.getElementById('sync');

let shieldsOnline = false;
const random = (min, max) => (Math.random() * (max - min) + min).toFixed(3);

shieldToggle?.addEventListener('click', () => {
  shieldsOnline = !shieldsOnline;
  shieldToggle.setAttribute('aria-pressed', shieldsOnline.toString());
  shieldStatus.textContent = shieldsOnline ? 'Online' : 'Arming';
  shieldStatus.classList.toggle('status-soft', !shieldsOnline);
  telemetry.textContent = shieldsOnline ? 'Shielded + clean' : 'Awaiting signal';
});

thruster?.addEventListener('input', (event) => {
  const value = Number(event.target.value);
  thrusterOutput.textContent = `${value}% burn`;
  drift.textContent = `${(value / 15 - 2.4).toFixed(1)}°`;
  document.documentElement.style.setProperty('--panel', `rgba(${6 + value / 8}, ${12 + value / 4}, ${33 + value / 3}, 0.8)`);
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const level = chip.dataset.level ?? 'Nominal';
    coreStatus.textContent = level;
    coreStatus.style.color = level === 'Overdrive' ? 'var(--accent-3)' : 'var(--accent)';
    spectra.textContent = `${(6 + Math.random() * 3).toFixed(1)} keV`;
    grav.textContent = `${random(0.001, 0.007)} g`;
    sync.textContent = level === 'Overdrive' ? 'De-sync risk' : 'Locked';
  });
});

function pulseTelemetry() {
  signal.textContent = `${(99 + Math.random()).toFixed(1)}%`;
  telemetry.textContent = shieldsOnline ? 'Shielded + clean' : 'Awaiting signal';
  setTimeout(pulseTelemetry, 1800);
}

function idleGlow() {
  document.body.style.backgroundPosition = `${Math.random() * 12}px ${Math.random() * 12}px`;
  setTimeout(idleGlow, 2600);
}

pulseTelemetry();
idleGlow();
