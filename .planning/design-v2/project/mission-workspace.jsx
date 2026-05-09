// Mission workspace — what opens after the player taps "Reprendre la mission"
// Focused canvas to write M3.3 "Hypothèse de proposition de valeur" in one sentence.
// Three states surfaced as separate artboards: WORKSPACE → SUBMITTING → VALIDATED.

const M = {
  code:'M3.3',
  fr:'Hypothèse de proposition de valeur',
  level:'L3 · Découverte',
  objective:"Formulez en une phrase à qui vous parlez, le besoin que vous adressez et ce qui rend votre offre unique.",
  reward:100,
  due:'15:30',
  template:[
    { key:'cible',  label:'Pour',                 placeholder:'jeunes parents urbains',         value:'jeunes parents urbains débordés' },
    { key:'besoin', label:'qui',                  placeholder:'ont du mal à préparer des repas équilibrés en semaine', value:"n'ont plus le temps de cuisiner sain en semaine" },
    { key:'offre',  label:'notre offre',          placeholder:'des box de repas frais',         value:'des box de repas frais en 15 min' },
    { key:'unique', label:'contrairement à',      placeholder:'la livraison classique, propose…', value:'la livraison classique, sont prêtes en kit avec ingrédients pré‑dosés' },
  ],
};

// === Shared shell ==========================================================

const WorkShell = ({ children, dark=false }) => (
  <div className="wf" style={{
    background: dark
      ? 'linear-gradient(180deg,#1B3A5C 0%,#2B262E 100%)'
      : 'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)',
  }}>
    <div className="wf-aurora">
      <div className="blob3" style={{top:'-10%',left:'10%',width:'70%',height:'70%',
        background:dark?'radial-gradient(circle,rgba(76,175,80,0.18),transparent 60%)':'radial-gradient(circle,rgba(27,58,92,0.07),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'hidden',color:dark?'#FBF8F2':'var(--wf-ink)'}}>{children}</div>
  </div>
);

const WorkTopbar = ({ onBack, levelDot=true }) => (
  <div className="wf-row" style={{padding:'18px 28px',gap:14,borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
    <button onClick={onBack} className="wf-row" style={{
      background:'rgba(255,255,255,0.55)',backdropFilter:'blur(12px)',
      border:'1px solid rgba(255,255,255,0.7)',
      borderRadius:10,padding:'8px 12px',gap:8,cursor:'pointer',
      fontSize:12,color:'var(--wf-ink)',fontFamily:'inherit',
    }}>
      <span style={{fontSize:14}}>←</span> Parcours
    </button>
    <div className="wf-row" style={{gap:8}}>
      {levelDot && <span style={{width:8,height:8,borderRadius:'50%',background:'#1B3A5C',boxShadow:'0 0 0 4px rgba(27,58,92,0.14)'}}/>}
      <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)'}}>{M.level}</span>
      <span style={{color:'var(--wf-ink-faint)'}}>›</span>
      <span className="wf-mono" style={{fontSize:11,fontWeight:700}}>{M.code}</span>
    </div>
    <span className="wf-grow"/>
    <div className="wf-row" style={{gap:10}}>
      <span className="wf-pill is-amber" style={{fontSize:10}}>! échéance {M.due}</span>
      <span className="wf-pill" style={{fontSize:10,background:'rgba(255,255,255,0.6)'}}>+{M.reward} XP</span>
      <div style={{width:30,height:30,borderRadius:'50%',background:'var(--wf-blue)',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>YA</div>
    </div>
  </div>
);

// === Sentence builder (Mad‑Libs style) =====================================

const SentenceBuilder = ({ values, onChange, focusKey, setFocusKey }) => {
  return (
    <div style={{
      fontFamily:'var(--font-heading,Baskervville,serif)',
      fontSize:32,lineHeight:1.35,
      color:'var(--wf-ink)',letterSpacing:'-0.005em',
      maxWidth:780,
    }}>
      {M.template.map((slot, i) => {
        const active = focusKey===slot.key;
        const filled = !!values[slot.key];
        return (
          <React.Fragment key={slot.key}>
            <span style={{color:'var(--wf-ink-soft)',fontStyle:'italic',fontWeight:400}}>{slot.label} </span>
            <span
              contentEditable suppressContentEditableWarning
              onFocus={()=>setFocusKey(slot.key)}
              onBlur={(e)=>{onChange(slot.key, e.currentTarget.textContent); setFocusKey(null);}}
              style={{
                display:'inline-block',
                padding:'0 8px',margin:'0 2px',
                borderBottom:`2px ${filled?'solid':'dashed'} ${active?'#1B3A5C':filled?'rgba(27,58,92,0.45)':'rgba(154,145,127,0.6)'}`,
                background: active ? 'rgba(27,58,92,0.06)' : filled ? 'rgba(255,255,255,0.35)' : 'transparent',
                borderRadius:4,
                color: filled ? 'var(--wf-ink)' : 'var(--wf-ink-faint)',
                fontWeight: filled ? 600 : 400,
                outline:'none',transition:'all 0.18s ease',
                cursor:'text',
              }}>
              {filled ? values[slot.key] : slot.placeholder}
            </span>
            {i < M.template.length-1 ? <span style={{color:'var(--wf-ink-soft)'}}> </span> : <span style={{color:'var(--wf-ink-soft)',fontStyle:'italic',fontWeight:400}}>.</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// === Side rails (context, hints, mentor) ===================================

const ObjectiveRail = () => (
  <div className="wf-glass-tint" style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:10}}>
    <div className="wf-kicker">Objectif de la mission</div>
    <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:16,fontWeight:600,lineHeight:1.3,letterSpacing:'-0.005em'}}>
      {M.objective}
    </div>
    <div style={{height:1,background:'rgba(154,145,127,0.25)',margin:'4px 0'}}/>
    <div className="wf-kicker">Critères de validation</div>
    <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:6}}>
      {[
        'Une cible précise et nommée',
        'Un besoin observé sur le terrain',
        'Une promesse claire',
        'Un point de différenciation',
      ].map((c,i)=>(
        <li key={i} className="wf-row" style={{gap:8,fontSize:12,color:'var(--wf-ink-soft)'}}>
          <span style={{width:14,height:14,borderRadius:'50%',background:'rgba(27,58,92,0.1)',color:'var(--wf-blue)',display:'grid',placeItems:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{i+1}</span>
          {c}
        </li>
      ))}
    </ul>
  </div>
);

const MentorRail = () => (
  <div className="wf-glass" style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
    <div className="wf-row" style={{gap:10}}>
      <div style={{width:36,height:36,borderRadius:'50%',background:'var(--wf-blue-tint)',color:'var(--wf-blue)',display:'grid',placeItems:'center',fontWeight:700,fontSize:12}}>SK</div>
      <div className="wf-grow">
        <div style={{fontSize:12,fontWeight:700}}>Sami K.</div>
        <div style={{fontSize:10,color:'var(--wf-ink-soft)'}}>Mentor · disponible</div>
      </div>
      <span className="wf-pill is-green" style={{fontSize:9}}>● en ligne</span>
    </div>
    <div style={{
      background:'rgba(255,255,255,0.6)',borderRadius:10,padding:'10px 12px',
      fontSize:12,lineHeight:1.45,color:'var(--wf-ink)',fontStyle:'italic',
      borderLeft:'3px solid rgba(27,58,92,0.3)',
    }}>
      « Vos 5 entretiens montrent un signal sur le manque de temps en semaine — appuyez‑vous dessus pour la promesse. »
    </div>
    <div className="wf-row" style={{gap:6}}>
      <span className="wf-btn" style={{padding:'6px 10px',fontSize:11,flex:1,justifyContent:'center'}}>Demander de l'aide</span>
      <span className="wf-btn" style={{padding:'6px 10px',fontSize:11,flex:1,justifyContent:'center'}}>Voir les notes</span>
    </div>
  </div>
);

const EvidenceRail = () => (
  <div className="wf-glass" style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
    <div className="wf-kicker">Preuves terrain (M3.2)</div>
    {[
      { who:'Marc, 34 ans', quote:'« Le soir je n\'ai plus l\'énergie de cuisiner. »' },
      { who:'Léa, 29 ans',  quote:'« Les box actuelles, c\'est trop long à préparer. »' },
      { who:'Karim, 41 ans',quote:'« Je veux du frais, sans planifier. »' },
    ].map((q,i)=>(
      <div key={i} style={{
        fontSize:11,lineHeight:1.45,color:'var(--wf-ink-soft)',
        padding:'8px 10px',background:'rgba(255,255,255,0.5)',borderRadius:8,
      }}>
        <div style={{fontWeight:700,fontSize:10,color:'var(--wf-ink)'}}>{q.who}</div>
        {q.quote}
      </div>
    ))}
    <span style={{fontSize:10,color:'var(--wf-ink-faint)',marginTop:2}}>+ 2 autres entretiens</span>
  </div>
);

// === DESKTOP — workspace ===================================================

const MissionWorkspaceDesktop = ({ initialState='empty' }) => {
  const seed = initialState==='filled' ? Object.fromEntries(M.template.map(s=>[s.key,s.value])) : {};
  const [values, setValues] = React.useState(seed);
  const [focusKey, setFocusKey] = React.useState(initialState==='filled' ? null : 'cible');
  const [submitted, setSubmitted] = React.useState(initialState==='submitted');

  const filled = M.template.filter(s => values[s.key]).length;
  const pct = (filled / M.template.length) * 100;
  const ready = filled === M.template.length;

  return (
    <WorkShell>
      <WorkTopbar onBack={()=>{}}/>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr 280px',gap:24,padding:'24px 28px',height:'calc(100% - 71px)',overflow:'hidden'}}>
        {/* LEFT — objective */}
        <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'auto'}}>
          <ObjectiveRail/>
          <EvidenceRail/>
        </div>

        {/* CENTER — sentence canvas */}
        <div style={{
          display:'flex',flexDirection:'column',gap:24,
          padding:'8px 8px',position:'relative',
        }}>
          <div className="wf-stack" style={{gap:6}}>
            <div className="wf-kicker">Mission</div>
            <h1 style={{
              fontFamily:'var(--font-heading,Baskervville,serif)',
              fontSize:34,fontWeight:600,lineHeight:1.05,letterSpacing:'-0.015em',margin:0,
            }}>{M.fr}</h1>
            <div style={{fontSize:13,color:'var(--wf-ink-soft)',marginTop:4}}>
              Construisez une phrase complète. Cliquez sur chaque champ et reformulez à votre manière.
            </div>
          </div>

          <div style={{
            background:'rgba(255,255,255,0.55)',
            backdropFilter:'blur(20px) saturate(160%)',
            border:'1px solid rgba(255,255,255,0.7)',
            borderRadius:20,padding:'34px 36px',
            boxShadow:'0 16px 40px rgba(43,38,30,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
            flex:1,display:'flex',flexDirection:'column',justifyContent:'center',
          }}>
            <SentenceBuilder values={values} onChange={(k,v)=>setValues(s=>({...s,[k]:v.trim()}))} focusKey={focusKey} setFocusKey={setFocusKey}/>

            <div className="wf-row" style={{gap:8,marginTop:30,paddingTop:18,borderTop:'1px solid rgba(154,145,127,0.2)'}}>
              <div className="wf-row" style={{gap:8}}>
                <div className="wf-bar" style={{width:140,background:'rgba(255,255,255,0.5)'}}>
                  <div style={{width:`${pct}%`,background:ready?'var(--wf-green)':'var(--wf-blue)'}}/>
                </div>
                <span style={{fontSize:11,color:'var(--wf-ink-soft)'}}>{filled}/{M.template.length} champs remplis</span>
              </div>
              <span className="wf-grow"/>
              <span className="wf-btn" style={{padding:'9px 14px',fontSize:12}}>Brouillon</span>
              <button
                disabled={!ready}
                onClick={()=>setSubmitted(true)}
                style={{
                  background: ready ? 'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)' : 'rgba(154,145,127,0.3)',
                  color: ready ? '#fff' : 'var(--wf-ink-faint)',
                  border:'none',padding:'10px 18px',borderRadius:12,
                  fontSize:13,fontWeight:600,fontFamily:'Montserrat,sans-serif',
                  cursor:ready?'pointer':'not-allowed',letterSpacing:'0.02em',
                  boxShadow:ready?'0 8px 24px rgba(27,58,92,0.3)':'none',
                  display:'inline-flex',alignItems:'center',gap:8,
                }}>
                Soumettre au mentor
                <span style={{fontSize:14}}>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — mentor + tips */}
        <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'auto'}}>
          <MentorRail/>
          <div className="wf-glass" style={{padding:'14px 16px'}}>
            <div className="wf-kicker" style={{marginBottom:8}}>Astuces</div>
            <div style={{fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.5,display:'flex',flexDirection:'column',gap:8}}>
              <div>◇ Soyez précis sur la cible — évitez « tout le monde ».</div>
              <div>◇ Le besoin doit être une douleur observée, pas supposée.</div>
              <div>◇ Le différenciateur tient en un seul angle.</div>
            </div>
          </div>
        </div>
      </div>

      {submitted && <SubmittedOverlay onClose={()=>setSubmitted(false)}/>}
    </WorkShell>
  );
};

// === MOBILE — workspace ====================================================

const MissionWorkspaceMobile = ({ initialState='empty' }) => {
  const seed = initialState==='filled' ? Object.fromEntries(M.template.map(s=>[s.key,s.value])) : {};
  const [values, setValues] = React.useState(seed);
  const [focusKey, setFocusKey] = React.useState(initialState==='filled' ? null : 'cible');
  const [submitted, setSubmitted] = React.useState(initialState==='submitted');

  const filled = M.template.filter(s => values[s.key]).length;
  const ready = filled === M.template.length;

  return (
    <WorkShell>
      {/* status bar */}
      <div className="wf-mobile-status" style={{background:'transparent',borderBottom:'none',color:'var(--wf-ink)'}}>
        <span>14:32</span>
        <span style={{display:'flex',gap:4}}><span>●●●</span><span>4G</span><span>▮▮▮▯</span></span>
      </div>

      <div className="wf-row" style={{padding:'8px 14px',gap:8,borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
        <button style={{
          background:'rgba(255,255,255,0.55)',backdropFilter:'blur(12px)',
          border:'1px solid rgba(255,255,255,0.7)',borderRadius:10,
          padding:'6px 10px',fontSize:11,cursor:'pointer',color:'var(--wf-ink)',
        }}>← L3</button>
        <span className="wf-mono" style={{fontSize:10,fontWeight:700}}>{M.code}</span>
        <span className="wf-grow"/>
        <span className="wf-pill is-amber" style={{fontSize:9}}>15:30</span>
        <span className="wf-pill" style={{fontSize:9,background:'rgba(255,255,255,0.6)'}}>+{M.reward}</span>
      </div>

      <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:14,height:'calc(100% - 95px)',overflow:'auto'}}>
        <div>
          <div className="wf-kicker">Mission</div>
          <h2 style={{
            fontFamily:'var(--font-heading,Baskervville,serif)',
            fontSize:22,fontWeight:600,lineHeight:1.1,margin:'4px 0 0',letterSpacing:'-0.01em',
          }}>{M.fr}</h2>
        </div>

        <div className="wf-glass-tint" style={{padding:'10px 12px'}}>
          <div style={{fontSize:11,lineHeight:1.5,color:'var(--wf-ink)'}}>{M.objective}</div>
        </div>

        <div style={{
          background:'rgba(255,255,255,0.6)',
          backdropFilter:'blur(18px) saturate(160%)',
          border:'1px solid rgba(255,255,255,0.7)',
          borderRadius:14,padding:'18px',
          boxShadow:'0 8px 24px rgba(43,38,30,0.06)',
          fontSize:18, // smaller for mobile
        }}>
          <div style={{
            fontFamily:'var(--font-heading,Baskervville,serif)',
            fontSize:18,lineHeight:1.4,letterSpacing:'-0.005em',
          }}>
            {M.template.map((slot,i)=>{
              const active = focusKey===slot.key;
              const f = !!values[slot.key];
              return (
                <React.Fragment key={slot.key}>
                  <span style={{color:'var(--wf-ink-soft)',fontStyle:'italic'}}>{slot.label} </span>
                  <span
                    contentEditable suppressContentEditableWarning
                    onFocus={()=>setFocusKey(slot.key)}
                    onBlur={(e)=>{onChangeMobile(); setValues(s=>({...s,[slot.key]:e.currentTarget.textContent.trim()})); setFocusKey(null);}}
                    style={{
                      display:'inline-block',padding:'0 6px',margin:'0 2px',
                      borderBottom:`2px ${f?'solid':'dashed'} ${active?'#1B3A5C':f?'rgba(27,58,92,0.45)':'rgba(154,145,127,0.6)'}`,
                      background:active?'rgba(27,58,92,0.06)':'transparent',
                      borderRadius:4,fontWeight:f?600:400,
                      color:f?'var(--wf-ink)':'var(--wf-ink-faint)',outline:'none',
                    }}>
                    {f?values[slot.key]:slot.placeholder}
                  </span>
                  {i<M.template.length-1?' ':<span style={{color:'var(--wf-ink-soft)'}}>.</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="wf-glass" style={{padding:'10px 12px'}}>
          <div className="wf-row" style={{gap:8}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'var(--wf-blue-tint)',color:'var(--wf-blue)',display:'grid',placeItems:'center',fontWeight:700,fontSize:10}}>SK</div>
            <div style={{fontSize:11,color:'var(--wf-ink-soft)',fontStyle:'italic',lineHeight:1.4}}>
              « Appuyez‑vous sur le manque de temps en semaine. » — Sami K.
            </div>
          </div>
        </div>

        <div style={{position:'sticky',bottom:0,paddingTop:8}}>
          <div className="wf-row" style={{gap:8,marginBottom:8}}>
            <div className="wf-bar" style={{flex:1,background:'rgba(255,255,255,0.5)'}}>
              <div style={{width:`${(filled/M.template.length)*100}%`,background:ready?'var(--wf-green)':'var(--wf-blue)'}}/>
            </div>
            <span style={{fontSize:10,color:'var(--wf-ink-soft)'}}>{filled}/{M.template.length}</span>
          </div>
          <button
            disabled={!ready}
            onClick={()=>setSubmitted(true)}
            style={{
              width:'100%',padding:'14px',borderRadius:14,border:'none',
              background:ready?'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)':'rgba(154,145,127,0.3)',
              color:ready?'#fff':'var(--wf-ink-faint)',
              fontSize:14,fontWeight:600,fontFamily:'Montserrat,sans-serif',
              cursor:ready?'pointer':'not-allowed',
              boxShadow:ready?'0 8px 22px rgba(27,58,92,0.3)':'none',
              display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
            }}>
            Soumettre au mentor <span>→</span>
          </button>
        </div>
      </div>

      {submitted && <SubmittedOverlay onClose={()=>setSubmitted(false)} compact/>}
    </WorkShell>
  );
};

const onChangeMobile = ()=>{}; // no‑op shim, value is read at blur via setValues directly

// === SUBMITTED state — overlay celebration =================================

const SubmittedOverlay = ({ onClose, compact=false }) => (
  <div style={{
    position:'absolute',inset:0,zIndex:30,
    background:'#FBF8F2',
    display:'flex',alignItems:'center',justifyContent:'center',
    padding:compact?20:32,
  }}>
    <div style={{
      maxWidth:compact?300:480,width:'100%',
      display:'flex',flexDirection:'column',alignItems:'center',
      gap:compact?14:18,textAlign:'center',
    }}>
      <div style={{
        width:compact?56:72,height:compact?56:72,borderRadius:'50%',
        background:'#2E7D32',color:'#fff',
        display:'grid',placeItems:'center',
        fontSize:compact?28:36,fontWeight:700,
        boxShadow:'0 12px 28px rgba(46,125,50,0.35)',
      }}>✓</div>

      <div>
        <h2 style={{
          fontFamily:'var(--font-heading,Baskervville,serif)',
          fontSize:compact?26:36,fontWeight:600,lineHeight:1.1,
          letterSpacing:'-0.015em',margin:0,color:'var(--wf-ink)',
        }}>Livrable envoyé.</h2>
        <div style={{fontSize:compact?13:14,color:'var(--wf-ink-soft)',marginTop:compact?6:8}}>
          M3.3 · +100 XP · Sami K. revient sous 10 min.
        </div>
      </div>

      <button style={{
        background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',
        color:'#fff',border:'none',
        padding:compact?'12px 20px':'14px 24px',borderRadius:12,
        fontSize:compact?13:14,fontWeight:700,cursor:'pointer',
        fontFamily:'Montserrat,sans-serif',letterSpacing:'0.02em',
        boxShadow:'0 10px 24px rgba(27,58,92,0.3)',
        display:'inline-flex',alignItems:'center',gap:10,marginTop:compact?2:6,
      }}>
        Mission suivante
        <span style={{
          width:compact?20:22,height:compact?20:22,borderRadius:'50%',
          background:'rgba(255,255,255,0.2)',display:'grid',placeItems:'center',fontSize:compact?11:12,
        }}>→</span>
      </button>

      <button onClick={onClose} style={{
        background:'transparent',color:'var(--wf-ink-soft)',border:'none',
        fontSize:compact?11:12,cursor:'pointer',fontFamily:'inherit',
        textDecoration:'underline',padding:4,
      }}>Voir le parcours</button>
    </div>
  </div>
);

Object.assign(window, {
  MissionWorkspaceDesktop,
  MissionWorkspaceMobile,
});
