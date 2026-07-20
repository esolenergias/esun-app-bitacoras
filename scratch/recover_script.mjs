import fs from 'fs';

const transcriptPath = 'C:\\Users\\mafre\\.gemini\\antigravity-cli\\brain\\6ff176ef-c942-4d32-a127-da2d0fe58d52\\.system_generated\\logs\\transcript_full.jsonl';
const targetFile = 'BitacorasApp.tsx';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let content = '';

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.args && tc.args.TargetFile && tc.args.TargetFile.includes(targetFile)) {
          console.log(`Applying step ${obj.step_index}: ${tc.name}`);
          
          if (tc.name === 'write_to_file' || tc.name === 'write_file') {
            content = tc.args.CodeContent;
          } 
          else if (tc.name === 'replace_file_content') {
            const fileLines = content.split('\n');
            const start = tc.args.StartLine - 1;
            const end = tc.args.EndLine;
            const replacement = tc.args.ReplacementContent.split('\n');
            content = [...fileLines.slice(0, start), ...replacement, ...fileLines.slice(end)].join('\n');
          }
          else if (tc.name === 'multi_replace_file_content') {
            // apply chunks in reverse order to not mess up line numbers
            const chunks = tc.args.ReplacementChunks.sort((a, b) => b.StartLine - a.StartLine);
            let fileLines = content.split('\n');
            for (const chunk of chunks) {
              const start = chunk.StartLine - 1;
              const end = chunk.EndLine;
              const replacement = chunk.ReplacementContent.split('\n');
              fileLines = [...fileLines.slice(0, start), ...replacement, ...fileLines.slice(end)];
            }
            content = fileLines.join('\n');
          }
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }
}

fs.writeFileSync('C:\\Users\\mafre\\Esolenergias\\scratch\\RecoveredBitacorasApp.tsx', content, 'utf8');
console.log('Recovery complete! Length:', content.split('\n').length);
