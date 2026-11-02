import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

type Country = {
  id: number
  name: string
  code: string
  flag: string
}

export default function CountryPage() {
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { code } = useParams()

  useEffect(() => {
    let oldRequest = false;

    if (!code) return;

    async function getCountry() {
      setLoading(true);
      try{
        setError(null);
        const data = await api('/countries/' + code);
        if(!oldRequest){
          setCountry(data);
        }
      } catch(err) {
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
    getCountry();
    return () => {oldRequest = true;}
  }, [code])

  return (
    loading ? <p>Loading...</p> : error ? <p>{error}</p> : !country ? "Country not found" : 
      <div className="ch">
        <section className="tk big">
          <div className="fb">
            <img src={country.flag} alt={`Flag of ${country.name}`} />
          </div>
          <div className="mid">
            <span className="tg">COUNTRY PASS</span>
            <span className="cd">{country.code}</span>
            <h1>{country.name}</h1>
            <span className="rate">– / 5</span>
          </div>
          <div className="stub">
            <button className="stamp add" aria-label={`Stamp ${country.name}`}>+</button>
            <span className="cap">Stamp it</span>
          </div>
        </section>

        <section className="box stats">
          <div><span>Rating</span><b className="r">– / 5</b></div>
          <div><span>Visited by</span><b>–</b></div>
          <div><span>Want to go</span><b>–</b></div>
        </section>
      </div>
  )
}