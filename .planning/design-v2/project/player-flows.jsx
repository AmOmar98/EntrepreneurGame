// Player flows — Onboarding L0 (1), Mentor↔équipe feedback (2), Révision demandée (4)
// Mid-fi, glass aesthetic, French copy.

const FlowShell = ({ children, bg }) => (
  <div className="wf" style={{background: bg || 'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)'}}>
    <div className="wf-aurora">
      <div className="blob1" style={{top:'-15%',left:'-10%',width:'55%',height:'55%',background:'radial-gradient(circle,rgba(217,119,6,0.10),transparent 60%)'}}/>
      <div className="blob2" style={{bottom:'-20%',right:'-10%',width:'55%',height:'55%',background:'radial-gradient(circle,rgba(27,58,92,0.08),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'hidden'}}>{children}</div>
  </div>
);

// === 1) ONBOARDING L0 — 3 steps =============================================

const OnboardingStep = ({ step=1, total=3, title, kicker, children, primary, secondary }) => (
  <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
    {/* topbar */}
    <div className="wf-row" style={{padding:'18px 28px',gap:14,borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
      <div className="wf-row" style={{gap:10}}>
        <div className="wf-brand-mark" style={{width:30,height:30}}>E</div>
        <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600}}>Entrepreneur Game</div>
      </div>
      <span className="wf-grow"/>
      <div className="wf-row" style={{gap:6}}>
        {Array.from({length:total}).map((_,i)=>(
          <span key={i} style={{
            width: i+1===step ? 28 : 8, height:8, borderRadius:99,
            background: i+1<=step ? '#1B3A5C' : 'rgba(154,145,127,0.3)',
            transition:'width 0.3s',
          }}/>
        ))}
      </div>
      <span style={{fontSize:11,color:'var(--wf-ink-soft)',marginLeft:8}}>Étape {step} / {total}</span>
    </div>

    <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr',padding:'40px 32px',overflow:'auto'}}>
      <div style={{maxWidth:880,width:'100%',margin:'0 auto',display:'flex',flexDirection:'column',gap:24}}>
        <div className="wf-kicker" style={{color:'#D97706'}}>{kicker}</div>
        <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:46,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:0}}>{title}</h1>
        {children}
      </div>
    </div>

    <div className="wf-row" style={{padding:'18px 32px',gap:12,borderTop:'1px solid rgba(154,145,127,0.18)',background:'rgba(255,255,255,0.5)',backdropFilter:'blur(14px)'}}>
      {secondary && <button style={{background:'transparent',color:'var(--wf-ink-soft)',border:'none',padding:'10px 14px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>{secondary}</button>}
      <span className="wf-grow"/>
      <button style={{
        background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',color:'#fff',border:'none',
        padding:'13px 22px',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',
        fontFamily:'Montserrat,sans-serif',letterSpacing:'0.02em',
        boxShadow:'0 12px 26px rgba(27,58,92,0.35)',
        display:'inline-flex',alignItems:'center',gap:8,
      }}>{primary || 'Continuer'} <span>→</span></button>
    </div>
  </div>
);

const OnboardA = () => (
  <FlowShell>
    <OnboardingStep
      step={1} total={3}
      kicker="BIENVENUE"
      title={<>Salut Yasmine. <em style={{color:'#C44536',fontStyle:'italic'}}>Prêt·e à entreprendre ?</em></>}
      primary="C'est parti"
      secondary="Plus tard"
    >
      <p style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:19,lineHeight:1.5,color:'var(--wf-ink-soft)',margin:0,maxWidth:620}}>
        Pendant les 3 prochains jours, tu vas faire passer une idée du brouillon au pitch. 7 niveaux, des missions courtes, un mentor à tes côtés.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginTop:16}}>
        {[
          {n:'7',l:'niveaux',d:'L0 → L7'},
          {n:'24',l:'livrables',d:'~20 min chacun'},
          {n:'1',l:'pitch',d:'le 3e jour, 5 min'},
        ].map((s,i)=>(
          <div key={i} className="wf-glass" style={{padding:'18px 20px'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontSize:42,fontWeight:800,color:'#1B3A5C',letterSpacing:'-0.03em',lineHeight:1}}>{s.n}</div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:16,fontWeight:600,marginTop:4}}>{s.l}</div>
            <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:2}}>{s.d}</div>
          </div>
        ))}
      </div>
      <div className="wf-glass-tint" style={{padding:'14px 18px',marginTop:8,display:'flex',gap:12,alignItems:'center'}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:13,flexShrink:0}}>SK</div>
        <div style={{fontSize:13,color:'var(--wf-ink)'}}>
          <strong>Sami K.</strong> sera ton mentor. Il revient vers toi sous 10 min après chaque livrable.
        </div>
      </div>
    </OnboardingStep>
  </FlowShell>
);

const OnboardB = () => (
  <FlowShell>
    <OnboardingStep
      step={2} total={3}
      kicker="TON ÉQUIPE"
      title={<>Tu rejoins <em style={{color:'#1B3A5C',fontStyle:'italic'}}>Atlas.</em></>}
      primary="Présente‑toi à l'équipe"
      secondary="← Retour"
    >
      <div className="wf-glass" style={{padding:'24px',display:'flex',gap:24,alignItems:'center'}}>
        <div style={{
          width:96,height:96,borderRadius:24,
          background:'linear-gradient(135deg,#1B3A5C,#22456C)',
          color:'#fff',display:'grid',placeItems:'center',
          fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:48,fontWeight:600,
          boxShadow:'0 12px 28px rgba(27,58,92,0.35)',flexShrink:0,
        }}>A</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:30,fontWeight:600,letterSpacing:'-0.015em'}}>Équipe Atlas</div>
          <div style={{fontSize:13,color:'var(--wf-ink-soft)',marginTop:4}}>3 entrepreneurs · idée autour des repas familiaux · mentor : Sami K.</div>
          <div className="wf-row" style={{gap:8,marginTop:14}}>
            {[
              {n:'YA',name:'Yasmine',role:'toi',self:true},
              {n:'SK',name:'Said',role:'engineering'},
              {n:'NB',name:'Naima',role:'design'},
            ].map((m,i)=>(
              <div key={i} className="wf-row" style={{
                gap:8,padding:'6px 10px 6px 6px',
                background:m.self?'rgba(217,119,6,0.12)':'rgba(255,255,255,0.6)',
                border:`1px solid ${m.self?'rgba(217,119,6,0.4)':'rgba(154,145,127,0.3)'}`,
                borderRadius:99,
              }}>
                <div style={{width:26,height:26,borderRadius:'50%',background:m.self?'#D97706':'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontSize:10,fontWeight:700}}>{m.n}</div>
                <div style={{fontSize:11}}><strong>{m.name}</strong> <span style={{color:'var(--wf-ink-soft)'}}>· {m.role}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:8}}>
        <div className="wf-glass" style={{padding:'16px 18px'}}>
          <div className="wf-kicker">Ce que vous partagez</div>
          <ul style={{margin:'8px 0 0',padding:'0 0 0 18px',fontSize:13,color:'var(--wf-ink-soft)',lineHeight:1.6}}>
            <li>L'idée de départ : box repas express pour parents</li>
            <li>Un Slack #atlas dédié (déjà créé)</li>
            <li>Un Drive partagé pour les livrables</li>
          </ul>
        </div>
        <div className="wf-glass" style={{padding:'16px 18px'}}>
          <div className="wf-kicker">Ton rôle pour démarrer</div>
          <div style={{marginTop:8,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:18,fontWeight:600,color:'var(--wf-ink)'}}>Porte‑parole &amp; UX</div>
          <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:4}}>Tu pourras changer de chapeau à chaque niveau.</div>
        </div>
      </div>
    </OnboardingStep>
  </FlowShell>
);

const OnboardC = () => (
  <FlowShell>
    <OnboardingStep
      step={3} total={3}
      kicker="LES RÈGLES — 3 CHOSES À SAVOIR"
      title={<>Comment on <em style={{color:'#2E7D32',fontStyle:'italic'}}>joue.</em></>}
      primary="Démarrer L0 · Idéation"
      secondary="← Retour"
    >
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {[
          {n:'01',t:'Une mission à la fois',d:'L\'écran t\'amène toujours sur la prochaine étape — pas de menu à fouiller. Soumets, attends 10 min, enchaîne.',c:'#1B3A5C'},
          {n:'02',t:'Le mentor est ton allié',d:'Sami répond sur chaque livrable : ✓ validé (+XP), ↻ révision (sans perte d\'XP), 💬 question. Pas de jugement, juste de l\'avancement.',c:'#D97706'},
          {n:'03',t:'XP = élan, pas note',d:'On ne te note pas. Tu gagnes de l\'XP pour célébrer chaque pas. Le pitch final, lui, est noté par le jury.',c:'#2E7D32'},
        ].map((r,i)=>(
          <div key={i} className="wf-glass" style={{padding:'18px 22px',display:'flex',gap:18,alignItems:'flex-start'}}>
            <div style={{
              fontFamily:'var(--font-heading,Baskervville,serif)',
              fontSize:54,fontWeight:600,lineHeight:0.85,
              color:r.c,letterSpacing:'-0.02em',flexShrink:0,minWidth:60,
            }}>{r.n}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:22,fontWeight:600,letterSpacing:'-0.01em'}}>{r.t}</div>
              <div style={{fontSize:13,color:'var(--wf-ink-soft)',marginTop:4,lineHeight:1.5}}>{r.d}</div>
            </div>
          </div>
        ))}
      </div>
    </OnboardingStep>
  </FlowShell>
);

// === 2) MENTOR FEEDBACK THREAD ============================================

const FeedbackHeader = () => (
  <div className="wf-row" style={{padding:'16px 24px',gap:12,borderBottom:'1px solid rgba(154,145,127,0.18)',background:'rgba(255,255,255,0.5)',backdropFilter:'blur(14px)'}}>
    <span style={{fontSize:12,color:'var(--wf-ink-soft)',cursor:'pointer'}}>← Parcours</span>
    <span style={{color:'var(--wf-ink-faint)'}}>·</span>
    <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)'}}>L3 › M3.2</span>
    <h2 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:18,fontWeight:600,letterSpacing:'-0.005em'}}>5 entretiens documentés</h2>
    <span className="wf-grow"/>
    <span className="wf-pill is-amber" style={{fontSize:10}}>● en revue</span>
    <div className="wf-row" style={{gap:6}}>
      <div style={{width:26,height:26,borderRadius:'50%',background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontSize:10,fontWeight:700}}>SK</div>
      <span style={{fontSize:12}}><strong>Sami K.</strong> · ton mentor</span>
    </div>
  </div>
);

// Async comments tied to a link submission (no live chat).

const MentorFeedback = () => {
  const submissions = [
    { v:1, url:'docs.google.com/document/d/1f3k…/entretiens-utilisateurs', type:'Google Docs', icon:'📄', t:'aujourd\'hui · 14:08', current:true, status:'en revue' },
    { v:0, url:'notion.so/team-atlas/pre-recherche-…', type:'Notion', icon:'◼', t:'hier · 18:42', current:false, status:'remplacé' },
  ];

  const comments = [
    { who:'Sami K.', role:'mentor', av:'SK', avBg:'#1B3A5C', t:'14:18', tag:{l:'remarque',c:'#2E7D32'},
      text:"Bien vu sur la charge mentale — c'est ton vrai pivot. Garde cet angle pour le pitch, c'est plus fort que « gain de temps »." },
    { who:'Sami K.', role:'mentor', av:'SK', avBg:'#1B3A5C', t:'14:21', tag:{l:'à corriger',c:'#D97706'},
      text:"Ta synthèse parle de 5 personnes interrogées, mais je n'en vois que 4 documentées dans le doc. Ajoute la 5e fiche et je valide tout de suite." },
    { who:'Yasmine A.', role:'moi', av:'YA', avBg:'#D97706', t:'14:24', tag:null,
      text:"Vu ! Mei est dans mes notes papier, j'ajoute la fiche dans la foulée et je ressoumets le lien." },
  ];

  return (
    <FlowShell>
      <FeedbackHeader/>
      <div style={{padding:'20px 24px',display:'grid',gridTemplateColumns:'1fr 380px',gap:20,height:'calc(100% - 65px)',overflow:'hidden'}}>
        {/* LEFT — the submitted link + history + brief */}
        <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'auto',paddingRight:4}}>
          {/* Brief reminder */}
          <div className="wf-glass-tint" style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:6}}>
            <div className="wf-kicker">Ce qui était demandé</div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:16,lineHeight:1.4,letterSpacing:'-0.005em'}}>
              « Documenter <strong>5 entretiens utilisateurs</strong> (verbatim + profil) et en tirer une synthèse en une phrase. »
            </div>
          </div>

          {/* The current submission — a LINK */}
          <div className="wf-glass" style={{padding:0,overflow:'hidden',border:'1.5px solid rgba(217,119,6,0.35)'}}>
            <div className="wf-row" style={{padding:'10px 16px',borderBottom:'1px solid rgba(154,145,127,0.18)',gap:8,background:'rgba(217,119,6,0.06)'}}>
              <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)',letterSpacing:'0.06em'}}>SOUMISSION ACTUELLE · v1</span>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{submissions[0].t}</span>
            </div>
            <div style={{padding:'18px 20px',display:'flex',gap:14,alignItems:'flex-start'}}>
              <div style={{
                width:48,height:48,borderRadius:10,flexShrink:0,
                background:'linear-gradient(135deg,#4285F4 0%,#1A73E8 100%)',
                color:'#fff',display:'grid',placeItems:'center',fontSize:22,
                boxShadow:'0 6px 14px rgba(26,115,232,0.25)',
              }}>{submissions[0].icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="wf-row" style={{gap:8,marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',color:'#1A73E8'}}>{submissions[0].type}</span>
                  <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>· lien externe</span>
                </div>
                <div className="wf-mono" style={{fontSize:13,color:'var(--wf-ink)',wordBreak:'break-all',lineHeight:1.4}}>
                  {submissions[0].url}
                </div>
                <div style={{fontSize:12,color:'var(--wf-ink-soft)',marginTop:8,fontStyle:'italic',lineHeight:1.45,paddingLeft:10,borderLeft:'2px solid rgba(154,145,127,0.3)'}}>
                  Note jointe · « 4 entretiens documentés + synthèse. Mei à ajouter ce soir. »
                </div>
              </div>
              <button style={{
                background:'#fff',border:'1px solid rgba(43,38,30,0.2)',
                padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:600,
                cursor:'pointer',fontFamily:'Montserrat,sans-serif',
                display:'inline-flex',alignItems:'center',gap:6,flexShrink:0,
              }}>Ouvrir <span style={{fontSize:10}}>↗</span></button>
            </div>
          </div>

          {/* Submission history */}
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div className="wf-kicker" style={{paddingLeft:4}}>Historique des liens soumis</div>
            {submissions.slice(1).map((s,i)=>(
              <div key={i} className="wf-row" style={{
                gap:10,padding:'10px 14px',borderRadius:10,
                background:'rgba(255,255,255,0.4)',
                border:'1px solid rgba(154,145,127,0.2)',
                opacity:0.7,
              }}>
                <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>v{s.v||0}</span>
                <span style={{fontSize:11,color:'var(--wf-ink-soft)'}}>{s.type}</span>
                <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-soft)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.url}</span>
                <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{s.t}</span>
                <span className="wf-pill" style={{fontSize:9,padding:'2px 8px',background:'rgba(154,145,127,0.2)',color:'var(--wf-ink-soft)'}}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — comments tied to the livrable + actions */}
        <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
          <div className="wf-glass" style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10,flex:1,overflow:'hidden'}}>
            <div className="wf-row" style={{gap:8}}>
              <h3 style={{fontSize:14,margin:0}}>Commentaires sur le livrable</h3>
              <span className="wf-grow"/>
              <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{comments.length} · async</span>
            </div>
            <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',gap:12,paddingRight:4}}>
              {comments.map((c,i)=>(
                <div key={i} style={{
                  display:'flex',flexDirection:'column',gap:6,
                  padding:'12px 14px',
                  background: c.role==='mentor' ? '#fff' : 'rgba(217,119,6,0.06)',
                  border:`1px solid ${c.role==='mentor'?'rgba(154,145,127,0.3)':'rgba(217,119,6,0.25)'}`,
                  borderLeft:`3px solid ${c.tag?c.tag.c:c.avBg}`,
                  borderRadius:10,
                }}>
                  <div className="wf-row" style={{gap:8}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:c.avBg,color:'#fff',display:'grid',placeItems:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{c.av}</div>
                    <span style={{fontSize:12,fontWeight:700}}>{c.who}</span>
                    {c.role==='mentor' && <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>· mentor</span>}
                    <span className="wf-grow"/>
                    {c.tag && (
                      <span style={{
                        fontSize:9,fontWeight:700,letterSpacing:'0.06em',
                        textTransform:'uppercase',padding:'2px 8px',borderRadius:4,
                        background:c.tag.c+'18',color:c.tag.c,
                      }}>{c.tag.l}</span>
                    )}
                    <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{c.t}</span>
                  </div>
                  <div style={{fontSize:12.5,lineHeight:1.5,color:'var(--wf-ink)',paddingLeft:30}}>{c.text}</div>
                </div>
              ))}
            </div>
            {/* Async comment composer — not a chat */}
            <div style={{
              border:'1px solid rgba(154,145,127,0.35)',
              borderRadius:12,padding:'10px 12px',
              background:'rgba(255,255,255,0.7)',
              display:'flex',flexDirection:'column',gap:8,
            }}>
              <textarea placeholder="Ajouter un commentaire sur le livrable…" rows={2} style={{border:'none',background:'transparent',outline:'none',fontSize:12,fontFamily:'inherit',resize:'none',lineHeight:1.4}}/>
              <div className="wf-row" style={{gap:6}}>
                <span style={{fontSize:10,color:'var(--wf-ink-faint)'}}>Sami sera notifié</span>
                <span className="wf-grow"/>
                <button style={{background:'transparent',color:'var(--wf-ink-soft)',border:'1px solid rgba(43,38,30,0.18)',padding:'5px 10px',borderRadius:7,fontSize:10,cursor:'pointer'}}>Annuler</button>
                <button style={{background:'#1B3A5C',color:'#fff',border:'none',padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>Publier</button>
              </div>
            </div>
          </div>
          <div className="wf-glass-tint" style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10,borderLeft:'3px solid #D97706'}}>
            <div className="wf-kicker">Action attendue</div>
            <div style={{fontSize:13,color:'var(--wf-ink)',lineHeight:1.45}}>Ajoute Mei dans le doc, puis <strong>ressoumets le lien</strong> (la nouvelle version remplace v1).</div>
            <div style={{
              border:'1.5px dashed rgba(217,119,6,0.45)',borderRadius:10,
              padding:'10px 12px',background:'rgba(255,255,255,0.5)',
              display:'flex',flexDirection:'column',gap:6,
            }}>
              <div className="wf-mono" style={{fontSize:9,color:'var(--wf-ink-faint)',letterSpacing:'0.08em'}}>NOUVEAU LIEN · v2</div>
              <input placeholder="Colle un lien (Doc, Notion, Figma, vidéo, fichier…)" style={{border:'none',background:'transparent',outline:'none',fontSize:11,fontFamily:'var(--font-mono,monospace)',color:'var(--wf-ink)'}}/>
            </div>
            <button style={{background:'linear-gradient(180deg,#3B9D43 0%,#2E7D32 100%)',color:'#fff',border:'none',padding:'10px 14px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Montserrat,sans-serif',boxShadow:'0 8px 18px rgba(46,125,50,0.3)',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8}}>Soumettre v2 <span>→</span></button>
          </div>
        </div>
      </div>
    </FlowShell>
  );
};

// === 4) RÉVISION DEMANDÉE ==================================================

const RevisionRequested = () => (
  <FlowShell bg="linear-gradient(180deg,#FBF1D9 0%,#F4E6C0 60%,#EDE6D6 100%)">
    <div style={{height:'100%',display:'flex',flexDirection:'column',padding:'40px 32px',overflow:'auto'}}>
      <div style={{maxWidth:840,width:'100%',margin:'0 auto',display:'flex',flexDirection:'column',gap:22}}>
        <div className="wf-row" style={{gap:10}}>
          <span className="wf-pill" style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',background:'#D97706',color:'#fff'}}>↻ RÉVISION DEMANDÉE</span>
          <span className="wf-mono" style={{fontSize:11,color:'var(--wf-ink-faint)'}}>L3 · M3.2 · soumis à 14:08</span>
        </div>

        <div>
          <h1 style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:46,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.05,margin:0}}>
            Presque. <em style={{color:'#D97706',fontStyle:'italic'}}>Encore un détail à régler.</em>
          </h1>
          <div style={{fontSize:15,color:'var(--wf-ink-soft)',marginTop:10,maxWidth:640,lineHeight:1.5}}>
            Sami a relu ton livrable. Il manque <strong>un verbatim</strong> pour valider — pas de perte d'XP, c'est juste une boucle courte avant validation.
          </div>
        </div>

        <div className="wf-glass" style={{padding:'20px 24px',display:'flex',gap:16,alignItems:'flex-start',borderLeft:'4px solid #D97706'}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:'#1B3A5C',color:'#fff',display:'grid',placeItems:'center',fontSize:13,fontWeight:700,flexShrink:0}}>SK</div>
          <div style={{flex:1}}>
            <div className="wf-row" style={{gap:8,marginBottom:6}}>
              <strong style={{fontSize:13}}>Sami K.</strong>
              <span style={{fontSize:11,color:'var(--wf-ink-faint)'}}>· 14:21 · 13 min après soumission</span>
            </div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:17,lineHeight:1.5,letterSpacing:'-0.005em'}}>
              « Synthèse solide, l'angle <em>charge mentale</em> est juste — bravo. Mais ta synthèse parle de 5 personnes et il n'y a que 4 fiches. Ajoute Mei et je valide tout de suite. »
            </div>
          </div>
        </div>

        {/* What needs fixing — concrete */}
        <div className="wf-glass" style={{padding:'18px 22px'}}>
          <div className="wf-kicker">À corriger avant de ressoumettre</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
            {[
              {ok:true,  t:'4 verbatim documentés',     d:'Marc, Léa, Karim, Ana'},
              {ok:false, t:'5e verbatim · Mei manquant', d:'Ajoute la fiche, même format'},
              {ok:true,  t:'Synthèse en une phrase',     d:'Charge mentale > budget'},
              {ok:true,  t:'Profils variés',             d:'Âges 28–41, IDF'},
            ].map((c,i)=>(
              <div key={i} className="wf-row" style={{
                gap:10,padding:'10px 12px',
                background:c.ok?'rgba(46,125,50,0.06)':'rgba(217,119,6,0.10)',
                border:`1px solid ${c.ok?'rgba(46,125,50,0.25)':'rgba(217,119,6,0.4)'}`,
                borderRadius:10,
              }}>
                <div style={{
                  width:22,height:22,borderRadius:'50%',flexShrink:0,
                  background:c.ok?'#2E7D32':'#fff',
                  color:c.ok?'#fff':'#D97706',
                  border:c.ok?'none':'1.5px solid #D97706',
                  display:'grid',placeItems:'center',fontSize:11,fontWeight:700,
                }}>{c.ok?'✓':'!'}</div>
                <div style={{flex:1,fontSize:13,color:'var(--wf-ink)'}}>
                  <strong style={{fontWeight:c.ok?500:700}}>{c.t}</strong>
                  <span style={{color:'var(--wf-ink-soft)',marginLeft:8,fontWeight:400}}>· {c.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No XP loss banner */}
        <div className="wf-row" style={{gap:14,padding:'14px 18px',background:'rgba(46,125,50,0.10)',border:'1px solid rgba(46,125,50,0.3)',borderRadius:12}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'#2E7D32',color:'#fff',display:'grid',placeItems:'center',fontWeight:700}}>↺</div>
          <div style={{flex:1,fontSize:13,lineHeight:1.45}}>
            <strong>Aucune perte d'XP.</strong> <span style={{color:'var(--wf-ink-soft)'}}>Une révision ne te ralentit pas — elle muscle ton livrable. Tu gardes ton élan, ton mentor reste avec toi.</span>
          </div>
          <div style={{fontFamily:'Montserrat,sans-serif',fontSize:18,fontWeight:800,color:'#1B3A5C'}}>720 XP</div>
        </div>

        <div className="wf-row" style={{gap:12,marginTop:8,flexWrap:'wrap'}}>
          <button style={{
            background:'transparent',color:'var(--wf-ink)',
            border:'1.5px solid rgba(43,38,30,0.25)',
            padding:'13px 20px',borderRadius:12,fontSize:13,fontWeight:600,
            cursor:'pointer',fontFamily:'Montserrat,sans-serif',
          }}>Voir les commentaires</button>
          <button style={{
            background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',color:'#fff',border:'none',
            padding:'13px 24px',borderRadius:12,fontSize:13,fontWeight:700,
            cursor:'pointer',fontFamily:'Montserrat,sans-serif',
            letterSpacing:'0.02em',boxShadow:'0 12px 28px rgba(27,58,92,0.4)',
            display:'inline-flex',alignItems:'center',gap:10,
          }}>Soumettre un nouveau lien <span style={{
            width:22,height:22,borderRadius:'50%',background:'rgba(255,255,255,0.2)',
            display:'grid',placeItems:'center',fontSize:12,
          }}>→</span></button>
          <span className="wf-grow"/>
          <span style={{fontSize:11,color:'var(--wf-ink-faint)',alignSelf:'center'}}>Délai conseillé · 15 min</span>
        </div>
      </div>
    </div>
  </FlowShell>
);

Object.assign(window, { OnboardA, OnboardB, OnboardC, MentorFeedback, RevisionRequested });
