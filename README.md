# Rutina TKD — Panel de entrenamiento

App web de una sola página (sin frameworks, sin build) para seguir tu rutina de gimnasio
complementaria a taekwondo: 4 días, videos de técnica por ejercicio y cronómetros
integrados (descanso por ejercicio y bloque de cardio final).

Los ejercicios ya no están escritos a mano en el código: viven en un **inventario editable
desde la app** (pestaña *INV*), y cada día guarda solo la lista ordenada de ejercicios que
le tocan. Todo se guarda en el dispositivo y se puede exportar e importar como JSON.

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
| `index.html` | Toda la app: semilla de datos, estilos y lógica |
| `Rutina_Gimnasio_TKD.md` | La rutina en texto — fuente de la que salió la semilla de `index.html` |
| `manifest.json` | Metadatos de PWA (nombre, íconos, colores, scope) |
| `sw.js` | Service worker: precache de la app + cache de miniaturas |
| `fonts/` | Oswald, Inter e IBM Plex Mono auto-hospedadas (subset latin, ~100 KB) |
| `icons/` | Íconos PWA (`any` y `maskable`), apple-touch-icon y favicon |
| `.nojekyll` | Evita que GitHub Pages procese el sitio con Jekyll |

## Qué incluye

- **Inventario de ejercicios** (pestaña *INV*): la fuente única de verdad. Cada ejercicio tiene
  nombre, tipo de medida (repeticiones o tiempo), series, valor (admite rangos como `8–10`),
  detalle opcional (`por lado`, `m`), peso con unidad (vacío = peso corporal), descanso, nota y
  link de YouTube. Se crean, editan y eliminan desde la app, con buscador y validación.
- **Rutina diaria editable**: el botón *Editar rutina* de cada día permite agregar (selector con
  búsqueda que excluye lo ya incluido), quitar y reordenar con ↑ ↓ — en el borde de un bloque el
  ejercicio pasa al bloque vecino. Cada día guarda **solo ids**; series, peso, descanso y video
  los lee del inventario, así que editar un ejercicio se refleja en todos los días que lo usan.
- **Respaldos**: *Exportar JSON*, *Importar JSON* (valida el formato antes de sobrescribir) y
  *Restaurar valores originales*.
- **4 días** sembrados 1:1 desde [`Rutina_Gimnasio_TKD.md`](Rutina_Gimnasio_TKD.md) (Lunes
  empuje, Martes AM tracción, Miércoles full body, Viernes piernas/potencia). Cada día sigue la
  misma estructura de la rutina: **Fuerza → Abdominales → Cardio final**, con warm-ups, notas
  técnicas y la lógica del split en el botón "i" (incluye la regla de reprogramación si el TKD
  cambia de día).
- **Video real por ejercicio**: miniatura de YouTube que abre un reproductor embebido
  (youtube-nocookie, autoplay silenciado para no sonar en medio del gimnasio). Cada video
  tiene además un link "Abrir en YouTube" como respaldo.
- **Cronómetro de descanso** por ejercicio, con anillo de progreso, cuenta regresiva sonora
  de 3-2-1, beep final y vibración (la vibración no funciona en iOS Safari).
- **Bloque de cardio final** por día, con cronómetro del bloque completo y, donde el cardio va
  por máquinas (martes y miércoles), un cronómetro por tramo. El martes suma contador manual de
  rondas.
- **Cronómetro de sesión** para medir la duración total del entreno.
- **Barra de progreso tipo cinturón** (blanco→amarillo→verde→azul→rojo→negro) que cuenta
  los ejercicios *y* el bloque de cardio final del día.

## Inventario, rutinas y datos guardados

La app guarda en `localStorage` con **dos claves separadas a propósito**:

| Clave | Qué guarda | Cuándo se borra |
|---|---|---|
| `rutina-tkd:data:v1` | Inventario y rutinas de los 4 días | Nunca solo: únicamente al importar o al restaurar |
| `rutina-tkd:v2` | Progreso del día: checks, rondas, cronómetro de sesión, pestaña activa | Solo al cambiar de día (o con *Reiniciar progreso de hoy*) |

Cada lectura y escritura va dentro de `try/catch`. Si el navegador no deja usar `localStorage`
(modo privado, sin cuota), la app **sigue funcionando en memoria** y muestra un aviso discreto
bajo el encabezado: se puede entrenar y editar igual, pero los cambios no sobreviven al cierre.

En la **primera carga** el inventario y las rutinas se siembran desde `SEED_INVENTORY` y
`SEED_ROUTINES` (en `index.html`), así que la app arranca igual que la rutina en texto.

### Formato del JSON exportado

*Exportar JSON* descarga `rutina-tkd-AAAA-MM-DD.json` con esta forma:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-09-28T18:40:00.000Z",
  "inventory": [
    {
      "id": "ex-1",
      "name": "Press banca plano (barra o máquina)",
      "measure": "reps",
      "sets": 4,
      "value": "8–10",
      "suffix": "",
      "weight": null,
      "unit": "kg",
      "rest": 90,
      "note": "Sube peso cuando completes 4×10 con buena técnica",
      "yt": "Pp8rHcFVIYg"
    }
  ],
  "routines": {
    "1": [
      { "title": "Fuerza",      "ids": ["ex-1", "ex-2"] },
      { "title": "Abdominales", "ids": ["ex-7"] }
    ],
    "2": [], "3": [], "4": []
  }
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `schemaVersion` | número | Hoy `1`. Si el archivo trae un número mayor, la app se niega a importar |
| `exportedAt` | ISO 8601 | Solo informativo; la app no lo usa al importar |
| `inventory[].id` | texto | Estable (`ex-1`, `ex-2`, …). No se reutiliza al borrar ni cambia al renombrar |
| `inventory[].measure` | `"reps"` \| `"time"` | `time` hace que el valor se muestre en segundos (`3×40s`) |
| `inventory[].sets` | entero ≥ 1 | |
| `inventory[].value` | texto | Número (`"40"`) o rango (`"8–10"`) |
| `inventory[].suffix` | texto | Sufijo que se pinta después del valor: `"por lado"`, `"m"` |
| `inventory[].weight` | número \| `null` | `null` = peso corporal |
| `inventory[].unit` | `"kg"` \| `"lb"` | |
| `inventory[].rest` | entero, segundos | `0` oculta el botón de descanso |
| `inventory[].note` | texto | Opcional |
| `inventory[].yt` | texto | Id de YouTube de 11 caracteres, o `""` si no hay video |
| `routines` | objeto con claves `1`–`4` | Cada día es una lista de bloques `{title, ids}` en orden |

Al importar, el archivo pasa por el mismo validador que los datos de `localStorage`: se
descartan ejercicios sin nombre o con nombre repetido, ids desconocidos dentro de `routines`,
ejercicios repetidos en un mismo día y links de YouTube inválidos; los números se recortan a
rangos razonables. Recién si lo que queda es usable se pide confirmación y se sobrescribe.
**El progreso del día no se exporta ni se importa**: es efímero por diseño.

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
  desde donde iba. El inventario y las rutinas se guardan aparte y no se reinician nunca.
- **Se puede tocar con el pulgar.** Todos los controles nuevos miden al menos 40 px. Los dos
  más usados en pleno set —el check y el chip de descanso— conservan su tamaño visual pero
  tienen el área táctil ampliada a 40 px con un `::after` invisible.
- **Se reinicia solo al cambiar de día**, y al abrirla te lleva al día que toca según el día
  de la semana. También hay un botón manual en el modal "i" → *Reiniciar progreso de hoy*.
- **Toque en el fondo cierra** el modal de info y el de video, pero **no** el cronómetro:
  un toque accidental no debe cancelarte un descanso en curso (para eso están ✕ y Escape).

## Accesibilidad

Checks, tabs, miniaturas y botones de descanso son `<button>` reales: funcionan con teclado
y lector de pantalla. Los tabs implementan el patrón ARIA de `tablist` (flechas, Home/End);
la pestaña del inventario se ve como *INV* pero se anuncia como "Inventario" (`aria-label`).
Los cinco diálogos —info, video, cronómetro, selector de ejercicios e importar— tienen
`role="dialog"`, cierran con Escape, atrapan el foco mientras están abiertos y lo devuelven
al elemento que los abrió. El fin de cada cronómetro, y cada alta, baja o reordenamiento,
se anuncian por una región `aria-live`. Los errores del formulario van en `role="alert"`
junto al campo y el foco salta al primero que falló.

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
- La rutina del día a día **ya no se edita en el código**: se edita en la app. En `index.html`
  solo vive la semilla de la primera carga:
  - `DAYS` → metadatos de cada día (título, foco, warm-up, cardio final, nota al pie). El
    warm-up y el cardio son bloques fijos y no salen del inventario.
  - `SEED_INVENTORY` → los 34 ejercicios iniciales.
  - `SEED_ROUTINES` → qué ids van en cada bloque de cada día.
  Cambiar la semilla **no** afecta a quien ya abrió la app: sus datos mandan. Para volver a la
  semilla está *Restaurar valores originales*.
- Si cambia la forma de los datos guardados, sube `SCHEMA_VERSION` y `DATA_KEY`
  (`rutina-tkd:data:v1`) y agrega la migración en `sanitizeData()`. Para invalidar solo el
  progreso del día, sube `STORE_KEY` (`rutina-tkd:v2`).
- Todos los datos externos (localStorage o archivo importado) entran por `sanitizeData()`:
  si agregas un campo al ejercicio, agrégalo también ahí o se perderá al recargar.

## Ideas para más adelante (no incluidas)

- Historial de pesos por ejercicio (hoy el peso es un solo valor actual, no una serie de
  fechas), que es lo que haría automática la progresión doble.
- Arrastrar para reordenar (hoy son botones ↑ ↓, que además funcionan con teclado).
- Bloques propios por día (hoy los títulos *Fuerza* y *Abdominales* vienen de la semilla y no
  se pueden crear ni renombrar desde la app).
- Warm-up y cardio final editables: siguen siendo fijos, fuera del inventario.
- Modo "solo texto" que oculte las miniaturas.
- Reordenar los días automáticamente si cambia el horario de TKD (hoy la regla está escrita
  en el modal de info, pero se aplica a mano).
- Los videos son de terceros: si alguno se vuelve privado, el embed puede dejar de cargar.
  Cada uno tiene su link directo a YouTube como respaldo.
