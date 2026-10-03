export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "8-can-gun-sculpture": "/assets/products/8-can-gun-sculpture-v2.png",
  "14-can-gun-sculpture": "/assets/products/14-can-gun-sculpture-v2.png",
  "12-can-heart-wall-art": "/assets/products/12-can-heart-wall-art-v2.png",
  "27-can-heart-wall-art": "/assets/products/27-can-heart-wall-art-v2.png",
};

export const PRODUCT_ALT_MAP: Record<string, string> = {
  "8-can-gun-sculpture":
    "8-Can Gun Sculpture, handcrafted decorative display piece",
  "14-can-gun-sculpture":
    "14-Can Gun Sculpture, handcrafted decorative display piece",
  "12-can-heart-wall-art":
    "12-Can Heart Wall Art, handcrafted decorative display piece",
  "27-can-heart-wall-art":
    "27-Can Heart Wall Art, handcrafted decorative display piece",
};

export function getProductImageUrl(slug: string): string {
  return PRODUCT_IMAGE_MAP[slug] || `/assets/products/${slug}-v2.png`;
}

export function getProductAltText(slug: string, fallbackTitle?: string): string {
  return (
    PRODUCT_ALT_MAP[slug] ||
    `${fallbackTitle || slug}, handcrafted decorative display piece`
  );
}
