import fs from 'fs';

const transcriptPath = 'C:\\Users\\mafre\\.gemini\\antigravity-cli\\brain\\6ff176ef-c942-4d32-a127-da2d0fe58d52\\.system_generated\\logs\\transcript_full.jsonl';
const targetFile = 'BitacorasApp.tsx';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let content = '';

let pendingToolCalls = [];

for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    
    // If it's a planner response with tool calls, save them to apply if they succeed
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
      pendingToolCalls = obj.tool_calls;
    }
    
    // If it's a tool response, check if it succeeded
    if (obj.type === 'TOOL_RESPONSE' && pendingToolCalls.length > 0) {
      // Find the tool call that matches this response
      // Usually tool responses are in order, or we can check the ID if available
      // Actually, we can check if the output indicates an error.
      // Often, the output has "Error:" or "failed"
      
      const results = obj.content; // In some schemas, tool responses are in content array
      const tc = pendingToolCalls[0]; // Assuming sequential for simplicity or we iterate
      
      // A better way: just read the tool call and look ahead at the next line for its response
      const nextLineStr = lines[i]; 
      if (nextLineStr.includes('"output":"Error:') || nextLineStr.includes('"error"')) {
        console.log(`Skipping failed step`);
        pendingToolCalls = [];
        continue;
      }
      
      // Let's just apply the pending tool calls if they were targeting our file
      for (const t of pendingToolCalls) {
        if (t.args && t.args.TargetFile && t.args.TargetFile.includes(targetFile)) {
          console.log(`Applying ${t.name}`);
          
          if (t.name === 'write_to_file' || t.name === 'write_file') {
            content = t.args.CodeContent;
          } 
          else if (t.name === 'replace_file_content') {
            const fileLines = content.split('\n');
            const start = t.args.StartLine - 1;
            const end = t.args.EndLine;
            const replacement = t.args.ReplacementContent.split('\n');
            content = [...fileLines.slice(0, start), ...replacement, ...fileLines.slice(end)].join('\n');
          }
          else if (t.name === 'multi_replace_file_content') {
            const chunks = [...t.args.ReplacementChunks].sort((a, b) => b.StartLine - a.StartLine);
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
      
      pendingToolCalls = [];
    }
  } catch (e) {
    // skip
  }
}

fs.writeFileSync('C:\\Users\\mafre\\Esolenergias\\scratch\\RecoveredBitacorasApp_v4.tsx', content, 'utf8');
console.log('Recovery complete! Length:', content.split('\n').length);
