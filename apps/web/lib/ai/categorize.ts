import { categorizeRuleBased } from "./ruleBased";

export interface FolderInput {
  id?: string;
  name: string;
  description?: string;
}

export interface CategorizePayload {
  url: string;
  title?: string;
  description?: string;
  folders: FolderInput[];
}

export async function categorizeWithEdgeFunction(payload: CategorizePayload) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ...categorizeRuleBased(payload),
      source: "rule-based",
    };
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-categorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      ...categorizeRuleBased(payload),
      source: "rule-based-fallback",
    };
  }

  const result = await response.json();
  return {
    ...result,
    source: "edge-function",
  };
}