import type { PlayerEvents, VideoPlayer } from './index';

export class AvPlayer implements VideoPlayer {
  constructor(container: HTMLElement) {
    // AVPlay dibuja en una capa debajo de la página: este objeto marca dónde.
    const surface = document.createElement('object');
    surface.type = 'application/avplayer';
    surface.className = 'video-surface';
    container.appendChild(surface);
  }

  play(url: string, events: PlayerEvents): void {
    this.stop();
    const avplay = webapis.avplay;
    try {
      avplay.open(url);
      avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);
      avplay.setListener({
        onbufferingcomplete: () => events.onPlaying(),
        onerror: () => events.onError(),
        // Un canal en vivo no termina: si llega al final la fuente se cortó.
        onstreamcompleted: () => events.onError(),
      });
      avplay.prepareAsync(
        () => {
          avplay.play();
          events.onPlaying();
        },
        () => events.onError(),
      );
    } catch {
      events.onError();
    }
  }

  stop(): void {
    const avplay = webapis.avplay;
    if (avplay.getState() === 'NONE') return;
    try {
      avplay.stop();
    } finally {
      avplay.close();
    }
  }
}
