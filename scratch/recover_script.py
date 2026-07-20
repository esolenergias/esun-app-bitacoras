import json
import os

transcript_path = r"C:\Users\mafre\.gemini\antigravity-cli\brain\6ff176ef-c942-4d32-a127-da2d0fe58d52\.system_generated\logs\transcript_full.jsonl"
target_file = "BitacorasApp.tsx"

content = ""

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        if not line.strip(): continue
        try:
            obj = json.loads(line)
            if obj.get("type") == "PLANNER_RESPONSE" and "tool_calls" in obj:
                for tc in obj["tool_calls"]:
                    args = tc.get("args", {})
                    if args.get("TargetFile", "").endswith(target_file):
                        name = tc.get("name")
                        print(f"Applying {name} at step {obj['step_index']}")
                        
                        if name in ["write_to_file", "write_file"]:
                            content = args.get("CodeContent", "")
                        
                        elif name == "replace_file_content":
                            target = args.get("TargetContent", "")
                            replacement = args.get("ReplacementContent", "")
                            if target in content:
                                content = content.replace(target, replacement, 1)
                            else:
                                print(f"WARNING: Target not found in step {obj['step_index']}")
                        
                        elif name == "multi_replace_file_content":
                            chunks = args.get("ReplacementChunks", [])
                            for chunk in chunks:
                                target = chunk.get("TargetContent", "")
                                replacement = chunk.get("ReplacementContent", "")
                                if target in content:
                                    content = content.replace(target, replacement, 1)
                                else:
                                    print(f"WARNING: Chunk target not found in step {obj['step_index']}")
        except Exception as e:
            pass

with open(r"C:\Users\mafre\Esolenergias\scratch\RecoveredBitacorasApp_v2.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done! Recovered length: {len(content.splitlines())}")
