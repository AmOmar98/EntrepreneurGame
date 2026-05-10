/* global React, useTime */
/* SoundTrack — Web Audio synthesized score, synced to Stage timeline.
   Adds a small Sound on/off control bottom-right. */

(function(){
  const { useEffect, useRef, useState, useCallback } = React;

  // Beat schedule (seconds in 45s timeline)
  // kind: 'kick' | 'snare' | 'tick' | 'whoosh' | 'chord' | 'silence-start' | 'silence-end'
  const SCHEDULE = [
    { t: 0.0,  kind: 'pad-start',  note: 'A2' },          // ambient drone in
    { t: 2.5,  kind: 'snare' },                           // "An idea is just an idea."
    { t: 5.0,  kind: 'whoosh' },                          // wipe to "Until you play it."
    { t: 7.0,  kind: 'kick',  vel: 1.0 },                 // title hit
    { t: 8.5,  kind: 'whoosh' },                          // into three roles
    { t: 9.5,  kind: 'kick',  vel: 0.85 },
    { t: 11.2, kind: 'kick',  vel: 0.85 },
    { t: 13.5, kind: 'kick',  vel: 1.0 },                 // montage starts
    // 4-on-the-floor through montage 13.5–22.0
    ...Array.from({length: 17}, (_, i) => ({ t: 13.5 + i*0.5, kind: 'tick', vel: 0.5 + (i*0.02) })),
    { t: 22.0, kind: 'pad-duck' },                        // music ducks for silence
    { t: 22.0, kind: 'piano', note: 'E5' },               // single piano note (room quiets)
    { t: 24.5, kind: 'silence-start' },                   // total silence
    { t: 28.0, kind: 'silence-end' },                     // back in
    { t: 28.0, kind: 'snare' },                           // convergence punch
    { t: 29.0, kind: 'pad-swell' },                       // pitch swell
    { t: 33.5, kind: 'kick',  vel: 1.1 },                 // award climax
    { t: 33.5, kind: 'cymbal' },
    { t: 36.5, kind: 'tick',  vel: 0.4 },                 // pixel
    { t: 38.0, kind: 'chord', note: 'F3' },               // CTA — calm
    { t: 41.0, kind: 'chord', note: 'A3' },
  ];

  const NOTE_HZ = { 'A2': 110, 'E3': 165, 'F3': 175, 'A3': 220, 'C4': 261.63, 'E4': 329.63, 'E5': 659.25 };

  window.SoundTrack = function SoundTrack() {
    const [enabled, setEnabled] = useState(false);
    const [needsTap, setNeedsTap] = useState(true);
    const ctxRef = useRef(null);
    const padRef = useRef(null);   // { osc, gain }
    const lastTRef = useRef(0);
    const t = useTime();

    const ensureCtx = useCallback(() => {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
      return ctxRef.current;
    }, []);

    const startPad = useCallback((note='A2') => {
      const ctx = ensureCtx();
      if (padRef.current) return;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 800;
      osc.type = 'sine'; osc.frequency.value = NOTE_HZ[note] || 110;
      osc2.type = 'triangle'; osc2.frequency.value = (NOTE_HZ[note] || 110) * 1.5;
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.6);
      osc.connect(filt); osc2.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc2.start();
      padRef.current = { osc, osc2, gain };
    }, [ensureCtx]);

    const stopPad = useCallback(() => {
      if (!padRef.current) return;
      const { osc, osc2, gain } = padRef.current;
      const ctx = ctxRef.current;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => { try { osc.stop(); osc2.stop(); } catch(e){} }, 400);
      padRef.current = null;
    }, []);

    const duckPad = useCallback((to=0.012) => {
      if (!padRef.current) return;
      const ctx = ctxRef.current;
      padRef.current.gain.gain.cancelScheduledValues(ctx.currentTime);
      padRef.current.gain.gain.linearRampToValueAtTime(to, ctx.currentTime + 0.4);
    }, []);

    const swellPad = useCallback(() => {
      if (!padRef.current) return;
      const ctx = ctxRef.current;
      padRef.current.gain.gain.cancelScheduledValues(ctx.currentTime);
      padRef.current.gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.5);
    }, []);

    const playKick = useCallback((vel=1) => {
      const ctx = ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.6 * vel, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }, [ensureCtx]);

    const playSnare = useCallback(() => {
      const ctx = ensureCtx();
      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = noiseBuf;
      const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 1500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      noise.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      noise.start(); noise.stop(ctx.currentTime + 0.2);
    }, [ensureCtx]);

    const playTick = useCallback((vel=0.5) => {
      const ctx = ensureCtx();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06 * vel, ctx.currentTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.06);
    }, [ensureCtx]);

    const playWhoosh = useCallback(() => {
      const ctx = ensureCtx();
      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i/data.length);
      const noise = ctx.createBufferSource(); noise.buffer = noiseBuf;
      const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
      filt.frequency.setValueAtTime(400, ctx.currentTime);
      filt.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.5);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      noise.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      noise.start(); noise.stop(ctx.currentTime + 0.6);
    }, [ensureCtx]);

    const playPiano = useCallback((note='E5') => {
      const ctx = ensureCtx();
      const f = NOTE_HZ[note] || 660;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 1.7);
    }, [ensureCtx]);

    const playChord = useCallback((root='F3') => {
      const ctx = ensureCtx();
      const f = NOTE_HZ[root] || 175;
      [1, 1.25, 1.5].forEach((mul, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f * mul;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 3.1);
      });
    }, [ensureCtx]);

    const playCymbal = useCallback(() => {
      const ctx = ensureCtx();
      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const noise = ctx.createBufferSource(); noise.buffer = noiseBuf;
      const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 5000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      noise.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      noise.start(); noise.stop(ctx.currentTime + 0.65);
    }, [ensureCtx]);

    // Detect time crossings — fire scheduled events when t crosses their boundary
    useEffect(() => {
      if (!enabled) return;
      const prev = lastTRef.current;
      const curr = t;
      // handle loop wrap: if curr < prev, treat as reset
      const looped = curr < prev - 0.5;
      SCHEDULE.forEach(ev => {
        const fired = looped
          ? (curr >= ev.t && ev.t <= curr) // first frame after loop, fire all up to curr
          : (prev < ev.t && curr >= ev.t);
        if (!fired) return;
        switch (ev.kind) {
          case 'pad-start':     startPad(ev.note); break;
          case 'pad-duck':      duckPad(); break;
          case 'pad-swell':     swellPad(); break;
          case 'kick':          playKick(ev.vel || 1); break;
          case 'snare':         playSnare(); break;
          case 'tick':          playTick(ev.vel || 0.5); break;
          case 'whoosh':        playWhoosh(); break;
          case 'piano':         playPiano(ev.note); break;
          case 'chord':         playChord(ev.note); break;
          case 'cymbal':        playCymbal(); break;
          case 'silence-start': duckPad(0.0001); break;
          case 'silence-end':   if (padRef.current){ const c = ctxRef.current; padRef.current.gain.gain.linearRampToValueAtTime(0.045, c.currentTime + 0.3); } break;
        }
      });
      // on loop, restart pad if needed
      if (looped && enabled && !padRef.current) startPad('A2');
      lastTRef.current = curr;
    }, [t, enabled, startPad, duckPad, swellPad, playKick, playSnare, playTick, playWhoosh, playPiano, playChord, playCymbal]);

    const toggle = useCallback(() => {
      if (!enabled) {
        ensureCtx();
        setEnabled(true);
        setNeedsTap(false);
        startPad('A2');
      } else {
        setEnabled(false);
        stopPad();
      }
    }, [enabled, ensureCtx, startPad, stopPad]);

    return (
      <button
        onClick={toggle}
        style={{
          position:'absolute', bottom: 60, right: 16, zIndex: 90,
          background: enabled ? 'rgba(46,125,50,0.9)' : 'rgba(15,26,42,0.85)',
          color: '#F6F1E8',
          border: '1px solid rgba(246,241,232,0.3)',
          borderRadius: 999,
          padding: '8px 14px',
          fontFamily: 'Montserrat, system-ui, sans-serif',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.16em',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: enabled ? '#4CAF50' : 'rgba(246,241,232,0.5)',
          boxShadow: enabled ? '0 0 8px #4CAF50' : 'none',
        }}/>
        {enabled ? 'SOUND · ON' : (needsTap ? 'TAP FOR SOUND' : 'SOUND · OFF')}
      </button>
    );
  };
})();
