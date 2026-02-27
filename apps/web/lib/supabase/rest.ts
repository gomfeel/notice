export function hasSupabaseEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export async function insertLinkToSupabase(payload: {
  folder_id?: string | null;
  original_url: string;
  title?: string;
  summary?: string;
  status?: string;
}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      skipped: true,
      reason: "SUPABASE_URL or SUPABASE_ANON_KEY is missing",
      payload,
    };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Insert link failed: ${response.status} ${detail}`);
  }

  return response.json();
}

export async function listRecentLinksFromSupabase(limit = 20) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      skipped: true,
      reason: "SUPABASE_URL or SUPABASE_ANON_KEY is missing",
      items: [],
    };
  }

  const query = new URLSearchParams({
    select: "id,original_url,title,summary,created_at,folder_id,status",
    order: "created_at.desc",
    limit: String(limit),
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/links?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`List links failed: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  const items = (rows ?? []).map((row: any) => ({
    id: row.id,
    url: row.original_url,
    title: row.title ?? "Untitled",
    description: row.summary ?? "",
    selectedFolder: row.folder_id ?? "unassigned",
    confidence: 0,
    createdAt: row.created_at,
  }));

  return {
    skipped: false,
    items,
  };
}