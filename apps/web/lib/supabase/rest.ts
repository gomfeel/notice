export function hasSupabaseEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_URL \uB610\uB294 SUPABASE_ANON_KEY\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
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
      reason: "SUPABASE_URL \uB610\uB294 SUPABASE_ANON_KEY\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
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
    throw new Error(`\uB9C1\uD06C \uC800\uC7A5 \uC2E4\uD328: ${response.status} ${detail}`);
  }

  return response.json();
}

export async function updateLinkStatusInSupabase(id: string, status: "unread" | "read") {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const response = await fetch(`${supabaseUrl}/rest/v1/links?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`\uB9C1\uD06C \uC0C1\uD0DC \uC218\uC815 \uC2E4\uD328: ${response.status} ${detail}`);
  }

  return response.json();
}

export async function listRecentLinksFromSupabase(limit = 20) {
  if (!hasSupabaseEnv()) {
    return {
      skipped: true,
      reason: "SUPABASE_URL \uB610\uB294 SUPABASE_ANON_KEY\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
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
    throw new Error(`\uB9C1\uD06C \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  const items = (rows ?? []).map((row: any) => ({
    id: row.id,
    url: row.original_url,
    title: row.title ?? "\uC81C\uBAA9 \uC5C6\uC74C",
    description: row.summary ?? "",
    selectedFolder: row.folder_id ?? "\uBBF8\uBD84\uB958",
    confidence: 0,
    status: row.status === "read" ? "read" : "unread",
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
    throw new Error(`\uD3F4\uB354 \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${response.status} ${detail}`);
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

export async function listTasksFromSupabase(limit = 50) {
  if (!hasSupabaseEnv()) {
    return { skipped: true, items: [] };
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const query = new URLSearchParams({
    select: "id,content,is_completed,show_on_lock_screen,starts_at,ends_at,created_at",
    order: "created_at.desc",
    limit: String(limit),
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/tasks?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`\uD560 \uC77C \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  const items = (rows ?? []).map((row: any) => ({
    id: row.id,
    content: row.content,
    isCompleted: row.is_completed,
    showOnLockScreen: row.show_on_lock_screen,
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    createdAt: row.created_at,
  }));

  return { skipped: false, items };
}

export async function insertTaskToSupabase(payload: {
  content: string;
  is_completed?: boolean;
  show_on_lock_screen?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
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
    throw new Error(`\uD560 \uC77C \uC800\uC7A5 \uC2E4\uD328: ${response.status} ${detail}`);
  }

  return response.json();
}

export async function updateTaskCompletionInSupabase(id: string, isCompleted: boolean) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const response = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ is_completed: isCompleted }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`\uD560 \uC77C \uC0C1\uD0DC \uC218\uC815 \uC2E4\uD328: ${response.status} ${detail}`);
  }

  return response.json();
}