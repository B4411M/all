import io
p = "afterglow-g.js"
s = io.open(p, encoding="utf-8").read()

old = (
    '    markClear();\n'
    '    tram.n = 0;\n'
    '    wpOff();\n'
    '    hex("31ff"); hex("31f6"); hex("31c0");   /* rdi=0, esi=0, eax=0 */\n'
    '    callAbs(rva);\n'
    '    hex("4898");\n'
    '    hex("48b9"); q64(plus(buf, GH.mark));\n'
    '    hex("488901");\n'
    '    wpOn(); hex("31c0"); hex("c3");\n'
    '    saySync("[kp] SYNC entering [" + (n + 1) + "] 0x" + rva.toString(16) + " " + what);'
)

new = (
    '    markClear();\n'
    '    tram.n = 0;\n'
    '    wpOff();\n'
    '    const stepStack = plus(t, 0xff000);\n'
    '    hex("48b9"); q64(stepStack); hex("488921");   /* [stepStack] = rsp */\n'
    '    hex("48bc"); q64(stepStack);                  /* rsp = stepStack */\n'
    '    hex("31ff"); hex("31f6"); hex("31c0");        /* rdi=0, esi=0, eax=0 */\n'
    '    callAbs(rva);\n'
    '    hex("4898");\n'
    '    hex("48b9"); q64(plus(buf, GH.mark));\n'
    '    hex("488901");\n'
    '    hex("48b9"); q64(stepStack); hex("488b21");   /* rsp = [stepStack] */\n'
    '    wpOn(); hex("31c0"); hex("c3");\n'
    '    say("[kp] SYNC entering [" + (n + 1) + "] 0x" + rva.toString(16) + " " + what + " (stack " + text(stepStack) + ")");'
)

assert s.count(old) == 1, "anchor %d" % s.count(old)
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("step stack deployed; size", len(s))