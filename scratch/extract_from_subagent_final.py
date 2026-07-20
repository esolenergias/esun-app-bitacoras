import json
import re

log_path = r'C:\Users\mafre\.gemini\antigravity-cli\brain\6004c5d8-b4da-4c16-9142-6694b6fe7a3d\.system_generated\logs\transcript_full.jsonl'
lines_content = {}
found = False

with open(log_path, 'r', encoding='utf-8') as f:
    text = f.read()
    
    matches = re.findall(r'\\n(\d+): (.*?)(?=\\n\d+: |\\n\\"|\\n<|$)', text)
    for num_str, content in matches:
        num = int(num_str)
        # Unescape the content
        content = content.replace('\\\\', '\\').replace('\\"', '"').replace('\\r', '').replace('\\t', '\t')
        
        # Don't overwrite if we already have it to avoid picking up the truncated version
        if num not in lines_content:
            lines_content[num] = content
            found = True

if found:
    max_line = max(lines_content.keys())
    # Ensure it's roughly the correct length
    if max_line > 1000:
        with open(r'C:\Users\mafre\Esolenergias\scratch\SubagentRecoveredFinal.tsx', 'w', encoding='utf-8') as out:
            for i in range(1, max_line + 1):
                out.write(lines_content.get(i, '') + '\n')
        print(f'Recovered {max_line} lines!')
    else:
        print(f'Found only {max_line} lines, something is wrong.')
else:
    print('No lines found.')
