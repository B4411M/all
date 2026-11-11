#!/usr/bin/env python3
import re, sys, time, urllib.parse
LOG = "/tmp/afterglow-1402-serve.log"
f = open(LOG, "r", errors="replace")
f.seek(0, 2)
pat = re.compile(r"ag_log\?m=([^ ]+)")
while True:
    line = f.readline()
    if not line:
        time.sleep(0.3)
        continue
    m = pat.search(line)
    if m:
        msg = urllib.parse.unquote(m.group(1))
        if msg.startswith("[kp]") or msg.startswith("[g]") or msg.startswith("[rw]") or "defused" in msg or "kernel interface is live" in msg or msg.startswith("[e]"):
            print(msg, flush=True)
    elif "GET /kpayload.bin" in line or "GET /go-step" in line:
        print(line.strip(), flush=True)