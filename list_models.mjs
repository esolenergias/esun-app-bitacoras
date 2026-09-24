import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY="?(.*?)"?(?:\n|$)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const json = await res.json();
  console.log(json.models.map(m => m.name));
}
run();
