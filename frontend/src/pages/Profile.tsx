import type { Country } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RatingDots from "../components/RatingDots";
import ListsTab from "../components/ListsTab";
import { useFollow } from "../context/FollowContext";
import PersonRow from "../components/PersonRow";


type ProfileReview = {
  rating: number
  text: string
  createdAt: string
  country: {name: string; code: string; flag: string}
}

type ProfileData = {
  user: {
    id: string; 
    displayName: string | null; 
    username: string | null; 
    profilePicture: string | null
  };
  visited: Country[];
  wishlist: Country[];
  reviews: ProfileReview[];
  followersCount: number;
}

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("Stamps");

  const { user, openSignIn } = useAuth();
  const nameLine = (data?.user.displayName ?? "TRAVELER").toUpperCase().replace(/[^A-Z]+/g, "<");
  const passportNo = "SZ" + (data?.user.id ?? "").replace(/[^0-9a-z]/gi, "").slice(0, 8).toUpperCase();
  const mrz1 = ("P<STZ<<" + nameLine).padEnd(44, "<").slice(0, 44);
  const mrz2 = (passportNo + "<STZ<" + (data?.visited.length ?? 0) + "<250").padEnd(44, "<").slice(0, 44);

  const { following } = useFollow();

  useEffect(() => {
    let oldRequest = false;

    if (!user) return;

    async function getProfile() {
      setLoading(true);
      try{
        setError(null);
        const response = await api('/me/profile');
        if (!oldRequest) {
          setData(response);
        }
      } catch(error) {
        if (!oldRequest) {  
          if (error instanceof Error){
            setError(error.message);
          } else {
            setError("Something went wrong")
          }
        }
      } finally {
        if (!oldRequest) {
          setLoading(false);
        }
      }
    }
    getProfile();
    return () => {oldRequest = true;}
  }, [user])
  
  return(
    !user ? (
      <div>
        <p>Sign in to see your passport</p>
        <button className="fill" onClick={openSignIn}>Sign in</button>
      </div>
    ) : loading ? (
      <p>Loading...</p>
    ) : error ? (
      <p>{error}</p>
    ) : !data ? (
      <p>No data</p>
    ) : (
      <section className="pz">
        <div className="pg">
          <div className="lp">
            <div className="top"><i />PASSPORT · STAMPZ</div>
            <div className="who">
              <div className="photo">
                {data.user.profilePicture ? (
                  <img src={data.user.profilePicture} alt="" referrerPolicy="no-referrer" />
                ) : (
                  (data.user.displayName ?? "?").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="fld"><span>NAME</span><b>{data.user.displayName ?? "Traveler"}</b></div>
                {data.user.username && (
                  <div className="fld"><span>USERNAME</span><b>@{data.user.username}</b></div>
                )}
                <div className="fld"><span>PASSPORT NO.</span><b>{passportNo}</b></div>
              </div>
            </div>
            <div className="nums">
              <div><b>{data.visited.length} / 250</b><span>STAMPS</span></div>
              <div><b>{data.wishlist.length}</b><span>WISHLIST</span></div>
              <div><b>{data.reviews.length}</b><span>REVIEWS</span></div>
              <div><b>{data.followersCount}</b><span>FOLLOWERS</span></div>
              <div><b>{following.length}</b><span>FOLLOWING</span></div>
            </div>
          </div>

          <div className="rp">
            <div className="tabs">
              {["Stamps", "Wishlist", "Lists", "Reviews", "Following"].map((t) => (
                <a key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>{t}</a>
              ))}
            </div>

              <div className="pbody">
                {tab === "Stamps" ? (
                  <>
                    <div className="hd"><h2>Visited · {data.visited.length}</h2><small>Tap a stamp to open the country</small></div>
                    <div className="sg">
                      {data.visited.map((c) => (
                        <div key={c.code}>
                          <Link className="stamp" to={`/countries/${c.code}`}>{c.code}</Link>
                          {c.name}
                        </div>
                      ))}
                      <div><Link className="stamp add" to="/countries">+</Link>Add a stamp</div>
                    </div>
                  </>
                ) : tab === "Wishlist" ? (
                  <>
                    <div className="hd"><h2>Wishlist · {data.wishlist.length}</h2></div>
                    <div className="sg">
                      {data.wishlist.map((c) => (
                        <div key={c.code}>
                          <Link className="stamp wish" to={`/countries/${c.code}`}>{c.code}</Link>
                          {c.name}
                        </div>
                      ))}
                      <div><Link className="stamp add" to="/countries">+</Link>Add a stamp</div>
                    </div>
                  </>
                ) : tab === "Lists" ? (
                  <ListsTab />
                ) : tab === "Following" ? (
                  <>
                    <div className="hd"><h2>Following · {following.length}</h2></div>
                    {following.length === 0 ? (
                      <div className="lempty">You don't follow anyone yet.</div>
                    ) : (
                      <div className="two" style={{ marginTop: 14 }}>
                        {following.map((p) => (
                          <PersonRow key={p.id} person={p} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="hd"><h2>Your reviews · {data.reviews.length}</h2></div>
                    {data.reviews.length === 0 ? (
                      <p>No reviews yet</p>
                    ) : (
                      data.reviews.map((r) => (
                        <div key={r.country.code} style={{ marginTop: 14 }}>
                          <Link to={`/countries/${r.country.code}`}><b>{r.country.name}</b></Link>
                          <RatingDots value={r.rating} />
                          {r.text && <p>{r.text}</p>}
                        </div>
                      ))
                    )}
                  </>
                )}

              </div>

          </div>
        </div>

        <div className="mrz2">{mrz1}<br />{mrz2}</div>
      </section>
    )
  )
}