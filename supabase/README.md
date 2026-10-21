# Paradox · Supabase setup

## 1. Create project
1. Go to https://supabase.com → New project
2. Copy **Project URL** and **anon public key** from Settings → API

## 2. Paste credentials
Open `js/supabase-client.js` and replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

## 3. Run the schema
1. Open the SQL Editor in Supabase
2. Paste the entire contents of `schema.sql`
3. Run it

## 4. Auth settings (recommended for testing)
- Authentication → Providers → Email → enable
- Authentication → Settings → turn **off** “Confirm email” while developing
  (so you can sign up and use the account immediately)

## 5. What is already wired

| Feature              | Status                                      |
|----------------------|---------------------------------------------|
| Auth (sign up/in)    | `pages/profile.html`                        |
| Profiles + coins     | Top bar + profile page                      |
| Leaderboards         | Space Invaders + Theseus pages              |
| The Void (realtime)  | `pages/the-void.html`                       |
| Score submission     | Use `Paradox.submitScore(game, score)`      |
| Award coins          | Use `Paradox.addCoins(amount)`              |

## 6. Connecting games to the backend

In any game, after a run ends:

```js
// Submit high score (only if signed in)
if (window.Paradox) {
  await Paradox.submitScore('space-invaders', finalScore);
  await Paradox.addCoins(Math.floor(finalScore / 30)); // example reward
  await Paradox.refreshTopbar();
}
```

Game name strings currently used:
- `space-invaders`
- `theseus`
- (you can add `tetris`, `snake`, `pacman`, etc.)

## 7. Next optional pieces
- Direct Messages UI
- Art Gallery + Storage bucket
- General leaderboard page
- Store purchase flow (deduct coins via RPC)
