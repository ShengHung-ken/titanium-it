import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  "https://shenghung-ken.github.io/titanium-it/";

const siteName =
  "鈦鼎資訊 | Titanium IT";

const siteDescription =
  "鈦鼎資訊提供電腦維修、客製化組裝、硬體升級、系統重灌、零組件、筆電與周邊設備服務。";

const logoUrl =
  "https://shenghung-ken.github.io/titanium-it/logo-titanium.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
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

    title: siteName,

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

    title: siteName,

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
      "@type": "Country",
      name: "Taiwan",
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
      "https://lin.ee/PC2w13i",
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