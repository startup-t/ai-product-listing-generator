import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

const REMBG_SERVICE_URL = process.env.REMBG_SERVICE_URL?.trim() ?? "";
const REMBG_TIMEOUT_MS = 25000;

type ProcessedImage = {
  buffer: Buffer;
  contentType: string;
};

async function toWhiteBackgroundJpeg(input: Buffer): Promise<ProcessedImage> {
  const buffer = await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return {
    buffer,
    contentType: "image/jpeg",
  };
}

async function processWithRembgService(
  fileBuffer: Buffer,
  fileType: string,
  fileName: string
): Promise<Buffer> {
  if (!REMBG_SERVICE_URL) {
    throw new Error("REMBG_SERVICE_URL is not configured");
  }

  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer], { type: fileType }), fileName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REMBG_TIMEOUT_MS);

  try {
    const response = await fetch(REMBG_SERVICE_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`rembg service failed with ${response.status}`);
    }

    const output = await response.arrayBuffer();
    return Buffer.from(output);
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildImageResponse(image: ProcessedImage): NextResponse<Buffer> {
  return new NextResponse(image.buffer, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<Buffer | { error: string }>> {
  let originalFileBuffer: Buffer;
  let originalFileType = "image/jpeg";
  let originalFileName = "upload-image";

  try {
    const formData = await request.formData();
    const image = formData.get("file");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Missing image file in form data" }, { status: 400 });
    }

    originalFileType = image.type || "image/jpeg";
    originalFileName = image.name || "upload-image";
    originalFileBuffer = Buffer.from(await image.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Invalid form data payload" }, { status: 400 });
  }

  try {
    const rembgBuffer = await processWithRembgService(
      originalFileBuffer,
      originalFileType,
      originalFileName
    );
    const whiteBackgroundImage = await toWhiteBackgroundJpeg(rembgBuffer);
    return buildImageResponse(whiteBackgroundImage);
  } catch (error) {
    console.warn("Background removal failed, returning original image.", error);

    try {
      const fallback = await toWhiteBackgroundJpeg(originalFileBuffer);
      return buildImageResponse(fallback);
    } catch (fallbackError) {
      console.warn("Fallback white-background conversion failed, returning original binary.", fallbackError);
      return new NextResponse(originalFileBuffer, {
        status: 200,
        headers: {
          "Content-Type": originalFileType,
          "Cache-Control": "no-store",
        },
      });
    }
  }
}
