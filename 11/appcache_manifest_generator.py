import os
import argparse
from datetime import datetime

def generate_cache_manifest(directory_path, include_directory_path=True, include_payloads=True):
    manifest = ["CACHE MANIFEST", "# build " + datetime.now().strftime("%Y%m%d-%H%M%S")]
    
    for root, _, files in os.walk(directory_path):
        if '__pycache__' in root:
            continue
        for file in files:
            if file.endswith(('.appcache', '.manifest')):
                continue
            if file == '.DS_Store':
                continue
            if file == 'README.md' or file.endswith('.py'):
                continue
            file_path = os.path.join(root, file)

            if args.light_root and os.path.normpath(directory_path) == '.':
                relative_path = os.path.relpath(file_path, directory_path).replace("\\", "/")
                if relative_path not in ('index.html', '6/index.html', '11/index.html', '11/logo.png'):
                    continue

            if not include_payloads and 'payload' in root:
                continue
            if args.cloudflare_workaround and file == 'index.html':
                file_path = file_path.replace("index.html","")
                if file_path.isspace() or file_path == '':
                    file_path = '/'

            if include_directory_path:
                manifest_path = file_path
            else:
                manifest_path = os.path.relpath(file_path, directory_path)
                if manifest_path.isspace() or manifest_path == '' or manifest_path == '.':
                    manifest_path = '/'
                
            manifest_path = manifest_path.replace("\\","/")
            manifest.append(manifest_path)

    return manifest

parser = argparse.ArgumentParser(description="Generate an appcache file.")
parser.add_argument("directory_path", nargs='?', default='./',
                    help="The directory to generate the appcache for (default: './').")
parser.add_argument("-a", "--root-appcache",action="store_true",
                    help="Generate appcache if your index.html is at root")
parser.add_argument("-b", "--sub-appcache", action="store_true",
                    help="Generate appcache if your index.html is at document/en/ps5/index.html")
parser.add_argument("-ab", "--both-appcache", action="store_true",
                    help="Generate both appcache files. (Default)")
# parser.add_argument("-p", "--include-payloads", action="store_true",
#                     help="Include files with 'payload' in its path. (Payload caching is handled in js)")
parser.add_argument("-cf", "--cloudflare-workaround", action="store_true",
                    help="Cloudflare responds with 308 redirect to root when fetching index.html. Causing the appcache to error out.")
parser.add_argument("--light-root", action="store_true",
                    help="Cache only the root selector and its icon when generating the root manifest.")
args = parser.parse_args()

if args.root_appcache or args.sub_appcache:
    args.both_appcache = False
else:
    args.root_appcache = True
    args.sub_appcache = True
   

if args.sub_appcache:
    cache_manifest = generate_cache_manifest(args.directory_path, False)

    output_path = os.path.join(args.directory_path, "cache.manifest")
    output_path = output_path.replace("\\","/")

    with open(output_path, "w") as manifest_file:
        manifest_file.write("\n".join(cache_manifest))

    print(f"Cache manifest generated in path: '{output_path}'")


if args.root_appcache:
    cache_manifest = generate_cache_manifest(args.directory_path, False)

    output_path = "cache.manifest"
    output_path = os.path.join(args.directory_path, output_path)
    output_path = output_path.replace("\\","/")

    with open(output_path, "w") as manifest_file:
        manifest_file.write("\n".join(cache_manifest))

    print(f"Cache manifest generated in path: '{output_path}'")
