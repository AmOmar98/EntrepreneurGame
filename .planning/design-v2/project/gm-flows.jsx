/* global React */
// GameMaster / Régie flows — beyond the live dashboard.
// (1) GMAnnounce — composer to broadcast a live announcement to players.
// (2) GMPitchJury — pitch mode with jury scoring grid + queue.
// (3) GMReplay — end-of-hack recap : podium, leaderboard, exports.

const FlowShell2 = ({ children, bg }) => (
  <div className="wf" style={{background:bg||'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)'}}>
    <div className="wf-aurora">
      <div className="blob3" style={{top:'-10%',left:'30%',width:'60%',height:'60%',background:'radial-gradient(circle,rgba(27,58,92,0.06),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'hidden'}}>{children}</div>
  </div>
);

const GMTopbar2 = ({ mode='Régie', sub='Tableau de bord · Animateur', right }) => (
  <div className="wf-row" style={{padding:'18px 28px',gap:14,borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
    <div className="wf-row" style={{gap:10}}>
      <div className="wf-brand-mark" style={{width:30,height:30}}>E</div>
      <div className="wf-stack">
        <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600,lineHeight:1}}>{mode} · Hack‑Days 26</div>
        <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--wf-ink-soft)',marginTop:2}}>{sub}</div>
      </div>
    </div>
    <span className="wf-grow"/>
    {right}
  </div>
);

// === 6) ANNONCE LIVE ========================================================

const GMAnnounce = () => {
  const TYPES = [
    { k:'info',     l:'Info',          c:'#1B3A5C', desc:'Communication neutre' },
    { k:'urgence',  l:'Urgence',       c:'#C44536', desc:'Action immédiate · pulse rouge' },
    { k:'celebrate',l:'Célébration',   c:'#2E7D32', desc:'XP collectif · confettis' },
    { k:'rappel',   l:'Appel à action',c:'#D97706', desc:'Échéance qui approche' },
  ];
  const past = [
    { t:'14:08', who:'Inès B.', type:'rappel',   title:'Pitch dans 2h30', reach:'12/12 équipes', read:'42/47 joueurs' },
    { t:'11:42', who:'Inès B.', type:'celebrate',title:'Atlas et Boréal franchissent le L3 — bravo !', reach:'12/12 équipes', read:'47/47 joueurs' },
    { t:'09:15', who:'Karim L.',type:'info',     title:'Ouverture officielle · Auditorium', reach:'12/12 équipes', read:'47/47 joueurs' },
  ];

  return (
    <FlowShell2>
      <GMTopbar2 right={
        <div className="wf-row" style={{gap:10}}>
          <span className="wf-pill is-amber" style={{fontSize:10,fontWeight:700}}>⏱ Pitch dans 02h 28min</span>
          <span className="wf-pill is-blue" style={{fontSize:10}}>● 47 joueurs connectés</span>
          <div style={{width:30,height:30,borderRadius:'50%',background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>IB</div>
        </div>
      }/>

      <div style={{padding:'24px 28px',display:'grid',gridTemplateColumns:'1fr 420px',gap:24,height:'calc(100% - 73px)',overflow:'hidden'}}>

        {/* LEFT — composer + history */}
        <div style={{display:'flex',flexDirection:'column',gap:18,overflow:'auto',paddingRight:6}}>

          <div>
            <div className="wf-kicker">Diffusion en direct</div>
            <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:38,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:'4px 0 0'}}>
              Une annonce. <em style={{color:'#C44536',fontStyle:'italic'}}>Tous les écrans.</em>
            </h1>
            <div style={{fontSize:13,color:'var(--wf-ink-soft)',marginTop:8,maxWidth:560,lineHeight:1.5}}>
              Pousse un message qui pulse chez chaque joueur — selon le type, l'effet visuel change (cloche, confettis, pulsation rouge).
            </div>
          </div>

          {/* TYPE selector */}
          <div className="wf-glass" style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:14}}>
            <div className="wf-kicker">Nature</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {TYPES.map((t,i)=>(
                <div key={t.k} style={{
                  padding:'14px 14px',borderRadius:12,
                  background: i===2?`${t.c}10`:'rgba(255,255,255,0.55)',
                  border:`${i===2?2:1}px solid ${i===2?t.c:'rgba(154,145,127,0.25)'}`,
                  cursor:'pointer',display:'flex',flexDirection:'column',gap:6,
                  position:'relative',
                }}>
                  {i===2 && <div style={{position:'absolute',top:8,right:8,width:14,height:14,borderRadius:'50%',background:t.c,color:'#fff',fontSize:9,display:'grid',placeItems:'center',fontWeight:700}}>✓</div>}
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:t.c}}/>
                    <span style={{fontWeight:700,fontSize:13,color:t.c}}>{t.l}</span>
                  </div>
                  <div style={{fontSize:10,color:'var(--wf-ink-soft)',lineHeight:1.4}}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MESSAGE */}
          <div className="wf-glass" style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:14}}>
            <div className="wf-row" style={{gap:8}}>
              <div className="wf-kicker">Message</div>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>Markdown léger · 280 car. recommandés</span>
            </div>
            <div style={{
              background:'rgba(255,255,255,0.7)',
              border:'1.5px solid rgba(46,125,50,0.35)',
              borderRadius:12,padding:'16px 18px',
              display:'flex',flexDirection:'column',gap:10,
            }}>
              <input
                defaultValue="Atlas et Boréal franchissent le L3 — bravo !"
                style={{border:'none',background:'transparent',outline:'none',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:22,fontWeight:600,letterSpacing:'-0.01em',color:'var(--wf-ink)'}}
                placeholder="Titre court — éditorial, percutant"
              />
              <textarea
                rows={3}
                defaultValue="Deux équipes viennent de boucler la phase Discovery. Continuez sur cette lancée — vos mentors sont avec vous, et il reste 2h30 avant le pitch. 🚀"
                style={{border:'none',background:'transparent',outline:'none',fontSize:13,fontFamily:'inherit',resize:'none',lineHeight:1.5,color:'var(--wf-ink)'}}
                placeholder="Corps du message…"
              />
              <div className="wf-row" style={{gap:8,paddingTop:8,borderTop:'1px solid rgba(154,145,127,0.18)'}}>
                <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',padding:'5px 10px',borderRadius:7,fontSize:11,cursor:'pointer'}}>+ Lien</button>
                <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',padding:'5px 10px',borderRadius:7,fontSize:11,cursor:'pointer'}}>+ Emoji</button>
                <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',padding:'5px 10px',borderRadius:7,fontSize:11,cursor:'pointer'}}>+ Pièce jointe</button>
                <span className="wf-grow"/>
                <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>148 / 280</span>
              </div>
            </div>
          </div>

          {/* TARGETING + SCHEDULE */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div className="wf-glass" style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:10}}>
              <div className="wf-kicker">Destinataires</div>
              {[
                { l:'Toutes les équipes',     sub:'12 équipes · 47 joueurs', sel:true  },
                { l:'Niveau spécifique',      sub:'L0–L4',                    sel:false },
                { l:'Équipes sélectionnées',  sub:'pick‑list',                sel:false },
                { l:'Mentors uniquement',     sub:'4 en ligne',               sel:false },
              ].map((r,i)=>(
                <div key={i} className="wf-row" style={{gap:10,padding:'8px 10px',borderRadius:8,background:r.sel?'rgba(27,58,92,0.08)':'transparent',cursor:'pointer'}}>
                  <span style={{width:14,height:14,borderRadius:'50%',border:`1.5px solid ${r.sel?'#1B3A5C':'rgba(43,38,30,0.3)'}`,background:r.sel?'#1B3A5C':'transparent',display:'grid',placeItems:'center',color:'#fff',fontSize:8}}>{r.sel?'●':''}</span>
                  <span style={{fontSize:13,fontWeight:r.sel?600:500}}>{r.l}</span>
                  <span className="wf-grow"/>
                  <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{r.sub}</span>
                </div>
              ))}
            </div>
            <div className="wf-glass" style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:10}}>
              <div className="wf-kicker">Diffusion</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div style={{padding:'12px 12px',borderRadius:10,border:'2px solid #2E7D32',background:'rgba(46,125,50,0.08)',display:'flex',flexDirection:'column',gap:3,cursor:'pointer'}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#2E7D32'}}>Maintenant</span>
                  <span style={{fontSize:10,color:'var(--wf-ink-soft)'}}>Push immédiat · sons, pulse, toast</span>
                </div>
                <div style={{padding:'12px 12px',borderRadius:10,border:'1px solid rgba(154,145,127,0.3)',background:'rgba(255,255,255,0.5)',display:'flex',flexDirection:'column',gap:3,cursor:'pointer'}}>
                  <span style={{fontSize:13,fontWeight:600}}>Programmer</span>
                  <span style={{fontSize:10,color:'var(--wf-ink-soft)'}}>Date + heure</span>
                </div>
              </div>
              <div className="wf-row" style={{gap:8,marginTop:6,padding:'8px 10px',background:'rgba(255,255,255,0.5)',borderRadius:8,border:'1px solid rgba(154,145,127,0.2)'}}>
                <span style={{fontSize:11,color:'var(--wf-ink-soft)'}}>📌 Épingler</span>
                <span className="wf-grow"/>
                <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>30 min sur le journal</span>
                <span style={{width:24,height:14,borderRadius:7,background:'#2E7D32',position:'relative'}}><span style={{position:'absolute',top:1,right:1,width:12,height:12,borderRadius:'50%',background:'#fff'}}/></span>
              </div>
            </div>
          </div>

          {/* HISTORY */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div className="wf-row" style={{gap:8}}>
              <div className="wf-kicker">Annonces récentes</div>
              <span className="wf-grow"/>
              <span style={{fontSize:11,color:'var(--wf-ink-faint)'}}>Voir tout →</span>
            </div>
            {past.map((p,i)=>{
              const t = TYPES.find(x=>x.k===p.type);
              return (
                <div key={i} className="wf-row" style={{gap:12,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.5)',border:'1px solid rgba(154,145,127,0.2)'}}>
                  <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)',width:38}}>{p.t}</span>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',padding:'2px 8px',borderRadius:4,background:t.c+'18',color:t.c,minWidth:78,textAlign:'center'}}>{t.l}</span>
                  <span style={{fontSize:12,flex:1,fontFamily:'var(--font-heading,Baskervville,serif)',fontStyle:'italic',color:'var(--wf-ink)'}}>{p.title}</span>
                  <span style={{fontSize:10,color:'var(--wf-ink-soft)'}}>{p.reach}</span>
                  <span style={{fontSize:10,color:'#2E7D32',fontWeight:600}}>{p.read} lus</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — live preview */}
        <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'auto'}}>
          <div className="wf-kicker" style={{paddingLeft:4}}>Aperçu côté joueur</div>

          {/* Phone preview */}
          <div style={{
            alignSelf:'center',width:300,height:600,
            background:'#1a1a1a',borderRadius:36,padding:10,
            boxShadow:'0 30px 60px rgba(43,38,30,0.18), 0 12px 24px rgba(43,38,30,0.12)',
            position:'relative',
          }}>
            <div style={{
              position:'absolute',top:18,left:'50%',transform:'translateX(-50%)',
              width:90,height:22,borderRadius:11,background:'#000',zIndex:2,
            }}/>
            <div style={{
              width:'100%',height:'100%',borderRadius:28,overflow:'hidden',
              background:'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 100%)',
              position:'relative',padding:'56px 12px 16px',display:'flex',flexDirection:'column',gap:10,
            }}>
              <div className="wf-row" style={{padding:'0 4px',gap:6}}>
                <span style={{width:24,height:24,borderRadius:6,background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,fontFamily:'var(--font-heading,Baskervville,serif)'}}>E</span>
                <span style={{fontSize:11,fontWeight:600}}>Atlas</span>
                <span className="wf-grow"/>
                <span className="wf-pill is-blue" style={{fontSize:9,padding:'2px 6px'}}>L3</span>
              </div>

              {/* The announcement card — celebrate variant */}
              <div style={{
                background:'linear-gradient(180deg,#fff 0%,rgba(46,125,50,0.06) 100%)',
                border:'1.5px solid rgba(46,125,50,0.4)',
                borderRadius:14,padding:'14px 14px',
                display:'flex',flexDirection:'column',gap:8,
                boxShadow:'0 12px 28px rgba(46,125,50,0.15)',
                position:'relative',overflow:'hidden',
              }}>
                <div style={{position:'absolute',top:-8,left:-8,width:80,height:80,background:'radial-gradient(circle,rgba(46,125,50,0.15),transparent 70%)'}}/>
                <div className="wf-row" style={{gap:6,position:'relative'}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:'#2E7D32'}}/>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',color:'#2E7D32',textTransform:'uppercase'}}>Régie · célébration</span>
                  <span className="wf-grow"/>
                  <span style={{fontSize:9,color:'var(--wf-ink-faint)'}}>à l'instant</span>
                </div>
                <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:15,fontWeight:600,letterSpacing:'-0.005em',lineHeight:1.25,position:'relative'}}>
                  Atlas et Boréal franchissent le L3 — bravo !
                </div>
                <div style={{fontSize:10.5,color:'var(--wf-ink-soft)',lineHeight:1.4,position:'relative'}}>
                  Deux équipes viennent de boucler la phase Discovery. Continuez sur cette lancée — vos mentors sont avec vous, et il reste 2h30 avant le pitch. 🚀
                </div>
                <div className="wf-row" style={{gap:6,paddingTop:6,position:'relative'}}>
                  <button style={{background:'#2E7D32',color:'#fff',border:'none',padding:'5px 10px',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer'}}>👏 Bravo</button>
                  <button style={{background:'transparent',color:'var(--wf-ink-soft)',border:'1px solid rgba(43,38,30,0.18)',padding:'5px 10px',borderRadius:6,fontSize:10,cursor:'pointer'}}>Ignorer</button>
                </div>
              </div>

              {/* Background blurred content */}
              <div style={{opacity:0.4,display:'flex',flexDirection:'column',gap:6,filter:'blur(0.5px)'}}>
                <div style={{height:42,background:'rgba(255,255,255,0.6)',borderRadius:10}}/>
                <div style={{height:42,background:'rgba(255,255,255,0.6)',borderRadius:10}}/>
                <div style={{height:42,background:'rgba(255,255,255,0.6)',borderRadius:10}}/>
              </div>
            </div>
          </div>

          {/* Reach simulation */}
          <div className="wf-glass-tint" style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
            <div className="wf-kicker">Portée estimée</div>
            <div className="wf-row" style={{gap:14}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontSize:26,fontWeight:800,color:'#1B3A5C',lineHeight:1}}>47</div>
                <div style={{fontSize:10,color:'var(--wf-ink-soft)',marginTop:3}}>joueurs en ligne</div>
              </div>
              <div style={{width:1,background:'rgba(154,145,127,0.3)'}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontSize:26,fontWeight:800,color:'#2E7D32',lineHeight:1}}>~92%</div>
                <div style={{fontSize:10,color:'var(--wf-ink-soft)',marginTop:3}}>lus en moins de 3 min</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button style={{
            background:'linear-gradient(180deg,#3B9D43 0%,#2E7D32 100%)',color:'#fff',border:'none',
            padding:'15px 22px',borderRadius:12,fontSize:14,fontWeight:700,
            cursor:'pointer',fontFamily:'Montserrat,sans-serif',
            letterSpacing:'0.02em',boxShadow:'0 16px 32px rgba(46,125,50,0.4)',
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:10,
          }}>
            Diffuser maintenant
            <span style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'grid',placeItems:'center',fontSize:13}}>↗</span>
          </button>
          <div style={{fontSize:10,color:'var(--wf-ink-faint)',textAlign:'center'}}>Annulable pendant 5 secondes après envoi</div>
        </div>
      </div>
    </FlowShell2>
  );
};

// === 7) MODE PITCH · JURY ===================================================

const GMPitchJury = () => {
  const queue = [
    { name:'Atlas',   level:'L3', state:'pitch',  t:'04:12',     members:'YA · SK · NB',                 mark:'Charge mentale > budget' },
    { name:'Boréal',  level:'L3', state:'next',   t:'dans ~3min',members:'MP · LR',                       mark:'Carte d\'empathie · cuisine zéro déchet' },
    { name:'Cyrus',   level:'L2', state:'after',  t:'+ 8min',    members:'JD · TB · OM · VG',             mark:'Outils de tri pour cabinets dentaires' },
    { name:'Delta',   level:'L3', state:'after',  t:'+ 13min',   members:'CH · PA · RS',                  mark:'Mobilité étudiante low‑cost' },
    { name:'Éole',    level:'L2', state:'after',  t:'+ 18min',   members:'NM · LF',                       mark:'Énergie résidentielle partagée' },
  ];

  const criteria = [
    { k:'problem', l:'Problème', d:'Réel, urgent, vécu', score:4, note:'Très clair, charge mentale parents' },
    { k:'sol',     l:'Solution', d:'Crédibilité technique', score:3, note:'Encore vague sur la techno' },
    { k:'market',  l:'Marché',   d:'Taille, accessibilité', score:4, note:null },
    { k:'feas',    l:'Faisabilité', d:'48h post‑hack', score:3, note:null },
    { k:'pres',    l:'Présentation', d:'Clarté, énergie', score:5, note:'Yasmine porte bien le récit' },
  ];

  const jurors = [
    { i:'IB', n:'Inès B.',     role:'présidente', done:5, total:5, color:'#1B3A5C' },
    { i:'KL', n:'Karim L.',    role:'jury · invest', done:4, total:5, color:'#2E7D32' },
    { i:'AZ', n:'Anissa Z.',   role:'jury · UX',    done:3, total:5, color:'#D97706' },
  ];

  return (
    <FlowShell2 bg="linear-gradient(180deg,#1a2a3e 0%,#0f1825 60%,#0a1018 100%)">
      {/* Top bar — pitch mode */}
      <div className="wf-row" style={{padding:'18px 28px',gap:14,borderBottom:'1px solid rgba(255,255,255,0.08)',background:'rgba(0,0,0,0.2)'}}>
        <div className="wf-row" style={{gap:10}}>
          <div style={{width:30,height:30,borderRadius:6,background:'#C44536',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontWeight:700,fontSize:14}}>E</div>
          <div className="wf-stack">
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600,lineHeight:1,color:'#fff'}}>Mode pitch · session jury</div>
            <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',marginTop:2}}>Hack‑Days 26 · finale L4</div>
          </div>
        </div>
        <span className="wf-grow"/>
        <div className="wf-row" style={{gap:10}}>
          <span style={{fontSize:11,fontWeight:700,color:'#C44536',padding:'4px 10px',borderRadius:6,background:'rgba(196,69,54,0.18)',border:'1px solid rgba(196,69,54,0.4)',letterSpacing:'0.08em'}}>● LIVE · pitch en cours</span>
          <span className="wf-mono" style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>04:12 / 05:00</span>
          <button style={{background:'rgba(255,255,255,0.08)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>⏸ Pause</button>
          <button style={{background:'#C44536',color:'#fff',border:'none',padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer'}}>Suivant →</button>
        </div>
      </div>

      <div style={{padding:'20px 28px',display:'grid',gridTemplateColumns:'1fr 460px',gap:24,height:'calc(100% - 73px)',overflow:'hidden'}}>

        {/* LEFT — current pitcher + queue */}
        <div style={{display:'flex',flexDirection:'column',gap:18,overflow:'auto',paddingRight:6}}>

          {/* Currently pitching */}
          <div style={{
            background:'linear-gradient(180deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)',
            border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:16,padding:'24px 28px',
            display:'flex',flexDirection:'column',gap:18,
          }}>
            <div className="wf-row" style={{gap:10}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.16em',color:'#C44536',textTransform:'uppercase'}}>● en train de pitcher</span>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>Équipe 1 / 12</span>
            </div>

            <div className="wf-row" style={{gap:18,alignItems:'flex-start'}}>
              <div style={{width:64,height:64,borderRadius:14,background:'linear-gradient(135deg,#1B3A5C 0%,#22456C 100%)',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:28,fontWeight:700,boxShadow:'0 12px 24px rgba(27,58,92,0.5)'}}>A</div>
              <div style={{flex:1}}>
                <h2 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:36,fontWeight:600,letterSpacing:'-0.02em',color:'#fff',lineHeight:1}}>Atlas</h2>
                <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginTop:6,fontStyle:'italic',fontFamily:'var(--font-heading,Baskervville,serif)'}}>« Charge mentale {'>'} budget — au cœur des familles, le soir. »</div>
                <div className="wf-row" style={{gap:14,marginTop:10}}>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Équipe · YA · SK · NB</span>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>· L3 atteint · 820 XP</span>
                </div>
              </div>
              {/* Timer */}
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontSize:42,fontWeight:800,color:'#fff',letterSpacing:'-0.02em',lineHeight:1}}>04:12</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:4,letterSpacing:'0.1em',textTransform:'uppercase'}}>écoulé sur 5:00</div>
                <div style={{width:140,height:4,borderRadius:2,background:'rgba(255,255,255,0.1)',marginTop:8,overflow:'hidden'}}>
                  <div style={{width:'84%',height:'100%',background:'linear-gradient(90deg,#2E7D32,#D97706)',borderRadius:2}}/>
                </div>
              </div>
            </div>

            {/* Slide preview placeholder */}
            <div style={{
              aspectRatio:'16/9',width:'100%',
              borderRadius:10,background:'rgba(255,255,255,0.04)',
              border:'1px dashed rgba(255,255,255,0.15)',
              display:'flex',alignItems:'center',justifyContent:'center',
              flexDirection:'column',gap:6,
            }}>
              <div style={{fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)'}}>Slide 4 / 7 · diffusée à l'écran</div>
              <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:24,fontWeight:600,color:'rgba(255,255,255,0.6)',fontStyle:'italic'}}>« Le frigo qui parle à 19h »</div>
            </div>
          </div>

          {/* Queue */}
          <div>
            <div className="wf-row" style={{gap:8,marginBottom:10}}>
              <span style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',fontWeight:700}}>File de passage</span>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>11 équipes restantes · ordre tiré</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {queue.slice(1).map((q,i)=>{
                const isNext = q.state==='next';
                return (
                  <div key={i} className="wf-row" style={{
                    gap:14,padding:'12px 16px',borderRadius:10,
                    background: isNext?'rgba(217,119,6,0.12)':'rgba(255,255,255,0.04)',
                    border: `1px solid ${isNext?'rgba(217,119,6,0.4)':'rgba(255,255,255,0.08)'}`,
                  }}>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontSize:14,fontWeight:700,color:isNext?'#D97706':'rgba(255,255,255,0.4)',width:24}}>{i+2}</span>
                    <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.08)',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600}}>{q.name[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="wf-row" style={{gap:8}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{q.name}</span>
                        <span className="wf-pill" style={{fontSize:9,padding:'2px 6px',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)'}}>{q.level}</span>
                        {isNext && <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',color:'#D97706',textTransform:'uppercase'}}>● au suivant</span>}
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:3,fontStyle:'italic',fontFamily:'var(--font-heading,Baskervville,serif)'}}>{q.mark}</div>
                    </div>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{q.t}</span>
                    <button style={{background:'transparent',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.15)',padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer'}}>⇅</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — jury scoring grid */}
        <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'auto',paddingLeft:4}}>
          {/* Juror identity */}
          <div style={{
            padding:'14px 16px',borderRadius:12,
            background:'rgba(217,119,6,0.10)',border:'1px solid rgba(217,119,6,0.35)',
            display:'flex',flexDirection:'column',gap:6,
          }}>
            <div className="wf-row" style={{gap:8}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'#D97706',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>AZ</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>Anissa Z. · jury UX</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>Tu notes l'équipe Atlas</div>
              </div>
            </div>
          </div>

          <div style={{
            padding:'18px 20px',borderRadius:14,
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
            display:'flex',flexDirection:'column',gap:14,
          }}>
            <div className="wf-row" style={{gap:8}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:'#fff'}}>Grille de notation · /5 par critère</h3>
              <span className="wf-grow"/>
              <span className="wf-mono" style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>3 / 5 critères</span>
            </div>

            {criteria.map((c,i)=>(
              <div key={c.k} style={{display:'flex',flexDirection:'column',gap:8,paddingBottom:14,borderBottom:i<criteria.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>
                <div className="wf-row" style={{gap:8}}>
                  <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{c.l}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>· {c.d}</span>
                  <span className="wf-grow"/>
                  <span style={{fontFamily:'Montserrat,sans-serif',fontSize:14,fontWeight:800,color:c.score?'#D97706':'rgba(255,255,255,0.3)'}}>{c.score?`${c.score}/5`:'—'}</span>
                </div>
                {/* 5 dots */}
                <div className="wf-row" style={{gap:6}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} style={{
                      flex:1,height:30,borderRadius:6,
                      background: n<=c.score?'#D97706':'rgba(255,255,255,0.05)',
                      border: `1px solid ${n<=c.score?'#D97706':'rgba(255,255,255,0.1)'}`,
                      color:n<=c.score?'#fff':'rgba(255,255,255,0.4)',
                      fontSize:11,fontWeight:600,cursor:'pointer',
                    }}>{n}</button>
                  ))}
                </div>
                {c.note && (
                  <div style={{
                    fontSize:11,color:'rgba(255,255,255,0.7)',
                    padding:'8px 10px',background:'rgba(255,255,255,0.03)',borderRadius:7,
                    fontStyle:'italic',lineHeight:1.4,
                  }}>« {c.note} »</div>
                )}
              </div>
            ))}

            <textarea
              rows={2}
              placeholder="Commentaire global (optionnel — visible côté équipe après pitch)"
              style={{
                background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:8,padding:'10px 12px',color:'#fff',fontSize:12,fontFamily:'inherit',
                resize:'none',outline:'none',lineHeight:1.4,
              }}
            />

            <button style={{
              background:'linear-gradient(180deg,#D97706 0%,#B45309 100%)',color:'#fff',border:'none',
              padding:'12px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',
              fontFamily:'Montserrat,sans-serif',boxShadow:'0 12px 24px rgba(217,119,6,0.4)',
            }}>Valider mes notes pour Atlas</button>
          </div>

          {/* Other jurors progress */}
          <div style={{
            padding:'14px 16px',borderRadius:12,
            background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
          }}>
            <div className="wf-kicker" style={{color:'rgba(255,255,255,0.5)'}}>Avancement des autres jurés</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
              {jurors.map((j,i)=>(
                <div key={i} className="wf-row" style={{gap:10}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:j.color,color:'#fff',display:'grid',placeItems:'center',fontSize:9,fontWeight:700}}>{j.i}</div>
                  <span style={{fontSize:12,color:'#fff'}}>{j.n}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>· {j.role}</span>
                  <span className="wf-grow"/>
                  <div style={{width:60,height:4,borderRadius:2,background:'rgba(255,255,255,0.08)'}}>
                    <div style={{width:`${(j.done/j.total)*100}%`,height:'100%',background:j.color,borderRadius:2}}/>
                  </div>
                  <span className="wf-mono" style={{fontSize:10,color:'rgba(255,255,255,0.5)',width:24,textAlign:'right'}}>{j.done}/{j.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FlowShell2>
  );
};

// === 8) REPLAY · FIN DE HACK ================================================

const GMReplay = () => {
  const podium = [
    { rank:1, name:'Atlas',  xp:1840, mark:"Charge mentale > budget", color:'#D97706', glow:'rgba(217,119,6,0.4)' },
    { rank:2, name:'Boréal', xp:1620, mark:"Cuisine zéro déchet",     color:'#1B3A5C', glow:'rgba(27,58,92,0.3)' },
    { rank:3, name:'Cyrus',  xp:1440, mark:"Tri médical cabinets",    color:'#2E7D32', glow:'rgba(46,125,50,0.3)' },
  ];
  const standings = [
    { r:4,  n:'Delta',   xp:1260 }, { r:5,  n:'Éole',    xp:1180 },
    { r:6,  n:'Fénix',   xp:1080 }, { r:7,  n:'Galileo', xp:980 },
    { r:8,  n:'Helios',  xp:920 },  { r:9,  n:'Iris',    xp:840 },
    { r:10, n:'Juno',    xp:720 },  { r:11, n:'Kappa',   xp:680 },
    { r:12, n:'Lunar',   xp:560 },
  ];
  const moments = [
    { t:'09:15', l:'Coup d\'envoi · 47 joueurs · 12 équipes',                 c:'#1B3A5C', big:true },
    { t:'10:48', l:'1er livrable validé · Lunar · « problème énoncé »',        c:'#2E7D32' },
    { t:'12:30', l:'Pause déjeuner · 4 équipes ont franchi L1',                c:'rgba(154,145,127,0.6)' },
    { t:'14:08', l:'Atlas franchit L3 — 1ère équipe · pulse régie',            c:'#D97706', big:true },
    { t:'15:42', l:'Boréal rattrape · Atlas vs Boréal en tête',                c:'#D97706' },
    { t:'17:00', l:'Mode pitch · 12 équipes pitchent en 75 min',               c:'#C44536', big:true },
    { t:'18:30', l:'Verdict du jury · Atlas remporte la finale',               c:'#D97706', big:true },
  ];

  return (
    <FlowShell2 bg="linear-gradient(180deg,#FBF1D9 0%,#F4E6C0 30%,#EDE6D6 100%)">
      <GMTopbar2 mode="Replay" sub="Hack‑Days 26 · 8 mai 2026 · terminé" right={
        <div className="wf-row" style={{gap:10}}>
          <span className="wf-pill is-green" style={{fontSize:10,fontWeight:700}}>✓ Hack clôturé · 18:42</span>
          <span className="wf-pill is-blue" style={{fontSize:10}}>9h 27min de jeu</span>
          <button style={{background:'#1B3A5C',color:'#fff',border:'none',padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>📤 Partager</button>
        </div>
      }/>

      <div style={{padding:'28px 32px 60px',overflow:'auto',height:'calc(100% - 73px)',display:'flex',flexDirection:'column',gap:32,maxWidth:1320,margin:'0 auto'}}>

        {/* Hero — verdict */}
        <div>
          <div className="wf-kicker">Hack‑Days 26 · récap</div>
          <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:64,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.02,margin:'6px 0 12px'}}>
            Atlas remporte. <em style={{color:'#D97706',fontStyle:'italic'}}>Tout le monde apprend.</em>
          </h1>
          <div style={{fontSize:15,color:'var(--wf-ink-soft)',maxWidth:680,lineHeight:1.55}}>
            12 équipes, 47 joueurs, 9h27 de jeu, 38 livrables validés, 4 mentors mobilisés. Voici le replay pour partager, célébrer, et certifier.
          </div>
        </div>

        {/* Podium */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr',gap:14,alignItems:'flex-end'}}>
          {[podium[1], podium[0], podium[2]].map((p,i)=>{
            const heights = [180, 240, 150];
            const isFirst = p.rank===1;
            return (
              <div key={p.rank} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                <div style={{
                  width:isFirst?96:72,height:isFirst?96:72,borderRadius:'50%',
                  background:`linear-gradient(135deg,${p.color} 0%,${p.color}dd 100%)`,
                  color:'#fff',display:'grid',placeItems:'center',
                  fontFamily:'var(--font-heading,Baskervville,serif)',
                  fontSize:isFirst?42:28,fontWeight:700,
                  boxShadow:`0 18px 36px ${p.glow}`,
                  marginBottom:6,
                }}>{p.name[0]}</div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:isFirst?28:20,fontWeight:600,letterSpacing:'-0.01em'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--wf-ink-soft)',fontStyle:'italic',marginTop:2,fontFamily:'var(--font-heading,Baskervville,serif)'}}>« {p.mark} »</div>
                </div>
                <div style={{
                  width:'100%',height:heights[i],
                  background:`linear-gradient(180deg,${p.color}30 0%,${p.color}15 100%)`,
                  border:`1px solid ${p.color}40`,
                  borderTopLeftRadius:14,borderTopRightRadius:14,
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',
                  paddingTop:18,gap:4,position:'relative',
                  boxShadow:`0 -8px 24px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                }}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontSize:isFirst?44:30,fontWeight:800,color:p.color,letterSpacing:'-0.02em',lineHeight:1}}>#{p.rank}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontSize:isFirst?18:14,fontWeight:700,color:'var(--wf-ink)',marginTop:8}}>{p.xp.toLocaleString('fr-FR')} XP</div>
                  {isFirst && <div style={{position:'absolute',top:-8,fontSize:24}}>👑</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats strip */}
        <div className="wf-glass" style={{padding:'20px 24px',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:0,position:'relative'}}>
          {[
            { v:'47',     l:'joueurs',                 sub:'12 équipes' },
            { v:'38',     l:'livrables validés',       sub:'sur 47 soumis' },
            { v:'81%',    l:'taux de validation',      sub:'+12 pts vs v1' },
            { v:'9h27',   l:'durée totale',            sub:'pause incluse' },
            { v:'12 240', l:'XP cumulés',              sub:'soit 260 / joueur' },
          ].map((s,i)=>(
            <div key={i} style={{padding:'4px 14px',borderRight:i<4?'1px solid rgba(154,145,127,0.2)':'none'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontSize:30,fontWeight:800,color:'#1B3A5C',letterSpacing:'-0.02em',lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:6}}>{s.l}</div>
              <div style={{fontSize:9,color:'var(--wf-ink-faint)',marginTop:2,letterSpacing:'0.04em'}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two columns: standings + timeline */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:24}}>

          {/* Standings */}
          <div>
            <div className="wf-row" style={{gap:8,marginBottom:10}}>
              <div className="wf-kicker">Classement complet</div>
              <span className="wf-grow"/>
              <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',padding:'4px 10px',borderRadius:6,fontSize:10,fontFamily:'Montserrat,sans-serif',cursor:'pointer'}}>↓ CSV</button>
            </div>
            <div className="wf-glass" style={{padding:'8px 0',display:'flex',flexDirection:'column'}}>
              {standings.map((t,i)=>(
                <div key={t.r} className="wf-row" style={{gap:14,padding:'10px 18px',borderBottom:i<standings.length-1?'1px solid rgba(154,145,127,0.12)':'none'}}>
                  <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)',width:24}}>#{t.r}</span>
                  <div style={{width:24,height:24,borderRadius:6,background:'rgba(27,58,92,0.08)',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:12,fontWeight:600,color:'#1B3A5C'}}>{t.n[0]}</div>
                  <span style={{fontSize:13,fontWeight:500,flex:1}}>{t.n}</span>
                  <div style={{flex:1,height:4,background:'rgba(154,145,127,0.18)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${(t.xp/1840)*100}%`,height:'100%',background:'linear-gradient(90deg,#1B3A5C,#22456C)',borderRadius:2}}/>
                  </div>
                  <span className="wf-mono" style={{fontSize:11,fontWeight:600,color:'var(--wf-ink)',width:54,textAlign:'right'}}>{t.xp.toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="wf-kicker" style={{marginBottom:10}}>Moments forts</div>
            <div style={{position:'relative',paddingLeft:18}}>
              <div style={{position:'absolute',left:5,top:6,bottom:6,width:1,background:'rgba(154,145,127,0.3)'}}/>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {moments.map((m,i)=>(
                  <div key={i} style={{display:'flex',gap:14,position:'relative'}}>
                    <div style={{position:'absolute',left:-18,top:6,width:11,height:11,borderRadius:'50%',background:m.c,border:'2px solid #FBF1D9',boxShadow:m.big?`0 0 0 3px ${m.c}30`:'none'}}/>
                    <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)',width:42,flexShrink:0,paddingTop:2}}>{m.t}</span>
                    <span style={{fontSize:m.big?13.5:12.5,color:'var(--wf-ink)',lineHeight:1.45,fontWeight:m.big?600:400}}>{m.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exports */}
        <div className="wf-glass" style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:18}}>
          <div>
            <div className="wf-kicker">Exports & certifications</div>
            <h3 style={{margin:'4px 0 0',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:24,fontWeight:600,letterSpacing:'-0.01em'}}>Pour partager, archiver, valoriser.</h3>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              { i:'🏅', l:'Certificats joueurs', sub:'47 PDF · 1 par joueur', cta:'Générer le lot' },
              { i:'📊', l:'Rapport global',      sub:'PDF 12 pages · stats + temps forts', cta:'Compiler' },
              { i:'🎬', l:'Replay vidéo',        sub:'Timeline + voix off auto · 4 min', cta:'Lancer le rendu' },
              { i:'🔗', l:'Page publique',       sub:'eic.ma/hack‑26 · podium + témoignages', cta:'Publier' },
            ].map((e,i)=>(
              <div key={i} style={{
                padding:'18px 16px',borderRadius:12,
                background:'rgba(255,255,255,0.55)',
                border:'1px solid rgba(154,145,127,0.25)',
                display:'flex',flexDirection:'column',gap:8,
              }}>
                <div style={{fontSize:26}}>{e.i}</div>
                <div style={{fontSize:13,fontWeight:700}}>{e.l}</div>
                <div style={{fontSize:10,color:'var(--wf-ink-soft)',lineHeight:1.4,minHeight:28}}>{e.sub}</div>
                <button style={{
                  background:'transparent',border:'1px solid rgba(27,58,92,0.3)',color:'#1B3A5C',
                  padding:'7px 12px',borderRadius:8,fontSize:11,fontWeight:600,
                  cursor:'pointer',fontFamily:'Montserrat,sans-serif',marginTop:4,
                }}>{e.cta} →</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </FlowShell2>
  );
};

Object.assign(window, { GMAnnounce, GMPitchJury, GMReplay });
