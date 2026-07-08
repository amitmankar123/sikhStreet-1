import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\amitm\\.gemini\\antigravity-ide\\brain\\96779d4d-6662-4d13-af66-ff5d72790d8b\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    const data = JSON.parse(line);
    if (data.type === 'GENERIC' && data.content && data.content.includes('Showing lines 694 to 980')) {
      console.log(`Found snippet at record ${count + 1}!`);
      fs.writeFileSync('original_snippet.txt', data.content);
      console.log('Saved to original_snippet.txt');
      break;
    }
    count++;
  }
}

run();
