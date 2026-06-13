import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Leaderboard from './pages/Leaderboard.jsx'
import Matches from './pages/Matches.jsx'
import Predict from './pages/Predict.jsx'
import Rules from './pages/Rules.jsx'
import Stats from './pages/Stats.jsx'
import Bracket from './pages/Bracket.jsx'
import Profile from './pages/Profile.jsx'
import HeadToHead from './pages/HeadToHead.jsx'
import Quiz from './pages/Quiz.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import NavBadge from './components/NavBadge.jsx'

function NavIcon({ name }) {
  const icons = {
    trophy:  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2h12v6a6 6 0 01-12 0V2zM6 8H3a2 2 0 000 4h3M18 8h3a2 2 0 010 4h-3M12 14v4M8 18h8"/></svg>,
    calendar:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M3 10h18M8 2v2M16 2v2"/></svg>,
    edit:    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-4-9l4 4L10 18H6v-4L17 3z"/></svg>,
    chart:   <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    rules:   <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    cog:     <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>,
    grid:    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  }
  return <span style={{width:22,height:22,display:'block'}}>{icons[name]}</span>
}

const MAIN_NAV = [
  { to:'/',         end:true, label:'Leaderboard', icon:'trophy'   },
  { to:'/kampe',             label:'Kampe',        icon:'calendar' },
  { to:'/gaet',              label:'Mine gæt',     icon:'edit'     },
  { to:'/statistik',         label:'Statistik',    icon:'chart'    },
]

const MORE_ITEMS = [
  { to:'/quiz',       label:'⚽ VM Quiz',         desc:'Test din VM-viden' },
  { to:'/h2h',        label:'⚔️ Head-to-Head',    desc:'Sammenlign to deltagere' },
  { to:'/bracket',    label:'🏆 Knockout Bracket', desc:'Se turneringsbraketten' },
  { to:'/regler',     label:'📋 Regler & Point',   desc:'Pointsystem og regler' },
]

function MoreMenu({ onClose }) {
  const navigate = useNavigate()
  const isAdmin = !!localStorage.getItem('admin_token')
  function go(to) { navigate(to); onClose() }

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      {/* Backdrop */}
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)'}} onClick={onClose}/>
      {/* Sheet */}
      <div style={{position:'relative',background:'var(--bg)',borderRadius:'16px 16px 0 0',padding:'1rem',paddingBottom:'calc(1rem + env(safe-area-inset-bottom))'}}>
        <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 1rem'}}/>
        <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,letterSpacing:.5,textTransform:'uppercase',marginBottom:8,padding:'0 4px'}}>Mere</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          {MORE_ITEMS.map(item => (
            <button key={item.to} onClick={()=>go(item.to)}
              style={{padding:'12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,textAlign:'left',cursor:'pointer',fontFamily:'inherit'}}>
              <div style={{fontWeight:600,fontSize:14,color:'var(--text)',marginBottom:2}}>{item.label}</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>{item.desc}</div>
            </button>
          ))}
        </div>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:10}}>
          <button onClick={()=>go(isAdmin?'/admin':'/admin/login')}
            style={{width:'100%',padding:'10px',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontFamily:'inherit',color:'var(--text2)',fontSize:14}}>
            <NavIcon name="cog"/>
            {isAdmin ? 'Admin panel' : 'Admin login'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const isAdmin = !!localStorage.getItem('admin_token')
  const navigate = useNavigate()
  const location = useLocation()
  const [showMore, setShowMore] = useState(false)
  function logout() { localStorage.removeItem('admin_token'); navigate('/'); window.location.reload() }

  const moreActive = MORE_ITEMS.some(i => location.pathname === i.to) || location.pathname.startsWith('/admin')

  return (
    <>
      <nav className="top-nav">
        <div className="top-nav-inner">
          <a href="/" className="nav-logo">⚽ VM 2026</a>
          <div className="nav-links">
            {MAIN_NAV.map(n=>(
              <NavLink key={n.to} to={n.to} end={n.end} className={({isActive})=>`nav-link${isActive?' active':''}`}>
                <span style={{position:'relative',display:'inline-block'}}>
                  {n.label}
                  {n.to==='/gaet' && <NavBadge />}
                </span>
              </NavLink>
            ))}
            {MORE_ITEMS.map(n=>(
              <NavLink key={n.to} to={n.to} className={({isActive})=>`nav-link${isActive?' active':''}`}>{n.label}</NavLink>
            ))}
            {isAdmin
              ? <><NavLink to="/admin" className={({isActive})=>`nav-link admin-link${isActive?' active':''}`}>Admin</NavLink>
                  <button onClick={logout} className="btn btn-sm" style={{marginLeft:'auto'}}>Log ud</button></>
              : <NavLink to="/admin/login" className={({isActive})=>`nav-link${isActive?' active':''}`} style={{marginLeft:'auto'}}>Admin</NavLink>
            }
          </div>
        </div>
      </nav>

      <div className="page-wrap">
        <Routes>
          <Route path="/"            element={<Leaderboard />} />
          <Route path="/kampe"       element={<Matches />} />
          <Route path="/gaet"        element={<Predict />} />
          <Route path="/statistik"   element={<Stats />} />
          <Route path="/regler"      element={<Rules />} />
          <Route path="/bracket"     element={<Bracket />} />
          <Route path="/h2h"         element={<HeadToHead />} />
          <Route path="/quiz"        element={<Quiz />} />
          <Route path="/profil/:id"  element={<Profile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin"       element={<AdminDashboard />} />
        </Routes>
      </div>

      {/* Bottom nav — mobil */}
      <nav className="bottom-nav">
        {MAIN_NAV.map(n=>(
          <NavLink key={n.to} to={n.to} end={n.end} className={({isActive})=>`bottom-nav-item${isActive?' active':''}`}>
            <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
              <NavIcon name={n.icon}/>
              {n.to==='/gaet' && <NavBadge />}
            </span>
            <span>{n.label}</span>
          </NavLink>
        ))}
        {/* Mere-knap */}
        <button
          onClick={()=>setShowMore(true)}
          className={`bottom-nav-item${moreActive?' active':''}`}
          style={{background:'none',border:'none',fontFamily:'inherit',cursor:'pointer'}}
        >
          <NavIcon name="grid"/>
          <span>Mere</span>
        </button>
      </nav>

      {showMore && <MoreMenu onClose={()=>setShowMore(false)} />}
    </>
  )
}
