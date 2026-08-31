import { getSupabaseClient } from "@/lib/supabase";
import type {
  Product,
  ProductImage,
  ProductStatus,
} from "@/lib/products";

interface ProductImageRow {
  id: number;
  product_id: number;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_cover: boolean;
}

interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  description: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
  product_images?: ProductImageRow[] | null;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  description: string[];
  imageUrl?: string;
}

function mapProductImageRow(
  row: ProductImageRow,
): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    imageUrl: row.image_url,
    storagePath:
      row.storage_path ?? undefined,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  };
}

function mapProductRow(
  row: ProductRow,
): Product {
  const images = (
    row.product_images ?? []
  )
    .map(mapProductImageRow)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder,
    );

  const coverImage =
    images.find(
      (image) => image.isCover,
    ) ?? images[0];

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    stock: row.stock,
    status: row.status,
    description:
      row.description ?? [],

    /**
     * 保留舊版 imageUrl，
     * 讓目前前台與後台可以繼續運作。
     *
     * 優先使用新版 product_images 的封面，
     * 若沒有新版圖片才使用舊 image_url。
     */
    imageUrl:
      coverImage?.imageUrl ??
      row.image_url ??
      undefined,

    images,
  };
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

/**
 * 讀取前台公開商品。
 *
 * products 的 RLS 只允許讀取上架商品。
 * product_images 的 RLS 只允許一般訪客
 * 讀取上架商品所屬的圖片。
 */
export async function fetchPublicProducts(): Promise<
  Product[]
> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select(
      `
        *,
        product_images (
          id,
          product_id,
          image_url,
          storage_path,
          sort_order,
          is_cover
        )
      `,
    )
    .eq("status", "上架")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `讀取公開商品失敗：${error.message}`,
    );
  }

  return (
    (data as ProductRow[] | null) ??
    []
  ).map(mapProductRow);
}

/**
 * 讀取管理員商品。
 *
 * Admin 可以透過 RLS 讀取所有商品，
 * 包含上架與下架商品，以及所有商品圖片。
 */
export async function fetchAdminProducts(): Promise<
  Product[]
> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select(
      `
        *,
        product_images (
          id,
          product_id,
          image_url,
          storage_path,
          sort_order,
          is_cover
        )
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `讀取管理員商品失敗：${error.message}`,
    );
  }

  return (
    (data as ProductRow[] | null) ??
    []
  ).map(mapProductRow);
}

/**
 * 新增商品。
 *
 * 目前仍保留 products.image_url，
 * 在多圖片上傳功能完成前維持舊版相容性。
 */
export async function createProduct(
  input: ProductInput,
): Promise<Product> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .insert({
      name: input.name,
      category: input.category,
      price: input.price,
      stock: input.stock,
      status: input.status,
      description:
        input.description,
      image_url:
        input.imageUrl ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `新增商品失敗：${error.message}`,
    );
  }

  return mapProductRow(
    data as ProductRow,
  );
}

/**
 * 修改商品。
 *
 * products.image_url 暫時保留，
 * 等多圖片功能完整切換後再決定是否移除。
 */
export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<Product> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .update({
      name: input.name,
      category: input.category,
      price: input.price,
      stock: input.stock,
      status: input.status,
      description:
        input.description,
      image_url:
        input.imageUrl ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `修改商品失敗：${error.message}`,
    );
  }

  return mapProductRow(
    data as ProductRow,
  );
}

/**
 * 更新商品上架 / 下架狀態。
 */
export async function updateProductStatus(
  id: number,
  status: ProductStatus,
): Promise<Product> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .update({
      status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `更新商品狀態失敗：${error.message}`,
    );
  }

  return mapProductRow(
    data as ProductRow,
  );
}

/**
 * 刪除商品。
 *
 * product_images.product_id 已設定
 * ON DELETE CASCADE，
 * 因此刪除 products 資料後，
 * product_images 的資料列會一起刪除。
 *
 * Supabase Storage 中的實體圖片檔，
 * 仍需要由商品圖片刪除流程另外處理。
 */
export async function deleteProduct(
  id: number,
): Promise<void> {
  const supabase =
    requireSupabase();

  const { error } =
    await supabase
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {
    throw new Error(
      `刪除商品失敗：${error.message}`,
    );
  }
}