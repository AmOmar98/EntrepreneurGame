/* global React */
const { useState, useRef, useEffect } = React;

/* ============================================================
   Shared wireframe primitives
   ============================================================ */

// SVG filter that gives sketchy wobble to strokes
window.WobbleFilter = function WobbleFilter() {
  return (
    <svg width="0" height="0" style={{position:'absolute'}} aria-hidden="true">
      <defs>
        <filter id="wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="3"/>
          <feDisplacementMap in="SourceGraphic" scale="1.4"/>
        </filter>
      </defs>
    </svg>
  );
};

// Generic desktop frame with browser chrome + url bar
window.Desk = function Desk({ url = "eic.ma/journey", children, style }) {
  return (
    <div className="desk wf" style={style}>
      <div className="topbar">
        <span className="light" style={{background:'#E27A8E'}}/>
        <span className="light" style={{background:'#C8932E'}}/>
        <span className="light" style={{background:'#4CAF50'}}/>
        <div className="sk-box thin tight" style={{flex:1, height:14, marginLeft:8, padding:'0 8px', display:'flex', alignItems:'center', fontSize:9, color:'var(--sketch-ink-soft)', background:'#fff'}}>{url}</div>
      </div>
      <div style={{flex:1, minHeight:0, overflow:'hidden', position:'relative'}}>{children}</div>
    </div>
  );
};

// Phone shell
window.Phone = function Phone({ children, label }) {
  return (
    <div className="col gap-2 aic" style={{flex:'none'}}>
      <div className="phone">
        <div className="notch"/>
        <div className="screen">{children}</div>
      </div>
      {label && <div className="hand small ink">{label}</div>}
    </div>
  );
};

// Annotation arrow + label
window.Annot = function Annot({ x, y, w = 140, color = "blue", children, arrow = true, dir = "left" }) {
  const colorMap = { blue: 'var(--sketch-blue)', green: 'var(--sketch-green)', pink: 'var(--sketch-pink)' };
  return (
    <div className="annot" style={{ left:x, top:y, width:w, color: colorMap[color] }}>
      {arrow && dir==='left' && <span style={{marginRight:6}}>↜</span>}
      <span>{children}</span>
      {arrow && dir==='right' && <span style={{marginLeft:6}}>↝</span>}
    </div>
  );
};

// Title strip above an artboard's content (inside frame)
window.ScreenHeader = function ScreenHeader({ kicker, title, right }) {
  return (
    <div className="row aic jcb" style={{padding:'10px 16px', borderBottom:'1.2px solid var(--sketch-line)', background:'var(--sketch-paper-2)'}}>
      <div className="col gap-1">
        {kicker && <span className="kicker">{kicker}</span>}
        <h3 style={{margin:0}}>{title}</h3>
      </div>
      {right}
    </div>
  );
};

// Mini logo lockup
window.EICLogo = function EICLogo({ size = 22, white = false }) {
  return (
    <div className="row aic gap-2">
      <div style={{
        width:size, height:size, borderRadius:6,
        border:`1.5px solid ${white?'#fff':'var(--sketch-line)'}`,
        background: white ? 'transparent' : 'var(--sketch-paper-2)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-heading)', fontWeight:700,
        color: white ? '#fff' : 'var(--sketch-blue)',
        fontSize: size*0.5
      }}>E<span style={{color:'var(--sketch-green)'}}>·</span></div>
      <div className="col" style={{lineHeight:1}}>
        <span style={{fontFamily:'var(--font-heading)', fontWeight:700, fontSize:size*0.55, color: white?'#fff':'var(--sketch-blue)'}}>EIC</span>
        <span className="kicker" style={{fontSize:6, letterSpacing:'.18em'}}>Innovation Center</span>
      </div>
    </div>
  );
};

// XP / progress ring
window.Ring = function Ring({ size = 72, value = 0.6, label, sub, color = 'var(--sketch-green)' }) {
  const r = size/2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div style={{position:'relative', width:size, height:size, flex:'none'}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--sketch-faint)" strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={`${c*value} ${c}`} strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}/>
      </svg>
      <div className="col aic jcc" style={{position:'absolute', inset:0, lineHeight:1}}>
        <span style={{fontFamily:'var(--font-heading)', fontWeight:700, fontSize:size*0.28}}>{label}</span>
        {sub && <span style={{fontSize:9, color:'var(--sketch-ink-soft)', marginTop:2}}>{sub}</span>}
      </div>
    </div>
  );
};

// Rationale card shown beneath each artboard via DCArtboard label area
window.Rationale = function Rationale({ children }) {
  return <div className="hand ink small" style={{padding:'4px 0', maxWidth:480, lineHeight:1.2}}>{children}</div>;
};
