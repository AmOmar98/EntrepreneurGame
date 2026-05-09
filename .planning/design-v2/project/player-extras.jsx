/* global React */
// Player-side complementary frames — leaves livrables/templates alone.
// (A) PitchPrep — J-1 / H-2 before pitch. Editorial countdown + last-mile checklist.
// (B) StuckHelp — player feels blocked. Pre-filled context + escalation options.
// (C) PlayerProfile — long-term parcours across multiple hacks, badges, mentors.

const FlowShell3 = ({ children, bg }) => (
  <div className="wf" style={{background:bg||'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)'}}>
    <div className="wf-aurora">
      <div className="blob3" style={{top:'-10%',left:'30%',width:'60%',height:'60%',background:'radial-gradient(circle,rgba(27,58,92,0.06),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'auto'}}>{children}</div>
  </div>
);

// ============================================================================
// A) PITCH PREP · H-2
// ============================================================================

const PitchPrep = () => {
  const checks = [
    { ok:true,  l:'Deck soumis',           sub:'9 slides · v3 · uploadé à 15:42',          tag:'fait' },
    { ok:true,  l:'Pitcheuse désignée',    sub:'Yasmine A. · 4 min + 1 min Q&R',           tag:'fait' },
    { ok:true,  l:'Brief équipe',          sub:'5 min ensemble — l\'angle, l\'ouverture, le punch', tag:'fait' },
    { ok:false, l:'Répétition à blanc',    sub:'15 min recommandées · sans deck',          tag:'à faire' },
    { ok:false, l:'Backup hors-ligne',     sub:'PDF du deck sur clé · au cas où le wifi…', tag:'optionnel' },
  ];
  const lineup = [
    { n:1,  team:'Atlas',   t:'15:00', mine:false, status:'passé',   verdict:'18.5/25' },
    { n:2,  team:'Helios',  t:'15:08', mine:false, status:'passé',   verdict:'14/25' },
    { n:3,  team:'Boréal',  t:'15:16', mine:false, status:'en cours',verdict:null },
    { n:4,  team:'Cyrus',   t:'15:24', mine:true,  status:'à toi',   verdict:null },
    { n:5,  team:'Delta',   t:'15:32', mine:false, status:'attend',  verdict:null },
    { n:6,  team:'Éole',    t:'15:40', mine:false, status:'attend',  verdict:null },
  ];

  return (
    <FlowShell3 bg="linear-gradient(180deg,#FBF1D9 0%,#F4E6C0 35%,#EDE6D6 100%)">
      <div style={{padding:'40px 40px 60px',maxWidth:1320,margin:'0 auto',display:'flex',flexDirection:'column',gap:32}}>

        {/* Hero countdown */}
        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:28,alignItems:'flex-end'}}>
          <div>
            <div className="wf-kicker">Pitch · finale L4</div>
            <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:64,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.02,margin:'8px 0 14px'}}>
              Tu pitches dans <em style={{color:'#C44536',fontStyle:'italic'}}>1 h 38 min.</em>
            </h1>
            <div style={{fontSize:15,color:'var(--wf-ink-soft)',maxWidth:560,lineHeight:1.55}}>
              Tout le travail des 9 dernières heures se condense en 4 minutes. Voilà la dernière ligne droite — coche, respire, et fais‑toi confiance.
            </div>
          </div>

          <div className="wf-glass" style={{padding:'22px 26px',display:'flex',flexDirection:'column',gap:14,borderLeft:'4px solid #C44536'}}>
            <div className="wf-row" style={{gap:10}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#C44536',animation:'pixelPulse 1.4s ease-in-out infinite'}}/>
              <span style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'#C44536',fontWeight:700}}>compte à rebours</span>
              <span className="wf-grow"/>
              <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>15:24</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:0,alignItems:'baseline'}}>
              {[
                { v:'01', l:'heure' },
                { v:'38', l:'min' },
                { v:'12', l:'sec' },
              ].map((b,i)=>(
                <div key={i} style={{textAlign:'center',position:'relative',padding:'0 4px'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontSize:54,fontWeight:800,color:'#1B3A5C',letterSpacing:'-0.04em',lineHeight:1}}>{b.v}</div>
                  <div style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--wf-ink-faint)',marginTop:6}}>{b.l}</div>
                  {i<2 && <div style={{position:'absolute',right:-2,top:8,fontSize:34,color:'rgba(43,38,30,0.2)',fontFamily:'Montserrat,sans-serif',fontWeight:300}}>:</div>}
                </div>
              ))}
            </div>
            <div style={{padding:'10px 12px',background:'rgba(196,69,54,0.08)',border:'1px solid rgba(196,69,54,0.25)',borderRadius:8,fontSize:11,color:'var(--wf-ink-soft)',lineHeight:1.4,textAlign:'center'}}>
              Auditorium · étage 2 · <strong style={{color:'#1B3A5C'}}>présence à 15:18</strong>
            </div>
          </div>
        </div>

        {/* 2-column body: checklist + lineup */}
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:24,alignItems:'flex-start'}}>

          {/* Checklist */}
          <div className="wf-glass" style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:14}}>
            <div className="wf-row" style={{gap:8,alignItems:'baseline'}}>
              <h2 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:24,fontWeight:600,letterSpacing:'-0.01em'}}>Dernière ligne droite</h2>
              <span className="wf-grow"/>
              <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)'}}>3/5 cochés</span>
              <div style={{width:80,height:5,background:'rgba(154,145,127,0.2)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:'60%',height:'100%',background:'linear-gradient(90deg,#2E7D32,#3B9D43)',borderRadius:3}}/>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:6}}>
              {checks.map((c,i)=>(
                <div key={i} className="wf-row" style={{
                  gap:14,padding:'14px 16px',borderRadius:10,
                  background: c.ok ? 'rgba(46,125,50,0.06)' : 'rgba(217,119,6,0.08)',
                  border: `1px solid ${c.ok?'rgba(46,125,50,0.22)':'rgba(217,119,6,0.3)'}`,
                }}>
                  <div style={{
                    width:26,height:26,borderRadius:'50%',flexShrink:0,
                    background: c.ok?'#2E7D32':'#fff',
                    color: c.ok?'#fff':'#D97706',
                    border: c.ok?'none':'1.5px solid #D97706',
                    display:'grid',placeItems:'center',fontSize:13,fontWeight:700,
                  }}>{c.ok?'✓':'○'}</div>
                  <div style={{flex:1}}>
                    <div className="wf-row" style={{gap:8}}>
                      <span style={{fontSize:14,fontWeight:600,textDecoration:c.ok?'line-through':'none',color:c.ok?'var(--wf-ink-soft)':'var(--wf-ink)'}}>{c.l}</span>
                      <span style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 7px',borderRadius:3,background:c.ok?'rgba(46,125,50,0.18)':c.tag==='optionnel'?'rgba(154,145,127,0.18)':'rgba(217,119,6,0.18)',color:c.ok?'#2E7D32':c.tag==='optionnel'?'var(--wf-ink-soft)':'#D97706',fontWeight:700}}>{c.tag}</span>
                    </div>
                    <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:3}}>{c.sub}</div>
                  </div>
                  {!c.ok && <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Faire →</button>}
                </div>
              ))}
            </div>
          </div>

          {/* Lineup */}
          <div className="wf-glass" style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
            <div className="wf-kicker">Ordre de passage</div>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {lineup.map((l,i)=>{
                const cur = l.status==='en cours';
                const mine = l.mine;
                return (
                  <div key={i} className="wf-row" style={{
                    gap:10,padding:'10px 12px',borderRadius:8,
                    background: mine?'rgba(196,69,54,0.10)':'transparent',
                    border: mine?'1.5px solid rgba(196,69,54,0.4)':'1px solid transparent',
                    borderBottom: i<lineup.length-1 && !mine ? '1px solid rgba(154,145,127,0.15)':undefined,
                  }}>
                    <span className="wf-mono" style={{fontSize:11,color:mine?'#C44536':'var(--wf-ink-faint)',fontWeight:700,width:18}}>{l.n}</span>
                    <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)',width:38}}>{l.t}</span>
                    <span style={{fontSize:13,fontWeight:mine?700:500,flex:1,color:mine?'#C44536':'var(--wf-ink)',fontFamily: mine?'var(--font-heading,Baskervville,serif)':'inherit',fontStyle:mine?'italic':'normal',fontSize:mine?15:13}}>{l.team}{mine && ' · toi'}</span>
                    {l.status==='passé'    && <span style={{fontSize:10,color:'var(--wf-ink-soft)'}}>passé · <strong style={{color:'#1B3A5C'}}>{l.verdict}</strong></span>}
                    {cur                   && <span style={{fontSize:10,color:'#D97706',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>● en cours</span>}
                    {l.status==='à toi'    && <span style={{fontSize:10,fontWeight:700,color:'#C44536',letterSpacing:'0.06em',textTransform:'uppercase'}}>à toi</span>}
                    {l.status==='attend'   && <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>attend</span>}
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:10,color:'var(--wf-ink-faint)',textAlign:'center',marginTop:4}}>+ 6 équipes après · finale à 16:24</div>
          </div>
        </div>

        {/* Jury brief + tips */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          <div className="wf-glass-tint" style={{padding:'22px 24px',display:'flex',flexDirection:'column',gap:14}}>
            <div className="wf-kicker">Jury · 3 personnes</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                { i:'IB', n:'Inès Belkadi',  r:'Présidente · CEO Numerica',     focus:'vision long-terme' },
                { i:'KL', n:'Karim Lahlou',  r:'Investisseur · Atlas Ventures', focus:'modèle économique' },
                { i:'AZ', n:'Anissa Ziani',  r:'Designer · Studio Mosaïque',     focus:'expérience utilisateur' },
              ].map((j,i)=>(
                <div key={i} className="wf-row" style={{gap:12,padding:'10px 12px',background:'rgba(255,255,255,0.5)',borderRadius:10,border:'1px solid rgba(154,145,127,0.18)'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>{j.i}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{j.n}</div>
                    <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:1}}>{j.r}</div>
                  </div>
                  <div style={{fontSize:10,fontStyle:'italic',color:'#1B3A5C',padding:'4px 8px',background:'rgba(27,58,92,0.08)',borderRadius:5,fontFamily:'var(--font-heading,Baskervville,serif)'}}>« {j.focus} »</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--wf-ink-soft)',padding:'10px 12px',background:'rgba(255,255,255,0.4)',borderRadius:8,lineHeight:1.5}}>
              Notation /5 sur 5 critères : <strong>Problème · Solution · Marché · Faisabilité · Présentation</strong>. Verdict 30 min après le dernier pitch.
            </div>
          </div>

          <div className="wf-glass" style={{padding:'22px 24px',display:'flex',flexDirection:'column',gap:14,borderLeft:'4px solid #2E7D32'}}>
            <div className="wf-kicker">3 rappels avant de monter</div>
            <div style={{display:'flex',flexDirection:'column',gap:14,marginTop:4}}>
              {[
                { n:'01', t:"Ouvre fort.",     d:'Le verbatim de Léa fait monter la tension dès la slide 2. C\'est ton angle.' },
                { n:'02', t:"Une histoire, pas une démo.", d:'Le jury retiendra la grand-mère de Karim, pas le diagramme d\'archi.' },
                { n:'03', t:"Respire.",         d:'4 minutes c\'est long quand on parle. Pause après chaque insight.' },
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',gap:14}}>
                  <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:32,fontWeight:600,color:'#2E7D32',lineHeight:1,letterSpacing:'-0.02em',flexShrink:0,width:42}}>{r.n}</div>
                  <div style={{flex:1,paddingTop:4}}>
                    <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:16,fontWeight:600,letterSpacing:'-0.005em'}}>{r.t}</div>
                    <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:3,lineHeight:1.45}}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="wf-row" style={{gap:14,padding:'18px 22px',background:'rgba(27,58,92,0.05)',border:'1px solid rgba(27,58,92,0.15)',borderRadius:14}}>
          <div style={{fontSize:14,fontFamily:'var(--font-heading,Baskervville,serif)',fontStyle:'italic',color:'#1B3A5C',flex:1,lineHeight:1.4}}>
            « Toute l'équipe Cyrus est avec toi. Le travail est fait — il ne reste qu'à le raconter. »
          </div>
          <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.25)',color:'var(--wf-ink)',padding:'12px 18px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Revoir le deck</button>
          <button style={{background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',color:'#fff',border:'none',padding:'13px 24px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Montserrat,sans-serif',letterSpacing:'0.02em',boxShadow:'0 14px 28px rgba(27,58,92,0.4)',display:'inline-flex',alignItems:'center',gap:10}}>
            Je suis prête <span style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'grid',placeItems:'center',fontSize:11}}>→</span>
          </button>
        </div>
      </div>
    </FlowShell3>
  );
};

// ============================================================================
// B) STUCK / COUP DE POUCE
// ============================================================================

const StuckHelp = () => {
  const tries = [
    { t:'14:32', l:'M3.2 ouverte · brief lu' },
    { t:'14:48', l:'1ère soumission · refusée par mentor (verbatim manquant)' },
    { t:'15:04', l:'Tu lis 2 fois la fiche template' },
    { t:'15:09', l:'Tu changes 3 fois la formulation puis tu effaces' },
    { t:'15:18', l:'Plus aucune action depuis 14 minutes' },
  ];

  return (
    <FlowShell3 bg="linear-gradient(180deg,#F4E9E2 0%,#EDE0D4 60%,#E5D5C5 100%)">
      <div style={{padding:'48px 32px 60px',maxWidth:880,margin:'0 auto',display:'flex',flexDirection:'column',gap:28}}>

        {/* Empathy hero */}
        <div>
          <div className="wf-kicker" style={{color:'#C44536'}}>Pause · respiration</div>
          <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:54,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.05,margin:'8px 0 14px'}}>
            Tu sembles bloquée. <em style={{color:'#C44536',fontStyle:'italic'}}>C'est normal.</em>
          </h1>
          <div style={{fontSize:16,color:'var(--wf-ink-soft)',maxWidth:640,lineHeight:1.55}}>
            On a tous des passages comme ça — la mission n'est pas perdue, et tu ne perds rien. On peut juste <strong>changer d'angle</strong> ensemble.
          </div>
        </div>

        {/* What we observed (auto-context) */}
        <div className="wf-glass" style={{padding:'22px 26px',display:'flex',flexDirection:'column',gap:14}}>
          <div className="wf-row" style={{gap:8}}>
            <div className="wf-kicker">Ce qu'on a vu de ton côté</div>
            <span className="wf-grow"/>
            <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>auto-rempli · partagé seulement si tu valides</span>
          </div>
          <div style={{position:'relative',paddingLeft:18,marginTop:4}}>
            <div style={{position:'absolute',left:5,top:8,bottom:8,width:1,background:'rgba(196,69,54,0.3)'}}/>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              {tries.map((tr,i)=>{
                const last = i===tries.length-1;
                return (
                  <div key={i} style={{display:'flex',gap:14,position:'relative'}}>
                    <div style={{position:'absolute',left:-18,top:4,width:11,height:11,borderRadius:'50%',background:last?'#C44536':'rgba(154,145,127,0.5)',border:'2px solid #F4E9E2'}}/>
                    <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)',width:42,flexShrink:0}}>{tr.t}</span>
                    <span style={{fontSize:13,color:last?'#C44536':'var(--wf-ink-soft)',lineHeight:1.45,fontWeight:last?600:400,fontStyle:last?'italic':'normal'}}>{tr.l}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="wf-row" style={{gap:8,padding:'10px 12px',background:'rgba(196,69,54,0.08)',border:'1px dashed rgba(196,69,54,0.4)',borderRadius:8,marginTop:4}}>
            <span style={{fontSize:11,color:'var(--wf-ink-soft)',flex:1}}>On peut joindre ce contexte à ta demande pour que Sami arrive informé.</span>
            <span style={{fontSize:10,color:'var(--wf-ink-soft)',marginRight:6}}>Joindre</span>
            <span style={{width:30,height:18,borderRadius:9,background:'#C44536',position:'relative'}}><span style={{position:'absolute',top:1.5,right:1.5,width:15,height:15,borderRadius:'50%',background:'#fff'}}/></span>
          </div>
        </div>

        {/* Three ways out */}
        <div>
          <div className="wf-kicker" style={{marginBottom:12}}>Trois façons de sortir du blocage</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[
              {
                k:'tip', l:'Petit indice', sub:"Une piste écrite, sans déranger personne.",
                tag:'low impact · -0 XP', c:'#2E7D32',
                detail:'Pixel te souffle un angle alternatif basé sur ce qui a marché pour Atlas.'
              },
              {
                k:'mentor', l:'Coup de pouce mentor', sub:"Sami répond dans ~5 min avec un commentaire écrit.",
                tag:'recommandé · -0 XP', c:'#1B3A5C', primary:true,
                detail:'Ton contexte (5 dernières actions + brouillon en cours) est joint automatiquement.'
              },
              {
                k:'pause', l:'Pause de 5 minutes', sub:"Bois un verre d'eau. Reviens. Ça marche souvent.",
                tag:'aucun coût', c:'#D97706',
                detail:'Ton chrono se met en pause, ton équipe est prévenue, Pixel garde ta place chaude.'
              },
            ].map((o,i)=>(
              <div key={i} style={{
                padding:'18px 18px',borderRadius:14,
                background: o.primary?'#fff':'rgba(255,255,255,0.6)',
                border: `${o.primary?2:1}px solid ${o.primary?o.c:'rgba(154,145,127,0.25)'}`,
                boxShadow: o.primary?`0 18px 32px ${o.c}25`:'0 8px 16px rgba(43,38,30,0.04)',
                display:'flex',flexDirection:'column',gap:10,
                cursor:'pointer',position:'relative',
              }}>
                {o.primary && <div style={{position:'absolute',top:-9,left:14,fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',padding:'3px 8px',background:o.c,color:'#fff',borderRadius:4}}>recommandé</div>}
                <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:20,fontWeight:600,letterSpacing:'-0.01em'}}>{o.l}</div>
                <div style={{fontSize:12,color:'var(--wf-ink-soft)',lineHeight:1.45,minHeight:34}}>{o.sub}</div>
                <div style={{fontSize:11,color:'var(--wf-ink-soft)',padding:'8px 10px',background:`${o.c}08`,borderRadius:7,borderLeft:`2px solid ${o.c}`,lineHeight:1.4,fontStyle:'italic'}}>{o.detail}</div>
                <div className="wf-row" style={{gap:8,marginTop:4}}>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 7px',borderRadius:4,background:`${o.c}15`,color:o.c}}>{o.tag}</span>
                  <span className="wf-grow"/>
                  <span style={{fontSize:14,color:o.c}}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comfort: similar resolved cases */}
        <div className="wf-glass-tint" style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:12}}>
          <div className="wf-kicker">D'autres l'ont vécu · résolu en moyenne en 12 min</div>
          {[
            { team:'Cyrus',  who:'JD',ago:'1h',          q:"Bloqué pareil sur M3.2 · indice mentor a suffi.",          out:'résolu en 8 min' },
            { team:'Helios', who:'IO',ago:'ce matin',    q:"Pause + relecture du brief, repartie avec un angle clair.",out:'résolu en 4 min' },
          ].map((s,i)=>(
            <div key={i} className="wf-row" style={{gap:12,padding:'10px 12px',background:'rgba(255,255,255,0.5)',borderRadius:8}}>
              <div style={{width:26,height:26,borderRadius:6,background:'rgba(27,58,92,0.1)',color:'#1B3A5C',display:'grid',placeItems:'center',fontWeight:700,fontSize:10}}>{s.who}</div>
              <span style={{fontSize:12,fontWeight:600}}>{s.team}</span>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>· il y a {s.ago}</span>
              <span style={{fontSize:12,fontStyle:'italic',color:'var(--wf-ink-soft)',flex:1,fontFamily:'var(--font-heading,Baskervville,serif)'}}>« {s.q} »</span>
              <span style={{fontSize:10,color:'#2E7D32',fontWeight:600}}>✓ {s.out}</span>
            </div>
          ))}
        </div>

        <div className="wf-row" style={{gap:10,fontSize:11,color:'var(--wf-ink-faint)',justifyContent:'center'}}>
          <span>Pas de perte d'XP. Pas de pénalité dans le classement. Demander de l'aide est un mouvement, pas un recul.</span>
        </div>
      </div>
    </FlowShell3>
  );
};

// ============================================================================
// C) PLAYER PROFILE — long-term parcours
// ============================================================================

const PlayerProfile = () => {
  const skills = [
    { l:'Discovery',     v:0.85 },
    { l:'Stratégie',     v:0.70 },
    { l:'Pitch',         v:0.62 },
    { l:'Collaboration', v:0.92 },
    { l:'Exécution',     v:0.55 },
    { l:'Leadership',    v:0.48 },
  ];
  const hacks = [
    { d:'mai 2026',  n:'Hack-Days 26',     team:'Cyrus',   role:'pitcheuse',  rank:'4e/12',  xp:1440, win:false, key:'1ère pitcheuse' },
    { d:'janv 2026', n:'Winter Sprint 26', team:'Boréal',  role:'recherche',  rank:'1er/8',  xp:1820, win:true,  key:'angle utilisateur' },
    { d:'oct 2025',  n:'Hack-Days 25',     team:'Atlas',   role:'spectatrice',rank:'7e/12',  xp:680,  win:false, key:'observatrice' },
  ];
  const badges = [
    { i:'★', l:'Première finale',  c:'#D97706', d:'janv 2026' },
    { i:'☆', l:'Coup de cœur jury',c:'#C44536', d:'janv 2026' },
    { i:'◆', l:'5 entretiens d\'or',c:'#2E7D32', d:'mai 2026' },
    { i:'⌬', l:'Mentor reconnaissant',c:'#1B3A5C',d:'mai 2026' },
    { i:'∞', l:'3 hacks',          c:'rgba(154,145,127,0.7)', d:'mai 2026' },
  ];

  return (
    <FlowShell3>
      <div style={{padding:'40px 32px 60px',maxWidth:1320,margin:'0 auto',display:'flex',flexDirection:'column',gap:32}}>

        {/* Identity hero */}
        <div className="wf-row" style={{gap:24,alignItems:'flex-end'}}>
          <div style={{
            width:120,height:120,borderRadius:'50%',
            background:'linear-gradient(135deg,#D97706 0%,#B45309 100%)',
            color:'#fff',display:'grid',placeItems:'center',
            fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:54,fontWeight:600,
            boxShadow:'0 18px 36px rgba(217,119,6,0.35)',flexShrink:0,
          }}>YA</div>
          <div style={{flex:1}}>
            <div className="wf-kicker">Profil · parcours entrepreneurial</div>
            <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:56,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.02,margin:'4px 0 8px'}}>
              Yasmine A. <em style={{color:'#D97706',fontStyle:'italic',fontSize:32,verticalAlign:'middle',marginLeft:8}}>L4</em>
            </h1>
            <div style={{fontSize:14,color:'var(--wf-ink-soft)',lineHeight:1.5}}>
              EIC depuis octobre 2025 · 3 hacks · spécialité <strong style={{color:'#1B3A5C'}}>Discovery utilisateur</strong>
            </div>
          </div>
          <div className="wf-row" style={{gap:10}}>
            <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.2)',padding:'9px 14px',borderRadius:9,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Partager</button>
            <button style={{background:'#1B3A5C',color:'#fff',border:'none',padding:'9px 14px',borderRadius:9,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Éditer</button>
          </div>
        </div>

        {/* Lifetime stats */}
        <div className="wf-glass" style={{padding:'22px 26px',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:0}}>
          {[
            { v:'3',     l:'hacks',          sub:'depuis 7 mois' },
            { v:'L4',    l:'niveau atteint', sub:'sur 4 paliers' },
            { v:'3 940', l:'XP cumulés',     sub:'~1300 / hack' },
            { v:'1',     l:'victoire',       sub:'finale · janv 26' },
            { v:'7',     l:'mentors',        sub:'rencontrés' },
          ].map((s,i)=>(
            <div key={i} style={{padding:'4px 16px',borderRight:i<4?'1px solid rgba(154,145,127,0.18)':'none'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontSize:34,fontWeight:800,color:'#1B3A5C',letterSpacing:'-0.02em',lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:11,color:'var(--wf-ink-soft)',marginTop:6}}>{s.l}</div>
              <div style={{fontSize:9,color:'var(--wf-ink-faint)',marginTop:2,letterSpacing:'0.04em'}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two cols: skills radar + badges */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          {/* Skills bars */}
          <div className="wf-glass" style={{padding:'22px 26px'}}>
            <div className="wf-kicker">Compétences observées</div>
            <div style={{fontSize:11,color:'var(--wf-ink-faint)',marginTop:4,marginBottom:18}}>Mesurées par les mentors et les jurys, à travers tes 3 hacks</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {skills.map((s,i)=>{
                const top = s.v >= 0.8;
                return (
                  <div key={i}>
                    <div className="wf-row" style={{gap:8,marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600,color:'var(--wf-ink)'}}>{s.l}</span>
                      {top && <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#D97706',padding:'2px 6px',background:'rgba(217,119,6,0.12)',borderRadius:3}}>signature</span>}
                      <span className="wf-grow"/>
                      <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-soft)'}}>{Math.round(s.v*100)}%</span>
                    </div>
                    <div style={{height:6,background:'rgba(154,145,127,0.18)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{width:`${s.v*100}%`,height:'100%',background:top?'linear-gradient(90deg,#D97706,#F59E0B)':'linear-gradient(90deg,#1B3A5C,#22456C)',borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="wf-glass" style={{padding:'22px 26px'}}>
            <div className="wf-row">
              <div className="wf-kicker">Badges débloqués</div>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{badges.length} / 18</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:14}}>
              {badges.map((b,i)=>(
                <div key={i} style={{padding:'14px 12px',borderRadius:10,background:'rgba(255,255,255,0.55)',border:'1px solid rgba(154,145,127,0.22)',display:'flex',flexDirection:'column',alignItems:'center',gap:6,textAlign:'center'}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:`${b.c}15`,border:`1.5px solid ${b.c}`,color:b.c,display:'grid',placeItems:'center',fontSize:18,fontWeight:700}}>{b.i}</div>
                  <div style={{fontSize:11,fontWeight:600,lineHeight:1.3}}>{b.l}</div>
                  <div style={{fontSize:9,color:'var(--wf-ink-faint)'}}>{b.d}</div>
                </div>
              ))}
              {/* 1 placeholder locked */}
              <div style={{padding:'14px 12px',borderRadius:10,background:'rgba(154,145,127,0.05)',border:'1.5px dashed rgba(154,145,127,0.4)',display:'flex',flexDirection:'column',alignItems:'center',gap:6,textAlign:'center'}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:'transparent',border:'1.5px dashed rgba(154,145,127,0.5)',color:'rgba(154,145,127,0.7)',display:'grid',placeItems:'center',fontSize:14}}>?</div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--wf-ink-faint)',lineHeight:1.3}}>Vainqueure de finale</div>
                <div style={{fontSize:9,color:'var(--wf-ink-faint)'}}>verrouillé</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hack history timeline */}
        <div>
          <div className="wf-kicker" style={{marginBottom:12}}>Historique des hacks</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {hacks.map((h,i)=>(
              <div key={i} className="wf-glass" style={{padding:'18px 22px',display:'grid',gridTemplateColumns:'auto 1fr auto auto auto',gap:20,alignItems:'center'}}>
                <div style={{
                  width:48,height:48,borderRadius:10,
                  background:h.win?'linear-gradient(135deg,#D97706 0%,#B45309 100%)':'rgba(27,58,92,0.1)',
                  color:h.win?'#fff':'#1B3A5C',
                  display:'grid',placeItems:'center',
                  fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:20,fontWeight:700,
                  boxShadow:h.win?'0 10px 22px rgba(217,119,6,0.3)':'none',
                }}>{h.team[0]}</div>
                <div>
                  <div className="wf-row" style={{gap:10}}>
                    <h3 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>{h.n}</h3>
                    {h.win && <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#D97706',padding:'3px 8px',background:'rgba(217,119,6,0.12)',borderRadius:4}}>★ vainqueure</span>}
                    <span style={{fontSize:11,color:'var(--wf-ink-faint)'}}>· {h.d}</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:4}}>équipe <strong>{h.team}</strong> · rôle <strong>{h.role}</strong> · <em style={{fontFamily:'var(--font-heading,Baskervville,serif)'}}>« {h.key} »</em></div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--wf-ink-faint)'}}>Classement</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontSize:16,fontWeight:700,color:'var(--wf-ink)',marginTop:2}}>{h.rank}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--wf-ink-faint)'}}>XP</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontSize:16,fontWeight:700,color:'#1B3A5C',marginTop:2}}>{h.xp.toLocaleString('fr-FR')}</div>
                </div>
                <button style={{background:'transparent',border:'1px solid rgba(43,38,30,0.18)',padding:'7px 12px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>Replay →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Mentors rencontrés */}
        <div className="wf-glass-tint" style={{padding:'20px 24px'}}>
          <div className="wf-row" style={{marginBottom:12}}>
            <div className="wf-kicker">Mentors rencontrés · 7</div>
            <span className="wf-grow"/>
            <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>réseau qui se construit hack après hack</span>
          </div>
          <div className="wf-row" style={{gap:14,flexWrap:'wrap'}}>
            {[
              { i:'SK', n:'Sami K.',     when:'mai 2026',   c:'#1B3A5C', last:true },
              { i:'OB', n:'Ouassim B.',  when:'mai 2026',   c:'#2E7D32' },
              { i:'NM', n:'Nada M.',     when:'janv 2026',  c:'#D97706' },
              { i:'TR', n:'Tarik R.',    when:'janv 2026',  c:'#C44536' },
              { i:'IL', n:'Ines L.',     when:'oct 2025',   c:'#1B3A5C' },
              { i:'YH', n:'Yasser H.',   when:'oct 2025',   c:'#2E7D32' },
              { i:'KM', n:'Khadija M.',  when:'oct 2025',   c:'#D97706' },
            ].map((m,i)=>(
              <div key={i} className="wf-row" style={{gap:8,padding:'8px 12px 8px 8px',borderRadius:30,background:'rgba(255,255,255,0.55)',border:`1px solid ${m.last?m.c+'50':'rgba(154,145,127,0.2)'}`}}>
                <div style={{width:26,height:26,borderRadius:'50%',background:m.c,color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:10}}>{m.i}</div>
                <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
                  <span style={{fontSize:11,fontWeight:600}}>{m.n}</span>
                  <span style={{fontSize:9,color:'var(--wf-ink-faint)'}}>{m.when}</span>
                </div>
                {m.last && <span style={{fontSize:8,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:m.c,marginLeft:4}}>actif</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <div className="wf-row" style={{gap:14,padding:'20px 26px',background:'rgba(217,119,6,0.08)',border:'1.5px dashed rgba(217,119,6,0.4)',borderRadius:14}}>
          <div style={{flex:1}}>
            <div className="wf-kicker" style={{color:'#D97706'}}>Prochain hack</div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:22,fontWeight:600,letterSpacing:'-0.01em',marginTop:6}}>Hack‑Days 27 · <em style={{fontStyle:'italic',color:'#D97706'}}>12 juin 2026</em></div>
            <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:4}}>Inscription ouverte jusqu'au 5 juin · 34 places restantes</div>
          </div>
          <button style={{background:'#D97706',color:'#fff',border:'none',padding:'12px 22px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Montserrat,sans-serif',boxShadow:'0 12px 24px rgba(217,119,6,0.35)'}}>M'inscrire →</button>
        </div>

      </div>
    </FlowShell3>
  );
};

Object.assign(window, { PitchPrep, StuckHelp, PlayerProfile });
