import { getSupabaseClient } from "@/lib/supabase";

const PRODUCT_IMAGE_BUCKET =
  "product-images";

export interface UploadedProductImage {
  path: string;
  publicUrl: string;
}

/**
 * 取得 Supabase Client。
 */
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
 * 清理檔名，避免特殊字元造成
 * Supabase Storage 路徑問題。
 */
function sanitizeFileName(
  fileName: string,
): string {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "webp";

  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `${
    baseName || "product"
  }.${extension}`;
}

/**
 * 建立唯一的 Storage 路徑。
 *
 * 範例：
 *
 * products/
 * 1712345678901-UUID-product.webp
 */
function createStoragePath(
  fileName: string,
): string {
  const safeFileName =
    sanitizeFileName(fileName);

  const uniqueId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : `${
          Date.now()
        }-${Math.random()
          .toString(36)
          .slice(2)}`;

  return [
    "products",
    `${
      Date.now()
    }-${uniqueId}-${safeFileName}`,
  ].join("/");
}

/**
 * 上傳單張商品圖片。
 *
 * 回傳：
 * - Storage path
 * - Public URL
 *
 * 此函式保留給既有單張圖片流程使用。
 */
export async function uploadProductImage(
  file: File,
): Promise<UploadedProductImage> {
  const supabase =
    requireSupabase();

  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    throw new Error(
      "只能上傳圖片檔案。",
    );
  }

  const path =
    createStoragePath(
      file.name,
    );

  const {
    error: uploadError,
  } = await supabase.storage
    .from(
      PRODUCT_IMAGE_BUCKET,
    )
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      },
    );

  if (uploadError) {
    throw new Error(
      `商品圖片上傳失敗：${uploadError.message}`,
    );
  }

  const {
    data,
  } = supabase.storage
    .from(
      PRODUCT_IMAGE_BUCKET,
    )
    .getPublicUrl(path);

  if (!data.publicUrl) {
    /*
     * Public URL 取得失敗時，
     * 將剛才已上傳的檔案刪除，
     * 避免 Storage 留下孤兒檔案。
     */
    await supabase.storage
      .from(
        PRODUCT_IMAGE_BUCKET,
      )
      .remove([path]);

    throw new Error(
      "無法取得商品圖片 Public URL。",
    );
  }

  return {
    path,
    publicUrl:
      data.publicUrl,
  };
}

/**
 * 一次上傳多張商品圖片。
 *
 * 會依照傳入 File[] 的順序上傳，
 * 回傳順序也與原本選取順序一致。
 *
 * 若中途有任一圖片上傳失敗，
 * 會嘗試清除本次已成功上傳的圖片，
 * 避免留下不完整的 Storage 檔案。
 */
export async function uploadProductImages(
  files: File[],
): Promise<
  UploadedProductImage[]
> {
  if (files.length === 0) {
    return [];
  }

  const uploaded:
    UploadedProductImage[] =
    [];

  try {
    for (const file of files) {
      const result =
        await uploadProductImage(
          file,
        );

      uploaded.push(result);
    }

    return uploaded;
  } catch (error) {
    if (uploaded.length > 0) {
      try {
        await deleteProductImagesByPaths(
          uploaded.map(
            (image) =>
              image.path,
          ),
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "多圖片上傳失敗後，清理已上傳圖片時發生錯誤：",
          cleanupError,
        );
      }
    }

    throw error;
  }
}

/**
 * 依 Storage path 刪除單張商品圖片。
 */
export async function deleteProductImageByPath(
  path: string,
): Promise<void> {
  const supabase =
    requireSupabase();

  const normalizedPath =
    path.trim();

  if (!normalizedPath) {
    return;
  }

  const {
    error,
  } = await supabase.storage
    .from(
      PRODUCT_IMAGE_BUCKET,
    )
    .remove([
      normalizedPath,
    ]);

  if (error) {
    throw new Error(
      `刪除商品圖片失敗：${error.message}`,
    );
  }
}

/**
 * 一次依 Storage path
 * 刪除多張商品圖片。
 *
 * 空白 path 會自動忽略，
 * 重複 path 也會自動去除。
 */
export async function deleteProductImagesByPaths(
  paths: string[],
): Promise<void> {
  const supabase =
    requireSupabase();

  const normalizedPaths = [
    ...new Set(
      paths
        .map(
          (path) =>
            path.trim(),
        )
        .filter(Boolean),
    ),
  ];

  if (
    normalizedPaths.length ===
    0
  ) {
    return;
  }

  const {
    error,
  } = await supabase.storage
    .from(
      PRODUCT_IMAGE_BUCKET,
    )
    .remove(
      normalizedPaths,
    );

  if (error) {
    throw new Error(
      `刪除商品圖片失敗：${error.message}`,
    );
  }
}

/**
 * 從 Supabase Public URL
 * 解析 Storage path。
 *
 * 範例：
 *
 * https://xxxx.supabase.co/
 * storage/v1/object/public/
 * product-images/products/abc.webp
 *
 * 解析結果：
 *
 * products/abc.webp
 */
export function getProductImagePathFromUrl(
  imageUrl: string,
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url =
      new URL(imageUrl);

    const marker =
      `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;

    const markerIndex =
      url.pathname.indexOf(
        marker,
      );

    if (
      markerIndex === -1
    ) {
      return null;
    }

    const encodedPath =
      url.pathname.slice(
        markerIndex +
          marker.length,
      );

    if (!encodedPath) {
      return null;
    }

    return decodeURIComponent(
      encodedPath,
    );
  } catch {
    return null;
  }
}

/**
 * 依 Public URL
 * 刪除單張 Storage 圖片。
 *
 * 如果 URL 不是 product-images
 * Bucket 的 Supabase Public URL，
 * 會直接忽略，不會誤刪其他圖片。
 */
export async function deleteProductImageByUrl(
  imageUrl?: string,
): Promise<void> {
  if (!imageUrl) {
    return;
  }

  const path =
    getProductImagePathFromUrl(
      imageUrl,
    );

  if (!path) {
    return;
  }

  await deleteProductImageByPath(
    path,
  );
}

/**
 * 依多個 Public URL
 * 一次刪除 Storage 圖片。
 */
export async function deleteProductImagesByUrls(
  imageUrls: string[],
): Promise<void> {
  const paths = imageUrls
    .map(
      (imageUrl) =>
        getProductImagePathFromUrl(
          imageUrl,
        ),
    )
    .filter(
      (
        path,
      ): path is string =>
        Boolean(path),
    );

  await deleteProductImagesByPaths(
    paths,
  );
}

/**
 * 安全刪除單張圖片。
 *
 * 適合放在資料庫操作完成後的
 * 清理流程。
 *
 * 即使 Storage 刪除失敗，
 * 也不會再次拋出錯誤中斷主要流程，
 * 只會記錄到 Console。
 */
export async function safelyDeleteProductImage(
  imageUrl?: string,
): Promise<void> {
  if (!imageUrl) {
    return;
  }

  try {
    await deleteProductImageByUrl(
      imageUrl,
    );
  } catch (error) {
    console.error(
      "清理商品圖片失敗：",
      error,
    );
  }
}

/**
 * 安全刪除多張圖片。
 *
 * 即使 Storage 刪除失敗，
 * 也不會中斷主要商品流程。
 */
export async function safelyDeleteProductImages(
  imageUrls: string[],
): Promise<void> {
  if (
    imageUrls.length === 0
  ) {
    return;
  }

  try {
    await deleteProductImagesByUrls(
      imageUrls,
    );
  } catch (error) {
    console.error(
      "清理多張商品圖片失敗：",
      error,
    );
  }
}