import qrcode from 'qrcode-generator';
import { ApiError, cloudApi, instanceApi } from '../api';
import { randomSecret, sha256Hex } from '../crypto';
import { h } from '../dom';
import { deviceName } from '../platform';
import { saveSession, type Session } from '../session';
import type { Screen } from './types';

const POLL_MS = 3000;
const RETRY_MS = 5000;

/**
 * El televisor pide un código a IspGo Cloud con el hash de un secreto que nunca sale de
 * aquí, espera a que el celular del cliente lo reclame y con el secreto pide su sesión
 * directo a la instancia del ISP. La Cloud nunca ve la sesión.
 */
export function pairingScreen(onPaired: (session: Session) => void): Screen {
  const qr = h('div', { class: 'qr' }, [h('div', { class: 'spinner' })]);
  const code = h('div', { class: 'pair-code', text: ' ' });
  const error = h('p', { class: 'error' });
  let active = true;
  let timer = 0;

  const el = h('main', { class: 'screen pairing' }, [
    h('section', { class: 'pair-steps' }, [
      h('img', { class: 'brand', attrs: { src: './logo.png', alt: 'IspGo' } }),
      h('h1', { text: 'Vincula este televisor' }),
      step(1, 'Abre la app IspGo Cliente en tu celular.'),
      step(2, 'Entra a TV y toca "Ver en mi televisor".'),
      step(3, 'Escanea este código o escribe las letras que ves aquí.'),
      error,
    ]),
    h('section', { class: 'pair-code-box' }, [qr, code]),
  ]);

  const wait = (ms: number) => new Promise<void>((resolve) => (timer = window.setTimeout(resolve, ms)));

  async function run(): Promise<void> {
    while (active) {
      const secret = randomSecret();
      let pending;
      try {
        pending = await cloudApi.createPairing(sha256Hex(secret));
      } catch (e) {
        error.textContent = (e as Error).message;
        await wait(RETRY_MS);
        continue;
      }
      if (!active) return;
      error.textContent = '';
      showCode(pending.code);
      const expiresAt = Date.now() + pending.expires_in * 1000;

      while (active && Date.now() < expiresAt) {
        await wait(POLL_MS);
        if (!active) return;
        let instanceUrl: string | null;
        try {
          const status = await cloudApi.pairing(pending.code, secret);
          instanceUrl = status.status === 'claimed' ? status.instance_url : null;
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) break;
          continue;
        }
        if (!instanceUrl) continue;

        code.textContent = 'Conectando…';
        qr.innerHTML = '';
        qr.appendChild(h('div', { class: 'spinner' }));
        try {
          const instance = await instanceApi.instance(instanceUrl);
          const activation = await instanceApi.activate(instanceUrl, pending.code, secret, deviceName());
          const session: Session = {
            instanceUrl,
            instanceName: instance.name,
            logoUrl: instance.logo_url,
            token: activation.token,
            customerName: activation.customer.first_name,
          };
          saveSession(session);
          if (active) onPaired(session);
          return;
        } catch (e) {
          error.textContent = (e as Error).message;
          break;
        }
      }
    }
  }

  function showCode(value: string): void {
    // El QR lleva solo el código: la app del celular lo reconoce y otra cámara solo muestra las letras.
    const generator = qrcode(0, 'M');
    generator.addData(value);
    generator.make();
    qr.innerHTML = generator.createSvgTag({ cellSize: 8, margin: 1, scalable: true });
    code.textContent = value.replace(/(.{4})(?=.)/g, '$1-');
  }

  run();

  return {
    el,
    onKey: () => false,
    dispose: () => {
      active = false;
      clearTimeout(timer);
    },
  };
}

function step(number: number, text: string): HTMLElement {
  return h('div', { class: 'step' }, [h('span', { class: 'step-number', text: String(number) }), h('span', { text })]);
}
