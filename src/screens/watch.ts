import { ApiError, instanceApi, type Channel } from '../api';
import { h } from '../dom';
import { Keys } from '../platform';
import type { VideoPlayer } from '../player';
import type { Session } from '../session';
import type { Screen } from './types';

const INFO_MS = 4000;

/**
 * Canal en pantalla completa. Arriba/abajo (o CH+/CH-) cambian de canal y OK muestra
 * qué se está viendo; atrás vuelve a la guía.
 */
export function watchScreen(
  session: Session,
  player: VideoPlayer,
  lineup: Channel[],
  first: Channel,
  onChannel: (channel: Channel) => void,
  signedOut: () => void,
): Screen {
  const status = h('div', { class: 'watch-status' });
  const info = h('div', { class: 'channel-info hidden' });
  const el = h('main', { class: 'screen watch' }, [status, info]);
  let index = Math.max(0, lineup.indexOf(first));
  let infoTimer = 0;
  let request = 0;

  function showStatus(content: HTMLElement | null): void {
    status.innerHTML = '';
    if (content) status.appendChild(content);
  }

  function showInfo(): void {
    const channel = lineup[index];
    info.innerHTML = '';
    if (channel.number !== null) info.appendChild(h('div', { class: 'info-number', text: String(channel.number) }));
    if (channel.logo) info.appendChild(h('img', { class: 'info-logo', attrs: { src: channel.logo, alt: '' } }));
    info.appendChild(
      h('div', {}, [h('div', { class: 'info-name', text: channel.name }), h('div', { class: 'info-hint', text: 'Arriba/abajo: cambiar de canal' })]),
    );
    info.classList.remove('hidden');
    clearTimeout(infoTimer);
    infoTimer = window.setTimeout(() => info.classList.add('hidden'), INFO_MS);
  }

  /** La dirección se pide al momento: si la TV se suspendió, el servidor ya no la entrega. */
  async function tune(): Promise<void> {
    const channel = lineup[index];
    const current = ++request;
    player.stop();
    onChannel(channel);
    showInfo();
    showStatus(h('div', { class: 'spinner center' }));
    try {
      const stream = await instanceApi.play(session, channel.id);
      if (current !== request) return;
      player.play(stream.url, {
        onPlaying: () => current === request && showStatus(null),
        onError: () => current === request && showStatus(h('p', { class: 'error center', text: 'No se pudo reproducir este canal. Prueba otro.' })),
      });
    } catch (e) {
      if (current !== request) return;
      if (e instanceof ApiError && e.status === 401) return signedOut();
      showStatus(h('p', { class: 'error center', text: (e as Error).message }));
    }
  }

  function zap(step: number): void {
    index = (index + step + lineup.length) % lineup.length;
    tune();
  }

  tune();

  return {
    el,
    onKey: (e) => {
      switch (e.keyCode) {
        case Keys.up:
        case Keys.channelUp:
          zap(1);
          return true;
        case Keys.down:
        case Keys.channelDown:
          zap(-1);
          return true;
        case Keys.enter:
        case Keys.info:
          showInfo();
          return true;
        default:
          return false;
      }
    },
    dispose: () => {
      request++;
      clearTimeout(infoTimer);
      player.stop();
    },
  };
}
