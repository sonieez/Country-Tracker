import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';            
import { useAuth } from '../context/AuthContext';

type Status = 'visited' | 'wishlist';
type City = { id: number; name: string; lat: number; lng: number; status: Status };
type Picked = { lat: number; lng: number };

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
const COLORS = { visited: '#e11d48', wishlist: '#f59e0b', picked: '#3b82f6' };

// Xəritəni ölkənin sərhədinə yaxınlaşdırır
function FitCountry({ feature }: { feature: any }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.geoJSON(feature).getBounds());
  }, [feature, map]);
  return null;
}

// Klikləri tutur
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
// Xəritəni seçilən yerə uçurur
function FlyTo({ target }: { target: Picked | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 10);
  }, [target, map]);
  return null;
}

type SearchResult = { lat: string; lon: string; name: string; display_name: string };

export default function CountryCityMap({ code }: { code: string }) {
  const { user, openSignIn } = useAuth();
  const [feature, setFeature] = useState<any>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const [picked, setPicked] = useState<Picked | null>(null);
  const [name, setName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lookupId = useRef(0);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<Picked | null>(null);

  // Ölkənin sərhədi
  useEffect(() => {
    let old = false;
    fetch('/countries.geojson')
      .then((r) => r.json())
      .then((d) => {
        if (old) return;
        const f = d.features.find((x: any) => x.properties['ISO3166-1-Alpha-2'] === code);
        setFeature(f ?? null);
      });
    return () => {
      old = true;
    };
  }, [code]);

  // Mənim şəhərlərim
  useEffect(() => {
    if (!user) {
      setCities([]);
      return;
    }
    let old = false;
    api(`/countries/${code}/cities`)
      .then((data: City[]) => {
        if (!old) setCities(data);
      })
      .catch(() => {});
    return () => {
      old = true;
    };
  }, [code, user, reloadKey]);

  async function handlePick(lat: number, lng: number) {
    if (!user) {
      openSignIn();
      return;
    }
    const myId = ++lookupId.current;
    setPicked({ lat, lng });
    setName('');
    setError(null);
    setLookingUp(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
      );
      const data = await res.json();
      if (myId !== lookupId.current) return; // köhnə sorğu
      if (data.error || !data.address) {
        setError('No place found here. Click closer to a city.');
        return;
      }
      if (data.address.country_code?.toUpperCase() !== code) {
        setError('This point is outside the country. Click inside it.');
        return;
      }
      const a = data.address;
      setName(a.city || a.town || a.village || a.municipality || a.county || a.state || '');
    } catch {
      if (myId === lookupId.current) setError('Could not get the place name. Type it manually.');
    } finally {
      if (myId === lookupId.current) setLookingUp(false);
    }
  }

  async function save(status: Status) {
    if (!picked || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/countries/${code}/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), lat: picked.lat, lng: picked.lng, status }),
      });
      setPicked(null);
      setName('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await api(`/cities/${id}`, { method: 'DELETE' });
      setReloadKey((k) => k + 1);
    } catch {
      setError('Could not delete');
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=${code.toLowerCase()}&limit=5&accept-language=en`
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      if (data.length === 0) setError('No place found in this country.');
    } catch {
      setError('Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  }

  function choose(r: SearchResult) {
    if (!user) {
      openSignIn();
      return;
    }
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    lookupId.current++; // gözləyən klik sorğusunu ləğv edir
    setLookingUp(false);
    setPicked({ lat, lng });
    setName(r.name || r.display_name.split(',')[0]);
    setFlyTarget({ lat, lng });
    setResults([]);
    setError(null);
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-2">Cities</h2>
      <p className="text-sm opacity-70 mb-3">
        Click on the map to mark a city you visited or want to visit.
      </p>

      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Search a city (e.g. Tartu)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {results.length > 0 && (
        <ul className="mb-3 border rounded divide-y">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" className="w-full text-left px-3 py-2" onClick={() => choose(r)}>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ height: 380 }} className="rounded-xl overflow-hidden border">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {feature && (
            <>
              <GeoJSON
                key={code}
                data={feature}
                style={() => ({ color: '#e11d48', weight: 2, fillOpacity: 0.05 })}
              />
              <FitCountry feature={feature} />
            </>
          )}
          <ClickHandler onPick={handlePick} />
          <FlyTo target={flyTarget} />
          {cities.map((c) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={pinIcon(COLORS[c.status])} />
          ))}
          {picked && <Marker position={[picked.lat, picked.lng]} icon={pinIcon(COLORS.picked)} />}
        </MapContainer>
      </div>

      {picked && (
        <div className="mt-3 p-3 rounded-xl border flex flex-wrap items-center gap-2">
          <input
            className="border rounded px-2 py-1 flex-1 min-w-40"
            placeholder={lookingUp ? 'Finding city…' : 'City name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
          <button disabled={saving || lookingUp || !name.trim()} onClick={() => save('visited')}>
            Visited
          </button>
          <button disabled={saving || lookingUp || !name.trim()} onClick={() => save('wishlist')}>
            Want to go
          </button>
          <button onClick={() => setPicked(null)}>Cancel</button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {cities.length > 0 && (
        <ul className="mt-3 space-y-1">
          {cities.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: COLORS[c.status],
                  display: 'inline-block',
                }}
              />
              <span className="flex-1">
                {c.name} · {c.status === 'visited' ? 'Visited' : 'Want to go'}
              </span>
              <button onClick={() => remove(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}