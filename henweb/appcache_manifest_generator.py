#!/usr/bin/env python3
"""
AppCache Manifest Generator for henweb
Automatically generates cache.manifest by scanning the henweb directory.
"""

import os
import sys
from pathlib import Path


def get_all_files(root_dir):
    """Recursively get all files in directory, relative to root."""
    files = []
    for root, dirs, filenames in os.walk(root_dir):
        # Skip hidden directories and __pycache__
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        
        for filename in filenames:
            if filename.startswith('.'):
                continue
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, root_dir)
            files.append(rel_path.replace('\\', '/'))
    return sorted(files)


def generate_manifest(root_dir, output_file, version="1.0.0"):
    """Generate the cache manifest file."""
    files = get_all_files(root_dir)
    
    # Separate HTML, JS, and binary files for organization
    html_files = [f for f in files if f.endswith('.html')]
    js_files = [f for f in files if f.endswith('.js')]
    bin_files = [f for f in files if f.endswith(('.bin', '.hex'))]
    json_files = [f for f in files if f.endswith('.json')]
    txt_files = [f for f in files if f.endswith('.txt')]
    other_files = [f for f in files if f not in html_files + js_files + bin_files + json_files + txt_files]
    
    manifest_content = f"""CACHE MANIFEST

# Version {version}
# Generated automatically by appcache_manifest_generator.py
# DO NOT EDIT MANUALLY - Run this script to regenerate

CACHE:
"""
    
    # Write files grouped by type
    for category, file_list in [
        ("HTML", html_files),
        ("JavaScript", js_files),
        ("Binary", bin_files),
        ("JSON", json_files),
        ("Text", txt_files),
        ("Other", other_files)
    ]:
        if file_list:
            manifest_content += f"\n# {category} files\n"
            for f in file_list:
                manifest_content += f"{f}\n"
    
    manifest_content += """

NETWORK:
*

FALLBACK:
/ /index.html
"""
    
    with open(output_file, 'w') as f:
        f.write(manifest_content)
    
    print(f"Generated {output_file} with {len(files)} files")
    print(f"  HTML: {len(html_files)}, JS: {len(js_files)}, Binary: {len(bin_files)}")
    print(f"  JSON: {len(json_files)}, Text: {len(txt_files)}, Other: {len(other_files)}")


def main():
    script_dir = Path(__file__).parent.absolute()
    henweb_dir = script_dir
    output_file = henweb_dir / "cache.manifest"
    
    # Allow version override via command line
    version = sys.argv[1] if len(sys.argv) > 1 else "1.0.0"
    
    generate_manifest(henweb_dir, output_file, version)


if __name__ == "__main__":
    main()