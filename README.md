# SoundWave

SoundWave is a desktop music-streaming project built from the supplied
architecture brief. The repository contains two Maven modules:

- `backend`: Spring Boot REST API, JWT authentication, MySQL and Flyway.
- `desktop`: JavaFX/FXML client that signs in, browses the catalogue and plays
  audio URLs supplied by the API.

## Requirements

- JDK 21 or newer (the project targets Java 21).
- Maven 3.9 or newer.
- MySQL 8 or newer (XAMPP MySQL/MariaDB is suitable for local development).

## Create the database and start the API

Start MySQL in the XAMPP Control Panel. The project uses the database named
`soundwave` (it has already been created on this machine; on another machine,
create it in phpMyAdmin with the `utf8mb4_unicode_ci` collation). Flyway creates
the tables on the first API startup. The Maven Wrapper downloads Maven on first
use, so a separate Maven install is not required. Open PowerShell in this folder
and use the standard XAMPP `root` account (no password):

```powershell
$env:JAVA_HOME = (Split-Path (Split-Path (Get-Command java).Source -Parent) -Parent)
$env:DB_URL = "jdbc:mysql://localhost:3306/soundwave?serverTimezone=UTC"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = ""
$env:JWT_SECRET = "replace-this-with-a-long-random-secret"
.\mvnw.cmd -pl backend spring-boot:run
```

If your MySQL account uses a password, set `DB_PASSWORD` to that password.
The default credentials and JDBC URL can also be changed in
`backend/src/main/resources/application.yml`.

Flyway creates the initial schema on startup. API documentation is available at
`http://localhost:8080/swagger-ui.html`.

## Start the JavaFX client

With the API running:

```powershell
.\mvnw.cmd -pl desktop javafx:run
```

The client connects to `http://localhost:8080` by default. Override it with
`-Dsoundwave.api.base-url=https://your-api-host`.

In IntelliJ IDEA, choose **Open**, select this folder (or its root `pom.xml`),
and import it as a Maven project. Set the project SDK to JDK 21 or newer. Start
the API first, then run the desktop command in a second terminal.

## Initial API

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/music` and `GET /api/music?q=search-term`
- Authenticated library routes under `/api/me` for playlists, favorites,
  listening history and listening statistics.

The catalogue stores audio URLs rather than distributing music files. Supply
audio URLs that you have permission to use.

## Project layout

```text
backend/src/main/java/com/soundwave/api/
  config/ security/ controllers/ dto/ entities/ repositories/ services/
desktop/src/main/java/com/soundwave/desktop/
  controllers/ models/ services/
desktop/src/main/resources/com/soundwave/desktop/views/
```

## Roadmap

1. Authentication, database schema and catalogue (current foundation).
2. JavaFX audio playback and catalogue search.
3. Playlists and favorites.
4. Listening history and user statistics.
5. Automated tests, Docker and deployment.
