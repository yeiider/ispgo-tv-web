import { platform } from '../platform';
import { AvPlayer } from './avplay';
import { Html5Player } from './html5';

export interface PlayerEvents {
  onPlaying: () => void;
  onError: () => void;
}

/** Reproduce un canal en pantalla completa debajo de la interfaz. */
export interface VideoPlayer {
  play(url: string, events: PlayerEvents): void;
  stop(): void;
}

/**
 * Samsung usa AVPlay, el reproductor del propio televisor: decodifica por hardware lo que
 * trae la TV abierta (MPEG-2, audio MP2), que el <video> del navegador no siempre acepta.
 * LG y el navegador usan <video>, que en webOS también pasa por el reproductor del equipo.
 */
export function createPlayer(container: HTMLElement): VideoPlayer {
  return platform === 'tizen' ? new AvPlayer(container) : new Html5Player(container);
}
