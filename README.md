# IspGo TV para Samsung y LG

App de televisor para los clientes de un ISP con IspGo, para Samsung (Tizen) y LG
(webOS). Es la misma app de [IspGo TV para Android TV](https://github.com/yeiider/ispgo-cliente-android),
hecha como página web porque así son las apps de esos televisores.

- **Vinculación por QR:** el televisor muestra un código, el cliente lo escanea en la app
  IspGo Cliente (TV → "Ver en mi televisor") y el televisor queda con su sesión. No se
  escribe usuario ni contraseña con el control.
- **Canales:** categorías a la izquierda y canales a la derecha; flechas para moverse y OK
  para ver.
- **Viendo un canal:** arriba/abajo o CH+/CH- cambian de canal, OK muestra cuál es y atrás
  vuelve a la guía.
- **Reproductor:** en Samsung usa AVPlay, el reproductor del televisor, que decodifica por
  hardware MPEG-2 y audio MP2 (los usa la TV abierta). En LG usa `<video>`, que en webOS
  también pasa por el reproductor del equipo.

## Cómo se vincula

1. El TV crea un secreto, manda su hash a IspGo Cloud (`POST /api/tv/pairings`) y muestra
   el código que recibe.
2. El celular manda el código a la instancia del ISP y la instancia lo reclama en la Cloud.
3. El TV pregunta a la Cloud con su secreto hasta que aparece la dirección de la instancia
   y le pide su sesión (`POST /api/app/v1/tv/activate`). La Cloud nunca ve la sesión.

## Desarrollo

```bash
npm install
npm run dev            # en el navegador; las flechas y Enter hacen de control, Esc es atrás
npm run build          # dist/
npm run package:tizen  # out/IspGo-TV-Samsung-<versión>.wgt (sin firmar)
npm run package:webos  # out/IspGo-TV-LG-<versión>.ipk
```

`VITE_CLOUD_API_URL` (en `.env`) apunta a IspGo Cloud. En el navegador de un PC los
canales no se reproducen (no hay HLS ni AVPlay); el resto sí se puede probar.

Cada push a `main` publica en Releases el `.wgt` y el `.ipk`.

## Instalar en un Samsung (modo desarrollador)

1. Instala [Tizen Studio](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)
   con las extensiones **TV** y **Samsung Certificate Extension** (Package Manager).
2. En el televisor: Apps → marca `1 2 3 4 5` con el control → **Developer mode: On** →
   escribe la IP de tu PC → reinicia el televisor.
3. En el PC, conecta el TV: `sdb connect <IP_DEL_TV>`.
4. En Tizen Studio → Certificate Manager crea un certificado **Samsung** de tipo **TV**
   (pide iniciar sesión con tu cuenta Samsung y toma el DUID del TV conectado). Ponle de
   nombre `ispgo`.
5. Firma e instala el `.wgt` de Releases:

   ```bash
   unzip IspGo-TV-Samsung-<versión>.wgt -d ispgo-tv
   tizen package -t wgt -s ispgo -- ispgo-tv
   tizen install -n "IspGo TV.wgt" -t <nombre del TV en `sdb devices`> -- ispgo-tv
   ```

Para publicarla en la tienda de Samsung hay que registrarse como vendedor en
[Samsung Seller Office](https://seller.samsungapps.com/tv) y firmar con el certificado de
distribución.

## Instalar en un LG (modo desarrollador)

1. Crea una cuenta en [LG Developer](https://webostv.developer.lge.com/) e instala en el
   televisor la app **Developer Mode** (LG Content Store); inicia sesión y activa
   **Dev Mode Status** y **Key Server**.
2. En el PC: `npm install -g @webos-tools/cli`, luego `ares-setup-device` para agregar el
   TV (IP y passphrase que muestra la app Developer Mode).
3. Instala el `.ipk` de Releases: `ares-install -d <nombre> IspGo-TV-LG-<versión>.ipk`.

El modo desarrollador de LG vence cada 50 horas si no se renueva desde la app. Para
publicarla hay que subirla al [LG Seller Lounge](https://seller.lgappstv.com/).
