import { useEffect, useState } from "react"
import { api } from "../lib/api";
import TicketCard from "../components/TicketCard";

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
  const [sort, setSort] = useState<"az" | "za">('az');
  const [view, setView] = useState<"list" | "map">("list");

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

  const sortedCountries = [...countries].sort((a, b) => {
    if (sort === 'az') {
      return a.name.localeCompare(b.name);
    } 
    return b.name.localeCompare(a.name)
  });

  return (
    <>
      <h2 className="s">Countries</h2>
      <div className="tb">
        <input
          className="search"
          placeholder="Search countries..."
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      
      <div className="seg2" role="group" aria-label="View">
        <button className={view === 'list' ? 'sel' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
        <button className={view === 'map' ? 'sel' : ''}  aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button>
      </div>

      <select className="pick" aria-label="Filter">
        <option value="all">Filter: All</option>
        <option value="visited">Visited</option>
        <option value="wishlist">Wishlist</option>
        <option value="none">Not stamped</option>
      </select>

      <select value={sort} className="pick" aria-label="Sort" onChange={(e) => setSort(e.target.value as "az" | "za")}>
        <option value="az">Sort: A–Z</option>
        <option value="za">Z–A</option>
      </select>
      </div>

      {loading ? <p>Loading...</p> : error ? <p>{error}</p> :
        view === 'list' ? 
        <div className="tks" style={{ marginTop: 16 }}>
          {sortedCountries.map((c) => (
            <TicketCard key={c.id} country={c} />
          ))}
        </div> :
        <p>Map coming soon</p>
      }
    </>
  )
}