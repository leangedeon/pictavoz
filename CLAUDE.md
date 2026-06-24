@AGENTS.md

# PictaVoz — notas para Claude

Lee **AGENTS.md** completo antes de escribir código. Este archivo es un cheat sheet rápido.

## Qué es

App AAC bilingüe (ES/EN): pictogramas → oraciones habladas (TTS). Auth propia (JWT + cookie), Postgres vía Supabase service role, imágenes en Cloudflare R2.

## Mapa rápido de archivos

| Si tocás… | Archivos clave |
|-----------|----------------|
| Tableros activos / default | `src/lib/user-board.ts`, `src/lib/board-constants.ts`, `src/app/api/board/` |
| Listado / CRUD pictos | `src/lib/pictograms-db.ts`, `src/app/api/pictograms/`, `src/app/api/upload/` |
| Comunicar | `src/components/pictogram-browser.tsx`, `sentence-builder.tsx` |
| Mi tablero | `src/components/user-board-manager.tsx` |
| Crear picto | `src/components/create-pictogram-form.tsx` |
| Compartir tablero | `src/lib/board-share.ts`, `board-share-import.tsx`, `api/board/share/` |
| Selectores UI | `category-picker.tsx`, `board-picker.tsx`, `ownership-filter.tsx` |
| Diálogos modales | `app-dialog-provider.tsx` (+ `AppProviders`) |
| R2 / imágenes | `src/lib/r2.ts`, `r2-url.ts`, `r2-cleanup.ts` |
| Auth | `src/lib/auth.ts`, `src/middleware.ts`, `api/auth/` |
| i18n | `messages/es.json`, `messages/en.json`, `src/i18n/` |
| Admin | `admin-panel.tsx`, `admin-system-pictograms.tsx`, `admin-settings.tsx` |
| Seed catálogo | `src/data/default-pictograms.ts`, `api/seed/route.ts` |

## Decisiones de producto (no revertir sin consultar)

- Existe **tablero por defecto** (`DEFAULT_BOARD_ID = "default"`) además de tableros personales.
- Tablero activo es **global por usuario** (Comunicar y Mi tablero ven lo mismo).
- URLs R2 públicas **sin** nombre de bucket en la ruta (`*.r2.dev/pictograms/uuid.webp`).
- UI de selectores **custom** (no `<select>` nativo en filtros principales).
- Confirmaciones destructivas con **loader async** (`onConfirm` en `AppDialogProvider`).
- Pictos custom con mismo nombre que el sistema **no se ocultan** (dedupe con prioridad).
- Fork del sistema: ocultar ≠ eliminar; eliminar solo custom (`source_system_id` null).

## Flujos que suelen romperse

1. **Usuario nuevo sin tablero** → API devuelve pictos `is_system = true`.
2. **Primer edit/crear** → `ensurePersonalBoard()` fork del catálogo.
3. **Cambiar a “Tablero por defecto”** → `setDefaultBoard()`, `activeBoardId: null`, pictos sistema.
4. **Subir imagen** → sharp → R2 → insert con `is_user_modified: true`.
5. **Safari + fetch** → siempre `parseJsonResponse`, nunca asumir JSON válido.

## i18n

Producto en español primero. Todo string visible → `messages/es.json` **y** `messages/en.json`.

## Supabase

- Cliente: `getDb()` con **service role** (`src/lib/db.ts`).
- **No** Supabase Auth, **no** RLS.
- Migraciones manuales en `supabase/migration-*.sql`.

## Env mínimo para dev

`JWT_SECRET`, Supabase URL + service key, R2 (6 vars). Ver tabla completa en AGENTS.md.

## Checklist ante bugs reportados

- [ ] ¿Migraciones SQL ejecutadas en Supabase?
- [ ] ¿`.env` R2 con endpoint/URL sin `/bucket`?
- [ ] ¿Error Safari genérico? → parsing JSON en cliente.
- [ ] ¿Picto “desaparece”? → dedupe, tablero activo, filtro ownership, caché `no-store`.
- [ ] ¿Imagen rota? → formato URL en `r2-url.ts` y key en DB.

## Estilo de código

Diffs pequeños, convenciones del archivo vecino, comentarios solo si la lógica no es obvia. No over-engineering.
