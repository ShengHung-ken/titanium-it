import {
  getSupabaseClient,
} from "@/lib/supabase";

export type SiteSettingKey =
  | "brand_name"
  | "brand_name_en"
  | "brand_logo_shield"
  | "brand_logo_main"
  | "nav_home"
  | "nav_products"
  | "nav_services"
  | "nav_about"
  | "nav_contact"
  | "hero_badge"
  | "hero_title_before"
  | "hero_title_accent"
  | "hero_title_after"
  | "hero_subtitle"
  | "hero_description"
  | "hero_products_button"
  | "hero_contact_button"
  | "hero_card_1_title"
  | "hero_card_1_description"
  | "hero_card_2_title"
  | "hero_card_2_description"
  | "services_eyebrow"
  | "services_title"
  | "products_eyebrow"
  | "products_title"
  | "products_description"
  | "products_loading_title"
  | "products_loading_description"
  | "products_error_title"
  | "products_empty"
  | "products_stock_label"
  | "products_inquiry_button"
  | "about_eyebrow"
  | "about_title"
  | "about_description_1"
  | "about_description_2"
  | "about_feature_1"
  | "about_feature_2"
  | "about_feature_3"
  | "about_feature_4"
  | "contact_title"
  | "contact_description"
  | "contact_line_title"
  | "contact_line_description"
  | "contact_line_button"
  | "contact_facebook_button"
  | "contact_email_title"
  | "contact_email_button"
  | "contact_service_title"
  | "contact_service_description"
  | "contact_service_button"
  | "line_add_friend_url"
  | "line_qr_code_url"
  | "facebook_page_url"
  | "contact_email"
  | "footer_brand";

export type SiteSettings = Record<
  SiteSettingKey,
  string
>;

export interface SiteService {
  id: number;
  title: string;
  description: string;
  iconKey: string;
  sortOrder: number;
  isEnabled: boolean;
}

interface SiteSettingRow {
  setting_key: string;
  value: string;
}

interface SiteServiceRow {
  id: number;
  title: string;
  description: string;
  icon_key: string;
  sort_order: number;
  is_enabled: boolean;
}

/**
 * 首頁預設內容。
 *
 * 如果 Supabase 暫時無法讀取，
 * 前端仍可使用這些內容，
 * 避免整個官網文字消失。
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand_name: "鈦鼎資訊",
  brand_name_en: "TITANIUM IT",

  brand_logo_shield:
    "/logo-shield.png",

  brand_logo_main:
    "/logo-titanium.png",

  nav_home: "首頁",
  nav_products: "商品專區",
  nav_services: "服務項目",
  nav_about: "關於我們",
  nav_contact: "聯絡我們",

  hero_badge:
    "鈦鼎資訊・專業電腦服務",

  hero_title_before:
    "專業維修",

  hero_title_accent:
    "×",

  hero_title_after:
    "組裝升級",

  hero_subtitle:
    "快速・專業・誠信・在地服務",

  hero_description:
    "提供桌機、筆電維修、客製化電腦組裝、系統重灌、零組件升級、監控設備與到府服務。",

  hero_products_button:
    "瀏覽商品",

  hero_contact_button:
    "聯絡我們",

  hero_card_1_title:
    "客製電競主機",

  hero_card_1_description:
    "依照預算與需求搭配",

  hero_card_2_title:
    "筆電維修",

  hero_card_2_description:
    "快速檢測・專業維修",

  services_eyebrow:
    "SERVICES",

  services_title:
    "專業服務",

  products_eyebrow:
    "PRODUCTS",

  products_title:
    "熱門商品",

  products_description:
    "商品內容由鈦鼎資訊後台即時管理",

  products_loading_title:
    "商品讀取中...",

  products_loading_description:
    "正在連線至商品資料庫",

  products_error_title:
    "商品資料暫時無法讀取",

  products_empty:
    "目前尚無上架商品",

  products_stock_label:
    "庫存",

  products_inquiry_button:
    "詢問商品",

  about_eyebrow:
    "ABOUT US",

  about_title:
    "關於鈦鼎資訊",

  about_description_1:
    "鈦鼎資訊以專業技術、透明報價與在地服務為核心，提供電腦維修、升級、組裝與周邊設備服務。",

  about_description_2:
    "無論是桌上型電腦、筆記型電腦、零組件升級、系統問題或設備規劃，都歡迎與我們聯絡。",

  about_feature_1:
    "專業技術",

  about_feature_2:
    "透明報價",

  about_feature_3:
    "快速維修",

  about_feature_4:
    "售後服務",

  contact_title:
    "聯絡鈦鼎資訊",

  contact_description:
    "維修、組裝、升級及商品問題歡迎洽詢",

  contact_line_title:
    "LINE 官方帳號",

  contact_line_description:
    "掃描 QR Code，或直接點擊下方按鈕加入 LINE 官方帳號",

  contact_line_button:
    "加入 LINE 官方帳號",

  contact_facebook_button:
    "Facebook 粉絲專頁",

  contact_email_title:
    "聯絡 Email",

  contact_email_button:
    "寄送 Email",

  contact_service_title:
    "維修 / 商品諮詢",

  contact_service_description:
    "電腦維修、客製化組裝、系統升級、零組件及商品相關問題，歡迎透過 LINE 或 Email 聯絡。",

  contact_service_button:
    "LINE 詢問",

  line_add_friend_url:
    "https://lin.ee/PC2w13i",

  line_qr_code_url:
    "https://qr-official.line.me/gs/M_068wtdkw_GW.png?oat_content=qr",

  facebook_page_url:
    "https://www.facebook.com/titaniumit.tw",

  contact_email:
    "kevin7206160616@gmail.com",

  footer_brand:
    "鈦鼎資訊 TITANIUM IT",
};

export const DEFAULT_SITE_SERVICES: SiteService[] = [
  {
    id: 1,
    title: "筆電維修",
    description:
      "筆電故障檢測、螢幕、電池與零件更換。",
    iconKey: "laptop",
    sortOrder: 0,
    isEnabled: true,
  },
  {
    id: 2,
    title: "組裝升級",
    description:
      "客製化桌機組裝、硬體升級及效能優化。",
    iconKey: "cpu",
    sortOrder: 1,
    isEnabled: true,
  },
  {
    id: 3,
    title: "系統重灌",
    description:
      "Windows 安裝、驅動程式、資料備份。",
    iconKey: "hard-drive",
    sortOrder: 2,
    isEnabled: true,
  },
  {
    id: 4,
    title: "配件周邊",
    description:
      "SSD、RAM、鍵盤、滑鼠及各式電腦配件。",
    iconKey: "shopping-cart",
    sortOrder: 3,
    isEnabled: true,
  },
  {
    id: 5,
    title: "數位監控",
    description:
      "監視器設備規劃、安裝及設定服務。",
    iconKey: "shield-check",
    sortOrder: 4,
    isEnabled: true,
  },
  {
    id: 6,
    title: "清潔保養",
    description:
      "桌機與筆電除塵、散熱及基礎保養。",
    iconKey: "wrench",
    sortOrder: 5,
    isEnabled: true,
  },
  {
    id: 7,
    title: "二手回收",
    description:
      "二手電腦及零組件回收與估價。",
    iconKey: "monitor",
    sortOrder: 6,
    isEnabled: true,
  },
  {
    id: 8,
    title: "電腦施工",
    description:
      "企業、商家及住家電腦設備現場服務。",
    iconKey: "cpu",
    sortOrder: 7,
    isEnabled: true,
  },
];

function mapServiceRow(
  row: SiteServiceRow,
): SiteService {
  return {
    id: row.id,
    title: row.title,
    description:
      row.description,
    iconKey: row.icon_key,
    sortOrder:
      row.sort_order,
    isEnabled:
      row.is_enabled,
  };
}

function mergeSettings(
  rows: SiteSettingRow[],
): SiteSettings {
  const settings: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
  };

  for (const row of rows) {
    if (
      row.setting_key in
      settings
    ) {
      const key =
        row.setting_key as SiteSettingKey;

      settings[key] =
        row.value;
    }
  }

  return settings;
}

/**
 * 讀取前台網站設定。
 *
 * 若 Supabase 尚未設定，
 * 會回傳預設內容，
 * 避免官網無法顯示。
 */
export async function fetchPublicSiteSettings(): Promise<SiteSettings> {
  const supabase =
    getSupabaseClient();

  if (!supabase) {
    return {
      ...DEFAULT_SITE_SETTINGS,
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("site_settings")
    .select(
      "setting_key, value",
    );

  if (error) {
    throw new Error(
      `讀取網站設定失敗：${error.message}`,
    );
  }

  return mergeSettings(
    (data as
      | SiteSettingRow[]
      | null) ?? [],
  );
}

/**
 * 讀取前台服務項目。
 *
 * RLS 會自動限制一般訪客
 * 只能讀取 is_enabled = true。
 */
export async function fetchPublicSiteServices(): Promise<
  SiteService[]
> {
  const supabase =
    getSupabaseClient();

  if (!supabase) {
    return DEFAULT_SITE_SERVICES.map(
      (service) => ({
        ...service,
      }),
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("site_services")
    .select(
      `
        id,
        title,
        description,
        icon_key,
        sort_order,
        is_enabled
      `,
    )
    .eq(
      "is_enabled",
      true,
    )
    .order(
      "sort_order",
      {
        ascending: true,
      },
    );

  if (error) {
    throw new Error(
      `讀取服務項目失敗：${error.message}`,
    );
  }

  return (
    (data as
      | SiteServiceRow[]
      | null) ?? []
  ).map(mapServiceRow);
}

/**
 * 一次讀取首頁 CMS 內容。
 */
export async function fetchPublicSiteContent(): Promise<{
  settings: SiteSettings;
  services: SiteService[];
}> {
  const [
    settings,
    services,
  ] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicSiteServices(),
  ]);

  return {
    settings,
    services,
  };
}