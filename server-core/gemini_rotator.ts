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
  
  const activeKey = keys[currentKeyIndex % keys.length];
  
  const client = new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Proxy generateContent to automatically handle key rotation and model fallback
  const originalGenerateContent = client.models.generateContent.bind(client.models);
  
  client.models.generateContent = async function (params: any, ...args: any[]) {
    const rawKeysToTry = getAllGeminiKeys();
    if (rawKeysToTry.length === 0) {
      throw new Error("No Gemini API keys are configured.");
    }

    const now = Date.now();
    // Prioritize keys that are not on cooldown
    let keysToTry = rawKeysToTry.filter(key => {
      const cooldownUntil = keyCooldowns.get(key) || 0;
      return now >= cooldownUntil;
    });

    // If all keys are on cooldown, try all of them anyway
    if (keysToTry.length === 0) {
      console.warn(`[Gemini Rotator] All ${rawKeysToTry.length} keys are currently cooling down. Resetting cooldowns to attempt generation.`);
      keysToTry = rawKeysToTry;
    }

    let lastError: any = null;
    
    for (let attempt = 0; attempt < keysToTry.length; attempt++) {
      const idx = (currentKeyIndex + attempt) % keysToTry.length;
      const key = keysToTry[idx];
      
      const currentClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      try {
        console.log(`[Gemini Rotator] Attempting generation with key index ${idx} (ends with ...${key.slice(-4)})`);
        const result = await (currentClient.models.generateContent as any)(params, ...args);
        
        // Successful generation! Save this key index for future runs and remove from cooldown if any
        currentKeyIndex = idx;
        keyCooldowns.delete(key);
        return result;
      } catch (err: any) {
        lastError = err;
        const errStr = JSON.stringify(err);
        
        // Place this failing key on cooldown to avoid repeating immediately
        keyCooldowns.set(key, Date.now() + 60000); // 1-minute cooldown
        
        console.warn(`[Gemini Rotator] Key index ${idx} failed (ends with ...${key.slice(-4)}). Placed on 1-min cooldown. Error: ${err.message || errStr}. cycling to the next key...`);
        
        // If we tried all keys and the requested model is not 'gemini-3.1-flash-lite', let's retry with 'gemini-3.1-flash-lite' across all keys
        if (attempt === keysToTry.length - 1 && params && params.model !== 'gemini-3.1-flash-lite') {
          console.warn(`[Gemini Rotator] All keys exhausted for model '${params.model || "default"}'. Retrying pool with 'gemini-3.1-flash-lite' as universal fallback...`);
          const fallbackParams = { ...params, model: 'gemini-3.1-flash-lite' };
          
          for (let fbAttempt = 0; fbAttempt < keysToTry.length; fbAttempt++) {
            const fbIdx = (currentKeyIndex + fbAttempt) % keysToTry.length;
            const fbKey = keysToTry[fbIdx];
            const fbClient = new GoogleGenAI({
              apiKey: fbKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                }
              }
            });
            try {
              console.log(`[Gemini Rotator Fallback] Attempting fallback with key index ${fbIdx} (ends with ...${fbKey.slice(-4)})`);
              const result = await (fbClient.models.generateContent as any)(fallbackParams, ...args);
              currentKeyIndex = fbIdx;
              keyCooldowns.delete(fbKey);
              return result;
            } catch (fbErr: any) {
              lastError = fbErr;
              keyCooldowns.set(fbKey, Date.now() + 60000);
            }
          }
        }
      }
    }
    
    throw lastError || new Error("All configured Gemini API keys failed.");
  } as any;

  return client;
}
