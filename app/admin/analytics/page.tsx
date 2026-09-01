"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Eye,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAnalyticsDashboard,
  type AnalyticsDashboard,
} from "@/lib/supabase-analytics";
import { getSupabaseClient } from "@/lib/supabase";

const EMPTY_DASHBOARD: AnalyticsDashboard = {
  todayViews: 0,
  last7Days: 0,
  last30Days: 0,
  topPages: [],
  dailyViews: [],
};

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<AnalyticsDashboard>(EMPTY_DASHBOARD);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxDailyViews = useMemo(
    () =>
      Math.max(
        1,
        ...dashboard.dailyViews.map((item) => item.views),
      ),
    [dashboard.dailyViews],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAnalyticsDashboard();
      setDashboard(data);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "無法取得瀏覽統計資料。",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (active) {
          setError("Supabase 尚未設定。");
          setAuthChecking(false);
        }

        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (
        authError ||
        !user ||
        user.app_metadata?.role !== "admin"
      ) {
        router.replace("/login/");
        return;
      }

      setAuthChecking(false);
      await loadDashboard();
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadDashboard, router]);

  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <RefreshCw className="mx-auto mb-4 h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-slate-300">正在確認管理員權限...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
            >
              <ArrowLeft className="h-4 w-4" />
              返回管理後台
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                <BarChart3 className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  網站瀏覽統計
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  統計時間以 Asia/Taipei 為準
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            重新整理
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                今日瀏覽
              </span>

              <Eye className="h-5 w-5 text-cyan-400" />
            </div>

            <p className="text-4xl font-bold">
              {dashboard.todayViews.toLocaleString("zh-TW")}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              今日公開頁面瀏覽次數
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                近 7 天瀏覽
              </span>

              <CalendarDays className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="text-4xl font-bold">
              {dashboard.last7Days.toLocaleString("zh-TW")}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              包含今天最近 7 天
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                近 30 天瀏覽
              </span>

              <TrendingUp className="h-5 w-5 text-violet-400" />
            </div>

            <p className="text-4xl font-bold">
              {dashboard.last30Days.toLocaleString("zh-TW")}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              包含今天最近 30 天
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                近 30 天瀏覽趨勢
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                每日公開頁面瀏覽次數
              </p>
            </div>

            {dashboard.dailyViews.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
                尚無瀏覽資料
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex min-w-[720px] items-end gap-2">
                  {dashboard.dailyViews.map((item) => {
                    const height =
                      item.views === 0
                        ? 2
                        : Math.max(
                            6,
                            (item.views / maxDailyViews) * 180,
                          );

                    return (
                      <div
                        key={item.date}
                        className="flex min-w-0 flex-1 flex-col items-center"
                      >
                        <div className="mb-2 text-xs font-medium text-slate-300">
                          {item.views}
                        </div>

                        <div className="flex h-[180px] w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all"
                            style={{
                              height: `${height}px`,
                            }}
                            title={`${item.date}: ${item.views} 次`}
                          />
                        </div>

                        <div className="mt-2 whitespace-nowrap text-[10px] text-slate-500">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                熱門頁面
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                最近 30 天 Top 10
              </p>
            </div>

            {dashboard.topPages.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
                尚無瀏覽資料
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.topPages.map((item, index) => (
                  <div
                    key={item.pagePath}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-slate-300">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-medium text-slate-200"
                        title={item.pagePath}
                      >
                        {item.pagePath}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-cyan-400">
                        {item.views.toLocaleString("zh-TW")}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        次
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            正在更新統計資料...
          </div>
        )}
      </div>
    </main>
  );
}