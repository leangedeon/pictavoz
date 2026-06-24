<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PictaVoz — guía para agentes

PictaVoz es una aplicación AAC (comunicación aumentativa y alternativa) en Next.js 16 + React 19. Los usuarios arman oraciones con pictogramas, personalizan tableros, suben fotos propias y comparten tableros por link.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 App Router (Turbopack en dev) |
| UI | React 19, Tailwind CSS 4, lucide-react |
| i18n | next-intl (`es` default, `en`, prefijo `/es` `/en`) |
| Estado cliente | Zustand (`src/store/sentence-store.ts`) |
| Base de datos | Supabase Postgres (**solo DB**, sin Supabase Auth) |
| Auth | JWT propio en cookie httpOnly `pictavoz_session` (jose) |
| Imágenes | Cloudflare R2 (AWS SDK S3) + sharp → WebP 120×120 |
| Email | nodemailer (SMTP Gmail) |

## Arquitectura

```
Usuario → middleware (locale + auth) → páginas /[locale]/...
API routes → getSession() → Supabase service role → Postgres
Upload → sharp → R2 PutObject → URL pública → pic_pictograms.image_url
```

- **Sin RLS:** permisos en la capa API (`getSession`, roles `user` | `admin`).
- **Tablas con prefijo `pic_`:** constantes en `src/lib/db-tables.ts`.
- **Catálogo sistema:** pictogramas con `is_system = true`, sin `board_id`.
- **Tableros personales:** `pic_user_boards` + copias en `pic_pictograms` con `board_id`.

## Estructura del proyecto

```
src/
  app/
    [locale]/           # Páginas con locale obligatorio
      (app)/            # Rutas autenticadas (comunicar, pictogramas, crear, admin)
      compartir/[token] # Importar tablero compartido
      login, register, page.tsx (landing)
    api/                # Route handlers REST
  components/           # UI (pickers, browser, board manager, dialogs…)
  data/                 # Seed catálogo default + traducciones EN
  i18n/                 # routing, navigation, request
  lib/                  # Lógica de negocio, R2, auth, DB helpers
  store/                # Zustand
  types/                # TypeScript interfaces
messages/               # es.json, en.json
supabase/               # schema.sql + migration-*.sql
```

## Rutas principales

| Ruta | Componente / uso |
|------|------------------|
| `/[locale]/` | Landing pública (`landing-page.tsx`) |
| `/[locale]/login`, `/register` | Auth |
| `/[locale]/comunicar` | `PictogramBrowser` + `SentenceBuilder` |
| `/[locale]/pictogramas` | `UserBoardManager` (Mi tablero) |
| `/[locale]/crear` | `CreatePictogramForm` |
| `/[locale]/compartir/[token]` | `BoardShareImport` |
| `/[locale]/admin` | `AdminPanel` (solo role admin) |

**Navegación:** usar `Link`, `useRouter`, `redirect` de `src/i18n/navigation.ts`, no `next/link` directo en UI con locale.

## Conceptos de dominio

### Tablero activo

- **`DEFAULT_BOARD_ID = "default"`** (`src/lib/board-constants.ts`): catálogo original de la app (`is_system = true`). No es fila en `pic_user_boards`.
- Tablero personal activo: fila en `pic_user_boards` con `is_active = true`.
- Activar default: `setDefaultBoard()` desactiva todos los tableros del usuario.
- **Comunicar** y **Mi tablero** comparten el mismo tablero activo (estado en servidor).
- `BoardPicker` debe usar `includeDefault` + `value={activeBoardId ?? DEFAULT_BOARD_ID}`.

### Pictogramas en tablero personal

| Tipo | Señales en DB |
|------|----------------|
| Fork del sistema | `source_system_id` → id del picto sistema |
| Custom del usuario | `source_system_id IS NULL` |
| Modificado por usuario | `is_user_modified = true` |

Al editar un picto del sistema, la API resuelve/copia al tablero activo (`resolveUserPictogramId`).

### Deduplicación

`dedupePictograms()` en `src/lib/pictograms-db.ts` colapsa duplicados por `category_id + nombre normalizado`, pero **prioriza**:

1. Custom (`source_system_id` null)
2. Modificado (`is_user_modified`)
3. Fork del sistema

No ocultar pictos custom porque exista uno del sistema con el mismo nombre.

### Compartir tableros

- `share_token` en `pic_user_boards` (único).
- Link: `/[locale]/compartir/[token]`.
- Import respeta `max_boards_per_user` (`pic_app_settings`).

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=

NEXT_PUBLIC_APP_URL=
MAIL_FROM=
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASS=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=pictavoz-images
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com
```

### R2 — reglas críticas

- **`R2_ENDPOINT`:** raíz S3, **sin** `/nombre-bucket` al final.
- **`R2_PUBLIC_URL`:** URL pública del bucket (`pub-xxx.r2.dev`), **sin** `/pictavoz-images`.
- **URL correcta:** `{R2_PUBLIC_URL}/pictograms/{uuid}.webp`
- **URL incorrecta (404):** `{R2_PUBLIC_URL}/pictavoz-images/pictograms/...`
- Claves de objeto: solo `pictograms/{uuid}.webp` (sin nombre de archivo original).
- Helpers: `src/lib/r2.ts`, `src/lib/r2-url.ts`, limpieza en `src/lib/r2-cleanup.ts`.

## Base de datos

Esquema completo: `supabase/schema.sql`.

Migraciones incrementales (ejecutar en Supabase SQL Editor si faltan columnas/tablas):

1. `migration-bilingual.sql` — `name_es`, `name_en`
2. `migration-user-boards.sql` — tableros personales
3. `migration-multi-boards.sql` — varios tableros + settings
4. `migration-board-share.sql` — `share_token`
5. `migration-user-modified.sql` — `is_user_modified`
6. `migration-dedupe.sql` — índices unique sistema

Promover admin manualmente:

```sql
UPDATE pic_users SET role = 'admin' WHERE email = 'tu@email.com';
```

## API routes

| Ruta | Métodos | Notas |
|------|---------|-------|
| `/api/auth/login` | POST | Cookie session |
| `/api/auth/register` | POST | |
| `/api/auth/logout` | POST | |
| `/api/auth/me` | GET | |
| `/api/pictograms` | GET | Tablero activo o sistema; query: `category_id`, `search`, `include_hidden`, `system_only` |
| `/api/pictograms/[id]` | PATCH, DELETE | Multipart (imagen) o JSON |
| `/api/upload` | POST | Crear picto custom + imagen |
| `/api/board` | GET, POST, DELETE | Status; actions: `fork`, `create`, `activate`; DELETE reset |
| `/api/board/share` | POST | Generar token |
| `/api/board/share/[token]` | GET, POST | Preview / import |
| `/api/categories` | GET | |
| `/api/seed` | POST | Seed catálogo sistema (background en Comunicar) |
| `/api/admin/settings` | GET, PATCH | `max_boards_per_user` |
| `/api/users` | GET, PATCH | Admin |

Activar tablero:

```json
POST /api/board
{ "action": "activate", "boardId": "default" }
{ "action": "activate", "boardId": "<uuid-tablero>" }
```

## Componentes UI — convenciones

**No usar `<select>` nativo** en filtros/selectores principales. Usar:

| Componente | Uso |
|------------|-----|
| `CategoryPicker` | Categorías; prop `compact` en toolbar (`h-12`) |
| `BoardPicker` | Tableros; `includeDefault`, `defaultBoardLabel` |
| `OwnershipFilter` | “Todos” / “Creados o modificados por mí” |
| `AppDialogProvider` | confirm / prompt / alert |

Confirmaciones destructivas (eliminar picto): `onConfirm: async () => { ... }` en `confirm()` — muestra loader hasta completar y cierra el diálogo.

Estética común:

- `rounded-2xl`, `border-2`, sombras suaves
- Primario: indigo (`bg-indigo-600`)
- Categorías activas: color de `pic_categories.color`
- Barras de filtro: controles alineados `h-12`, `items-center`, `justify-center`
- Loaders de página: spinner `min-h-[40vh]` centrado

## Cliente y fetch

- `fetchPictograms`, `fetchBoardStatus`: `{ cache: "no-store" }`.
- **`parseJsonResponse()`** (`src/lib/api-client.ts`): obligatorio en cliente; Safari falla con `res.json()` si la respuesta es HTML → *"The string did not match the expected pattern"*.
- Tras crear picto: `stashCreatedPictogram()` + redirect (`src/lib/pictogram-pending.ts`).

## i18n

- Archivos: `messages/es.json`, `messages/en.json`.
- Namespaces: `common`, `nav`, `auth`, `communicate`, `board`, `create`, `categories`, `admin`, `dialog`, etc.
- Labels de categoría: `tCat(slug)` con try/catch (slug puede no existir).
- Agregar strings en **ambos** idiomas.

## Imágenes

- Procesamiento: `optimizePictogramImage()` — auto-rotate, max 120×120 px proporcional, WebP quality 82.
- HEIC/iPhone: `VIPS_MAX_IREF=100` en runtime si sharp falla por límite iref.
- `next.config.ts`: `images.remotePatterns` para `**.r2.dev`.
- Al borrar picto/tablero: `deleteOrphanR2Images` / `deleteBoardR2Images`.

## Reglas al implementar

1. **Cambios mínimos** — no refactorizar de más; seguir patrones existentes del archivo.
2. **Permisos en API** — nunca confiar solo en el cliente.
3. **Tablero activo** — listados de pictos deben respetar `getActiveBoard()` o `DEFAULT_BOARD_ID`.
4. **No commitear** `.env`, secrets ni credenciales.
5. **Migraciones SQL** — si agregás columnas, actualizá `schema.sql` + nuevo `migration-*.sql`.
6. **Commits / PRs** — solo si el usuario lo pide explícitamente.
7. **Tests** — solo si aportan cobertura real; evitar asserts triviales.
8. **No crear docs** (README, etc.) salvo que el usuario lo pida.

## Comandos

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Seed inicial del catálogo: `POST /api/seed` (también se dispara en background al entrar a Comunicar).

## Pitfalls conocidos

| Síntoma | Causa / solución |
|---------|------------------|
| Imagen 404 en R2 | URL con `/bucket/` en el path; usar `pub-xxx.r2.dev/pictograms/...` |
| Picto no aparece tras crear | Dedupe por nombre, caché fetch, filtro ownership; revisar `pictogram-pending.ts` |
| Mismo nombre que sistema | Custom debe ganar en `dedupePictograms` |
| Error Safari al subir/guardar | Respuesta no JSON; usar `parseJsonResponse` |
| Columna/tabla faltante | Ejecutar migraciones en Supabase |
| `NoSuchBucket` R2 | Crear bucket en Cloudflare con nombre = `R2_BUCKET_NAME` |
| Upload OK pero URL mala | Revisar `R2_ENDPOINT` y `buildPublicObjectUrl` |
