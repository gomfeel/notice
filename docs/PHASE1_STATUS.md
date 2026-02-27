# Phase 1 Status

## Implemented
- URL intake API: `POST /api/intake`
- Intake history API: `GET /api/intake`
- Dashboard intake form + recent items list
- Metadata extraction helper
- Classification path:
  - Supabase Edge Function (OpenAI `gpt-4o-mini`) when `OPENAI_API_KEY` is set
  - Keyword fallback when OpenAI key is missing or request fails
- Supabase insert path:
  - Real insert if env exists
  - Skip mode with reason otherwise

## Remaining for production
- iOS Share Extension target and App Group handoff
- Full auth + RLS validation with real user sessions
- Persistent queue and retry strategy
- Production-grade prompt/version management