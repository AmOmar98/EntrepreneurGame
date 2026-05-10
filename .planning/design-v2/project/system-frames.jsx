/* global React */
// In-between / system frames — loading, error, empty, menu, settings, offline.
// These are the connective tissue: short moments that hold the experience together.

const SysShell = ({ children, bg }) => (
  <div className="wf" style={{background:bg||'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)'}}>
    <div className="wf-aurora">
      <div className="blob3" style={{top:'-10%',left:'30%',width:'60%',height:'60%',background:'radial-gradient(circle,rgba(27,58,92,0.06),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'auto'}}>{children}</div>
  </div>
);

// ============================================================================
// A) LOADING — first paint, mascot pulsing
// ============================================================================

const SysLoading = () => (
  <SysShell>
    <style>{`
      @keyframes loadDot { 0%,80%,100% { opacity:0.2; transform:translateY(0)} 40% { opacity:1; transform:translateY(-4px)} }
      @keyframes loadBar { 0% { transform:translateX(-100%)} 100% { transform:translateX(220%)} }
      @keyframes pixelBreath { 0%,100% { transform:scale(1)} 50% { transform:scale(1.04)} }
    `}</style>
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:36,padding:'40px'}}>

      {/* Mascot pixel breathing */}
      <div style={{animation:'pixelBreath 2.4s ease-in-out infinite',position:'relative'}}>
        <svg width="120" height="100" viewBox="0 0 120 100">
          <ellipse cx="60" cy="92" rx="32" ry="4" fill="rgba(43,38,30,0.08)"/>
          <path d="M30,55 Q30,30 50,28 Q60,18 70,28 Q90,30 90,55 Q90,82 60,82 Q30,82 30,55 Z" fill="#fff" stroke="rgba(43,38,30,0.18)" strokeWidth="1.5"/>
          <path d="M40,32 L36,22 Q38,20 44,28 Z" fill="#fff" stroke="rgba(43,38,30,0.18)" strokeWidth="1.2"/>
          <path d="M80,32 L84,22 Q82,20 76,28 Z" fill="#fff" stroke="rgba(43,38,30,0.18)" strokeWidth="1.2"/>
          <circle cx="50" cy="52" r="2.5" fill="#2B261E"/>
          <circle cx="70" cy="52" r="2.5" fill="#2B261E"/>
          <path d="M55,64 Q60,68 65,64" fill="none" stroke="#2B261E" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="44" cy="60" r="3" fill="rgba(217,119,6,0.3)"/>
          <circle cx="76" cy="60" r="3" fill="rgba(217,119,6,0.3)"/>
        </svg>
      </div>

      <div style={{textAlign:'center',maxWidth:480}}>
        <div className="wf-kicker">Chargement</div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:36,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.1,margin:'8px 0 12px'}}>
          Pixel rassemble ton parcours…
        </h1>
        <div className="wf-row" style={{gap:6,justifyContent:'center'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:'#1B3A5C',animation:'loadDot 1.4s infinite',animationDelay:'0s'}}/>
          <span style={{width:8,height:8,borderRadius:'50%',background:'#1B3A5C',animation:'loadDot 1.4s infinite',animationDelay:'0.2s'}}/>
          <span style={{width:8,height:8,borderRadius:'50%',background:'#1B3A5C',animation:'loadDot 1.4s infinite',animationDelay:'0.4s'}}/>
        </div>
      </div>

      {/* Steps */}
      <div className="wf-glass" style={{padding:'16px 22px',width:380,display:'flex',flexDirection:'column',gap:8}}>
        {[
          { l:'Profil chargé',         done:true },
          { l:'Équipe Atlas synchronisée', done:true },
          { l:'Missions du niveau 3',  done:true },
          { l:'Commentaires mentor',   done:false, active:true },
          { l:'Mascotte réveillée',    done:false },
        ].map((s,i)=>(
          <div key={i} className="wf-row" style={{gap:10}}>
            <span style={{
              width:14,height:14,borderRadius:'50%',
              background: s.done?'#2E7D32':s.active?'transparent':'transparent',
              border: s.done?'none':`1.5px solid ${s.active?'#1B3A5C':'rgba(154,145,127,0.4)'}`,
              display:'grid',placeItems:'center',color:'#fff',fontSize:8,
              boxShadow: s.active?'0 0 0 4px rgba(27,58,92,0.12)':'none',
            }}>{s.done?'✓':''}</span>
            <span style={{fontSize:12,color: s.done?'var(--wf-ink)':s.active?'#1B3A5C':'var(--wf-ink-faint)',fontWeight:s.active?600:400}}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* Slow-load hint */}
      <div style={{fontSize:11,color:'var(--wf-ink-faint)',textAlign:'center',maxWidth:360,lineHeight:1.5}}>
        Si rien ne bouge depuis 10 secondes, <a href="#" style={{color:'#1B3A5C',textDecoration:'underline'}}>rafraîchir la page</a> ou <a href="#" style={{color:'#1B3A5C',textDecoration:'underline'}}>passer en mode hors-ligne</a>.
      </div>

      {/* Aspirational quote */}
      <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontStyle:'italic',fontSize:14,color:'var(--wf-ink-soft)',maxWidth:420,textAlign:'center',marginTop:8,paddingTop:24,borderTop:'1px solid rgba(154,145,127,0.2)'}}>
        « Un grand voyage commence par charger une page. »<br/><span style={{fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontStyle:'normal',color:'var(--wf-ink-faint)'}}>— Pixel, certainement</span>
      </div>
    </div>
  </SysShell>
);

// ============================================================================
// B) ERROR — connection lost / 500
// ============================================================================

const SysError = () => (
  <SysShell bg="linear-gradient(180deg,#F4E9E2 0%,#EDE0D4 60%,#E5D5C5 100%)">
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:28,padding:'40px',textAlign:'center'}}>
      <div style={{position:'relative'}}>
        <svg width="120" height="100" viewBox="0 0 120 100">
          <ellipse cx="60" cy="92" rx="32" ry="4" fill="rgba(43,38,30,0.08)"/>
          <path d="M30,55 Q30,30 50,28 Q60,18 70,28 Q90,30 90,55 Q90,82 60,82 Q30,82 30,55 Z" fill="#fff" stroke="rgba(196,69,54,0.4)" strokeWidth="1.5"/>
          <path d="M40,32 L36,22 Q38,20 44,28 Z" fill="#fff" stroke="rgba(196,69,54,0.4)" strokeWidth="1.2"/>
          <path d="M80,32 L84,22 Q82,20 76,28 Z" fill="#fff" stroke="rgba(196,69,54,0.4)" strokeWidth="1.2"/>
          {/* Sad eyes — diagonal cross */}
          <path d="M46,49 L54,55 M54,49 L46,55" stroke="#C44536" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M66,49 L74,55 M74,49 L66,55" stroke="#C44536" strokeWidth="1.8" strokeLinecap="round"/>
          {/* Frown */}
          <path d="M53,68 Q60,62 67,68" fill="none" stroke="#C44536" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      <div style={{maxWidth:520}}>
        <div className="wf-kicker" style={{color:'#C44536'}}>Quelque chose s'est cassé</div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:54,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.05,margin:'10px 0 14px'}}>
          Pixel a perdu le fil. <em style={{color:'#C44536',fontStyle:'italic'}}>Pas toi.</em>
        </h1>
        <div style={{fontSize:14,color:'var(--wf-ink-soft)',lineHeight:1.55,maxWidth:440,margin:'0 auto'}}>
          Une erreur côté serveur empêche de charger ton parcours. Ton travail est sauvé — la dernière soumission date de <strong>15:02</strong>.
        </div>
      </div>

      <div className="wf-glass" style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:10,width:480,textAlign:'left'}}>
        <div className="wf-kicker">Détails techniques</div>
        <div className="wf-row" style={{gap:10,padding:'8px 12px',background:'rgba(196,69,54,0.08)',borderRadius:8,fontFamily:'var(--font-mono,monospace)',fontSize:11}}>
          <span style={{color:'#C44536',fontWeight:700}}>503</span>
          <span style={{color:'var(--wf-ink-soft)'}}>service indisponible · /api/v2/journey</span>
          <span className="wf-grow"/>
          <span style={{color:'var(--wf-ink-faint)',fontSize:10}}>15:18:42</span>
        </div>
        <div style={{fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.5}}>
          La régie a été prévenue automatiquement (Inès B. notifiée à 15:18). Tu peux <a href="#" style={{color:'#1B3A5C'}}>copier l'identifiant d'erreur</a> si tu veux les contacter directement.
        </div>
      </div>

      <div className="wf-row" style={{gap:10}}>
        <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.25)',color:'var(--wf-ink)',padding:'12px 18px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Mode hors-ligne</button>
        <button style={{background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',color:'#fff',border:'none',padding:'13px 24px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Montserrat,sans-serif',letterSpacing:'0.02em',boxShadow:'0 12px 24px rgba(27,58,92,0.4)',display:'inline-flex',alignItems:'center',gap:10}}>Réessayer <span style={{fontSize:14}}>↻</span></button>
      </div>

      <div style={{fontSize:11,color:'var(--wf-ink-faint)'}}>3 tentatives automatiques toutes les 8 secondes · prochaine dans <span className="wf-mono" style={{color:'#C44536'}}>00:05</span></div>
    </div>
  </SysShell>
);

// ============================================================================
// C) MENU / NAVIGATION — slide-in side menu
// ============================================================================

const SysMenu = () => (
  <SysShell>
    <div style={{height:'100%',display:'flex'}}>
      {/* Background blurred dashboard */}
      <div style={{flex:1,padding:'24px 28px',filter:'blur(2px)',opacity:0.55,pointerEvents:'none'}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="wf-row" style={{gap:10}}>
            <div style={{width:120,height:18,background:'rgba(43,38,30,0.1)',borderRadius:4}}/>
            <span className="wf-grow"/>
            <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(43,38,30,0.1)'}}/>
          </div>
          <div style={{height:80,background:'rgba(255,255,255,0.5)',borderRadius:14}}/>
          <div style={{height:120,background:'rgba(255,255,255,0.5)',borderRadius:14}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{height:160,background:'rgba(255,255,255,0.5)',borderRadius:14}}/>
            <div style={{height:160,background:'rgba(255,255,255,0.5)',borderRadius:14}}/>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div style={{position:'absolute',inset:0,background:'rgba(15,24,37,0.35)',backdropFilter:'blur(2px)',pointerEvents:'none'}}/>

      {/* Side menu */}
      <div style={{
        width:380,height:'100%',
        background:'linear-gradient(180deg,#FBF8F2 0%,#F4EFE3 100%)',
        borderLeft:'1px solid rgba(154,145,127,0.2)',
        boxShadow:'-30px 0 60px rgba(43,38,30,0.18)',
        position:'relative',zIndex:2,
        display:'flex',flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{padding:'24px 26px 18px',borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
          <div className="wf-row" style={{gap:12}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#D97706 0%,#B45309 100%)',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:20,fontWeight:700,boxShadow:'0 8px 18px rgba(217,119,6,0.3)'}}>YA</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600}}>Yasmine Alaoui</div>
              <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:1}}>Atlas · L3 · 820 XP</div>
            </div>
            <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:14,color:'var(--wf-ink-soft)'}}>×</button>
          </div>
          {/* Mini progress */}
          <div style={{marginTop:14}}>
            <div className="wf-row" style={{gap:8,fontSize:10,color:'var(--wf-ink-soft)',marginBottom:6}}>
              <span>Vers L4 · pitch</span>
              <span className="wf-grow"/>
              <span className="wf-mono" style={{fontWeight:600,color:'var(--wf-ink)'}}>820 / 1000</span>
            </div>
            <div style={{height:6,background:'rgba(154,145,127,0.18)',borderRadius:3,overflow:'hidden'}}>
              <div style={{width:'82%',height:'100%',background:'linear-gradient(90deg,#D97706,#F59E0B)',borderRadius:3}}/>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <div style={{flex:1,overflow:'auto',padding:'18px 14px',display:'flex',flexDirection:'column',gap:18}}>
          {[
            {
              title:'Le jeu',
              items:[
                { i:'◉', l:'Mon parcours',    sub:'L3 · 2/4 missions',   active:true },
                { i:'◇', l:'Mission en cours',sub:'M3.2 · entretiens',   badge:'1' },
                { i:'☰', l:'Mon équipe Atlas',sub:'YA · SK · NB' },
                { i:'⊕', l:'Mentor',          sub:'Sami K. · en ligne',  dot:'#2E7D32' },
              ],
            },
            {
              title:'Communauté',
              items:[
                { i:'◐', l:'Classement',      sub:'Tu es 4e / 12' },
                { i:'☆', l:'Tableau d\'honneur',sub:'Atlas · 1ère du L3' },
                { i:'✦', l:'Annonces régie',  badge:'2' },
              ],
            },
            {
              title:'Mon parcours',
              items:[
                { i:'☱', l:'Profil & badges' },
                { i:'⌬', l:'Hacks précédents',sub:'2 hacks' },
                { i:'⇩', l:'Exports & certificats' },
              ],
            },
            {
              title:'Réglages',
              items:[
                { i:'⚙', l:'Paramètres' },
                { i:'?', l:'Aide & contact' },
                { i:'↪', l:'Se déconnecter' },
              ],
            },
          ].map((g,i)=>(
            <div key={i}>
              <div className="wf-kicker" style={{padding:'0 12px 8px'}}>{g.title}</div>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                {g.items.map((it,j)=>(
                  <div key={j} className="wf-row" style={{
                    gap:12,padding:'10px 12px',borderRadius:8,cursor:'pointer',
                    background: it.active?'rgba(27,58,92,0.08)':'transparent',
                    borderLeft: it.active?'3px solid #1B3A5C':'3px solid transparent',
                  }}>
                    <span style={{width:24,height:24,borderRadius:6,background:it.active?'#1B3A5C':'rgba(154,145,127,0.12)',color:it.active?'#fff':'var(--wf-ink-soft)',display:'grid',placeItems:'center',fontSize:12,fontFamily:'var(--font-heading,Baskervville,serif)'}}>{it.i}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:it.active?600:500,color:it.active?'#1B3A5C':'var(--wf-ink)'}}>{it.l}</div>
                      {it.sub && <div style={{fontSize:10,color:'var(--wf-ink-faint)',marginTop:1}}>{it.sub}</div>}
                    </div>
                    {it.dot && <span style={{width:7,height:7,borderRadius:'50%',background:it.dot}}/>}
                    {it.badge && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'#C44536',color:'#fff'}}>{it.badge}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 22px',borderTop:'1px solid rgba(154,145,127,0.18)',background:'rgba(255,255,255,0.4)'}}>
          <div style={{fontSize:10,color:'var(--wf-ink-faint)',textAlign:'center',lineHeight:1.5}}>EIC · Hack‑Days 26 · v2.4.1<br/>UEMF Innovation Center</div>
        </div>
      </div>
    </div>
  </SysShell>
);

// ============================================================================
// D) SETTINGS — preferences page
// ============================================================================

const SysSettings = () => {
  const groups = [
    {
      title:'Apparence',
      sub:'Comment l\'app se présente à toi',
      items:[
        { k:'theme',  l:'Thème',           desc:'Le motif graphique appliqué partout', kind:'segment', opts:['Auto','Clair','Sombre'], val:'Clair' },
        { k:'motion', l:'Animations',      desc:'Mouvements, transitions, pulsations', kind:'toggle', val:true },
        { k:'mascot', l:'Pixel sur le HUD',desc:'La mascotte qui pulse en bas-droite', kind:'toggle', val:true },
        { k:'density',l:'Densité',         desc:'Espace entre les éléments',           kind:'segment', opts:['Confort','Standard','Compact'], val:'Standard' },
      ],
    },
    {
      title:'Notifications',
      sub:'Quand l\'app peut t\'interrompre',
      items:[
        { k:'mentor', l:'Commentaires mentor', desc:'À chaque retour de Sami sur un livrable',  kind:'toggle', val:true },
        { k:'team',   l:'Activité d\'équipe',   desc:'Quand un coéquipier soumet ou commente',  kind:'toggle', val:true },
        { k:'régie',  l:'Annonces régie',      desc:'Messages diffusés par l\'animateur',       kind:'toggle', val:true,  primary:true },
        { k:'lead',   l:'Classement live',     desc:'Quand ton équipe change de rang',          kind:'toggle', val:false },
        { k:'quiet',  l:'Heures calmes',       desc:'Pas de pulse sonore avant 9h après 19h',   kind:'segment', opts:['Off','9h–19h','Custom'], val:'9h–19h' },
      ],
    },
    {
      title:'Compte & confidentialité',
      sub:'Tes données, ton parcours',
      items:[
        { k:'profile', l:'Profil public',         desc:'Ton nom et tes badges visibles aux autres équipes', kind:'toggle', val:true },
        { k:'data',    l:'Exporter mes données',  desc:'JSON complet · livrables, commentaires, XP',       kind:'action', cta:'Télécharger' },
        { k:'remove',  l:'Supprimer mon compte',  desc:'Action irréversible · 30 jours de carence',        kind:'action', cta:'Demander', danger:true },
      ],
    },
    {
      title:'Avancé',
      sub:'Pour les curieuses',
      items:[
        { k:'lang',  l:'Langue',          desc:'Interface et notifications', kind:'segment', opts:['FR','EN','AR'], val:'FR' },
        { k:'beta',  l:'Mode bêta',       desc:'Active les fonctions en test', kind:'toggle', val:false },
        { k:'debug', l:'Mode développeur',desc:'Affiche les ID techniques',    kind:'toggle', val:false },
      ],
    },
  ];

  const Toggle = ({ on, primary }) => (
    <span style={{width:34,height:20,borderRadius:10,background:on?(primary?'#D97706':'#2E7D32'):'rgba(154,145,127,0.4)',position:'relative',transition:'background 0.2s',flexShrink:0}}>
      <span style={{position:'absolute',top:2,left:on?16:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 2px 4px rgba(0,0,0,0.15)'}}/>
    </span>
  );
  const Segment = ({ opts, val }) => (
    <div style={{display:'inline-flex',background:'rgba(154,145,127,0.12)',borderRadius:8,padding:2,gap:0}}>
      {opts.map((o,i)=>(
        <button key={i} style={{
          background:o===val?'#fff':'transparent',
          color:o===val?'#1B3A5C':'var(--wf-ink-soft)',
          border:'none',padding:'5px 11px',borderRadius:6,
          fontSize:11,fontWeight:o===val?600:500,cursor:'pointer',fontFamily:'inherit',
          boxShadow:o===val?'0 1px 3px rgba(43,38,30,0.1)':'none',
        }}>{o}</button>
      ))}
    </div>
  );

  return (
    <SysShell>
      <div style={{padding:'40px 32px 60px',maxWidth:880,margin:'0 auto',display:'flex',flexDirection:'column',gap:32}}>

        <div className="wf-row" style={{gap:14}}>
          <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',width:34,height:34,borderRadius:'50%',cursor:'pointer',fontSize:14}}>←</button>
          <div>
            <div className="wf-kicker">Réglages</div>
            <h1 style={{margin:'4px 0 0',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:38,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1}}>Tes préférences.</h1>
          </div>
          <span className="wf-grow"/>
          <span style={{fontSize:11,color:'var(--wf-ink-soft)',padding:'6px 12px',background:'rgba(46,125,50,0.12)',borderRadius:20}}>✓ Sauvegarde auto</span>
        </div>

        {groups.map((g,i)=>(
          <div key={i} className="wf-glass" style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <h2 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:22,fontWeight:600,letterSpacing:'-0.01em'}}>{g.title}</h2>
              <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:4}}>{g.sub}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {g.items.map((it,j)=>(
                <div key={j} className="wf-row" style={{
                  gap:18,padding:'14px 0',
                  borderBottom: j<g.items.length-1?'1px solid rgba(154,145,127,0.15)':'none',
                  alignItems:'center',
                }}>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="wf-row" style={{gap:8}}>
                      <span style={{fontSize:14,fontWeight:600,color:it.danger?'#C44536':'var(--wf-ink)'}}>{it.l}</span>
                      {it.primary && <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#D97706',padding:'2px 7px',background:'rgba(217,119,6,0.12)',borderRadius:3}}>important</span>}
                    </div>
                    <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:3,lineHeight:1.45}}>{it.desc}</div>
                  </div>
                  {it.kind==='toggle'  && <Toggle on={it.val} primary={it.primary}/>}
                  {it.kind==='segment' && <Segment opts={it.opts} val={it.val}/>}
                  {it.kind==='action'  && (
                    <button style={{
                      background:it.danger?'rgba(196,69,54,0.08)':'transparent',
                      border:`1px solid ${it.danger?'rgba(196,69,54,0.4)':'rgba(43,38,30,0.18)'}`,
                      color:it.danger?'#C44536':'var(--wf-ink)',
                      padding:'8px 14px',borderRadius:8,fontSize:11,fontWeight:600,
                      cursor:'pointer',fontFamily:'Montserrat,sans-serif',
                    }}>{it.cta} →</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{fontSize:10,color:'var(--wf-ink-faint)',textAlign:'center',lineHeight:1.7,paddingTop:14}}>
          EIC Innovation Center · Hack‑Days 26 · v2.4.1<br/>
          <a href="#" style={{color:'var(--wf-ink-soft)'}}>CGU</a> · <a href="#" style={{color:'var(--wf-ink-soft)'}}>Politique de données</a> · <a href="#" style={{color:'var(--wf-ink-soft)'}}>Crédits</a>
        </div>
      </div>
    </SysShell>
  );
};

// ============================================================================
// E) EMPTY STATE — first time, no missions yet
// ============================================================================

const SysEmpty = () => (
  <SysShell>
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:32,padding:'60px 40px',textAlign:'center'}}>

      {/* Illustration */}
      <div style={{position:'relative',width:280,height:200}}>
        {/* Empty journey line */}
        <svg width="280" height="200" viewBox="0 0 280 200">
          <defs>
            <pattern id="dots" patternUnits="userSpaceOnUse" width="4" height="4">
              <circle cx="2" cy="2" r="0.6" fill="rgba(154,145,127,0.5)"/>
            </pattern>
          </defs>
          <line x1="40" y1="100" x2="240" y2="100" stroke="url(#dots)" strokeWidth="3"/>
          {/* Stations placeholder */}
          {[40,100,160,220].map((x,i)=>(
            <g key={i}>
              <circle cx={x} cy="100" r="9" fill="#fff" stroke="rgba(154,145,127,0.5)" strokeWidth="1.5" strokeDasharray="2,2"/>
              <text x={x} y="125" textAnchor="middle" fontSize="9" fill="rgba(154,145,127,0.7)" fontFamily="Montserrat,sans-serif" letterSpacing="0.1em">L{i}</text>
            </g>
          ))}
          {/* Pixel waiting */}
          <g transform="translate(124,30)">
            <ellipse cx="16" cy="46" rx="12" ry="2" fill="rgba(43,38,30,0.08)"/>
            <path d="M4,26 Q4,14 14,13 Q16,8 18,13 Q28,14 28,26 Q28,40 16,40 Q4,40 4,26 Z" fill="#fff" stroke="rgba(43,38,30,0.18)" strokeWidth="1.2"/>
            <circle cx="12" cy="24" r="1.4" fill="#2B261E"/>
            <circle cx="20" cy="24" r="1.4" fill="#2B261E"/>
            <path d="M14,30 Q16,32 18,30" fill="none" stroke="#2B261E" strokeWidth="1" strokeLinecap="round"/>
          </g>
        </svg>
      </div>

      <div style={{maxWidth:480}}>
        <div className="wf-kicker">Avant le premier pas</div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:42,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:'8px 0 14px'}}>
          Ton parcours <em style={{color:'#D97706',fontStyle:'italic'}}>n'a pas encore commencé.</em>
        </h1>
        <div style={{fontSize:14,color:'var(--wf-ink-soft)',lineHeight:1.55,maxWidth:440,margin:'0 auto'}}>
          Le hack démarre à <strong>9h00 lundi 12 mai</strong>. D'ici là, tu peux préparer ton arrivée — découvrir ton équipe, lire le brief, et explorer les outils.
        </div>
      </div>

      {/* What you can do meanwhile */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,maxWidth:720,width:'100%'}}>
        {[
          { i:'☷', l:'Découvrir ton équipe',   sub:'Atlas · 3 personnes · profils', cta:'Voir' },
          { i:'¶', l:'Lire le brief général', sub:'Thème : autonomie alimentaire', cta:'Lire' },
          { i:'◔', l:'Tester les outils',      sub:'Templates · soumission · chat', cta:'Tester' },
        ].map((c,i)=>(
          <div key={i} className="wf-glass" style={{padding:'18px 18px',display:'flex',flexDirection:'column',gap:8,textAlign:'left',cursor:'pointer'}}>
            <div style={{fontSize:24,color:'#1B3A5C',fontFamily:'var(--font-heading,Baskervville,serif)'}}>{c.i}</div>
            <div style={{fontSize:13,fontWeight:600}}>{c.l}</div>
            <div style={{fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.4,minHeight:30}}>{c.sub}</div>
            <span style={{fontSize:11,color:'#1B3A5C',fontWeight:600,marginTop:2}}>{c.cta} →</span>
          </div>
        ))}
      </div>

      {/* Countdown */}
      <div className="wf-glass-tint" style={{padding:'14px 22px',display:'inline-flex',alignItems:'center',gap:14}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:'#D97706'}}/>
        <span style={{fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--wf-ink-soft)',fontWeight:600}}>Coup d'envoi</span>
        <span className="wf-mono" style={{fontSize:14,fontWeight:700,color:'#D97706'}}>2 j · 17 h · 42 min</span>
      </div>
    </div>
  </SysShell>
);

// ============================================================================
// F) OFFLINE — connection lost banner mode
// ============================================================================

const SysOffline = () => (
  <SysShell bg="linear-gradient(180deg,#EDE6D6 0%,#E5DCC8 100%)">
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>

      {/* Offline banner */}
      <div className="wf-row" style={{
        gap:12,padding:'14px 28px',
        background:'#1B3A5C',color:'#fff',
        borderBottom:'1px solid rgba(0,0,0,0.2)',
      }}>
        <span style={{width:8,height:8,borderRadius:'50%',background:'#F59E0B',boxShadow:'0 0 0 4px rgba(245,158,11,0.25)'}}/>
        <span style={{fontSize:13,fontWeight:600}}>Tu es hors‑ligne</span>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>· dernière sync à 15:02 · les modifications seront envoyées dès le retour du wifi</span>
        <span className="wf-grow"/>
        <button style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',color:'#fff',padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>↻ Réessayer</button>
      </div>

      {/* Content area */}
      <div style={{flex:1,padding:'32px 32px',maxWidth:1180,margin:'0 auto',width:'100%',display:'flex',flexDirection:'column',gap:24}}>
        <div>
          <div className="wf-kicker">Mode hors‑ligne</div>
          <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:44,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:'6px 0 10px'}}>
            Tu peux continuer. <em style={{color:'#1B3A5C',fontStyle:'italic'}}>On synchronisera plus tard.</em>
          </h1>
          <div style={{fontSize:14,color:'var(--wf-ink-soft)',maxWidth:640,lineHeight:1.55}}>
            Tes 3 derniers livrables et templates sont en cache. Tu peux travailler dessus — la prochaine connexion poussera tout automatiquement.
          </div>
        </div>

        {/* Available offline */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          <div className="wf-glass" style={{padding:'22px 26px'}}>
            <div className="wf-row" style={{marginBottom:12}}>
              <div className="wf-kicker" style={{color:'#2E7D32'}}>✓ Disponible hors-ligne</div>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>3 éléments · 2.4 Mo</span>
            </div>
            {[
              { l:'M3.2 · 5 entretiens',         sub:'brouillon en cours · 4 fiches sur 5', mod:true },
              { l:'M3.1 · Carte d\'empathie',    sub:'soumis · v2',                          mod:false },
              { l:'Template · proposition de valeur', sub:'lecture seule',                   mod:false },
            ].map((it,i)=>(
              <div key={i} className="wf-row" style={{gap:12,padding:'10px 0',borderTop:'1px solid rgba(154,145,127,0.15)'}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:it.mod?'#D97706':'#2E7D32'}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{it.l}</div>
                  <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:2}}>{it.sub}</div>
                </div>
                {it.mod && <span style={{fontSize:10,color:'#D97706',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>● modifié</span>}
              </div>
            ))}
          </div>

          <div className="wf-glass" style={{padding:'22px 26px'}}>
            <div className="wf-row" style={{marginBottom:12}}>
              <div className="wf-kicker" style={{color:'#C44536'}}>✗ Indisponible hors-ligne</div>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>besoin de wifi</span>
            </div>
            {[
              { l:'Commentaires mentor',     sub:'Sami a peut-être répondu' },
              { l:'Classement live',         sub:'snapshot 15:02 visible' },
              { l:'Annonces régie',          sub:'2 non‑lues en attente' },
              { l:'Activité d\'équipe',      sub:'YA et NB peut-être actifs' },
            ].map((it,i)=>(
              <div key={i} className="wf-row" style={{gap:12,padding:'10px 0',borderTop:'1px solid rgba(154,145,127,0.15)',opacity:0.6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'rgba(154,145,127,0.5)'}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{it.l}</div>
                  <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:2}}>{it.sub}</div>
                </div>
                <span style={{fontSize:14,color:'var(--wf-ink-faint)'}}>—</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending sync queue */}
        <div className="wf-glass-tint" style={{padding:'18px 22px'}}>
          <div className="wf-row" style={{marginBottom:10}}>
            <div className="wf-kicker">En attente d'envoi · 3 actions</div>
            <span className="wf-grow"/>
            <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-soft)'}}>~12 ko</span>
          </div>
          {[
            { t:'15:08', a:'Modifié',  l:'Fiche entretien · Léa' },
            { t:'15:11', a:'Ajouté',   l:'Fiche entretien · Karim · grand-mère' },
            { t:'15:14', a:'Commenté', l:'Carte d\'empathie · réponse à Sami' },
          ].map((q,i)=>(
            <div key={i} className="wf-row" style={{gap:14,padding:'8px 0',borderTop:i?'1px solid rgba(154,145,127,0.15)':'none',fontSize:12}}>
              <span className="wf-mono" style={{color:'var(--wf-ink-faint)',width:42}}>{q.t}</span>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#D97706',padding:'2px 7px',background:'rgba(217,119,6,0.12)',borderRadius:3,minWidth:64,textAlign:'center'}}>{q.a}</span>
              <span style={{flex:1,color:'var(--wf-ink)'}}>{q.l}</span>
              <span style={{color:'var(--wf-ink-faint)'}}>en attente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </SysShell>
);

Object.assign(window, { SysLoading, SysError, SysMenu, SysSettings, SysEmpty, SysOffline });
