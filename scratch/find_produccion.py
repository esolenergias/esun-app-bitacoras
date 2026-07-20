import json

log_path = r'C:\Users\mafre\.gemini\antigravity-cli\brain\6ff176ef-c942-4d32-a127-da2d0fe58d52\.system_generated\logs\transcript_full.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'produccion' in line.lower() and 'PLANNER_RESPONSE' in line:
            try:
                obj = json.loads(line)
                for tc in obj.get('tool_calls', []):
                    if tc['name'] == 'replace_file_content' or tc['name'] == 'multi_replace_file_content':
                        args = tc.get('args', {})
                        if 'produccion' in str(args).lower():
                            print(f"Step {obj['step_index']}: {args}")
            except:
                pass
