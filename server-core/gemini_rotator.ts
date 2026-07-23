import { GoogleGenAI } from '@google/genai';

export function getAllGeminiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  
  const backupEnvKeys = [
    'GEMINI_API_KEY_2',
    'GEMINI_API_KEY_3',
    'GEMINI_API_KEY_4',
    'GEMINI_API_KEY_5',
    'GEMINI_API_KEY_6',
    'GEMINI_API_KEY_BACKUP_1',
    'GEMINI_API_KEY_BACKUP_2',
    'GEMINI_API_KEY_BACKUP_3'
  ];
  
  for (const envKey of backupEnvKeys) {
    const val = process.env[envKey];
    if (val && val.trim() !== '') {
      keys.push(val.trim());
    }
  }
  
  // Filter out placeholders and duplicates
  return keys.filter((k, idx) => 
    k && 
    !k.includes('MY_GEMINI') && 
    !k.includes('your_') &&
    keys.indexOf(k) === idx
  );
}

export function maskKey(key: string): string {
  if (!key) return '...NULL';
  const trimmed = key.trim();
  return trimmed.length > 4 ? `...${trimmed.slice(-4)}` : '...****';
}

const FORBIDDEN_MODELS = [
  'gemini-3.1-pro',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-3.0-pro',
  'gemini-pro'
];

function sanitizeModelName(requestedModel: any): string {
  if (typeof requestedModel !== 'string' || !requestedModel) {
    return 'gemini-3.6-flash';
  }
  const lower = requestedModel.toLowerCase();
  
  // Strictly block Pro models and unverified latest alias
  if (lower.includes('pro') || lower.includes('latest') || FORBIDDEN_MODELS.includes(lower)) {
    return 'gemini-3.6-flash';
  }

  if (lower === 'gemini-3.1-flash-lite') {
    return 'gemini-3.1-flash-lite';
  }

  return 'gemini-3.6-flash';
}

// Current active key index globally
let currentKeyIndex = 0;

// Track key cooldowns (key -> timestamp when cooldown ends)
const keyCooldowns = new Map<string, number>();

export function getRotatedGeminiClient(): GoogleGenAI | null {
  const keys = getAllGeminiKeys();
  if (keys.length === 0) {
    return null;
  }

  // Create a base client instance to override generateContent on
  const client = new GoogleGenAI({
    apiKey: keys[0],
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  client.models.generateContent = async function (params: any, ...args: any[]) {
    const rawKeys = getAllGeminiKeys();
    if (rawKeys.length === 0) {
      throw new Error("No Gemini API keys are configured.");
    }

    const primaryModel = sanitizeModelName(params?.model);
    const modelsToTry = [primaryModel];
    if (primaryModel !== 'gemini-3.1-flash-lite') {
      modelsToTry.push('gemini-3.1-flash-lite');
    }

    const MAX_TOTAL_ATTEMPTS = 3;
    let attemptCount = 0;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      if (attemptCount >= MAX_TOTAL_ATTEMPTS) break;

      const now = Date.now();

      // Build key order starting from currentKeyIndex
      const keyOrder: string[] = [];
      for (let i = 0; i < rawKeys.length; i++) {
        const idx = (currentKeyIndex + i) % rawKeys.length;
        keyOrder.push(rawKeys[idx]);
      }

      // Filter keys that are NOT cooling down
      const availableKeys = keyOrder.filter(k => (keyCooldowns.get(k) || 0) <= now);

      if (availableKeys.length === 0) {
        console.warn(`[Gemini Rotator] All ${rawKeys.length} keys are currently in cooldown for model '${modelName}'.`);
        continue;
      }

      for (const key of availableKeys) {
        if (attemptCount >= MAX_TOTAL_ATTEMPTS) break;

        attemptCount++;
        const keyIdx = rawKeys.indexOf(key);
        const masked = maskKey(key);
        const startTimeStr = new Date().toISOString();

        console.log(`[Gemini Rotator] ReqStart: ${startTimeStr} | Attempt: ${attemptCount}/${MAX_TOTAL_ATTEMPTS} | Model: ${modelName} | Key: ${masked}`);

        const currentClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const activeParams = { ...params, model: modelName };

        try {
          const result = await (currentClient.models.generateContent as any)(activeParams, ...args);

          // Success! Update active key index and clear cooldown
          currentKeyIndex = keyIdx;
          keyCooldowns.delete(key);

          console.log(`[Gemini Rotator] Result: SUCCESS | Model: ${modelName} | Key: ${masked} | Attempt: ${attemptCount}/${MAX_TOTAL_ATTEMPTS}`);
          return result;
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err || '');
          const errJson = JSON.stringify(err || {});
          const is429 = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errJson.includes('429') || errJson.includes('RESOURCE_EXHAUSTED');

          const cooldownMs = 60000; // Minimum 60s cooldown for 429 / RESOURCE_EXHAUSTED or other errors
          keyCooldowns.set(key, Date.now() + cooldownMs);

          if (is429) {
            console.warn(`[Gemini Rotator] Result: 429 | Model: ${modelName} | Key: ${masked} | Cooldown: ${cooldownMs}ms | Attempt: ${attemptCount}/${MAX_TOTAL_ATTEMPTS}`);
          } else {
            console.warn(`[Gemini Rotator] Result: ERROR | Model: ${modelName} | Key: ${masked} | Cooldown: ${cooldownMs}ms | Attempt: ${attemptCount}/${MAX_TOTAL_ATTEMPTS} | Reason: ${err.message || errStr}`);
          }
        }
      }
    }

    const failureReason = lastError?.message || (lastError ? String(lastError) : 'RESOURCE_EXHAUSTED');
    console.error(`[Gemini Rotator] Result: FINAL_FAILURE | Attempts: ${attemptCount}/${MAX_TOTAL_ATTEMPTS} | Reason: ${failureReason}`);
    throw lastError || new Error(`[Gemini Rotator] All attempts failed (Max ${MAX_TOTAL_ATTEMPTS} attempts reached).`);
  } as any;

  return client;
}

