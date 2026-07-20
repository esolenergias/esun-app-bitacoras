import json
import re

log_path = r'C:\Users\mafre\.gemini\antigravity-cli\brain\2fe82eb5-95d5-411d-865f-f8d4e14b0bc5\.system_generated\logs\transcript_full.jsonl'
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
    if max_line > 600:
        with open(r'C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt', 'w', encoding='utf-8') as out:
            for i in range(1, max_line + 1):
                out.write(lines_content.get(i, '') + '\n')
        print(f'Recovered ReportScreen.kt with {max_line} lines!')
    else:
        print(f'Found only {max_line} lines, something is wrong.')
else:
    print('No lines found.')
