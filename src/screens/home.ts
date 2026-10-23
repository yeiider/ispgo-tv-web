import { ApiError, instanceApi, type Channel, type TvGuide } from '../api';
import { focus, focusable, h } from '../dom';
import type { Session } from '../session';
import type { Screen } from './types';

export interface HomeActions {
  watch: (channel: Channel, lineup: Channel[]) => void;
  unpair: () => void;
  signedOut: () => void;
}

/** Guía de canales: categorías a la izquierda y la cuadrícula de canales a la derecha. */
export function homeScreen(session: Session, actions: HomeActions, lastChannelId?: number): Screen {
  const body = h('div', { class: 'home-body' }, [h('div', { class: 'spinner center' })]);
  const unpairButton = focusable(h('button', { class: 'button ghost', text: 'Desvincular' }), actions.unpair);
  const el = h('main', { class: 'screen home' }, [
    h('header', { class: 'home-header' }, [
      session.logoUrl
        ? h('img', { class: 'provider-logo', attrs: { src: session.logoUrl, alt: session.instanceName } })
        : h('img', { class: 'provider-logo', attrs: { src: './logo.png', alt: 'IspGo' } }),
      h('div', { class: 'greeting', text: session.customerName ? `Hola, ${session.customerName}` : session.instanceName }),
      unpairButton,
    ]),
    body,
  ]);

  let category: number | null = null;
  let guide: TvGuide | null = null;

  function lineup(): Channel[] {
    return guide ? guide.channels.filter((c) => category === null || c.category_id === category) : [];
  }

  function message(text: string, button: HTMLElement): void {
    body.innerHTML = '';
    body.appendChild(h('div', { class: 'message' }, [h('p', { text }), button]));
    focus(button);
  }

  async function load(): Promise<void> {
    body.innerHTML = '';
    body.appendChild(h('div', { class: 'spinner center' }));
    try {
      guide = await instanceApi.guide(session);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return actions.signedOut();
      return message((e as Error).message, focusable(h('button', { class: 'button', text: 'Reintentar' }), load));
    }
    if (guide.status !== 'active') {
      return message(
        guide.message || 'Tu plan no incluye TV.',
        focusable(h('button', { class: 'button', text: 'Desvincular este televisor' }), actions.unpair),
      );
    }
    render();
    const last = lastChannelId && body.querySelector(`[data-channel="${lastChannelId}"]`);
    focus(last || body.querySelector('.channel'));
  }

  function render(): void {
    if (!guide) return;
    const categories = h('nav', { class: 'categories' });
    const all: Array<{ id: number | null; name: string }> = [{ id: null, name: 'Todos' }];
    all.concat(guide.categories).forEach((c) => {
      const item = focusable(h('button', { class: 'category' + (c.id === category ? ' selected' : ''), text: c.name }), () => {
        category = c.id;
        render();
        focus(body.querySelector('.channel'));
      });
      categories.appendChild(item);
    });

    const grid = h('section', { class: 'channels' });
    const channels = lineup();
    channels.forEach((channel) => {
      const card = focusable(
        h('button', { class: 'channel', attrs: { 'data-channel': String(channel.id) } }, [
          h('div', { class: 'channel-logo' }, [channel.logo ? h('img', { attrs: { src: channel.logo, alt: '' } }) : null]),
          h('div', { class: 'channel-name', text: [channel.number, channel.name].filter((x) => x !== null).join('  ') }),
        ]),
        () => actions.watch(channel, channels),
      );
      grid.appendChild(card);
    });
    if (channels.length === 0) grid.appendChild(h('p', { class: 'empty', text: 'No hay canales en esta categoría.' }));

    body.innerHTML = '';
    body.appendChild(categories);
    body.appendChild(grid);
  }

  load();

  return { el, onKey: () => false, dispose: () => undefined };
}
