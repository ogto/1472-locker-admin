import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const IMAGE_PARAM_NAMES = ["image", "imageUrl", "url", "src"];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeImageUrl(value: string | null) {
  const imageUrl = value?.trim();

  if (!imageUrl) {
    return "";
  }

  try {
    const url = new URL(imageUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function findImageUrl(params: URLSearchParams) {
  for (const name of IMAGE_PARAM_NAMES) {
    const imageUrl = normalizeImageUrl(params.get(name));

    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
}

async function getPostedImageUrl(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    for (const name of IMAGE_PARAM_NAMES) {
      const value = body?.[name];

      if (typeof value === "string") {
        const imageUrl = normalizeImageUrl(value);

        if (imageUrl) {
          return imageUrl;
        }
      }
    }

    return "";
  }

  const body = await request.text().catch(() => "");
  return findImageUrl(new URLSearchParams(body));
}

function renderPage(imageUrl: string) {
  const escapedImageUrl = escapeHtml(imageUrl);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex" />
    <title>포토카드 저장</title>
    <style>
      :root {
        color-scheme: light;
        background: #fbfaf7;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        min-height: 100%;
        margin: 0;
      }

      body {
        padding: 16px 12px calc(96px + env(safe-area-inset-bottom));
        background: #fbfaf7;
        color: #241912;
        font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "SUIT",
          "Pretendard", sans-serif;
      }

      main {
        width: min(100%, 760px);
        margin: 0 auto;
      }

      .image-wrap {
        width: 100%;
      }

      img {
        display: block;
        width: 100%;
        height: auto;
      }

      .empty {
        width: 100%;
        min-height: calc(100svh - 128px - env(safe-area-inset-bottom));
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        color: #8b817a;
        text-align: center;
        font-size: 15px;
      }

      .bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
        background: rgba(251, 250, 247, 0.92);
        backdrop-filter: blur(12px);
      }

      button {
        width: min(100%, 760px);
        min-height: 52px;
        display: block;
        margin: 0 auto;
        border: 0;
        border-radius: 8px;
        background: #241912;
        color: #fffaf3;
        font: inherit;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0;
      }

      button:disabled {
        opacity: 0.45;
      }
    </style>
  </head>
  <body>
    <main>
      ${
        escapedImageUrl
          ? `<div class="image-wrap"><img id="photo-card-image" src="${escapedImageUrl}" alt="" /></div>`
          : `<div class="empty">이미지 주소가 없습니다.</div>`
      }
    </main>
    <div class="bar">
      <button id="save-button" type="button" ${escapedImageUrl ? "" : "disabled"}>
        저장하기
      </button>
    </div>
    <script>
      const imageUrl = ${JSON.stringify(imageUrl)};
      const saveButton = document.getElementById("save-button");

      function getFilename(url) {
        try {
          const pathname = new URL(url).pathname;
          const name = pathname.split("/").filter(Boolean).pop() || "photo-card.png";
          return name.includes(".") ? name : name + ".png";
        } catch {
          return "photo-card.png";
        }
      }

      async function saveImage() {
        if (!imageUrl) return;

        saveButton.disabled = true;

        try {
          const response = await fetch(imageUrl, { mode: "cors", credentials: "omit" });

          if (!response.ok) {
            throw new Error("Image download failed");
          }

          const blob = await response.blob();
          const filename = getFilename(imageUrl);

          if (navigator.canShare && navigator.share) {
            const file = new File([blob], filename, { type: blob.type || "image/png" });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file] });
              return;
            }
          }

          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch {
          const link = document.createElement("a");
          link.href = imageUrl;
          link.target = "_blank";
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          link.remove();
        } finally {
          saveButton.disabled = false;
        }
      }

      saveButton?.addEventListener("click", saveImage);
    </script>
  </body>
</html>`;
}

export function GET(request: NextRequest) {
  const imageUrl = findImageUrl(request.nextUrl.searchParams);

  return new Response(renderPage(imageUrl), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  const imageUrl = await getPostedImageUrl(request);

  return new Response(renderPage(imageUrl), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
