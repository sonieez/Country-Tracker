import { useAuth } from "../context/AuthContext"

export default function Home() {
  const { user, loading, signIn, signOut} = useAuth();

  return (
    <>
      <h1 className="s">Home</h1>
      <button onClick={signIn}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
      <p>
        {loading ? 'loading...' : user ? user.email : 'access denied'}
      </p>
    </>
  )
}