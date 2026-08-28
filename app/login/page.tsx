"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  getSupabaseClient,
} from "@/lib/supabase";

function isAdmin(
  appMetadata:
    | Record<string, unknown>
    | undefined,
): boolean {
  return (
    appMetadata?.role ===
    "admin"
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    configurationError,
    setConfigurationError,
  ] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase =
        getSupabaseClient();

      if (!supabase) {
        setConfigurationError(
          true,
        );

        setCheckingSession(
          false,
        );

        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (
        user &&
        isAdmin(
          user.app_metadata,
        )
      ) {
        router.replace(
          "/admin",
        );

        return;
      }

      setCheckingSession(
        false,
      );
    }

    checkSession();
  }, [router]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const supabase =
      getSupabaseClient();

    if (!supabase) {
      setConfigurationError(
        true,
      );

      return;
    }

    setLoading(true);
    setErrorMessage("");

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email:
            email.trim(),
          password,
        },
      );

    if (error) {
      setLoading(false);

      setErrorMessage(
        "登入失敗，請確認 Email 與密碼。",
      );

      return;
    }

    if (
      !data.user ||
      !isAdmin(
        data.user
          .app_metadata,
      )
    ) {
      await supabase.auth.signOut();

      setLoading(false);

      setErrorMessage(
        "這個帳號沒有後台管理權限。",
      );

      return;
    }

    setLoading(false);

    router.replace(
      "/admin",
    );
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050910] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black">
            鈦鼎資訊
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            檢查登入狀態中...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050910] px-5 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b111d] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="overflow-hidden rounded-2xl bg-black/30 p-3">
            <Image
              src="/logo-titanium.png"
              alt="鈦鼎資訊"
              width={700}
              height={400}
              priority
              className="mx-auto h-auto max-h-52 w-full object-contain"
            />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            鈦鼎資訊
          </h1>

          <p className="mt-2 tracking-[0.2em] text-slate-400">
            TITANIUM IT
          </p>

          <p className="mt-4 text-sm text-slate-500">
            後台管理系統
          </p>
        </div>

        {configurationError && (
          <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-200">
            尚未完成 Supabase
            登入系統設定。
            請先設定
            NEXT_PUBLIC_SUPABASE_URL
            與
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY。
          </div>
        )}

        <form
          onSubmit={
            handleLogin
          }
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              管理員 Email
            </label>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                type="email"
                required
                value={
                  email
                }
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event
                      .target
                      .value,
                  )
                }
                className="login-input pl-12"
                autoComplete="username"
                placeholder="請輸入管理員 Email"
                disabled={
                  configurationError
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              管理員密碼
            </label>

            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                type="password"
                required
                value={
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event
                      .target
                      .value,
                  )
                }
                className="login-input pl-12"
                placeholder="請輸入管理員密碼"
                autoComplete="current-password"
                disabled={
                  configurationError
                }
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {
                errorMessage
              }
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              configurationError
            }
            className="primary-button w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole className="h-4 w-4" />

            {loading
              ? "登入中..."
              : "登入後台"}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="secondary-button mt-3 w-full gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回網站
        </button>
      </div>

      <style jsx global>{`
        .login-input {
          width: 100%;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          border-radius: 0.75rem;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
          padding-top: 0.85rem;
          padding-bottom: 0.85rem;
          padding-right: 0.9rem;
          color: white;
          outline: none;
        }

        .login-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px
            rgba(
              59,
              130,
              246,
              0.12
            );
        }

        .login-input::placeholder {
          color: #64748b;
        }
      `}</style>
    </main>
  );
}