import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import { PopularCountries } from "../components/PopularCountries";

export default function Home() {
  const { user, loading, openSignIn } = useAuth();

  return (
    loading ? null : user ? 
      <Navigate to="/countries" replace /> : 
      <>
        <section className="box hero">
          <div>
            <h1>Your profile is your passport!</h1>
            <p>Stamp countries you visited or want to visit.</p>
            <button onClick={openSignIn} className="fill">Get started</button>
          </div>
          <div className="pass">
            <div className="l">
              <span className="av" style={{ display: "block", marginBottom: 6, width: 44, height: 44 }}></span>
              <i></i>
              <i style={{ width: "70%" }}></i>
              <i></i>
            </div>
            <div className="r">
              <span className="stamp">DE</span>
              <span className="stamp wish">JP</span>
              <span className="stamp add">+</span>
              <span className="stamp add">+</span>
            </div>
          </div>
        </section>

        <section className="box feat">
          <h2>What can you do?</h2>
          <div className="g">
            <div className="it">
              <span className="stamp sm">OK</span>
              <div><b>Stamp countries</b><br /><small>Visited · Wishlist</small></div>
            </div>
            <div className="it">
              <span className="ico">☺</span>
              <div><b>Follow</b><br /><small>See where friends have been</small></div>
            </div>
            <div className="it">
              <span className="ico">☰</span>
              <div><b>Create lists</b><br /><small>Your own country collections</small></div>
            </div>
          </div>
        </section>

        <PopularCountries />
      </>
  )
}