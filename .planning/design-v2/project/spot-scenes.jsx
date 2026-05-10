/* global React, useTime, useSprite, Sprite, Easing, interpolate, animate, clamp,
   BRAND, FONT_HEAD, FONT_BODY, FONT_MONO,
   Letterbox, Kicker, BrandE, EICLogo, SerifHeadline, WipeBg, DotGrid,
   PhoneShell, BrowserShell, Confetti, PixelDog,
   MissionCard, MentorReview, GMDashboard, PitchScreen */

const { useMemo: _u } = React;

/* ============================================================
   v2 — punchier pacing, whip-pans, micro-cuts, match-cut circle.
   Stage = 60s. New timeline:
     0.0 – 2.5   S1  Cold open question
     2.5 – 6.0   S2  "An idea is just an idea." (typed)
     6.0 – 9.0   S3  "Until you play it."
     9.0 – 11.5  S4  Title (Entrepreneur Game)
    11.5 – 18.5  S5  Three roles via WHIP-PAN
    18.5 – 37.5  S6  UI montage — 19 micro-cuts
    37.5 – 40.5  S7  Convergence
    40.5 – 47.5  S8  Pitch (silent beat)
    47.5 – 52.0  S9  Award
    52.0 – 55.5  S10 Pixel
    55.5 – 60.0  S11 CTA + end-frame echo
   ============================================================ */

/* ---- helpers (inline for v2) -------------------------------- */

// Single-frame brand color flash at hard cuts
window.FlashAt = function FlashAt({ at, color = '#fff', dur = 0.06 }) {
  const t = useTime();
  if (Math.abs(t - at) > dur) return null;
  const op = 1 - Math.abs(t - at) / dur;
  return <div style={{position:'absolute', inset:0, background: color, opacity: op, zIndex: 80, pointerEvents:'none'}}/>;
};

// Typewriter that supports a delete-then-replace
window.Typewriter = function Typewriter({ text, x, y, size = 200, color = BRAND.ink, italic, weight = 600, charDur = 0.04, startAt = 0, hold = 0, deleteAt = null, replaceWith = null, deleteDur = null }) {
  const { localTime } = useSprite();
  let shown = '';
  if (localTime > startAt) {
    const charsTyped = Math.min(text.length, Math.floor((localTime - startAt) / charDur));
    shown = text.slice(0, charsTyped);
  }
  let mode = 'typing';
  if (deleteAt != null && localTime > deleteAt) {
    const dDur = deleteDur != null ? deleteDur : charDur * 0.6 * text.length;
    const dT = clamp((localTime - deleteAt) / dDur, 0, 1);
    const charsLeft = Math.max(0, Math.floor(text.length * (1 - dT)));
    shown = text.slice(0, charsLeft);
    mode = 'deleting';
    if (replaceWith && charsLeft === 0) {
      const r = clamp((localTime - deleteAt - dDur) / (charDur * replaceWith.length), 0, 1);
      shown = replaceWith.slice(0, Math.floor(replaceWith.length * r));
    }
  }
  const caretBlink = Math.floor(localTime * 2.6) % 2 === 0;
  return (
    <div style={{
      position:'absolute', left:x, top:y,
      fontFamily: FONT_HEAD, fontSize: size,
      fontStyle: italic ? 'italic' : 'normal',
      fontWeight: weight,
      color, lineHeight: 1, letterSpacing: '-0.025em',
      whiteSpace: 'pre',
    }}>
      {shown}
      <span style={{display:'inline-block', width: size*0.04, height: size*0.78, background: color, marginLeft: size*0.02, opacity: caretBlink ? 1 : 0.15, verticalAlign:'baseline', transform:'translateY(8%)'}}/>
    </div>
  );
};

// Marquee kicker tape — "● PLAYER · MOBILE · " repeated, scrolling
window.MarqueeKicker = function MarqueeKicker({ text, color = BRAND.ink, bg = 'transparent', y = 80, size = 18, opacity = 1 }) {
  const { localTime } = useSprite();
  const offset = (localTime * 80) % 400;
  const tape = (text + ' · ').repeat(20);
  return (
    <div style={{
      position:'absolute', left:0, right:0, top:y,
      overflow:'hidden', height: size + 16,
      background: bg, opacity,
      borderTop: bg === 'transparent' ? 'none' : '1px solid rgba(255,255,255,0.15)',
      borderBottom: bg === 'transparent' ? 'none' : '1px solid rgba(255,255,255,0.15)',
      display:'flex', alignItems:'center',
    }}>
      <div style={{
        whiteSpace:'nowrap',
        transform:`translateX(${-offset}px)`,
        fontFamily: FONT_BODY, fontWeight: 800, fontSize: size,
        letterSpacing:'0.28em', color, textTransform:'uppercase',
      }}>{tape}</div>
    </div>
  );
};

// Match-cut circle — same circle persists across scenes
window.MatchCircle = function MatchCircle({ x, y, r, color = BRAND.green, stroke = 6, fill = 'transparent', opacity = 1, dash = null }) {
  return (
    <svg style={{position:'absolute', left: x - r - stroke, top: y - r - stroke, width: (r + stroke)*2, height: (r + stroke)*2, opacity, pointerEvents:'none'}}>
      <circle cx={r + stroke} cy={r + stroke} r={r} fill={fill} stroke={color} strokeWidth={stroke} strokeDasharray={dash || ''}/>
    </svg>
  );
};

/* ============================================================
   SCENES
   ============================================================ */

/* S1 (0–2.5) Cold open — the question */
window.Scene1ColdOpen = function Scene1ColdOpen() {
  const { localTime, duration } = useSprite();
  const exitT = clamp((localTime - (duration - 0.3))/0.3, 0, 1);
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.ivory, opacity: 1 - exitT}}>
      <DotGrid color={BRAND.ink} opacity={0.05} gap={36}/>
      <Kicker text="● AGREENTECH 2026 · UEMF" color={BRAND.green} x={120} y={100} size={14} opacity={clamp(localTime/0.3,0,1)}/>
      <Typewriter
        text="What would you build,"
        x={120} y={420} size={140} color={BRAND.ink}
        startAt={0.15} charDur={0.022}
      />
      <Sprite start={1.05} end={duration} keepMounted>
        <Typewriter
          text="if you had two days?"
          x={120} y={580} size={140} color={BRAND.amber} italic
          startAt={0.0} charDur={0.022}
        />
      </Sprite>
      {/* match-cut circle seed (will reappear) */}
      <FlashAt at={duration - 0.05} color={BRAND.ivory}/>
    </div>
  );
};

/* S2 (2.5–6.0) "An idea is just an idea." typed + deleted */
window.Scene2Manifesto1 = function Scene2Manifesto1() {
  const { localTime, duration } = useSprite();
  const exitT = clamp((localTime - (duration - 0.25))/0.25, 0, 1);
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.ivory, opacity: 1 - exitT}}>
      <DotGrid color={BRAND.ink} opacity={0.04} gap={36}/>
      <Kicker text="—— THE PROMISE" color={BRAND.muted} x={120} y={100} size={13}/>
      <Typewriter
        text="An idea is "
        x={120} y={440} size={210} color={BRAND.ink}
        startAt={0.05} charDur={0.035}
      />
      <Sprite start={0.55} end={duration} keepMounted>
        <Typewriter
          text="just an idea."
          x={120} y={680} size={210} color={BRAND.amber} italic
          startAt={0.0} charDur={0.04}
        />
      </Sprite>
      {/* hand-drawn underline under "idea" */}
      <Sprite start={2.4} end={duration} keepMounted>
        <SwipeLine x={780} y={660} w={420} color={BRAND.amber} dur={0.5}/>
      </Sprite>
    </div>
  );
};

window.SwipeLine = function SwipeLine({ x, y, w, color, dur = 0.5, h = 6 }) {
  const { localTime } = useSprite();
  const t = clamp(localTime / dur, 0, 1);
  return (
    <div style={{position:'absolute', left:x, top:y, width: w * Easing.easeOutCubic(t), height:h, background: color, borderRadius: h, transform:`skewX(-12deg)`, transformOrigin:'left'}}/>
  );
};

/* S3 (6.0–9.0) "Until you play it." green wipe */
window.Scene3Manifesto2 = function Scene3Manifesto2() {
  const { localTime, duration } = useSprite();
  const wipe = Easing.easeInOutCubic(clamp(localTime / 0.32, 0, 1));
  const exitT = clamp((localTime - (duration - 0.25))/0.25, 0, 1);
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.green, opacity: 1 - exitT}}>
      {/* wipe over from previous ivory */}
      <div style={{position:'absolute', inset:0, background: BRAND.ivory, clipPath: `inset(0 0 0 ${wipe*100}%)`}}/>
      <Kicker text="● PLAY IT" color="rgba(246,241,232,0.55)" x={120} y={100} size={13} opacity={clamp((localTime - 0.4)/0.3, 0, 1)}/>
      <SerifHeadline
        x={120} y={420}
        size={260}
        words={[
          { text: 'Until', italic: false, color: 'rgba(246,241,232,0.78)' },
          { text: 'you', italic: false, color: 'rgba(246,241,232,0.78)' },
          { text: 'play', italic: true, color: BRAND.ivory },
          { text: 'it.', italic: false, color: 'rgba(246,241,232,0.78)' },
        ]}
        staggerStart={0.4}
        staggerStep={0.12}
        exitAt={duration - 0.3}
        exitDur={0.25}
        baseColor={BRAND.ivory}
      />
      <FlashAt at={duration - 0.05} color={BRAND.ivory}/>
    </div>
  );
};

/* S4 (9.0–11.5) Title */
window.Scene4Title = function Scene4Title() {
  const { localTime, duration } = useSprite();
  const t1 = clamp(localTime / 0.4, 0, 1);
  const e = Easing.easeOutBack(t1);
  const exitT = clamp((localTime - (duration - 0.3))/0.3, 0, 1);
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.blue, color:'#fff', opacity: 1 - exitT}}>
      <div style={{position:'absolute', left:0, top:540, height:1, background:BRAND.greenL, width: `${clamp((localTime-0.15)/0.5, 0, 1) * 100}%`, opacity: 0.5}}/>
      <div style={{position:'absolute', left:1920/2, top:340, transform:`translate(-50%, ${(1-e)*30}px) scale(${0.7+0.3*e})`, opacity: t1}}>
        <EICLogo size={140} color="#F6F1E8" dot={BRAND.greenL}/>
      </div>
      <div style={{position:'absolute', left:1920/2, top:560, transform:`translate(-50%, ${(1-clamp((localTime-0.25)/0.5, 0, 1))*40}px)`, opacity: clamp((localTime-0.25)/0.5, 0, 1), fontFamily:FONT_HEAD, fontSize:210, fontWeight:600, letterSpacing:'-0.025em', whiteSpace:'nowrap'}}>Entrepreneur Game</div>

      <FlashAt at={duration - 0.05} color={BRAND.blue}/>
    </div>
  );
};

/* S5 (11.5–18.5) Three roles via WHIP-PAN — one wide world */
window.Scene5ThreeRoles = function Scene5ThreeRoles() {
  const { localTime, duration } = useSprite();
  // (legacy panX removed — new 5s panX defined below)
  const _legacy = interpolate(
    [0, 2.0, 2.35, 4.4, 4.75, 6.8],
    [0, 0, -1920, -1920, -3840, -3840],
    [Easing.linear, Easing.easeInOutCubic, Easing.linear, Easing.easeInOutCubic, Easing.linear]
  )(localTime);
  // motion blur via stretch when panning
  // 5-second window: PLAYER hold → whip → MENTOR hold → whip → GAMEMASTER hold → exit
  // pan keyframes
  const panX = interpolate(
    [0, 1.5, 1.95, 3.0, 3.45, 5.0],
    [0, 0, -1920, -1920, -3840, -3840],
    Easing.easeInOutCubic
  )(localTime);

  // motion blur peaks during the two whips
  const speed = Math.abs(
    interpolate([0, 1.5, 1.72, 1.95, 3.0, 3.22, 3.45, 5.0], [0, 0, 1, 0, 0, 1, 0, 0])(localTime)
  );
  const blur = speed * 14;

  const cols = [
    { kicker:'PLAYER',     title:'I play.',   bg: BRAND.blue,  fg:'#F6F1E8', accent: BRAND.greenL },
    { kicker:'MENTOR',     title:'I mentor.', bg: BRAND.green, fg:'#F6F1E8', accent: BRAND.amber  },
    { kicker:'GAMEMASTER', title:'I run it.', bg: BRAND.red,   fg:'#F6F1E8', accent: BRAND.amber  },
  ];

  const exitT = clamp((localTime - (duration - 0.25))/0.25, 0, 1);

  return (
    <div style={{position:'absolute', inset:0, background:'#000', overflow:'hidden', opacity: 1 - exitT}}>
      <div style={{
        position:'absolute', left:0, top:0, width: 1920*3, height: 1080,
        transform: `translateX(${panX}px)`,
        filter: `blur(${blur}px)`,
        willChange:'transform, filter',
        display:'flex',
      }}>
        {cols.map((c, i) => (
          <div key={i} style={{width:1920, height:1080, background:c.bg, color:c.fg, position:'relative', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', padding:'0 140px', gap:32}}>
            <div style={{display:'flex', alignItems:'center', gap:20}}>
              <div style={{width:60, height:5, background:c.accent}}/>
              <div style={{fontFamily:FONT_BODY, fontWeight:800, fontSize:22, letterSpacing:'0.32em'}}>{c.kicker}</div>
            </div>
            <div style={{fontFamily:FONT_HEAD, fontSize:340, fontWeight:600, letterSpacing:'-0.03em', lineHeight:0.92, whiteSpace:'nowrap'}}>{c.title}</div>
          </div>
        ))}
      </div>
      <FlashAt at={1.72} color="#fff" dur={0.04}/>
      <FlashAt at={3.22} color="#fff" dur={0.04}/>
      <FlashAt at={duration - 0.05} color={BRAND.ivory}/>
    </div>
  );
};

/* S6 (18.5–37.5) UI MONTAGE — ~19 micro-cuts */
window.Scene6Montage = function Scene6Montage() {
  const { localTime, duration } = useSprite();

  // Cut schedule: array of {start, kind, payload, color}
  // total 19s, cut every 0.85–1.4s (avg ~1.0)
  // Cut schedule — dynamic pacing:
  //   s 0.0–8.0   build (player → mentor → GM)  ~0.7–0.9s/cut
  //   s 8.0–10.5  PITCH timer ACCELERATES        0.5 → 0.4 → 0.3s/cut
  //   s 10.5–11.0 audience snap                  0.5s
  //   s 11.0–12.5 "the room goes quiet" — held   1.5s
  //   s 12.5–14.5 SILENCE — extended calm        2.0s
  // Simplified: ~10 cuts instead of 25. One beat per movement.
  const cuts = [
    { s:0.0,  k:'kicker',    text:'PLAYER',  color: BRAND.blue },
    { s:0.0,  k:'phone-mission' },
    { s:1.8,  k:'phone-checklist', tick:3, easter:true },
    { s:3.4,  k:'kicker',     text:'MENTOR', color: BRAND.green },
    { s:3.4,  k:'mentor',     hi:true },
    { s:5.2,  k:'kicker',     text:'GAMEMASTER', color: BRAND.red },
    { s:5.2,  k:'gm-stats' },
    { s:7.0,  k:'kicker',     text:'PITCH', color: BRAND.amber, bg:'#0F1A2A' },
    { s:7.0,  k:'timer',      val:'2:14', color: BRAND.amber, bg:'#0F1A2A' },
    { s:8.6,  k:'timer',      val:'0:09', color: BRAND.red,   bg:'#0F1A2A' },
    { s:10.2, k:'audience',   bg:'#0F1A2A', fg:'#F6F1E8' },
    { s:12.6, k:'silence',    bg:'#0F1A2A', fg:'#F6F1E8' },
  ];

  // determine current cut
  const i = cuts.reduce((acc, c, idx) => (localTime >= c.s ? idx : acc), 0);
  const cur = cuts[i];
  const next = cuts[i+1];
  const cutDur = (next ? next.s : duration) - cur.s;
  const tInCut = localTime - cur.s;
  const enterT = clamp(tInCut / 0.18, 0, 1);
  const exitStart = cutDur - 0.12;
  const exitT = clamp((tInCut - exitStart) / 0.12, 0, 1);
  const opacity = enterT * (1 - exitT);

  // pick bg
  const bg = cur.bg || BRAND.ivory;
  const fg = cur.fg || BRAND.ink;

  return (
    <div style={{position:'absolute', inset:0, background: bg, color: fg, overflow:'hidden'}}>
      {bg === BRAND.ivory && <DotGrid color={BRAND.ink} opacity={0.04} gap={32}/>}

      {/* persistent kicker for the active "movement" */}
      <Kicker
        text={cuts.filter(c => c.k === 'kicker' && c.s <= localTime).slice(-1)[0]?.text || ''}
        color={cuts.filter(c => c.k === 'kicker' && c.s <= localTime).slice(-1)[0]?.color || BRAND.muted}
        x={120} y={100} size={16}
        opacity={1}
      />
      <div style={{position:'absolute', inset:0, opacity}}>
        {renderCut(cur, tInCut, cutDur)}
      </div>

      {/* chromatic flash at every hard cut */}
      {cuts.slice(1).map((c, idx) => <FlashAt key={idx} at={c.s} color={c.bg === '#0F1A2A' ? '#0F1A2A' : '#fff'} dur={0.05}/>)}
    </div>
  );
};

function renderCut(cur, tInCut, cutDur) {
  const k = cur.k;
  if (k === 'phone-mission') {
    const sc = 0.96 + 0.04 * Easing.easeOutCubic(clamp(tInCut/0.4, 0, 1));
    return (
      <>
        <div style={{position:'absolute', left:140, top: 360, fontFamily:FONT_HEAD, fontSize:170, fontWeight:600, color: BRAND.ink, lineHeight:0.95, letterSpacing:'-0.025em'}}>
          A <em style={{color:BRAND.blueL}}>mission.</em>
        </div>
        <div style={{position:'absolute', left: 1920/2 + 360 - 230, top: 1080/2 - 471, width:460, height:942, transform:`scale(${sc})`, transformOrigin:'center'}}>
          <PhoneShell x={0} y={0} w={460}>
            <MissionCard progress={clamp((tInCut)/0.9, 0, 1)}/>
          </PhoneShell>
        </div>
      </>
    );
  }
  if (k === 'phone-checklist') {
    const phoneW = 520, phoneH = phoneW * 2.05;
    const px = 1920/2 - phoneW/2, py = 1080/2 - phoneH/2;
    return (
      <>
        <div style={{position:'absolute', left: px, top: py, width: phoneW, height: phoneH}}>
          <PhoneShell x={0} y={0} w={phoneW}>
            <MissionCard progress={0.4 + cur.tick * 0.2}/>
          </PhoneShell>
        </div>
        {/* big tick badge */}
        <div style={{position:'absolute', left: px + phoneW - 60, top: py - 70, fontFamily:FONT_HEAD, fontSize:140, fontWeight: 600, color: BRAND.green, transform:`scale(${0.7 + 0.3 * Easing.easeOutBack(clamp(tInCut/0.3, 0, 1))})`}}>
          ✓
        </div>
        {/* PIXEL EASTER EGG */}
        {cur.easter && (
          <div style={{position:'absolute', left: px - 200, top: py + 720, opacity: clamp(tInCut/0.25, 0, 1) * (1 - clamp((tInCut - 0.55)/0.25, 0, 1)), display:'flex', alignItems:'center', gap:18}}>
            <PixelDog size={180}/>
            <div style={{fontFamily:FONT_HEAD, fontStyle:'italic', fontSize:30, color:BRAND.muted, whiteSpace:'nowrap'}}>« hi. »</div>
          </div>
        )}
      </>
    );
  }
  if (k === 'mentor') {
    const w = 1280, h = 720;
    const sc = 0.94 + 0.06 * Easing.easeOutCubic(clamp(tInCut/0.4, 0, 1));
    return (
      <div style={{position:'absolute', left: 1920/2 - w/2, top: 1080/2 - h/2, width:w, height:h, transform:`scale(${sc})`, transformOrigin:'center'}}>
        <BrowserShell x={0} y={0} w={w} h={h}>
          <MentorReview progress={cur.hi ? 0.85 : 0.4}/>
        </BrowserShell>
      </div>
    );
  }
  if (k === 'big-quote') {
    return (
      <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', padding:'0 140px'}}>
        <div style={{fontFamily:FONT_HEAD, fontSize: 280, fontWeight:600, lineHeight:0.92, letterSpacing:'-0.03em', color: cur.color, transform: `translateY(${(1 - Easing.easeOutCubic(clamp(tInCut/0.3, 0, 1))) * 30}px)`}}>{cur.text}</div>
        <div style={{fontFamily:FONT_HEAD, fontSize: 280, fontWeight:600, fontStyle: cur.italic ? 'italic' : 'normal', lineHeight:0.92, letterSpacing:'-0.03em', color: cur.color, transform: `translateY(${(1 - Easing.easeOutCubic(clamp((tInCut - 0.18)/0.3, 0, 1))) * 30}px)`, opacity: clamp((tInCut - 0.1)/0.3, 0, 1)}}>{cur.second}</div>
      </div>
    );
  }
  if (k === 'badge') {
    const e = Easing.easeOutBack(clamp(tInCut/0.4, 0, 1));
    return (
      <div style={{position:'absolute', left:1920/2, top:1080/2, transform:`translate(-50%, -50%) scale(${0.6 + 0.4 * e})`}}>
        <div style={{padding:'40px 80px', background: cur.color, color:'#fff', borderRadius: 100, fontFamily:FONT_HEAD, fontWeight:700, fontSize:200, letterSpacing:'-0.025em', boxShadow:'0 30px 80px rgba(46,125,50,0.4)'}}>
          {cur.text}
        </div>
      </div>
    );
  }
  if (k === 'gm-stats' || k === 'gm-rank') {
    const w = 1380, h = 720;
    const sc = 0.94 + 0.06 * Easing.easeOutCubic(clamp(tInCut/0.4, 0, 1));
    return (
      <div style={{position:'absolute', left: 1920/2 - w/2, top: 1080/2 - h/2, width:w, height:h, transform:`scale(${sc})`, transformOrigin:'center'}}>
        <BrowserShell x={0} y={0} w={w} h={h}>
          <GMDashboard progress={k === 'gm-stats' ? 0.5 : 0.95}/>
        </BrowserShell>
      </div>
    );
  }
  if (k === 'timer') {
    return (
      <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{fontFamily:FONT_MONO, fontSize: 480, fontWeight:500, color: cur.color, letterSpacing:'-0.04em', fontVariantNumeric:'tabular-nums', transform: `scale(${0.92 + 0.08 * Easing.easeOutCubic(clamp(tInCut/0.3, 0, 1))})`}}>
          {cur.val}
        </div>
        <div style={{position:'absolute', bottom: 200, fontFamily:FONT_BODY, fontSize:14, color:'rgba(246,241,232,0.5)', letterSpacing:'0.32em', fontWeight:800}}>● PITCH STAGE</div>
      </div>
    );
  }
  if (k === 'audience') {
    return (
      <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'120px'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(20, 1fr)', gap: 14, maxWidth: 1500}}>
          {Array.from({length:140}).map((_, i) => {
            const seed = (i * 9301 + 49297) % 233280 / 233280;
            const lit = clamp(tInCut * 200 - i * 1.4, 0, 1);
            return <div key={i} style={{width:32, height:32, borderRadius:16, background: i % 9 === 0 ? BRAND.green : 'rgba(246,241,232,0.18)', opacity: lit, transform: `scale(${0.5 + 0.5 * lit})`}}/>;
          })}
        </div>
      </div>
    );
  }
  if (k === 'silence') {
    return (
      <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{fontFamily:FONT_HEAD, fontStyle:'italic', fontSize: 200, color: BRAND.amber, opacity: clamp(tInCut/0.4, 0, 1)}}>—— silence ——</div>
      </div>
    );
  }
  return null;
}

/* S7 (37.5–40.5) Convergence */
window.Scene7Converge = function Scene7Converge() {
  const { localTime, duration } = useSprite();
  const lines = [
    { text: 'Two days.',    color: BRAND.blue,  delay: 0.05 },
    { text: 'Three views.', color: BRAND.green, delay: 0.4 },
    { text: 'One question.',color: BRAND.red,   delay: 0.75 },
  ];
  const exitT = clamp((localTime - (duration - 0.3))/0.3, 0, 1);
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.ivory2, opacity: 1 - exitT}}>
      <DotGrid color={BRAND.ink} opacity={0.05} gap={32}/>
      <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
        {lines.map((l, i) => {
          const t = clamp((localTime - l.delay) / 0.32, 0, 1);
          const eased = Easing.easeOutCubic(t);
          return (
            <div key={i} style={{
              fontFamily:FONT_HEAD, fontSize: 168, fontWeight:600, letterSpacing:'-0.025em', lineHeight:1.16, marginBottom: 8,
              opacity: eased, transform:`translateY(${(1-eased)*40}px)`,
              color: l.color,
            }}>{l.text}</div>
          );
        })}
      </div>
      <FlashAt at={duration - 0.05} color="#0a1422"/>
    </div>
  );
};

/* S8 (40.5–47.5) Pitch — silent beat */
window.Scene8Pitch = function Scene8Pitch() {
  const { localTime, duration } = useSprite();
  const t1 = clamp(localTime/0.3, 0, 1);
  const exitT = clamp((localTime - (duration - 0.25))/0.25, 0, 1);
  return (
    <div style={{position:'absolute', inset:0, background:'#0a1422', color:'#F6F1E8', opacity: 1 - exitT}}>
      <Kicker text="PITCH" color={BRAND.amber} x={120} y={100} size={16} opacity={t1}/>
      <div style={{position:'absolute', left:1920/2, top:1080/2 + 30, transform:`translate(-50%, -50%) scale(${0.94 + 0.06 * t1})`}}>
        <div style={{width:1640, height:800, borderRadius:14, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.6)'}}>
          <PitchScreen progress={clamp((localTime - 0.3)/(duration - 1.0), 0, 1)}/>
        </div>
      </div>
<FlashAt at={duration - 0.05} color={BRAND.ivory}/>
    </div>
  );
};

/* S9 (47.5–52.0) Three startups selected for Post-Bootcamp Individual Training */
window.Scene9Award = function Scene9Award() {
  const { localTime, duration } = useSprite();
  const exitT = clamp((localTime - (duration - 0.3))/0.3, 0, 1);
  const tShow = clamp(localTime/0.35, 0, 1);
  const tHead = clamp((localTime - 0.25)/0.4, 0, 1);

  const teams = [
    { name: 'Argan',   accent: BRAND.green },
    { name: 'Atlas',   accent: BRAND.blue  },
    { name: 'Saffran', accent: BRAND.red   },
  ];

  return (
    <div style={{position:'absolute', inset:0, background: BRAND.ivory, opacity: 1 - exitT}}>
      <DotGrid color={BRAND.ink} opacity={0.04} gap={32}/>
      <Kicker text="● SELECTED · POST-BOOTCAMP" color={BRAND.amber} x={120} y={120} size={16} opacity={tShow}/>

      {/* headline */}
      <div style={{position:'absolute', left: 1920/2, top: 240, transform:`translate(-50%, ${(1-tHead)*30}px)`, opacity: tHead, fontFamily:FONT_HEAD, fontSize: 150, fontWeight:600, letterSpacing:'-0.025em', lineHeight: 0.95, color: BRAND.ink, textAlign:'center', whiteSpace:'nowrap'}}>
        Three startups, <em style={{color:BRAND.amber}}>chosen.</em>
      </div>

      {/* three cards, staggered */}
      <div style={{position:'absolute', left: 1920/2, top: 540, transform:'translateX(-50%)', display:'flex', gap: 32}}>
        {teams.map((t, i) => {
          const delay = 0.55 + i * 0.18;
          const tIn = clamp((localTime - delay)/0.35, 0, 1);
          const e = Easing.easeOutBack(tIn);
          return (
            <div key={i} style={{
              width: 420, padding: '54px 50px 46px',
              background:'#fff', border:`1px solid ${BRAND.border}`, borderRadius: 22,
              boxShadow: '0 30px 70px rgba(20,30,55,0.14)',
              opacity: tIn, transform: `translateY(${(1-e)*40}px) scale(${0.92 + 0.08 * e})`,
              display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 18,
            }}>
              <div style={{display:'flex', alignItems:'center', gap: 14}}>
                <div style={{width: 42, height: 42, borderRadius: 21, background: t.accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700}}>
                  0{i+1}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 12, letterSpacing:'0.28em', fontWeight: 800, color: BRAND.muted}}>TEAM</div>
              </div>
              <div style={{fontFamily: FONT_HEAD, fontSize: 110, fontWeight: 600, letterSpacing:'-0.025em', lineHeight: 0.95, color: BRAND.ink}}>
                {t.name}.
              </div>
              <div style={{height: 4, width: 80, background: t.accent}}/>
            </div>
          );
        })}
      </div>

      {/* footer line */}
      <div style={{position:'absolute', left: 1920/2, bottom: 110, transform:'translateX(-50%)', opacity: clamp((localTime - 1.2)/0.4, 0, 1), fontFamily:FONT_HEAD, fontStyle:'italic', fontSize: 36, color: BRAND.muted, whiteSpace:'nowrap'}}>
        Individual training, six weeks.
      </div>

      <FlashAt at={duration - 0.05} color={BRAND.ivory}/>
    </div>
  );
};

/* S10 (52.0–55.5) Pixel sign-off */
window.Scene10Pixel = function Scene10Pixel() {
  const { localTime, duration } = useSprite();
  const tShow = clamp(localTime/0.4, 0, 1);
  const exitT = clamp((localTime - (duration - 0.3))/0.3, 0, 1);
  const bob = Math.sin(localTime * 2.4) * 8;
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.ivory, opacity: 1 - exitT}}>
      <DotGrid color={BRAND.ink} opacity={0.05} gap={32}/>
      <div style={{position:'absolute', left:1920/2, top:870, width:360, height:30, background:'radial-gradient(ellipse at center, rgba(43,38,30,0.25) 0%, transparent 70%)', transform:'translateX(-50%)', opacity: tShow, filter:'blur(2px)'}}/>
      <div style={{position:'absolute', left:1920/2, top:460, transform:`translate(-50%, ${bob}px) scale(${0.9 + 0.1 * Easing.easeOutBack(tShow)})`, opacity: tShow}}>
        <PixelDog size={400}/>
      </div>
      <div style={{position:'absolute', left:1920/2 + 240, top:480, opacity: clamp((localTime - 0.45)/0.3, 0, 1), transform:`translateY(${(1 - clamp((localTime - 0.45)/0.3, 0, 1))*16}px)`}}>
        <div style={{background:'#fff', border:'1px solid '+BRAND.border, borderRadius:22, padding:'22px 30px', fontFamily:FONT_HEAD, fontStyle:'italic', fontSize:42, color:BRAND.ink, boxShadow:'0 20px 50px rgba(43,38,30,0.14)', maxWidth:560, position:'relative'}}>
          « We've been waiting. »
          <div style={{position:'absolute', bottom:-10, left:60, width:20, height:20, background:'#fff', transform:'rotate(45deg)', borderRight:'1px solid '+BRAND.border, borderBottom:'1px solid '+BRAND.border}}/>
        </div>
      </div>
      <FlashAt at={duration - 0.05} color={BRAND.blue}/>
    </div>
  );
};

/* S11 (55.5–60.0) CTA + end-frame echo */
window.Scene11CTA = function Scene11CTA() {
  const { localTime, duration } = useSprite();
  // echo: tiny "What would you build, if you had a day?" shows top-left for 1.0s, then fades
  const echoOp = clamp(localTime/0.3, 0, 1) * (1 - clamp((localTime - 1.4)/0.4, 0, 1));
  const t1 = clamp((localTime - 0.4)/0.4, 0, 1);
  const e1 = Easing.easeOutCubic(t1);
  const t2 = clamp((localTime - 1.4)/0.4, 0, 1);
  const e2 = Easing.easeOutCubic(t2);
  const t3 = clamp((localTime - 2.6)/0.5, 0, 1);
  const e3 = Easing.easeOutCubic(t3);
  return (
    <div style={{position:'absolute', inset:0, background: BRAND.blue, color: BRAND.ivory}}>
      <div style={{position:'absolute', left:0, top:540, height:1, background:'rgba(246,241,232,0.18)', width:'100%'}}/>
      {/* JOUE. — hero */}
      <div style={{position:'absolute', left:1920/2, top:380, transform:`translate(-50%, ${(1-e1)*40}px)`, opacity: e1, fontFamily:FONT_HEAD, fontSize:420, fontWeight:600, letterSpacing:'-0.04em', lineHeight:0.9}}>
        <em style={{color: BRAND.greenL}}>Joue.</em>
      </div>
      {/* date */}
      <div style={{position:'absolute', left:1920/2, top:820, transform:`translate(-50%, ${(1-e2)*30}px)`, opacity: e2, fontFamily:FONT_HEAD, fontSize:88, fontWeight:500, letterSpacing:'-0.02em'}}>
        12 mai 2026.
      </div>
      {/* subtle endcard line — AgreenTech mention only */}
      <div style={{position:'absolute', left:1920/2, bottom: 110, transform:`translate(-50%, ${(1-e3)*12}px)`, opacity: e3 * 0.7, fontFamily:FONT_BODY, fontSize: 14, letterSpacing:'0.32em', fontWeight: 700, color: 'rgba(246,241,232,0.65)'}}>
        AGREENTECH 2026
      </div>
      {/* EIC logo top-left */}
      <div style={{position:'absolute', left: 120, top: 100, opacity: e3 * 0.85, transform:`translateY(${(1-e3)*16}px)`}}>
        <EICLogo size={32} color={BRAND.ivory} dot={BRAND.greenL}/>
      </div>
    </div>
  );
};
