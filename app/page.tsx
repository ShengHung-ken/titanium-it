"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  Cpu,
  ExternalLink,
  HardDrive,
  Laptop,
  Mail,
  Menu,
  MessageCircle,
  Monitor,
  ShieldCheck,
  ShoppingCart,
  Wrench,
  X,
} from "lucide-react";

import type {
  Product,
} from "@/lib/products";

import {
  fetchPublicProducts,
} from "@/lib/supabase-products";

import {
  DEFAULT_SITE_SERVICES,
  DEFAULT_SITE_SETTINGS,
  fetchPublicSiteContent,
  type SiteService,
  type SiteSettings,
} from "@/lib/site-content";

const serviceIconMap = {
  laptop: Laptop,
  cpu: Cpu,
  "hard-drive": HardDrive,
  "shopping-cart":
    ShoppingCart,
  "shield-check":
    ShieldCheck,
  wrench: Wrench,
  monitor: Monitor,
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

export default function HomePage() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true);

  const [
    productsError,
    setProductsError,
  ] = useState("");

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    siteSettings,
    setSiteSettings,
  ] = useState<SiteSettings>(
    () => ({
      ...DEFAULT_SITE_SETTINGS,
    }),
  );

  const [
    siteServices,
    setSiteServices,
  ] = useState<SiteService[]>(
    () =>
      DEFAULT_SITE_SERVICES.map(
        (service) => ({
          ...service,
        }),
      ),
  );

  const navigationItems =
    useMemo(
      () => [
        {
          label:
            siteSettings.nav_home,
          href: "#home",
        },
        {
          label:
            siteSettings.nav_products,
          href: "#products",
        },
        {
          label:
            siteSettings.nav_services,
          href: "#services",
        },
        {
          label:
            siteSettings.nav_about,
          href: "#about",
        },
        {
          label:
            siteSettings.nav_contact,
          href: "#contact",
        },
      ],
      [siteSettings],
    );

  const aboutFeatures =
    useMemo(
      () => [
        siteSettings.about_feature_1,
        siteSettings.about_feature_2,
        siteSettings.about_feature_3,
        siteSettings.about_feature_4,
      ],
      [siteSettings],
    );

  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(
          true,
        );

        setProductsError("");

        const currentProducts =
          await fetchPublicProducts();

        setProducts(
          currentProducts,
        );
      } catch (error) {
        console.error(
          "讀取商品失敗：",
          error,
        );

        setProductsError(
          getErrorMessage(
            error,
            "目前無法讀取商品資料。",
          ),
        );
      } finally {
        setProductsLoading(
          false,
        );
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadSiteContent() {
      try {
        const content =
          await fetchPublicSiteContent();

        setSiteSettings(
          content.settings,
        );

        setSiteServices(
          content.services,
        );
      } catch (error) {
        /*
         * CMS 讀取失敗時，
         * 保留 DEFAULT_SITE_SETTINGS
         * 與 DEFAULT_SITE_SERVICES，
         * 避免首頁內容消失。
         */
        console.error(
          "讀取網站 CMS 內容失敗：",
          error,
        );
      }
    }

    loadSiteContent();
  }, []);

  useEffect(() => {
    function handleResize() {
      if (
        window.innerWidth >=
        1024
      ) {
        setMobileMenuOpen(
          false,
        );
      }
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050910]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            onClick={
              closeMobileMenu
            }
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/30">
              <Image
                src={
                  siteSettings.brand_logo_shield
                }
                alt={
                  siteSettings.brand_name
                }
                width={56}
                height={56}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="whitespace-nowrap text-lg font-black tracking-[0.12em] sm:text-xl sm:tracking-[0.15em]">
                {
                  siteSettings.brand_name
                }
              </div>

              <div className="whitespace-nowrap text-[10px] tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
                {
                  siteSettings.brand_name_en
                }
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
            {navigationItems.map(
              (item) => (
                <a
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className="transition hover:text-white"
                >
                  {
                    item.label
                  }
                </a>
              ),
            )}
          </nav>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current,
              )
            }
            aria-label={
              mobileMenuOpen
                ? "關閉選單"
                : "開啟選單"
            }
            aria-expanded={
              mobileMenuOpen
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-blue-400/40 hover:bg-blue-500/10 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#050910]/98 px-5 pb-5 pt-3 backdrop-blur-xl lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-2">
              {navigationItems.map(
                (item) => (
                  <a
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onClick={
                      closeMobileMenu
                    }
                    className="rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-white"
                  >
                    {
                      item.label
                    }
                  </a>
                ),
              )}
            </nav>
          </div>
        )}
      </header>

      <section
        id="home"
        className="tech-background scroll-mt-24 border-b border-white/10"
      >
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              {
                siteSettings.hero_badge
              }
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {
                siteSettings.hero_title_before
              }

              <span className="text-blue-400">
                {" "}
                {
                  siteSettings.hero_title_accent
                }{" "}
              </span>

              {
                siteSettings.hero_title_after
              }
            </h1>

            <p className="mt-5 text-xl tracking-wider text-slate-300">
              {
                siteSettings.hero_subtitle
              }
            </p>

            <p className="mt-6 max-w-xl leading-8 text-slate-400">
              {
                siteSettings.hero_description
              }
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#products"
                className="primary-button"
              >
                {
                  siteSettings.hero_products_button
                }
              </a>

              <a
                href="#contact"
                className="secondary-button"
              >
                {
                  siteSettings.hero_contact_button
                }
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="glass-panel relative overflow-hidden rounded-[2rem] p-6 shadow-2xl sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex min-h-48 flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-transparent p-6">
                  <Monitor className="h-14 w-14 text-blue-300" />

                  <div>
                    <div className="text-2xl font-black">
                      {
                        siteSettings.hero_card_1_title
                      }
                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                      {
                        siteSettings.hero_card_1_description
                      }
                    </div>
                  </div>
                </div>

                <div className="flex min-h-48 flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-transparent p-6">
                  <Laptop className="h-14 w-14 text-purple-300" />

                  <div>
                    <div className="text-2xl font-black">
                      {
                        siteSettings.hero_card_2_title
                      }
                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                      {
                        siteSettings.hero_card_2_description
                      }
                    </div>
                  </div>
                </div>

                <div className="col-span-full flex min-h-[280px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-4">
                  <Image
                    src={
                      siteSettings.brand_logo_main
                    }
                    alt={`${siteSettings.brand_name} ${siteSettings.brand_name_en}`}
                    width={800}
                    height={450}
                    className="h-auto max-h-[300px] w-full object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20"
      >
        <div className="mb-10">
          <p className="text-sm font-bold tracking-widest text-blue-400">
            {
              siteSettings.services_eyebrow
            }
          </p>

          <h2 className="mt-2 text-4xl font-black">
            {
              siteSettings.services_title
            }
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {siteServices.map(
            (service) => {
              const Icon =
                serviceIconMap[
                  service.iconKey as keyof typeof serviceIconMap
                ] ??
                Wrench;

              return (
                <article
                  key={
                    service.id
                  }
                  className="glass-panel rounded-3xl p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-400/40"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-bold">
                    {
                      service.title
                    }
                  </h3>

                  <p className="mt-3 leading-7 text-slate-400">
                    {
                      service.description
                    }
                  </p>
                </article>
              );
            },
          )}
        </div>
      </section>

      <section
        id="products"
        className="scroll-mt-24 bg-slate-100 py-20 text-slate-950"
      >
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10">
            <p className="text-sm font-bold tracking-widest text-blue-600">
              {
                siteSettings.products_eyebrow
              }
            </p>

            <h2 className="mt-2 text-4xl font-black">
              {
                siteSettings.products_title
              }
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              {
                siteSettings.products_description
              }
            </p>
          </div>

          {productsLoading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <div className="text-lg font-bold text-slate-700">
                {
                  siteSettings.products_loading_title
                }
              </div>

              <p className="mt-2 text-sm text-slate-400">
                {
                  siteSettings.products_loading_description
                }
              </p>
            </div>
          )}

          {!productsLoading &&
            productsError && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
                <div className="font-bold text-red-700">
                  {
                    siteSettings.products_error_title
                  }
                </div>

                <p className="mt-2 text-sm text-red-500">
                  {
                    productsError
                  }
                </p>
              </div>
            )}

          {!productsLoading &&
            !productsError &&
            products.length ===
              0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                {
                  siteSettings.products_empty
                }
              </div>
            )}

          {!productsLoading &&
            !productsError &&
            products.length >
              0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {products.map(
                  (product) => (
                    <article
                      key={
                        product.id
                      }
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-700">
                        {product.imageUrl ? (
                          <img
                            src={
                              product.imageUrl
                            }
                            alt={
                              product.name
                            }
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Cpu className="h-20 w-20 text-blue-300" />
                        )}
                      </div>

                      <div className="p-5">
                        <div className="mb-2 text-xs font-bold text-blue-600">
                          {
                            product.category
                          }
                        </div>

                        <h3 className="min-h-14 text-lg font-black">
                          {
                            product.name
                          }
                        </h3>

                        <ul className="mt-3 min-h-20 space-y-1 text-sm text-slate-500">
                          {product.description.map(
                            (
                              item,
                              index,
                            ) => (
                              <li
                                key={`${product.id}-${index}`}
                              >
                                •{" "}
                                {
                                  item
                                }
                              </li>
                            ),
                          )}
                        </ul>

                        <div className="mt-4 text-sm text-slate-400">
                          {
                            siteSettings.products_stock_label
                          }
                          ：
                          {
                            product.stock
                          }
                        </div>

                        <div className="mt-2 text-2xl font-black text-red-600">
                          NT$
                          {formatPrice(
                            product.price,
                          )}
                        </div>

                        <a
                          href="#contact"
                          className="mt-4 block w-full rounded-xl bg-slate-950 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-600"
                        >
                          {
                            siteSettings.products_inquiry_button
                          }
                        </a>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
        </div>
      </section>

      <section
        id="about"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20"
      >
        <div className="glass-panel grid gap-10 rounded-[2rem] p-7 md:p-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-400">
              {
                siteSettings.about_eyebrow
              }
            </p>

            <h2 className="mt-3 text-4xl font-black">
              {
                siteSettings.about_title
              }
            </h2>

            <p className="mt-6 leading-8 text-slate-400">
              {
                siteSettings.about_description_1
              }
            </p>

            <p className="mt-4 leading-8 text-slate-400">
              {
                siteSettings.about_description_2
              }
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {aboutFeatures.map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <ShieldCheck className="h-6 w-6 text-green-400" />

                  <span className="font-bold">
                    {item}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 border-t border-white/10 py-20"
      >
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-center text-4xl font-black">
            {
              siteSettings.contact_title
            }
          </h2>

          <p className="mt-3 text-center text-slate-400">
            {
              siteSettings.contact_description
            }
          </p>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            <div className="glass-panel rounded-3xl p-6 text-center">
              <MessageCircle className="mx-auto h-9 w-9 text-green-400" />

              <h3 className="mt-4 text-xl font-black">
                {
                  siteSettings.contact_line_title
                }
              </h3>

              <div className="mx-auto mt-5 max-w-[220px] overflow-hidden rounded-2xl bg-white p-3">
                <img
                  src={
                    siteSettings.line_qr_code_url
                  }
                  alt={`${siteSettings.brand_name} LINE 官方帳號 QR Code`}
                  className="h-auto w-full"
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {
                  siteSettings.contact_line_description
                }
              </p>

              <a
                href={
                  siteSettings.line_add_friend_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#06c755] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#05b94f]"
              >
                <MessageCircle className="mr-2 h-5 w-5" />

                {
                  siteSettings.contact_line_button
                }
              </a>

              <a
                href={
                  siteSettings.facebook_page_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#166fe5]"
              >
                <ExternalLink className="mr-2 h-5 w-5" />

                {
                  siteSettings.contact_facebook_button
                }
              </a>
            </div>

            <a
              href={`mailto:${siteSettings.contact_email}`}
              className="glass-panel rounded-3xl p-6 text-center transition hover:border-blue-400/40"
            >
              <Mail className="mx-auto h-9 w-9 text-blue-400" />

              <h3 className="mt-4 text-xl font-black">
                {
                  siteSettings.contact_email_title
                }
              </h3>

              <p className="mt-2 break-all text-slate-400">
                {
                  siteSettings.contact_email
                }
              </p>

              <div className="mt-6 inline-flex rounded-xl bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300">
                {
                  siteSettings.contact_email_button
                }
              </div>
            </a>

            <div className="glass-panel rounded-3xl p-6 text-center">
              <Wrench className="mx-auto h-9 w-9 text-purple-400" />

              <h3 className="mt-4 text-xl font-black">
                {
                  siteSettings.contact_service_title
                }
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                {
                  siteSettings.contact_service_description
                }
              </p>

              <a
                href={
                  siteSettings.line_add_friend_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-bold text-green-300 transition hover:bg-green-500/20"
              >
                <MessageCircle className="mr-2 h-5 w-5" />

                {
                  siteSettings.contact_service_button
                }
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        ©{" "}
        {new Date().getFullYear()}{" "}
        {
          siteSettings.footer_brand
        }
      </footer>
    </main>
  );
}