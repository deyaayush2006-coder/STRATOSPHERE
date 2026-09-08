# Auth Backend (Express + MongoDB + JWT)

A minimal, production-leaning backend for user registration and login.

## Features
- Register with name, email, password
- Passwords hashed with bcrypt (never stored in plain text)
- Login returns a JWT access token
- `GET /api/auth/me` — example protected route that requires the token
- Input validation (express-validator)
- Basic rate limiting on auth endpoints
- CORS configured for your frontend origin

## Project structure
```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── authController.js  # register/login/getMe logic
├── middleware/
│   ├── auth.js             # verifies JWT on protected routes
│   └── validate.js         # formats express-validator errors
├── models/
│   └── User.js              # Mongoose schema + password hashing
├── routes/
│   └── auth.js               # /api/auth/* routes
├── .env.example
├── .gitignore
├── package.json
└── server.js                 # app entry point
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```
   - `MONGO_URI` — your MongoDB connection string (local Mongo or a free MongoDB Atlas cluster)
   - `JWT_SECRET` — any long random string (e.g. generate one with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `CLIENT_ORIGIN` — the URL of your frontend (e.g. `http://localhost:3000`)

3. **Run MongoDB**
   Either run MongoDB locally, or create a free cluster at https://www.mongodb.com/atlas and paste its connection string into `MONGO_URI`.

4. **Start the server**
   ```bash
   npm run dev      # with nodemon, auto-restarts on changes
   # or
   npm start
   ```
   The server runs on `http://localhost:5000` by default.

## API Reference

### Register
`POST /api/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "at-least-8-characters"
}
```
Response `201`:
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "jane@example.com",
  "password": "at-least-8-characters"
}
```
Response `200`: same shape as register (`token` + `user`).

### Get current user (protected)
`GET /api/auth/me`
Header: `Authorization: Bearer <token>`

Response `200`:
```json
{
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "createdAt": "..." }
}
```

## How authentication works
1. On register/login, the server signs a JWT containing the user's ID and returns it to the client.
2. The client stores this token (e.g. in memory, or a secure cookie — avoid `localStorage` for anything sensitive if you can help it) and sends it back on future requests as `Authorization: Bearer <token>`.
3. `middleware/auth.js` verifies the token on protected routes and attaches `req.userId` for the route handler to use.
