# Stratosphere

Site for the Stratosphere Aerospace Club, Jadavpur University.
React + Vite + Tailwind v4.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

The contact form needs the API in `server/` running as well:

```bash
cd server && npm install && npm run dev    # http://localhost:4000
```

Set `VITE_API_URL` in `.env` if the API is anywhere other than
`http://localhost:4000`.

## Layout

```
data.js          all page content — sections, members, events, projects
index.html       document head + the pre-paint theme script
src/
  App.jsx        routes and the shared backdrop
  pages/         Home, ProjectDetail
  components/    one file per section
  index.css      theme tokens, glass surfaces, backdrop layers
public/images/   team, events, projects, hero
server/          feedback API (Express + MongoDB)
```

Content lives in `data.js`, not in the components — adding an event or a
committee year is an edit to that file alone.

## Build

```bash
npm run build     # dist/
npm run preview
```
