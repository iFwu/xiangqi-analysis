interface Env {
  STEP_API_KEY: string;
}

interface ImageData {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

interface TextData {
  type: 'text';
  text: string;
}

interface Message {
  role: string;
  content: string | (TextData | ImageData)[];
}

interface RequestBody {
  model: string;
  messages: Message[];
}

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 15 * 1024; // 15KB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/webp'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function handleOptions(request: Request) {
  return new Response(null, {
    headers: corsHeaders,
  });
}

async function validateImage(file: File | Blob): Promise<boolean> {
  if (!('type' in file) || !ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported image type: ${file.type}. Only JPEG and WebP are allowed.`
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `Image size ${file.size} bytes exceeds maximum allowed size of ${MAX_IMAGE_SIZE} bytes`
    );
  }

  return true;
}

async function fileToBase64(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer as ArrayBuffer);
  const binary = uint8Array.reduce(
    (acc, byte) => acc + String.fromCharCode(byte),
    ''
  );
  return `data:${file.type};base64,${btoa(binary)}`;
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await request.formData();
    const images: (File | Blob)[] = [];

    // Collect all image files
    for (const [, value] of formData.entries()) {
      // @ts-expect-error cloudflare worker wrong typed for FormData
      if ((value instanceof File || value instanceof Blob) && value.size > 0) {
        images.push(value);
      }
    }

    // Validate image count
    if (images.length === 0) {
      return new Response(
        JSON.stringify({
          error: { message: 'No images provided' },
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    if (images.length > MAX_IMAGES) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Maximum ${MAX_IMAGES} images allowed per request`,
          },
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate each image and convert to base64
    const base64Images: string[] = [];
    for (const image of images) {
      try {
        await validateImage(image);
        const base64 = await fileToBase64(image);
        base64Images.push(base64);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: {
              message: error instanceof Error ? error.message : 'Invalid image',
              details: error,
            },
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Construct StepFun API request body
    const body: RequestBody = {
      model: 'step-1v-8k',
      messages: [
        {
          role: 'system',
          content: '',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '这些图片中的象棋棋子有哪些？请按顺序列出棋子的名称，使用逗号分隔的格式输出，例如：名称1, 名称2, 名称3。请使用繁体字输出棋子的原始名称，不要添加任何多余的解释或文字。',
            },
            ...base64Images.map((base64) => ({
              type: 'image_url' as const,
              image_url: {
                url: base64,
              },
            })),
          ],
        },
      ],
    };

    // Forward request to StepFun API
    const response = await fetch(
      'https://api.stepfun.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.STEP_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`StepFun API error: ${JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            error instanceof Error ? error.message : 'Internal Server Error',
          details: error,
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};
