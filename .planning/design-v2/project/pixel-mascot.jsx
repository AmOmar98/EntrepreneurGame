/* global React */
// Vie de Pixel — floating mascot widget overlaid on the GM dashboard.
// Pixel reads the hack's pulse and surfaces a mood + reasons + a tiny next action.

// ---- The mascot itself: an abstract soft creature, not a drawn dog. -------
// Body: rounded blob. Two ears. Two eyes (state-dependent). Mood ring around.

const PixelAvatar = ({ mood='calm', size=72 }) => {
  // Mood → palette + eye style
  const palettes = {
    serene:   { bg:'#E7F2E5', body:'#F8FBF6', ring:'#2E7D32', accent:'#2E7D32', halo:'rgba(46,125,50,0.2)'  },
    focused:  { bg:'#E5EBF4', body:'#F4F7FB', ring:'#1B3A5C', accent:'#1B3A5C', halo:'rgba(27,58,92,0.18)'  },
    anxious:  { bg:'#FBEBE8', body:'#FCF4F2', ring:'#C44536', accent:'#C44536', halo:'rgba(196,69,54,0.22)' },
    elated:   { bg:'#FCF1DE', body:'#FFF9EE', ring:'#D97706', accent:'#D97706', halo:'rgba(217,119,6,0.28)' },
  }[mood];

  const eyeStyle = {
    serene:  { shape:'arc',     mouth:'smile' },
    focused: { shape:'dot',     mouth:'flat'  },
    anxious: { shape:'tilted',  mouth:'wave'  },
    elated:  { shape:'sparkle', mouth:'open'  },
  }[mood];

  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      {/* halo */}
      <div style={{
        position:'absolute',inset:-6,borderRadius:'50%',
        background:`radial-gradient(circle,${palettes.halo} 0%,transparent 70%)`,
        animation: mood==='elated' ? 'pixelHalo 1.6s ease-in-out infinite' : 'none',
      }}/>
      <svg viewBox="0 0 80 80" width={size} height={size} style={{position:'relative',display:'block'}}>
        {/* ears (two soft triangles) */}
        <path d="M22 22 Q18 8 28 14 Q30 18 28 24 Z" fill={palettes.body} stroke={palettes.ring} strokeWidth="1.5"/>
        <path d="M58 22 Q62 8 52 14 Q50 18 52 24 Z" fill={palettes.body} stroke={palettes.ring} strokeWidth="1.5"/>
        {/* body — rounded blob */}
        <path
          d="M16 44 Q16 22 40 22 Q64 22 64 44 Q64 64 40 64 Q16 64 16 44 Z"
          fill={palettes.body}
          stroke={palettes.ring}
          strokeWidth="1.8"
        />
        {/* eyes */}
        {eyeStyle.shape==='dot' && <>
          <circle cx="32" cy="42" r="3" fill={palettes.ring}/>
          <circle cx="48" cy="42" r="3" fill={palettes.ring}/>
        </>}
        {eyeStyle.shape==='arc' && <>
          <path d="M28 44 Q32 40 36 44" stroke={palettes.ring} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M44 44 Q48 40 52 44" stroke={palettes.ring} strokeWidth="2" fill="none" strokeLinecap="round"/>
        </>}
        {eyeStyle.shape==='tilted' && <>
          <path d="M28 40 L36 44" stroke={palettes.ring} strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M52 40 L44 44" stroke={palettes.ring} strokeWidth="2.2" strokeLinecap="round"/>
        </>}
        {eyeStyle.shape==='sparkle' && <>
          <g stroke={palettes.ring} strokeWidth="1.6" strokeLinecap="round">
            <line x1="32" y1="38" x2="32" y2="46"/><line x1="28" y1="42" x2="36" y2="42"/>
            <line x1="48" y1="38" x2="48" y2="46"/><line x1="44" y1="42" x2="52" y2="42"/>
          </g>
        </>}
        {/* snout / mouth */}
        {eyeStyle.mouth==='smile' && <path d="M34 52 Q40 56 46 52" stroke={palettes.ring} strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {eyeStyle.mouth==='flat'  && <line x1="36" y1="54" x2="44" y2="54" stroke={palettes.ring} strokeWidth="2" strokeLinecap="round"/>}
        {eyeStyle.mouth==='wave'  && <path d="M34 54 Q37 51 40 54 Q43 57 46 54" stroke={palettes.ring} strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {eyeStyle.mouth==='open'  && <ellipse cx="40" cy="54" rx="4" ry="3" fill={palettes.ring}/>}
        {/* nose dot */}
        <circle cx="40" cy="48" r="1.6" fill={palettes.ring} opacity="0.6"/>
      </svg>
    </div>
  );
};

// ---- Pulse meter ----------------------------------------------------------

const PulseBars = ({ value=0.6, color='#1B3A5C' }) => (
  <div style={{display:'flex',gap:3,alignItems:'flex-end',height:16}}>
    {[0.4,0.7,1,0.8,0.5,0.9,0.6].map((h,i)=>{
      const active = i/7 < value;
      return (
        <div key={i} style={{
          width:3,height:`${h*16}px`,
          background: active ? color : 'rgba(154,145,127,0.3)',
          borderRadius:1,
          opacity: active ? 1 : 0.5,
        }}/>
      );
    })}
  </div>
);

// ---- The floating Pixel card (in its expanded form) -----------------------

const PixelCard = ({ mood='anxious' }) => {
  const states = {
    serene: {
      label:'Pixel · serein',
      headline:"Tout file. Je dors d'un œil.",
      pulse:{ v:0.85, label:'rythme stable', c:'#2E7D32' },
      reasons:[
        { ic:'●', t:'12/12 équipes en activité',         c:'#2E7D32' },
        { ic:'✓', t:'Aucun mentor en surcharge',          c:'#2E7D32' },
        { ic:'↗', t:'Validation L2 en avance · +30 min',  c:'#2E7D32' },
      ],
      action: null,
    },
    focused: {
      label:'Pixel · concentré',
      headline:"Phase de revue dense. Je veille.",
      pulse:{ v:0.65, label:'soutenu', c:'#1B3A5C' },
      reasons:[
        { ic:'⏱', t:'4 livrables en file mentor',          c:'#1B3A5C' },
        { ic:'●', t:'Atlas en train de verrouiller le L3', c:'#1B3A5C' },
        { ic:'~', t:'Latence revue · 12 min en moyenne',   c:'rgba(154,145,127,0.7)' },
      ],
      action: null,
    },
    anxious: {
      label:'Pixel · inquiet',
      headline:"3 équipes silencieuses depuis 18 minutes.",
      pulse:{ v:0.30, label:'irrégulier', c:'#C44536' },
      reasons:[
        { ic:'○', t:'Delta · aucune action depuis 22 min',  c:'#C44536' },
        { ic:'○', t:'Juno · bloquée sur M2.1',              c:'#C44536' },
        { ic:'○', t:'Lunar · 2 fenêtres fermées coup sur coup', c:'#D97706' },
      ],
      action: { l:'Réveiller les 3 équipes', sub:'Annonce ciblée pré-rédigée' },
    },
    elated: {
      label:'Pixel · euphorique',
      headline:"Atlas vient de franchir le L4 !",
      pulse:{ v:0.95, label:'pic d\'énergie', c:'#D97706' },
      reasons:[
        { ic:'★', t:'Atlas · 1ère équipe à atteindre L4', c:'#D97706' },
        { ic:'+', t:'+340 XP en 8 minutes',               c:'#D97706' },
        { ic:'♪', t:'4 réactions « bravo » côté joueurs', c:'#2E7D32' },
      ],
      action: { l:'Diffuser une célébration', sub:'Confettis sur tous les écrans' },
    },
  };
  const s = states[mood];
  const pal = mood==='anxious'?'#C44536':mood==='elated'?'#D97706':mood==='focused'?'#1B3A5C':'#2E7D32';

  return (
    <div style={{
      width:340,
      background:'rgba(255,255,255,0.95)',
      backdropFilter:'blur(20px)',
      borderRadius:16,
      border:`1.5px solid ${pal}30`,
      boxShadow:`0 24px 48px rgba(43,38,30,0.18), 0 8px 16px rgba(43,38,30,0.08), 0 0 0 1px ${pal}10`,
      overflow:'hidden',
      fontFamily:'var(--font-body,Source Sans 3,system-ui,sans-serif)',
    }}>
      {/* Drag header */}
      <div className="wf-row" style={{
        padding:'8px 12px',gap:8,
        borderBottom:'1px solid rgba(154,145,127,0.18)',
        background:`linear-gradient(180deg,${pal}08 0%,transparent 100%)`,
        cursor:'grab',
      }}>
        <span style={{fontSize:9,color:'var(--wf-ink-faint)',letterSpacing:'0.16em',textTransform:'uppercase',fontWeight:700}}>≡ Vie de Pixel</span>
        <span className="wf-grow"/>
        <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>maj · à l'instant</span>
        <button style={{background:'transparent',border:'none',color:'var(--wf-ink-soft)',fontSize:14,cursor:'pointer',width:18,height:18,padding:0,lineHeight:1}}>−</button>
        <button style={{background:'transparent',border:'none',color:'var(--wf-ink-soft)',fontSize:14,cursor:'pointer',width:18,height:18,padding:0,lineHeight:1}}>×</button>
      </div>

      {/* Body */}
      <div style={{padding:'16px 18px 18px',display:'flex',flexDirection:'column',gap:14}}>
        {/* Avatar + headline */}
        <div className="wf-row" style={{gap:14,alignItems:'flex-start'}}>
          <PixelAvatar mood={mood} size={64}/>
          <div style={{flex:1,minWidth:0,paddingTop:2}}>
            <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:pal,fontWeight:700}}>{s.label}</div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:17,fontWeight:600,letterSpacing:'-0.005em',lineHeight:1.25,marginTop:6,color:'var(--wf-ink)'}}>« {s.headline} »</div>
          </div>
        </div>

        {/* Pulse meter */}
        <div className="wf-row" style={{gap:10,padding:'8px 12px',borderRadius:8,background:`${pal}08`,border:`1px solid ${pal}20`}}>
          <span style={{fontSize:10,color:'var(--wf-ink-soft)',letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600}}>Pouls</span>
          <PulseBars value={s.pulse.v} color={pal}/>
          <span className="wf-grow"/>
          <span style={{fontSize:10,fontWeight:600,color:pal,fontStyle:'italic'}}>{s.pulse.label}</span>
        </div>

        {/* Reasons */}
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <div style={{fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--wf-ink-faint)',fontWeight:700}}>Ce que je perçois</div>
          {s.reasons.map((r,i)=>(
            <div key={i} className="wf-row" style={{gap:8,fontSize:11.5,color:'var(--wf-ink)',lineHeight:1.4}}>
              <span style={{color:r.c,fontWeight:700,width:14,textAlign:'center'}}>{r.ic}</span>
              <span>{r.t}</span>
            </div>
          ))}
        </div>

        {/* Action — only when there is one */}
        {s.action && (
          <button style={{
            width:'100%',
            background:`linear-gradient(180deg,${pal} 0%,${pal}dd 100%)`,
            color:'#fff',border:'none',
            padding:'11px 14px',borderRadius:10,
            display:'flex',flexDirection:'column',alignItems:'flex-start',gap:2,
            cursor:'pointer',boxShadow:`0 10px 22px ${pal}40`,
            fontFamily:'Montserrat,sans-serif',
          }}>
            <span style={{fontSize:12,fontWeight:700,letterSpacing:'0.01em'}}>{s.action.l} →</span>
            <span style={{fontSize:10,fontWeight:400,opacity:0.85}}>{s.action.sub}</span>
          </button>
        )}
        {!s.action && (
          <div className="wf-row" style={{gap:8,padding:'8px 12px',borderRadius:8,background:'rgba(154,145,127,0.08)',border:'1px dashed rgba(154,145,127,0.35)'}}>
            <span style={{fontSize:11,color:'var(--wf-ink-soft)',fontStyle:'italic'}}>Rien à faire — laisse rouler.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Compact (collapsed) Pixel pill ---------------------------------------

const PixelPill = ({ mood='anxious' }) => {
  const pal = mood==='anxious'?'#C44536':mood==='elated'?'#D97706':mood==='focused'?'#1B3A5C':'#2E7D32';
  const dot = { serene:'tout va bien', focused:'4 en file', anxious:'3 silences', elated:'L4 atteint' }[mood];
  return (
    <div className="wf-row" style={{
      gap:10,padding:'8px 14px 8px 8px',borderRadius:30,
      background:'rgba(255,255,255,0.95)',backdropFilter:'blur(14px)',
      border:`1.5px solid ${pal}40`,
      boxShadow:`0 14px 32px rgba(43,38,30,0.14), 0 0 0 1px ${pal}15`,
      cursor:'pointer',
    }}>
      <PixelAvatar mood={mood} size={32}/>
      <div className="wf-stack" style={{gap:1}}>
        <span style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:pal,fontWeight:700}}>Pixel</span>
        <span style={{fontSize:11,color:'var(--wf-ink)',fontWeight:500}}>{dot}</span>
      </div>
      <span style={{width:8,height:8,borderRadius:'50%',background:pal,boxShadow:`0 0 0 3px ${pal}25`,marginLeft:4,animation:'pixelPulse 1.6s ease-in-out infinite'}}/>
    </div>
  );
};

// ---- Faded dashboard backdrop (so context is visible) ---------------------

const DashBackdrop = () => (
  <div style={{position:'absolute',inset:0,padding:'18px 24px',display:'flex',flexDirection:'column',gap:14,opacity:0.55,filter:'saturate(0.85)'}}>
    {/* fake topbar */}
    <div className="wf-row" style={{padding:'8px 0',gap:14}}>
      <div style={{width:30,height:30,borderRadius:6,background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontWeight:700,fontSize:14}}>E</div>
      <div className="wf-stack">
        <div style={{height:10,width:140,background:'rgba(43,38,30,0.4)',borderRadius:3}}/>
        <div style={{height:6,width:90,background:'rgba(43,38,30,0.2)',borderRadius:3,marginTop:5}}/>
      </div>
      <span className="wf-grow"/>
      {[0,1,2].map(i=><div key={i} style={{height:18,width:70,borderRadius:9,background:'rgba(154,145,127,0.3)'}}/>)}
    </div>
    {/* KPI strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:6}}>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{height:80,background:'rgba(255,255,255,0.4)',border:'1px solid rgba(154,145,127,0.2)',borderRadius:12,padding:'12px 14px'}}>
          <div style={{height:8,width:60,background:'rgba(43,38,30,0.2)',borderRadius:2}}/>
          <div style={{height:24,width:80,background:'rgba(43,38,30,0.4)',borderRadius:3,marginTop:10}}/>
        </div>
      ))}
    </div>
    {/* leaderboard */}
    <div style={{flex:1,background:'rgba(255,255,255,0.4)',border:'1px solid rgba(154,145,127,0.2)',borderRadius:12,padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
      <div style={{height:10,width:160,background:'rgba(43,38,30,0.3)',borderRadius:3}}/>
      {[0.92,0.84,0.76,0.62,0.55,0.48,0.42,0.32,0.28].map((w,i)=>(
        <div key={i} className="wf-row" style={{gap:10}}>
          <div style={{width:18,height:8,background:'rgba(43,38,30,0.2)',borderRadius:2}}/>
          <div style={{width:60,height:8,background:'rgba(43,38,30,0.3)',borderRadius:2}}/>
          <div style={{flex:1,height:6,background:'rgba(154,145,127,0.18)',borderRadius:2}}>
            <div style={{width:`${w*100}%`,height:'100%',background:'rgba(27,58,92,0.6)',borderRadius:2}}/>
          </div>
          <div style={{width:36,height:8,background:'rgba(43,38,30,0.3)',borderRadius:2}}/>
        </div>
      ))}
    </div>
  </div>
);

// ---- Main artboard: floating Pixel over the GM dashboard ------------------

const PixelFloating = () => (
  <div className="wf" style={{position:'relative',background:'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)',height:'100%',overflow:'hidden'}}>
    <style>{`
      @keyframes pixelPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
      @keyframes pixelHalo  { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
    `}</style>

    <DashBackdrop/>

    {/* Floating widget — bottom right, anxious state shown by default */}
    <div style={{position:'absolute',right:32,bottom:28,zIndex:10,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10}}>
      <PixelCard mood="anxious"/>
    </div>

    {/* Annotation arrow + label */}
    <div style={{position:'absolute',right:400,bottom:140,display:'flex',gap:8,alignItems:'flex-end',pointerEvents:'none'}}>
      <span style={{fontFamily:'Caveat,cursive',fontSize:18,color:'#C44536',transform:'rotate(-2deg)'}}>flotte sur la régie ·<br/>ne couvre jamais la file mentor</span>
      <svg width="60" height="40" style={{overflow:'visible'}}><path d="M5 5 Q30 30 55 30" stroke="#C44536" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/><polygon points="55,30 48,26 50,33" fill="#C44536"/></svg>
    </div>
  </div>
);

// ---- States gallery: 4 Pixel moods side by side ---------------------------

const PixelStates = () => (
  <div className="wf" style={{background:'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 100%)',padding:'40px 32px',height:'100%',overflow:'auto'}}>
    <style>{`
      @keyframes pixelPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
      @keyframes pixelHalo  { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
    `}</style>

    <div style={{maxWidth:1380,margin:'0 auto',display:'flex',flexDirection:'column',gap:28}}>
      <div>
        <div className="wf-kicker">Vie de Pixel · 4 humeurs</div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:42,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:'4px 0 8px'}}>
          Une mascotte qui <em style={{color:'#C44536',fontStyle:'italic'}}>respire avec le hack</em>.
        </h1>
        <div style={{fontSize:13,color:'var(--wf-ink-soft)',maxWidth:680,lineHeight:1.55}}>
          Pixel lit le pouls collectif (silences, files mentor, paliers franchis) et propose à la régie une humeur visible + une micro-action ciblée. Toujours flottant, jamais bloquant.
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:18}}>
        {['serene','focused','anxious','elated'].map(m=>(
          <div key={m} style={{display:'flex',flexDirection:'column',gap:10,alignItems:'center'}}>
            <PixelCard mood={m}/>
            <div style={{fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--wf-ink-faint)',fontWeight:700,marginTop:4}}>
              {{serene:'Tout va bien',focused:'Phase dense',anxious:'Signal faible',elated:'Pic d\'énergie'}[m]}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14,marginTop:16}}>
        <div className="wf-kicker">Forme repliée · pill discrète quand la régie ne veut pas être dérangée</div>
        <div className="wf-row" style={{gap:18,flexWrap:'wrap'}}>
          {['serene','focused','anxious','elated'].map(m=><PixelPill key={m} mood={m}/>)}
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { PixelFloating, PixelStates });
