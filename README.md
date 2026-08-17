# Rutina TKD — Panel de entrenamiento

App web de una sola página (sin frameworks, sin build) para seguir tu rutina de gimnasio
complementaria a taekwondo: 4 días, videos de técnica por ejercicio y cronómetros
integrados (descanso por ejercicio, circuito de resistencia y AMRAP).

Es una PWA instalable que **funciona sin conexión** y **guarda tu progreso del día**.

## Cómo desplegarla en GitHub Pages

1. Crea un repo nuevo en GitHub.
2. Sube el contenido de esta carpeta a la raíz del repo:
   ```bash
   git init
   git add .
   git commit -m "Rutina TKD - panel de entrenamiento"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) valida y despliega
   en cada push a `main`. (También funciona con "Deploy from a branch", pero entonces te
   pierdes las validaciones.)
4. Espera 1-2 minutos. Tu app queda en `https://TU_USUARIO.github.io/TU_REPO/`.
5. Desde el celular, abre esa URL y usa "Instalar app" / "Agregar a pantalla de inicio".
   Ya trae íconos y `manifest.json` completos, así que se instala como app real.

Todas las rutas son relativas, así que funciona igual en la raíz del dominio o en un
subdirectorio de proyecto.

## Probarla localmente

Necesita un servidor HTTP (el service worker no funciona con `file://`):
```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app: datos de la rutina, estilos y lógica |
| `manifest.json` | Metadatos de PWA (nombre, íconos, colores, scope) |
| `sw.js` | Service worker: precache de la app + cache de miniaturas |
| `fonts/` | Oswald, Inter e IBM Plex Mono auto-hospedadas (subset latin, ~100 KB) |
| `icons/` | Íconos PWA (`any` y `maskable`), apple-touch-icon y favicon |
| `.nojekyll` | Evita que GitHub Pages procese el sitio con Jekyll |

## Qué incluye

- **4 días** cargados 1:1 desde tu rutina (Lunes empuje, Martes AM tracción, Miércoles full
  body/AMRAP, Viernes piernas/potencia), con warm-ups, notas técnicas y la lógica del split
  en el botón "i" (incluye la regla de reprogramación si el TKD cambia de día).
- **Video real por ejercicio**: miniatura de YouTube que abre un reproductor embebido
  (youtube-nocookie, autoplay silenciado para no sonar en medio del gimnasio). Cada video
  tiene además un link "Abrir en YouTube" como respaldo.
- **Cronómetro de descanso** por ejercicio, con anillo de progreso, cuenta regresiva sonora
  de 3-2-1, beep final y vibración (la vibración no funciona en iOS Safari).
- **Cronómetro de circuito/AMRAP** con contador manual de rondas.
- **Cronómetro de sesión** para medir la duración total del entreno.
- **Barra de progreso tipo cinturón** (blanco→amarillo→verde→azul→rojo→negro) que cuenta
  los ejercicios *y* el bloque de circuito/AMRAP del día.

## Cómo se comporta en el gimnasio

Estas son las decisiones que hacen que la app sea confiable en uso real:

- **Los cronómetros no se desfasan.** Están basados en `Date.now()`, no en contar ticks de
  `setInterval`. Si bloqueas el celular o cambias de app —cuando el navegador congela o
  throttlea los timers— al volver el tiempo mostrado es el real.
- **El beep suena a tiempo aunque la pantalla esté apagada.** Los tonos se programan por
  adelantado en el AudioContext, cuyo scheduler sigue corriendo en segundo plano. Si el
  audio quedó suspendido, la app detecta que el beep no sonó y lo dispara al volver.
- **La pantalla no se apaga** mientras hay un cronómetro corriendo (Wake Lock API, donde
  esté disponible).
- **Funciona sin señal.** El service worker precachea la app, las fuentes y los íconos, y
  guarda las miniaturas de YouTube que ya viste (máximo 80). Solo el reproductor de video
  necesita conexión.
- **El progreso se guarda** en `localStorage`: checks, rondas, día activo y cronómetro de
  sesión. Si recargas la página no pierdes nada; el cronómetro de sesión sigue contando
  desde donde iba.
- **Se reinicia solo al cambiar de día**, y al abrirla te lleva al día que toca según el día
  de la semana. También hay un botón manual en el modal "i" → *Reiniciar progreso de hoy*.
- **Toque en el fondo cierra** el modal de info y el de video, pero **no** el cronómetro:
  un toque accidental no debe cancelarte un descanso en curso (para eso están ✕ y Escape).

## Accesibilidad

Checks, tabs, miniaturas y botones de descanso son `<button>` reales: funcionan con teclado
y lector de pantalla. Los tabs implementan el patrón ARIA de `tablist` (flechas, Home/End).
Los tres diálogos tienen `role="dialog"`, cierran con Escape, atrapan el foco mientras están
abiertos y lo devuelven al elemento que los abrió. El fin de cada cronómetro se anuncia por
una región `aria-live`.

## Privacidad

Las fuentes están auto-hospedadas: no hay llamadas a Google Fonts. Tu progreso nunca sale
del dispositivo. Los únicos terceros son las miniaturas (`i.ytimg.com`) y el reproductor
embebido de YouTube, y este último solo se carga cuando abres un video.

## Mantenimiento

- Al editar `index.html` o cualquier asset, sube `CACHE_VERSION` en [`sw.js`](sw.js) para que
  los dispositivos ya instalados reciban la versión nueva.
- Si agregas archivos al precache, agrégalos a `CORE_ASSETS`. El workflow falla si alguna
  ruta de esa lista no existe: `addAll()` falla entera con un solo 404 y dejaría roto el
  offline.
- Si cambia el esquema de datos guardados, sube `STORE_KEY` en `index.html` (`rutina-tkd:v1`).

## Ideas para más adelante (no incluidas)

- Historial de pesos usados por ejercicio, para la progresión doble de tu rutina.
- Modo "solo texto" que oculte las miniaturas.
- Reordenar los días automáticamente si cambia el horario de TKD (hoy la regla está escrita
  en el modal de info, pero se aplica a mano).
- Los videos son de terceros: si alguno se vuelve privado, el embed puede dejar de cargar.
  Cada uno tiene su link directo a YouTube como respaldo.
