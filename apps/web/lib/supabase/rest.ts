export function hasSupabaseEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export async function insertLinkToSupabase(payload: {
  folder_id?: string | null;
  original_url: string;
  title?: string;
  summary?: string;
  status?: string;
}) {
  if (!hasSupabaseEnv()) {
    return {
      skipped: true,
      reason: "SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.",
      payload,
    };
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
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
    throw new Error(`링크 저장 실패: ${response.status} ${detail}`);
  }

  return response.json();
}

export async function listRecentLinksFromSupabase(limit = 20) {
  if (!hasSupabaseEnv()) {
    return {
      skipped: true,
      reason: "SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.",
      items: [],
    };
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
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
    throw new Error(`링크 목록 조회 실패: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  const items = (rows ?? []).map((row: any) => ({
    id: row.id,
    url: row.original_url,
    title: row.title ?? "제목 없음",
    description: row.summary ?? "",
    selectedFolder: row.folder_id ?? "미분류",
    confidence: 0,
    createdAt: row.created_at,
  }));

  return {
    skipped: false,
    items,
  };
}

export async function listFoldersFromSupabase() {
  if (!hasSupabaseEnv()) {
    return { skipped: true, items: [] };
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const query = new URLSearchParams({
    select: "id,name,icon,created_at",
    order: "created_at.desc",
    limit: "100",
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/folders?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`폴더 목록 조회 실패: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  const items = (rows ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.icon ?? "",
    createdAt: row.created_at,
  }));

  return { skipped: false, items };
}