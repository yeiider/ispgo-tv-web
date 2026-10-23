type Child = Node | string | null | undefined | false;

/** Crea un elemento con clases, atributos y contenido en una línea. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { class?: string; text?: string; attrs?: Record<string, string> } = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.attrs) Object.keys(props.attrs).forEach((key) => el.setAttribute(key, props.attrs![key]));
  children.forEach((child) => {
    if (child) el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return el;
}

const actions = new WeakMap<Element, () => void>();

/** Botón o tarjeta que se puede seleccionar con las flechas del control. */
export function focusable<T extends HTMLElement>(el: T, onSelect: () => void): T {
  el.classList.add('focusable');
  el.tabIndex = -1;
  el.addEventListener('click', onSelect);
  actions.set(el, onSelect);
  return el;
}

export function focus(el: Element | null | undefined): void {
  if (!(el instanceof HTMLElement)) return;
  el.focus();
  const scroll = (el as HTMLElement & { scrollIntoViewIfNeeded?: (center: boolean) => void }).scrollIntoViewIfNeeded;
  if (scroll) scroll.call(el, false);
  else el.scrollIntoView(false);
}

type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * Navegación con flechas: salta al elemento seleccionable más cercano en esa dirección,
 * prefiriendo el que está alineado con el actual (como en la guía de un televisor).
 */
export function moveFocus(root: HTMLElement, direction: Direction): void {
  const items = Array.prototype.slice.call(root.querySelectorAll('.focusable')) as HTMLElement[];
  const current = document.activeElement as HTMLElement | null;
  if (!current || items.indexOf(current) < 0) {
    focus(items[0]);
    return;
  }

  const from = current.getBoundingClientRect();
  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  items.forEach((item) => {
    if (item === current) return;
    const r = item.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const ahead = { left: fx - x, right: x - fx, up: fy - y, down: y - fy }[direction];
    if (ahead <= 1) return;
    // Arriba/abajo no salta de columna: de la última categoría no cae en la cuadrícula.
    const vertical = direction === 'up' || direction === 'down';
    if (vertical && (r.right <= from.left || r.left >= from.right)) return;
    const aside = direction === 'left' || direction === 'right' ? Math.abs(y - fy) : Math.abs(x - fx);
    const score = ahead + aside * 3;
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  });

  if (best) focus(best);
}

export function selectFocused(): void {
  const action = document.activeElement && actions.get(document.activeElement);
  if (action) action();
}
