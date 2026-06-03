import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard.jsx'
import Matches from './pages/Matches.jsx'
import Predict from './pages/Predict.jsx'
import Rules from './pages/Rules.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function NavIcon({ name }) {
  const icons = {
    trophy: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2h12v6a6 6 0 01-12 0V2zM6 8H3a2 2 0 000 4h3M18 8h3a2 2 0 010 4h-3M12 14v4M8 18h8" /></svg>,
    calendar: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M3 10h18M8 2v2M16 2v2"/></svg>,
    edit: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-4-9l4 4L10 18H6v-4L17 3z"/></svg>,
    chart: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    rules: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
    cog: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>,
  }
  return icons[name] || null
}

const NAV = [
  { to: '/', end: true, label: 'Leaderboard', icon: 'trophy' },
  { to: '/kampe',    label: 'Kampe',     icon: 'calendar' },
  { to: '/gaet',     label: 'Mine gæt',  icon: 'edit' },
  { to: '/statistik',label: 'Statistik', icon: 'chart' },
  { to: '/regler',   label: 'Regler',    icon: 'rules' },
]

export default function App() {
  const isAdmin = !!localStorage.getItem('admin_token')
  const navigate = useNavigate()
  function logout() { localStorage.removeItem('admin_token'); navigate('/'); window.location.reload() }

  return (
    <>
      <nav className="top-nav">
        <div className="top-nav-inner">
          <a href="/" className="nav-logo">⚽ VM 2026</a>
          <div className="nav-links">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({isActive}) => `nav-link${isActive?' active':''}`}>{n.label}</NavLink>
            ))}
            {isAdmin
              ? <><NavLink to="/admin" className={({isActive}) => `nav-link admin-link${isActive?' active':''}`}>Admin</NavLink>
                  <button onClick={logout} className="btn btn-sm" style={{marginLeft:'auto'}}>Log ud</button></>
              : <NavLink to="/admin/login" className={({isActive}) => `nav-link${isActive?' active':''}`} style={{marginLeft:'auto'}}>Admin</NavLink>
            }
          </div>
        </div>
      </nav>

      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/kampe" element={<Matches />} />
          <Route path="/gaet" element={<Predict />} />
          <Route path="/statistik" element={<Stats />} />
          <Route path="/regler" element={<Rules />} />
          <Route path="/profil/:id" element={<Profile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({isActive}) => `bottom-nav-item${isActive?' active':''}`}>
            <NavIcon name={n.icon} />
            {n.label}
          </NavLink>
        ))}
        <NavLink to={isAdmin ? '/admin' : '/admin/login'} className={({isActive}) => `bottom-nav-item${isActive?' active':''}`}>
          <NavIcon name="cog" />Admin
        </NavLink>
      </nav>
    </>
  )
}
