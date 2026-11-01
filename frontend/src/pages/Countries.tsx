import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Country = {
  id: number
  name: string
  code: string
  flag: string
}

export default function Countries() {

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let oldRequest = false;

    async function getCountries() {
      try{
        setError(null);
        const trimmed = searchInput.trim()
        const path = trimmed ? `/countries?search=${encodeURIComponent(trimmed)}` : '/countries';
        const data = await api(path);
        if (!oldRequest) {
          setCountries(data);
        }
      } catch (err) {
        if (!oldRequest) {  
          if (err instanceof Error){
            setError(err.message);
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
    getCountries();
    return () => {oldRequest = true;}
  }, [searchInput])

    return (
    <>
      <h2 className="s">Countries</h2>
      <input
        className="search"
        placeholder="Search countries..."
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> :
        <div className="grid4" style={{ marginTop: 16 }}>
          {countries.map((c) => (
            <Link
              key={c.code}
              to={`/countries/${c.code}`}
              className="box cc block"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <img className="f w-full object-cover" src={c.flag} alt={c.name} />
              <div className="t">
                <b>{c.name}</b>
                <small>{c.code} · <span className="rate">– / 5</span></small>
              </div>
            </Link>
          ))}
        </div>}
    </>
  )
}