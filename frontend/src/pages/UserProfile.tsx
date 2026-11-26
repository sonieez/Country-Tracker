import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Country } from "../types";
import type { Person } from "../context/FollowContext";
import FollowButton from "../components/FollowButton";
import RatingDots from "../components/RatingDots";

type UserReview = {
  rating: number;
  text: string;
  createdAt: string;
  country: { name: string; code: string; flag: string };
};

type UserProfileData = {
  user: Person;
  visited: Country[];
  wishlist: Country[];
  reviews: UserReview[];
  followersCount: number;
  followingCount: number;
};

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("Stamps");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let oldRequest = false;

    if (!id) return;

    async function getUser() {
      setLoading(true);
      try {
        setError(null);
        const result = await api("/users/" + id);
        if (!oldRequest) {
          setData(result);
        }
      } catch (err) {
        if (!oldRequest) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!oldRequest) {
          setLoading(false);
        }
      }
    }
    getUser();
    return () => { oldRequest = true; };
  }, [id, reloadKey]);

  const nameLine = (data?.user.displayName ?? "TRAVELER").toUpperCase().replace(/[^A-Z]+/g, "<");
  const passportNo = "SZ" + (data?.user.id ?? "").replace(/[^0-9a-z]/gi, "").slice(0, 8).toUpperCase();
  const mrz1 = ("P<STZ<<" + nameLine).padEnd(44, "<").slice(0, 44);
  const mrz2 = (passportNo + "<STZ<" + (data?.visited.length ?? 0) + "<250").padEnd(44, "<").slice(0, 44);

  return (
    me && me.id === id ? (
      <Navigate to="/profile" replace />
    ) : loading && !data ? (
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
              <div><b>{data.followersCount}</b><span>FOLLOWERS</span></div>
              <div><b>{data.followingCount}</b><span>FOLLOWING</span></div>
            </div>
            <div className="follow">
              <FollowButton person={data.user} onChange={() => setReloadKey((k) => k + 1)} />
            </div>
          </div>

          <div className="rp">
            <div className="tabs">
              {["Stamps", "Wishlist", "Reviews"].map((t) => (
                <a key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>{t}</a>
              ))}
            </div>

            {tab === "Stamps" ? (
              <>
                <div className="hd"><h2>Visited · {data.visited.length}</h2></div>
                {data.visited.length === 0 ? (
                  <div className="lempty">No stamps yet.</div>
                ) : (
                  <div className="sg">
                    {data.visited.map((c) => (
                      <div key={c.code}>
                        <Link className="stamp" to={`/countries/${c.code}`}>{c.code}</Link>
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : tab === "Wishlist" ? (
              <>
                <div className="hd"><h2>Wishlist · {data.wishlist.length}</h2></div>
                {data.wishlist.length === 0 ? (
                  <div className="lempty">Wishlist is empty.</div>
                ) : (
                  <div className="sg">
                    {data.wishlist.map((c) => (
                      <div key={c.code}>
                        <Link className="stamp wish" to={`/countries/${c.code}`}>{c.code}</Link>
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="hd"><h2>Reviews · {data.reviews.length}</h2></div>
                {data.reviews.length === 0 ? (
                  <div className="lempty">No reviews yet.</div>
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

        <div className="mrz2">{mrz1}<br />{mrz2}</div>
      </section>
    )
  );
}