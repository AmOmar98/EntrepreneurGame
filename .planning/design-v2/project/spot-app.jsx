/* global React, ReactDOM,
   Stage, Sprite, useSprite, useTime, Easing, BRAND,
   Scene1ColdOpen, Scene2Manifesto1, Scene3Manifesto2, Scene4Title,
   Scene5ThreeRoles, Scene6Montage, Scene7Converge, Scene8Pitch,
   Scene9Award, Scene10Pixel, Scene11CTA */

const { useEffect, useState } = React;

/* Top-of-frame slate during 0–1s (faux production marker) */
function Slate() {
  const t = useTime();
  if (t > 1.0) return null;
  const op = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
  return (
    <div style={{
      position:'absolute', inset:0, background:'#0a0a0a', opacity: op, zIndex: 60,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      color:'#F6F1E8', fontFamily: "ui-monospace, Menlo, monospace",
    }}>
      <div style={{fontSize: 16, letterSpacing:'0.32em', color:'rgba(246,241,232,0.5)'}}>EIC · UEMF</div>
      <div style={{fontSize: 110, fontWeight: 500, marginTop: 24, letterSpacing:'-0.02em'}}>
        ENT · 45s
      </div>
      <div style={{fontSize: 14, letterSpacing:'0.22em', color:'rgba(246,241,232,0.4)', marginTop: 30}}>
        TAKE 01 · ROLL ·  ●
      </div>
    </div>
  );
}

/* Beat indicator (subtle): four corner ticks at every 4s mark */
function BeatPulse() {
  const t = useTime();
  // pulse near each integer beat boundary (every 1s)
  const beat = t - Math.floor(t);
  const pulse = beat < 0.08 ? 1 - beat / 0.08 : 0;
  if (pulse < 0.05) return null;
  return null; // disabled — too noisy. kept hook for future.
}

/* Top-bar with film grain feel: timecode + bars in corners */
function FilmChrome() {
  const t = useTime();
  const totalCS = Math.floor(t * 100);
  const cs = totalCS % 100;
  const sec = Math.floor(t) % 60;
  const min = Math.floor(t / 60);
  const tc = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}:${String(cs).padStart(2,'0')}`;
  return (
    <>
      {/* timecode top-right */}
      <div style={{
        position:'absolute', top:24, right:30, zIndex: 70,
        fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12,
        color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em',
        background:'rgba(0,0,0,0.18)', padding:'4px 10px', borderRadius:4,
        backdropFilter:'blur(2px)', mixBlendMode:'difference',
      }}>● REC · {tc}</div>
      {/* corner crop marks */}
      {[
        {top:24, left:30,  rot:0},
        {top:24, right:120, rot:90},
        {bottom:24, left:30, rot:-90},
        {bottom:24, right:30, rot:180},
      ].map((p, i) => (
        <div key={i} style={{position:'absolute', ...p, zIndex: 70, mixBlendMode:'difference', opacity:0.35, transform:`rotate(${p.rot}deg)`}}>
          <svg width="22" height="22" viewBox="0 0 22 22"><path d="M2 2 L2 10 M2 2 L10 2" stroke="#fff" strokeWidth="1.4" fill="none"/></svg>
        </div>
      ))}
    </>
  );
}

/* Main composition. Total = 45s with dynamic pacing. */
function Spot() {
  return (
    <Stage
      width={1920} height={1080}
      duration={45} loop={true} autoplay={true}
      background={BRAND.ivory}
      persistKey="entgame_spot"
    >
      {/* base ivory bg */}
      <div style={{position:'absolute', inset:0, background: BRAND.ivory}}/>

      {/* Scenes timeline — dynamic: calm → accelerating pitch → climax → calm CTA */}
      <Sprite start={0}      end={2.5}>  <Scene1ColdOpen/>     </Sprite>
      <Sprite start={2.5}    end={5.0}>  <Scene2Manifesto1/>   </Sprite>
      <Sprite start={5.0}    end={7.0}>  <Scene3Manifesto2/>   </Sprite>
      <Sprite start={7.0}    end={8.5}>  <Scene4Title/>        </Sprite>
      <Sprite start={8.5}    end={13.5}> <Scene5ThreeRoles/>   </Sprite>
      <Sprite start={13.5}   end={28.0}> <Scene6Montage/>      </Sprite>
      <Sprite start={28.0}   end={29.0}> <Scene7Converge/>     </Sprite>
      <Sprite start={29.0}   end={33.5}> <Scene8Pitch/>        </Sprite>
      <Sprite start={33.5}   end={36.5}> <Scene9Award/>        </Sprite>
      <Sprite start={36.5}   end={38.0}> <Scene10Pixel/>       </Sprite>
      <Sprite start={38.0}   end={45.01}><Scene11CTA/>         </Sprite>

      {/* Background score (Web Audio, synced to timeline) */}
      <SoundTrack/>

      {/* Film chrome (timecode, crop marks) over everything */}
      <FilmChrome/>

      {/* Subtle vignette over the canvas */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex: 65,
        boxShadow: 'inset 0 0 220px rgba(0,0,0,0.18)',
      }}/>
      {/* film grain */}
      <FilmGrain/>
    </Stage>
  );
}

function FilmGrain() {
  const t = useTime();
  // shift bg-position pseudo-randomly for a flicker
  const x = Math.floor((t * 47) % 100);
  const y = Math.floor((t * 71) % 100);
  return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none', zIndex: 64,
      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
      backgroundSize: '180px 180px',
      backgroundPosition: `${x}px ${y}px`,
      mixBlendMode: 'overlay',
      opacity: 0.18,
    }}/>
  );
}

/* ---------------- Recorder (tab capture → webm/mp4) ---------------- */
function Recorder() {
  const [state, setState] = useState('idle'); // idle | arming | recording | done
  const [msg, setMsg] = useState('');

  async function record() {
    try {
      setState('arming');
      setMsg('Choose this tab in the picker…');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60, width: 1920, height: 1080 },
        audio: true,
        // @ts-ignore — Chrome hint to preselect current tab
        preferCurrentTab: true,
      });
      // Pick the best mime
      const candidates = [
        'video/mp4;codecs=avc1.640028',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mime = candidates.find(c => MediaRecorder.isTypeSupported(c)) || '';
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
      const chunks = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Entrepreneur Game - 45s Spot.${ext}`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
        setState('done'); setMsg(`Saved as .${ext}`);
        setTimeout(() => setState('idle'), 4000);
      };

      rec.start();
      setState('recording');
      setMsg('Recording 45s…');
      setTimeout(() => { try { rec.stop(); } catch (e) {} }, 45_500);
    } catch (e) {
      setState('idle');
      setMsg(e.message || 'Recording cancelled');
      setTimeout(() => setMsg(''), 3000);
    }
  }

  const labels = {
    idle: '● RECORD MP4',
    arming: '○ PICK TAB…',
    recording: '● RECORDING',
    done: '✓ SAVED',
  };

  return (
    <div style={{
      position:'fixed', top: 16, left: 16, zIndex: 999,
      display:'flex', flexDirection:'column', gap: 6, alignItems:'flex-start',
      fontFamily: "ui-monospace, Menlo, monospace",
    }}>
      <button
        onClick={record}
        disabled={state === 'recording' || state === 'arming'}
        style={{
          padding: '10px 16px', fontSize: 12, fontWeight: 700, letterSpacing:'0.18em',
          background: state === 'recording' ? '#C44536' : '#0F1A2A',
          color: '#F6F1E8', border: 'none', borderRadius: 6, cursor: 'pointer',
          opacity: state === 'arming' ? 0.7 : 1,
        }}
      >{labels[state]}</button>
      {msg && (
        <div style={{
          fontSize: 11, letterSpacing:'0.08em', color:'#F6F1E8',
          background:'rgba(15,26,42,0.8)', padding:'5px 9px', borderRadius:4,
          maxWidth: 280,
        }}>{msg}</div>
      )}
    </div>
  );
}

function Root() {
  return <><Spot/><Recorder/></>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
