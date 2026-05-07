# Bia Visitas API

[![CI](https://github.com/jhojangordillo/bia-visitas-mvc/actions/workflows/ci.yml/badge.svg)](https://github.com/jhojangordillo/bia-visitas-mvc/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-45%2F45%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-82.65%25-brightgreen)
![Node](https://img.shields.io/badge/node-22.5%2B-339933)
![License](https://img.shields.io/badge/license-ISC-blue)

Microservicio MVC + CRUD para gestionar **clientes** y **visitas técnicas**, con dashboard de operaciones consumiendo la API.
Retos 1, 2 y "Dale cara a tu API" · AI Native Bia · _Jhojan Gordillo_.

> Pensado desde el dolor real de operaciones: que el técnico pueda consultar y registrar visitas a clientes (instalación, mantenimiento, inspección, emergencia) de forma centralizada, no en cuadernos ni en WhatsApp.

✅ **Reto 1:** arquitectura MVC + CRUD + diagramas
✅ **Reto 2:** microservicio listo para deploy + pruebas + Postman
✅ **"Dale cara a tu API":** dashboard frontend en `/app` consumiendo los endpoints
✅ **Bonus:** CI con GitHub Actions, blueprint para deploy 1-click en Render

---

## Stack

- **Node.js 22+** (usa `node:sqlite` built-in — no hay que compilar nada)
- **Express** para el servidor HTTP
- **SQLite** como base de datos (archivo plano en `data/visitas.db`)

## Cómo correrlo

```bash
npm install      # instala express
npm start        # arranca el servidor en http://localhost:3000
```

La primera vez se crea `data/visitas.db` y se siembran 3 clientes + 3 visitas de ejemplo.

> Si tienes Node < 22.5, actualiza desde [nodejs.org](https://nodejs.org).
> Si prefieres, puedes cambiar a `better-sqlite3` (instalándolo y reemplazando 2 líneas en `src/config/database.js`).

---

## ¿Qué es MVC y por qué importa?

**MVC** = Model · View · Controller. Es un patrón para **separar responsabilidades**: cada capa hace una sola cosa, y eso hace al código más fácil de leer, probar y crecer.

En este proyecto (que es backend, sin "View" tradicional) las capas son:

| Capa | Quién es | Qué hace | Qué NO hace |
|------|----------|----------|-------------|
| **Routes** (`routes/`) | el router de Express | Mapea URL + verbo HTTP → método del controlador | No sabe SQL, no valida nada |
| **Controller** (`controllers/`) | el orquestador | Recibe el request, valida los datos, llama al modelo, arma la respuesta | No habla con la base de datos directamente |
| **Model** (`models/`) | quien habla con la BD | Ejecuta SQL, devuelve datos limpios | No sabe qué es un request HTTP |
| **Config** (`config/database.js`) | la conexión | Crea/abre la BD, define schema | No tiene reglas de negocio |

**Beneficio práctico:** si mañana cambias SQLite por PostgreSQL, **solo cambias los modelos**. Si cambias Express por Fastify, **solo cambias los routes**. La validación y reglas (controllers) siguen iguales.

---

## Estructura de carpetas

📄 Diagrama visual: [`docs/estructura_proyecto.pdf`](docs/estructura_proyecto.pdf)

```
Reto-MVC-CRUD/
├── package.json              ← dependencias y scripts npm
├── README.md                 ← este archivo
├── .gitignore                ← lo que git NO sube
├── src/
│   ├── server.js             ← entry point: Express, monta rutas, /health
│   ├── config/
│   │   └── database.js       ← abre SQLite, crea tablas, semilla
│   ├── models/
│   │   ├── clienteModel.js   ← SQL puro de clientes
│   │   └── visitaModel.js    ← SQL puro de visitas (incluye JOIN)
│   ├── controllers/
│   │   ├── clienteController.js   ← valida y orquesta
│   │   └── visitaController.js    ← valida y orquesta
│   └── routes/
│       ├── clienteRoutes.js  ← /api/clientes/*
│       └── visitaRoutes.js   ← /api/visitas/*
├── data/
│   └── visitas.db            ← SQLite (se crea solo, gitignored)
└── docs/
    ├── estructura_proyecto.pdf
    └── modelo_datos.pdf
```

---

## Modelo de datos

📄 Diagrama visual: [`docs/modelo_datos.pdf`](docs/modelo_datos.pdf)

Dos tablas con relación **1 a N** (un cliente puede tener varias visitas):

### `clientes`

| Columna     | Tipo     | Notas                                                       |
|-------------|----------|-------------------------------------------------------------|
| `id`        | INTEGER  | PK autoincremental                                          |
| `nombre`    | TEXT     | obligatorio                                                 |
| `documento` | TEXT     | **UNIQUE** — un cliente solo se registra una vez            |
| `sector`    | TEXT     | CHECK ∈ {Residencial, Comercial, Industrial, Oficial}       |
| `ciudad`    | TEXT     | obligatorio                                                 |
| `direccion` | TEXT     | opcional                                                    |
| `telefono`  | TEXT     | opcional                                                    |
| `creado_en` | DATETIME | default `CURRENT_TIMESTAMP`                                 |

### `visitas`

| Columna         | Tipo     | Notas                                                                                  |
|-----------------|----------|----------------------------------------------------------------------------------------|
| `id`            | INTEGER  | PK autoincremental                                                                     |
| `cliente_id`    | INTEGER  | FK → `clientes(id)` con **ON DELETE CASCADE**                                          |
| `fecha`         | DATE     | obligatorio (YYYY-MM-DD)                                                               |
| `tipo`          | TEXT     | CHECK ∈ {Instalación, Mantenimiento, Inspección, Emergencia, Retiro}                   |
| `estado`        | TEXT     | CHECK ∈ {Programada, En curso, Completada, Cancelada} · default `Programada`           |
| `tecnico`       | TEXT     | obligatorio (nombre del técnico asignado)                                              |
| `observaciones` | TEXT     | opcional (notas de campo)                                                              |
| `creado_en`     | DATETIME | default `CURRENT_TIMESTAMP`                                                            |

**Decisiones de diseño:**

- `documento` UNIQUE en clientes evita duplicados al registrar.
- `CHECK constraints` en `sector`, `tipo` y `estado` blindan la base contra valores inválidos a nivel BD (no solo a nivel app).
- `ON DELETE CASCADE` en visitas → si borras un cliente, sus visitas se borran también (no quedan huérfanas).
- Índices en `cliente_id` y `fecha` para acelerar las queries más comunes.

---

## Endpoints disponibles

Base URL: `http://localhost:3000`

### Sistema

| Método | Ruta      | Descripción                          |
|--------|-----------|--------------------------------------|
| GET    | `/`       | Manifiesto de la API                 |
| GET    | `/health` | Healthcheck (uptime + status)        |

### Clientes — CRUD completo

| Método | Ruta                  | Body                                      |
|--------|-----------------------|-------------------------------------------|
| GET    | `/api/clientes`       | —                                         |
| GET    | `/api/clientes/:id`   | —                                         |
| POST   | `/api/clientes`       | `{nombre, documento, sector, ciudad, …}`  |
| PUT    | `/api/clientes/:id`   | cualquier campo (parcial OK)              |
| DELETE | `/api/clientes/:id`   | — (cascade borra sus visitas)             |

### Visitas — CRUD completo

| Método | Ruta                                | Body                                             |
|--------|-------------------------------------|--------------------------------------------------|
| GET    | `/api/visitas`                      | — (filtro opcional `?cliente_id=N`)              |
| GET    | `/api/visitas/:id`                  | —                                                |
| POST   | `/api/visitas`                      | `{cliente_id, fecha, tipo, tecnico, …}`          |
| PUT    | `/api/visitas/:id`                  | cualquier campo (parcial OK)                     |
| DELETE | `/api/visitas/:id`                  | —                                                |

---

## Ejemplos rápidos (curl)

```bash
# Listar clientes
curl http://localhost:3000/api/clientes

# Crear cliente
curl -X POST -H "Content-Type: application/json" \
  -d '{"nombre":"Hospital San Vicente","documento":"890999111","sector":"Oficial","ciudad":"Medellín"}' \
  http://localhost:3000/api/clientes

# Crear visita
curl -X POST -H "Content-Type: application/json" \
  -d '{"cliente_id":4,"fecha":"2026-05-15","tipo":"Mantenimiento","tecnico":"Jhojan Gordillo"}' \
  http://localhost:3000/api/visitas

# Visitas de un cliente
curl "http://localhost:3000/api/visitas?cliente_id=4"

# Borrar cliente (sus visitas también se borran)
curl -X DELETE http://localhost:3000/api/clientes/4
```

---

## 🚀 Reto 2 — Microservicio listo para deploy

Este mismo proyecto ya está preparado como microservicio.

### 1. Pruebas unitarias

```bash
npm test                  # corre 45 tests (Jest + supertest)
npm run test:coverage     # con reporte de cobertura HTML en coverage/
```

**Resultado actual:**
- 4 suites · **45 tests pasando**
- Cobertura: **82.65% statements · 90.32% functions · 100% en routes y clienteModel**
- Reporte HTML navegable en `coverage/index.html`

### 2. Docker (despliegue)

```bash
# build + run con docker-compose
docker compose up --build

# ó con docker plain
docker build -t bia-visitas-api .
docker run -p 3000:3000 -v bia-data:/app/data bia-visitas-api
```

El Dockerfile es **multi-stage** (imagen final ~120 MB), corre como **usuario no-root** y trae **HEALTHCHECK** integrado.

El volumen `/app/data` persiste el SQLite entre reinicios.

### 3. Colección Postman

Importa `postman_collection.json` en Postman → ya trae los **13 requests** organizados en 3 carpetas (Sistema · Clientes · Visitas) con bodies de ejemplo y la variable `{{baseUrl}}`.

### 4. Deploy 1-click en Render

El repo incluye `render.yaml` (Infrastructure as Code). En [render.com](https://render.com):

1. Sign in con GitHub → **New Blueprint** → conecta `bia-visitas-mvc`
2. Render detecta el `render.yaml` y crea el servicio solo
3. Click **Apply** → en 3-5 min queda en `https://bia-visitas-api.onrender.com`

URLs públicas tras el deploy:
- 🌐 Dashboard: `https://bia-visitas-api.onrender.com/app`
- 📡 API: `https://bia-visitas-api.onrender.com/api/clientes`
- ❤️ Healthcheck: `https://bia-visitas-api.onrender.com/health`

### 5. Estructura por capas (microservicio)

- **`src/server.js`** → entry point (solo levanta el puerto)
- **`src/app.js`** → construye Express (testeable sin abrir puerto)
- **`src/routes/`** → mapeo HTTP
- **`src/controllers/`** → validación + orquestación
- **`src/models/`** → SQL puro
- **`src/config/database.js`** → conexión (configurable vía `DB_PATH` env var)

---

_Generado desde Cowork ⚡ · Retos 1, 2 y "Dale cara a tu API" · AI Native Bia 2026_
