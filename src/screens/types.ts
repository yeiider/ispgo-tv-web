/** Una pantalla de la app: su contenido, cómo responde al control y cómo se limpia al salir. */
export interface Screen {
  el: HTMLElement;
  onKey(e: KeyboardEvent): boolean;
  dispose(): void;
}
