import { GoogleGenAI } from '@google/genai';

export function getAllGeminiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  
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
  
  // Filter out placeholders
  return keys.filter((k, idx) => 
    k && 
    !k.includes('MY_GEMINI') && 
    !k.includes('your_') &&
    keys.indexOf(k) === idx
  );
}

// Current active index globally
let currentKeyIndex = 0;

// Track key cooldowns to skip rate-limited keys dynamically
const keyCooldowns = new Map<string, number>();

export function getRotatedGeminiClient(): GoogleGenAI | null {
  const keys = getAllGeminiKeys();
  if (keys.length === 0) {
    return null;
  }
  
  // Create a default client just to satisfy the interface, we will override generateContent below.
  const client = new GoogleGenAI({
    apiKey: keys[0],
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Proxy generateContent to automatically handle key rotation and model fallback
  client.models.generateContent = async function (params: any, ...args: any[]) {
    const rawKeys = getAllGeminiKeys();
    if (rawKeys.length === 0) {
      throw new Error("No Gemini API keys are configured.");
    }

    // Normalize model names if non-standard or deprecated
    let originalModel = params?.model || 'gemini-3.6-flash';
    if (typeof originalModel === 'string') {
      if (
        originalModel === 'gemini-2.5-flash' ||
        originalModel === 'gemini-2.0-flash' ||
        originalModel === 'gemini-1.5-flash' ||
        originalModel === 'gemini-2.5-pro' ||
        originalModel === 'gemini-3.5-flash' ||
        originalModel === 'gemini-3.0-flash'
      ) {
        originalModel = 'gemini-3.6-flash';
      }
    }

    // Determine the sequence of models to try
    const fallbackModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
    // Build a unique list of models starting with originalModel
    const modelsToTry: string[] = [originalModel];
    for (const m of fallbackModels) {
      if (!modelsToTry.includes(m)) {
        modelsToTry.push(m);
      }
    }

    let lastError: any = null;

    // We will iterate through models, and for each model, we will try all keys
    for (const modelName of modelsToTry) {
      const now = Date.now();
      
      // Separate keys into available vs cooling down
      const availableKeys: string[] = [];
      const coolingKeys: string[] = [];
      
      // To maintain rotation, start checking keys from currentKeyIndex
      for (let i = 0; i < rawKeys.length; i++) {
        const idx = (currentKeyIndex + i) % rawKeys.length;
        const key = rawKeys[idx];
        const cooldownUntil = keyCooldowns.get(key) || 0;
        if (now >= cooldownUntil) {
          availableKeys.push(key);
        } else {
          coolingKeys.push(key);
        }
      }

      // Try available keys first, then cooling keys if available keys failed
      const keysForThisModel = [...availableKeys, ...coolingKeys];
      
      for (const key of keysForThisModel) {
        const keyIdx = rawKeys.indexOf(key);
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
          console.log(`[Gemini Rotator] Attempting generation with key index ${keyIdx} (ends with ...${key.slice(-4)}) using model '${modelName}'`);
          const result = await (currentClient.models.generateContent as any)(activeParams, ...args);
          
          // Success! Update rotation pointer to this key and clear cooldown
          currentKeyIndex = keyIdx;
          keyCooldowns.delete(key);
          return result;
        } catch (err: any) {
          lastError = err;
          const errStr = JSON.stringify(err);
          const is429 = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
          
          // Short cooldown for 429 (10s), longer for invalid keys (60s)
          const cooldownTime = is429 ? 10000 : 60000;
          keyCooldowns.set(key, Date.now() + cooldownTime);
          
          console.warn(`[Gemini Rotator] Key index ${keyIdx} failed (ends with ...${key.slice(-4)}) on model '${modelName}'. Cooldown: ${cooldownTime / 1000}s. Error: ${err.message || errStr}`);
          
          if (is429) {
            // Brief pause before trying next key to allow rate limit windows to clear slightly
            await new Promise(res => setTimeout(res, 500));
          }
        }
      }
    }

    throw lastError || new Error("All configured Gemini API keys failed across all fallback models.");
  } as any;

  return client;
}
