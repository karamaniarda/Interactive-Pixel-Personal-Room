document.addEventListener('DOMContentLoaded', () => {
        const hudTime      = document.getElementById('hud-time');
    const hudStatus    = document.getElementById('hud-status');
    const hudZzz       = document.getElementById('hud-zzz');
    const hudWeather   = document.getElementById('hud-weather');
    const hudExplore   = document.getElementById('hud-explore');
    const avatarWrapper= document.getElementById('avatar-wrapper');
    const avatarImg    = document.getElementById('avatar');
    const dayRoom      = document.getElementById('day-room');
    const walkableFloor= document.getElementById('walkable-floor');
    const roomContainer= document.getElementById('room-container');
    const radioAudio   = document.getElementById('radio-audio');
    const sunRay       = document.getElementById('sun-ray');
    const zzzEls       = document.querySelectorAll('.zzz');
    const noteEls      = document.querySelectorAll('.music-note');
    const screenEls    = document.querySelectorAll('.flicker');
    const lampEls      = document.querySelectorAll('.lamp-glow');
        let manualLamp    = false;
    let currentId     = null;
    let stepInterval  = null;
    let globalVolume  = 25;
    radioAudio.volume = (globalVolume / 100) * 0.5;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        const volSlider = document.getElementById('hud-volume-slider');
    const audioBtn  = document.getElementById('hud-audio-btn');
    volSlider.addEventListener('input', (e) => {
        globalVolume = parseInt(e.target.value);
        radioAudio.volume = (globalVolume / 100) * 0.5;
        if (masterGain) {
            masterGain.gain.setValueAtTime(globalVolume / 100, getCtx().currentTime);
        }
    });
        let audioCtx = null;
    let masterGain = null;
    function getCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(globalVolume / 100, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }
        let synthPlaying = false;
    let synthTimer   = null;
    let useSynth     = false;
    radioAudio.addEventListener('error', () => { useSynth = true; });
    const NF = { 
        'C5': 523.25, 'B4': 493.88, 'A#4': 466.16, 'A4': 440.00,
        'G4': 392.00, 'F#4': 369.99, 'F4': 349.23,
        'E4': 329.63, 'D4': 293.66, 'C4': 261.63,
        'B3': 246.94, 'A3': 220.00, 'G3': 196.00
    };
    const BF = { 
        'B2': 123.47, 'A2': 110.00, 'G2': 98.00,
        'F#2': 92.50, 'E2': 82.41, 'D2': 73.42
    };
    const melody = [
        { n:'B4',  d:1.5 }, { n:'A4',  d:0.5 }, { n:'G4',  d:2   },
        { n:'A4',  d:1   }, { n:'G4',  d:1   }, { n:'F#4', d:1   }, { n:'G4',  d:1   },
        { n:'F#4', d:1   }, { n:'E4',  d:1   }, { n:'F#4', d:2   },
        { n:null,  d:2   },
        { n:'G4',  d:1.5 }, { n:'F#4', d:0.5 }, { n:'E4',  d:1   }, { n:'D4',  d:1   },
        { n:'E4',  d:4   },
        { n:null,  d:2   },
        { n:'B4',  d:1   }, { n:'A4',  d:1   }, { n:'G4',  d:1   }, { n:'F#4', d:1   },
        { n:'A4',  d:1   }, { n:'G4',  d:1   }, { n:'F#4', d:0.5 },
        { n:'E4',  d:0.5 }, { n:'F#4', d:1   }, { n:'G4',  d:2   },
        { n:null,  d:1   },
        { n:'F#4', d:1   }, { n:'E4',  d:3   },
        { n:null,  d:2   },
        { n:'G4',  d:1   }, { n:'F#4', d:0.5 }, { n:'E4',  d:0.5 },
        { n:'F#4', d:1   }, { n:'E4',  d:1   }, { n:'D4',  d:0.5 }, { n:'E4',  d:0.5 },
        { n:'F#4', d:1   }, { n:'E4',  d:1   }, { n:'D4',  d:4   },
        { n:null,  d:4   }
    ];
    const bassline = [
        { n:'B2', d:16 }, { n:'G2', d:16 }, { n:'A2', d:16 }, { n:'F#2', d:16 }
    ];
    function playNote(freq, t0, dur, type='square', vol=0.04) {
        const ctx  = getCtx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
        gain.gain.setValueAtTime(vol, t0 + dur - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t0);
        osc.stop(t0 + dur);
    }
    function startSynth() {
        if (synthPlaying) return;
        synthPlaying = true;
        const beat = 0.20; 
        const totalBeats = melody.reduce((a,m) => a + m.d, 0);
        const loopMs = totalBeats * beat * 1000;
        function loop() {
            if (!synthPlaying) return;
            const ctx = getCtx();
            const t   = ctx.currentTime;
            const vM  = 0.038;
            const vB  = 0.06;
            let acc = 0;
            melody.forEach(item => {
                const dur = item.d * beat;
                if (item.n && NF[item.n]) {
                    playNote(NF[item.n], t + acc, dur - 0.02, 'square', vM);
                    playNote(NF[item.n], t + acc + 0.06, dur - 0.02, 'sine', vM * 0.18);
                }
                acc += dur;
            });
            let bAcc = 0;
            while (bAcc < acc) {
                bassline.forEach(item => {
                    const dur = item.d * beat;
                    if (bAcc < acc && BF[item.n]) {
                        playNote(BF[item.n], t + bAcc, dur - 0.01, 'triangle', vB);
                    }
                    bAcc += dur;
                });
            }
            synthTimer = setTimeout(loop, loopMs);
        }
        loop();
    }
    function stopSynth() {
        synthPlaying = false;
        if (synthTimer) { clearTimeout(synthTimer); synthTimer = null; }
        if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    }
    function toggleRadio() {
        if (useSynth) {
            if (synthPlaying) { stopSynth(); audioBtn.textContent = "🔇 SESSİZ"; }
            else { startSynth(); audioBtn.textContent = "🔊 MÜZİK"; }
        } else {
            if (radioAudio.paused) {
                radioAudio.volume = (globalVolume / 100) * 0.5;
                radioAudio.play().catch(() => { useSynth = true; startSynth(); });
                audioBtn.textContent = "🔊 MÜZİK";
            } else {
                radioAudio.pause();
                audioBtn.textContent = "🔇 SESSİZ";
            }
        }
    }
    audioBtn.addEventListener('click', toggleRadio);
        function sndFootstep() {
        try {
            const ctx = getCtx(); const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(80, t);
            o.frequency.exponentialRampToValueAtTime(22, t + 0.12);
            const v = (globalVolume/100)*0.07;
            g.gain.setValueAtTime(v, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            o.connect(g); g.connect(ctx.destination);
            o.start(t); o.stop(t + 0.12);
        } catch(e) {}
    }
    function sndSwitch(isOff) {
        try {
            const ctx = getCtx(); const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(isOff ? 110 : 280, t);
            const v = (globalVolume/100)*0.09;
            g.gain.setValueAtTime(v, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            o.connect(g); g.connect(ctx.destination);
            o.start(t); o.stop(t + 0.06);
        } catch(e) {}
    }
    function sndTV() {
        try {
            const ctx = getCtx(); const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(140, t);
            o.frequency.setValueAtTime(320, t + 0.08);
            o.frequency.setValueAtTime(640, t + 0.16);
            const v = (globalVolume/100)*0.07;
            g.gain.setValueAtTime(v, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
            o.connect(g); g.connect(ctx.destination);
            o.start(t); o.stop(t + 0.32);
        } catch(e) {}
    }
    function sndMeow() {
        try {
            const ctx = getCtx(); const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(620, t);
            o.frequency.exponentialRampToValueAtTime(1100, t + 0.12);
            o.frequency.exponentialRampToValueAtTime(820, t + 0.4);
            const v = (globalVolume/100)*0.11;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            o.connect(g); g.connect(ctx.destination);
            o.start(t); o.stop(t + 0.4);
        } catch(e) {}
    }
        let tvOn = false;
    function toggleTV() {
        tvOn = !tvOn;
        document.getElementById('tv-screen-glow').className = tvOn ? 'tv-glow-on' : 'tv-glow-off';
        if (tvOn) sndTV();
    }
        let bedZInt = null;
    function startZZZ() {
        if (bedZInt) clearInterval(bedZInt);
        bedZInt = setInterval(() => {
            if (!avatarWrapper.classList.contains('sleeping')) { stopZZZ(); return; }
            const z = document.createElement('div');
            z.className = 'zzz';
            z.style.fontSize = (9 + Math.random()*9) + 'px';
            z.textContent = Math.random() > 0.5 ? 'Z' : 'z';
            const rc = roomContainer.getBoundingClientRect();
            z.style.left = (rc.width * 0.74 + (Math.random()*18-9)) + 'px';
            z.style.top  = (rc.height * 0.43) + 'px';
            z.style.opacity = '1';
            roomContainer.appendChild(z);
            let step = 0;
            const fi = setInterval(() => {
                step++;
                z.style.top  = (parseFloat(z.style.top) - 1.4) + 'px';
                z.style.left = (parseFloat(z.style.left) + 0.4) + 'px';
                z.style.opacity = '' + (1 - step/45);
                if (step >= 45) { clearInterval(fi); z.remove(); }
            }, 30);
        }, 1000);
    }
    function stopZZZ() {
        if (bedZInt) { clearInterval(bedZInt); bedZInt = null; }
    }
        function startSteam() {
        const c = document.getElementById('coffee-steam-container');
        if (!c) return;
        setInterval(() => {
            const p = document.createElement('div');
            p.className = 'steam-particle';
            p.style.left = (Math.random() * 100) + '%';
            p.style.animationDelay = '0s';
            c.appendChild(p);
            setTimeout(() => p.remove(), 2000);
        }, 550);
    }
        function fillMatrix() {
        const words = ['const','let','async','await','fetch','null','true','false',
                       'class','import','return','0101','1010','void','render'];
        ['matrix1','matrix2'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = '';
            for (let c = 0; c < 2; c++) {
                const col = document.createElement('div');
                col.className = 'matrix-column';
                col.style.animationDelay    = (c * 1.8) + 's';
                col.style.animationDuration = (4 + Math.random()*3) + 's';
                let txt = '';
                for (let i = 0; i < 50; i++) txt += words[Math.floor(Math.random()*words.length)] + '<br>';
                col.innerHTML = txt;
                el.appendChild(col);
            }
        });
    }
        let cloudsCreated = false;
    const cloudWrappers = [];
    function buildClouds() {
        const container = document.getElementById('clouds');
        if (!container || cloudsCreated) return;
        cloudsCreated = true;
        container.innerHTML = '';
        cloudWrappers.length = 0;
        const configs = [
            { top:'5%',   cls:'cloud-small',  dur:70,  delay:-15, x:-80  },
            { top:'22%',  cls:'cloud-small',  dur:85,  delay:-45, x:-80  },
            { top:'38%',  cls:'cloud-small',  dur:78,  delay:-30, x:-80  },
            { top:'55%',  cls:'cloud-small',  dur:65,  delay:-55, x:-80  },
            { top:'72%',  cls:'cloud-small',  dur:92,  delay:-8,  x:-80  },
            { top:'88%',  cls:'cloud-small',  dur:80,  delay:-25, x:-80  },
            { top:'10%',  cls:'cloud-medium', dur:55,  delay:-20, x:-120 },
            { top:'28%',  cls:'cloud-medium', dur:48,  delay:-35, x:-120 },
            { top:'45%',  cls:'cloud-medium', dur:62,  delay:-5,  x:-120 },
            { top:'62%',  cls:'cloud-medium', dur:58,  delay:-50, x:-120 },
            { top:'80%',  cls:'cloud-medium', dur:50,  delay:-12, x:-120 },
            { top:'15%',  cls:'cloud-large',  dur:38,  delay:-10, x:-180 },
            { top:'35%',  cls:'cloud-large',  dur:44,  delay:-28, x:-180 },
            { top:'50%',  cls:'cloud-large',  dur:42,  delay:-40, x:-180 },
            { top:'68%',  cls:'cloud-large',  dur:40,  delay:-18, x:-180 },
            { top:'85%',  cls:'cloud-large',  dur:36,  delay:-32, x:-180 },
        ];
        configs.forEach(cfg => {
            const wrap = document.createElement('div');
            wrap.className = 'cloud-wrap';
            wrap.style.top             = cfg.top;
            wrap.style.animationName   = 'cloudDrift';
            wrap.style.animationDuration    = cfg.dur + 's';
            wrap.style.animationDelay  = cfg.delay + 's';
            wrap.style.animationTimingFunction = 'linear';
            wrap.style.animationIterationCount = 'infinite';
            const cloud = document.createElement('div');
            cloud.className = cfg.cls;
            cloud.style.setProperty('--cc', '#ffffff');
            wrap.appendChild(cloud);
            container.appendChild(wrap);
            cloudWrappers.push({ wrap, cloud, sizeCls: cfg.cls });
        });
    }
    function updateClouds(scrollPercent) {
        let cloudColor, cloudOpacity;
        if (scrollPercent < 0.50) {
            const t = scrollPercent / 0.50;
            const r = Math.round(255);
            const g = Math.round(255 - t * 55); 
            const b = Math.round(255 - t * 90);
            cloudColor = `rgb(${r},${g},${b})`;
            cloudOpacity = 1;
        } else if (scrollPercent < 0.72) {
            const t = (scrollPercent - 0.50) / 0.22;
            const r = Math.round(255 - t * 100);
            const g = Math.round(200 - t * 120);
            const b = Math.round(165 - t * 130);
            cloudColor = `rgb(${r},${g},${b})`;
            cloudOpacity = 1 - t * 0.5;
        } else {
            cloudColor = '#1c1c36';
            cloudOpacity = 0.5;
        }
        cloudWrappers.forEach(({ cloud }) => {
            cloud.style.setProperty('--cc', cloudColor);
            cloud.style.background = cloudColor;
            cloud.parentElement.style.opacity = cloudOpacity;
        });
    }
        const skyStops = [
        { s:0.00, t:[253,133,104], b:[255,223,186] },
        { s:0.25, t:[ 74,144,226], b:[176,216,255] },
        { s:0.55, t:[255, 99, 71], b:[255,215,  0] },
        { s:0.72, t:[ 48, 25, 82], b:[255,105,180] },
        { s:0.88, t:[ 10, 10, 35], b:[ 30, 30, 85] },
        { s:1.00, t:[  3,  3, 15], b:[ 10, 10, 38] },
    ];
    function updateSky(p) {
        let lo = skyStops[0], hi = skyStops[skyStops.length-1];
        for (let i = 0; i < skyStops.length-1; i++) {
            if (p >= skyStops[i].s && p <= skyStops[i+1].s) { lo = skyStops[i]; hi = skyStops[i+1]; break; }
        }
        const r = hi.s === lo.s ? 0 : (p - lo.s) / (hi.s - lo.s);
        const L = (a, b) => Math.round(a + r*(b-a));
        const sky = document.getElementById('sky-layer');
        sky.style.background =
            `linear-gradient(to bottom, rgb(${L(lo.t[0],hi.t[0])},${L(lo.t[1],hi.t[1])},${L(lo.t[2],hi.t[2])}), rgb(${L(lo.b[0],hi.b[0])},${L(lo.b[1],hi.b[1])},${L(lo.b[2],hi.b[2])}))`;
    }
        async function fetchWeather() {
        try {
            const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.6484&longitude=27.8826&current_weather=true');
            const d = await r.json();
            hudWeather.textContent = `${d.current_weather.temperature}°C Kepsut`;
            renderWeather(d.current_weather.weathercode);
        } catch { hudWeather.textContent = 'Çevrimdışı'; }
    }
    function renderWeather(code) {
        const c = document.getElementById('window-weather-container');
        if (!c) return;
        c.innerHTML = '';
        const rain = [51,53,55,61,63,65,80,81,82,95].includes(code);
        const snow = [71,73,75,85,86].includes(code);
        const N = 18;
        if (rain) {
            for (let i = 0; i < N; i++) {
                const d = document.createElement('div');
                d.className = 'weather-rain-line';
                d.style.left = `${Math.random()*100}%`;
                d.style.top  = `${Math.random()*100}%`;
                d.style.animationDelay    = `${Math.random()*0.7}s`;
                d.style.animationDuration = `${0.5 + Math.random()*0.4}s`;
                c.appendChild(d);
            }
        } else if (snow) {
            for (let i = 0; i < N; i++) {
                const d = document.createElement('div');
                d.className = 'weather-snow-flake';
                d.style.left = `${Math.random()*100}%`;
                d.style.top  = `${Math.random()*100}%`;
                d.style.animationDelay    = `${Math.random()*3}s`;
                d.style.animationDuration = `${2 + Math.random()}s`;
                c.appendChild(d);
            }
        }
    }
        document.getElementById('lamp-switch-area').addEventListener('click', () => {
        manualLamp = !manualLamp;
        sndSwitch(!manualLamp);
        lampEls.forEach(l => l.classList.toggle('lamp-active', manualLamp));
    });
        const explored = new Set();
    function checkAchievement(id) {
        explored.add(id);
        hudExplore.textContent = `${explored.size}/10`;
        if (explored.size === 10) {
            const b = document.getElementById('achievement-banner');
            b.classList.add('show');
            setTimeout(() => b.classList.remove('show'), 5000);
        }
    }
        const code = ['s','a','g','o'];
    let ki = 0;
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === code[ki]) {
            ki++;
            if (ki === code.length) {
                ki = 0;
                if (!useSynth) {
                    radioAudio.volume = (globalVolume / 100) * 0.5;
                    radioAudio.play().catch(() => { useSynth = true; startSynth(); });
                } else {
                    startSynth();
                }
                const b = document.getElementById('achievement-sago');
                b.classList.add('show');
                setTimeout(() => b.classList.remove('show'), 5000);
                const audioCtrl = document.querySelector('.hud-audio-control');
                if (audioCtrl) audioCtrl.classList.add('visible');
                const h = document.getElementById('easter-egg-hint');
                h.innerHTML = 'ŞİFRE ÇÖZÜLDÜ: Sagopa Kajmer - Galiba (Chilloutro) Devrede! 🎵';
                h.style.color = '#4caf50';
                document.getElementById('cinematic-overlay').classList.remove('hidden');
                setTimeout(() => {
                    modalTitle.textContent = 'ARDA';
                    detailBtn.classList.add('hidden');
                    modal.classList.remove('hidden');
                    typeWriter('Oyun oynarken, kod yazarken veya sadece boş dururken... Benim için Sagopa Kajmer dinlemek sıradan bir eylem değil, tamamen bir kafa yapısıdır. Ritimlerden ziyade sözlerin anlam ve derinliği etkiliyor beni. Hangi saat olursa olsun, o sözler bana en iyi eşlik eden şeydir.');
                }, 1600);
            }
        } else { ki = 0; }
    });
        window.addEventListener('scroll', () => {
        const max = document.body.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        const p = Math.min(window.scrollY / max, 1);
        if (window.scrollY > 60) document.getElementById('scroll-indicator').style.opacity = '0';
        const totalMins = Math.round(p * 18 * 60);
        let h = Math.floor(totalMins / 60) + 9;
        let m = totalMins % 60;
        if (h >= 24) h -= 24;
        hudTime.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const absH = Math.floor(totalMins / 60) + 9;
        if (p < 0.02) {
            hudStatus.textContent  = 'Güne Başlıyor...';
            hudStatus.style.color  = '#4caf50';
            hudZzz.classList.add('hidden');
        } else if (absH < 13) {
            hudStatus.textContent  = 'Derste veya kod yazıyor.';
            hudStatus.style.color  = '#4caf50';
            hudZzz.classList.add('hidden');
        } else if (absH < 17) {
            hudStatus.textContent  = 'Dışarıda ders çıkışı takılıyor ya da evde içerik tüketiyor.';
            hudStatus.style.color  = '#ffeb3b';
            hudZzz.classList.add('hidden');
        } else if (absH < 21) {
            hudStatus.textContent  = 'Anıl ile FC26 veya CS2 rekabeti dönüyor.';
            hudStatus.style.color  = '#ff9800';
            hudZzz.classList.add('hidden');
        } else if (absH < 24) {
            hudStatus.textContent  = 'Arkadaşlar ile sohbet eşliğinde oyun keyfi.';
            hudStatus.style.color  = '#9c27b0';
            hudZzz.classList.add('hidden');
        } else {
            hudStatus.textContent  = 'Sistem Uyku Modunda.';
            hudStatus.style.color  = '#03a9f4';
            hudZzz.classList.remove('hidden');
        }
        updateSky(p);
        updateClouds(p);
        if (p < 0.18) {
            sunRay.style.opacity = '1';
        } else if (p < 0.35) {
            sunRay.style.opacity = String(1 - (p - 0.18) / 0.17);
        } else {
            sunRay.style.opacity = '0';
        }
        const shouldLamp = p > 0.55;
        if (!manualLamp) lampEls.forEach(l => l.style.opacity = shouldLamp ? '1' : '0');
        screenEls.forEach(s => {
            s.style.background = shouldLamp ? 'rgba(255,80,20,0.2)' : 'rgba(100,160,255,0.18)';
        });
        const showNotes = p > 0.60;
        noteEls.forEach(n => n.style.opacity = showNotes ? '1' : '0');
        const showZzz = p > 0.72;
        zzzEls.forEach(z => z.style.opacity = showZzz ? '1' : '0');
        if (p < 0.50) {
            document.getElementById('stars').style.opacity = '0';
            dayRoom.style.opacity = '1';
        } else {
            const t = (p - 0.50) * 2;
            document.getElementById('stars').style.opacity = String(Math.min(t, 1));
            dayRoom.style.opacity = String(Math.max(1 - t, 0));
        }
        const sunEl = document.getElementById('sun');
        let sunOp = p < 0.35 ? 1 : p < 0.60 ? 1 - (p-0.35)/0.25 : 0;
        sunEl.style.opacity   = String(sunOp);
        sunEl.style.transform = `translateY(${p * 58}vh)`;
        const moonEl = document.getElementById('moon');
        moonEl.style.transform = `translateY(-${p * 75}vh)`;
        moonEl.style.opacity   = String(Math.min(Math.max((p - 0.55)*3, 0), 1));
    });
        function moveAvatar(tx, ty) {
        const curLeft = parseFloat(avatarWrapper.style.left) || 42;
        avatarImg.style.transform = tx > curLeft ? 'scaleX(-1)' : 'scaleX(1)';
        avatarWrapper.classList.add('walking');
        if (stepInterval) { clearInterval(stepInterval); stepInterval = null; }
        let sc = 0;
        sndFootstep();
        stepInterval = setInterval(() => {
            sc++;
            if (sc < 4) sndFootstep();
            else { clearInterval(stepInterval); stepInterval = null; }
        }, 280);
        avatarWrapper.style.left = `calc(${tx}% - 60px)`;
        avatarWrapper.style.top  = `calc(${ty}% - 96px)`;
        const sx = (tx - 25) * 0.12;
        const sy = (ty - 30) * 0.10;
        avatarImg.style.filter = `drop-shadow(${sx}px ${sy}px 5px rgba(0,0,0,0.7))`;
        setTimeout(() => {
            avatarWrapper.classList.remove('walking');
            if (stepInterval) { clearInterval(stepInterval); stepInterval = null; }
        }, 1100);
    }
        walkableFloor.addEventListener('click', e => {
        avatarWrapper.classList.remove('sleeping');
        stopZZZ();
        const rect = roomContainer.getBoundingClientRect();
        const tx = ((e.clientX - rect.left) / rect.width) * 100;
        const ty = ((e.clientY - rect.top)  / rect.height) * 100;
        moveAvatar(tx, ty);
    });
        function spawnHeart() {
        const h = document.createElement('div');
        h.className = 'floating-heart';
        h.textContent = '❤';
        const rc = roomContainer.getBoundingClientRect();
        h.style.left = (rc.width * 0.236) + 'px';
        h.style.top  = (rc.height * 0.824) + 'px';
        roomContainer.appendChild(h);
        setTimeout(() => h.remove(), 1400);
    }
        const content = {
        'computer-area': {
            title: 'ANA ÜS: HP OMEN BİLGİSAYAR',
            text:  'Sistem aktif. Kodlama editörleri, arkadaşlarla sohbet ve oyun sunucuları arka planda çalışıyor.',
            detail: 'Bu ekran, Balıkesir Üniversitesi Bilgisayar Mühendisliği derslerinden çıkıp kendi geliştirdiğim projelere daldığım ana portalım. VS Code açık, Node.js sunucuları ayakta. İşlerim bittiğinde Anıl veya diğer arkadaş gruplarımla CS2 rekabetçi arenasında clutch atmak ya da FC26 ve WWE 2K\'da şampiyonluk yarışına tutuşmak için mükemmel bir makine. Aslında çoğu zaman oyun sadece bir bahane; asıl amaç arkadaşlarla bir araya gelip Discord\'da saatlerce muhabbet etmek, günün yorgunluğunu birlikte atmak.',
            pos: { x:31, y:48 }
        },
        'console-area': {
            title: 'TV & DİZİ KÖŞESİ (CHILLOUT STAGE)',
            text:  'Televizyon ve dinlenme alanı. Netflix üzerinden yabancı ve yerli dizi/film keyfi burada döner.',
            detail: 'Oyun dışındaki zamanlarda kafamı dağıttığım ana ekran burası. Netflix üzerinden yerli ve yabancı yapımları izlemeyi seviyorum. Son dönemde özellikle Breaking Bad evrenine fena kapıldım; diziyi bitirip hemen ardından Better Call Saul gibi bu evrene bağlı diğer kaliteli içeriklerin derinliklerine daldım.',
            pos: { x:52, y:52 }
        },
        'bookshelf-area': {
            title: 'BİLGİ KAYNAĞI: KÜTÜPHANE',
            text:  'Balıkesir Üni. Bilgisayar Mühendisliği ve İstanbul Üni. E-Ticaret müfredatları.',
            detail:'Raflarda iki farklı disiplinin notları çarpışıyor. Bir tarafta C++, mimariler ve algoritmalar, diğer tarafta dijital e-ticaretin stratejileri ve pazar yönetimi. Çift üniversite okumanın getirdiği bu zenginlik beni her gün daha ileriye taşıyor.',
            pos: { x:67, y:48 }
        },
        'board-area': {
            title: 'GÖREV PANOSU (QUEST LOG)',
            text:  'Gelecek vizyonu, yüksek ortalama hedefi ve staj teklif takipleri.',
            detail: 'Geleceğe dair tüm yol haritam buraya raptiyelenmiş. Akademik ortalamamı en üst seviyede tutmak ve yazılım alanındaki staj tekliflerimi, başvurduğum şirketlerin geri dönüş süreçlerini yakından takip etmek şu anki en büyük önceliğim.',
            pos: { x:80, y:48 }
        },
        'bed-area': {
            title: 'CHECKPOINT (YATAK MODÜLÜ)',
            text:  'Zorlu günlerin ve arkadaş grubuyla sabaha kadar süren sohbetlerin ardından sistem dinlenme noktası.',
            detail: '2.05m boyumla bu yatağa sığabilmek bazen kendi içinde bir bulmaca. Ama arkadaşlarla oyun oynamayı bahane edip aslında sadece sabaha kadar muhabbet ettiğimiz, Discord\'da sabahladığımız o uzun gecelerin ardından sistemin reboot edildiği ana sığınak burası. Uykudan feragat edilse de o muhabbetlere her zaman değer.',
            pos: { x:73, y:62 }
        },
        'cat-area': {
            title: 'SİSTEM ASİSTANI (KEDİ)',
            text:  'Odanın efendisi. Kod yazarken klavyeme yatmaktan ve mırlayarak hata ayıklamaktan sorumlu.',
            detail:'Yazılım geliştirirken karşılaştığım en zorlu hatalarda veya Anıl\'a konsol maçlarında yenildiğimde, mırlamasıyla tüm stresimi sıfırlayan sadık yardımcım. Klavyenin üzerinde uyuması dışında kusursuz bir sistem bekçisidir!',
            pos: { x:32, y:76 }
        },
        'radio-area': {
            title: '8-BIT RADYO (MÜZİK KUTUSU)',
            text:  'Radyo aktif. Ruh halime göre her türlü müziği çalabilirim.',
            detail: 'Bu radyo benim ruh halimin bir yansıması. O anki moduma göre enerjik oyun müziklerinden sakin melodilere kadar her şey çalabilir. Kendimi kısıtlamayı sevmem, çalma listem o günkü duygusal durumuma göre şekillenir. (Not: Gizli kod çözüldüğünde ise sentezleyicimiz özel bir melodi çalmaya başlar.)',
            pos: { x:51, y:48 }
        },
        'window-area': {
            title: 'PENCEREDEN MANZARA (KEPSUT)',
            text:  'Dışarıda Kepsut manzarası var. Dış dünyayla tek bağlantı bu pencere.',
            detail: 'Pencereden dışarı bakınca Kepsut manzarası görünüyor. Dürüst olmak gerekirse yaşadığım bu yeri pek sevmiyorum. Ama odamın kapısını kapatıp içeri girdiğimde Kepsut geride kalıyor; orada sadece ben, odam ve kendi dünyam var.',
            pos: { x:36, y:48 }
        },
        'poster-area': {
            title: 'İLHAM DUVARI: POSTERLER',
            text:  'Temel ilgi ve ilham alanlarım: Oyunlar, Beşiktaş, Sagopa Kajmer ve spor (fitness & basketbol).',
            detail: 'Odamın duvarları benim dünyamı yansıtıyor. Hayatımın önemli parçaları olan Beşiktaş\'ın siyah-beyaz renkleri, saatlerce başından kalkmadığım oyun dünyası ve hayata bakışımı şekillendiren Sagopa Kajmer posterleri burada yan yana duruyor. Zihinsel odaklanmanın yanında fiziksel gelişime de önem veriyorum; fitness ve basketbol gibi spor aktiviteleri günün yorgunluğunu atmamda ve formda kalmamda büyük rol oynuyor. Her biri bana ayrı bir ilham veriyor.',
            pos: { x:18, y:48 }
        },
        'coffee-area': {
            title: 'ENERJİ İKSİRİ: KAHVE FİNCANI',
            text:  'Sıcak filtre kahve. Arkadaş grubuyla oyun oynarken de işe yarıyor ama genellikle ders çalışırken veya kod yazarken en büyük odaklanma yakıtı.',
            detail: 'Fincandan süzülen sıcak buhar, zihni açık tutmanın en kolay yolu. Arkadaş grubuyla saatlerce süren oyun seanslarında enerjiyi korumak için birebir olsa da, asıl rolünü kütüphanede ders çalışırken veya gece geç saatlerde algoritma geliştirirken üstleniyor. Bir nevi yazılımcının en temel enerji iksiri.',
            pos: { x:18, y:48 }
        }
    };
        const modal      = document.getElementById('pixel-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText  = document.getElementById('modal-text');
    const detailBtn  = document.getElementById('detail-btn');
    let typeTimer;
    function typeWriter(text, done) {
        modalText.innerHTML = '';
        detailBtn.classList.add('hidden');
        let i = 0;
        clearInterval(typeTimer);
        typeTimer = setInterval(() => {
            if (i < text.length) { modalText.innerHTML += text[i++]; }
            else { clearInterval(typeTimer); if (done) done(); }
        }, 18);
    }
    function closeModal() {
        modal.classList.add('hidden');
        clearInterval(typeTimer);
        document.getElementById('cinematic-overlay').classList.add('hidden');
        if (currentId === 'bed-area') {
            avatarWrapper.classList.remove('sleeping');
            stopZZZ();
        }
    }
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    detailBtn.addEventListener('click', () => {
        if (currentId && content[currentId]) typeWriter(content[currentId].detail);
    });
        document.querySelectorAll('.clickable-item').forEach(el => {
        el.addEventListener('click', e => {
            const id = e.currentTarget.id;
            currentId = id;
            const data = content[id];
            if (id === 'cat-area')     { sndMeow(); spawnHeart(); }
            if (id === 'console-area') toggleTV();
            if (id === 'radio-area')   toggleRadio();
            if (id !== 'bed-area') { avatarWrapper.classList.remove('sleeping'); stopZZZ(); }
            e.currentTarget.classList.remove('needs-click');
            if (id !== 'lamp-switch-area') checkAchievement(id);
            if (data) moveAvatar(data.pos.x, data.pos.y);
            if (data) {
                setTimeout(() => {
                    modalTitle.textContent = data.title;
                    modal.classList.remove('hidden');
                    typeWriter(data.text, () => detailBtn.classList.remove('hidden'));
                    if (id === 'bed-area') {
                        avatarWrapper.classList.add('sleeping');
                        startZZZ();
                    }
                }, 1000);
            }
        });
    });
        buildClouds();
    fillMatrix();
    startSteam();
    fetchWeather();
    const goToNowBtn = document.getElementById('go-to-now-btn');
    if (goToNowBtn) {
        goToNowBtn.addEventListener('click', () => {
            const now = new Date();
            let h = now.getHours() + now.getMinutes() / 60;
            if (h < 9) h += 24; 
            if (h >= 9 && h <= 27) {
                const p = (h - 9) / 18;
                const max = document.body.scrollHeight - window.innerHeight;
                window.scrollTo({ top: p * max, behavior: 'smooth' });
            } else {
                const max = document.body.scrollHeight - window.innerHeight;
                window.scrollTo({ top: max, behavior: 'smooth' });
            }
        });
    }
    function syncToRealTime() {
        const now    = new Date();
        let   h      = now.getHours() + now.getMinutes()/60;
        if (h < 9) h += 24; 
        if (h >= 9 && h <= 27) {
            const p      = (h - 9) / 18;
            const max    = document.body.scrollHeight - window.innerHeight;
            window.scrollTo({ top: p * max, behavior: 'instant' });
        }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
    }));
});