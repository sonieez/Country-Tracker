import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import StampButton from '../components/StampButton'
import type { Country } from '../types'
import Reviews from '../components/Reviews'
import AddToListButton from '../components/AddToListButton'
import CountryPeople from '../components/CountryPeople'
import CountryLocationMap from '../components/CountryLocationMap'
import CountryCityMap from '../components/CountryCityMap'


export default function CountryPage() {
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ reloadkey, setReloadKey ] = useState(0);
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
  }, [code, reloadkey])

  return (
    loading && !country ? <p>Loading...</p> : error ? <p>{error}</p> : !country ? "Country not found" : (
      <>
        <div className="ch">
          <section className="tk big">
            <div className="fb">
              <img src={country.flag} alt={`Flag of ${country.name}`} />
            </div>
            <div className="mid">
              <span className="tg">COUNTRY PASS</span>
              <span className="cd">{country.code}</span>
              <h1>{country.name}</h1>
              <span className="rate">
                {country.average === null ? "No reviews yet" : country.average.toFixed(1) + " / 5"}
              </span>
            </div>
            <div className="stub">
              <StampButton code={country.code} name={country.name} />
              <AddToListButton code={country.code} />
            </div>
          </section>

          

          <section className="box stats">
            <div><span>Rating</span><b className="r">
              {country.average === null ? "No reviews yet" : country.average.toFixed(1) + " / 5"}  
            </b></div>
            <div><span>Visited by</span><b>{country.visitedCount ?? "–"}</b></div>
            <div><span>Want to go</span><b>{country.wishlistCount ?? "–"}</b></div>
          </section>

        </div>

        <div className="hd"><h2>Where is {country.name}?</h2></div>
        <CountryLocationMap code={country.code} />

        <CountryPeople
          code={country.code}
          visitedCount={country.visitedCount ?? 0}
          wishlistCount={country.wishlistCount ?? 0}
        />

        <CountryCityMap code={country.code} />

        <Reviews code={country.code} onReviewsChanged={() => setReloadKey((k) => k + 1)} />
      </>
    )
  )
}