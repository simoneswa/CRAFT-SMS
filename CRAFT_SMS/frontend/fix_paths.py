import os
import re

src_dir = r"c:\Users\Swaray\OneDrive\Desktop\craft sms\CRAFT_SMS\frontend\src"

def get_relative_prefix(filepath):
    # Get relative path from src_dir to the directory containing filepath
    dir_path = os.path.dirname(filepath)
    rel_path = os.path.relpath(dir_path, src_dir)
    if rel_path == '.':
        return './'
    
    depth = len(rel_path.split(os.sep))
    return '../' * depth

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if '@/' in content:
                # Calculate relative prefix
                prefix = get_relative_prefix(filepath)
                
                # Replace import ... from '@/...
                # Also handle dynamic imports import('@/...)
                
                def repl(match):
                    return match.group(1) + prefix + match.group(2)
                
                new_content = re.sub(r"(from\s+['\"]|import\(['\"])@/(.*?)", repl, content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {filepath}")
