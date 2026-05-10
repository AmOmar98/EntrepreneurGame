/* global React, useTime, useSprite, Sprite, Easing, interpolate, animate, clamp */
const { useState, useEffect, useRef } = React;

/* ============================================================
   Spot helpers — brand chrome, devices, mascot, type primitives
   ============================================================ */

// Brand palette (lifted from eic-tokens.css)
const BRAND = {
  ivory:   '#F6F1E8',
  ivory2:  '#FBF8F2',
  ink:     '#14243D',
  blue:    '#1B3A5C',
  blueL:   '#2A5A8C',
  green:   '#2E7D32',
  greenL:  '#4CAF50',
  red:     '#C44536',
  amber:   '#D97706',
  muted:   '#617084',
  mutedSt: '#44556C',
  border:  '#D8D0C2',
  surface: '#FFFFFF',
};
window.BRAND = BRAND;

const FONT_HEAD = "'Baskervville', Baskerville, Georgia, serif";
const FONT_BODY = "'Montserrat', system-ui, sans-serif";
const FONT_MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";
window.FONT_HEAD = FONT_HEAD;
window.FONT_BODY = FONT_BODY;
window.FONT_MONO = FONT_MONO;

/* ── Letterbox bars (cinematic 2.39:1 over 16:9) ─────────────── */
window.Letterbox = function Letterbox({ height = 84, color = '#0a0a0a' }) {
  return (
    <>
      <div style={{position:'absolute',left:0,right:0,top:0,height,background:color,zIndex:50}}/>
      <div style={{position:'absolute',left:0,right:0,bottom:0,height,background:color,zIndex:50}}/>
    </>
  );
};

/* ── Kicker (small uppercase tracking) ─────────────────────── */
window.Kicker = function Kicker({ text, color = BRAND.green, size = 16, x, y, opacity = 1, align = 'left' }) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div style={{
      position:'absolute', left:x, top:y,
      transform:`translateX(${tx})`,
      fontFamily: FONT_BODY, fontWeight: 800,
      fontSize: size, letterSpacing: '0.22em',
      textTransform: 'uppercase', color, opacity,
      whiteSpace: 'nowrap',
    }}>{text}</div>
  );
};

/* ── Brand mark E· ───────────────────────────────────────── */
window.BrandE = function BrandE({ size = 80, color = BRAND.blue, dot = BRAND.green }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.18,
      background: 'transparent',
      border: `${Math.max(2, size*0.04)}px solid ${color}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily: FONT_HEAD, fontWeight: 700,
      color, fontSize: size * 0.55,
      letterSpacing: '-0.02em',
    }}>
      E<span style={{color: dot, fontSize: size * 0.5, marginLeft:1}}>·</span>
    </div>
  );
};

/* ── EIC official wordmark ────────────────────────────────── */
window.EICLogo = function EICLogo({ size = 80, color = BRAND.blue, dot = BRAND.green, withTagline = false }) {
  // size = letter cap height in px
  const letterSize = size;
  const dotSize = size * 0.22;
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap: size * 0.08}}>
      <div style={{
        display:'flex', alignItems:'baseline',
        fontFamily: FONT_HEAD, fontWeight: 700,
        color, fontSize: letterSize, lineHeight: 1,
        letterSpacing: '-0.04em',
      }}>
        <span>EIC</span>
        <span style={{
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: dot, marginLeft: size * 0.12, alignSelf:'center',
          display:'inline-block',
        }}/>
      </div>
      {withTagline && (
        <div style={{
          fontFamily: FONT_BODY, fontSize: size * 0.16, fontWeight: 600,
          letterSpacing: '0.22em', color, opacity: 0.7,
          textTransform:'uppercase',
        }}>
          Euromed Innovation Center
        </div>
      )}
    </div>
  );
};

/* ── Big serif headline that animates word-by-word ─────────── */
window.SerifHeadline = function SerifHeadline({
  words = [],          // array of { text, italic?, color? }
  x, y, size = 200, lineHeight = 0.95,
  align = 'left',
  staggerStart = 0,    // s
  staggerStep = 0.18,  // s between words
  exitAt = null,       // local time to start exit
  exitDur = 0.4,
  baseColor = BRAND.ink,
}) {
  const { localTime } = useSprite();
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';

  return (
    <div style={{
      position:'absolute', left:x, top:y,
      transform:`translateX(${tx})`,
      fontFamily: FONT_HEAD,
      fontSize: size,
      lineHeight,
      letterSpacing: '-0.025em',
      color: baseColor,
      whiteSpace: 'pre',
      display:'flex', flexWrap:'wrap', gap: '0 0.28em',
      maxWidth: 1700,
      justifyContent: align === 'center' ? 'center' : 'flex-start',
    }}>
      {words.map((w, i) => {
        const start = staggerStart + i * staggerStep;
        const t = clamp((localTime - start) / 0.55, 0, 1);
        const eased = Easing.easeOutCubic(t);
        let exitT = 0;
        if (exitAt != null && localTime > exitAt) {
          exitT = clamp((localTime - exitAt) / exitDur, 0, 1);
        }
        const op = eased * (1 - exitT);
        const ty = (1 - eased) * 0.35 * size + (Easing.easeInCubic(exitT)) * -0.12 * size;
        const blur = (1 - eased) * 8;
        return (
          <span key={i} style={{
            display:'inline-block',
            opacity: op,
            transform: `translateY(${ty}px)`,
            filter: blur > 0.3 ? `blur(${blur}px)` : 'none',
            color: w.color || 'inherit',
            fontStyle: w.italic ? 'italic' : 'normal',
            fontWeight: w.weight || 600,
            willChange: 'transform, opacity, filter',
          }}>{w.text}</span>
        );
      })}
    </div>
  );
};

/* ── Wipe background (full-screen color flash/wipe) ────────── */
window.WipeBg = function WipeBg({ color, dir = 'right', dur = 0.5, holdAfter = false }) {
  const { localTime, duration } = useSprite();
  const t = clamp(localTime / dur, 0, 1);
  const eased = Easing.easeInOutCubic(t);
  let style = { background: color };
  if (dir === 'right')      style.clipPath = `inset(0 ${100 - eased*100}% 0 0)`;
  else if (dir === 'left')  style.clipPath = `inset(0 0 0 ${100 - eased*100}%)`;
  else if (dir === 'up')    style.clipPath = `inset(${100 - eased*100}% 0 0 0)`;
  else if (dir === 'down')  style.clipPath = `inset(0 0 ${100 - eased*100}% 0)`;
  else if (dir === 'iris')  style.clipPath = `circle(${eased*100}% at 50% 50%)`;
  if (!holdAfter && localTime > dur + 0.05) return null;
  return <div style={{position:'absolute',inset:0,...style,zIndex:5}}/>;
};

/* ── Dot grid backdrop ──────────────────────────────────── */
window.DotGrid = function DotGrid({ color = '#14243D', opacity = 0.06, gap = 28 }) {
  return (
    <div style={{
      position:'absolute', inset:0, opacity,
      backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.4px)`,
      backgroundSize: `${gap}px ${gap}px`,
      pointerEvents: 'none',
    }}/>
  );
};

/* ── Phone shell ────────────────────────────────────────── */
window.PhoneShell = function PhoneShell({ x, y, w = 360, scale = 1, children, rotate = 0, opacity = 1 }) {
  const h = w * 2.05;
  return (
    <div style={{
      position:'absolute', left:x, top:y,
      width: w, height: h,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      transformOrigin: 'center',
      opacity,
      borderRadius: w * 0.13,
      background: '#0d0d0d',
      padding: w * 0.025,
      boxShadow: '0 30px 80px rgba(20,30,55,0.28), 0 12px 24px rgba(20,30,55,0.18)',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: w * 0.105,
        background: BRAND.ivory2,
        overflow: 'hidden', position:'relative',
      }}>
        {children}
      </div>
    </div>
  );
};

/* ── Browser shell ─────────────────────────────────────── */
window.BrowserShell = function BrowserShell({ x, y, w = 1100, h = 700, scale = 1, children, opacity = 1 }) {
  return (
    <div style={{
      position:'absolute', left:x, top:y,
      width: w, height: h,
      transform: `scale(${scale})`, transformOrigin: 'center',
      opacity,
      borderRadius: 18,
      background: '#fff',
      boxShadow: '0 40px 100px rgba(20,30,55,0.22), 0 14px 30px rgba(20,30,55,0.12)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 38, background: '#EFEAE0',
        display:'flex', alignItems:'center', gap: 8, padding: '0 16px',
        borderBottom: '1px solid '+BRAND.border,
      }}>
        <span style={{width:11,height:11,borderRadius:6,background:'#E27A8E'}}/>
        <span style={{width:11,height:11,borderRadius:6,background:'#C8932E'}}/>
        <span style={{width:11,height:11,borderRadius:6,background:'#4CAF50'}}/>
        <div style={{
          flex:1, marginLeft:14, height: 22, borderRadius: 6,
          background: '#fff', border: '1px solid '+BRAND.border,
          display:'flex', alignItems:'center', padding:'0 10px',
          fontFamily: FONT_MONO, fontSize: 11, color: BRAND.muted,
        }}>eic.ma/journey</div>
      </div>
      <div style={{position:'relative', width:'100%', height: h - 38, overflow:'hidden'}}>
        {children}
      </div>
    </div>
  );
};

/* ── Confetti burst ─────────────────────────────────────── */
window.Confetti = function Confetti({ count = 60, originX = 960, originY = 540, palette = [BRAND.green, BRAND.blue, BRAND.amber, BRAND.red] }) {
  const { localTime, duration } = useSprite();
  const pieces = React.useMemo(() => {
    return Array.from({length: count}, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280 / 233280;
      const seed2 = ((i+13) * 9301 + 49297) % 233280 / 233280;
      const seed3 = ((i+47) * 9301 + 49297) % 233280 / 233280;
      const angle = (seed * Math.PI * 2);
      const dist = 300 + seed2 * 700;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 200,
        rot: seed3 * 720 - 360,
        color: palette[i % palette.length],
        size: 6 + seed2 * 10,
        delay: seed * 0.15,
      };
    });
  }, [count]);

  return (
    <div style={{position:'absolute', left:0, top:0, right:0, bottom:0, pointerEvents:'none', zIndex: 20}}>
      {pieces.map((p, i) => {
        const t = clamp((localTime - p.delay) / 1.6, 0, 1);
        const eased = Easing.easeOutCubic(t);
        const grav = t * t * 600;
        const x = originX + p.dx * eased;
        const y = originY + p.dy * eased + grav;
        const op = t < 0.2 ? t/0.2 : 1 - clamp((t - 0.7)/0.3, 0, 1);
        return (
          <div key={i} style={{
            position:'absolute', left: x, top: y,
            width: p.size, height: p.size * 0.4,
            background: p.color,
            transform: `rotate(${p.rot * t}deg)`,
            opacity: op,
            borderRadius: 1,
          }}/>
        );
      })}
    </div>
  );
};

/* ── Pixel mascot — simplified silhouette ──────────────────── */
window.PixelDog = function PixelDog({ size = 280 }) {
  const w = size, h = size * 1.05;
  return (
    <svg width={w} height={h} viewBox="0 0 200 210" style={{display:'block', filter:'drop-shadow(0 22px 26px rgba(43,38,30,0.22))'}}>
      <defs>
        <radialGradient id="pdFur" cx="0.45" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#FFFFFF"/>
          <stop offset="0.55" stopColor="#FAF6EC"/>
          <stop offset="1" stopColor="#E8DEC9"/>
        </radialGradient>
        <radialGradient id="pdShade" cx="0.5" cy="0.85" r="0.6">
          <stop offset="0" stopColor="#C9BEA3" stopOpacity="0.35"/>
          <stop offset="1" stopColor="#C9BEA3" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="pdEye" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#5a4a3c"/>
          <stop offset="1" stopColor="#0e0a08"/>
        </radialGradient>
        <radialGradient id="pdNose" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#5a5258"/>
          <stop offset="1" stopColor="#0e0c11"/>
        </radialGradient>
      </defs>
      {/* body */}
      <path d="M40 200 Q50 170 70 165 Q100 160 130 165 Q150 170 160 200 Z" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="56" cy="198" rx="14" ry="8" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="144" cy="198" rx="14" ry="8" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.2"/>
      {/* ears */}
      <path d="M48 70 Q30 90 32 130 Q42 142 60 138 Q66 110 70 88 Z" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.4"/>
      <path d="M152 70 Q170 90 168 130 Q158 142 140 138 Q134 110 130 88 Z" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.4"/>
      {/* head */}
      <ellipse cx="100" cy="100" rx="58" ry="54" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.6"/>
      <ellipse cx="100" cy="120" rx="56" ry="36" fill="url(#pdShade)"/>
      {/* eyes */}
      <ellipse cx="80" cy="100" rx="5.2" ry="6" fill="url(#pdEye)"/>
      <ellipse cx="120" cy="100" rx="5.2" ry="6" fill="url(#pdEye)"/>
      <circle cx="81.6" cy="98" r="1.6" fill="#fff" opacity="0.95"/>
      <circle cx="121.6" cy="98" r="1.6" fill="#fff" opacity="0.95"/>
      {/* muzzle */}
      <ellipse cx="100" cy="126" rx="22" ry="16" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.2"/>
      <ellipse cx="100" cy="118" rx="7.5" ry="5.6" fill="url(#pdNose)"/>
      <path d="M100 124 L100 132" stroke="#3a322d" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M100 132 Q92 138 84 134" stroke="#3a322d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M100 132 Q108 138 116 134" stroke="#3a322d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M95 134 Q100 140 105 134 Q103 138 100 138 Q97 138 95 134 Z" fill="#E58CA0" stroke="#C2728A" strokeWidth="0.6"/>
      {/* tuft */}
      <ellipse cx="100" cy="56" rx="20" ry="14" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.4"/>
      <circle cx="92" cy="50" r="6" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.1"/>
      <circle cx="105" cy="46" r="7" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.1"/>
      <circle cx="113" cy="52" r="5" fill="url(#pdFur)" stroke="#B4A88C" strokeWidth="1.1"/>
    </svg>
  );
};
