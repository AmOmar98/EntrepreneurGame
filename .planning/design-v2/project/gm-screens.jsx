// GameMaster Cohort Dashboard — 4 variations

const teams = [
  { id:'atlas',   name:'Atlas',     emoji:'🏔', l:3, mood:'on-track', flags:0, sub:2, app:6, rev:1, mentor:'Sami K.',   blocked:false, lastAct:'2 min', xp:720, pitch:78 },
  { id:'kairos',  name:'Kairos',    emoji:'⏳', l:3, mood:'on-track', flags:1, sub:1, app:5, rev:2, mentor:'Salma B.',  blocked:false, lastAct:'8 min', xp:680, pitch:74 },
  { id:'nimbus',  name:'Nimbus',    emoji:'☁',  l:4, mood:'ahead',    flags:0, sub:3, app:7, rev:0, mentor:'Karim M.',  blocked:false, lastAct:'1 min', xp:840, pitch:82 },
  { id:'orion',   name:'Orion',     emoji:'★',  l:2, mood:'behind',   flags:2, sub:0, app:3, rev:1, mentor:'Sami K.',   blocked:true,  lastAct:'34 min',xp:380, pitch:48 },
  { id:'phoenix', name:'Phoenix',   emoji:'🔥', l:3, mood:'on-track', flags:0, sub:2, app:5, rev:1, mentor:'Salma B.',  blocked:false, lastAct:'4 min', xp:660, pitch:71 },
  { id:'meraki',  name:'Meraki',    emoji:'❤', l:3, mood:'on-track', flags:1, sub:1, app:5, rev:2, mentor:'Karim M.',  blocked:false, lastAct:'12 min',xp:640, pitch:69 },
  { id:'lumen',   name:'Lumen',     emoji:'☀', l:4, mood:'ahead',    flags:0, sub:2, app:8, rev:0, mentor:'Sami K.',   blocked:false, lastAct:'3 min', xp:880, pitch:85 },
  { id:'thalassa',name:'Thalassa',  emoji:'🌊', l:2, mood:'behind',   flags:1, sub:0, app:2, rev:1, mentor:'Salma B.',  blocked:false, lastAct:'22 min',xp:340, pitch:55 },
  { id:'vega',    name:'Vega',      emoji:'✦',  l:3, mood:'on-track', flags:0, sub:1, app:6, rev:1, mentor:'Karim M.',  blocked:false, lastAct:'6 min', xp:700, pitch:76 },
  { id:'helios',  name:'Helios',    emoji:'☀', l:3, mood:'on-track', flags:0, sub:2, app:5, rev:1, mentor:'Sami K.',   blocked:false, lastAct:'9 min', xp:660, pitch:72 },
  { id:'tara',    name:'Tara',      emoji:'△',  l:1, mood:'behind',   flags:3, sub:0, app:1, rev:0, mentor:'Salma B.',  blocked:true,  lastAct:'48 min',xp:180, pitch:30 },
  { id:'zephyr',  name:'Zephyr',    emoji:'⚡',  l:4, mood:'ahead',    flags:0, sub:2, app:7, rev:0, mentor:'Karim M.',  blocked:false, lastAct:'1 min', xp:820, pitch:80 },
];

const GMTopbar = () => (
  <div className="wf-topbar">
    <div className="wf-brand">
      <div className="wf-brand-mark">E</div>
      <div className="wf-stack">
        <div className="wf-brand-name">Console GameMaster</div>
        <div className="wf-brand-sub">EIC · Hack‑Days · Jour 1 · 14:32</div>
      </div>
    </div>
    <div className="wf-row" style={{gap:14}}>
      <span className="wf-pill is-rose">3 équipes bloquées</span>
      <span className="wf-pill is-amber">7 livrables en revue</span>
      <span className="wf-pill is-green">12 / 12 actives</span>
      <span className="wf-btn is-primary">＋ Annonce cohorte</span>
    </div>
  </div>
);

const GMSide = ({ active = "cohort" }) => {
  const links = [
    { id:'cohort', i:'▦', l:'Vue cohorte' },
    { id:'review', i:'☑', l:'File de revue', badge:'7' },
    { id:'mentors', i:'◉', l:'Mentors' },
    { id:'jury',   i:'★', l:'Jury & pitch' },
    { id:'rules',  i:'⚙', l:'Niveaux & XP' },
    { id:'broadcast', i:'📣', l:'Annonces' },
  ];
  return (
    <div className="wf-side">
      <div className="wf-side-section">
        <div className="wf-kicker" style={{marginBottom:6}}>Pilotage</div>
        {links.map(l => (
          <div key={l.id} className={`wf-side-link ${active===l.id?'is-active':''}`}>
            <span style={{width:16,textAlign:'center'}}>{l.i}</span>
            <span className="wf-grow">{l.l}</span>
            {l.badge && <span className="wf-pill is-amber" style={{padding:'1px 6px',fontSize:9}}>{l.badge}</span>}
          </div>
        ))}
      </div>
      <div className="wf-side-section">
        <div className="wf-kicker" style={{marginBottom:6}}>Données</div>
        <div className="wf-side-link"><span>📊</span><span>Rapports</span></div>
        <div className="wf-side-link"><span>↓</span><span>Export CSV</span></div>
      </div>
      <div style={{marginTop:'auto',padding:10,background:'var(--wf-blue-tint)',borderRadius:8,fontSize:11}}>
        <div className="wf-mono" style={{color:'var(--wf-blue)',marginBottom:4}}>PITCH JURY</div>
        <div style={{color:'var(--wf-ink)'}}>Demain · 09:30</div>
        <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>5 jurés confirmés / 6</div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, sub, accent='blue' }) => (
  <div className="wf-card" style={{padding:'12px 14px'}}>
    <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>{label}</div>
    <div style={{fontSize:24,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',color:`var(--wf-${accent})`}}>{value}</div>
    <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>{sub}</div>
  </div>
);

// ============================================================================
// V1 — HEATMAP MATRIX (most operational)
// ============================================================================

const HeatmapMatrix = () => {
  const cells = (team) => {
    return [0,1,2,3,4,5,6,7].map(lvl => {
      if (lvl < team.l) return { s:'done' };
      if (lvl === team.l) {
        if (team.blocked) return { s:'blocked' };
        if (team.flags > 0) return { s:'review' };
        return { s:'progress' };
      }
      return { s:'locked' };
    });
  };
  const fill = {
    done:     { bg:'var(--wf-green)',     fg:'#fff' },
    progress: { bg:'var(--wf-blue)',      fg:'#fff' },
    review:   { bg:'var(--wf-amber)',     fg:'#fff' },
    blocked:  { bg:'var(--wf-rose)',      fg:'#fff' },
    locked:   { bg:'var(--wf-paper-deep)',fg:'var(--wf-ink-faint)' },
  };
  return (
    <div className="wf-card" style={{padding:14}}>
      <div className="wf-row" style={{gap:10,marginBottom:10}}>
        <h3 style={{fontSize:16}}>Cohorte · matrice de progression</h3>
        <span className="wf-grow"/>
        <span className="wf-pill is-green">12 équipes</span>
        <span className="wf-pill">Tri : niveau ↓</span>
      </div>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'2px 4px',fontSize:11}}>
        <thead>
          <tr>
            <th style={{textAlign:'left',padding:'4px 6px',color:'var(--wf-ink-faint)',fontWeight:600}}>Équipe</th>
            {['L0','L1','L2','L3','L4','L5','L6','L7'].map(l => (
              <th key={l} style={{padding:'4px',color:'var(--wf-ink-faint)',fontWeight:600,fontSize:10}}>{l}</th>
            ))}
            <th style={{padding:'4px',color:'var(--wf-ink-faint)',fontWeight:600,fontSize:10}}>Mentor</th>
            <th style={{padding:'4px',color:'var(--wf-ink-faint)',fontWeight:600,fontSize:10}}>Activité</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.id}>
              <td style={{padding:'4px 6px',fontWeight:600}}>
                <span style={{marginRight:6}}>{t.emoji}</span>{t.name}
                {t.blocked && <span className="wf-pill is-rose" style={{marginLeft:6,padding:'0 5px',fontSize:9}}>!</span>}
              </td>
              {cells(t).map((c,i) => (
                <td key={i} style={{
                  background:fill[c.s].bg, color:fill[c.s].fg,
                  padding:'8px 0',textAlign:'center',borderRadius:4,
                  fontSize:10,fontWeight:600,
                  border: c.s==='locked'? '1px dashed var(--wf-line)':'none'
                }}>
                  {c.s==='done'?'✓':c.s==='progress'?'•':c.s==='review'?'⏵':c.s==='blocked'?'!':''}
                </td>
              ))}
              <td style={{padding:'4px 6px',fontSize:10,color:'var(--wf-ink-soft)'}}>{t.mentor}</td>
              <td style={{padding:'4px 6px',fontSize:10,color:t.blocked?'var(--wf-rose)':'var(--wf-ink-soft)'}}>il y a {t.lastAct}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="wf-row" style={{gap:8,marginTop:12,fontSize:10}}>
        <span className="wf-pill is-green">✓ Validé</span>
        <span className="wf-pill is-blue">• En cours</span>
        <span className="wf-pill is-amber">⏵ À revoir</span>
        <span className="wf-pill is-rose">! Bloqué</span>
        <span className="wf-pill">○ Verrouillé</span>
      </div>
    </div>
  );
};

const GMHeatmapDesktop = () => (
  <div className="wf">
    <GMTopbar/>
    <div style={{display:'flex',height:'calc(100% - 60px)'}}>
      <GMSide/>
      <div style={{flex:1,padding:'18px 22px',overflow:'auto'}}>
        <div className="wf-kicker">Vue cohorte · matrice</div>
        <h2 style={{fontSize:22,marginBottom:14}}>12 équipes, 8 niveaux, en un coup d'œil.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
          <StatTile label="ÉQUIPES ACTIVES" value="12 / 12" sub="dernière activité < 2h" accent="green"/>
          <StatTile label="NIVEAU MOYEN"   value="L2.9"   sub="cible J1 fin = L3" accent="blue"/>
          <StatTile label="LIVRABLES EN REVUE" value="7" sub="dont 2 > 1h d'attente" accent="amber"/>
          <StatTile label="ÉQUIPES BLOQUÉES"   value="3" sub="Orion, Tara, Atlas" accent="rose"/>
        </div>
        <HeatmapMatrix/>
      </div>
    </div>
  </div>
);

const GMHeatmapMobile = () => (
  <div className="wf">
    <MobileStatus/>
    <div style={{padding:'12px 14px 84px',height:'100%',overflow:'auto'}}>
      <div className="wf-kicker">GameMaster</div>
      <h3 style={{fontSize:16,marginBottom:8}}>Cohorte</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        <StatTile label="ACTIVES" value="12/12" sub="" accent="green"/>
        <StatTile label="BLOQUÉES" value="3" sub="" accent="rose"/>
      </div>
      <div className="wf-card" style={{padding:10,marginBottom:10}}>
        <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)',marginBottom:6}}>NIVEAU PAR ÉQUIPE</div>
        {teams.slice(0,8).map(t=>(
          <div key={t.id} className="wf-row" style={{gap:6,marginBottom:4,fontSize:11}}>
            <span style={{width:80,fontWeight:600}}>{t.emoji} {t.name}</span>
            <div className="wf-grow" style={{height:14,background:'var(--wf-paper-deep)',borderRadius:3,position:'relative'}}>
              <div style={{position:'absolute',inset:0,width:`${(t.l/7)*100}%`,
                background: t.blocked?'var(--wf-rose)':t.mood==='ahead'?'var(--wf-green)':'var(--wf-blue)',
                borderRadius:3}}/>
            </div>
            <span className="wf-mono" style={{width:24,textAlign:'right',fontSize:10}}>L{t.l}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// V2 — STADIUM / ARENA (real-time tile view)
// ============================================================================

const TeamTile = ({ t, big=false }) => {
  const moodColor = t.blocked?'var(--wf-rose)':t.mood==='ahead'?'var(--wf-green)':t.mood==='behind'?'var(--wf-amber)':'var(--wf-blue)';
  return (
    <div className="wf-card" style={{padding:big?12:10,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:moodColor,opacity:0.06}}/>
      <div className="wf-row" style={{gap:6,position:'relative',zIndex:1}}>
        <span style={{fontSize:big?20:16}}>{t.emoji}</span>
        <span style={{fontWeight:700,fontSize:big?14:12}}>{t.name}</span>
        <span className="wf-grow"/>
        <span style={{fontSize:10,color:moodColor,fontWeight:700}}>L{t.l}</span>
      </div>
      <div className="wf-bar" style={{height:5,marginTop:6,position:'relative',zIndex:1}}>
        <div style={{width:`${(t.l/7)*100}%`,background:moodColor}}/>
      </div>
      <div className="wf-row" style={{gap:4,marginTop:6,position:'relative',zIndex:1,fontSize:9}}>
        <span style={{color:'var(--wf-green)'}}>✓{t.app}</span>
        <span style={{color:'var(--wf-amber)'}}>⏵{t.rev}</span>
        {t.flags>0 && <span style={{color:'var(--wf-rose)'}}>!{t.flags}</span>}
        <span className="wf-grow"/>
        <span className="wf-faint">{t.lastAct}</span>
      </div>
    </div>
  );
};

const GMStadiumDesktop = () => (
  <div className="wf">
    <GMTopbar/>
    <div style={{display:'flex',height:'calc(100% - 60px)'}}>
      <GMSide/>
      <div style={{flex:1,padding:'18px 22px',overflow:'auto'}}>
        <div className="wf-row" style={{gap:10,marginBottom:6}}>
          <div>
            <div className="wf-kicker">Vue cohorte · arène</div>
            <h2 style={{fontSize:22}}>L'arène. Toutes les équipes, en direct.</h2>
          </div>
          <span className="wf-grow"/>
          <div className="wf-row" style={{gap:6}}>
            <span className="wf-pill is-green">● en avance (3)</span>
            <span className="wf-pill is-blue">● dans les temps (6)</span>
            <span className="wf-pill is-amber">● en retard (1)</span>
            <span className="wf-pill is-rose">● bloquées (2)</span>
          </div>
        </div>

        {/* Podium / leaders strip */}
        <div className="wf-row" style={{gap:10,margin:'14px 0',padding:'10px 14px',background:'var(--wf-paper-deep)',borderRadius:10,border:'1px solid var(--wf-line)'}}>
          <div className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)',width:80}}>EN TÊTE</div>
          {teams.filter(t=>t.mood==='ahead').slice(0,3).map((t,i)=>(
            <div key={t.id} className="wf-row" style={{gap:6,padding:'4px 8px',background:'#fff',borderRadius:6,border:'1px solid var(--wf-line)'}}>
              <span style={{fontWeight:700,color:i===0?'var(--wf-amber)':'var(--wf-ink-soft)'}}>#{i+1}</span>
              <span>{t.emoji} <b>{t.name}</b></span>
              <span className="wf-pill is-green" style={{fontSize:9,padding:'1px 6px'}}>L{t.l} · {t.xp} XP</span>
            </div>
          ))}
          <span className="wf-grow"/>
          <span className="wf-mono" style={{fontSize:10,color:'var(--wf-rose)',fontWeight:700}}>⚠ ATTENTION : Tara · 48 min sans activité</span>
        </div>

        {/* Tile grid arranged like seats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {teams.map(t => <TeamTile key={t.id} t={t}/>)}
        </div>
      </div>
    </div>
  </div>
);

const GMStadiumMobile = () => (
  <div className="wf">
    <MobileStatus/>
    <div style={{padding:'12px 14px 84px',height:'100%',overflow:'auto'}}>
      <div className="wf-kicker">Arène</div>
      <h3 style={{fontSize:16,marginBottom:8}}>12 équipes en direct</h3>
      <div className="wf-row" style={{gap:6,marginBottom:10,fontSize:9}}>
        <span className="wf-pill is-green">3 en avance</span>
        <span className="wf-pill is-rose">2 bloquées</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {teams.slice(0,8).map(t => <TeamTile key={t.id} t={t}/>)}
      </div>
    </div>
  </div>
);

// ============================================================================
// V3 — CONSTELLATION (network of relationships)
// ============================================================================

const ConstellationView = () => {
  // Position teams in a starfield, mentors as gravity centers
  const mentors = [
    { id:'sami',  name:'Sami K.',  x: 180, y: 160, color:'#1B3A5C' },
    { id:'salma', name:'Salma B.', x: 460, y: 130, color:'#2E7D32' },
    { id:'karim', name:'Karim M.', x: 320, y: 360, color:'#B47A14' },
  ];
  const teamPos = teams.map((t,i) => {
    const m = mentors.find(m => t.mentor.startsWith(m.name.split(' ')[0]));
    const angle = (i / teams.length) * Math.PI * 2;
    const r = 90 + (i%3)*15;
    return { ...t, mx: m.x, my: m.y, mColor: m.color,
      x: m.x + Math.cos(angle + i*0.4)*r,
      y: m.y + Math.sin(angle + i*0.4)*r };
  });
  return (
    <svg viewBox="0 0 660 480" width="100%" style={{display:'block',background:'#0E1A2C',borderRadius:10}}>
      {/* faint stars background */}
      {[...Array(40)].map((_,i)=>(
        <circle key={i} cx={Math.random()*660} cy={Math.random()*480} r={Math.random()*1.2}
          fill="#fff" opacity={Math.random()*0.5+0.1}/>
      ))}
      {/* mentor-team links */}
      {teamPos.map(t => (
        <line key={'L-'+t.id} x1={t.mx} y1={t.my} x2={t.x} y2={t.y}
          stroke={t.mColor} strokeWidth={t.blocked?1.5:0.5} opacity={t.blocked?0.6:0.25}
          strokeDasharray={t.blocked?'3,3':''}/>
      ))}
      {/* mentor cores */}
      {mentors.map(m => (
        <g key={m.id}>
          <circle cx={m.x} cy={m.y} r="40" fill={m.color} opacity="0.18"/>
          <circle cx={m.x} cy={m.y} r="20" fill={m.color}/>
          <text x={m.x} y={m.y+4} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{m.name.split(' ')[0]}</text>
          <text x={m.x} y={m.y+34} textAnchor="middle" fontSize="9" fill="#fff" opacity="0.6" letterSpacing="1.5">MENTOR</text>
        </g>
      ))}
      {/* team planets */}
      {teamPos.map(t => (
        <g key={t.id}>
          {t.blocked && (
            <circle cx={t.x} cy={t.y} r="18" fill="#A23B3B" opacity="0.4">
              <animate attributeName="r" values="14;22;14" dur="1.6s" repeatCount="indefinite"/>
            </circle>
          )}
          <circle cx={t.x} cy={t.y} r="11"
            fill={t.blocked?'#A23B3B':t.mood==='ahead'?'#2E7D32':t.mood==='behind'?'#B47A14':'#fff'}
            stroke="#fff" strokeWidth="1.5"/>
          <text x={t.x} y={t.y+3} textAnchor="middle" fontSize="9" fontWeight="700"
            fill={t.blocked||t.mood==='ahead'?'#fff':'#1B2740'}>L{t.l}</text>
          <text x={t.x} y={t.y+24} textAnchor="middle" fontSize="9" fill="#fff" opacity="0.85">{t.name}</text>
        </g>
      ))}
      {/* legend */}
      <g transform="translate(20, 440)">
        <text fontSize="9" fill="#fff" opacity="0.7" letterSpacing="1.5" fontFamily="Montserrat">CONSTELLATION HACK‑DAYS · 12 ÉQUIPES · 3 MENTORS</text>
      </g>
      <g transform="translate(550, 30)">
        <text fontSize="9" fill="#A23B3B" fontFamily="Caveat" textAnchor="end">⚠ Orion clignote — bloqué L2</text>
      </g>
    </svg>
  );
};

const GMConstellationDesktop = () => (
  <div className="wf">
    <GMTopbar/>
    <div style={{display:'flex',height:'calc(100% - 60px)'}}>
      <GMSide/>
      <div style={{flex:1,padding:'18px 22px',overflow:'auto'}}>
        <div className="wf-kicker">Vue cohorte · constellation</div>
        <h2 style={{fontSize:22,marginBottom:6}}>Charge mentors · santé équipes.</h2>
        <p style={{fontSize:12,color:'var(--wf-ink-soft)',marginBottom:14,maxWidth:600}}>
          Chaque équipe est un satellite de son mentor. Une équipe qui clignote en rouge demande une intervention.
        </p>
        <ConstellationView/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:14}}>
          {[
            { name:'Sami K.', load:4, blocked:1, c:'var(--wf-blue)' },
            { name:'Salma B.', load:4, blocked:1, c:'var(--wf-green)' },
            { name:'Karim M.', load:4, blocked:0, c:'var(--wf-amber)' },
          ].map(m=>(
            <div key={m.name} className="wf-card" style={{padding:'10px 12px'}}>
              <div className="wf-row" style={{gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:m.c}}/>
                <span style={{fontWeight:700}}>{m.name}</span>
                <span className="wf-grow"/>
                <span className="wf-pill">{m.load} équipes</span>
              </div>
              <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:4}}>
                {m.blocked>0 ? <span style={{color:'var(--wf-rose)'}}>{m.blocked} équipe à débloquer</span> : 'Charge équilibrée'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const GMConstellationMobile = () => (
  <div className="wf">
    <MobileStatus/>
    <div style={{padding:'12px 14px 84px',height:'100%',overflow:'auto'}}>
      <div className="wf-kicker">Constellation</div>
      <h3 style={{fontSize:16,marginBottom:8}}>Mentors & équipes</h3>
      <div style={{borderRadius:10,overflow:'hidden',marginBottom:10}}>
        <ConstellationView/>
      </div>
      <div className="wf-card" style={{padding:'10px 12px',background:'var(--wf-rose-tint)',borderColor:'#DCB1B1'}}>
        <div style={{fontWeight:700,color:'var(--wf-rose)',fontSize:12}}>⚠ 3 équipes à débloquer</div>
        <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>Orion · Tara · Thalassa</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// V4 — MISSION CONTROL (live ticker + alert queue)
// ============================================================================

const tickerFeed = [
  { t:'14:32', who:'Nimbus',   what:'a soumis M3.2 — Carte d\'empathie',    kind:'submit' },
  { t:'14:31', who:'Sami K.',  what:'a validé Lumen / M4.1 (+120 XP)',     kind:'approve' },
  { t:'14:28', who:'Tara',     what:'inactive depuis 48 min',              kind:'alert' },
  { t:'14:25', who:'Vega',     what:'a demandé un mentor sur L3',          kind:'help' },
  { t:'14:22', who:'Salma B.', what:'a renvoyé Kairos / M2.3 — à retravailler', kind:'reject' },
  { t:'14:18', who:'Atlas',    what:'a franchi L3 · 720 XP',                kind:'levelup' },
  { t:'14:15', who:'Orion',    what:'bloqué sur L2 — flag posé',           kind:'alert' },
  { t:'14:12', who:'Phoenix',  what:'a soumis M3.1',                       kind:'submit' },
];

const tickerColors = {
  submit:'var(--wf-blue)', approve:'var(--wf-green)', reject:'var(--wf-amber)',
  alert:'var(--wf-rose)', help:'var(--wf-amber)', levelup:'var(--wf-green)',
};

const reviewQueue = [
  { team:'Nimbus',  m:'M3.2', title:'Carte d\'empathie utilisateur', wait:'2 min',  mentor:'Karim M.', priority:'normal' },
  { team:'Phoenix', m:'M3.1', title:'5 entretiens documentés',       wait:'14 min', mentor:'Salma B.', priority:'normal' },
  { team:'Kairos',  m:'M3.3', title:'Hypothèse valeur',              wait:'42 min', mentor:'Salma B.', priority:'high' },
  { team:'Atlas',   m:'M3.2', title:'5 entretiens documentés',       wait:'1h 8m',  mentor:'Sami K.',  priority:'urgent' },
  { team:'Lumen',   m:'M4.1', title:'Story map',                     wait:'8 min',  mentor:'Sami K.',  priority:'normal' },
  { team:'Vega',    m:'M3.1', title:'Carte d\'empathie',             wait:'19 min', mentor:'Karim M.', priority:'normal' },
  { team:'Helios',  m:'M3.2', title:'Entretiens',                    wait:'31 min', mentor:'Sami K.',  priority:'high' },
];

const GMMissionControlDesktop = () => (
  <div className="wf">
    <GMTopbar/>
    <div style={{display:'flex',height:'calc(100% - 60px)'}}>
      <GMSide/>
      <div style={{flex:1,padding:'18px 20px',display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,overflow:'hidden'}}>
        <div className="wf-stack" style={{gap:12,minWidth:0,overflow:'auto',paddingRight:4}}>
          <div className="wf-row" style={{gap:10}}>
            <div>
              <div className="wf-kicker">Mission Control</div>
              <h2 style={{fontSize:22}}>Tour de contrôle.</h2>
            </div>
            <span className="wf-grow"/>
            <span className="wf-mono" style={{fontSize:11,color:'var(--wf-green)'}}>● LIVE</span>
          </div>

          {/* big stat strip */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            <StatTile label="LIVRABLES / HEURE" value="14" sub="↑ +30% vs J1 09:00" accent="green"/>
            <StatTile label="TEMPS REVUE MOY." value="22m" sub="cible < 30m" accent="blue"/>
            <StatTile label="ÉQUIPES À RISQUE" value="3" sub="Orion, Tara, Atlas" accent="rose"/>
            <StatTile label="XP DISTRIBUÉ" value="8 240" sub="cohorte · jour 1" accent="amber"/>
          </div>

          {/* Review queue */}
          <div className="wf-card" style={{padding:0,overflow:'hidden'}}>
            <div className="wf-row" style={{gap:8,padding:'10px 14px',borderBottom:'1px solid var(--wf-line)',background:'var(--wf-paper)'}}>
              <h3 style={{fontSize:14}}>File de revue</h3>
              <span className="wf-pill is-amber" style={{fontSize:10}}>{reviewQueue.length} en attente</span>
              <span className="wf-grow"/>
              <span className="wf-pill" style={{fontSize:10}}>Tri : urgence ↓</span>
            </div>
            {reviewQueue.map((r,i)=>(
              <div key={i} className="wf-row" style={{gap:8,padding:'10px 14px',borderBottom:i===reviewQueue.length-1?'none':'1px solid var(--wf-line)',fontSize:12}}>
                <span style={{width:6,height:6,borderRadius:'50%',
                  background:r.priority==='urgent'?'var(--wf-rose)':r.priority==='high'?'var(--wf-amber)':'var(--wf-line)'}}/>
                <span style={{width:90,fontWeight:600}}>{r.team}</span>
                <span className="wf-mono" style={{width:60,color:'var(--wf-ink-faint)'}}>{r.m}</span>
                <span className="wf-grow" style={{color:'var(--wf-ink-soft)'}}>{r.title}</span>
                <span style={{width:80,fontSize:11,color:r.priority==='urgent'?'var(--wf-rose)':'var(--wf-ink-soft)'}}>⏱ {r.wait}</span>
                <span style={{width:80,fontSize:11,color:'var(--wf-ink-soft)'}}>{r.mentor}</span>
                <span className="wf-btn" style={{padding:'4px 8px',fontSize:11}}>Reviewer →</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live ticker */}
        <div className="wf-card" style={{padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div className="wf-row" style={{gap:8,padding:'10px 14px',borderBottom:'1px solid var(--wf-line)',background:'#0E1A2C',color:'#fff'}}>
            <h3 style={{fontSize:13,color:'#fff'}}>Flux temps réel</h3>
            <span className="wf-grow"/>
            <span className="wf-mono" style={{fontSize:10,color:'#4CAF50'}}>● LIVE</span>
          </div>
          <div style={{flex:1,overflow:'auto',padding:'8px 0',background:'#142235'}}>
            {tickerFeed.map((e,i)=>(
              <div key={i} style={{padding:'8px 14px',borderLeft:`3px solid ${tickerColors[e.kind]}`,marginBottom:1,fontSize:11,color:'#E1E8F1'}}>
                <span className="wf-mono" style={{color:'#8A9AB0',marginRight:8}}>{e.t}</span>
                <b style={{color:'#fff'}}>{e.who}</b> {e.what}
              </div>
            ))}
          </div>
          <div style={{padding:'10px 14px',borderTop:'1px solid #2A3A4E',background:'#0E1A2C',color:'#fff'}}>
            <div className="wf-row" style={{gap:6,fontSize:11}}>
              <input className="wf-mono" placeholder="Annonce cohorte…" style={{flex:1,background:'#1E2A3A',border:'1px solid #2A3A4E',borderRadius:5,padding:'6px 8px',color:'#fff',outline:'none',fontSize:11}}/>
              <span className="wf-btn is-success" style={{padding:'5px 10px',fontSize:11}}>Diffuser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const GMMissionControlMobile = () => (
  <div className="wf">
    <MobileStatus/>
    <div style={{padding:'12px 14px 84px',height:'100%',overflow:'auto'}}>
      <div className="wf-row" style={{gap:8,marginBottom:6}}>
        <div>
          <div className="wf-kicker">Mission Control</div>
          <h3 style={{fontSize:16}}>Tour de contrôle</h3>
        </div>
        <span className="wf-grow"/>
        <span className="wf-mono" style={{fontSize:10,color:'var(--wf-green)'}}>● LIVE</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        <StatTile label="EN REVUE" value="7" sub="" accent="amber"/>
        <StatTile label="À RISQUE" value="3" sub="" accent="rose"/>
      </div>
      <div className="wf-card" style={{padding:0,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'8px 12px',background:'#0E1A2C',color:'#fff',fontSize:11}}>Flux temps réel</div>
        <div style={{maxHeight:200,overflow:'auto',background:'#142235'}}>
          {tickerFeed.slice(0,6).map((e,i)=>(
            <div key={i} style={{padding:'6px 12px',borderLeft:`3px solid ${tickerColors[e.kind]}`,fontSize:10,color:'#E1E8F1'}}>
              <span className="wf-mono" style={{color:'#8A9AB0',marginRight:6}}>{e.t}</span>
              <b style={{color:'#fff'}}>{e.who}</b> {e.what}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// Rationale notes
// ============================================================================

const Voice2 = ({ kind, name, role, said }) => (
  <div className={`wf-voice ${kind}`}>
    <div className="who">{name.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
    <div>
      <div className="role">{role}</div>
      <div className="said">{said}</div>
    </div>
  </div>
);

const GMHeatmapNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 1</div>
    <h4>Matrice équipes × niveaux</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Densité d'information maximale, scannable d'un coup d'œil.</p>
    <Voice2 kind="ux" name="UX" role="Designer UX" said="Pour qui passe la journée à valider des livrables, c'est la vue 'travail'. Une cellule = une décision."/>
    <Voice2 kind="gm" name="GM" role="GameMaster" said="C'est ce que je veux à 9h le matin : qui est où, qui m'attend, qui n'a pas démarré."/>
    <Voice2 kind="research" name="Re" role="Chercheure" said="Avantage : on voit l'écart cohorte. Si toute la colonne L3 est rouge, c'est que le brief est mauvais — pas les équipes."/>
    <Voice2 kind="eng" name="En" role="Ingénieur" said="Une simple table avec un statut par cellule. Aucun coût."/>
    <div className="wf-tradeoff"><b>Compromis :</b> hyper utile, mais peu engageant émotionnellement. À combiner avec une vue 'arène' pour les moments clés.</div>
  </div>
);

const GMStadiumNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 2</div>
    <h4>Arène · cartes équipes</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Tuiles colorées par humeur, podium visible, alerte de tête.</p>
    <Voice2 kind="ux" name="UX" role="Designer UX" said="Bonne pour projection sur grand écran pendant le bootcamp. Couleurs lisibles à 5 mètres."/>
    <Voice2 kind="pedag" name="Pe" role="Mentor" said="Le 'podium' au-dessus est ambivalent — utile pour la motivation, risqué pour les équipes en queue. À toggler par le GM."/>
    <Voice2 kind="gm" name="GM" role="GameMaster" said="Je peux pointer une tuile, projeter, montrer aux partenaires. Vue 'événement', pas vue 'travail'."/>
    <Voice2 kind="eng" name="En" role="Ingénieur" said="Animation de pulsation pour les équipes bloquées — coût zéro avec CSS."/>
    <div className="wf-tradeoff"><b>Compromis :</b> plus chaleureux, moins dense. Décision d'action plus lente (il faut cliquer pour voir détails).</div>
  </div>
);

const GMConstellationNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 3</div>
    <h4>Constellation mentors</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Pas une vue progression : une vue charge mentors et liens humains.</p>
    <Voice2 kind="ux" name="UX" role="Designer UX" said="Réponds à une question que les autres vues ne posent pas : qui mentore qui, et qui est saturé ?"/>
    <Voice2 kind="pedag" name="Pe" role="Mentor" said="Précieux côté mentor — je vois mes 4 équipes, je vois si Sami est surchargé, on peut redistribuer."/>
    <Voice2 kind="research" name="Re" role="Chercheure" said="Belle data viz mais lecture moins évidente. À garder comme onglet secondaire 'santé du dispositif'."/>
    <Voice2 kind="eng" name="En" role="Ingénieur" said="Layout polaire autour de mentors. Animation de pulsation pour les bloqués. Un peu de SVG, rien de coûteux."/>
    <div className="wf-tradeoff"><b>Compromis :</b> indispensable mais complémentaire. Pas la vue d'accueil — un onglet 'mentors & charge'.</div>
  </div>
);

const GMMissionControlNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 4</div>
    <h4>Mission Control · live</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Stat tiles + file de revue priorisée + flux temps réel + console annonce.</p>
    <Voice2 kind="ux" name="UX" role="Designer UX" said="C'est la vue 'pendant le rush'. Un livrable arrive, je le vois en flux ; il entre en queue ; je l'assigne."/>
    <Voice2 kind="gm" name="GM" role="GameMaster" said="Le panneau d'annonce intégré au flux est un gros plus — je n'ai pas à changer d'écran pour broadcaster."/>
    <Voice2 kind="eng" name="En" role="Ingénieur" said="Subscriptions Supabase realtime — chaque insert dans deliverables push un event. Pile dans nos cordes."/>
    <Voice2 kind="research" name="Re" role="Chercheure" said="Risque : effet 'aéroport' qui stresse au lieu de calmer. Bien doser densité et silence."/>
    <div className="wf-tradeoff"><b>Compromis :</b> la plus puissante, mais aussi la plus chargée. À mixer avec une vue calme (heatmap) en onglet par défaut.</div>
  </div>
);

Object.assign(window, {
  GMHeatmapDesktop, GMHeatmapMobile, GMHeatmapNotes,
  GMStadiumDesktop, GMStadiumMobile, GMStadiumNotes,
  GMConstellationDesktop, GMConstellationMobile, GMConstellationNotes,
  GMMissionControlDesktop, GMMissionControlMobile, GMMissionControlNotes,
});
