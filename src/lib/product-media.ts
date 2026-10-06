export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "8-can-gun-sculpture":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791203495/8-can-gun-sculpture-v2.png",
  "14-can-gun-sculpture":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205370/14-can-gun-sculpture-v2.png",
  "12-can-heart-wall-art":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205381/12-can-heart-wall-art-v2.png",
  "27-can-heart-wall-art":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205435/27-can-heart-wall-art-v2.png",
  "30-can-guitar-wall-art":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/30-can-guitar-wall-art-v1.png",
  "11-can-bow-wall-art":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/11-can-bow-wall-art-v1.png",
  "can-desk-station":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205385/can-desk-station-v1.png",
  "can-candle-diwali-special":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205439/can-candle-diwali-special-v1.png",
  "24-can-spider-wall-art":
    "https://res.cloudinary.com/afpsv7zi/image/upload/v1791205379/24-can-spider-wall-art-v1.png",
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
  "30-can-guitar-wall-art":
    "30-Can Guitar Wall Art, handcrafted guitar-shaped wall sculpture made from 30 empty cans",
  "11-can-bow-wall-art":
    "11-Can Bow Wall Art, handcrafted ribbon-bow wall piece made from 11 empty cans",
  "can-desk-station":
    "Can Desk Station, handcrafted pen and desk organizer made from a single empty can",
  "can-candle-diwali-special":
    "Can Candle - Diwali Special, handcrafted decorative can candles in four colors",
  "24-can-spider-wall-art":
    "24-Can Spider Wall Art, handcrafted eight-legged wall sculpture made from 24 empty cans",
};

export const PRODUCT_POSITION_MAP: Record<string, string> = {
  "30-can-guitar-wall-art": "center 28%",
  "24-can-spider-wall-art": "center 38%",
  "11-can-bow-wall-art": "center 50%",
  "can-desk-station": "center 50%",
  "can-candle-diwali-special": "center 55%",
  "8-can-gun-sculpture": "center",
  "14-can-gun-sculpture": "center",
  "12-can-heart-wall-art": "center",
  "27-can-heart-wall-art": "center",
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

export function getProductObjectPosition(slug: string): string {
  return PRODUCT_POSITION_MAP[slug] || "center";
}
