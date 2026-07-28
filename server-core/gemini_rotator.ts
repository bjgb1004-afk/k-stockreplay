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

  if (lower.includes('2.5-flash')) {
    return 'gemini-2.5-flash';
  }
  if (lower.includes('2.0-flash-lite') || lower.includes('flash-lite')) {
    return 'gemini-2.0-flash-lite';
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

  // Safely initialize models property if it doesn't exist to prevent crash
  if (!(client as any).models) {
    (client as any).models = {};
  }

  (client as any).models.generateContent = async function (params: any, ...args: any[]) {
    const rawKeys = getAllGeminiKeys();
    if (rawKeys.length === 0) {
      throw new Error("No Gemini API keys are configured.");
    }

    const primaryModel = sanitizeModelName(params?.model);
    const modelsToTry: string[] = [primaryModel];
    if (primaryModel === 'gemini-3.6-flash') {
      modelsToTry.push('gemini-2.5-flash', 'gemini-2.0-flash-lite');
    } else if (primaryModel === 'gemini-2.5-flash') {
      modelsToTry.push('gemini-2.0-flash-lite');
    }

    const MAX_TOTAL_ATTEMPTS = 6; // Reduce from 12 to 6 (2 per key)
    let attemptCount = 0;
    let lastError: any = null;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const modelName of modelsToTry) {
      if (attemptCount >= MAX_TOTAL_ATTEMPTS) break;

      const now = Date.now();

      // Build key order starting from currentKeyIndex
      const keyOrder: string[] = [];
      const rawKeysTotal = rawKeys.length;
      for (let i = 0; i < rawKeysTotal; i++) {
        const idx = (currentKeyIndex + i) % rawKeysTotal;
        keyOrder.push(rawKeys[idx]);
      }

      // Filter keys that are NOT cooling down
      let keysToUse = keyOrder.filter(k => (keyCooldowns.get(k) || 0) <= now);
      
      if (keysToUse.length === 0) {
        // If all keys are cooling down, pick the one that will be available soonest
        const sortedByCooldown = [...keyOrder].sort((a, b) => (keyCooldowns.get(a) || 0) - (keyCooldowns.get(b) || 0));
        const bestKey = sortedByCooldown[0];
        const waitTime = (keyCooldowns.get(bestKey) || 0) - now;
        
        console.log(`[Gemini Rotator] Info: All ${keyOrder.length} keys cooling down. Picking best key (${maskKey(bestKey)}) with ${waitTime}ms left.`);
        
        // If wait time is short (< 5s), wait for it. Otherwise just try it anyway.
        if (waitTime > 0 && waitTime < 5000) {
          await sleep(waitTime);
        }
        keysToUse = [bestKey];
      }

      for (const key of keysToUse) {
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
          const errStr = String(err?.message || err || '').toLowerCase();
          const errJson = JSON.stringify(err || {}).toLowerCase();
          const is429 = errStr.includes('429') || errStr.includes('resource_exhausted') || errStr.includes('quota') || 
                        errJson.includes('429') || errJson.includes('resource_exhausted') || errJson.includes('quota');

          const cooldownMs = is429 ? 120000 : 60000; // 120s for quota, 60s for other errors
          keyCooldowns.set(key, Date.now() + cooldownMs);

          if (is429) {
            console.log(`[Gemini Rotator] Result: COOLDOWN_RETRY | Model: ${modelName} | Key: ${masked} | Cooldown: ${cooldownMs}ms | Attempt: ${attemptCount}/${MAX_TOTAL_ATTEMPTS}`);
            // Small wait before next key try
            await sleep(1000);
          } else {
            console.log(`[Gemini Rotator] Result: TIMEOUT_RETRY | Model: ${modelName} | Key: ${masked} | Cooldown: ${cooldownMs}ms | Attempt: ${attemptCount}/${MAX_TOTAL_ATTEMPTS} | Reason: ${err.message || errStr}`);
          }
        }
      }
    }

    const failureReason = lastError?.message || (lastError ? String(lastError) : 'RESOURCE_EXHAUSTED');
    console.log(`[Gemini Rotator] Result: OFFLINE_RECOVERY | Attempts: ${attemptCount}/${MAX_TOTAL_ATTEMPTS} | Reason: ${failureReason}`);
    throw lastError || new Error(`[Gemini Rotator] All attempts completed (Max ${MAX_TOTAL_ATTEMPTS} reached).`);
  } as any;

  return client;
}

