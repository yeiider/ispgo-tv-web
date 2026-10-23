import type { PlayerEvents, VideoPlayer } from './index';

export class Html5Player implements VideoPlayer {
  private readonly video: HTMLVideoElement;
  private events: PlayerEvents | null = null;

  constructor(container: HTMLElement) {
    this.video = document.createElement('video');
    this.video.className = 'video-surface';
    this.video.autoplay = true;
    this.video.addEventListener('playing', () => this.events?.onPlaying());
    this.video.addEventListener('error', () => this.events?.onError());
    this.video.addEventListener('ended', () => this.events?.onError());
    container.appendChild(this.video);
  }

  play(url: string, events: PlayerEvents): void {
    this.events = events;
    this.video.src = url;
    const started = this.video.play();
    if (started) started.catch(() => undefined);
  }

  stop(): void {
    this.events = null;
    this.video.removeAttribute('src');
    this.video.load();
  }
}
