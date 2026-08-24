/**
 * Rewrites Supabase Storage public URLs to the on-the-fly image transform
 * endpoint so images are delivered resized and as WebP (browsers send
 * `Accept: image/webp` automatically). Non-storage URLs are returned as-is.
 */
export const optimizedImage = (
  url: string | null | undefined,
  width = 400,
  quality = 65
): string => {
  if (!url) return "/placeholder.svg";
  if (!url.includes("/storage/v1/object/public/")) return url;

  const [base, query] = url.split("?");
  const transformed = base.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  const params = new URLSearchParams(query);
  params.set("width", String(width));
  params.set("quality", String(quality));
  params.set("resize", "cover");
  return `${transformed}?${params.toString()}`;
};
