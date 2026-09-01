"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { recordPageView } from "@/lib/analytics";

type TemplateProps = {
  children: ReactNode;
};

export default function Template({ children }: TemplateProps) {
  const pathname = usePathname();
  const lastRecordedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const isAdminPage =
      pathname === "/admin" || pathname.startsWith("/admin/");

    const isLoginPage =
      pathname === "/login" || pathname.startsWith("/login/");

    if (isAdminPage || isLoginPage) {
      return;
    }

    if (lastRecordedPath.current === pathname) {
      return;
    }

    lastRecordedPath.current = pathname;

    void recordPageView(pathname);
  }, [pathname]);

  return children;
}