import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  async function login() {
    try {
      const r = await api.post('/auth/login', { username, password })
      localStorage.setItem('admin_token', r.data.token)
      navigate('/admin')
      window.location.reload()
    } catch (e) {
      setMsg(e.response?.data?.error || 'Login fejlede')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔐 Admin Login</div>
        <div className="page-sub">Kun for admins</div>
      </div>
      <div className="card" style={{maxWidth:'360px'}}>
        {msg && <div className="alert alert-error">{msg}</div>}
        <div className="form-group">
          <label className="form-label">Brugernavn</label>
          <input className="form-input" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} />
        </div>
        <div className="form-group">
          <label className="form-label">Adgangskode</label>
          <input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} />
        </div>
        <button className="btn btn-gold" style={{width:'100%'}} onClick={login}>Log ind som admin</button>
      </div>
    </div>
  )
}
