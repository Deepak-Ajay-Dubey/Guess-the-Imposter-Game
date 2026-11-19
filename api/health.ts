export interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

export function getHealthPayload(
  env: Readonly<Record<string, string | undefined>> = process.env
): { ok: true; aiConfigured: boolean; model: string } {
  const apiKey = env.GEMINI_API_KEY?.trim() ?? '';
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  return {
    ok: true,
    aiConfigured: apiKey.length > 0,
    model,
  };
}

export default function handler(req: ApiRequest, res: ApiResponse): void {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  res.status(200).json(getHealthPayload());
}
