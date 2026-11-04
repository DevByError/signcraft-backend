# SignCraft Backend

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Bun 1.3+](https://img.shields.io/badge/bun-1.3%2B-black.svg)

The API server for SignCraft, a digital signage system. It stores designs, playlists and screens in MySQL, handles login, renders playlists to MP4 and uploads them to Amazon S3, and tells the screen players over Socket.IO when new content is ready.

It is used by the SignCraft web app and the SignCraft Android player.

## Features

- Account registration and login with bcrypt password hashes and a JWT in an HTTP-only cookie
- Role checks per route, driven by role and route tables in the database
- CRUD endpoints for designs, playlists and screens
- Asset uploads to S3
- Playlist rendering: opens the web app's playlist preview in headless Chrome (Puppeteer), records it to MP4, uploads it to S3 and creates schedule entries for the selected screens
- Socket.IO events for screen registration, online and offline status, deployment progress and content refresh

## Architecture

```
Web app ---- REST + Socket.IO ----> Express server (this repo)
                                       |-- MySQL (Sequelize models)
                                       |-- Puppeteer -> MP4 -> Amazon S3
                                       '-- Socket.IO room per screen
Android player -- register_screen --> joins its screen room
               <-- refresh_content -- after a deployment
               -- GET /design/getscreencontent --> schedule with S3 video URLs
```

## Requirements

- Bun 1.3 or newer
- MySQL 8 (or MariaDB 10.6+)
- An Amazon S3 bucket and an IAM key with `s3:PutObject` and `s3:ListAllMyBuckets` on it
- Chrome dependencies for Puppeteer. Puppeteer downloads its own Chromium on install. On a Linux server you may need the usual Chrome system libraries.
- FFmpeg on the `PATH`, used by the single-design video export

## Installation

```bash
git clone https://github.com/DevByError/ecoprse-full.git
cd ecoprse-full/backend
bun install
cp .env.example .env
```

Create the database before the first start:

```sql
CREATE DATABASE signcraft_db;
```

## Configuration

All settings are read from `.env`.

| Variable | Description |
| --- | --- |
| `dbname`, `dbusername`, `dbpassword`, `dbhost`, `dbport` | MySQL connection |
| `dialect` | Sequelize dialect, `mysql` |
| `token_secret` | Secret used to sign JWTs. Use a long random value. |
| `port` | HTTP and Socket.IO port, default `5000` |
| `FRONTEND_URL` | Address of the web app. Used for CORS and by Puppeteer to open the playlist preview. Default `http://localhost:3001` |
| `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` | S3 bucket for uploaded assets and rendered videos |
| `NODE_ENV` | `development` or `production`. In production the auth cookie is marked secure. |

## Usage

```bash
bun run server.ts
```

On start the server connects to MySQL and runs `sequelize.sync({ alter: true })`, which creates or updates the tables to match the models. Back up the database before upgrading in production.

### Roles

New accounts get the `designer` role unless a row in `tbluserroleconfig` links them to another role in `tblrole`. Routes protected by the role check (for example deleting a design) also need matching rows in `tblroute` and `tblrouteroleconfig`. Add these rows by hand or with your own seed script.

### Main endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/accounts/register` | No | Create an account |
| POST | `/accounts/login` | No | Log in and set the `authtoken` cookie |
| GET | `/accounts/logout` | Yes | Clear the cookie |
| GET | `/accounts/profile` | Yes | Current user |
| GET | `/design/getalldesigns`, `/design/getdesignbyid` | Yes | Read designs |
| POST | `/design/postsavedesign`, `/design/postdeldesign` | Yes | Save or delete a design |
| POST | `/design/postuploadasset` | Yes | Upload an asset to S3 |
| GET/POST | `/design/getplaylists`, `/design/postsaveplaylist`, ... | Yes | Playlists |
| GET/POST | `/design/getscreens`, `/design/postscreenupdate`, ... | Yes | Screens |
| POST | `/design/postdeploytoscreen` | Yes | Render a playlist and schedule it on screens |
| GET | `/design/getscreencontent?screenId=` | No | Schedule for a player |

## Project structure

```
server.ts       Express and Socket.IO setup, screen registration events
controllers/    Request handlers for accounts, designs, playlists and screens
middlewares/    JWT check, role check, menu and profile helpers
models/         Sequelize models (designing/ and management/)
routes/         Route definitions
utils/          Database connection and S3 helpers
validators/     express-validator rules
types/          Express request type extensions
```

## Troubleshooting

- **`SequelizeConnectionRefusedError`.** MySQL is not running or the `db*` values are wrong.
- **CORS errors in the browser.** `FRONTEND_URL` must match the web app's address exactly, including the port.
- **`[S3 Init]` errors at startup.** Check the AWS variables and the IAM permissions. The server still starts, but uploads and deployments fail.
- **Deployment stays at "Preparing recording".** Puppeteer cannot open `FRONTEND_URL`, or Chromium is missing system libraries. Run the server in a terminal and check the log.
- **Players never get content.** The player must reach this server on `port`, and the screen ID it registers with must exist and be active.

## Roadmap

- Seed script for roles and routes
- Database migrations instead of `sync({ alter: true })`
- Move rendering to a background job queue

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

Built with Bun, Express, Sequelize, Socket.IO, Puppeteer, puppeteer-screen-recorder, FFmpeg and the AWS SDK.
