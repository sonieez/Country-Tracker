import { useEffect, useState } from "react";
import { api } from "../lib/api";
import TicketCard from "./TicketCard";
import type { Country } from '../types'


export function PopularCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const countryCodes = ["FR", "JP", "IT", "US"];
  

  useEffect(() => {
    async function getCountries() {
      try{
        const data = await api('/countries');
        setCountries(data);
        
      } catch(err) {
        
      }
    }
    getCountries();
  }, [])
  
  const popularCountries = countries.filter((c) => countryCodes.includes(c.code));
  
  return(
    <>
      <h2 className="s">Popular Countries</h2>
      <div className="tks">
        {popularCountries.map((c) => <TicketCard key={c.id} country={c} />)}
      </div>
    </>
  )
}