# Deployment Guide — Smart CRM (Mekong Mobile), flow L4, track SE, tag v1.0

Warranty-ticket system: a manager assigns technicians to tickets and books hand-over / pick-up appointments; a technician sees and updates his own tickets.
This guide takes you from an empty folder to a running system with **two commands** (steps 2 and 3 below). You need nothing but Docker and Git.

## 1. Requirements

| Item | Requirement | How to check |
|---|---|---|
| Docker Engine + Compose | Docker 24 or newer, Compose **v2** (`docker compose`, not `docker-compose`) | `docker compose version` |
| Git | 2.30 or newer | `git --version` |
| Free disk | about 2 GB (images + dependencies) | |
| Free TCP port | **3000** (change with `APP_PORT`, see section 3) | |
| Not needed | Node.js, npm, PostgreSQL, `psql` — all of them run inside containers | |

On Windows run the commands in Git Bash, or in PowerShell (only step 2 differs: `Copy-Item .env.example .env`). Docker Desktop must be running.

## 2. Setup steps

Run the steps in an empty working directory. Steps 2 and 3 are the only two commands needed after cloning.

1. `git clone --branch v1.0 https://github.com/tanvu0202/smartcrm-mekong-mobile.git && cd smartcrm-mekong-mobile`
2. `cp .env.example .env`
3. `docker compose up -d --build`   (the first build downloads images and packages and takes a few minutes; later starts take seconds)

The `db` service (PostgreSQL 16) starts first. The `app` service waits until the database reports *healthy*, then creates the tables and loads the sample data automatically (section 4) and starts the API and the web UI.

To stop: `docker compose down` (keeps the data). To wipe everything including the database volume: `docker compose down -v`.

## 3. Environment variables

`.env.example` already holds working **sample** values, so step 2 is enough to start. Before any real deployment change at least `DB_PASSWORD` and `AUTH_SECRET`. The real `.env` is ignored by git and must never be committed.

| Name | Meaning | Sample value | Required |
|---|---|---|---|
| `APP_PORT` | Host port that serves the app | `3000` | no |
| `DB_NAME` | PostgreSQL database name | `smartcrm` | yes |
| `DB_USER` | PostgreSQL user | `postgres` | yes |
| `DB_PASSWORD` | PostgreSQL password (the database container is created with it) | `doi_thanh_mat_khau_postgres_cua_em` | yes |
| `AUTH_SECRET` | Key that signs login tokens, at least 32 characters (`openssl rand -hex 32`). If empty, a random key is made at every start and everybody is logged out after a restart | sample string in `.env.example` | yes for real use |
| `DEMO_PASSWORD` | Shared password of the three public demo accounts | `demo123` | no |
| `TOKEN_TTL_SECONDS` | Token lifetime in seconds | `28800` (8 h) | no |
| `CORS_ORIGIN` | Origin allowed to call the API from another site (only needed for the dev UI on port 5173) | `http://localhost:5173` | no |
| `DB_HOST`, `DB_PORT`, `PORT` | Set by `docker-compose.yml` (`db`, `5432`, `3000`). Ignore them in `.env` when you use Docker | — | no |

Changing `DB_PASSWORD` **after** the first start has no effect on the existing database volume: run `docker compose down -v` first (see section 6).

## 4. Sample data

Loaded automatically on the first start, by the migration files `db/migrations/001..003` that the `app` container runs before the API starts (they are recorded in a `schema_migrations` table, so running them again changes nothing). Nothing has to be typed.

| Table | Rows after the first start |
|---|---|
| service_center | 2 |
| technician | 5 |
| technician_skill | 10 |
| ticket | 3 (all `MOI` = new) |
| ticket_log, appointment | 0 |

Check the numbers yourself:

```
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT (SELECT count(*) FROM service_center) AS centers, (SELECT count(*) FROM technician) AS technicians, (SELECT count(*) FROM technician_skill) AS skills, (SELECT count(*) FROM ticket) AS tickets"'
```

Demo accounts (password = `DEMO_PASSWORD`, default `demo123`; the login page also has one button per account):

| Username | Role | Can do |
|---|---|---|
| `dieu.phoi` | Manager (`QUAN_LY`) | queue of tickets, assign / reassign, appointments, history |
| `ktv.hai`, `ktv.long` | Technician (`KTV`) | only "my tickets" and moving them to *in progress* / *done* |

Run the migrations again to confirm they are safe (no duplicated rows): `docker compose exec app npm run migrate` prints three lines starting with `bỏ qua` ("skipped, already applied"); the row counts above stay the same.

## 5. Verify it works

Run each command and compare with the expected result.

| # | Command | Expected result |
|---|---|---|
| 1 | `docker compose ps` | Services `db` and `app` both show `(healthy)` in the STATUS column (the app may need up to about 30 s after `up`) |
| 2 | `curl http://localhost:3000/api/health` | `{"status":"ok","db":"up"}` (HTTP 200) |
| 3 | Open http://localhost:3000 in a browser | The login page appears; click **Điều phối viên** and the ticket queue shows the 3 sample tickets |
| 4 | `curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"dieu.phoi","password":"demo123"}'` | JSON with a `token` and `"role":"QUAN_LY"` |
| 5 | `docker compose exec app npm run test:full` | The summary ends with `# fail 0` (the integration tests run against the real database of the `db` service) |

If step 1 shows `starting` for more than a minute, or step 2 fails, read the log: `docker compose logs app --tail 50` and see section 6.

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `port is already allocated` / `Bind for 0.0.0.0:3000 failed` | Another program uses port 3000 (for example a local `npm start`) | Put `APP_PORT=3001` in `.env`, run `docker compose up -d` again and use port 3001 in all URLs |
| `password authentication failed` in `docker compose logs app` | `DB_PASSWORD` in `.env` was changed after the database volume was created | `docker compose down -v`, then step 3 again (this deletes the data) |
| `relation "..." does not exist`, or the queue is empty | A stale volume from an older run | `docker compose down -v`, then step 3 again |
| `app` keeps restarting, log says `ECONNREFUSED db:5432` | The database is not ready yet or crashed | `docker compose ps`; wait for `db` to be `(healthy)`; read `docker compose logs db` |
| `exec ... no such file or directory` while building on Windows | A shell script was saved with Windows line endings | The repository already forces LF for `*.sh` (`.gitattributes`); re-clone with `git clone` and do not copy files by hand |
| Everybody is sent back to the login page after a restart | `AUTH_SECRET` is empty, so a new key is made at each start | Set `AUTH_SECRET` in `.env` and restart: `docker compose up -d` |
