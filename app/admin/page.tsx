"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LogOut,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  compressImage,
  fileToDataUrl,
  formatFileSize,
} from "@/lib/image";

import type {
  Product,
  ProductImage,
  ProductStatus,
} from "@/lib/products";

import {
  deleteProductImagesByPaths,
  safelyDeleteProductImage,
  safelyDeleteProductImages,
  uploadProductImages,
} from "@/lib/product-storage";

import {
  addProductImages,
  deleteProductImageRecord,
  fetchProductImages,
  setProductImageCover,
  updateProductImageOrder,
} from "@/lib/supabase-product-images";

import {
  createProduct,
  deleteProduct as deleteSupabaseProduct,
  fetchAdminProducts,
  type ProductInput,
  updateProduct,
  updateProductStatus,
} from "@/lib/supabase-products";

import {
  getSupabaseClient,
} from "@/lib/supabase";

interface ProductFormState {
  name: string;
  category: string;
  price: string;
  stock: string;
  status: ProductStatus;
  description: string;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}

const INITIAL_FORM: ProductFormState = {
  name: "",
  category: "",
  price: "0",
  stock: "0",
  status: "上架",
  description: "",
};

function formatPrice(
  price: number,
): string {
  return new Intl.NumberFormat(
    "zh-TW",
  ).format(price);
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function isAdmin(
  appMetadata:
    | Record<string, unknown>
    | undefined,
): boolean {
  return (
    appMetadata?.role ===
    "admin"
  );
}

function createLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function AdminPage() {
  const router = useRouter();

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    authChecking,
    setAuthChecking,
  ] = useState(true);

  const [
    configurationError,
    setConfigurationError,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null,
  );

  const [
    form,
    setForm,
  ] =
    useState<ProductFormState>(
      INITIAL_FORM,
    );

  const [
    pendingImages,
    setPendingImages,
  ] = useState<PendingImage[]>(
    [],
  );

  const [
    pendingCoverId,
    setPendingCoverId,
  ] = useState<string | null>(
    null,
  );

  const [
    imageInfo,
    setImageInfo,
  ] = useState("");

  const [
    imageError,
    setImageError,
  ] = useState("");

  const [
    compressing,
    setCompressing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState<number | null>(
    null,
  );

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null,
  );

  const [
    imageActionId,
    setImageActionId,
  ] = useState<number | null>(
    null,
  );

  const editingProduct =
    useMemo(
      () =>
        editingId === null
          ? undefined
          : products.find(
              (product) =>
                product.id ===
                editingId,
            ),
      [editingId, products],
    );

  const existingImages =
    useMemo(() => {
      return [
        ...(editingProduct?.images ??
          []),
      ].sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder,
      );
    }, [editingProduct]);

  const categoryOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          products
            .map((product) =>
              product.category.trim(),
            )
            .filter(Boolean),
        ),
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "zh-TW",
        ),
      );
    }, [products]);

  const statistics =
    useMemo(() => {
      return {
        total: products.length,

        online: products.filter(
          (product) =>
            product.status ===
            "上架",
        ).length,

        offline: products.filter(
          (product) =>
            product.status ===
            "下架",
        ).length,

        stock: products.reduce(
          (
            total,
            product,
          ) =>
            total +
            product.stock,
          0,
        ),
      };
    }, [products]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const supabase =
        getSupabaseClient();

      if (!supabase) {
        if (active) {
          setConfigurationError(
            true,
          );

          setAuthChecking(
            false,
          );
        }

        return;
      }

      try {
        const {
          data: { user },
          error,
        } =
          await supabase.auth.getUser();

        if (
          error ||
          !user ||
          !isAdmin(
            user.app_metadata,
          )
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/login",
          );

          return;
        }

        const currentProducts =
          await fetchAdminProducts();

        if (active) {
          setProducts(
            currentProducts,
          );
        }
      } catch (error) {
        if (active) {
          setPageError(
            getErrorMessage(
              error,
              "後台資料讀取失敗。",
            ),
          );
        }
      } finally {
        if (active) {
          setAuthChecking(
            false,
          );
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  async function reloadProducts() {
    const currentProducts =
      await fetchAdminProducts();

    setProducts(
      currentProducts,
    );
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      ...INITIAL_FORM,
    });

    setPendingImages([]);

    setPendingCoverId(null);

    setImageInfo("");

    setImageError("");
  }

  function startEdit(
    product: Product,
  ) {
    setEditingId(
      product.id,
    );

    setForm({
      name: product.name,

      category:
        product.category,

      price:
        product.price.toString(),

      stock:
        product.stock.toString(),

      status:
        product.status,

      description:
        product.description.join(
          "\n",
        ),
    });

    setPendingImages([]);

    setPendingCoverId(null);

    setImageInfo("");

    setImageError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    resetForm();
  }

  function validateProduct():
    | ProductInput
    | null {
    const name =
      form.name.trim();

    const category =
      form.category.trim();

    const price =
      Number(form.price);

    const stock =
      Number(form.stock);

    if (!name) {
      alert(
        "請輸入商品名稱。",
      );

      return null;
    }

    if (!category) {
      alert(
        "請輸入商品分類。",
      );

      return null;
    }

    if (
      !Number.isFinite(
        price,
      ) ||
      price < 0
    ) {
      alert(
        "商品價格必須是 0 以上的數字。",
      );

      return null;
    }

    if (
      !Number.isFinite(
        stock,
      ) ||
      stock < 0
    ) {
      alert(
        "商品庫存必須是 0 以上的數字。",
      );

      return null;
    }

    return {
      name,
      category,
      price,
      stock,
      status: form.status,

      description:
        form.description
          .split("\n")
          .map((item) =>
            item.trim(),
          )
          .filter(Boolean),

      imageUrl:
        editingProduct
          ?.imageUrl,
    };
  }

  async function handleImagesChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files =
      Array.from(
        event.target.files ??
          [],
      );

    event.target.value = "";

    if (
      files.length ===
      0
    ) {
      return;
    }

    setCompressing(true);

    setImageError("");

    setImageInfo("");

    const preparedImages:
      PendingImage[] = [];

    const failedFiles:
      string[] = [];

    let totalOriginalSize =
      0;

    let totalCompressedSize =
      0;

    try {
      for (const file of files) {
        try {
          if (
            !file.type.startsWith(
              "image/",
            )
          ) {
            failedFiles.push(
              file.name,
            );

            continue;
          }

          const compressed =
            await compressImage(
              file,
            );

          const previewUrl =
            await fileToDataUrl(
              compressed,
            );

          totalOriginalSize +=
            file.size;

          totalCompressedSize +=
            compressed.size;

          preparedImages.push({
            id: createLocalId(),

            file: compressed,

            previewUrl,

            originalSize:
              file.size,

            compressedSize:
              compressed.size,
          });
        } catch (error) {
          console.error(
            `圖片處理失敗：${file.name}`,
            error,
          );

          failedFiles.push(
            file.name,
          );
        }
      }

      if (
        preparedImages.length >
        0
      ) {
        const hadNoPendingImages =
          pendingImages.length ===
          0;

        const hadNoExistingCover =
          !existingImages.some(
            (image) =>
              image.isCover,
          );

        setPendingImages(
          (current) => [
            ...current,
            ...preparedImages,
          ],
        );

        if (
          pendingCoverId ===
            null &&
          hadNoPendingImages &&
          hadNoExistingCover
        ) {
          setPendingCoverId(
            preparedImages[0].id,
          );
        }

        setImageInfo(
          `已加入 ${
            preparedImages.length
          } 張圖片。壓縮前 ${formatFileSize(
            totalOriginalSize,
          )}，壓縮後 ${formatFileSize(
            totalCompressedSize,
          )}。`,
        );
      }

      if (
        failedFiles.length >
        0
      ) {
        setImageError(
          `有 ${
            failedFiles.length
          } 張圖片處理失敗：${failedFiles.join(
            "、",
          )}`,
        );
      }
    } finally {
      setCompressing(false);
    }
  }

  function removePendingImage(
    imageId: string,
  ) {
    const remaining =
      pendingImages.filter(
        (image) =>
          image.id !==
          imageId,
      );

    setPendingImages(
      remaining,
    );

    if (
      pendingCoverId ===
      imageId
    ) {
      const hasExistingCover =
        existingImages.some(
          (image) =>
            image.isCover,
        );

      setPendingCoverId(
        hasExistingCover
          ? null
          : remaining[0]
              ?.id ?? null,
      );
    }
  }

  function movePendingImage(
    index: number,
    direction:
      | "left"
      | "right",
  ) {
    const targetIndex =
      direction === "left"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        pendingImages.length
    ) {
      return;
    }

    const next = [
      ...pendingImages,
    ];

    const current =
      next[index];

    next[index] =
      next[targetIndex];

    next[targetIndex] =
      current;

    setPendingImages(next);
  }

  async function saveProduct(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      compressing ||
      saving
    ) {
      return;
    }

    const productInput =
      validateProduct();

    if (!productInput) {
      return;
    }

    let uploadedImages:
      Awaited<
        ReturnType<
          typeof uploadProductImages
        >
      > = [];

    let savedProductId:
      | number
      | null = null;

    try {
      setSaving(true);

      setPageError("");

      if (
        pendingImages.length >
        0
      ) {
        uploadedImages =
          await uploadProductImages(
            pendingImages.map(
              (image) =>
                image.file,
            ),
          );
      }

      if (
        editingId !== null
      ) {
        const updatedProduct =
          await updateProduct(
            editingId,
            productInput,
          );

        savedProductId =
          updatedProduct.id;
      } else {
        const newProduct =
          await createProduct({
            ...productInput,

            imageUrl:
              undefined,
          });

        savedProductId =
          newProduct.id;
      }

      if (
        uploadedImages.length >
          0 &&
        savedProductId !== null
      ) {
        await addProductImages(
          savedProductId,
          uploadedImages,
        );

        if (
          pendingCoverId
        ) {
          const coverIndex =
            pendingImages.findIndex(
              (image) =>
                image.id ===
                pendingCoverId,
            );

          if (
            coverIndex >= 0 &&
            uploadedImages[
              coverIndex
            ]
          ) {
            const allImages =
              await fetchProductImages(
                savedProductId,
              );

            const targetUrl =
              uploadedImages[
                coverIndex
              ].publicUrl;

            const targetImage =
              allImages.find(
                (image) =>
                  image.imageUrl ===
                  targetUrl,
              );

            if (targetImage) {
              await setProductImageCover(
                savedProductId,
                targetImage.id,
              );
            }
          }
        }
      }

      await reloadProducts();

      const successMessage =
        editingId === null
          ? "商品新增完成。"
          : "商品修改完成。";

      resetForm();

      alert(
        successMessage,
      );
    } catch (error) {
      /*
       * 如果圖片已上傳到 Storage，
       * 但商品本身尚未建立，
       * 可以安全刪除這批檔案。
       *
       * 如果商品已建立，
       * 先確認哪些圖片已經寫入
       * product_images，
       * 只清理沒有資料列對應的孤兒檔案。
       */
      if (
        uploadedImages.length >
        0
      ) {
        try {
          if (
            savedProductId ===
            null
          ) {
            await deleteProductImagesByPaths(
              uploadedImages.map(
                (image) =>
                  image.path,
              ),
            );
          } else {
            const linkedImages =
              await fetchProductImages(
                savedProductId,
              );

            const linkedUrls =
              new Set(
                linkedImages.map(
                  (image) =>
                    image.imageUrl,
                ),
              );

            const orphanPaths =
              uploadedImages
                .filter(
                  (image) =>
                    !linkedUrls.has(
                      image.publicUrl,
                    ),
                )
                .map(
                  (image) =>
                    image.path,
                );

            if (
              orphanPaths.length >
              0
            ) {
              await deleteProductImagesByPaths(
                orphanPaths,
              );
            }
          }
        } catch (
          cleanupError
        ) {
          console.error(
            "清理未完成的商品圖片失敗：",
            cleanupError,
          );
        }
      }

      const message =
        getErrorMessage(
          error,
          "商品儲存失敗。",
        );

      setPageError(message);

      alert(message);

      try {
        await reloadProducts();
      } catch (
        reloadError
      ) {
        console.error(
          "重新讀取商品失敗：",
          reloadError,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    product: Product,
  ) {
    if (
      updatingStatusId !==
      null
    ) {
      return;
    }

    const nextStatus:
      ProductStatus =
        product.status ===
        "上架"
          ? "下架"
          : "上架";

    try {
      setUpdatingStatusId(
        product.id,
      );

      setPageError("");

      const updatedProduct =
        await updateProductStatus(
          product.id,
          nextStatus,
        );

      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? updatedProduct
                : item,
          ),
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "更新商品狀態失敗。",
        );

      setPageError(message);

      alert(message);
    } finally {
      setUpdatingStatusId(
        null,
      );
    }
  }

  async function handleSetCover(
    image: ProductImage,
  ) {
    if (
      editingId === null ||
      imageActionId !== null ||
      image.isCover
    ) {
      return;
    }

    try {
      setImageActionId(
        image.id,
      );

      setPageError("");

      await setProductImageCover(
        editingId,
        image.id,
      );

      await reloadProducts();
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "設定封面圖片失敗。",
        );

      setPageError(message);

      alert(message);
    } finally {
      setImageActionId(
        null,
      );
    }
  }

  async function handleMoveExistingImage(
    index: number,
    direction:
      | "left"
      | "right",
  ) {
    if (
      editingId === null ||
      imageActionId !== null
    ) {
      return;
    }

    const targetIndex =
      direction === "left"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        existingImages.length
    ) {
      return;
    }

    const nextImages = [
      ...existingImages,
    ];

    const currentImage =
      nextImages[index];

    nextImages[index] =
      nextImages[
        targetIndex
      ];

    nextImages[
      targetIndex
    ] = currentImage;

    try {
      setImageActionId(
        currentImage.id,
      );

      setPageError("");

      await updateProductImageOrder(
        editingId,
        nextImages.map(
          (image) =>
            image.id,
        ),
      );

      await reloadProducts();
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "調整圖片順序失敗。",
        );

      setPageError(message);

      alert(message);
    } finally {
      setImageActionId(
        null,
      );
    }
  }

  async function handleDeleteExistingImage(
    image: ProductImage,
  ) {
    if (
      editingId === null ||
      imageActionId !== null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        image.isCover
          ? "確定刪除這張封面圖片嗎？刪除後系統會自動指定下一張圖片為封面。"
          : "確定刪除這張商品圖片嗎？",
      );

    if (!confirmed) {
      return;
    }

    try {
      setImageActionId(
        image.id,
      );

      setPageError("");

      await deleteProductImageRecord(
        editingId,
        image.id,
      );

      await safelyDeleteProductImage(
        image.imageUrl,
      );

      await reloadProducts();
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "刪除商品圖片失敗。",
        );

      setPageError(message);

      alert(message);
    } finally {
      setImageActionId(
        null,
      );
    }
  }

  async function deleteProduct(
    product: Product,
  ) {
    if (
      deletingId !== null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `確定要刪除「${product.name}」嗎？\n\n商品資料與商品圖片都會一起刪除。`,
      );

    if (!confirmed) {
      return;
    }

    const imageUrls =
      product.images &&
      product.images.length >
        0
        ? product.images.map(
            (image) =>
              image.imageUrl,
          )
        : product.imageUrl
          ? [
              product.imageUrl,
            ]
          : [];

    try {
      setDeletingId(
        product.id,
      );

      setPageError("");

      await deleteSupabaseProduct(
        product.id,
      );

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              product.id,
          ),
      );

      await safelyDeleteProductImages(
        imageUrls,
      );

      if (
        editingId ===
        product.id
      ) {
        resetForm();
      }

      alert(
        "商品已刪除。",
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "刪除商品失敗。",
        );

      setPageError(message);

      alert(message);
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  async function logout() {
    const supabase =
      getSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace(
      "/login",
    );
  }

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050910] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black">
            鈦鼎資訊
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            正在確認管理員權限...
          </p>
        </div>
      </main>
    );
  }

  if (configurationError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050910] px-5 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-8 text-center">
          <h1 className="text-2xl font-black">
            尚未完成 Supabase
            設定
          </h1>

          <p className="mt-4 leading-7 text-yellow-100">
            請確認
            NEXT_PUBLIC_SUPABASE_URL
            與
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            已正確設定。
          </p>

          <Link
            href="/"
            className="secondary-button mt-6"
          >
            返回網站
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050910] p-4 text-white md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0b111d] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">
              鈦鼎資訊後台管理
            </h1>

            <p className="mt-2 text-slate-400">
              商品資料與圖片皆由
              Supabase 管理
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="secondary-button gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回網站
            </Link>

            <button
              type="button"
              onClick={logout}
              className="secondary-button gap-2"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        </header>

        {pageError && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {pageError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="商品總數"
            value={
              statistics.total
            }
            color="text-blue-400"
          />

          <StatCard
            title="上架商品"
            value={
              statistics.online
            }
            color="text-green-400"
          />

          <StatCard
            title="下架商品"
            value={
              statistics.offline
            }
            color="text-orange-400"
          />

          <StatCard
            title="庫存總數"
            value={
              statistics.stock
            }
            color="text-purple-400"
          />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b111d]">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-xl font-black">
                商品列表
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                商品資料儲存在
                Supabase Database
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-400">
                  <tr>
                    <th className="px-4 py-4">
                      圖片
                    </th>

                    <th className="px-4 py-4">
                      商品名稱
                    </th>

                    <th className="px-4 py-4">
                      分類
                    </th>

                    <th className="px-4 py-4">
                      價格
                    </th>

                    <th className="px-4 py-4">
                      庫存
                    </th>

                    <th className="px-4 py-4">
                      狀態
                    </th>

                    <th className="px-4 py-4">
                      操作
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (product) => {
                      const imageCount =
                        product
                          .images
                          ?.length ??
                        (product.imageUrl
                          ? 1
                          : 0);

                      return (
                        <tr
                          key={
                            product.id
                          }
                          className="border-t border-white/10"
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                {product.imageUrl ? (
                                  <img
                                    src={
                                      product.imageUrl
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] text-slate-500">
                                    無圖片
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] text-slate-500">
                                {
                                  imageCount
                                }{" "}
                                張
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-bold">
                              {
                                product.name
                              }
                            </div>

                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {product.description.join(
                                " / ",
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {
                              product.category
                            }
                          </td>

                          <td className="px-4 py-4 font-bold">
                            NT$
                            {formatPrice(
                              product.price,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {
                              product.stock
                            }
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              disabled={
                                updatingStatusId ===
                                product.id
                              }
                              onClick={() =>
                                toggleStatus(
                                  product,
                                )
                              }
                              className={
                                product.status ===
                                "上架"
                                  ? "rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400 transition hover:bg-green-500/25 disabled:opacity-50"
                                  : "rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-400 transition hover:bg-orange-500/25 disabled:opacity-50"
                              }
                            >
                              {updatingStatusId ===
                              product.id
                                ? "更新中..."
                                : product.status}
                            </button>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(
                                    product,
                                  )
                                }
                                className="rounded-lg bg-blue-500/10 p-2 text-blue-400 transition hover:bg-blue-500/20"
                                title="編輯商品"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  product.id
                                }
                                onClick={() =>
                                  deleteProduct(
                                    product,
                                  )
                                }
                                className="rounded-lg bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                title="刪除商品"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}

                  {products.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-slate-500"
                      >
                        目前尚無商品資料
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-[#0b111d] p-6">
            <div className="mb-6 flex items-center gap-3">
              {editingId ===
              null ? (
                <Plus className="text-blue-400" />
              ) : (
                <Pencil className="text-blue-400" />
              )}

              <div>
                <h2 className="text-xl font-black">
                  {editingId ===
                  null
                    ? "新增商品"
                    : "編輯商品"}
                </h2>

                {editingId !==
                  null && (
                  <p className="mt-1 text-xs text-slate-500">
                    可修改商品資料、圖片順序、封面與新增多張圖片
                  </p>
                )}
              </div>
            </div>

            <form
              onSubmit={
                saveProduct
              }
              className="space-y-5"
            >
              <FormField label="商品名稱">
                <input
                  value={
                    form.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      name:
                        event
                          .target
                          .value,
                    })
                  }
                  className="admin-input"
                  placeholder="請輸入商品名稱"
                />
              </FormField>

              <FormField label="商品分類">
                <input
                  value={
                    form.category
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      category:
                        event
                          .target
                          .value,
                    })
                  }
                  list="product-category-options"
                  className="admin-input"
                  placeholder="請輸入或選擇分類"
                />

                <datalist id="product-category-options">
                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      />
                    ),
                  )}
                </datalist>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="價格">
                  <input
                    type="number"
                    min="0"
                    value={
                      form.price
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,

                        price:
                          event
                            .target
                            .value,
                      })
                    }
                    className="admin-input"
                  />
                </FormField>

                <FormField label="庫存">
                  <input
                    type="number"
                    min="0"
                    value={
                      form.stock
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,

                        stock:
                          event
                            .target
                            .value,
                      })
                    }
                    className="admin-input"
                  />
                </FormField>
              </div>

              <FormField label="商品狀態">
                <select
                  value={
                    form.status
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      status:
                        event
                          .target
                          .value as ProductStatus,
                    })
                  }
                  className="admin-input"
                >
                  <option value="上架">
                    上架
                  </option>

                  <option value="下架">
                    下架
                  </option>
                </select>
              </FormField>

              {editingId !==
                null &&
                existingImages.length >
                  0 && (
                  <FormField label="目前商品圖片">
                    <div className="grid grid-cols-2 gap-3">
                      {existingImages.map(
                        (
                          image,
                          index,
                        ) => (
                          <div
                            key={
                              image.id
                            }
                            className={`overflow-hidden rounded-2xl border bg-black/30 ${
                              image.isCover
                                ? "border-yellow-400/60"
                                : "border-white/10"
                            }`}
                          >
                            <div className="relative aspect-square overflow-hidden bg-black">
                              <img
                                src={
                                  image.imageUrl
                                }
                                alt={`商品圖片 ${
                                  index +
                                  1
                                }`}
                                className="h-full w-full object-contain"
                              />

                              {image.isCover && (
                                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black text-black">
                                  <Star className="h-3 w-3 fill-current" />
                                  封面
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-4 border-t border-white/10">
                              <button
                                type="button"
                                disabled={
                                  index ===
                                    0 ||
                                  imageActionId !==
                                    null
                                }
                                onClick={() =>
                                  handleMoveExistingImage(
                                    index,
                                    "left",
                                  )
                                }
                                className="flex items-center justify-center border-r border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                title="往前移"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  index ===
                                    existingImages.length -
                                      1 ||
                                  imageActionId !==
                                    null
                                }
                                onClick={() =>
                                  handleMoveExistingImage(
                                    index,
                                    "right",
                                  )
                                }
                                className="flex items-center justify-center border-r border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                title="往後移"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  image.isCover ||
                                  imageActionId !==
                                    null
                                }
                                onClick={() =>
                                  handleSetCover(
                                    image,
                                  )
                                }
                                className="flex items-center justify-center border-r border-white/10 p-2 text-yellow-400 transition hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                                title="設為封面"
                              >
                                <Star className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  imageActionId !==
                                  null
                                }
                                onClick={() =>
                                  handleDeleteExistingImage(
                                    image,
                                  )
                                }
                                className="flex items-center justify-center p-2 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                                title="刪除圖片"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      左右箭頭可調整順序，星號可指定封面。
                    </p>
                  </FormField>
                )}

              <FormField label="新增商品圖片">
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center text-sm transition ${
                    compressing
                      ? "cursor-wait border-blue-500/40 bg-blue-500/10 text-blue-300"
                      : "border-white/20 bg-white/[0.03] text-slate-300 hover:border-blue-500/40 hover:bg-white/[0.06]"
                  }`}
                >
                  <ImagePlus className="h-7 w-7" />

                  <span className="font-semibold">
                    {compressing
                      ? "圖片壓縮處理中..."
                      : "選擇一張或多張圖片"}
                  </span>

                  <span className="text-xs leading-5 text-slate-500">
                    支援 JPG、PNG、WebP
                    <br />
                    每張自動轉為
                    WebP，最大 1600 ×
                    1600
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={
                      handleImagesChange
                    }
                    disabled={
                      compressing ||
                      saving
                    }
                    className="hidden"
                  />
                </label>
              </FormField>

              {imageInfo && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm leading-6 text-green-300">
                  {imageInfo}
                </div>
              )}

              {imageError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300">
                  {imageError}
                </div>
              )}

              {pendingImages.length >
                0 && (
                <FormField label={`待上傳圖片（${pendingImages.length} 張）`}>
                  <div className="grid grid-cols-2 gap-3">
                    {pendingImages.map(
                      (
                        image,
                        index,
                      ) => (
                        <div
                          key={
                            image.id
                          }
                          className={`overflow-hidden rounded-2xl border bg-black/30 ${
                            pendingCoverId ===
                            image.id
                              ? "border-yellow-400/60"
                              : "border-blue-500/20"
                          }`}
                        >
                          <div className="relative aspect-square overflow-hidden bg-black">
                            <img
                              src={
                                image.previewUrl
                              }
                              alt={`待上傳圖片 ${
                                index +
                                1
                              }`}
                              className="h-full w-full object-contain"
                            />

                            {pendingCoverId ===
                              image.id && (
                              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black text-black">
                                <Star className="h-3 w-3 fill-current" />
                                儲存後設為封面
                              </div>
                            )}

                            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                              {formatFileSize(
                                image.compressedSize,
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 border-t border-white/10">
                            <button
                              type="button"
                              disabled={
                                index ===
                                0
                              }
                              onClick={() =>
                                movePendingImage(
                                  index,
                                  "left",
                                )
                              }
                              className="flex items-center justify-center border-r border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              title="往前移"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={
                                index ===
                                pendingImages.length -
                                  1
                              }
                              onClick={() =>
                                movePendingImage(
                                  index,
                                  "right",
                                )
                              }
                              className="flex items-center justify-center border-r border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              title="往後移"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setPendingCoverId(
                                  image.id,
                                )
                              }
                              className={`flex items-center justify-center border-r border-white/10 p-2 transition ${
                                pendingCoverId ===
                                image.id
                                  ? "bg-yellow-500/10 text-yellow-300"
                                  : "text-yellow-400 hover:bg-yellow-500/10"
                              }`}
                              title="儲存後設為封面"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  pendingCoverId ===
                                  image.id
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removePendingImage(
                                  image.id,
                                )
                              }
                              className="flex items-center justify-center p-2 text-red-400 transition hover:bg-red-500/10"
                              title="移除圖片"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    圖片尚未上傳到
                    Supabase，按下儲存商品後才會正式上傳。
                  </p>
                </FormField>
              )}

              <FormField label="商品說明">
                <textarea
                  rows={7}
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      description:
                        event
                          .target
                          .value,
                    })
                  }
                  className="admin-input resize-none"
                  placeholder={`每行輸入一項商品特色

例如：
Intel Core i5
16GB RAM
512GB SSD
一年保固`}
                />
              </FormField>

              <button
                type="submit"
                disabled={
                  compressing ||
                  saving ||
                  imageActionId !==
                    null
                }
                className="primary-button w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ===
                null ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? pendingImages.length >
                    0
                    ? "商品與圖片儲存中..."
                    : "商品儲存中..."
                  : editingId ===
                      null
                    ? "新增商品"
                    : "儲存修改"}
              </button>

              {editingId !==
                null && (
                <button
                  type="button"
                  onClick={
                    cancelEdit
                  }
                  disabled={
                    saving ||
                    compressing
                  }
                  className="secondary-button w-full gap-2 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  取消編輯
                </button>
              )}
            </form>

            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-xs leading-6 text-green-200">
              商品資料儲存在
              Supabase Database。
              圖片會先在瀏覽器壓縮為
              WebP，再上傳至
              Supabase Storage。
              商品支援多張圖片、圖片排序與封面指定。
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          border-radius: 0.75rem;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
          padding: 0.8rem
            0.9rem;
          color: white;
          outline: none;
          transition: 0.2s ease;
        }

        .admin-input:focus {
          border-color: #3b82f6;
          box-shadow:
            0 0 0 3px
            rgba(
              59,
              130,
              246,
              0.12
            );
        }

        .admin-input option {
          background: #0b111d;
        }

        .admin-input::placeholder {
          color: #64748b;
        }
      `}</style>
    </main>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b111d] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 text-4xl font-black ${color}`}
          >
            {value}
          </p>
        </div>

        <Boxes className="h-8 w-8 text-slate-600" />
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-slate-400">
        {label}
      </span>

      {children}
    </div>
  );
}