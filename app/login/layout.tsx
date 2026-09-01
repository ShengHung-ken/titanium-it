import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "管理員登入",
  robots: {
    index: false,
    follow: false,
    nocache: true,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

type LoginLayoutProps = {
  children: ReactNode;
};

export default function LoginLayout({
  children,
}: LoginLayoutProps) {
  return children;
}