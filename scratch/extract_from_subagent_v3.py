import json
import re

log_path = r'C:\Users\mafre\.gemini\antigravity-cli\brain\6004c5d8-b4da-4c16-9142-6694b6fe7a3d\.system_generated\logs\transcript_full.jsonl'
lines_content = {}
found = False

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        if not line.strip(): continue
        try:
            obj = json.loads(line)
            if obj.get('type') == 'TOOL_RESPONSE':
                for item in obj.get('content', []):
                    text = item.get('text', '')
                    if 'File Path: `file:///C:/Users/mafre/Esolenergias/src/components/BitacorasApp.tsx`' in text:
                        for l in text.split('\n'):
                            l = l.strip('\r')
                            match = re.match(r'^(\d+): (.*)$', l)
                            if match:
                                num = int(match.group(1))
                                content = match.group(2)
                                lines_content[num] = content
                                found = True
        except Exception as e:
            pass

if found:
    max_line = max(lines_content.keys())
    with open(r'C:\Users\mafre\Esolenergias\scratch\SubagentRecoveredProperly.tsx', 'w', encoding='utf-8') as out:
        for i in range(1, max_line + 1):
            out.write(lines_content.get(i, '') + '\n')
    print(f'Recovered {max_line} lines!')
else:
    print('No lines found.')
