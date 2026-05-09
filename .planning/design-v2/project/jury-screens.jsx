// Pitch Jury Scoring — 4 variations

const criteria = [
  { id:'problem',  fr:'Problème',         en:'Problem',         desc:'Clarté & importance', weight:20 },
  { id:'solution', fr:'Solution',          en:'Solution',        desc:'Pertinence & faisabilité', weight:20 },
  { id:'market',   fr:'Marché',            en:'Market',          desc:'Taille, segment, accès', weight:20 },
  { id:'business', fr:'Modèle économique', en:'Business model',  desc:'Viabilité & projection', weight:20 },
  { id:'team',     fr:'Équipe & pitch',    en:'Team & delivery', desc:'Cohésion, clarté, conviction', weight:20 },
];

const JuryTopbar = ({ team = 'Atlas', emoji = '🏔', juror = 'Mme. F. Bennani' }) => (
  <div className="wf-topbar">
    <div className="wf-brand">
      <div className="wf-brand-mark">E</div>
      <div className="wf-stack">
        <div className="wf-brand-name">Pitch Jury · Hack‑Days</div>
        <div className="wf-brand-sub">EIC · UEMF · Jour 2 · 11:14</div>
      </div>
    </div>
    <div className="wf-row" style={{gap:14}}>
      <span className="wf-pill is-blue">Pitch en direct</span>
      <span className="wf-pill">⏱ 4:32 / 5:00</span>
      <div className="wf-row" style={{gap:8}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:'var(--wf-paper-deep)',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>FB</div>
        <div className="wf-stack" style={{fontSize:11}}>
          <div style={{fontWeight:600}}>{juror}</div>
          <div className="wf-faint">Juré · partenaire</div>
        </div>
      </div>
    </div>
  </div>
);

const JuryHeader = ({ team='Atlas', emoji='🏔' }) => (
  <div className="wf-row" style={{gap:14,padding:'14px 24px',borderBottom:'1px solid var(--wf-line)',background:'var(--wf-paper)'}}>
    <div style={{width:48,height:48,borderRadius:10,background:'var(--wf-blue-tint)',display:'grid',placeItems:'center',fontSize:24}}>{emoji}</div>
    <div className="wf-grow">
      <div className="wf-kicker">Équipe en cours · 7 / 12</div>
      <h2 style={{fontSize:22}}>{team} — « Maraya, miroir vocal pour patients aphasiques »</h2>
      <div style={{fontSize:11,color:'var(--wf-ink-soft)'}}>L7 · Pitch · 5 min de présentation + 3 min Q&R</div>
    </div>
    <div className="wf-row" style={{gap:6}}>
      <span className="wf-btn">← Précédent (Vega)</span>
      <span className="wf-btn">Suivant (Phoenix) →</span>
    </div>
  </div>
);

// ============================================================================
// V1 — FORM (clean conventional sliders)
// ============================================================================

const SliderRow = ({ c, value }) => (
  <div className="wf-card" style={{padding:'14px 18px'}}>
    <div className="wf-row" style={{gap:10,marginBottom:8}}>
      <div className="wf-grow">
        <div className="wf-row" style={{gap:8}}>
          <h4 style={{fontSize:15}}>{c.fr}</h4>
          <span className="wf-faint" style={{fontSize:11}}>· {c.en}</span>
          <span className="wf-pill" style={{fontSize:9}}>poids {c.weight}%</span>
        </div>
        <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:2}}>{c.desc}</div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontSize:28,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',color:'var(--wf-blue)',lineHeight:1}}>{value}</div>
        <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>/ 20</div>
      </div>
    </div>
    <div style={{position:'relative',height:32}}>
      <div style={{position:'absolute',top:14,left:0,right:0,height:4,background:'var(--wf-paper-deep)',borderRadius:2}}/>
      <div style={{position:'absolute',top:14,left:0,height:4,background:'var(--wf-blue)',borderRadius:2,width:`${(value/20)*100}%`}}/>
      {/* tick marks */}
      {[0,5,10,15,20].map(t=>(
        <div key={t} style={{position:'absolute',top:11,left:`${(t/20)*100}%`,transform:'translateX(-50%)',width:1,height:10,background:'var(--wf-line)'}}/>
      ))}
      {/* handle */}
      <div style={{position:'absolute',top:8,left:`${(value/20)*100}%`,transform:'translateX(-50%)',
        width:18,height:18,borderRadius:'50%',background:'#fff',border:'3px solid var(--wf-blue)',boxShadow:'0 2px 6px rgba(27,58,92,0.2)'}}/>
    </div>
    <div className="wf-row" style={{gap:6,marginTop:8}}>
      {['Faible','Moyen','Bon','Excellent'].map((l,i)=>(
        <span key={l} className="wf-pill" style={{fontSize:9,padding:'2px 6px',
          background: i===Math.floor(value/5.5)?'var(--wf-blue-tint)':'var(--wf-paper-deep)',
          color: i===Math.floor(value/5.5)?'var(--wf-blue)':'var(--wf-ink-faint)',
          borderColor: i===Math.floor(value/5.5)?'#B6C5DA':'var(--wf-line)',
        }}>{l}</span>
      ))}
    </div>
  </div>
);

const totalScore = (vals) => vals.reduce((a,v,i)=>a + v * (criteria[i].weight/100), 0).toFixed(1);

const JuryFormDesktop = () => {
  const values = [16, 14, 12, 10, 17];
  return (
    <div className="wf">
      <JuryTopbar/>
      <JuryHeader/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',height:'calc(100% - 60px - 78px)'}}>
        <div style={{padding:'18px 24px',overflow:'auto',display:'flex',flexDirection:'column',gap:12}}>
          {criteria.map((c,i)=> <SliderRow key={c.id} c={c} value={values[i]}/>)}
          <div className="wf-card" style={{padding:14}}>
            <div className="wf-kicker" style={{marginBottom:6}}>Commentaire qualitatif</div>
            <div className="wf-ph" style={{height:80}}>« Très clair sur le problème. Solution à creuser côté distribution. »</div>
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--wf-line)',padding:'18px 18px',background:'var(--wf-paper)',display:'flex',flexDirection:'column',gap:10}}>
          <div className="wf-kicker">Récapitulatif</div>
          <div className="wf-card" style={{padding:'18px 16px',textAlign:'center',background:'linear-gradient(180deg,#fff,var(--wf-blue-tint))'}}>
            <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>SCORE TOTAL</div>
            <div style={{fontSize:48,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',color:'var(--wf-blue)',lineHeight:1}}>{totalScore(values)}</div>
            <div style={{fontSize:11,color:'var(--wf-ink-soft)'}}>sur 20 · pondéré</div>
          </div>
          <div className="wf-card" style={{padding:12}}>
            <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)',marginBottom:6}}>DÉTAIL</div>
            {criteria.map((c,i)=>(
              <div key={c.id} className="wf-row" style={{gap:6,fontSize:11,padding:'4px 0',borderBottom:i===4?'none':'1px dashed var(--wf-line)'}}>
                <span className="wf-grow">{c.fr}</span>
                <span style={{fontWeight:700,color:'var(--wf-blue)'}}>{values[i]}/20</span>
                <span className="wf-faint" style={{width:36,textAlign:'right'}}>×{c.weight}%</span>
              </div>
            ))}
          </div>
          <div className="wf-row" style={{gap:6}}>
            <span className="wf-btn">Brouillon</span>
            <span className="wf-btn is-success" style={{flex:1}}>Valider mon vote ✓</span>
          </div>
          <div style={{fontSize:10,color:'var(--wf-ink-faint)',textAlign:'center'}}>Le score est anonyme jusqu'à la cérémonie.</div>
        </div>
      </div>
    </div>
  );
};

const JuryFormMobile = () => {
  const values = [16, 14, 12, 10, 17];
  return (
    <div className="wf">
      <MobileStatus/>
      <div style={{padding:'12px 14px 80px',height:'100%',overflow:'auto'}}>
        <div className="wf-row" style={{gap:8,marginBottom:6}}>
          <div style={{width:36,height:36,borderRadius:8,background:'var(--wf-blue-tint)',display:'grid',placeItems:'center',fontSize:18}}>🏔</div>
          <div className="wf-grow">
            <div className="wf-kicker">Pitch · 7 / 12</div>
            <div style={{fontWeight:700,fontSize:14}}>Atlas · Maraya</div>
          </div>
          <span className="wf-pill is-blue" style={{fontSize:9}}>4:32</span>
        </div>
        {criteria.slice(0,3).map((c,i)=>(
          <div key={c.id} className="wf-card" style={{padding:'10px 12px',marginBottom:8}}>
            <div className="wf-row" style={{gap:8,marginBottom:6}}>
              <span style={{fontWeight:600,fontSize:12}}>{c.fr}</span>
              <span className="wf-grow"/>
              <span style={{fontWeight:700,color:'var(--wf-blue)'}}>{values[i]}/20</span>
            </div>
            <div style={{position:'relative',height:24}}>
              <div style={{position:'absolute',top:10,left:0,right:0,height:4,background:'var(--wf-paper-deep)',borderRadius:2}}/>
              <div style={{position:'absolute',top:10,left:0,height:4,background:'var(--wf-blue)',borderRadius:2,width:`${(values[i]/20)*100}%`}}/>
              <div style={{position:'absolute',top:6,left:`${(values[i]/20)*100}%`,transform:'translateX(-50%)',width:14,height:14,borderRadius:'50%',background:'#fff',border:'3px solid var(--wf-blue)'}}/>
            </div>
          </div>
        ))}
        <div className="wf-card" style={{padding:'14px 16px',textAlign:'center',background:'var(--wf-blue-tint)',marginTop:6}}>
          <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>TOTAL</div>
          <div style={{fontSize:36,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',color:'var(--wf-blue)',lineHeight:1}}>{totalScore(values)}</div>
          <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>sur 20</div>
        </div>
        <span className="wf-btn is-success" style={{display:'flex',width:'100%',marginTop:10}}>Valider mon vote ✓</span>
      </div>
    </div>
  );
};

// ============================================================================
// V2 — RADAR / PENTAGON (drag points to score)
// ============================================================================

const RadarChart = ({ values, size = 320, interactive = true }) => {
  const cx = size/2, cy = size/2 + 8, R = size/2 - 40;
  const points = values.map((v,i) => {
    const angle = -Math.PI/2 + i * (Math.PI*2/5);
    const r = (v/20) * R;
    return { x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r, angle, full:cx+Math.cos(angle)*R, fully:cy+Math.sin(angle)*R };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{display:'block'}}>
      {/* concentric pentagons */}
      {[0.2,0.4,0.6,0.8,1].map((s,i)=>{
        const pts = [0,1,2,3,4].map(k=>{
          const a = -Math.PI/2 + k * (Math.PI*2/5);
          return `${cx+Math.cos(a)*R*s},${cy+Math.sin(a)*R*s}`;
        }).join(' ');
        return <polygon key={i} points={pts} fill="none" stroke="#C9C0AE" strokeWidth="0.8" strokeDasharray={i===4?'':'2,2'}/>
      })}
      {/* axes */}
      {points.map((p,i)=>(
        <line key={i} x1={cx} y1={cy} x2={p.full} y2={p.fully} stroke="#C9C0AE" strokeWidth="0.8"/>
      ))}
      {/* score polygon */}
      <polygon points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill="rgba(27,58,92,0.18)" stroke="#1B3A5C" strokeWidth="2" strokeLinejoin="round"/>
      {/* score handles */}
      {points.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#1B3A5C" strokeWidth="2.5"/>
          {interactive && <text x={p.x} y={p.y-12} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1B3A5C">{values[i]}</text>}
        </g>
      ))}
      {/* axis labels */}
      {criteria.map((c,i)=>{
        const a = -Math.PI/2 + i * (Math.PI*2/5);
        const lx = cx + Math.cos(a)*(R+24);
        const ly = cy + Math.sin(a)*(R+24);
        return (
          <g key={c.id}>
            <text x={lx} y={ly} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily="Montserrat" fill="#1B2740">{c.fr}</text>
            <text x={lx} y={ly+12} textAnchor="middle" fontSize="9" fill="#617084" fontFamily="Montserrat">{c.en}</text>
          </g>
        );
      })}
      {/* center value */}
      <text x={cx} y={cy-2} textAnchor="middle" fontSize="22" fontWeight="700" fontFamily="Baskervville" fill="#1B3A5C">{totalScore(values)}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="9" fill="#617084" letterSpacing="1.5">SUR 20</text>
    </svg>
  );
};

const JuryRadarDesktop = () => {
  const values = [16, 14, 12, 10, 17];
  return (
    <div className="wf">
      <JuryTopbar/>
      <JuryHeader/>
      <div style={{display:'grid',gridTemplateColumns:'1.1fr 1fr',height:'calc(100% - 60px - 78px)'}}>
        <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:10,background:'var(--wf-paper)',borderRight:'1px solid var(--wf-line)'}}>
          <div className="wf-kicker">Pentagone d'évaluation</div>
          <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Glissez chaque sommet pour ajuster le score sur le critère.</p>
          <div className="wf-card" style={{padding:14,flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RadarChart values={values} size={400}/>
          </div>
          <div className="wf-row" style={{gap:8}}>
            <span className="wf-pill is-blue">Votre vote · provisoire</span>
            <span className="wf-grow"/>
            <span className="wf-pill">Médiane jury : 13.4</span>
          </div>
        </div>
        <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:10,overflow:'auto'}}>
          <div className="wf-kicker">Détail & ajustement fin</div>
          {criteria.map((c,i)=>(
            <div key={c.id} className="wf-card" style={{padding:'10px 12px'}}>
              <div className="wf-row" style={{gap:8,marginBottom:4}}>
                <span style={{fontWeight:600}}>{c.fr}</span>
                <span className="wf-grow"/>
                <span className="wf-row" style={{gap:4}}>
                  <span className="wf-btn" style={{padding:'2px 8px',fontSize:11}}>−</span>
                  <span style={{minWidth:36,textAlign:'center',fontWeight:700,color:'var(--wf-blue)'}}>{values[i]}</span>
                  <span className="wf-btn" style={{padding:'2px 8px',fontSize:11}}>+</span>
                </span>
              </div>
              <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>{c.desc}</div>
            </div>
          ))}
          <div className="wf-row" style={{gap:6,marginTop:'auto'}}>
            <span className="wf-btn">Annuler</span>
            <span className="wf-btn is-success" style={{flex:1}}>Verrouiller le pentagone ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const JuryRadarMobile = () => {
  const values = [16, 14, 12, 10, 17];
  return (
    <div className="wf">
      <MobileStatus/>
      <div style={{padding:'12px 14px 80px',height:'100%',overflow:'auto'}}>
        <div className="wf-row" style={{gap:8,marginBottom:8}}>
          <div className="wf-grow">
            <div className="wf-kicker">Pitch · 7/12</div>
            <div style={{fontWeight:700,fontSize:14}}>Atlas · Pentagone</div>
          </div>
          <span className="wf-pill is-blue" style={{fontSize:9}}>4:32</span>
        </div>
        <div className="wf-card" style={{padding:8,marginBottom:10}}>
          <RadarChart values={values} size={280}/>
        </div>
        <div className="wf-card" style={{padding:'8px 10px',marginBottom:6}}>
          {criteria.map((c,i)=>(
            <div key={c.id} className="wf-row" style={{gap:6,padding:'5px 0',borderBottom:i===4?'none':'1px dashed var(--wf-line)',fontSize:12}}>
              <span className="wf-grow">{c.fr}</span>
              <span className="wf-btn" style={{padding:'2px 8px',fontSize:11}}>−</span>
              <span style={{minWidth:30,textAlign:'center',fontWeight:700,color:'var(--wf-blue)'}}>{values[i]}</span>
              <span className="wf-btn" style={{padding:'2px 8px',fontSize:11}}>+</span>
            </div>
          ))}
        </div>
        <span className="wf-btn is-success" style={{display:'flex',width:'100%'}}>Verrouiller ✓</span>
      </div>
    </div>
  );
};

// ============================================================================
// V3 — ROTARY DIALS (game-show feel)
// ============================================================================

const Dial = ({ c, value }) => {
  const angle = -135 + (value/20) * 270;
  const arc = (value/20) * 270;
  const r = 44;
  return (
    <div className="wf-card" style={{padding:'12px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:6,position:'relative'}}>
      <div style={{fontSize:11,fontWeight:600,textAlign:'center'}}>{c.fr}</div>
      <div style={{fontSize:9,color:'var(--wf-ink-faint)',textAlign:'center',marginTop:-4}}>{c.en}</div>
      <svg viewBox="0 0 120 120" width="120" height="120">
        {/* outer ring */}
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--wf-paper-deep)" strokeWidth="2"/>
        {/* tick marks */}
        {Array.from({length:21}).map((_,i)=>{
          const a = (-135 + i*13.5) * Math.PI/180;
          const x1 = 60 + Math.cos(a)*52, y1 = 60 + Math.sin(a)*52;
          const x2 = 60 + Math.cos(a)*(i%5===0?44:48), y2 = 60 + Math.sin(a)*(i%5===0?44:48);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9A917F" strokeWidth={i%5===0?1.5:0.8}/>
        })}
        {/* track */}
        <circle cx="60" cy="60" r={r}
          fill="none" stroke="var(--wf-paper-deep)" strokeWidth="6"
          strokeDasharray={`${(270/360)*2*Math.PI*r} ${2*Math.PI*r}`}
          transform="rotate(135 60 60)"/>
        {/* progress arc */}
        <circle cx="60" cy="60" r={r}
          fill="none" stroke="var(--wf-blue)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(arc/360)*2*Math.PI*r} ${2*Math.PI*r}`}
          transform="rotate(135 60 60)"/>
        {/* knob */}
        <circle cx="60" cy="60" r="32" fill="#fff" stroke="var(--wf-line)" strokeWidth="1"/>
        <circle cx="60" cy="60" r="32" fill="url(#dialgrad)" opacity="0.6"/>
        <defs>
          <radialGradient id="dialgrad" cx="0.4" cy="0.3">
            <stop offset="0" stopColor="#fff"/>
            <stop offset="1" stopColor="#E9E2D0"/>
          </radialGradient>
        </defs>
        {/* indicator */}
        <line x1="60" y1="60"
          x2={60 + Math.cos(angle*Math.PI/180)*28}
          y2={60 + Math.sin(angle*Math.PI/180)*28}
          stroke="var(--wf-blue)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="60" r="3" fill="var(--wf-blue)"/>
        <text x="60" y="92" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="Baskervville" fill="var(--wf-ink)">{value}</text>
      </svg>
      <div className="wf-row" style={{gap:4,fontSize:10,color:'var(--wf-ink-faint)'}}>
        <span>0</span><span>·</span><span>20</span>
      </div>
    </div>
  );
};

const JuryDialDesktop = () => {
  const values = [16, 14, 12, 10, 17];
  return (
    <div className="wf">
      <JuryTopbar/>
      <JuryHeader/>
      <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14,height:'calc(100% - 60px - 78px)',overflow:'auto'}}>
        <div className="wf-row" style={{gap:10}}>
          <div className="wf-kicker">Tableau de bord juré</div>
          <span className="wf-grow"/>
          <div className="wf-card" style={{padding:'8px 14px',display:'flex',alignItems:'center',gap:10}}>
            <span className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>SCORE TOTAL</span>
            <span style={{fontSize:30,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',color:'var(--wf-blue)',lineHeight:1}}>{totalScore(values)}</span>
            <span className="wf-faint">/ 20</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {criteria.map((c,i)=> <Dial key={c.id} c={c} value={values[i]}/>)}
        </div>
        <div className="wf-card" style={{padding:14}}>
          <div className="wf-row" style={{gap:10,marginBottom:8}}>
            <div className="wf-kicker">Note finale & verdict</div>
            <span className="wf-grow"/>
            <span className="wf-pill">Tournez les molettes ; le total se recalcule en direct.</span>
          </div>
          <div className="wf-row" style={{gap:8}}>
            <span className="wf-pill" style={{padding:'8px 12px',fontSize:12}}>👎 Pas convaincu</span>
            <span className="wf-pill" style={{padding:'8px 12px',fontSize:12}}>🤔 À retravailler</span>
            <span className="wf-pill is-blue" style={{padding:'8px 12px',fontSize:12}}>✓ Convaincu</span>
            <span className="wf-pill is-green" style={{padding:'8px 12px',fontSize:12}}>★ Coup de cœur</span>
            <span className="wf-grow"/>
            <span className="wf-btn is-success">Verrouiller mon vote</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const JuryDialMobile = () => {
  const values = [16, 14, 12, 10, 17];
  return (
    <div className="wf">
      <MobileStatus/>
      <div style={{padding:'12px 14px 80px',height:'100%',overflow:'auto'}}>
        <div className="wf-row" style={{gap:8,marginBottom:6}}>
          <div className="wf-grow">
            <div className="wf-kicker">Pitch · Atlas</div>
            <div style={{fontWeight:700,fontSize:14}}>Molettes</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)'}}>TOTAL</div>
            <div style={{fontSize:22,fontWeight:700,color:'var(--wf-blue)',lineHeight:1}}>{totalScore(values)}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {criteria.slice(0,4).map((c,i)=> <Dial key={c.id} c={c} value={values[i]}/>)}
        </div>
        <div className="wf-row" style={{gap:6,marginTop:10}}>
          <span className="wf-btn" style={{flex:1,padding:'8px 0',fontSize:11}}>🤔</span>
          <span className="wf-btn is-primary" style={{flex:1,padding:'8px 0',fontSize:11}}>✓</span>
          <span className="wf-btn is-success" style={{flex:1,padding:'8px 0',fontSize:11}}>★</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// V4 — TOKEN ALLOCATION (50 points to distribute)
// ============================================================================

const TokenBucket = ({ c, n, max=20 }) => (
  <div className="wf-card" style={{padding:'12px 14px'}}>
    <div className="wf-row" style={{gap:8,marginBottom:8}}>
      <h4 style={{fontSize:14}}>{c.fr}</h4>
      <span className="wf-grow"/>
      <span className="wf-pill" style={{padding:'2px 6px',fontSize:10}}>{n} jetons</span>
    </div>
    <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginBottom:8}}>{c.desc}</div>
    {/* token slots */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3}}>
      {Array.from({length:max}).map((_,i)=>(
        <div key={i} style={{
          aspectRatio:'1',
          borderRadius:'50%',
          background: i<n ? 'var(--wf-blue)' : 'transparent',
          border: i<n ? 'none' : '1.5px dashed var(--wf-line)',
          boxShadow: i<n ? 'inset -2px -2px 4px rgba(0,0,0,0.18), inset 2px 2px 3px rgba(255,255,255,0.3)' : 'none',
        }}/>
      ))}
    </div>
    <div className="wf-row" style={{gap:4,marginTop:8}}>
      <span className="wf-btn" style={{padding:'3px 10px',fontSize:11}}>− retirer</span>
      <span className="wf-btn is-primary" style={{padding:'3px 10px',fontSize:11}}>+ ajouter</span>
    </div>
  </div>
);

const JuryTokensDesktop = () => {
  const tokens = [16, 14, 12, 10, 17];
  const total = tokens.reduce((a,v)=>a+v,0);
  const budget = 75;
  return (
    <div className="wf">
      <JuryTopbar/>
      <JuryHeader/>
      <div style={{padding:'18px 24px',display:'flex',flexDirection:'column',gap:14,height:'calc(100% - 60px - 78px)',overflow:'auto'}}>
        <div className="wf-card" style={{padding:'14px 18px',background:'linear-gradient(90deg,var(--wf-blue) 0%,#1B4F7A 100%)',color:'#fff',borderColor:'var(--wf-blue)'}}>
          <div className="wf-row" style={{gap:14}}>
            <div>
              <div className="wf-mono" style={{fontSize:9,opacity:0.7,letterSpacing:2}}>VOTRE BUDGET DE JETONS</div>
              <div style={{fontSize:32,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',lineHeight:1}}>{total} <span style={{opacity:0.5,fontSize:18}}>/ {budget}</span></div>
              <div style={{fontSize:11,opacity:0.85}}>Distribuez vos jetons selon ce qui vous a convaincu·e. {budget-total} jetons restants.</div>
            </div>
            <span className="wf-grow"/>
            <div style={{textAlign:'right'}}>
              <div className="wf-mono" style={{fontSize:9,opacity:0.7,letterSpacing:2}}>SCORE FINAL ÉQUIVALENT</div>
              <div style={{fontSize:32,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',lineHeight:1}}>{(total/budget*20).toFixed(1)}</div>
              <div style={{fontSize:11,opacity:0.85}}>sur 20</div>
            </div>
          </div>
          <div style={{height:8,background:'rgba(255,255,255,0.18)',borderRadius:4,marginTop:10,overflow:'hidden'}}>
            <div style={{width:`${(total/budget)*100}%`,height:'100%',background:'#4CAF50',borderRadius:4}}/>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {criteria.slice(0,3).map((c,i)=> <TokenBucket key={c.id} c={c} n={tokens[i]}/>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {criteria.slice(3).map((c,i)=> <TokenBucket key={c.id} c={c} n={tokens[i+3]}/>)}
        </div>
        <div className="wf-row" style={{gap:8}}>
          <span className="wf-btn">Tout réinitialiser</span>
          <span className="wf-grow"/>
          <span className="wf-btn is-ghost">Brouillon</span>
          <span className="wf-btn is-success">Verrouiller la répartition ✓</span>
        </div>
      </div>
    </div>
  );
};

const JuryTokensMobile = () => {
  const tokens = [16, 14, 12, 10, 17];
  const total = tokens.reduce((a,v)=>a+v,0);
  return (
    <div className="wf">
      <MobileStatus/>
      <div style={{padding:'12px 14px 80px',height:'100%',overflow:'auto'}}>
        <div className="wf-card" style={{padding:'12px 14px',background:'var(--wf-blue)',color:'#fff',marginBottom:10}}>
          <div className="wf-mono" style={{fontSize:9,opacity:0.7,letterSpacing:2}}>JETONS</div>
          <div style={{fontSize:24,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)',lineHeight:1}}>{total} / 75</div>
          <div style={{height:6,background:'rgba(255,255,255,0.18)',borderRadius:3,marginTop:6,overflow:'hidden'}}>
            <div style={{width:`${(total/75)*100}%`,height:'100%',background:'#4CAF50'}}/>
          </div>
        </div>
        {criteria.slice(0,3).map((c,i)=> <div key={c.id} style={{marginBottom:8}}><TokenBucket c={c} n={tokens[i]}/></div>)}
      </div>
    </div>
  );
};

// ============================================================================
// Notes
// ============================================================================

const Voice3 = ({ kind, name, role, said }) => (
  <div className={`wf-voice ${kind}`}>
    <div className="who">{name.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
    <div>
      <div className="role">{role}</div>
      <div className="said">{said}</div>
    </div>
  </div>
);

const JuryFormNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 1</div>
    <h4>Formulaire à curseurs</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>5 critères, 5 sliders, total pondéré, commentaire libre.</p>
    <Voice3 kind="ux" name="UX" role="Designer UX" said="Le standard. Reconnu instantanément, jamais ambigu. Score visible en permanence dans le panneau de droite."/>
    <Voice3 kind="research" name="Re" role="Chercheure" said="Les sliders sont biaisés vers les valeurs rondes (5/10/15). Documenté. À surveiller."/>
    <Voice3 kind="eng" name="En" role="Ingénieur" said="HTML range natif + un peu de style. 30 lignes."/>
    <Voice3 kind="pedag" name="Pe" role="Mentor" said="Convient bien aux jurés moins technophiles (partenaires, alumni)."/>
    <div className="wf-tradeoff"><b>Compromis :</b> sûr, sobre, pas mémorable. Excellent par défaut, à mixer avec une option plus expressive pour la cérémonie.</div>
  </div>
);

const JuryRadarNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 2</div>
    <h4>Pentagone radar</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>Forme = profil de l'équipe. Comparable d'un pitch à l'autre.</p>
    <Voice3 kind="ux" name="UX" role="Designer UX" said="Beauté pure : un seul coup d'œil donne le 'profil' (forte sur problème, faible sur business)."/>
    <Voice3 kind="research" name="Re" role="Chercheure" said="Excellent pour le débrief post‑pitch. On peut superposer les pentagones de tous les jurés et voir où ils divergent."/>
    <Voice3 kind="eng" name="En" role="Ingénieur" said="Drag‑sur‑sommet réalisable mais coûteux à fiabiliser. Fallback +/− à côté = sage."/>
    <Voice3 kind="pedag" name="Pe" role="Mentor" said="Forme parlante pour les équipes : 'votre pentagone est très étiré sur l'équipe et faible sur le marché'."/>
    <div className="wf-tradeoff"><b>Compromis :</b> superbe en restitution, plus exigeant pendant le pitch (le juré doit jongler entre l'écran et la scène).</div>
  </div>
);

const JuryDialNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 3</div>
    <h4>Molettes rotatives</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>5 dials physiques style régie audio. Plus expressif.</p>
    <Voice3 kind="ux" name="UX" role="Designer UX" said="Tactile, expressif. Le geste de tourner imprime le score en mémoire — bon pour le débriefing."/>
    <Voice3 kind="pedag" name="Pe" role="Mentor" said="Le ton 'jeu télévisé' fait sens pour la cérémonie de clôture. Plus festif que clinique."/>
    <Voice3 kind="research" name="Re" role="Chercheure" said="Attention : la rotation ne suggère pas naturellement '0 à 20'. Demande un onboarding court (3 secondes) pour les jurés."/>
    <Voice3 kind="eng" name="En" role="Ingénieur" said="SVG + handler de drag rotatoire — réalisable, demande quelques essais. Boutons +/− toujours utiles."/>
    <div className="wf-tradeoff"><b>Compromis :</b> identité forte mais moins précise au pixel près. Idéal en mode cérémonie/projection ; basculer en formulaire pour les jurés à distance.</div>
  </div>
);

const JuryTokensNotes = () => (
  <div className="wf-rationale">
    <div className="wf-kicker">Variation 4</div>
    <h4>Allocation de jetons</h4>
    <p style={{fontSize:11,color:'var(--wf-ink-soft)'}}>75 jetons à distribuer entre 5 critères. Force des arbitrages.</p>
    <Voice3 kind="ux" name="UX" role="Designer UX" said="Force du modèle : on ne peut pas tout mettre à 20. Le juré doit prioriser, donc il s'engage."/>
    <Voice3 kind="research" name="Re" role="Chercheure" said="C'est un budget‑allocation classique. Empêche l'effet 'halo' où une équipe sympa rafle tout."/>
    <Voice3 kind="eng" name="En" role="Ingénieur" said="Logique simple : compteur global. Animation de jeton qui 'tombe' dans le panier — bonbon visuel."/>
    <Voice3 kind="pedag" name="Pe" role="Mentor" said="Risque : changer la culture du jury. Les partenaires habitués au /20 vont demander la conversion."/>
    <Voice3 kind="gm" name="GM" role="GameMaster" said="Math identique au /20 si bien calibré (75 = 15/20). Possibilité de faire coexister les deux affichages."/>
    <div className="wf-tradeoff"><b>Compromis :</b> le plus original et le plus rigoureux ; aussi le plus coûteux à expliquer. À envisager surtout pour le jury final.</div>
  </div>
);

Object.assign(window, {
  JuryFormDesktop, JuryFormMobile, JuryFormNotes,
  JuryRadarDesktop, JuryRadarMobile, JuryRadarNotes,
  JuryDialDesktop, JuryDialMobile, JuryDialNotes,
  JuryTokensDesktop, JuryTokensMobile, JuryTokensNotes,
});
