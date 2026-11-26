import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

type Pt = [number, number];
type Ring = Pt[];
type GeoFeature = { properties?: Record<string, unknown>; geometry: { type: string; coordinates: unknown } };
type GeoData = { features: GeoFeature[] };
type GeographyProp = ComponentProps<typeof Geographies>["geography"];

// Fayl bir dəfə yüklənir, səhifələr arasında yenidən yüklənmir
let geoCache: GeoData | null = null;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

// Ölkənin ən böyük hissəsinin (adalar/uzaq ərazilər nəzərə alınmadan) mərkəzini və uyğun zoom-u hesablayır
function viewFor(geo: GeoData, code: string): { center: Pt; zoom: number } | null {
  const feature = geo.features.find((f) => f.properties?.["ISO3166-1-Alpha-2"] === code);
  if (!feature) return null;

  const g = feature.geometry;
  let rings: Ring[] = [];
  if (g.type === "Polygon") {
    rings = [(g.coordinates as Ring[])[0]];
  } else if (g.type === "MultiPolygon") {
    rings = (g.coordinates as Ring[][]).map((poly) => poly[0]);
  }

  let best: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null = null;
  let bestArea = -1;

  for (const ring of rings) {
    if (!ring || ring.length === 0) continue;
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    const area = (maxLon - minLon) * (maxLat - minLat);
    if (area > bestArea) {
      bestArea = area;
      best = { minLon, maxLon, minLat, maxLat };
    }
  }
  if (!best) return null;

  const spanLon = Math.max(best.maxLon - best.minLon, 0.5);
  const spanLat = Math.max(best.maxLat - best.minLat, 0.5);
  const zoom = clamp(Math.min(160 / spanLon, 120 / spanLat), 1, 10);

  return {
    center: [(best.minLon + best.maxLon) / 2, (best.minLat + best.maxLat) / 2],
    zoom,
  };
}

export default function CountryLocationMap({ code }: { code: string }) {
  const [geo, setGeo] = useState<GeoData | null>(geoCache);

  useEffect(() => {
    if (geoCache) return;
    let cancelled = false;
    fetch("/countries.geojson")
      .then((r) => r.json())
      .then((data: GeoData) => {
        geoCache = data;
        if (!cancelled) setGeo(data);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  const view = useMemo(() => (geo ? viewFor(geo, code) : null), [geo, code]);

  if (!geo) {
    return (
      <div className="box mapbox locmap" style={{ minHeight: 200, display: "grid", placeItems: "center" }}>
        <small>Loading map...</small>
      </div>
    );
  }

  const center: Pt = view?.center ?? [0, 0];
  const zoom = view?.zoom ?? 1;

  return (
    <div className="box mapbox locmap">
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 147 }}>
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={1}
          maxZoom={10}
          filterZoomEvent={() => false}
        >
          <Geographies geography={geo as unknown as GeographyProp}>
            {({ geographies }) =>
              geographies.map((g) => (
                <Geography
                  key={g.rsmKey}
                  geography={g}
                  className={g.properties?.["ISO3166-1-Alpha-2"] === code ? "land act" : "land"}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}