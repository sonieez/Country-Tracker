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

  useEffect(() => {
    async function getCountries() {
      try{
        setCountries(await api('/countries'));
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
  }, [])

  return(
    loading ? <p>Loading...</p> : error ? <p>{error}</p> : 
      <ul>
        {countries.map((c) => (
          <li key={c.code}>
            <img src={c.flag} alt={c.name} />
            <span>{c.name}</span>
          </li>
        ))}
      </ul>
  )
}