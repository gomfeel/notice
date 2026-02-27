export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  };
}

export async function insertLinkRecord(payload) {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is missing");
  }

  const response = await fetch(`${url}/rest/v1/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to insert link: ${response.status} ${detail}`);
  }

  return response.json();
}
