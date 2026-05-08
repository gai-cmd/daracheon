import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { uploadFile, getStorageDriver } from '@/lib/storage';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_MODEL = 'imagen-4.0-generate-001';
const ALLOWED_ASPECTS = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);

interface GenerateBody {
  prompt?: string;
  subdir?: string;
  aspectRatio?: string;
  model?: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'GOOGLE_GENAI_API_KEY (또는 GEMINI_API_KEY) 환경변수가 설정되어 있지 않습니다.' },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as GenerateBody;
    const prompt = (body.prompt ?? '').trim();
    const subdir = body.subdir ?? 'pages';
    const aspectRatio = ALLOWED_ASPECTS.has(body.aspectRatio ?? '') ? body.aspectRatio! : '4:3';
    const model = body.model && body.model.length > 0 ? body.model : DEFAULT_MODEL;

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: '프롬프트가 비어 있습니다.' },
        { status: 400 }
      );
    }
    if (prompt.length > 2000) {
      return NextResponse.json(
        { success: false, message: '프롬프트는 2000자 이하로 입력해 주세요.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
      },
    });

    const generated = response.generatedImages?.[0];
    if (!generated?.image?.imageBytes) {
      const reason = generated?.raiFilteredReason ?? '이미지 생성 결과가 비어 있습니다.';
      return NextResponse.json(
        { success: false, message: `Imagen 응답 오류: ${reason}` },
        { status: 502 }
      );
    }

    const mimeType = generated.image.mimeType ?? 'image/png';
    const buffer = Buffer.from(generated.image.imageBytes, 'base64');
    const filename = `imagen-${Date.now()}.png`;
    const file = new File([buffer], filename, { type: mimeType });

    const result = await uploadFile(file, subdir);

    await logAdmin('upload', 'create', {
      summary: `Imagen 이미지 생성·저장 (${result.driver}): ${result.filename}`,
      meta: { prompt: prompt.slice(0, 200), model, aspectRatio, size: result.size },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
      driver: result.driver,
      model,
      aspectRatio,
    });
  } catch (error) {
    console.error('[Admin GenerateImage] Error:', error);
    const message = error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, message, driver: getStorageDriver() },
      { status: 500 }
    );
  }
}
