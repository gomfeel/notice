# Supabase Edge Function Setup

## 1) Login and link project
```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

## 2) Set secrets
```bash
supabase secrets set OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
supabase secrets set SUPABASE_URL=<YOUR_SUPABASE_URL>
supabase secrets set SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

## 3) Deploy function
```bash
supabase functions deploy ai-categorize --no-verify-jwt
```

## 4) Local test
```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/ai-categorize" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "Example title",
    "description": "Example description",
    "folders": [{"name":"stock"},{"name":"travel"},{"name":"work"}]
  }'
```

## Notes
- If `OPENAI_API_KEY` is missing or OpenAI request fails, function returns keyword fallback classification.
- Web dashboard shows fallback/source info in the response JSON.