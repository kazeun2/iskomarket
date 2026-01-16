Chat + Meet-up Prototype Demo

How to run

1. Start the dev server (as usual for the project, e.g. `npm run dev`).
2. Open the demo page in your browser:
   - http://localhost:3000/?test=chatdemo

What it demonstrates

- Real-time-style shared state between a buyer and seller for a single conversation (`conv_demo_1`).
- Message send + auto-welcome behavior (auto reply from other user once per day per conversation).
- Choose Meet-up (date-only) flow: propose, confirm, cancel, auto-expiry after deadlines simulated by timers.
- Pre-meetup countdown, window-to-confirm, Completed button and 7-day confirmation window.
- Mark-as-Done / Cancel Done and reward toggling.
- Appeals: submit appeal from a conversation; admin panel shows appeals where you can Approve/Dismiss; approving reopens the 7-day window.
- Read and typing indicators (simulated).
- `src/lib/chat/` contains pure state transition helpers that map closely to required Supabase tables.

Notes

- This is a front-end / in-memory prototype meant to be wired to Supabase later. The shape of the types and state is intentionally compatible with the requested tables (`conversations`, `messages`, `transactions`, `appeals`, `reviews`).
- The demo is intentionally minimal and self-contained. Replace the `ConversationProvider` primitives with Realtime subscriptions and RPCs to Supabase when wiring to the backend.
