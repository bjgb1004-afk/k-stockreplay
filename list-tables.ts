import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('No Supabase configuration found.');
    return;
  }

  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const restUrl = `${cleanUrl}/rest/v1/`;

  console.log('Fetching Supabase schema from:', restUrl);
  
  try {
    const res = await fetch(restUrl, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (!res.ok) {
      console.error(`HTTP error: ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.error('Response body:', body);
      return;
    }
    const schema: any = await res.json();
    if (schema && schema.definitions) {
      console.log('\nAvailable tables in Supabase definitions:');
      Object.keys(schema.definitions).forEach(name => {
        console.log(`- ${name}`);
      });
    } else {
      console.log('No definitions found in schema.');
    }
  } catch (err: any) {
    console.error('Failed to fetch Supabase schema:', err.message);
  }
}

run();
