// Player Journey — CHARGING BAR (vertical, ascending) on both mobile & desktop
// First view: deliberately simple — one catching CTA.
// Hover a node => floating card with ONE button.
// Click that button => side drawer slides in with deliverables as cards.

const levels = [
  { id:'L0', fr:'Diagnostic',  status:'done',    xp:200, brief:'Auto‑évaluation initiale',
    missions:[
      { code:'M0.1', fr:'Quiz de positionnement', status:'approved', reward:80 },
      { code:'M0.2', fr:'Profil entrepreneur',    status:'approved', reward:120 },
    ]},
  { id:'L1', fr:'Idéation',    status:'done',    xp:240, brief:'Premières pistes',
    missions:[
      { code:'M1.1', fr:'Mur d\'idées (×30)',     status:'approved', reward:80 },
      { code:'M1.2', fr:'Trois pistes shortlist', status:'approved', reward:160 },
    ]},
  { id:'L2', fr:'Problème',    status:'done',    xp:280, brief:'Problème bien posé',
    missions:[
      { code:'M2.1', fr:'Énoncé du problème',     status:'approved', reward:140 },
      { code:'M2.2', fr:'Cible et contexte',      status:'approved', reward:140 },
    ]},
  { id:'L3', fr:'Découverte',  status:'current', xp:120, brief:'Sortir du bâtiment',
    objective:"Valider votre proposition de valeur par 5 entretiens terrain documentés.",
    missions:[
      { code:'M3.1', fr:"Carte d'empathie",                  status:'approved',  reward:80,  hint:'Validé par Sami K.' },
      { code:'M3.2', fr:'5 entretiens documentés',           status:'submitted', reward:120, hint:'En revue · 8 min' },
      { code:'M3.3', fr:'Hypothèse de proposition de valeur',status:'open',      reward:100, due:'15:30', hint:'Reformulez en une phrase.' },
      { code:'M3.4', fr:'Storyboard du parcours client',     status:'locked',    reward:120 },
    ]},
  { id:'L4', fr:'Solution',    status:'locked',  xp:0, brief:'Concevoir la réponse',
    missions:[
      { code:'M4.1', fr:'Fonctionnalités clés',   status:'locked', reward:120 },
      { code:'M4.2', fr:'Esquisse du concept',    status:'locked', reward:140 },
    ]},
  { id:'L5', fr:'Modèle éco.', status:'locked',  xp:0, brief:'Comment ça vit ?',
    missions:[
      { code:'M5.1', fr:'Sources de revenus',     status:'locked', reward:120 },
      { code:'M5.2', fr:'Coûts et marge',         status:'locked', reward:120 },
    ]},
  { id:'L6', fr:'Prototype',   status:'locked',  xp:0, brief:'Un MVP en 2h',
    missions:[
      { code:'M6.1', fr:'Maquette interactive',   status:'locked', reward:160 },
      { code:'M6.2', fr:'Test utilisateur (×3)',  status:'locked', reward:140 },
    ]},
  { id:'L7', fr:'Pitch',       status:'locked',  xp:0, brief:'Convaincre le jury',
    missions:[
      { code:'M7.1', fr:'Deck 5 minutes',         status:'locked', reward:160 },
      { code:'M7.2', fr:'Répétition coachée',     status:'locked', reward:120 },
      { code:'M7.3', fr:'Pitch final',            status:'locked', reward:240 },
    ]},
];

const current = levels.find(l => l.status==='current');
const TOTAL_XP_DONE = levels.filter(l=>l.status==='done').reduce((a,b)=>a+b.xp,0) + current.xp;
const TOTAL_XP_MAX = 2000;

// === Shared chrome =========================================================

const PlayerShell = ({ children }) => (
  <div className="wf" style={{background:'linear-gradient(180deg,#FBF8F2 0%,#F2EDE2 60%,#EDE6D6 100%)'}}>
    <div className="wf-aurora">
      <div className="blob3" style={{top:'-10%',left:'10%',width:'70%',height:'70%',background:'radial-gradient(circle,rgba(27,58,92,0.07),transparent 60%)'}}/>
    </div>
    <div style={{position:'relative',zIndex:1,height:'100%',overflow:'hidden'}}>{children}</div>
  </div>
);

const TopbarLite = ({ team='Atlas' }) => (
  <div className="wf-row" style={{padding:'18px 28px',gap:14}}>
    <div className="wf-row" style={{gap:10}}>
      <div className="wf-brand-mark" style={{width:30,height:30}}>E</div>
      <div className="wf-stack">
        <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600,lineHeight:1}}>Entrepreneur Game</div>
        <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--wf-ink-soft)',marginTop:2}}>Hack‑Days 26</div>
      </div>
    </div>
    <span className="wf-grow"/>
    <div className="wf-row" style={{gap:14}}>
      <div className="wf-pill" style={{fontSize:10,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(12px)'}}>Pitch · 17h00</div>
      <div className="wf-pill is-amber" style={{fontSize:10}}>⏵ Mentor disponible</div>
      <div style={{width:30,height:30,borderRadius:'50%',background:'var(--wf-blue)',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:11}}>YA</div>
    </div>
  </div>
);

// === Vertical charging bar (ascending) =====================================
// Works for both mobile & desktop. Sized via props.

const ChargingBar = ({
  height = 720,
  trackWidth = 14,
  hovered, setHovered, opened, setOpened,
}) => {
  const ordered = [...levels].reverse(); // L7 top → L0 bottom
  const N = ordered.length;
  const currentIdx = ordered.findIndex(l => l.status==='current');
  // progress fills from bottom up to the current level
  const progressPct = ((N-1-currentIdx) / (N-1)) * 100;

  return (
    <div style={{position:'relative',height,width:trackWidth+8,margin:'0 auto'}}>
      {/* track */}
      <div style={{
        position:'absolute',left:'50%',top:18,bottom:18,width:trackWidth,
        transform:'translateX(-50%)',
        background:'rgba(154,145,127,0.22)',
        border:'1px solid rgba(154,145,127,0.35)',
        borderRadius:trackWidth,
        boxShadow:'inset 0 1px 2px rgba(0,0,0,0.06)',
        backdropFilter:'blur(8px)',
      }}/>
      {/* charge fill — animates up */}
      <div style={{
        position:'absolute',left:'50%',bottom:18,width:trackWidth,
        transform:'translateX(-50%)',
        height:`calc((100% - 36px) * ${progressPct/100})`,
        background:'linear-gradient(180deg,#1B3A5C 0%,#2E7D32 60%,#4CAF50 100%)',
        borderRadius:trackWidth,
        boxShadow:'0 0 24px rgba(27,58,92,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}/>
      {/* shimmer cap at the top of charge */}
      <div style={{
        position:'absolute',left:'50%',
        bottom:`calc(18px + (100% - 36px) * ${progressPct/100} - 4px)`,
        width:trackWidth+10,height:10,
        transform:'translateX(-50%)',
        background:'radial-gradient(ellipse,rgba(76,175,80,0.6),transparent 70%)',
        borderRadius:'50%',
      }}/>

      {/* nodes */}
      {ordered.map((l, i) => {
        const top = (i / (N-1)) * (height - 36) + 18;
        const cur = l.status==='current';
        const done = l.status==='done';
        const locked = l.status==='locked';
        const hov = hovered === l.id;
        return (
          <div key={l.id}
            onMouseEnter={()=>setHovered(l.id)}
            onMouseLeave={()=>setHovered(h => h===l.id?null:h)}
            onClick={()=> !locked && setOpened(l.id)}
            style={{
              position:'absolute',left:'50%',top,
              transform:'translate(-50%,-50%)',
              width:cur?34:done?26:24, height:cur?34:done?26:24,
              borderRadius:'50%',
              background:done?'#2E7D32':cur?'#1B3A5C':'rgba(255,255,255,0.95)',
              border:`2.5px solid ${done?'#2E7D32':cur?'#1B3A5C':'#9A917F'}`,
              borderStyle:locked?'dashed':'solid',
              display:'grid',placeItems:'center',
              color:done||cur?'#fff':'var(--wf-ink-soft)',
              fontSize:cur?12:10,fontWeight:700,
              fontFamily:'Montserrat,sans-serif',
              cursor:locked?'not-allowed':'pointer',
              boxShadow:cur
                ? '0 0 0 6px rgba(27,58,92,0.14), 0 6px 18px rgba(27,58,92,0.4)'
                : hov ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
              transition:'transform 0.18s ease, box-shadow 0.18s ease',
              ...(hov && !locked ? {transform:'translate(-50%,-50%) scale(1.15)'} : {}),
              zIndex:hov||cur?5:2,
            }}>
            {done?'✓':l.id.slice(1)}
            {cur && (
              <span style={{
                position:'absolute',inset:-3,borderRadius:'50%',
                border:'2px solid rgba(27,58,92,0.4)',
                animation:'wf-pulse 2s ease-out infinite',
              }}/>
            )}
          </div>
        );
      })}

      {/* top crown */}
      <div style={{
        position:'absolute',left:'50%',top:-2,transform:'translate(-50%,-100%)',
        fontSize:9,letterSpacing:'1.4px',color:'var(--wf-amber)',fontWeight:700,
        whiteSpace:'nowrap',
      }}>▲ PITCH</div>
      <div style={{
        position:'absolute',left:'50%',bottom:-2,transform:'translate(-50%,100%)',
        fontSize:9,letterSpacing:'1.4px',color:'var(--wf-ink-faint)',fontWeight:600,
        whiteSpace:'nowrap',
      }}>DÉPART</div>

      <style>{`@keyframes wf-pulse{0%{transform:scale(1);opacity:0.7}100%{transform:scale(1.6);opacity:0}}`}</style>
    </div>
  );
};

// === Hover card next to a node (desktop) ===================================

const HoverCard = ({ level, side='right', onOpen }) => {
  if (!level) return null;
  const cur = level.status==='current';
  const done = level.status==='done';
  const locked = level.status==='locked';
  return (
    <div className="wf-glass" style={{
      width:280,padding:'16px 18px',
      display:'flex',flexDirection:'column',gap:8,
      boxShadow:'0 16px 40px rgba(27,58,92,0.16), 0 1px 0 rgba(255,255,255,0.9) inset',
      pointerEvents:'auto',
    }}>
      <div className="wf-row" style={{gap:8}}>
        <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{level.id}</span>
        {done && <span className="wf-pill is-green" style={{fontSize:9}}>✓ {level.xp} XP</span>}
        {cur  && <span className="wf-pill is-blue"  style={{fontSize:9}}>EN COURS</span>}
        {locked && <span className="wf-pill" style={{fontSize:9}}>verrouillé</span>}
      </div>
      <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:20,fontWeight:600,lineHeight:1.15,letterSpacing:'-0.005em'}}>{level.fr}</div>
      <div style={{fontSize:12,color:'var(--wf-ink-soft)',lineHeight:1.4}}>{level.brief}</div>
      <div className="wf-row" style={{gap:6,fontSize:10,color:'var(--wf-ink-soft)'}}>
        <span>◇ {level.missions.length} missions</span>
        <span>·</span>
        <span>jusqu'à {level.missions.reduce((a,m)=>a+m.reward,0)} XP</span>
      </div>
      <button
        onClick={(e)=>{e.stopPropagation();onOpen(level.id);}}
        disabled={locked}
        className="wf-btn is-primary"
        style={{marginTop:6,padding:'9px 14px',fontSize:12,letterSpacing:'0.04em',
          opacity:locked?0.5:1,cursor:locked?'not-allowed':'pointer',
          width:'100%',justifyContent:'center'}}>
        {locked ? 'Niveau verrouillé' : done ? 'Revoir les livrables →' : cur ? 'Reprendre la mission →' : 'Découvrir →'}
      </button>
    </div>
  );
};

// === Drawer with deliverable cards =========================================

const statusMeta = {
  approved:  { label:'Validé',     pill:'is-green'  },
  submitted: { label:'En revue',   pill:'is-blue'   },
  open:      { label:'À rendre',   pill:'is-amber'  },
  locked:    { label:'Verrouillé', pill:''          },
};

const DeliverableCard = ({ m }) => {
  const s = statusMeta[m.status];
  const locked = m.status==='locked';
  return (
    <div style={{
      background: locked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)',
      backdropFilter:'blur(14px) saturate(140%)',
      border:'1px solid rgba(255,255,255,0.7)',
      borderRadius:14,padding:'14px 16px',
      display:'flex',flexDirection:'column',gap:8,
      boxShadow:'0 6px 20px rgba(43,38,30,0.08)',
      opacity:locked?0.55:1,
    }}>
      <div className="wf-row" style={{gap:8}}>
        <span className="wf-mono" style={{fontSize:10,color:'var(--wf-ink-faint)'}}>{m.code}</span>
        <span className="wf-grow"/>
        <span className={`wf-pill ${s.pill}`} style={{fontSize:9}}>{s.label}</span>
      </div>
      <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:15,fontWeight:600,lineHeight:1.25}}>{m.fr}</div>
      {m.hint && <div style={{fontSize:11,color:'var(--wf-ink-soft)'}}>{m.hint}</div>}
      <div className="wf-row" style={{gap:6,fontSize:10,color:'var(--wf-ink-soft)',marginTop:2}}>
        <span>+{m.reward} XP</span>
        {m.due && <><span>·</span><span>échéance {m.due}</span></>}
      </div>
      {!locked && (
        <div className="wf-row" style={{marginTop:4}}>
          <span className="wf-grow"/>
          <span className={`wf-btn ${m.status==='open'?'is-primary':''}`} style={{padding:'6px 12px',fontSize:11}}>
            {m.status==='approved' ? 'Voir' : m.status==='submitted' ? 'Suivre' : 'Soumettre →'}
          </span>
        </div>
      )}
    </div>
  );
};

const Drawer = ({ levelId, onClose, anchor='right' }) => {
  const level = levels.find(l => l.id===levelId);
  if (!level) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position:'absolute',inset:0,background:'rgba(43,38,30,0.18)',
        backdropFilter:'blur(2px)',zIndex:20,
      }}/>
      <div style={{
        position:'absolute',top:0,bottom:0,[anchor]:0,
        width:420,maxWidth:'95%',
        background:'rgba(251,248,242,0.92)',
        backdropFilter:'blur(24px) saturate(160%)',
        WebkitBackdropFilter:'blur(24px) saturate(160%)',
        borderLeft:anchor==='right'?'1px solid rgba(154,145,127,0.25)':'none',
        borderRight:anchor==='left'?'1px solid rgba(154,145,127,0.25)':'none',
        boxShadow:anchor==='right'?'-20px 0 60px rgba(43,38,30,0.18)':'20px 0 60px rgba(43,38,30,0.18)',
        zIndex:21,
        display:'flex',flexDirection:'column',
        animation:`wf-slide-${anchor} 0.32s cubic-bezier(.2,.8,.2,1)`,
      }}>
        <div className="wf-row" style={{padding:'20px 24px 14px',gap:12,borderBottom:'1px solid rgba(154,145,127,0.18)'}}>
          <div style={{
            width:44,height:44,borderRadius:12,
            background:level.status==='done'?'#2E7D32':level.status==='current'?'#1B3A5C':'rgba(154,145,127,0.3)',
            color:'#fff',display:'grid',placeItems:'center',
            fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:18,fontWeight:700,
          }}>{level.id}</div>
          <div className="wf-grow">
            <div className="wf-kicker">Niveau · livrables</div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:20,fontWeight:600,lineHeight:1.15}}>{level.fr}</div>
          </div>
          <button onClick={onClose} style={{
            width:32,height:32,border:'none',background:'rgba(255,255,255,0.6)',borderRadius:'50%',
            cursor:'pointer',fontSize:16,color:'var(--wf-ink-soft)',
          }}>✕</button>
        </div>

        {level.objective && (
          <div style={{padding:'14px 24px 0'}}>
            <div className="wf-glass-tint" style={{padding:'12px 14px'}}>
              <div className="wf-kicker" style={{marginBottom:4}}>Objectif</div>
              <div style={{fontSize:13,lineHeight:1.4}}>{level.objective}</div>
            </div>
          </div>
        )}

        <div style={{padding:'16px 24px',display:'flex',flexDirection:'column',gap:10,overflow:'auto'}}>
          <div className="wf-kicker" style={{marginBottom:2}}>Livrables principaux</div>
          {level.missions.map(m => <DeliverableCard key={m.code} m={m}/>)}
        </div>

        <style>{`
          @keyframes wf-slide-right{from{transform:translateX(100%)}to{transform:translateX(0)}}
          @keyframes wf-slide-left {from{transform:translateX(-100%)}to{transform:translateX(0)}}
        `}</style>
      </div>
    </>
  );
};

// === Hero CTA — first‑screen, deliberately simple ==========================

const HeroCTA = ({ onAction, compact=false }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:compact?14:22,maxWidth:480}}>
    <div className="wf-pill is-blue" style={{fontSize:10,letterSpacing:'0.12em'}}>⏵ NIVEAU 3 · DÉCOUVERTE</div>
    <div>
      <div style={{
        fontFamily:'var(--font-heading,Baskervville,serif)',
        fontSize:compact?28:44,fontWeight:600,lineHeight:1.05,
        letterSpacing:'-0.015em',color:'var(--wf-ink)',
      }}>
        Reprenez là<br/>où vous vous êtes <em style={{color:'var(--wf-amber)',fontStyle:'italic'}}>arrêté.</em>
      </div>
      <div style={{fontSize:compact?13:15,color:'var(--wf-ink-soft)',marginTop:compact?8:14,lineHeight:1.5,maxWidth:380}}>
        Une mission vous attend : poser votre hypothèse de proposition de valeur en une phrase.
      </div>
    </div>
    <button
      onClick={onAction}
      style={{
        background:'linear-gradient(180deg,#22456C 0%,#1B3A5C 100%)',
        color:'#fff',border:'none',
        padding:compact?'14px 22px':'18px 30px',
        borderRadius:compact?14:18,
        fontSize:compact?14:17,fontWeight:600,
        fontFamily:'Montserrat,sans-serif',
        letterSpacing:'0.02em',
        cursor:'pointer',
        boxShadow:'0 12px 32px rgba(27,58,92,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
        display:'inline-flex',alignItems:'center',gap:12,
      }}>
      Reprendre la mission
      <span style={{
        width:compact?22:28,height:compact?22:28,borderRadius:'50%',
        background:'rgba(255,255,255,0.2)',display:'grid',placeItems:'center',fontSize:compact?12:14,
      }}>→</span>
    </button>
    <div className="wf-row" style={{gap:8,fontSize:11,color:'var(--wf-ink-soft)',marginTop:-4}}>
      <span>◇ M3.3</span><span>·</span><span>+100 XP</span><span>·</span><span>échéance 15:30</span>
    </div>
  </div>
);

// === DESKTOP ===============================================================

const PlayerMetroDesktop = () => {
  const [hovered, setHovered] = React.useState(null);
  const [opened, setOpened]   = React.useState(null);
  const hoveredLevel = hovered ? levels.find(l => l.id===hovered) : null;
  const ordered = [...levels].reverse();
  const hovIdx = hoveredLevel ? ordered.findIndex(l => l.id===hovered) : -1;

  // Hover card vertical position (mirrors the node's y on the bar)
  const BAR_HEIGHT = 720;
  const hovTop = hovIdx >= 0 ? (hovIdx / (ordered.length-1)) * (BAR_HEIGHT - 36) + 18 : 0;

  return (
    <PlayerShell>
      <TopbarLite/>

      <div style={{
        display:'grid',gridTemplateColumns:'1.1fr 80px 1fr',
        padding:'10px 64px 40px',gap:0,alignItems:'center',
        height:'calc(100% - 70px)',position:'relative',
      }}>
        {/* LEFT — hero CTA, deliberately simple */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:48,height:'100%'}}>
          <HeroCTA onAction={()=>setOpened('L3')}/>
        </div>

        {/* CENTER — vertical charging bar */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',position:'relative'}}>
          <ChargingBar
            height={BAR_HEIGHT}
            trackWidth={16}
            hovered={hovered} setHovered={setHovered}
            opened={opened}   setOpened={setOpened}
          />
        </div>

        {/* RIGHT — hover card surfaces here */}
        <div style={{position:'relative',height:'100%',paddingLeft:36}}>
          {hoveredLevel && (
            <div style={{
              position:'absolute',
              top:hovTop + 24, // align with center bar's top offset
              left:36,
              animation:'wf-fade-in 0.18s ease',
              transform:'translateY(-50%)',
            }}>
              <HoverCard level={hoveredLevel} onOpen={(id)=>setOpened(id)}/>
            </div>
          )}
          {!hoveredLevel && (
            <div style={{position:'absolute',top:'50%',left:36,transform:'translateY(-50%)',
              maxWidth:280,opacity:0.55}}>
              <div className="wf-kicker" style={{marginBottom:6}}>Astuce</div>
              <div style={{fontSize:12,color:'var(--wf-ink-soft)',lineHeight:1.5}}>
                Survolez un niveau de la barre pour le voir.<br/>
                Cliquez pour ouvrir ses livrables.
              </div>
            </div>
          )}
        </div>

        {/* progress label, bottom */}
        <div style={{position:'absolute',left:64,bottom:18,fontSize:10,letterSpacing:'0.14em',color:'var(--wf-ink-faint)'}}>
          PROGRESSION · {TOTAL_XP_DONE} / {TOTAL_XP_MAX} XP · 3 niveaux franchis
        </div>
      </div>

      {opened && <Drawer levelId={opened} onClose={()=>setOpened(null)} anchor="right"/>}
      <style>{`@keyframes wf-fade-in{from{opacity:0;transform:translate(-6px,-50%)}to{opacity:1;transform:translateY(-50%)}}`}</style>
    </PlayerShell>
  );
};

// === MOBILE ================================================================

const MobileStatus = () => (
  <div className="wf-mobile-status" style={{background:'transparent',borderBottom:'none',color:'var(--wf-ink)'}}>
    <span>14:32</span>
    <span style={{display:'flex',gap:4}}><span>●●●</span><span>4G</span><span>▮▮▮▯</span></span>
  </div>
);

const PlayerMetroMobile = () => {
  const [opened, setOpened] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);

  return (
    <PlayerShell>
      <MobileStatus/>

      <div style={{padding:'4px 18px 14px',display:'flex',flexDirection:'column',gap:8}}>
        <div className="wf-row" style={{gap:10}}>
          <div className="wf-brand-mark" style={{width:24,height:24,fontSize:14}}>E</div>
          <div className="wf-grow">
            <div style={{fontSize:11,fontWeight:700}}>Atlas · L3 Découverte</div>
            <div style={{fontSize:9,color:'var(--wf-ink-soft)',marginTop:2}}>{TOTAL_XP_DONE} XP · pitch 17h00</div>
          </div>
          <div style={{width:26,height:26,borderRadius:'50%',background:'var(--wf-blue)',color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:10}}>YA</div>
        </div>
      </div>

      {/* Center: charging bar with current-level CTA card next to it */}
      <div style={{padding:'4px 16px',display:'grid',gridTemplateColumns:'48px 1fr',gap:14,alignItems:'stretch'}}>
        <ChargingBar
          height={560}
          trackWidth={14}
          hovered={hovered} setHovered={setHovered}
          opened={opened}   setOpened={setOpened}
        />
        <div style={{display:'flex',alignItems:'center'}}>
          <HeroCTA onAction={()=>setOpened('L3')} compact/>
        </div>
      </div>

      <div style={{padding:'12px 18px 24px',fontSize:10,letterSpacing:'0.14em',color:'var(--wf-ink-faint)',textAlign:'center'}}>
        TAPEZ UN NIVEAU POUR OUVRIR SES LIVRABLES
      </div>

      {opened && <Drawer levelId={opened} onClose={()=>setOpened(null)} anchor="right"/>}
    </PlayerShell>
  );
};

Object.assign(window, {
  PlayerMetroDesktop, PlayerMetroMobile,
});
