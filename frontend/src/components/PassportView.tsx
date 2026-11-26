import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Country } from "../types";
import type { Person } from "../context/FollowContext";
import RatingDots from "./RatingDots";
import PersonRow from "./PersonRow";

export type PassportReview = {
  rating: number;
  text: string;
  createdAt: string;
  country: { name: string; code: string; flag: string };
};

export type PassportData = {
  user: Person;
  visited: Country[];
  wishlist: Country[];
  reviews: PassportReview[];
  followersCount: number;
  followingCount: number;
};

type PublicList = { id: number; name: string; countries: Country[] };

const TABS = ["Stamps", "Wishlist", "Lists", "Reviews", "Followers", "Following"] as const;
type Tab = (typeof TABS)[number];

type Props = {
  data: PassportData;
  isOwn: boolean;
  actions: ReactNode; // sol səhifənin altındakı düymələr (Edit/Copy link və ya Follow)
  lists?: ReactNode;  // verilsə (öz profil) redaktə olunan ListsTab göstərilir
};

// Followers / Following siyahısını yalnız tab açılanda yükləyir
function usePeople(userId: string, kind: "followers" | "following", active: boolean, count: number) {
  const [people, setPeople] = useState<Person[] | null>(null);

  useEffect(() => {
    if (!active) return;
    let oldRequest = false;
    setPeople(null);
    api(`/users/${userId}/${kind}`)
      .then((res) => { if (!oldRequest) setPeople(res); })
      .catch(() => { if (!oldRequest) setPeople([]); });
    return () => { oldRequest = true; };
  }, [userId, kind, active, count]);

  return people;
}

function PeopleList({ people, empty }: { people: Person[] | null; empty: ReactNode }) {
  if (people === null) return <p>Loading...</p>;
  if (people.length === 0) return <div className="lempty">{empty}</div>;
  return (
    <div className="two" style={{ marginTop: 14 }}>
      {people.map((p) => (
        <PersonRow key={p.id} person={p} />
      ))}
    </div>
  );
}

// Başqasının siyahıları (yalnız oxumaq üçün)
function PublicLists({ userId }: { userId: string }) {
  const [lists, setLists] = useState<PublicList[] | null>(null);

  useEffect(() => {
    let oldRequest = false;
    api(`/users/${userId}/lists`)
      .then((res) => { if (!oldRequest) setLists(res); })
      .catch(() => { if (!oldRequest) setLists([]); });
    return () => { oldRequest = true; };
  }, [userId]);

  if (lists === null) return <p>Loading...</p>;
  if (lists.length === 0) return <div className="lempty">No lists yet.</div>;

  return (
    <>
      {lists.map((l) => (
        <div key={l.id} className="box lc">
          <div className="lh">
            <div>
              <b>{l.name}</b>
              <small>{l.countries.length} COUNTRIES</small>
            </div>
          </div>
          {l.countries.length === 0 ? (
            <div className="lempty">Empty list</div>
          ) : (
            <div className="lchips">
              {l.countries.map((c) => (
                <span key={c.code} className="lchip">
                  <img src={c.flag} alt="" />
                  <Link to={`/countries/${c.code}`}>{c.name}</Link>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default function PassportView({ data, isOwn, actions, lists }: Props) {
  const [tab, setTab] = useState<Tab>("Stamps");

  const followers = usePeople(data.user.id, "followers", tab === "Followers", data.followersCount);
  const followingList = usePeople(data.user.id, "following", tab === "Following", data.followingCount);

  const nameLine = (data.user.displayName ?? "TRAVELER").toUpperCase().replace(/[^A-Z]+/g, "<");
  const passportNo = "SZ" + data.user.id.replace(/[^0-9a-z]/gi, "").slice(0, 8).toUpperCase();
  const mrz1 = ("P<STZ<<" + nameLine).padEnd(44, "<").slice(0, 44);
  const mrz2 = (passportNo + "<STZ<" + data.visited.length + "<250").padEnd(44, "<").slice(0, 44);

  return (
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

          <div className="pstats">
            <div className="pbig">
              <div>
                <b>{data.visited.length}</b>
                <span>/ 250 STAMPS</span>
              </div>
              <div className="pbar">
                <i style={{ width: `${(data.visited.length / 250) * 100}%` }} />
              </div>
            </div>

            <div className="pmini">
              <div><b>{data.wishlist.length}</b><span>WISHLIST</span></div>
              <div><b>{data.reviews.length}</b><span>REVIEWS</span></div>
            </div>

            <div className="psoc">
              <button type="button" onClick={() => setTab("Followers")}>
                <b>{data.followersCount}</b> followers
              </button>
              <span>·</span>
              <button type="button" onClick={() => setTab("Following")}>
                <b>{data.followingCount}</b> following
              </button>
            </div>
          </div>

          {actions}
        </div>

        <div className="rp">
          <div className="tabs">
            {TABS.map((t) => (
              <a key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>{t}</a>
            ))}
          </div>

          <div className="pbody">
            {tab === "Stamps" ? (
              <>
                <div className="hd"><h2>Visited · {data.visited.length}</h2></div>
                {data.visited.length === 0 && !isOwn ? (
                  <div className="lempty">No stamps yet.</div>
                ) : (
                  <div className="sg">
                    {data.visited.map((c) => (
                      <div key={c.code}>
                        <Link className="stamp" to={`/countries/${c.code}`}>{c.code}</Link>
                        {c.name}
                      </div>
                    ))}
                    {isOwn && (
                      <div><Link className="stamp add" to="/countries">+</Link>Add a stamp</div>
                    )}
                  </div>
                )}
              </>
            ) : tab === "Wishlist" ? (
              <>
                <div className="hd"><h2>Wishlist · {data.wishlist.length}</h2></div>
                {data.wishlist.length === 0 && !isOwn ? (
                  <div className="lempty">Wishlist is empty.</div>
                ) : (
                  <div className="sg">
                    {data.wishlist.map((c) => (
                      <div key={c.code}>
                        <Link className="stamp wish" to={`/countries/${c.code}`}>{c.code}</Link>
                        {c.name}
                      </div>
                    ))}
                    {isOwn && (
                      <div><Link className="stamp add" to="/countries">+</Link>Add a stamp</div>
                    )}
                  </div>
                )}
              </>
            ) : tab === "Lists" ? (
              lists ?? <PublicLists userId={data.user.id} />
            ) : tab === "Followers" ? (
              <>
                <div className="hd"><h2>Followers · {data.followersCount}</h2></div>
                <PeopleList people={followers} empty="No followers yet." />
              </>
            ) : tab === "Following" ? (
              <>
                <div className="hd"><h2>Following · {data.followingCount}</h2></div>
                <PeopleList
                  people={followingList}
                  empty={
                    isOwn ? (
                      <>You don't follow anyone yet. <Link to="/users">Find travelers</Link></>
                    ) : (
                      "Not following anyone yet."
                    )
                  }
                />
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
      </div>

      <div className="mrz2">{mrz1}<br />{mrz2}</div>
    </section>
  );
}