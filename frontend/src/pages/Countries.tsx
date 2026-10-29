import { useEffect, useState } from "react"
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
    async function getCountries() {
      try{
        setError(null);
        const trimmed = searchInput.trim()
        const path = trimmed ? `/countries?search=${encodeURIComponent(trimmed)}` : '/countries'
        setCountries(await api(path));
      } catch (err) {
        if (err instanceof Error){
          setError(err.message);
        } else {
          setError("Something went wrong")
        }
      } finally {
        setLoading(false);
      }
    }
    getCountries();
  }, [searchInput])

  return(
    <>
      <input placeholder="Search countries..." type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : 
        <ul>
          {countries.map((c) => (
            <li key={c.code}>
              <img src={c.flag} alt={c.name} />
              <span>{c.name}</span>
            </li>
          ))}
        </ul>}
    </>
  )
}