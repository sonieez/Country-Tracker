import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const theme = dark ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [dark])

  return (
    <div className="wrap">
      <nav className="box">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <span className="ring"></span>StampZ
        </Link>
        <NavLink to="/countries/FR" className={({ isActive }) => (isActive ? 'on' : '')}>
          Countries
        </NavLink>
        <span className="sp"></span>
        <button
          className="round"
          onClick={() => setDark(!dark)}
          aria-label="Switch theme"
          title="Light / Dark"
        >
          {dark ? '☀' : '☾'}
        </button>
        <button className="fill">Sign in</button>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="box">
        <span>Every trip is a stamp · StampZ · 2026</span>
        <a href="#">About · Contact</a>
      </footer>
    </div>
  )
}