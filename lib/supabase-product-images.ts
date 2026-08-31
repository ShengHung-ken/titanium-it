import type {
  ProductImage,
} from "@/lib/products";

import type {
  UploadedProductImage,
} from "@/lib/product-storage";

import {
  getSupabaseClient,
} from "@/lib/supabase";

interface ProductImageRow {
  id: number;
  product_id: number;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
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

function mapProductImageRow(
  row: ProductImageRow,
): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    imageUrl: row.image_url,
    storagePath:
      row.storage_path ??
      undefined,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  };
}

/**
 * 讀取指定商品的所有圖片。
 */
export async function fetchProductImages(
  productId: number,
): Promise<ProductImage[]> {
  const supabase =
    requireSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("product_images")
    .select("*")
    .eq(
      "product_id",
      productId,
    )
    .order(
      "sort_order",
      {
        ascending: true,
      },
    );

  if (error) {
    throw new Error(
      `讀取商品圖片失敗：${error.message}`,
    );
  }

  return (
    (data as
      | ProductImageRow[]
      | null) ?? []
  ).map(
    mapProductImageRow,
  );
}

/**
 * 將已上傳至 Storage 的圖片
 * 寫入 product_images。
 *
 * 如果商品目前完全沒有圖片，
 * 第一張新圖片會自動成為封面。
 *
 * 已有封面的商品新增圖片時，
 * 新圖片不會搶走目前封面。
 */
export async function addProductImages(
  productId: number,
  uploadedImages:
    UploadedProductImage[],
): Promise<ProductImage[]> {
  if (
    uploadedImages.length === 0
  ) {
    return fetchProductImages(
      productId,
    );
  }

  const supabase =
    requireSupabase();

  const existingImages =
    await fetchProductImages(
      productId,
    );

  const hasCover =
    existingImages.some(
      (image) =>
        image.isCover,
    );

  const highestSortOrder =
    existingImages.reduce(
      (
        highest,
        image,
      ) =>
        Math.max(
          highest,
          image.sortOrder,
        ),
      -1,
    );

  const rows =
    uploadedImages.map(
      (
        image,
        index,
      ) => ({
        product_id:
          productId,

        image_url:
          image.publicUrl,

        storage_path:
          image.path,

        sort_order:
          highestSortOrder +
          index +
          1,

        is_cover:
          !hasCover &&
          index === 0,
      }),
    );

  const {
    error,
  } = await supabase
    .from("product_images")
    .insert(rows);

  if (error) {
    throw new Error(
      `新增商品圖片資料失敗：${error.message}`,
    );
  }

  /*
   * 如果原本完全沒有圖片，
   * 第一張新圖片同時同步到
   * products.image_url。
   *
   * 這是暫時保留舊版相容性。
   */
  if (
    existingImages.length ===
      0 &&
    uploadedImages[0]
  ) {
    const {
      error:
        legacyImageError,
    } = await supabase
      .from("products")
      .update({
        image_url:
          uploadedImages[0]
            .publicUrl,
      })
      .eq(
        "id",
        productId,
      );

    if (
      legacyImageError
    ) {
      throw new Error(
        `同步商品封面失敗：${legacyImageError.message}`,
      );
    }
  }

  return fetchProductImages(
    productId,
  );
}

/**
 * 將指定圖片設定成封面。
 *
 * 同時同步 products.image_url，
 * 保持舊版程式相容。
 */
export async function setProductImageCover(
  productId: number,
  imageId: number,
): Promise<ProductImage[]> {
  const supabase =
    requireSupabase();

  const images =
    await fetchProductImages(
      productId,
    );

  const targetImage =
    images.find(
      (image) =>
        image.id ===
        imageId,
    );

  if (!targetImage) {
    throw new Error(
      "找不到要設定為封面的商品圖片。",
    );
  }

  const {
    error:
      clearCoverError,
  } = await supabase
    .from("product_images")
    .update({
      is_cover: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "product_id",
      productId,
    )
    .eq(
      "is_cover",
      true,
    );

  if (
    clearCoverError
  ) {
    throw new Error(
      `清除原封面失敗：${clearCoverError.message}`,
    );
  }

  const {
    error:
      setCoverError,
  } = await supabase
    .from("product_images")
    .update({
      is_cover: true,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      imageId,
    )
    .eq(
      "product_id",
      productId,
    );

  if (setCoverError) {
    throw new Error(
      `設定商品封面失敗：${setCoverError.message}`,
    );
  }

  const {
    error:
      legacyImageError,
  } = await supabase
    .from("products")
    .update({
      image_url:
        targetImage.imageUrl,
    })
    .eq(
      "id",
      productId,
    );

  if (
    legacyImageError
  ) {
    throw new Error(
      `同步商品封面失敗：${legacyImageError.message}`,
    );
  }

  return fetchProductImages(
    productId,
  );
}

/**
 * 更新商品圖片排列順序。
 *
 * orderedImageIds 的順序：
 *
 * index 0 → sort_order 0
 * index 1 → sort_order 1
 * index 2 → sort_order 2
 */
export async function updateProductImageOrder(
  productId: number,
  orderedImageIds:
    number[],
): Promise<ProductImage[]> {
  const supabase =
    requireSupabase();

  for (
    let index = 0;
    index <
    orderedImageIds.length;
    index += 1
  ) {
    const imageId =
      orderedImageIds[
        index
      ];

    const {
      error,
    } = await supabase
      .from(
        "product_images",
      )
      .update({
        sort_order:
          index,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        imageId,
      )
      .eq(
        "product_id",
        productId,
      );

    if (error) {
      throw new Error(
        `更新商品圖片順序失敗：${error.message}`,
      );
    }
  }

  return fetchProductImages(
    productId,
  );
}

/**
 * 刪除單一 product_images 資料列。
 *
 * 如果刪掉的是封面，
 * 會自動把剩下的第一張圖片
 * 設成新的封面。
 *
 * 此函式只處理 Database。
 * Storage 實體檔案由外層另外清理。
 */
export async function deleteProductImageRecord(
  productId: number,
  imageId: number,
): Promise<{
  deletedImage:
    ProductImage;
  remainingImages:
    ProductImage[];
}> {
  const supabase =
    requireSupabase();

  const images =
    await fetchProductImages(
      productId,
    );

  const targetImage =
    images.find(
      (image) =>
        image.id ===
        imageId,
    );

  if (!targetImage) {
    throw new Error(
      "找不到要刪除的商品圖片。",
    );
  }

  const {
    error:
      deleteError,
  } = await supabase
    .from("product_images")
    .delete()
    .eq(
      "id",
      imageId,
    )
    .eq(
      "product_id",
      productId,
    );

  if (deleteError) {
    throw new Error(
      `刪除商品圖片資料失敗：${deleteError.message}`,
    );
  }

  let remainingImages =
    await fetchProductImages(
      productId,
    );

  /*
   * 如果刪掉的是封面，
   * 自動選剩下排序第一張當封面。
   */
  if (
    targetImage.isCover
  ) {
    const replacement =
      remainingImages[0];

    if (replacement) {
      remainingImages =
        await setProductImageCover(
          productId,
          replacement.id,
        );
    } else {
      const {
        error:
          clearLegacyError,
      } = await supabase
        .from("products")
        .update({
          image_url:
            null,
        })
        .eq(
          "id",
          productId,
        );

      if (
        clearLegacyError
      ) {
        throw new Error(
          `清除商品封面失敗：${clearLegacyError.message}`,
        );
      }
    }
  }

  /*
   * 重新整理 sort_order，
   * 避免刪圖後出現排序空洞。
   */
  if (
    remainingImages.length >
    0
  ) {
    remainingImages =
      await updateProductImageOrder(
        productId,
        remainingImages.map(
          (image) =>
            image.id,
        ),
      );
  }

  return {
    deletedImage:
      targetImage,
    remainingImages,
  };
}