export type ProductStatus = "上架" | "下架";

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  storagePath?: string;
  sortOrder: number;
  isCover: boolean;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  description: string[];

  /**
   * 舊版單張商品圖片。
   *
   * 多圖片功能完成前暫時保留，
   * 避免現有前台與後台程式失效。
   */
  imageUrl?: string;

  /**
   * 新版商品多圖片。
   *
   * 目前先設為 optional，
   * 讓舊資料與舊程式保持相容。
   */
  images?: ProductImage[];
}