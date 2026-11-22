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
          <img
            src={dark ? '/stampz-logo-artistic-dark.svg' : '/stampz-logo-artistic.svg'}
            alt=""
            width={40}
            height={40}
          />
          StampZ
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
                  <Link to="/profile">
                    <img
                      src={user.profilePicture}
                      alt={user.displayName ?? user.email}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </Link>
                ) : (
                  <Link to="/">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-stamp font-bold">
                      {(user.displayName ?? user.email)[0].toUpperCase()}
                    </span>
                  </Link>
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
        <span>
          <Link to="/about">About</Link>
          {' · '}
          <a
            href="https://instagram.com/stampz_app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>
          {' · '}
          <a href="mailto:sonie.zeynalova@gmail.com">Email</a>
        </span>
      </footer>
      
      <SignInModal
        open={signInOpen}
        onClose={closeSignIn}
        onSignIn={signIn}
      />
    </div>
  )
}