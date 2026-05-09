// Admin / Régie — Hack‑Days control room.
// More gamified than the player view: leaderboard, charging bars per team, XP totals.
// A small white dog mascot peeks from the corner with status quips.

const TEAMS = [
  { id:'atlas',     name:'Atlas',      members:['YA','SK','NB'], level:3, levelDone:2, xp:820, missions:'2/4', status:'en revue',   urgent:true,  trend:'+120' },
  { id:'boreal',    name:'Boréal',     members:['MP','LR'],      level:3, levelDone:1, xp:760, missions:'1/4', status:'en mission', urgent:false, trend:'+80' },
  { id:'cyrus',     name:'Cyrus',      members:['JD','TB','OM','VG'], level:2, levelDone:1, xp:620, missions:'2/3', status:'en revue', urgent:false, trend:'+40' },
  { id:'delta',     name:'Delta',      members:['CH','PA','RS'], level:3, levelDone:0, xp:600, missions:'0/4', status:'en pause',   urgent:false, trend:'0',  warn:true },
  { id:'eole',      name:'Éole',       members:['NM','LF'],      level:2, levelDone:1, xp:560, missions:'2/3', status:'en mission', urgent:false, trend:'+60' },
  { id:'fenix',     name:'Fénix',      members:['SB','TR','KM'], level:2, levelDone:0, xp:480, missions:'1/3', status:'en mission', urgent:false, trend:'+40' },
  { id:'galileo',   name:'Galileo',    members:['HD','EJ'],      level:2, levelDone:0, xp:440, missions:'1/3', status:'en revue',   urgent:false, trend:'+40' },
  { id:'helios',    name:'Helios',     members:['IO','UV','WX'], level:1, levelDone:1, xp:400, missions:'2/2', status:'en mission', urgent:false, trend:'+80' },
  { id:'iris',      name:'Iris',       members:['AB','CD'],      level:1, levelDone:1, xp:360, missions:'1/2', status:'en mission', urgent:false, trend:'+40' },
  { id:'juno',      name:'Juno',       members:['EF','GH','IJ'], level:1, levelDone:0, xp:280, missions:'1/2', status:'en pause',   urgent:false, trend:'0',  warn:true },
  { id:'kappa',     name:'Kappa',      members:['KL','MN'],      level:1, levelDone:0, xp:240, missions:'1/2', status:'en mission', urgent:false, trend:'+40' },
  { id:'lunar',     name:'Lunar',      members:['OP','QR','ST'], level:0, levelDone:1, xp:200, missions:'2/2', status:'en mission', urgent:false, trend:'+80' },
];

const QUEUE = [
  { team:'Atlas',   code:'M3.2', fr:'5 entretiens documentés', wait:'8 min',  urgent:true,  members:'YA · SK · NB' },
  { team:'Cyrus',   code:'M2.1', fr:'Énoncé du problème',      wait:'12 min', urgent:false, members:'JD · TB · OM · VG' },
  { team:'Galileo', code:'M2.2', fr:'Cible et contexte',       wait:'18 min', urgent:false, members:'HD · EJ' },
  { team:'Boréal',  code:'M3.1', fr:"Carte d'empathie",        wait:'24 min', urgent:false, members:'MP · LR' },
];

// === Shell =================================================================

const AdminShell = ({ children }) => (
  <div className="wf" style={{background:'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)'}}>
    <div className="wf-aurora">
      <div className="blob3" style={{top:'-10%',left:'30%',width:'60%',height:'60%',background:'radial-gradient(circle,rgba(27,58,92,0.06),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'hidden'}}>{children}</div>
  </div>
);

const AdminTopbar = () => (
  <div className="wf-row" style={{padding:'18px 28px',gap:14,borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
    <div className="wf-row" style={{gap:10}}>
      <div className="wf-brand-mark" style={{width:30,height:30}}>E</div>
      <div className="wf-stack">
        <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600,lineHeight:1}}>Régie · Hack‑Days 26</div>
        <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--wf-ink-soft)',marginTop:2}}>Tableau de bord · Animateur</div>
      </div>
    </div>
    <span className="wf-grow"/>
    <div className="wf-row" style={{gap:10}}>
      <div className="wf-pill is-amber" style={{fontSize:10,fontWeight:700}}>⏱ Pitch dans 02h 28min</div>
      <div className="wf-pill is-blue" style={{fontSize:10}}>● 12 équipes en jeu</div>
      <div className="wf-pill is-green" style={{fontSize:10}}>● 4 mentors en ligne</div>
      <div style={{width:30,height:30,borderRadius:'50%',background:'#C44536',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>EI</div>
    </div>
  </div>
);

// === KPI cards =============================================================

const KPI = ({ label, value, foot, accent='blue' }) => {
  const map = {
    blue:  { fg:'#1B3A5C', bg:'rgba(27,58,92,0.08)' },
    green: { fg:'#2E7D32', bg:'rgba(46,125,50,0.10)' },
    amber: { fg:'#D97706', bg:'rgba(217,119,6,0.10)' },
    red:   { fg:'#C44536', bg:'rgba(196,69,54,0.10)' },
  };
  const c = map[accent];
  return (
    <div className="wf-glass" style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:6}}>
      <div className="wf-kicker">{label}</div>
      <div className="wf-row" style={{gap:8,alignItems:'baseline'}}>
        <span style={{fontFamily:'Montserrat,sans-serif',fontSize:30,fontWeight:800,color:c.fg,letterSpacing:'-0.02em',lineHeight:1}}>{value}</span>
        {foot && <span style={{fontSize:11,color:'var(--wf-ink-soft)'}}>{foot}</span>}
      </div>
    </div>
  );
};

// === Charging bar mini (horizontal) ========================================

const TeamBar = ({ level, levelDone, n=8 }) => {
  // Total progression L0..L7 with current level partially done
  const pct = ((level + (levelDone>0 ? 0.4 : 0)) / (n-1)) * 100;
  return (
    <div style={{position:'relative',height:8,background:'rgba(154,145,127,0.22)',borderRadius:8,overflow:'hidden',border:'1px solid rgba(154,145,127,0.25)'}}>
      <div style={{
        position:'absolute',left:0,top:0,bottom:0,width:`${pct}%`,
        background:'linear-gradient(90deg,#2E7D32 0%,#1B3A5C 80%)',
        borderRadius:8,
        boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)',
      }}/>
      {/* level ticks */}
      {Array.from({length:n}).map((_,i)=>(
        <div key={i} style={{
          position:'absolute',left:`${(i/(n-1))*100}%`,top:'50%',
          width:2,height:4,marginLeft:-1,
          transform:'translateY(-50%)',
          background:i<=level?'rgba(255,255,255,0.5)':'rgba(154,145,127,0.5)',
        }}/>
      ))}
    </div>
  );
};

// === Leaderboard ===========================================================

const RankBadge = ({ rank }) => {
  const podium = rank<=3;
  const colors = ['#D97706','#9A917F','#C44536']; // 1=or, 2=argent, 3=bronze
  return (
    <div style={{
      width:30,height:30,borderRadius:8,
      display:'grid',placeItems:'center',
      background: podium ? colors[rank-1] : 'rgba(255,255,255,0.6)',
      color: podium ? '#fff' : 'var(--wf-ink-soft)',
      fontFamily:'Montserrat,sans-serif',fontSize:12,fontWeight:800,
      boxShadow: podium ? `0 4px 10px ${colors[rank-1]}55` : 'none',
      flexShrink:0,
    }}>{rank}</div>
  );
};

const Avatars = ({ list }) => (
  <div style={{display:'flex'}}>
    {list.slice(0,3).map((m,i)=>(
      <div key={i} style={{
        width:22,height:22,borderRadius:'50%',
        background:['#1B3A5C','#2E7D32','#D97706','#C44536'][i%4],
        color:'#fff',display:'grid',placeItems:'center',
        fontSize:9,fontWeight:700,fontFamily:'Montserrat,sans-serif',
        marginLeft:i===0?0:-6,
        border:'2px solid rgba(251,248,242,0.95)',
      }}>{m}</div>
    ))}
    {list.length>3 && (
      <div style={{
        width:22,height:22,borderRadius:'50%',
        background:'rgba(154,145,127,0.3)',color:'var(--wf-ink)',
        display:'grid',placeItems:'center',fontSize:9,fontWeight:700,
        marginLeft:-6,border:'2px solid rgba(251,248,242,0.95)',
      }}>+{list.length-3}</div>
    )}
  </div>
);

const TeamRow = ({ team, rank }) => {
  const status = {
    'en mission':{bg:'rgba(27,58,92,0.1)',  fg:'#1B3A5C', dot:'#1B3A5C'},
    'en revue':  {bg:'rgba(217,119,6,0.12)', fg:'#D97706', dot:'#D97706'},
    'en pause':  {bg:'rgba(154,145,127,0.18)',fg:'var(--wf-ink-soft)', dot:'#9A917F'},
  }[team.status];
  return (
    <div className="wf-row" style={{
      gap:14,padding:'12px 16px',
      background: rank<=3 ? 'rgba(255,255,255,0.6)' : 'transparent',
      borderRadius:12,
      border:'1px solid '+(rank<=3?'rgba(255,255,255,0.7)':'transparent'),
    }}>
      <RankBadge rank={rank}/>
      <div style={{minWidth:140}}>
        <div className="wf-row" style={{gap:8}}>
          <span style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:15,fontWeight:600,letterSpacing:'-0.005em'}}>{team.name}</span>
          {team.urgent && <span className="wf-pill is-amber" style={{fontSize:9,padding:'1px 6px'}}>urgent</span>}
          {team.warn && <span className="wf-pill" style={{fontSize:9,padding:'1px 6px',background:'rgba(196,69,54,0.1)',color:'#C44536',borderColor:'rgba(196,69,54,0.3)'}}>silencieuse</span>}
        </div>
        <div className="wf-row" style={{gap:6,marginTop:4}}>
          <Avatars list={team.members}/>
          <span style={{fontSize:10,color:'var(--wf-ink-faint)',marginLeft:4}}>{team.members.length} pers.</span>
        </div>
      </div>
      <div style={{flex:1,minWidth:160,display:'flex',flexDirection:'column',gap:4}}>
        <div className="wf-row" style={{gap:6,fontSize:10,color:'var(--wf-ink-soft)'}}>
          <span className="wf-mono" style={{fontWeight:700,color:'var(--wf-ink)'}}>L{team.level}</span>
          <span>·</span>
          <span>{team.missions} livrables</span>
        </div>
        <TeamBar level={team.level} levelDone={team.levelDone}/>
      </div>
      <div style={{textAlign:'right',minWidth:70}}>
        <div style={{fontFamily:'Montserrat,sans-serif',fontSize:16,fontWeight:800,color:'var(--wf-ink)',letterSpacing:'-0.01em'}}>{team.xp}</div>
        <div style={{fontSize:10,color:team.trend==='0'?'var(--wf-ink-faint)':'#2E7D32',fontWeight:600}}>
          {team.trend==='0' ? '— stagne' : team.trend+' XP / 1h'}
        </div>
      </div>
      <div className="wf-row" style={{gap:6,minWidth:110,justifyContent:'flex-end'}}>
        <span style={{
          background:status.bg,color:status.fg,
          padding:'4px 10px',borderRadius:99,
          fontSize:10,fontWeight:600,
          display:'inline-flex',alignItems:'center',gap:6,
        }}>
          <span style={{width:6,height:6,borderRadius:'50%',background:status.dot}}/>
          {team.status}
        </span>
      </div>
    </div>
  );
};

// === Queue =================================================================

const QueueItem = ({ item }) => (
  <div className="wf-glass" style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
    <div className="wf-row" style={{gap:8}}>
      <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{item.code}</span>
      <span className="wf-grow"/>
      {item.urgent
        ? <span className="wf-pill is-amber" style={{fontSize:9}}>! urgent · {item.wait}</span>
        : <span className="wf-pill" style={{fontSize:9,background:'rgba(255,255,255,0.6)'}}>{item.wait}</span>}
    </div>
    <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600,lineHeight:1.25}}>{item.fr}</div>
    <div style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Équipe <strong>{item.team}</strong> · {item.members}</div>
    <div className="wf-row" style={{gap:6,marginTop:4}}>
      <span className="wf-grow"/>
      <span className="wf-btn" style={{padding:'6px 10px',fontSize:11}}>Assigner</span>
      <span className="wf-btn is-primary" style={{padding:'6px 10px',fontSize:11}}>Réviser →</span>
    </div>
  </div>
);

// === Dog mascot — refined Bichon, peeking from the edge ====================

const DogMascot = ({ message, x='right', y='bottom', size=140 }) => {
  const w = size, h = size*1.05;
  return (
  <div style={{
    position:'absolute',[x]:18,[y]:-8,zIndex:5,
    display:'flex',flexDirection:'column',alignItems:x==='right'?'flex-end':'flex-start',
    gap:6,pointerEvents:'none',
  }}>
    {message && (
      <div style={{
        background:'#fff',border:'1px solid rgba(154,145,127,0.3)',
        borderRadius:14,padding:'10px 14px',fontSize:12,color:'var(--wf-ink)',fontWeight:500,
        boxShadow:'0 10px 26px rgba(43,38,30,0.14)',position:'relative',maxWidth:240,
        marginRight:x==='right'?20:0,marginLeft:x==='left'?20:0,pointerEvents:'auto',
      }}>
        {message}
        <div style={{
          position:'absolute',bottom:-6,[x==='right'?'right':'left']:32,
          width:12,height:12,background:'#fff',transform:'rotate(45deg)',
          borderRight:'1px solid rgba(154,145,127,0.3)',
          borderBottom:'1px solid rgba(154,145,127,0.3)',
        }}/>
      </div>
    )}
    <svg width={w} height={h} viewBox="0 0 200 210" style={{display:'block',filter:'drop-shadow(0 12px 14px rgba(43,38,30,0.18))'}}>
      <defs>
        <radialGradient id="furBase" cx="0.45" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#FFFFFF"/>
          <stop offset="0.55" stopColor="#FAF6EC"/>
          <stop offset="1" stopColor="#E8DEC9"/>
        </radialGradient>
        <radialGradient id="furShade" cx="0.5" cy="0.85" r="0.6">
          <stop offset="0" stopColor="#C9BEA3" stopOpacity="0.35"/>
          <stop offset="1" stopColor="#C9BEA3" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="eyeGlint" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#5a4a3c"/>
          <stop offset="0.6" stopColor="#2B221C"/>
          <stop offset="1" stopColor="#0e0a08"/>
        </radialGradient>
        <radialGradient id="noseShade" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#5a5258"/>
          <stop offset="0.7" stopColor="#2B262E"/>
          <stop offset="1" stopColor="#0e0c11"/>
        </radialGradient>
        <radialGradient id="earInner" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#F4D5C8"/>
          <stop offset="1" stopColor="#D9A99A"/>
        </radialGradient>
        <filter id="furTexture" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="2" seed="3"/>
          <feColorMatrix values="0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.85  0 0 0 0.18 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>

      {/* body / paws gripping the ledge */}
      <g>
        {/* fluffy chest (peeking up) */}
        <path d="M40 200 Q50 170 70 165 Q100 160 130 165 Q150 170 160 200 Z" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.2"/>
        <path d="M40 200 Q50 170 70 165 Q100 160 130 165 Q150 170 160 200 Z" fill="url(#furTexture)" opacity="0.9"/>
        {/* paws */}
        <g>
          <ellipse cx="56" cy="198" rx="14" ry="8" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.2"/>
          <ellipse cx="56" cy="198" rx="14" ry="8" fill="url(#furTexture)"/>
          <ellipse cx="49" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
          <ellipse cx="56" cy="202" rx="2.2" ry="2.8" fill="#3a322d"/>
          <ellipse cx="63" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
          <ellipse cx="56" cy="195" rx="3.5" ry="2.4" fill="#3a322d" opacity="0.55"/>
        </g>
        <g>
          <ellipse cx="144" cy="198" rx="14" ry="8" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.2"/>
          <ellipse cx="144" cy="198" rx="14" ry="8" fill="url(#furTexture)"/>
          <ellipse cx="137" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
          <ellipse cx="144" cy="202" rx="2.2" ry="2.8" fill="#3a322d"/>
          <ellipse cx="151" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
          <ellipse cx="144" cy="195" rx="3.5" ry="2.4" fill="#3a322d" opacity="0.55"/>
        </g>
      </g>

      {/* ears (behind head) */}
      <g>
        <path d="M48 70 Q30 90 32 130 Q42 142 60 138 Q66 110 70 88 Z" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.4"/>
        <path d="M52 80 Q42 96 44 122 Q52 130 60 128" fill="url(#earInner)" opacity="0.55"/>
        <path d="M48 70 Q30 90 32 130 Q42 142 60 138 Q66 110 70 88 Z" fill="url(#furTexture)"/>

        <path d="M152 70 Q170 90 168 130 Q158 142 140 138 Q134 110 130 88 Z" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.4"/>
        <path d="M148 80 Q158 96 156 122 Q148 130 140 128" fill="url(#earInner)" opacity="0.55"/>
        <path d="M152 70 Q170 90 168 130 Q158 142 140 138 Q134 110 130 88 Z" fill="url(#furTexture)"/>
      </g>

      {/* head: layered fur tufts */}
      <g>
        <ellipse cx="100" cy="100" rx="58" ry="54" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.6"/>
        <ellipse cx="100" cy="120" rx="56" ry="36" fill="url(#furShade)"/>
        {/* fur tuft outline — irregular fluffy edge */}
        <path d="M44 96 Q42 78 56 70 Q68 62 80 64 Q90 50 100 52 Q112 50 120 64 Q132 62 144 70 Q158 78 156 96 Q160 116 152 132 Q156 150 138 154 Q120 162 100 158 Q80 162 62 154 Q44 150 48 132 Q40 116 44 96 Z"
              fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.4" opacity="0.85"/>
        <path d="M44 96 Q42 78 56 70 Q68 62 80 64 Q90 50 100 52 Q112 50 120 64 Q132 62 144 70 Q158 78 156 96 Q160 116 152 132 Q156 150 138 154 Q120 162 100 158 Q80 162 62 154 Q44 150 48 132 Q40 116 44 96 Z"
              fill="url(#furTexture)" opacity="0.7"/>
      </g>

      {/* eyes — almond with shine */}
      <g>
        <ellipse cx="80" cy="100" rx="5.2" ry="6" fill="url(#eyeGlint)"/>
        <ellipse cx="120" cy="100" rx="5.2" ry="6" fill="url(#eyeGlint)"/>
        <circle cx="81.6" cy="98" r="1.6" fill="#fff" opacity="0.95"/>
        <circle cx="121.6" cy="98" r="1.6" fill="#fff" opacity="0.95"/>
        <circle cx="78.5" cy="102.5" r="0.8" fill="#fff" opacity="0.5"/>
        <circle cx="118.5" cy="102.5" r="0.8" fill="#fff" opacity="0.5"/>
        {/* faint brow shadows */}
        <path d="M72 92 Q80 88 88 92" stroke="#C9BEA3" strokeWidth="1.2" fill="none" opacity="0.7" strokeLinecap="round"/>
        <path d="M112 92 Q120 88 128 92" stroke="#C9BEA3" strokeWidth="1.2" fill="none" opacity="0.7" strokeLinecap="round"/>
      </g>

      {/* muzzle */}
      <g>
        <ellipse cx="100" cy="126" rx="22" ry="16" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.2"/>
        <ellipse cx="100" cy="132" rx="20" ry="10" fill="url(#furShade)"/>
      </g>

      {/* nose */}
      <g>
        <ellipse cx="100" cy="118" rx="7.5" ry="5.6" fill="url(#noseShade)"/>
        <ellipse cx="97" cy="115.5" rx="2.1" ry="1.4" fill="#7a6e76" opacity="0.7"/>
        <ellipse cx="97" cy="115" rx="0.8" ry="0.6" fill="#fff" opacity="0.8"/>
        {/* nostrils */}
        <ellipse cx="97.5" cy="120" rx="0.9" ry="1.4" fill="#0a070a"/>
        <ellipse cx="102.5" cy="120" rx="0.9" ry="1.4" fill="#0a070a"/>
      </g>

      {/* mouth */}
      <path d="M100 124 L100 132" stroke="#3a322d" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M100 132 Q92 138 84 134" stroke="#3a322d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M100 132 Q108 138 116 134" stroke="#3a322d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>

      {/* tongue */}
      <path d="M95 134 Q100 140 105 134 Q103 138 100 138 Q97 138 95 134 Z" fill="#E58CA0" stroke="#C2728A" strokeWidth="0.6"/>

      {/* topknot fluff */}
      <g>
        <ellipse cx="100" cy="56" rx="20" ry="14" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.4"/>
        <circle cx="92" cy="50" r="6" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.1"/>
        <circle cx="105" cy="46" r="7" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.1"/>
        <circle cx="113" cy="52" r="5" fill="url(#furBase)" stroke="#B4A88C" strokeWidth="1.1"/>
        <ellipse cx="100" cy="56" rx="20" ry="14" fill="url(#furTexture)" opacity="0.85"/>
      </g>
    </svg>
  </div>
);
};

// === Dashboard =============================================================

const AdminDashboard = () => {
  const sorted = [...TEAMS].sort((a,b)=>b.xp-a.xp);
  return (
    <AdminShell>
      <AdminTopbar/>
      {/* KPI strip */}
      <div style={{padding:'18px 28px 8px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        <KPI label="Équipes" value="12" foot="2 silencieuses" accent="blue"/>
        <KPI label="Livrables validés" value="38" foot="sur 96" accent="green"/>
        <KPI label="En revue" value="7" foot="dont 1 urgent" accent="amber"/>
        <KPI label="Combo équipe du jour" value="Atlas" foot="🔥 +120 XP / 1h" accent="red"/>
      </div>

      {/* Main grid */}
      <div style={{padding:'8px 28px 28px',display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:20,height:'calc(100% - 218px)',overflow:'hidden'}}>
        {/* Leaderboard */}
        <div className="wf-glass" style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:8,overflow:'hidden'}}>
          <div className="wf-row" style={{gap:8,padding:'2px 6px'}}>
            <h3 style={{fontSize:16,margin:0}}>Classement vivant</h3>
            <span className="wf-grow"/>
            <span className="wf-pill" style={{fontSize:10,background:'rgba(255,255,255,0.6)'}}>tri · XP</span>
            <span className="wf-pill" style={{fontSize:10,background:'rgba(255,255,255,0.6)'}}>L0 → L7</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,overflow:'auto',paddingRight:4}}>
            {sorted.map((t,i)=>(<TeamRow key={t.id} team={t} rank={i+1}/>))}
          </div>
        </div>

        {/* Queue */}
        <div className="wf-glass" style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:10,overflow:'hidden'}}>
          <div className="wf-row" style={{gap:8,padding:'2px 6px'}}>
            <h3 style={{fontSize:16,margin:0}}>File de revue</h3>
            <span className="wf-grow"/>
            <span className="wf-pill is-amber" style={{fontSize:10}}>4 en attente</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,overflow:'auto',paddingRight:4}}>
            {QUEUE.map((q,i)=><QueueItem key={i} item={q}/>)}
          </div>
          <div className="wf-row" style={{gap:8,padding:'8px 6px 0',borderTop:'1px solid rgba(154,145,127,0.18)'}}>
            <span className="wf-kicker">Mentors</span>
            <span className="wf-grow"/>
            <div className="wf-row" style={{gap:-4}}>
              {['SK','LR','PA','HD'].map((m,i)=>(
                <div key={i} style={{
                  width:22,height:22,borderRadius:'50%',
                  background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',
                  fontSize:9,fontWeight:700,marginLeft:i===0?0:-6,
                  border:'2px solid #FBF8F2',
                }}>{m}</div>
              ))}
            </div>
            <span style={{fontSize:11,color:'var(--wf-ink-soft)'}}>4 en ligne</span>
          </div>
        </div>
      </div>

      <DogMascot message="3 livrables attendent depuis +10 min — on s'y met ?"/>
    </AdminShell>
  );
};

// === Review modal ==========================================================

const AdminReview = () => (
  <AdminShell>
    <AdminTopbar/>
    <div style={{padding:'24px 28px',display:'grid',gridTemplateColumns:'1fr 320px',gap:24,height:'calc(100% - 71px)',overflow:'hidden'}}>
      <div style={{display:'flex',flexDirection:'column',gap:16,overflow:'auto'}}>
        <div className="wf-row" style={{gap:10}}>
          <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)'}}>L3 · Découverte › M3.2</span>
          <span className="wf-pill is-amber" style={{fontSize:10}}>! attend depuis 8 min</span>
        </div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:30,fontWeight:600,letterSpacing:'-0.015em',margin:0}}>5 entretiens documentés</h1>
        <div style={{fontSize:13,color:'var(--wf-ink-soft)'}}>Équipe <strong>Atlas</strong> · soumis par Y. Ahmadi · +120 XP en jeu</div>

        <div className="wf-glass" style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:12}}>
          <div className="wf-kicker">Synthèse fournie par l'équipe</div>
          <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:17,lineHeight:1.5,letterSpacing:'-0.005em'}}>
            « Les 5 personnes interrogées (parents, 28–41 ans, Île‑de‑France) partagent une fatigue de la planification de repas en semaine. Le frein principal est la charge mentale, pas le budget. »
          </div>
          <div className="wf-row" style={{gap:10,flexWrap:'wrap',marginTop:4}}>
            {['Marc, 34 ans','Léa, 29 ans','Karim, 41 ans','Mei, 28 ans','Ana, 36 ans'].map((n,i)=>(
              <span key={i} className="wf-pill" style={{fontSize:10,background:'rgba(255,255,255,0.6)'}}>◇ {n}</span>
            ))}
          </div>
        </div>

        <div className="wf-glass" style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:10}}>
          <div className="wf-kicker">Critères de validation</div>
          {['Cinq entretiens distincts documentés','Verbatim (citations) inclus','Profil démographique varié','Synthèse en une phrase'].map((c,i)=>(
            <div key={i} className="wf-row" style={{gap:10,fontSize:13}}>
              <input type="checkbox" defaultChecked={i<3} style={{accentColor:'#2E7D32'}}/>
              <span style={{color:i<3?'var(--wf-ink)':'var(--wf-ink-soft)',textDecoration:i<3?'none':'none'}}>{c}</span>
            </div>
          ))}
        </div>

        <div className="wf-glass-tint" style={{padding:'14px 18px'}}>
          <div className="wf-kicker">Retour au mentor (optionnel)</div>
          <div style={{
            marginTop:8,minHeight:60,padding:'10px 12px',
            background:'rgba(255,255,255,0.6)',borderRadius:10,
            fontSize:13,color:'var(--wf-ink-soft)',fontStyle:'italic',
          }}>Les verbatim sont solides. Manque une 5e fiche : préciser le profil de Mei avant validation.</div>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'auto'}}>
        <div className="wf-glass" style={{padding:'14px 16px'}}>
          <div className="wf-row" style={{gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:13}}>AT</div>
            <div className="wf-grow">
              <div style={{fontWeight:700,fontSize:13}}>Atlas</div>
              <div style={{fontSize:11,color:'var(--wf-ink-soft)'}}>L3 · 820 XP · rang 1</div>
            </div>
          </div>
          <div style={{height:8}}/>
          <TeamBar level={3} levelDone={2}/>
          <div style={{fontSize:10,color:'var(--wf-ink-soft)',marginTop:6}}>Progression L0 → L7</div>
        </div>

        <div className="wf-stack" style={{gap:8}}>
          <button style={{
            background:'linear-gradient(180deg,#3B9D43 0%,#2E7D32 100%)',
            color:'#fff',border:'none',padding:'14px',borderRadius:12,
            fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Montserrat,sans-serif',
            boxShadow:'0 10px 24px rgba(46,125,50,0.35)',letterSpacing:'0.02em',
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
          }}>✓ Valider · +120 XP</button>
          <button style={{
            background:'rgba(255,255,255,0.6)',color:'var(--wf-ink)',
            border:'1.5px solid rgba(217,119,6,0.5)',padding:'12px',borderRadius:12,
            fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif',
          }}>↻ Demander une révision</button>
          <button style={{
            background:'transparent',color:'var(--wf-ink-soft)',
            border:'1px solid rgba(154,145,127,0.4)',padding:'10px',borderRadius:10,
            fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'Montserrat,sans-serif',
          }}>Assigner à un mentor</button>
        </div>

        <div className="wf-glass" style={{padding:'12px 14px'}}>
          <div className="wf-kicker" style={{marginBottom:6}}>Activité récente</div>
          <div style={{fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.6}}>
            <div>• 14:24 · soumission par Atlas</div>
            <div>• 14:08 · M3.1 validée par Sami K.</div>
            <div>• 13:52 · début L3 · Découverte</div>
          </div>
        </div>
      </div>
    </div>
    <DogMascot message="Atlas attend ton verdict — t'as l'œil !" x="right"/>
  </AdminShell>
);

// === LIVE EXTRAS ===========================================================

const LiveToast = ({ items=[] }) => (
  <div style={{position:'absolute',top:90,right:24,zIndex:6,display:'flex',flexDirection:'column',gap:10,maxWidth:340}}>
    {items.map((it,i)=>(
      <div key={i} style={{
        display:'flex',gap:12,alignItems:'flex-start',
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(20px) saturate(160%)',
        border:`1px solid ${it.color||'rgba(154,145,127,0.3)'}`,
        borderLeft:`4px solid ${it.color||'#1B3A5C'}`,
        borderRadius:14,padding:'12px 14px',
        boxShadow:'0 16px 36px rgba(43,38,30,0.16)',
        animation:`wf-toast-in 0.4s cubic-bezier(.2,.8,.2,1) ${i*0.08}s both`,
      }}>
        <div style={{
          width:30,height:30,borderRadius:8,flexShrink:0,
          background:it.color||'#1B3A5C',color:'#fff',
          display:'grid',placeItems:'center',fontSize:13,fontWeight:700,fontFamily:'Montserrat,sans-serif',
        }}>{it.icon||'●'}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="wf-row" style={{gap:6,marginBottom:2}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--wf-ink)'}}>{it.title}</span>
            <span className="wf-grow"/>
            <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{it.t}</span>
          </div>
          <div style={{fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.4}}>{it.body}</div>
        </div>
      </div>
    ))}
    <style>{`@keyframes wf-toast-in{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
  </div>
);

const TICKER = [
  { t:'14:24', team:'Atlas',   ev:'a soumis M3.2',         delta:'+0',      color:'#D97706', icon:'⏵' },
  { t:'14:21', team:'Helios',  ev:'a validé M1.2',         delta:'+80 XP',  color:'#2E7D32', icon:'✓' },
  { t:'14:18', team:'Lunar',   ev:'a démarré L1',          delta:'',        color:'#1B3A5C', icon:'▲' },
  { t:'14:14', team:'Boréal',  ev:"a posé l'hypothèse",    delta:'+100 XP', color:'#2E7D32', icon:'✓' },
  { t:'14:08', team:'Atlas',   ev:'M3.1 validée',          delta:'+80 XP',  color:'#2E7D32', icon:'✓' },
  { t:'14:02', team:'Cyrus',   ev:'a demandé un mentor',   delta:'',        color:'#1B3A5C', icon:'?' },
  { t:'13:58', team:'Galileo', ev:'a soumis M2.2',         delta:'+0',      color:'#D97706', icon:'⏵' },
  { t:'13:52', team:'Atlas',   ev:'a démarré L3',          delta:'',        color:'#1B3A5C', icon:'▲' },
  { t:'13:48', team:'Delta',   ev:'silence depuis 25 min', delta:'',        color:'#C44536', icon:'!' },
  { t:'13:42', team:'Fénix',   ev:'a validé M1.1',         delta:'+40 XP',  color:'#2E7D32', icon:'✓' },
  { t:'13:38', team:'Iris',    ev:'a rejoint le jeu',      delta:'',        color:'#1B3A5C', icon:'▲' },
];

const BottomTicker = ({ live=true, focus=0 }) => (
  <div style={{
    position:'absolute',left:0,right:0,bottom:0,zIndex:4,
    background:'linear-gradient(180deg,rgba(43,38,30,0) 0%, rgba(43,38,30,0.04) 30%, rgba(43,38,30,0.10) 100%)',
    padding:'10px 0 14px',
    backdropFilter:'blur(8px)',
    borderTop:'1px solid rgba(154,145,127,0.25)',
  }}>
    <div className="wf-row" style={{padding:'0 28px 8px',gap:10}}>
      <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:10,fontWeight:700,letterSpacing:'0.18em',color:'#C44536'}}>
        <span style={{width:7,height:7,borderRadius:'50%',background:'#C44536',boxShadow:'0 0 0 4px rgba(196,69,54,0.18)',animation:live?'wf-blink 1.4s ease-in-out infinite':'none'}}/>
        LIVE · FIL DU JEU
      </span>
      <span style={{fontSize:10,color:'var(--wf-ink-soft)'}}>swipe →</span>
      <span className="wf-grow"/>
      <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>2h 28min restantes</span>
    </div>
    <div style={{display:'flex',gap:10,padding:'0 28px',overflowX:'auto'}}>
      {TICKER.map((e,i)=>(
        <div key={i} style={{
          minWidth:220,flexShrink:0,
          background:i===focus?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.7)',
          backdropFilter:'blur(14px)',
          border:`1px solid ${i===focus?e.color:'rgba(154,145,127,0.3)'}`,
          borderRadius:12,padding:'10px 12px',
          display:'flex',gap:10,alignItems:'center',
          boxShadow:i===focus?`0 10px 24px ${e.color}33`:'none',
        }}>
          <div style={{
            width:26,height:26,borderRadius:8,flexShrink:0,
            background:e.color,color:'#fff',
            display:'grid',placeItems:'center',fontSize:12,fontWeight:700,
          }}>{e.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="wf-row" style={{gap:6}}>
              <span className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>{e.t}</span>
              <span style={{fontSize:11,fontWeight:700}}>{e.team}</span>
            </div>
            <div style={{fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.3}}>
              {e.ev} {e.delta && <strong style={{color:e.color}}>· {e.delta}</strong>}
            </div>
          </div>
        </div>
      ))}
    </div>
    <style>{`@keyframes wf-blink{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
  </div>
);

const AdminDashboardLive = () => {
  const sorted = [...TEAMS].sort((a,b)=>b.xp-a.xp);
  const toasts = [
    { title:'Atlas a soumis', body:'M3.2 · 5 entretiens documentés · à examiner', t:"À l'instant", color:'#D97706', icon:'⏵' },
    { title:'Helios + 80 XP', body:'M1.2 validée par Léa R.',                     t:'2 min',       color:'#2E7D32', icon:'✓' },
    { title:'Delta · alerte', body:"Aucune activité depuis 25 min — un coup d'œil ?", t:'5 min',  color:'#C44536', icon:'!' },
  ];
  return (
    <AdminShell>
      <AdminTopbar/>
      <div style={{padding:'18px 28px 8px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        <KPI label="Équipes" value="12" foot="2 silencieuses" accent="blue"/>
        <KPI label="Livrables validés" value="38" foot="sur 96" accent="green"/>
        <KPI label="En revue" value="7" foot="dont 1 urgent" accent="amber"/>
        <KPI label="Rang 1" value="Atlas" foot="🔥 +120 XP / 1h" accent="red"/>
      </div>
      <div style={{padding:'8px 28px 140px',display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:20,height:'calc(100% - 350px)',overflow:'hidden'}}>
        <div className="wf-glass" style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:8,overflow:'hidden'}}>
          <div className="wf-row" style={{gap:8,padding:'2px 6px'}}>
            <h3 style={{fontSize:16,margin:0}}>Classement vivant</h3>
            <span className="wf-grow"/>
            <span className="wf-pill is-blue" style={{fontSize:10}}>● temps réel</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,overflow:'auto',paddingRight:4}}>
            {sorted.slice(0,8).map((t,i)=>(<TeamRow key={t.id} team={t} rank={i+1}/>))}
          </div>
        </div>
        <div className="wf-glass" style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:10,overflow:'hidden'}}>
          <div className="wf-row" style={{gap:8,padding:'2px 6px'}}>
            <h3 style={{fontSize:16,margin:0}}>File de revue</h3>
            <span className="wf-grow"/>
            <span className="wf-pill is-amber" style={{fontSize:10}}>4 en attente</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,overflow:'auto',paddingRight:4}}>
            {QUEUE.map((q,i)=><QueueItem key={i} item={q}/>)}
          </div>
        </div>
      </div>
      <LiveToast items={toasts}/>
      <BottomTicker live focus={0}/>
      <DogMascot message="Atlas vient de livrer — vas-y, jette un œil !"/>
    </AdminShell>
  );
};

const AdminAchievement = () => (
  <AdminShell>
    <AdminTopbar/>
    <div style={{position:'absolute',inset:'71px 0 130px 0',display:'flex',alignItems:'center',justifyContent:'center',padding:32}}>
      <div style={{maxWidth:560,width:'100%',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
        <div className="wf-pill" style={{fontSize:10,fontWeight:700,letterSpacing:'0.2em',background:'#C44536',color:'#fff',padding:'6px 14px',boxShadow:'0 8px 22px rgba(196,69,54,0.35)'}}>
          🎉 ACCOMPLISSEMENT DÉBLOQUÉ
        </div>
        <div style={{
          width:120,height:120,borderRadius:'50%',
          background:'linear-gradient(180deg,#D97706 0%,#C44536 100%)',
          color:'#fff',display:'grid',placeItems:'center',
          fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:56,fontWeight:700,
          boxShadow:'0 0 0 10px rgba(217,119,6,0.18), 0 24px 60px rgba(196,69,54,0.4)',
        }}>L4</div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:44,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:0}}>
          Atlas atteint <em style={{color:'#C44536',fontStyle:'italic'}}>la Solution.</em>
        </h1>
        <div style={{fontSize:14,color:'var(--wf-ink-soft)',maxWidth:420,lineHeight:1.5}}>
          Première équipe à franchir L4. Combo de 3 livrables validés en 1 heure.
        </div>
        <div className="wf-row" style={{gap:14,marginTop:6,flexWrap:'wrap',justifyContent:'center'}}>
          {[{l:'Combo',v:'×3'},{l:'XP gagnés',v:'+340'},{l:'Rang',v:'#1'}].map((s,i)=>(
            <div key={i} className="wf-glass" style={{padding:'12px 18px',minWidth:100,textAlign:'center'}}>
              <div className="wf-kicker">{s.l}</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontSize:24,fontWeight:800,color:'var(--wf-ink)',letterSpacing:'-0.01em',marginTop:4}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="wf-row" style={{gap:10,marginTop:10}}>
          <button style={{background:'transparent',color:'var(--wf-ink)',border:'1.5px solid rgba(43,38,30,0.25)',padding:'12px 18px',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Annoncer dans le live</button>
          <button style={{background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',color:'#fff',border:'none',padding:'12px 22px',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Montserrat,sans-serif',boxShadow:'0 12px 28px rgba(27,58,92,0.4)'}}>Retour au tableau →</button>
        </div>
      </div>
    </div>
    <BottomTicker live focus={1}/>
    <DogMascot message="Atlas en feu ! Prépare un applaudissement 👏" x="left"/>
  </AdminShell>
);

const AdminFocus = () => {
  const t = TEAMS[0];
  const tline = [
    { t:'14:24', s:'soumission',  m:'M3.2 · 5 entretiens documentés', tone:'amber' },
    { t:'14:08', s:'+80 XP',      m:"M3.1 carte d'empathie validée",  tone:'green' },
    { t:'13:52', s:'début L3',    m:'Découverte engagée',             tone:'blue'  },
    { t:'13:32', s:'+140 XP',     m:'M2.2 cible et contexte validée', tone:'green' },
    { t:'13:14', s:'début L2',    m:'Problème engagé',                tone:'blue'  },
  ];
  const tones = {
    amber:{bg:'#D97706',ring:'rgba(217,119,6,0.18)'},
    green:{bg:'#2E7D32',ring:'rgba(46,125,50,0.15)'},
    blue: {bg:'#1B3A5C',ring:'rgba(27,58,92,0.15)'},
  };
  const climbY = 28; // current level (L3) position from bottom 0..7

  return (
    <AdminShell>
      <AdminTopbar/>

      {/* Editorial dossier — magazine cover layout */}
      <div style={{position:'relative',height:'calc(100% - 71px - 130px)',overflow:'hidden'}}>

        {/* gigantic rank numeral as background */}
        <div style={{
          position:'absolute',top:-60,left:-40,
          fontFamily:'var(--font-heading,Baskervville,serif)',
          fontSize:560,fontWeight:600,lineHeight:0.85,
          color:'transparent',
          WebkitTextStroke:'2px rgba(27,58,92,0.10)',
          letterSpacing:'-0.04em',
          pointerEvents:'none',
          userSelect:'none',
        }}>01</div>

        {/* sticky breadcrumb */}
        <div style={{position:'absolute',top:18,left:36,zIndex:5}}>
          <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)'}}>← Toutes les équipes</span>
        </div>

        <div style={{
          position:'relative',zIndex:2,height:'100%',
          display:'grid',gridTemplateColumns:'1.25fr 1fr',
          padding:'52px 36px 24px',gap:28,
        }}>
          {/* LEFT — editorial portrait */}
          <div style={{display:'flex',flexDirection:'column',gap:18,minWidth:0,paddingLeft:120}}>
            <div className="wf-row" style={{gap:12}}>
              <span className="wf-pill" style={{fontSize:9,letterSpacing:'0.2em',background:'#C44536',color:'#fff',padding:'4px 10px'}}>● EN TÊTE</span>
              <span className="wf-pill is-amber" style={{fontSize:10}}>! soumission en revue</span>
              <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>équipe #atlas · {t.members.length} membres</span>
            </div>

            <h1 style={{
              fontFamily:'var(--font-heading,Baskervville,serif)',
              fontSize:108,fontWeight:600,lineHeight:0.92,letterSpacing:'-0.03em',
              margin:0,color:'var(--wf-ink)',
            }}>
              Atlas<br/>
              <em style={{fontStyle:'italic',color:'#C44536',fontSize:64,letterSpacing:'-0.025em'}}>
                tient le rythme.
              </em>
            </h1>

            <div style={{
              fontFamily:'var(--font-heading,Baskervville,serif)',
              fontSize:18,lineHeight:1.5,letterSpacing:'-0.005em',
              color:'var(--wf-ink-soft)',maxWidth:520,
              borderLeft:'3px solid #C44536',paddingLeft:16,fontStyle:'italic',
            }}>
              « 3 livrables validés en 1h, cinq entretiens en file, hypothèse posée à 80%.
              Première équipe à approcher la Solution. »
            </div>

            {/* member cluster */}
            <div className="wf-row" style={{gap:-6,marginTop:6}}>
              {t.members.map((m,i)=>(
                <div key={i} style={{
                  width:54,height:54,borderRadius:'50%',
                  background:`linear-gradient(135deg,${['#1B3A5C','#2E7D32','#D97706'][i%3]},${['#22456C','#3A9540','#E8951A'][i%3]})`,
                  color:'#fff',display:'grid',placeItems:'center',
                  fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:16,
                  border:'3px solid #FBF8F2',marginLeft:i===0?0:-12,
                  boxShadow:'0 6px 16px rgba(43,38,30,0.18)',
                  zIndex:t.members.length-i,
                }}>{m}</div>
              ))}
              <div style={{marginLeft:14,fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.4}}>
                Y. Ahmadi <span style={{color:'var(--wf-ink-faint)'}}>· capitaine</span><br/>
                S. Khalil · N. Bauer
              </div>
            </div>

            {/* Vital signs strip */}
            <div className="wf-row" style={{gap:0,marginTop:10,
              borderTop:'1px solid rgba(154,145,127,0.3)',
              borderBottom:'1px solid rgba(154,145,127,0.3)',
              padding:'14px 0',
            }}>
              {[
                {k:'XP',     v:t.xp,           u:'/ 2000'},
                {k:'Niveau', v:`L${t.level}`,  u:'Découverte'},
                {k:'Élan',   v:`+${t.trend}`,  u:'XP / heure'},
                {k:'Combo',  v:'×3',           u:'validés 1h'},
              ].map((s,i)=>(
                <div key={s.k} style={{
                  flex:1,padding:'0 14px',
                  borderLeft:i===0?'none':'1px solid rgba(154,145,127,0.25)',
                }}>
                  <div className="wf-kicker">{s.k}</div>
                  <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:32,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1,marginTop:4}}>{s.v}</div>
                  <div style={{fontSize:10,color:'var(--wf-ink-faint)',marginTop:4,letterSpacing:'0.04em'}}>{s.u}</div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="wf-row" style={{gap:10,marginTop:'auto'}}>
              <button style={{
                background:'linear-gradient(180deg,#C44536 0%,#A03629 100%)',
                color:'#fff',border:'none',padding:'14px 22px',borderRadius:14,
                fontSize:13,fontWeight:700,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.02em',
                cursor:'pointer',boxShadow:'0 14px 30px rgba(196,69,54,0.35)',
                display:'inline-flex',alignItems:'center',gap:10,
              }}>Reviewer M3.2 maintenant <span style={{opacity:0.7}}>→</span></button>
              <button style={{
                background:'rgba(255,255,255,0.7)',color:'var(--wf-ink)',
                border:'1.5px solid rgba(43,38,30,0.2)',padding:'13px 18px',borderRadius:12,
                fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif',
                backdropFilter:'blur(10px)',
              }}>Envoyer un encouragement</button>
              <button style={{
                background:'transparent',color:'var(--wf-ink-soft)',
                border:'none',padding:'13px 14px',
                fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif',
              }}>Assigner un mentor</button>
            </div>
          </div>

          {/* RIGHT — vertical climb + activity bubbles */}
          <div style={{position:'relative',display:'grid',gridTemplateColumns:'80px 1fr',gap:14,paddingTop:14}}>
            {/* Climbing bar (echo of player view) */}
            <div style={{position:'relative',width:80}}>
              <div style={{
                position:'absolute',left:'50%',top:8,bottom:8,width:14,transform:'translateX(-50%)',
                background:'rgba(154,145,127,0.22)',border:'1px solid rgba(154,145,127,0.35)',borderRadius:14,
                backdropFilter:'blur(8px)',
              }}/>
              <div style={{
                position:'absolute',left:'50%',bottom:8,width:14,transform:'translateX(-50%)',
                height:`calc((100% - 16px) * ${(t.level + (t.levelDone/4))/7})`,
                background:'linear-gradient(180deg,#C44536 0%,#D97706 50%,#2E7D32 100%)',
                borderRadius:14,boxShadow:'0 0 24px rgba(196,69,54,0.45)',
              }}/>
              {[0,1,2,3,4,5,6,7].map(L=>{
                const yPct = ((7-L)/7)*100;
                const done = L<t.level, cur = L===t.level, locked = L>t.level;
                return (
                  <div key={L} style={{
                    position:'absolute',left:'50%',top:`calc(8px + (100% - 16px) * ${yPct/100})`,
                    transform:'translate(-50%,-50%)',
                    width:cur?34:done?22:18,height:cur?34:done?22:18,
                    borderRadius:'50%',
                    background:done?'#2E7D32':cur?'#C44536':'rgba(255,255,255,0.95)',
                    border:`2px solid ${done?'#2E7D32':cur?'#C44536':'#9A917F'}`,
                    borderStyle:locked?'dashed':'solid',
                    display:'grid',placeItems:'center',
                    color:done||cur?'#fff':'var(--wf-ink-faint)',
                    fontSize:cur?12:9,fontWeight:700,fontFamily:'Montserrat,sans-serif',
                    boxShadow:cur?'0 0 0 6px rgba(196,69,54,0.18), 0 8px 20px rgba(196,69,54,0.4)':'none',
                    zIndex:cur?5:2,
                  }}>{done?'✓':L}</div>
                );
              })}
              <div style={{position:'absolute',top:-2,left:'50%',transform:'translate(-50%,-100%)',fontSize:9,letterSpacing:'1.4px',color:'var(--wf-amber)',fontWeight:700,whiteSpace:'nowrap'}}>▲ PITCH</div>
            </div>

            {/* activity bubbles next to the bar */}
            <div style={{position:'relative'}}>
              <div className="wf-kicker" style={{position:'absolute',top:-4,left:0}}>Activité · 1h</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,paddingTop:18}}>
                {tline.map((e,i)=>{
                  const tone = tones[e.tone];
                  return (
                    <div key={i} style={{
                      position:'relative',
                      background:'rgba(255,255,255,0.9)',
                      backdropFilter:'blur(14px) saturate(140%)',
                      border:'1px solid rgba(255,255,255,0.7)',
                      borderLeft:`3px solid ${tone.bg}`,
                      borderRadius:12,padding:'10px 14px',
                      boxShadow:`0 8px 22px ${tone.ring}`,
                    }}>
                      <div className="wf-row" style={{gap:8,marginBottom:2}}>
                        <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{e.t}</span>
                        <span style={{fontSize:11,fontWeight:700,color:tone.bg,letterSpacing:'0.02em'}}>{e.s}</span>
                      </div>
                      <div style={{fontSize:12,fontFamily:'var(--font-heading,Baskervville,serif)',color:'var(--wf-ink)',lineHeight:1.35}}>{e.m}</div>
                      {/* connector to bar */}
                      <span style={{
                        position:'absolute',left:-22,top:'50%',width:14,height:1,
                        background:tone.bg,opacity:0.4,
                      }}/>
                    </div>
                  );
                })}
              </div>

              {/* mentor chip floating bottom */}
              <div style={{
                marginTop:12,
                background:'rgba(27,58,92,0.06)',
                border:'1px solid rgba(27,58,92,0.18)',
                borderRadius:12,padding:'10px 14px',
                display:'flex',gap:10,alignItems:'center',
              }}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>SK</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700}}>Sami K. · mentor assigné</div>
                  <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>3 retours donnés · 2 en cours</div>
                </div>
                <span className="wf-pill is-green" style={{fontSize:9}}>● en ligne</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomTicker live focus={4}/>
      <DogMascot message="Atlas est tout chaud — surveille leur prochaine soumission !"/>
    </AdminShell>
  );
};

// === Variant 4 — LIVE ROOM (top-down radar) ================================
// Each team is a circle in the workshop. Radius scales with XP.
// Active teams pulse rings + a tiny vibration. Stalled teams sit grey.

const ROOM_TEAMS = [
  { ...TEAMS[0],  x:62, y:34, active:'live',    pulse:true  }, // Atlas — just submitted
  { ...TEAMS[1],  x:30, y:24, active:'live',    pulse:true  }, // Boréal
  { ...TEAMS[2],  x:78, y:62, active:'recent'                }, // Cyrus
  { ...TEAMS[3],  x:18, y:70, active:'stalled'               }, // Delta — alert
  { ...TEAMS[4],  x:46, y:58, active:'recent'                }, // Éole
  { ...TEAMS[5],  x:80, y:30, active:'recent'                }, // Fénix
  { ...TEAMS[6],  x:24, y:48, active:'live',    pulse:true  }, // Galileo
  { ...TEAMS[7],  x:58, y:78, active:'recent'                }, // Helios
  { ...TEAMS[8],  x:88, y:46, active:'recent'                }, // Iris
  { ...TEAMS[9],  x:38, y:84, active:'stalled'               }, // Juno
  { ...TEAMS[10], x:72, y:18, active:'recent'                }, // Kappa
  { ...TEAMS[11], x:50, y:42, active:'recent'                }, // Lunar
];

const RoomCircle = ({ t }) => {
  // radius scales with XP (200 → 820 mapped to 28 → 64)
  const r = 28 + ((t.xp - 200) / 620) * 36;
  const isLive    = t.active === 'live';
  const isStalled = t.active === 'stalled';
  const fill = isStalled ? '#9A917F' : `hsl(${210 - (t.level*8)},${isLive?60:40}%,${isLive?38:55}%)`;
  const ring = isLive ? '#C44536' : isStalled ? '#9A917F' : '#1B3A5C';
  return (
    <div style={{
      position:'absolute',left:`${t.x}%`,top:`${t.y}%`,
      width:r*2,height:r*2,
      transform:`translate(-50%,-50%)`,
      animation: t.pulse ? 'wf-vibrate 0.4s ease-in-out infinite' : 'none',
    }}>
      {/* outer pulse rings */}
      {isLive && (
        <>
          <span style={{position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${ring}`,animation:'wf-room-pulse 1.6s ease-out infinite'}}/>
          <span style={{position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${ring}`,animation:'wf-room-pulse 1.6s ease-out infinite 0.5s'}}/>
        </>
      )}
      {/* circle */}
      <div style={{
        position:'absolute',inset:0,borderRadius:'50%',
        background:`radial-gradient(circle at 35% 30%,${isStalled?'#B8AE99':isLive?'#3D6B95':'#4A7BB0'}, ${fill})`,
        border:`2px solid ${isLive?'#fff':'rgba(255,255,255,0.6)'}`,
        boxShadow:isLive
          ? `0 0 0 4px ${ring}33, 0 12px 28px rgba(196,69,54,0.25)`
          : `0 6px 16px rgba(43,38,30,${isStalled?0.08:0.2})`,
        opacity:isStalled?0.6:1,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        color:'#fff',padding:6,
      }}>
        <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:Math.round(r*0.35),fontWeight:700,lineHeight:1}}>{t.name}</div>
        <div style={{fontSize:Math.round(r*0.22),opacity:0.85,marginTop:3,fontFamily:'Montserrat,sans-serif',fontWeight:600}}>L{t.level} · {t.xp}</div>
      </div>
      {/* live label */}
      {isLive && (
        <span style={{
          position:'absolute',top:-8,right:-4,
          background:'#C44536',color:'#fff',
          fontSize:8,fontWeight:800,letterSpacing:'0.12em',
          padding:'2px 6px',borderRadius:99,
          boxShadow:'0 4px 10px rgba(196,69,54,0.4)',
        }}>● LIVE</span>
      )}
      {isStalled && (
        <span style={{
          position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',
          background:'rgba(255,255,255,0.95)',color:'#9A917F',
          fontSize:8,fontWeight:700,letterSpacing:'0.1em',
          padding:'2px 6px',borderRadius:99,border:'1px solid rgba(154,145,127,0.4)',
          whiteSpace:'nowrap',
        }}>● en pause</span>
      )}
    </div>
  );
};

const AdminRoom = () => (
  <AdminShell>
    <AdminTopbar/>
    <div style={{padding:'14px 28px 8px',display:'flex',gap:14,alignItems:'center'}}>
      <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:26,fontWeight:600,letterSpacing:'-0.015em',margin:0}}>Salle · vue d'ensemble</h1>
      <span className="wf-pill" style={{fontSize:10,background:'#C44536',color:'#fff'}}>● 3 équipes en activité</span>
      <span className="wf-pill is-amber" style={{fontSize:10}}>! 2 en pause</span>
      <span className="wf-grow"/>
      <span style={{fontSize:11,color:'var(--wf-ink-soft)'}}>taille du cercle = progression · vibre quand l'équipe livre</span>
    </div>

    <div style={{padding:'8px 28px 140px',height:'calc(100% - 71px - 60px - 130px)',position:'relative'}}>
      <div style={{
        position:'relative',width:'100%',height:'100%',
        background:'linear-gradient(180deg,rgba(255,255,255,0.5),rgba(245,239,225,0.4))',
        backdropFilter:'blur(20px)',
        border:'1px solid rgba(154,145,127,0.3)',
        borderRadius:24,
        overflow:'hidden',
        boxShadow:'inset 0 1px 2px rgba(255,255,255,0.6), 0 12px 30px rgba(43,38,30,0.06)',
      }}>
        {/* grid floor */}
        <svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:0.18}}>
          <defs>
            <pattern id="roomgrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#9A917F" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#roomgrid)"/>
        </svg>

        {/* room labels */}
        <div style={{position:'absolute',top:14,left:18,fontSize:9,letterSpacing:'0.2em',color:'var(--wf-ink-faint)',fontWeight:700}}>SCÈNE · NORD</div>
        <div style={{position:'absolute',bottom:14,right:18,fontSize:9,letterSpacing:'0.2em',color:'var(--wf-ink-faint)',fontWeight:700}}>BUFFET · SUD</div>
        <div style={{position:'absolute',top:'50%',left:14,fontSize:9,letterSpacing:'0.2em',color:'var(--wf-ink-faint)',fontWeight:700,transform:'rotate(-90deg) translateX(50%)',transformOrigin:'left'}}>MENTORS</div>

        {/* connection lines between live + stalled (subtle activity flow) */}
        <svg style={{position:'absolute',inset:0,pointerEvents:'none'}} width="100%" height="100%">
          {ROOM_TEAMS.filter(t=>t.active==='live').map((a,i)=>(
            ROOM_TEAMS.filter(b=>b.active==='live' && b.id!==a.id).map((b,j)=>(
              <line key={`${i}-${j}`} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke="#C44536" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.25"/>
            ))
          ))}
        </svg>

        {/* circles */}
        {ROOM_TEAMS.map(t => <RoomCircle key={t.id} t={t}/>)}

        {/* legend */}
        <div style={{
          position:'absolute',bottom:16,left:16,
          background:'rgba(255,255,255,0.85)',backdropFilter:'blur(14px)',
          border:'1px solid rgba(154,145,127,0.3)',borderRadius:12,
          padding:'10px 14px',display:'flex',flexDirection:'column',gap:6,
          fontSize:10,color:'var(--wf-ink-soft)',
        }}>
          <div className="wf-kicker" style={{marginBottom:2}}>Légende</div>
          <div className="wf-row" style={{gap:8}}><span style={{width:10,height:10,borderRadius:'50%',background:'#3D6B95',boxShadow:'0 0 0 3px rgba(196,69,54,0.4)'}}/>en activité (livre, soumet)</div>
          <div className="wf-row" style={{gap:8}}><span style={{width:10,height:10,borderRadius:'50%',background:'#4A7BB0'}}/>en mission</div>
          <div className="wf-row" style={{gap:8}}><span style={{width:10,height:10,borderRadius:'50%',background:'#9A917F',opacity:0.6}}/>en pause &gt; 25 min</div>
          <div className="wf-row" style={{gap:8,marginTop:2,color:'var(--wf-ink-faint)'}}>◇ taille = XP cumulés</div>
        </div>
      </div>
    </div>

    <BottomTicker live focus={0}/>
    <DogMascot message="Atlas et Galileo livrent en même temps — branle‑bas !"/>

    <style>{`
      @keyframes wf-room-pulse {
        0%   { transform:scale(1);   opacity:0.6; }
        100% { transform:scale(1.6); opacity:0;   }
      }
      @keyframes wf-vibrate {
        0%,100% { transform:translate(-50%,-50%); }
        25%     { transform:translate(calc(-50% + 1px),calc(-50% - 1px)); }
        50%     { transform:translate(calc(-50% - 1px),calc(-50% + 1px)); }
        75%     { transform:translate(calc(-50% + 1px),calc(-50% + 1px)); }
      }
    `}</style>
  </AdminShell>
);

Object.assign(window, { AdminDashboard, AdminReview, AdminDashboardLive, AdminAchievement, AdminFocus, AdminRoom });
