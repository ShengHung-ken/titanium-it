import { getSupabaseClient } from "@/lib/supabase";

export async function recordPageView(pagePath: string): Promise<void> {
  const normalizedPath = pagePath.trim();

  if (!normalizedPath || !normalizedPath.startsWith("/")) {
    return;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc("record_page_view", {
    p_page_path: normalizedPath,
  });

  if (error) {
    console.error("Failed to record page view:", error);
  }
}