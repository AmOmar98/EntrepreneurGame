/* global React, BRAND, FONT_HEAD, FONT_BODY, FONT_MONO */

/* ============================================================
   Mock UI screens — pulled from wireframe vocabulary
   Each screen renders inside a PhoneShell or BrowserShell
   ============================================================ */

/* ── Player phone: mission card ───────────────────────────── */
window.MissionCard = function MissionCard({ progress = 0 }) {
  // progress 0..1 controls reveal of inner elements
  return (
    <div style={{
      width:'100%', height:'100%',
      background: BRAND.ivory2,
      display:'flex', flexDirection:'column',
      fontFamily: FONT_BODY, color: BRAND.ink,
    }}>
      {/* status */}
      <div style={{height:18, display:'flex', justifyContent:'space-between', padding:'4px 18px', fontSize:9, color:BRAND.muted}}>
        <span>9:41</span><span>● ● ●</span>
      </div>
      {/* header bar */}
      <div style={{padding:'14px 18px 10px', borderBottom:'1px solid '+BRAND.border}}>
        <div style={{fontSize:8, letterSpacing:'0.18em', color:BRAND.green, fontWeight:800}}>NIVEAU 02 · MISSION</div>
        <div style={{fontFamily:FONT_HEAD, fontSize:22, fontWeight:600, marginTop:4, lineHeight:1.05, letterSpacing:'-0.02em'}}>
          Define the<br/><em style={{color:BRAND.amber}}>real</em> problem.
        </div>
      </div>
      {/* timer + xp */}
      <div style={{padding:'12px 18px', display:'flex', gap:14, alignItems:'center'}}>
        <div style={{fontFamily:FONT_MONO, fontSize:24, fontWeight:600, color:BRAND.blue, opacity: progress > 0.1 ? 1 : 0}}>
          {Math.max(0, Math.floor(45 - progress * 8))}:{String(Math.floor(60 - progress * 30)).padStart(2,'0')}
        </div>
        <div style={{flex:1, height:6, background:BRAND.border, borderRadius:3, overflow:'hidden'}}>
          <div style={{width:`${30 + progress*55}%`, height:'100%', background:BRAND.green, transition:'width .3s'}}/>
        </div>
      </div>
      {/* checklist */}
      <div style={{padding:'4px 18px', display:'flex', flexDirection:'column', gap:8}}>
        {[
          {t:'Interview 3 farmers', d:0.15, done:true},
          {t:'Map the pain points', d:0.35, done:true},
          {t:'Pick a hypothesis', d:0.55, done:false},
          {t:'Submit your brief', d:0.78, done:false},
        ].map((c,i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 12px', background:'#fff',
            border:'1px solid '+BRAND.border, borderRadius:10,
            opacity: progress > c.d ? 1 : 0,
            transform: `translateX(${progress > c.d ? 0 : 10}px)`,
            transition: 'all .3s',
          }}>
            <div style={{
              width:16, height:16, borderRadius:9,
              border:`1.5px solid ${c.done ? BRAND.green : BRAND.muted}`,
              background: c.done ? BRAND.green : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:9,
            }}>{c.done ? '✓' : ''}</div>
            <span style={{fontSize:11, fontWeight:500, textDecoration: c.done ? 'line-through' : 'none', color: c.done ? BRAND.muted : BRAND.ink}}>{c.t}</span>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div style={{flex:1}}/>
      <div style={{padding:'14px 18px', opacity: progress > 0.85 ? 1 : 0.4}}>
        <div style={{
          background: BRAND.blue, color:'#fff',
          padding:'12px 14px', borderRadius:10,
          textAlign:'center', fontWeight:700, fontSize:12,
        }}>Submit brief →</div>
      </div>
    </div>
  );
};

/* ── Mentor view: feedback / comments ─────────────────────── */
window.MentorReview = function MentorReview({ progress = 0 }) {
  const comments = [
    {team:'Team Olive', m:'Promising but the customer is fuzzy.', d:0.15, hi:false},
    {team:'Team Argan', m:'Strong insight on water cycles.',     d:0.35, hi:true},
    {team:'Team Saffron', m:'Pivot away from B2C — too crowded.', d:0.55, hi:false},
  ];
  return (
    <div style={{
      width:'100%', height:'100%',
      background:'#fff',
      fontFamily: FONT_BODY, color: BRAND.ink,
      display:'flex', flexDirection:'column',
    }}>
      <div style={{padding:'18px 26px', borderBottom:'1px solid '+BRAND.border, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div style={{fontSize:10, letterSpacing:'0.18em', color:BRAND.green, fontWeight:800}}>MENTOR · REVIEW</div>
          <div style={{fontFamily:FONT_HEAD, fontSize:26, fontWeight:600, marginTop:4, letterSpacing:'-0.02em'}}>3 teams · 12 deliverables</div>
        </div>
        <div style={{
          background: BRAND.green, color:'#fff', borderRadius:8,
          padding:'6px 12px', fontSize:11, fontWeight:700,
        }}>● live</div>
      </div>
      <div style={{padding:'18px 26px', display:'flex', flexDirection:'column', gap:14}}>
        {comments.map((c,i) => (
          <div key={i} style={{
            display:'flex', gap:14, alignItems:'flex-start',
            opacity: progress > c.d ? 1 : 0,
            transform: `translateY(${progress > c.d ? 0 : 12}px)`,
            transition: 'all .35s',
          }}>
            <div style={{
              width:34, height:34, borderRadius:18,
              background: c.hi ? BRAND.green : '#E9E1D2',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily: FONT_HEAD, fontWeight:700, fontSize:13,
            }}>{c.team.split(' ')[1][0]}</div>
            <div style={{flex:1, padding:'12px 16px', background: c.hi ? '#F0F8F0' : '#FAF7EF', borderRadius:10, border:`1px solid ${c.hi ? BRAND.greenL : BRAND.border}`}}>
              <div style={{fontSize:11, fontWeight:700, color: c.hi ? BRAND.green : BRAND.mutedSt, marginBottom:4}}>{c.team}</div>
              <div style={{fontSize:13, fontFamily: FONT_HEAD, fontStyle: c.hi ? 'italic' : 'normal', color:BRAND.ink}}>« {c.m} »</div>
              {c.hi && (
                <div style={{display:'flex', gap:6, marginTop:8}}>
                  <span style={{fontSize:9, padding:'3px 8px', background:BRAND.green, color:'#fff', borderRadius:10, fontWeight:700, letterSpacing:'0.06em'}}>VALIDATED</span>
                  <span style={{fontSize:9, padding:'3px 8px', background:'#fff', color:BRAND.green, borderRadius:10, fontWeight:700, letterSpacing:'0.06em', border:'1px solid '+BRAND.green}}>+15 XP</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── GM dashboard: leaderboard + clock ────────────────────── */
window.GMDashboard = function GMDashboard({ progress = 0 }) {
  const teams = [
    {n:'Argan',   s:485, d:0.15},
    {n:'Olive',   s:472, d:0.30},
    {n:'Saffron', s:458, d:0.45},
    {n:'Cedar',   s:441, d:0.60},
    {n:'Date',    s:418, d:0.72},
  ];
  return (
    <div style={{
      width:'100%', height:'100%',
      background:'#0F1A2A', color:'#F6F1E8',
      fontFamily: FONT_BODY,
      display:'flex', flexDirection:'column',
    }}>
      <div style={{padding:'18px 26px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div style={{fontSize:10, letterSpacing:'0.18em', color:BRAND.red, fontWeight:800}}>GAMEMASTER · LIVE</div>
          <div style={{fontFamily:FONT_HEAD, fontSize:26, fontWeight:600, marginTop:4, letterSpacing:'-0.02em'}}>The day, in numbers.</div>
        </div>
        <div style={{fontFamily:FONT_MONO, fontSize:34, fontWeight:600, color: BRAND.amber}}>
          {String(2 + Math.floor(progress*2)).padStart(2,'0')}:{String(Math.floor((progress * 60) % 60)).padStart(2,'0')}:{String(Math.floor((progress * 3600) % 60)).padStart(2,'0')}
        </div>
      </div>
      <div style={{padding:'18px 26px', display:'flex', gap:18}}>
        <Stat label="Teams" v={12} prog={progress} d={0.1}/>
        <Stat label="Players" v={47} prog={progress} d={0.2}/>
        <Stat label="Submissions" v={Math.floor(28 + progress*7)} prog={progress} d={0.3}/>
        <Stat label="On time" v={`${Math.floor(82 + progress*10)}%`} prog={progress} d={0.4}/>
      </div>
      <div style={{padding:'10px 26px 0', fontSize:10, letterSpacing:'0.18em', color:'rgba(246,241,232,0.5)', fontWeight:700}}>RANKING</div>
      <div style={{padding:'10px 26px', display:'flex', flexDirection:'column', gap:8}}>
        {teams.map((t,i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8,
            border: i === 0 ? `1px solid ${BRAND.amber}` : '1px solid rgba(255,255,255,0.06)',
            opacity: progress > t.d ? 1 : 0,
            transform: `translateX(${progress > t.d ? 0 : -10}px)`,
            transition: 'all .35s',
          }}>
            <div style={{fontFamily:FONT_HEAD, fontWeight:700, fontSize:18, color: i===0 ? BRAND.amber : 'rgba(246,241,232,0.7)', width:24}}>{i+1}</div>
            <div style={{flex:1, fontFamily:FONT_HEAD, fontSize:18, fontWeight:600, letterSpacing:'-0.01em'}}>Team {t.n}</div>
            <div style={{
              width: 200, height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden',
            }}>
              <div style={{width: `${(t.s/500)*100}%`, height:'100%', background: i===0 ? BRAND.amber : BRAND.greenL}}/>
            </div>
            <div style={{fontFamily:FONT_MONO, fontSize:14, fontWeight:600, width:48, textAlign:'right'}}>{t.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ label, v, prog, d }) => (
  <div style={{
    flex:1, padding:'12px 14px',
    background:'rgba(255,255,255,0.04)',
    borderRadius:8,
    opacity: prog > d ? 1 : 0, transform: `translateY(${prog > d ? 0 : 6}px)`, transition: 'all .35s',
  }}>
    <div style={{fontSize:10, letterSpacing:'0.16em', color:'rgba(246,241,232,0.5)', fontWeight:700}}>{label.toUpperCase()}</div>
    <div style={{fontFamily:FONT_HEAD, fontSize:32, fontWeight:600, marginTop:2, letterSpacing:'-0.02em'}}>{v}</div>
  </div>
);

/* ── Pitch screen: countdown + room ─────────────────────── */
window.PitchScreen = function PitchScreen({ progress = 0 }) {
  const sec = Math.max(0, Math.floor(300 - progress * 300));
  const m = Math.floor(sec / 60), s = sec % 60;
  return (
    <div style={{
      width:'100%', height:'100%', background: '#0a1422', color:'#F6F1E8',
      fontFamily: FONT_BODY,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute', top:24, left:32, fontSize:11, letterSpacing:'0.22em', color:BRAND.amber, fontWeight:800}}>PITCH · STAGE</div>
      <div style={{position:'absolute', top:24, right:32, display:'flex', alignItems:'center', gap:8, fontSize:11, color:'rgba(246,241,232,0.6)'}}>
        <span style={{width:8,height:8,borderRadius:4,background:BRAND.red}}/> LIVE
      </div>
      <div style={{fontSize:11, letterSpacing:'0.22em', color:'rgba(246,241,232,0.5)', fontWeight:700, marginBottom:18}}>TEAM ARGAN · 03 of 12</div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 220, fontWeight: 500,
        letterSpacing: '-0.04em', lineHeight: 1,
        color: m === 0 && s < 30 ? BRAND.amber : '#F6F1E8',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {m}:{String(s).padStart(2,'0')}
      </div>
      <div style={{fontSize:14, color:'rgba(246,241,232,0.6)', marginTop:14, letterSpacing:'0.04em'}}>five minutes to convince the room.</div>
      {/* audience dots */}
      <div style={{position:'absolute', bottom:30, left:0, right:0, display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap', maxWidth:'80%', margin:'0 auto'}}>
        {Array.from({length:48}).map((_,i) => (
          <div key={i} style={{
            width:10, height:10, borderRadius:5,
            background: i % 7 === 0 ? BRAND.green : 'rgba(246,241,232,0.18)',
            opacity: progress > i / 60 ? 1 : 0.3,
            transition:'opacity .2s',
          }}/>
        ))}
      </div>
    </div>
  );
};
