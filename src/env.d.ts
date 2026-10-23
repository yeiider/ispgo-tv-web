/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_API_URL: string;
}

// APIs que inyecta cada televisor; en el navegador no existen.
declare const tizen: any;
declare const webapis: any;
