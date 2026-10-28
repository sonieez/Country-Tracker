import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SignInModal from './SignInModal'

export default function Layout() {
  const { user, loading, signIn, signOut, signInOpen, openSignIn, closeSignIn } = useAuth()

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
        <NavLink to="/countries" className={({ isActive }) => (isActive ? 'on' : '')}>
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
        
        {loading ? 
          <span className="inline-block h-10 w-24" aria-hidden="true"></span> :
            user ? 
              <>
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.displayName ?? user.email}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-stamp font-bold">
                    {(user.displayName ?? user.email)[0].toUpperCase()}
                  </span>
                )}
                <button onClick={signOut} className="fill">Sign Out</button>
              </> : 
                <button onClick={openSignIn} className="fill">Sign in</button>
        }

      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="box">
        <span>Every trip is a stamp · StampZ · 2026</span>
        <a href="#">About · Contact</a>
      </footer>
      
      <SignInModal
        open={signInOpen}
        onClose={closeSignIn}
        onSignIn={signIn}
      />
    </div>
  )
}