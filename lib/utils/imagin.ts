const CUSTOMER_KEY = process.env.NEXT_PUBLIC_IMAGIN_CUSTOMER_KEY ?? "nl-kentekenrapport";

interface ImageOptions {
  angle?: "01" | "09" | "28" | string;
  zoomtype?: "relative" | "fullscreen";
  width?: number;
  zoomlevel?: number;
}

/**
 * Generates an IMAGIN.studio CDN image URL for a vehicle.
 * Based on the Mobile App plan constraints provided by the user.
 */
export function getVehicleImageUrl(
  make: string | null | undefined,
  model?: string | null | undefined,
  options: ImageOptions = {}
): string {
  // Fallback image if make is missing
  const fallback = "https://storage.googleapis.com/banani-generated-images/generated-images/e0649eef-2848-49b1-a352-34ec7d23ba0c.jpg";
  
  if (!make) return fallback;

  const {
    angle = "01",
    zoomtype = "relative",
    width = 800,
    zoomlevel = 30
  } = options;

  const url = new URL("https://cdn.imagin.studio/getImage");
  url.searchParams.set("customer", CUSTOMER_KEY);
  url.searchParams.set("make", make.toLowerCase());
  
  if (model) {
    // IMAGIN.studio often uses modelFamily for the primary model name
    url.searchParams.set("modelFamily", model.toLowerCase());
  }
  
  url.searchParams.set("angle", angle);
  url.searchParams.set("zoomtype", zoomtype);
  url.searchParams.set("width", Math.min(width, 800).toString());
  url.searchParams.set("zoomlevel", Math.min(zoomlevel, 30).toString());
  url.searchParams.set("filetype", "jpeg");

  return url.toString();
}
