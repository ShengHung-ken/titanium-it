import { getSupabaseClient } from "@/lib/supabase";

export interface AnalyticsTopPage {
  pagePath: string;
  views: number;
}

export interface AnalyticsDailyView {
  date: string;
  views: number;
}

export interface AnalyticsDashboard {
  todayViews: number;
  last7Days: number;
  last30Days: number;
  topPages: AnalyticsTopPage[];
  dailyViews: AnalyticsDailyView[];
}

interface AnalyticsDashboardResponse {
  today_views?: number | string;
  last_7_days?: number | string;
  last_30_days?: number | string;
  top_pages?: Array<{
    page_path?: string;
    views?: number | string;
  }>;
  daily_views?: Array<{
    date?: string;
    views?: number | string;
  }>;
}

function toNumber(value: number | string | undefined): number {
  const parsedValue = Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export async function fetchAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase 尚未設定。");
  }

  const { data, error } = await supabase.rpc("get_analytics_dashboard");

  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? {}) as AnalyticsDashboardResponse;

  return {
    todayViews: toNumber(result.today_views),
    last7Days: toNumber(result.last_7_days),
    last30Days: toNumber(result.last_30_days),
    topPages: Array.isArray(result.top_pages)
      ? result.top_pages.map((item) => ({
          pagePath: item.page_path ?? "/",
          views: toNumber(item.views),
        }))
      : [],
    dailyViews: Array.isArray(result.daily_views)
      ? result.daily_views.map((item) => ({
          date: item.date ?? "",
          views: toNumber(item.views),
        }))
      : [],
  };
}