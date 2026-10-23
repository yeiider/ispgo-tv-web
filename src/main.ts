import './styles.css';
import { instanceApi, type Channel } from './api';
import { moveFocus, selectFocused } from './dom';
import { createPlayer } from './player';
import { exitApp, isBack, Keys, setupPlatform } from './platform';
import { homeScreen } from './screens/home';
import { pairingScreen } from './screens/pairing';
import type { Screen } from './screens/types';
import { watchScreen } from './screens/watch';
import { clearSession, loadSession, type Session } from './session';

const root = document.getElementById('app')!;
const videoLayer = document.createElement('div');
videoLayer.className = 'video-layer';
document.body.insertBefore(videoLayer, root);

let screen: Screen | null = null;
let onBack: () => void = exitApp;

function show(next: Screen, back: () => void): void {
  if (screen) screen.dispose();
  root.innerHTML = '';
  root.appendChild(next.el);
  screen = next;
  onBack = back;
}

function showPairing(): void {
  show(pairingScreen(showHome), exitApp);
}

function showHome(session: Session, lastChannelId?: number): void {
  document.body.classList.remove('watching');
  show(
    homeScreen(
      session,
      {
        watch: (channel, lineup) => showWatch(session, channel, lineup),
        unpair: () => unpair(session),
        signedOut,
      },
      lastChannelId,
    ),
    exitApp,
  );
}

function showWatch(session: Session, channel: Channel, lineup: Channel[]): void {
  let current = channel;
  document.body.classList.add('watching');
  show(
    watchScreen(session, player, lineup, channel, (c) => (current = c), signedOut),
    () => showHome(session, current.id),
  );
}

/** La sesión se cierra también en el servidor: el televisor desaparece de "Mis dispositivos". */
function unpair(session: Session): void {
  instanceApi.logout(session).catch(() => undefined);
  clearSession();
  showPairing();
}

function signedOut(): void {
  clearSession();
  showPairing();
}

document.addEventListener('keydown', (e) => {
  if (isBack(e)) {
    e.preventDefault();
    onBack();
    return;
  }
  if (screen && screen.onKey(e)) {
    e.preventDefault();
    return;
  }
  const direction = { [Keys.left]: 'left', [Keys.right]: 'right', [Keys.up]: 'up', [Keys.down]: 'down' }[e.keyCode] as
    | 'left'
    | 'right'
    | 'up'
    | 'down'
    | undefined;
  if (direction) {
    e.preventDefault();
    moveFocus(root, direction);
  } else if (e.keyCode === Keys.enter) {
    e.preventDefault();
    selectFocused();
  }
});

let player: ReturnType<typeof createPlayer>;

setupPlatform().then(() => {
  player = createPlayer(videoLayer);
  const session = loadSession();
  if (session) showHome(session);
  else showPairing();
});
