import {
  getSupabaseClient,
} from "@/lib/supabase";

import type {
  SiteService,
  SiteSettingKey,
} from "@/lib/site-content";

export interface AdminSiteSetting {
  key: SiteSettingKey;
  value: string;
  groupName: string;
  label: string;
  sortOrder: number;
}

export interface SiteServiceInput {
  title: string;
  description: string;
  iconKey: string;
  sortOrder: number;
  isEnabled: boolean;
}

interface SiteSettingRow {
  setting_key: string;
  value: string;
  group_name: string;
  label: string;
  sort_order: number;
}

interface SiteServiceRow {
  id: number;
  title: string;
  description: string;
  icon_key: string;
  sort_order: number;
  is_enabled: boolean;
}

function requireSupabase() {
  const supabase =
    getSupabaseClient();

  if (!supabase) {
    throw new Error(
      "尚未設定 Supabase 連線資訊。",
    );
  }

  return supabase;
}

function mapSettingRow(
  row: SiteSettingRow,
): AdminSiteSetting {
  return {
    key:
      row.setting_key as SiteSettingKey,

    value:
      row.value,

    groupName:
      row.group_name,

    label:
      row.label,

    sortOrder:
      row.sort_order,
  };
}

function mapServiceRow(
  row: SiteServiceRow,
): SiteService {
  return {
    id: row.id,

    title:
      row.title,

    description:
      row.description,

    iconKey:
      row.icon_key,

    sortOrder:
      row.sort_order,

    isEnabled:
      row.is_enabled,
  };
}

/**
 * 管理員讀取所有網站設定。
 */
export async function fetchAdminSiteSettings(): Promise<
  AdminSiteSetting[]
> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("site_settings")
    .select(
      `
        setting_key,
        value,
        group_name,
        label,
        sort_order
      `,
    )
    .order(
      "group_name",
      {
        ascending: true,
      },
    )
    .order(
      "sort_order",
      {
        ascending: true,
      },
    );

  if (error) {
    throw new Error(
      `讀取網站設定失敗：${error.message}`,
    );
  }

  return (
    (data as
      | SiteSettingRow[]
      | null) ?? []
  ).map(mapSettingRow);
}

/**
 * 修改單一網站設定。
 */
export async function updateSiteSetting(
  key: SiteSettingKey,
  value: string,
): Promise<AdminSiteSetting> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("site_settings")
    .update({
      value,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "setting_key",
      key,
    )
    .select(
      `
        setting_key,
        value,
        group_name,
        label,
        sort_order
      `,
    )
    .single();

  if (error) {
    throw new Error(
      `修改網站設定失敗：${error.message}`,
    );
  }

  return mapSettingRow(
    data as SiteSettingRow,
  );
}

/**
 * 一次修改多個網站設定。
 *
 * 目前採逐筆更新，
 * 讓每筆操作都受到既有 RLS 保護。
 */
export async function updateSiteSettings(
  settings: Array<{
    key: SiteSettingKey;
    value: string;
  }>,
): Promise<AdminSiteSetting[]> {
  const updated:
    AdminSiteSetting[] = [];

  for (
    const setting of settings
  ) {
    const result =
      await updateSiteSetting(
        setting.key,
        setting.value,
      );

    updated.push(result);
  }

  return updated;
}

/**
 * 管理員讀取所有服務項目，
 * 包含已停用的服務。
 */
export async function fetchAdminSiteServices(): Promise<
  SiteService[]
> {
  const supabase =
    requireSupabase();

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
 * 新增服務項目。
 */
export async function createSiteService(
  input: SiteServiceInput,
): Promise<SiteService> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("site_services")
    .insert({
      title:
        input.title,

      description:
        input.description,

      icon_key:
        input.iconKey,

      sort_order:
        input.sortOrder,

      is_enabled:
        input.isEnabled,
    })
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
    .single();

  if (error) {
    throw new Error(
      `新增服務項目失敗：${error.message}`,
    );
  }

  return mapServiceRow(
    data as SiteServiceRow,
  );
}

/**
 * 修改服務項目。
 */
export async function updateSiteService(
  id: number,
  input: SiteServiceInput,
): Promise<SiteService> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("site_services")
    .update({
      title:
        input.title,

      description:
        input.description,

      icon_key:
        input.iconKey,

      sort_order:
        input.sortOrder,

      is_enabled:
        input.isEnabled,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      id,
    )
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
    .single();

  if (error) {
    throw new Error(
      `修改服務項目失敗：${error.message}`,
    );
  }

  return mapServiceRow(
    data as SiteServiceRow,
  );
}

/**
 * 刪除服務項目。
 */
export async function deleteSiteService(
  id: number,
): Promise<void> {
  const supabase =
    requireSupabase();

  const {
    error,
  } = await supabase
    .from("site_services")
    .delete()
    .eq(
      "id",
      id,
    );

  if (error) {
    throw new Error(
      `刪除服務項目失敗：${error.message}`,
    );
  }
}

/**
 * 更新服務項目排序。
 */
export async function updateSiteServiceOrder(
  orderedServiceIds:
    number[],
): Promise<SiteService[]> {
  const supabase =
    requireSupabase();

  for (
    let index = 0;
    index <
    orderedServiceIds.length;
    index += 1
  ) {
    const serviceId =
      orderedServiceIds[
        index
      ];

    const {
      error,
    } = await supabase
      .from("site_services")
      .update({
        sort_order:
          index,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        serviceId,
      );

    if (error) {
      throw new Error(
        `更新服務項目順序失敗：${error.message}`,
      );
    }
  }

  return fetchAdminSiteServices();
}