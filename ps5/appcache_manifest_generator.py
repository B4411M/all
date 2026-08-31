import os
import argparse
from datetime import datetime


def generate_cache_manifest(directory_path, args, include_directory_path=True):
    manifest = ["CACHE MANIFEST", "# build " + datetime.now().strftime("%Y%m%d-%H%M%S")]

    for root, _, files in os.walk(directory_path):
        if "__pycache__" in root:
            continue
        for file in files:
            if file.endswith((".appcache", ".manifest")):
                continue
            if file == ".DS_Store":
                continue
            if file == "README.md" or file.endswith(".py"):
                continue
            # The document/en/ tree under ps5/ is documentation scaffolding -- not
            # linked from any host page, so caching it wastes appcache quota.
            if "document/" in root.replace("\\", "/"):
                continue
            file_path = os.path.join(root, file)

            if args.light_root and os.path.normpath(directory_path) == ".":
                relative_path = os.path.relpath(file_path, directory_path).replace("\\", "/")
                light_whitelist = (
                    "index.html",
                    "6/index.html",
                    "11/index.html",
                    "ps5/index.html",
                    "11/logo.png",
                )
                if relative_path not in light_whitelist:
                    continue

            if not args.include_payloads and "payload" in root:
                continue

            if args.cloudflare_workaround and file == "index.html":
                file_path = file_path.replace("index.html", "")
                if not file_path.strip():
                    file_path = "/"

            if include_directory_path:
                manifest_path = file_path
            else:
                manifest_path = os.path.relpath(file_path, directory_path)
                if not manifest_path.strip() or manifest_path == ".":
                    manifest_path = "/"

            manifest_path = manifest_path.replace("\\", "/")
            manifest.append(manifest_path)

    return manifest


HOST_OUTPUTS = {
    "ps4-modern": "cache-ps4-modern.appcache",
    "ps4-legacy": "cache-ps4-legacy.appcache",
    "ps5":        "cache-ps5.appcache",
}


def output_path_for(directory_path, host, mode):
    if host:
        name = HOST_OUTPUTS[host]
    elif mode == "root":
        name = "cache.manifest"
    else:
        name = "cache.manifest"
    return os.path.join(directory_path, name).replace("\\", "/")


def main():
    parser = argparse.ArgumentParser(description="Generate an appcache file for a PS4/PS5 host folder.")
    parser.add_argument("directory_path", nargs="?", default="./",
                        help="The directory to generate the appcache for (default: './').")
    parser.add_argument("-a", "--root-appcache", action="store_true",
                        help="Generate a selector-light appcache at the project root.")
    parser.add_argument("-b", "--sub-appcache", action="store_true",
                        help="Generate an appcache inside the host folder (the default).")
    parser.add_argument("-cf", "--cloudflare-workaround", action="store_true",
                        help="Cloudflare 308-redirects index.html; emit '/' instead of 'index.html'.")
    parser.add_argument("--light-root", action="store_true",
                        help="When generating the root appcache, only list the selector entries.")
    parser.add_argument("--host",
                        choices=sorted(HOST_OUTPUTS.keys()),
                        help="Write a host-specific appcache (cache-<host>.appcache).")
    parser.add_argument("--include-payloads", action="store_true",
                        help="Include payload blobs. Off by default: payloads are fetched at runtime "
                             "by the chain JS, not cached at install time.")
    args = parser.parse_args()

    if args.host and (args.root_appcache or args.sub_appcache):
        parser.error("--host cannot be combined with --root-appcache/--sub-appcache; "
                     "it implies a single host-specific output.")

    if not args.host and not args.root_appcache and not args.sub_appcache:
        args.sub_appcache = True

    if args.host:
        out_path = output_path_for(args.directory_path, args.host, mode="host")
        cache_manifest = generate_cache_manifest(args.directory_path, args, include_directory_path=False)
        with open(out_path, "w") as f:
            f.write("\n".join(cache_manifest))
        print(f"Cache manifest generated in path: '{out_path}'")
        return

    if args.sub_appcache:
        out_path = output_path_for(args.directory_path, host=None, mode="sub")
        cache_manifest = generate_cache_manifest(args.directory_path, args, include_directory_path=False)
        with open(out_path, "w") as f:
            f.write("\n".join(cache_manifest))
        print(f"Cache manifest generated in path: '{out_path}'")

    if args.root_appcache:
        out_path = output_path_for(args.directory_path, host=None, mode="root")
        cache_manifest = generate_cache_manifest(args.directory_path, args, include_directory_path=False)
        with open(out_path, "w") as f:
            f.write("\n".join(cache_manifest))
        print(f"Cache manifest generated in path: '{out_path}'")


if __name__ == "__main__":
    main()