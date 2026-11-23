import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  "https://titaniumit.rweb.site/";

const siteTitle =
  "桃園電腦維修、筆電維修與電腦組裝｜鈦鼎資訊";

const siteDescription =
  "鈦鼎資訊提供桃園地區桌機與筆電故障檢測、客製化電腦組裝、Windows 重灌及硬體升級。歡迎透過 LINE 洽詢維修、報價與到府服務範圍。";

const logoUrl =
  "https://titaniumit.rweb.site/logo-titanium.png";

const facebookUrl =
  "https://www.facebook.com/titaniumit.tw";

const lineUrl =
  "https://lin.ee/PC2w13i";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteTitle,
    template: `%s | 鈦鼎資訊`,
  },

  description: siteDescription,

  applicationName:
    "鈦鼎資訊 Titanium IT",

  keywords: [
    "鈦鼎資訊",
    "Titanium IT",
    "電腦維修",
    "電腦組裝",
    "客製化電腦",
    "筆電維修",
    "硬體升級",
    "系統重灌",
    "電腦零組件",
    "電腦周邊",
    "電競主機",
    "SSD 升級",
    "記憶體升級",
  ],

  authors: [
    {
      name: "鈦鼎資訊",
    },
  ],

  creator: "鈦鼎資訊",
  publisher: "鈦鼎資訊",

  category: "technology",

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "zh_TW",

    url: "/",

    siteName:
      "鈦鼎資訊 Titanium IT",

    title: siteTitle,

    description: siteDescription,

    images: [
      {
        url: "/logo-titanium.png",
        width: 1200,
        height: 630,
        alt: "鈦鼎資訊 Titanium IT",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: siteTitle,

    description: siteDescription,

    images: [
      "/logo-titanium.png",
    ],
  },

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      {
        url: "/logo-titanium.png",
        type: "image/png",
      },
    ],

    shortcut:
      "/logo-titanium.png",

    apple:
      "/logo-titanium.png",
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",

    name: "鈦鼎資訊",

    alternateName:
      "Titanium IT",

    url: siteUrl,

    logo: logoUrl,

    email:
      "mailto:kevin7206160616@gmail.com",

    description:
      siteDescription,

    areaServed: {
      "@type": "City",
      name: "桃園市",
    },

    contactPoint: {
      "@type": "ContactPoint",

      contactType:
        "customer service",

      email:
        "kevin7206160616@gmail.com",

      availableLanguage: [
        "zh-TW",
      ],
    },

    sameAs: [
      facebookUrl,
      lineUrl,
    ],
  },

  {
    "@context": "https://schema.org",
    "@type": "WebSite",

    name: "鈦鼎資訊",

    alternateName:
      "Titanium IT",

    url: siteUrl,

    description:
      siteDescription,

    inLanguage: "zh-Hant-TW",

    publisher: {
      "@type": "Organization",

      name: "鈦鼎資訊",

      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify(
                structuredData,
              ),
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}