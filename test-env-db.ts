import dotenv from 'dotenv';
dotenv.config();

console.log('Available Env Keys:');
Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE') || key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB')) {
    console.log(`- ${key}: ${process.env[key] ? 'exists (not empty)' : 'empty'}`);
  }
});
