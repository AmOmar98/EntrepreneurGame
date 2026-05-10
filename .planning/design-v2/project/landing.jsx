/* global React */
// Landing page — simple. Three role doors: Player, Mentor, GameMaster.

// === Petit chien mascotte (réutilisé du composant DogMascot, statique) ====
const LandingDog = ({ size=180 }) => {
  const w = size, h = size*1.05;
  return (
    <svg width={w} height={h} viewBox="0 0 200 210" style={{display:'block',filter:'drop-shadow(0 18px 22px rgba(43,38,30,0.22))'}}>
      <defs>
        <radialGradient id="ldFurBase" cx="0.45" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#FFFFFF"/>
          <stop offset="0.55" stopColor="#FAF6EC"/>
          <stop offset="1" stopColor="#E8DEC9"/>
        </radialGradient>
        <radialGradient id="ldFurShade" cx="0.5" cy="0.85" r="0.6">
          <stop offset="0" stopColor="#C9BEA3" stopOpacity="0.35"/>
          <stop offset="1" stopColor="#C9BEA3" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="ldEyeGlint" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#5a4a3c"/>
          <stop offset="0.6" stopColor="#2B221C"/>
          <stop offset="1" stopColor="#0e0a08"/>
        </radialGradient>
        <radialGradient id="ldNoseShade" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#5a5258"/>
          <stop offset="0.7" stopColor="#2B262E"/>
          <stop offset="1" stopColor="#0e0c11"/>
        </radialGradient>
        <radialGradient id="ldEarInner" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#F4D5C8"/>
          <stop offset="1" stopColor="#D9A99A"/>
        </radialGradient>
      </defs>
      {/* corps */}
      <path d="M40 200 Q50 170 70 165 Q100 160 130 165 Q150 170 160 200 Z" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="56" cy="198" rx="14" ry="8" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="49" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
      <ellipse cx="56" cy="202" rx="2.2" ry="2.8" fill="#3a322d"/>
      <ellipse cx="63" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
      <ellipse cx="144" cy="198" rx="14" ry="8" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="137" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
      <ellipse cx="144" cy="202" rx="2.2" ry="2.8" fill="#3a322d"/>
      <ellipse cx="151" cy="200" rx="2.2" ry="2.8" fill="#3a322d"/>
      {/* oreilles */}
      <path d="M48 70 Q30 90 32 130 Q42 142 60 138 Q66 110 70 88 Z" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.4"/>
      <path d="M52 80 Q42 96 44 122 Q52 130 60 128" fill="url(#ldEarInner)" opacity="0.55"/>
      <path d="M152 70 Q170 90 168 130 Q158 142 140 138 Q134 110 130 88 Z" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.4"/>
      <path d="M148 80 Q158 96 156 122 Q148 130 140 128" fill="url(#ldEarInner)" opacity="0.55"/>
      {/* tête */}
      <ellipse cx="100" cy="100" rx="58" ry="54" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.6"/>
      <ellipse cx="100" cy="120" rx="56" ry="36" fill="url(#ldFurShade)"/>
      <path d="M44 96 Q42 78 56 70 Q68 62 80 64 Q90 50 100 52 Q112 50 120 64 Q132 62 144 70 Q158 78 156 96 Q160 116 152 132 Q156 150 138 154 Q120 162 100 158 Q80 162 62 154 Q44 150 48 132 Q40 116 44 96 Z"
            fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.4" opacity="0.85"/>
      {/* yeux */}
      <ellipse cx="80" cy="100" rx="5.2" ry="6" fill="url(#ldEyeGlint)"/>
      <ellipse cx="120" cy="100" rx="5.2" ry="6" fill="url(#ldEyeGlint)"/>
      <circle cx="81.6" cy="98" r="1.6" fill="#fff" opacity="0.95"/>
      <circle cx="121.6" cy="98" r="1.6" fill="#fff" opacity="0.95"/>
      {/* museau */}
      <ellipse cx="100" cy="126" rx="22" ry="16" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="100" cy="132" rx="20" ry="10" fill="url(#ldFurShade)"/>
      {/* truffe */}
      <ellipse cx="100" cy="118" rx="7.5" ry="5.6" fill="url(#ldNoseShade)"/>
      <ellipse cx="97" cy="115.5" rx="2.1" ry="1.4" fill="#7a6e76" opacity="0.7"/>
      <ellipse cx="97.5" cy="120" rx="0.9" ry="1.4" fill="#0a070a"/>
      <ellipse cx="102.5" cy="120" rx="0.9" ry="1.4" fill="#0a070a"/>
      {/* bouche */}
      <path d="M100 124 L100 132" stroke="#3a322d" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M100 132 Q92 138 84 134" stroke="#3a322d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M100 132 Q108 138 116 134" stroke="#3a322d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M95 134 Q100 140 105 134 Q103 138 100 138 Q97 138 95 134 Z" fill="#E58CA0" stroke="#C2728A" strokeWidth="0.6"/>
      {/* houppette */}
      <ellipse cx="100" cy="56" rx="20" ry="14" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.4"/>
      <circle cx="92" cy="50" r="6" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.1"/>
      <circle cx="105" cy="46" r="7" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.1"/>
      <circle cx="113" cy="52" r="5" fill="url(#ldFurBase)" stroke="#B4A88C" strokeWidth="1.1"/>
    </svg>
  );
};

const Landing = () => {
  const roles = [
    {
      k:'player', kicker:'Joueur', title:'Je joue.',
      desc:"Rejoindre mon équipe, traverser les niveaux, pitcher.",
      c:'#1B3A5C', bg:'#1B3A5C', cta:'Entrer',
    },
    {
      k:'mentor', kicker:'Mentor', title:'J\'accompagne.',
      desc:"Relire les livrables, commenter, valider.",
      c:'#2E7D32', bg:'#2E7D32', cta:'Entrer',
    },
    {
      k:'gm', kicker:'Maître du jeu', title:'J\'orchestre.',
      desc:"Lancer, modérer, animer, remettre les prix.",
      c:'#C44536', bg:'#C44536', cta:'Entrer',
    },
  ];

  return (
    <div className="wf" style={{
      position:'relative',
      height:'100%',overflow:'auto',
      background:`
        radial-gradient(circle at 18% 12%, rgba(46,125,50,0.18) 0%, transparent 42%),
        radial-gradient(circle at 86% 8%, rgba(217,119,6,0.16) 0%, transparent 38%),
        radial-gradient(circle at 78% 88%, rgba(27,58,92,0.18) 0%, transparent 45%),
        radial-gradient(circle at 8% 78%, rgba(196,69,54,0.12) 0%, transparent 40%),
        linear-gradient(180deg,#F6F1E2 0%,#FBF8F2 35%,#F2EDDD 100%)
      `,
    }}>
      {/* Texture motif feuilles AgreenTech — discret, en fond */}
      <svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07,pointerEvents:'none'}}>
        <defs>
          <pattern id="agLeafPattern" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
            <path d="M30 70 Q30 40 60 30 Q60 60 30 70 Z" fill="#2E7D32"/>
            <path d="M60 30 L30 70" stroke="#1B3A5C" strokeWidth="0.8" fill="none"/>
            <circle cx="92" cy="92" r="2" fill="#1B3A5C"/>
            <path d="M88 68 Q98 64 102 74" stroke="#2E7D32" strokeWidth="1" fill="none"/>
          </pattern>
        </defs>
        <rect width="1200" height="900" fill="url(#agLeafPattern)"/>
      </svg>

      {/* Halos de couleur derrière le hero, façon "champ au lever du jour" */}
      <div style={{position:'absolute',top:-120,left:'50%',transform:'translateX(-50%)',width:900,height:600,pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(217,119,6,0.18) 0%, transparent 65%)',filter:'blur(8px)'}}/>

      {/* Lignes de relief (collines stylisées) en bas */}
      <svg viewBox="0 0 1280 240" preserveAspectRatio="none" style={{position:'absolute',left:0,right:0,bottom:0,width:'100%',height:240,pointerEvents:'none',opacity:0.55}}>
        <path d="M0 180 Q200 130 420 160 T820 150 T1280 170 L1280 240 L0 240 Z" fill="rgba(46,125,50,0.10)"/>
        <path d="M0 200 Q220 170 480 190 T900 180 T1280 200 L1280 240 L0 240 Z" fill="rgba(27,58,92,0.10)"/>
        <path d="M0 220 Q240 200 520 215 T960 210 T1280 220 L1280 240 L0 240 Z" fill="rgba(43,38,30,0.08)"/>
      </svg>

      <div style={{position:'relative'}}>
        {/* Top bar */}
        <div className="wf-row" style={{padding:'22px 40px',gap:14}}>
          <div className="wf-row" style={{gap:12}}>
            <div className="wf-brand-mark" style={{width:30,height:30}}>E</div>
            <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:14,fontWeight:600}}>Entrepreneur Game</div>
          </div>
          <span className="wf-grow"/>
          <span className="wf-pill is-green" style={{fontSize:10,fontWeight:700,letterSpacing:'0.08em'}}>● ÉDITION AGREENTECH</span>
          <a href="#" style={{fontSize:12,color:'var(--wf-ink-soft)',textDecoration:'none'}}>À propos</a>
          <a href="#" style={{fontSize:12,color:'var(--wf-ink-soft)',textDecoration:'none'}}>Aide</a>
        </div>

        {/* Hero */}
        <div style={{padding:'70px 40px 40px',maxWidth:1100,margin:'0 auto',position:'relative'}}>
          <div className="wf-kicker" style={{color:'#2E7D32'}}>AgreenTech · 12 mai 2026 · UEMF Innovation Center</div>
          <h1 style={{
            fontFamily:'var(--font-heading,Baskervville,serif)',
            fontSize:92,fontWeight:600,letterSpacing:'-0.035em',lineHeight:1,
            margin:'14px 0 22px',
          }}>
            L'entrepreneuriat <em style={{color:'#D97706',fontStyle:'italic'}}>se joue.</em>
          </h1>
          <div style={{fontSize:17,color:'var(--wf-ink-soft)',lineHeight:1.55,maxWidth:560}}>
            Une journée. Trois rôles. <strong style={{color:'#2E7D32'}}>Une mascotte</strong> qui veille au grain.<br/>Choisis le tien.
          </div>

          {/* Mascotte le chien — assise à droite du hero, fond ambiant */}
          <div style={{position:'absolute',right:24,top:-18,display:'flex',flexDirection:'column',alignItems:'center',gap:10,pointerEvents:'none'}}>
            {/* tapis sous le chien */}
            <div style={{
              position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',
              width:200,height:24,borderRadius:'50%',
              background:'radial-gradient(ellipse at center, rgba(43,38,30,0.18) 0%, transparent 70%)',
              filter:'blur(2px)',zIndex:0,
            }}/>
            {/* bulle */}
            <div style={{
              background:'#fff',border:'1px solid rgba(154,145,127,0.35)',
              borderRadius:14,padding:'10px 14px',fontSize:12,color:'var(--wf-ink)',fontWeight:500,
              boxShadow:'0 14px 30px rgba(43,38,30,0.16)',position:'relative',maxWidth:220,zIndex:2,
              fontFamily:'var(--font-heading,Baskervville,serif)',fontStyle:'italic',
            }}>
              « Bienvenue. On t'attendait. »
              <div style={{
                position:'absolute',bottom:-6,left:32,
                width:12,height:12,background:'#fff',transform:'rotate(45deg)',
                borderRight:'1px solid rgba(154,145,127,0.35)',
                borderBottom:'1px solid rgba(154,145,127,0.35)',
              }}/>
            </div>
            <div style={{position:'relative',zIndex:1,animation:'landingDogBob 4.2s ease-in-out infinite'}}>
              <LandingDog size={200}/>
            </div>
            <div style={{fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--wf-ink-faint)',fontWeight:700,marginTop:-4,zIndex:2,position:'relative'}}>
              Pixel · la mascotte
            </div>
          </div>
        </div>

        {/* Three doors */}
        <div style={{padding:'0 40px 60px',maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {roles.map(r=>(
              <a key={r.k} href="#" style={{
                background:'rgba(255,255,255,0.85)',
                backdropFilter:'blur(14px)',
                border:'1px solid rgba(154,145,127,0.3)',
                borderRadius:14,padding:'28px 26px',
                display:'flex',flexDirection:'column',gap:18,
                textDecoration:'none',color:'inherit',
                cursor:'pointer',transition:'border-color 0.15s',
                boxShadow:'0 14px 30px rgba(43,38,30,0.06)',
              }}>
                <div style={{width:36,height:36,borderRadius:8,background:r.bg}}/>
                <div>
                  <div style={{fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:r.c,fontWeight:700}}>{r.kicker}</div>
                  <h2 style={{margin:'10px 0 8px',fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:32,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1}}>{r.title}</h2>
                  <div style={{fontSize:13,color:'var(--wf-ink-soft)',lineHeight:1.5}}>{r.desc}</div>
                </div>
                <div className="wf-row" style={{gap:8,marginTop:'auto',paddingTop:14,borderTop:'1px solid rgba(154,145,127,0.18)',color:r.c,fontSize:13,fontWeight:600,fontFamily:'Montserrat,sans-serif'}}>
                  {r.cta} <span className="wf-grow"/> <span>→</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'24px 40px 40px',maxWidth:1100,margin:'0 auto',borderTop:'1px solid rgba(154,145,127,0.25)'}}>
          <div className="wf-row" style={{gap:14,fontSize:11,color:'var(--wf-ink-faint)'}}>
            <span>EIC · UEMF Innovation Center · AgreenTech 2026</span>
            <span className="wf-grow"/>
            <a href="#" style={{color:'inherit',textDecoration:'none'}}>CGU</a>
            <a href="#" style={{color:'inherit',textDecoration:'none'}}>Contact</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes landingDogBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
};

// === Login screens (one per role) — simplified =============================

const LoginShell = ({ accent, kicker, title, sub, formLabel='Identifiant', placeholderId='prenom.nom@uemf.ma' }) => (
  <div className="wf" style={{background:'#FBF8F2',height:'100%'}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',height:'100%'}}>
      {/* Left — color panel */}
      <div style={{
        background:accent.bg,
        padding:'40px',display:'flex',flexDirection:'column',justifyContent:'space-between',
      }}>
        <div className="wf-row" style={{gap:10}}>
          <div style={{width:30,height:30,borderRadius:6,background:'rgba(255,255,255,0.18)',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-heading,Baskervville,serif)',fontWeight:700,fontSize:14}}>E</div>
          <div style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(255,255,255,0.85)',fontWeight:700}}>Entrepreneur Game</div>
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(255,255,255,0.7)',fontWeight:700,marginBottom:14}}>{kicker}</div>
          <h1 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:56,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.02,color:'#fff'}}>{title}</h1>
          <div style={{fontFamily:'var(--font-heading,Baskervville,serif)',fontStyle:'italic',fontSize:16,color:'rgba(255,255,255,0.8)',marginTop:18,maxWidth:380,lineHeight:1.45}}>« {sub} »</div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.55)'}}>EIC · UEMF</div>
      </div>

      {/* Right — form */}
      <div style={{padding:'60px 60px',display:'flex',flexDirection:'column',justifyContent:'center',gap:20,maxWidth:480,margin:'0 auto',width:'100%'}}>
        <a href="#" style={{fontSize:11,color:'var(--wf-ink-soft)',textDecoration:'none'}}>← retour</a>
        <h2 style={{margin:0,fontFamily:'var(--font-heading,Baskervville,serif)',fontSize:30,fontWeight:600,letterSpacing:'-0.02em'}}>Se connecter</h2>

        <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
          <div>
            <label style={{fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--wf-ink-soft)',fontWeight:600}}>{formLabel}</label>
            <input defaultValue={placeholderId} style={{width:'100%',marginTop:6,padding:'12px 14px',border:'1px solid rgba(154,145,127,0.4)',borderRadius:9,fontSize:13,fontFamily:'inherit',outline:'none',background:'#fff',boxSizing:'border-box'}}/>
          </div>
          <div>
            <div className="wf-row">
              <label style={{fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--wf-ink-soft)',fontWeight:600}}>Mot de passe</label>
              <span className="wf-grow"/>
              <a href="#" style={{fontSize:10,color:accent.c,textDecoration:'none',fontWeight:600}}>Oublié ?</a>
            </div>
            <input type="password" defaultValue="••••••••••" style={{width:'100%',marginTop:6,padding:'12px 14px',border:'1px solid rgba(154,145,127,0.4)',borderRadius:9,fontSize:13,fontFamily:'inherit',outline:'none',background:'#fff',boxSizing:'border-box'}}/>
          </div>

          <button style={{
            background:accent.bg,color:'#fff',border:'none',
            padding:'13px 18px',borderRadius:9,marginTop:6,
            fontSize:13,fontWeight:700,cursor:'pointer',
            fontFamily:'Montserrat,sans-serif',
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:10,
          }}>Entrer <span>→</span></button>

          <div className="wf-row" style={{gap:10,margin:'4px 0',fontSize:11,color:'var(--wf-ink-faint)'}}>
            <span style={{flex:1,height:1,background:'rgba(154,145,127,0.3)'}}/>
            <span>ou</span>
            <span style={{flex:1,height:1,background:'rgba(154,145,127,0.3)'}}/>
          </div>
          <button style={{background:'#fff',color:'var(--wf-ink)',border:'1px solid rgba(154,145,127,0.4)',padding:'12px 16px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Montserrat,sans-serif'}}>
            Continuer avec UEMF SSO
          </button>
        </div>

        <div style={{fontSize:10,color:'var(--wf-ink-faint)',textAlign:'center',marginTop:14}}>
          <a href="#" style={{color:'inherit'}}>CGU</a> · <a href="#" style={{color:'inherit'}}>confidentialité</a>
        </div>
      </div>
    </div>
  </div>
);

const LoginPlayer = () => (
  <LoginShell
    accent={{ c:'#1B3A5C', bg:'#1B3A5C' }}
    kicker="Joueur"
    title={<span>Le terrain<br/>t'attend.</span>}
    sub="Tu n'es pas seule."
  />
);

const LoginMentor = () => (
  <LoginShell
    accent={{ c:'#2E7D32', bg:'#2E7D32' }}
    kicker="Mentor"
    title={<span>Trois équipes<br/>t'attendent.</span>}
    sub="Tes commentaires changeront leur trajectoire."
    formLabel="Email mentor"
    placeholderId="sami.kessab@externe.fr"
  />
);

const LoginGM = () => (
  <LoginShell
    accent={{ c:'#C44536', bg:'#C44536' }}
    kicker="Maître du jeu"
    title={<span>La régie<br/>se réveille.</span>}
    sub="12 équipes, 47 joueurs, une journée à orchestrer."
  />
);

Object.assign(window, { Landing, LoginPlayer, LoginMentor, LoginGM });
