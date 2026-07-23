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

// Global rotation index
let currentKeyIndex = 0;

// Track key cooldowns (60s minimum on 429)
const keyCooldowns = new Map<string, number>();

export function getRotatedGeminiClient(): GoogleGenAI | null {
  const keys = getAllGeminiKeys();
  if (keys.length === 0) {
    return null;
  }
  
  // Default client instance
  const client = new GoogleGenAI({
    apiKey: keys[0],
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Controlled proxy for generateContent with strict rate-limit protection
  client.models.generateContent = async function (params: any, ...args: any[]) {
    const startTime = new Date().toISOString();
    const rawKeys = getAllGeminiKeys();
    if (rawKeys.length === 0) {
      throw new Error("No Gemini API keys are configured.");
    }

    // Strict model priority
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-flash-lite'];
    
    let attempt = 0;
    const MAX_ATTEMPTS = 3;
    let lastError: any = null;

    for (const model of modelsToTry) {
      if (attempt >= MAX_ATTEMPTS) break;

      // Pick next available key not in cooldown
      let activeKey: string | null = null;
      let keyIdx = -1;
      const now = Date.now();
      
      for (let i = 0; i < rawKeys.length; i++) {
        const idx = (currentKeyIndex + i) % rawKeys.length;
        const k = rawKeys[idx];
        const cooldownUntil = keyCooldowns.get(k) || 0;
        if (now >= cooldownUntil) {
          activeKey = k;
          keyIdx = idx;
          break;
        }
      }

      // If all keys in cooldown, wait or skip (for simplicity, use last key and proceed if needed)
      if (!activeKey) {
        activeKey = rawKeys[currentKeyIndex];
        keyIdx = currentKeyIndex;
      }
      
      const keyTag = `...${activeKey.slice(-4)}`;
      
      const currentClient = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const activeParams = { ...params, model: model };
      attempt++;

      console.log(`[Gemini Rotator Log] [ReqStart: ${startTime}] Attempt ${attempt}/${MAX_ATTEMPTS} | Model: '${model}' | KeyIdx: ${keyIdx} (${keyTag})`);

      try {
        const result = await (currentClient.models.generateContent as any)(activeParams, ...args);
        
        // Success: Advance key index and clear cooldown
        currentKeyIndex = (keyIdx + 1) % rawKeys.length;
        keyCooldowns.delete(activeKey);
        
        console.log(`[Gemini Rotator Log] [ReqStart: ${startTime}] SUCCESS | Attempt: ${attempt} | Model: '${model}' | Key: ${keyTag} | 429: NO`);
        return result;
      } catch (err: any) {
        lastError = err;
        const errStr = JSON.stringify(err);
        const is429 = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
        
        // Minimum 60-second cooldown on 429
        const cooldownTime = is429 ? 60000 : 180000;
        keyCooldowns.set(activeKey, Date.now() + cooldownTime);

        console.warn(`[Gemini Rotator Log] [ReqStart: ${startTime}] FAILED | Attempt: ${attempt} | Model: '${model}' | Key: ${keyTag} | 429: ${is429 ? 'YES' : 'NO'} | CooldownSet: ${cooldownTime/1000}s | Error: ${err.message || errStr}`);
        
        // If not 429, maybe don't retry? User said 429 logic.
      }
    }

    console.error(`[Gemini Rotator Log] [ReqStart: ${startTime}] FINAL FAILURE | TotalAttempts: ${attempt} | Error: ${lastError?.message || lastError}`);
    throw lastError || new Error(`Gemini API call failed after ${attempt} attempt(s).`);
  } as any;

  return client;
}

