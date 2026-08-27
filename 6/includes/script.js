let timerId = null; 
const label = document.getElementById('autoJbLabel');
const checkbox = document.getElementById('autoJbInput');
const jeilbrekBtn = document.getElementById('jeilbrek');
const UAElement = document.getElementById("UA");
const uptimeDisplay = document.getElementById("uptime-display");
const sysStatus = document.getElementById("sys-status");
const exploitStatus = document.getElementById("exploit-status");
const connStatus = document.getElementById("conn-status");

const storedAutoJb = localStorage.getItem("autoJb");
let autoJbValue = storedAutoJb !== null ? storedAutoJb === "true" : true;

// choose one of kernel exploits
var exploitChain = localStorage.getItem("exploitChain") || "lapse";
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');

// Show user agent
UAElement.innerText += " " + navigator.userAgent;

kexForm.addEventListener("change", function (event) {
    localStorage.setItem("exploitChain", event.target.value);
    exploitChain = event.target.value;
});

// jailbreak execution
jeilbrekBtn.addEventListener("click", function (e){
    jeilbrekBtn.disabled = true;
    stopInterval();
    doJb();
});

checkbox.addEventListener('change', function () {
    localStorage.setItem("autoJb", checkbox.checked);
    if (checkbox.checked == true && jeilbrekBtn.disabled == false) {
        jailbreakCountdown();
        return;
    }

    stopInterval();
});

function stopInterval(){
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    label.textContent = "Auto Jailbreak";
}

function jailbreakCountdown() {   
    stopInterval();

    let countdown = 5;
    label.textContent = `Auto Jailbreaking in: ${countdown}`;
    timerId = setInterval(() => {
        countdown--;
        label.textContent = `Auto Jailbreaking in: ${countdown}`;

        if (countdown < 0) {
            jeilbrekBtn.disabled = true; 
            clearInterval(timerId);
            timerId = null;
            label.textContent = 'Executing';
            doJb();
        }
    }, 1000);
}

function startUptimeTimer() {
    const startTime = Date.now();
    function updateUptime() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
        const seconds = String(elapsed % 60).padStart(2, "0");
        if (uptimeDisplay) uptimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }
    updateUptime();
    setInterval(updateUptime, 1000);
}

function setStatus(element, value, state) {
    if (!element) return;
    element.textContent = value;
    element.dataset.state = state || "idle";
}

function updateSystemStatus() {
    if (navigator.onLine) {
        setStatus(sysStatus, "ONLINE", "success");
    } else {
        setStatus(sysStatus, "OFFLINE", "error");
    }
}

function updateConnectionStatus() {
    const state = navigator.onLine ? "success" : "error";
    const text = navigator.onLine ? "SECURE" : "DISCONNECTED";
    setStatus(connStatus, text, state);
}

// hook into doJb to update the EXPLOIT status live
(async function monitorExploitStatus() {
    const origDoJb = window.doJb;
    if (typeof origDoJb !== "function") return;

    window.doJb = async function () {
        setStatus(exploitStatus, "RUNNING", "warn");
        jeilbrekBtn.disabled = true;
        try {
            await origDoJb.apply(this, arguments);
            setStatus(exploitStatus, "SUCCESS", "success");
        } catch (err) {
            console.error(err);
            setStatus(exploitStatus, "FAILED", "error");
        } finally {
            jeilbrekBtn.disabled = false;
        }
    };
})();

function cacheProgress(e) {
    var Percent = (Math.round(e.loaded / e.total * 100));
    document.title = "Caching: " + Percent + "%";
}

function displayCacheProgress() {
    setTimeout(function () {
        // show a tick
        document.title = "\u2713";
    }, 1000);
    setTimeout(function () {
        // location.reload();
        document.title = "CSSFontFace exploit";
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function() {
    // Cache handling
    if (window.applicationCache) {
        window.applicationCache.addEventListener("progress", cacheProgress, false);
        window.applicationCache.oncached = function (e) { displayCacheProgress(); };
        window.applicationCache.onupdateready = function (e) { displayCacheProgress(); };
    }

    // choose prefered exploit chain
    if (exploitChain == "netctrl") {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }

    // apply autojb localStorage value
    checkbox.checked = autoJbValue;

    if (autoJbValue) jailbreakCountdown();

    // start uptime timer as soon as the page is opened
    startUptimeTimer();

    // auto-update copyright year
    const footerYear = document.getElementById("footer-year");
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // initialize status dashboard
    updateSystemStatus();
    updateConnectionStatus();

    window.addEventListener("online", function () {
        updateSystemStatus();
        updateConnectionStatus();
    });
    window.addEventListener("offline", function () {
        updateSystemStatus();
        updateConnectionStatus();
    });
});
