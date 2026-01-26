

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
  const URL = process.env.NEXT_PUBLIC_BASE_APP_URL;
  return Response.json({
    accountAssociation: {
    "header": "eyJmaWQiOjIwNjIyODIsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhGMjg2NzIxRTg0Yzk1ZkRGYTQ4Q2UyZGY5ZkYwMTkwODcxNjI3QzhFIn0",
    "payload": "eyJkb21haW4iOiJkZXFyeXB0LnZlcmNlbC5hcHAifQ",
    "signature": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEFv0NvrYkCjymu5L-OEbVGuFvtW74eOYW7K7af3Q_1OTmJLzeBpbMqZ1xKwb9dvLG37etrnvHDErki4gNs-HnKvGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    },
    miniapp: {
      version: "1",
      name: "Example Mini App",
      homeUrl: "https://ex.co",
      iconUrl: "https://ex.co/i.png",
      splashImageUrl: "https://ex.co/l.png",
      splashBackgroundColor: "#000000",
      webhookUrl: "https://ex.co/api/webhook",
      subtitle: "Fast, fun, social",
      description: "A fast, fun way to challenge friends in real time.",
      screenshotUrls: [
        "https://ex.co/s1.png",
        "https://ex.co/s2.png",
        "https://ex.co/s3.png",
      ],
      primaryCategory: "social",
      tags: ["example", "miniapp", "baseapp"],
      heroImageUrl: "https://ex.co/og.png",
      tagline: "Play instantly",
      ogTitle: "Example Mini App",
      ogDescription: "Challenge friends in real time.",
      ogImageUrl: "https://ex.co/og.png",
      noindex: true,
    },
  }); 
}
