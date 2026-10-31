# CineScope

CineScope is a polished React movie discovery platform built with Create React App (React 16). It offers a rich UI for exploring movies, searching by title, viewing detailed information, and checking where to watch via TMDB. The app features a dark, cinematic theme, responsive design, and local persistence for watchlists.

## Features

- **Discovery Homepage**: Trending, Popular, Upcoming, Top‑Rated, and genre‑based movie grids populated from TMDB.
- **Search & Filters**: Title search with type, year, and sorting filters; pagination with “Load more”.
- **Movie Details Modal**: Accessible modal with full metadata and “Where to Watch” provider data.
- **Watchlist**: Persisted locally via `localStorage`; add/remove movies directly from grid or modal.
- **Where to Watch**: TMDB‑backed provider availability, region selection, and JustWatch attribution.
- **Responsive Dark Theme**: Custom CSS with gradients, glassmorphism‑inspired cards, and smooth hover animations.
- **Accessibility**: ARIA labels, focus management, keyboard navigation.
- **Tests**: Unit tests covering search, modal, watchlist, and empty‑state handling.
- **Project Setup**: `.env.example` for API keys, `.gitignore` protects secrets.

## Getting Started

```bash
git clone https://github.com/your-username/cinescope.git
cd cinescope
npm install

# Copy the example env and add your keys
cp .env.example .env
# Edit .env and set REACT_APP_OMDB_API_KEY and REACT_APP_TMDB_ACCESS_TOKEN

npm start
```

Open http://localhost:3000 in your browser.

## Repository Setup

The project already contains a Git repository (`.git` folder). To link it to a new remote:

```bash
git remote add origin https://github.com/your-username/cinescope.git
git branch -M main
git push -u origin main
```

## Technology Stack

- **Frontend**: React 16, Axios, Create React App
- **APIs**: OMDb (movie metadata) + TMDB (watch provider data)
- **Styling**: Vanilla CSS with dark theme, gradients, and micro‑animations

## Future Work

- Release calendar view for upcoming movies.
- Backend with Django + PostgreSQL for persistent accounts and watchlists.
- Server‑side handling of TMDB tokens.
- Caching with Redis and email release reminders.
- Expanded test coverage and CI pipeline.

---

Feel free to explore the code, add new features, or customize the UI. Contributions are welcome!
