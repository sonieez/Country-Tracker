import { ComposableMap, Geographies, Geography } from "react-simple-maps";

type Props = { 
  activeCode: string | null; 
  onSelect: (code: string) => void 
}

export default function WorldMap({ activeCode, onSelect }: Props) {
  return (
    <div className="box mapbox">
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 147 }}>
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
      </ComposableMap>
    </div>
  );
}