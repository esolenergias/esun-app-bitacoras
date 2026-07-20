import json
import os

transcript_path = r"C:\Users\mafre\.gemini\antigravity-cli\brain\6ff176ef-c942-4d32-a127-da2d0fe58d52\.system_generated\logs\transcript_full.jsonl"
target_file = "BitacorasApp.tsx"

content = ""

def apply_replacement(text, start_line, end_line, target, replacement):
    lines = text.split('\n')
    # Convert 1-indexed to 0-indexed
    start_idx = max(0, start_line - 1)
    end_idx = min(len(lines), end_line)
    
    # Extract the chunk of lines
    chunk = '\n'.join(lines[start_idx:end_idx])
    
    # Replace exactly once in the chunk
    if target in chunk:
        new_chunk = chunk.replace(target, replacement, 1)
        # Reassemble
        return '\n'.join(lines[:start_idx]) + ('\n' if start_idx > 0 else '') + new_chunk + ('\n' if end_idx < len(lines) else '') + '\n'.join(lines[end_idx:])
    else:
        # Fallback to full file if line numbers drifted
        if target in text:
            return text.replace(target, replacement, 1)
        return None

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
                            start_line = args.get("StartLine", 1)
                            end_line = args.get("EndLine", len(content.split('\n')))
                            
                            new_content = apply_replacement(content, start_line, end_line, target, replacement)
                            if new_content is not None:
                                content = new_content
                            else:
                                print(f"WARNING: Target not found in step {obj['step_index']}")
                        
                        elif name == "multi_replace_file_content":
                            chunks = args.get("ReplacementChunks", [])
                            # Sort by start line descending so replacements don't shift line numbers for subsequent chunks in the same call
                            chunks.sort(key=lambda x: x.get("StartLine", 0), reverse=True)
                            for chunk in chunks:
                                target = chunk.get("TargetContent", "")
                                replacement = chunk.get("ReplacementContent", "")
                                start_line = chunk.get("StartLine", 1)
                                end_line = chunk.get("EndLine", len(content.split('\n')))
                                
                                new_content = apply_replacement(content, start_line, end_line, target, replacement)
                                if new_content is not None:
                                    content = new_content
                                else:
                                    print(f"WARNING: Chunk target not found in step {obj['step_index']}")
        except Exception as e:
            pass

with open(r"C:\Users\mafre\Esolenergias\scratch\RecoveredBitacorasApp_v3.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done! Recovered length: {len(content.splitlines())}")
