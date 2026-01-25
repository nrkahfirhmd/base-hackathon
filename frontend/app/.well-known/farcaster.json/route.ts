function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) =>
      Array.isArray(value) ? value.length > 0 : !!value,
    ),
  );
}

export async function GET() {
  const URL = "https://deqrypt.vercel.app/";
  return Response.json({
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "DeQRypt",
      homeUrl: "https://deqrypt.vercel.app",
      iconUrl: "https://deqrypt.vercel.app/icon.png",
      splashImageUrl: "https://deqrypt.vercel.app/splash.png",
      splashBackgroundColor: "#000000",
      subtitle: "Pay with Crypto via QR",
      description: "Fast and secure crypto payments using QR codes",
      screenshotUrls: [
        "https://deqrypt.vercel.app/screenshot1.png",
        "https://deqrypt.vercel.app/screenshot2.png",
      ],
      primaryCategory: "finance",
      tags: ["crypto", "payment", "qr", "defi"],
      heroImageUrl: "https://deqrypt.vercel.app/hero.png",
      tagline: "Pay Instantly with Crypto",
      ogTitle: "DeQRypt - Crypto QR Payments",
      ogDescription: "Fast and secure crypto payments using QR codes",
      ogImageUrl: "https://deqrypt.vercel.app/og.png",
      noindex: false,
    },
  }); // see the next step for the manifest_json_object
}
