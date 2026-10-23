export type Platform = 'tizen' | 'webos' | 'browser';

export const platform: Platform =
  typeof tizen !== 'undefined' ? 'tizen' : /Web0S|webOS/i.test(navigator.userAgent) ? 'webos' : 'browser';

/** Códigos de las teclas del control remoto en cada marca (las flechas y OK son estándar). */
export const Keys = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  enter: 13,
  back: platform === 'webos' ? 461 : 10009,
  channelUp: platform === 'webos' ? 33 : 427,
  channelDown: platform === 'webos' ? 34 : 428,
  info: 457,
};

export function isBack(e: KeyboardEvent): boolean {
  return e.keyCode === Keys.back || e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack';
}

/** Tizen solo entrega CH+/CH- e Info a la app si se piden; el resto llega solo. */
export function setupPlatform(): Promise<void> {
  if (platform !== 'tizen') return Promise.resolve();
  ['ChannelUp', 'ChannelDown', 'Info'].forEach((key) => {
    try {
      tizen.tvinputdevice.registerKey(key);
    } catch {
      // Algunos modelos no tienen la tecla: se sigue con las flechas.
    }
  });
  // AVPlay vive en webapis.js, que el televisor sirve desde su propio sistema.
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '$WEBAPIS/webapis/webapis.js';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export function exitApp(): void {
  if (platform === 'tizen') tizen.application.getCurrentApplication().exit();
  else window.close();
}

export function deviceName(): string {
  if (platform === 'tizen') {
    try {
      return `TV Samsung ${webapis.productinfo.getModel()}`;
    } catch {
      return 'TV Samsung';
    }
  }
  return platform === 'webos' ? 'TV LG' : 'Navegador';
}
