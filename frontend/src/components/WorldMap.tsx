import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

type Props = { 
  activeCode: string | null; 
  onSelect: (code: string) => void 
}

export default function WorldMap({ activeCode, onSelect }: Props) {

  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({ coordinates: [0, 0], zoom: 1 });

  return (
    <div className="box mapbox">
      <div className="zoomctl">
        <button onClick={() => setPosition((pos) => ({...pos, zoom: Math.min(pos.zoom * 1.5, 8)}))} aria-label="Zoom in">+</button>
        <button onClick={() => setPosition((pos) => ({...pos, zoom: Math.max(pos.zoom/1.5, 1)}))} aria-label="Zoom out">-</button>
        <button onClick={() => setPosition({ coordinates: [0,0], zoom: 1})} aria-label="Reset zoom">⟲</button>
      </div>

      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 147 }}>
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={(p) => setPosition((pos) => ({
            coordinates: p.coordinates ?? pos.coordinates,
            zoom: p.zoom ?? pos.zoom,
          }))}
          filterZoomEvent={(e) => e.type !== "wheel"}
        >
          <Geographies geography="/countries.geojson">
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = geo.properties?.["ISO3166-1-Alpha-2"];
                
                return (
                  <Geography 
                    key={geo.rsmKey} 
                    geography={geo} 
                    className={code === activeCode ? "land act" : "land"}
                    onMouseEnter={() => onSelect(code)}
                    onClick={() => onSelect(code)}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}