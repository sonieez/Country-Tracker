import { useStamps } from "../context/StampsContext";

type Props = {code: string, name: string}

export default function StampButton({code, name}: Props) {
  const { stamps, cycleStamp } = useStamps(); 
  const countryStatus = stamps[code];
  
  const stampClass = countryStatus === "visited" ? "stamp" : countryStatus === "wishlist" ? "stamp wish" : "stamp add";
  const stampText = countryStatus ? code : "+";
  const statusText = countryStatus === "visited" ? "Stamped" : countryStatus === "wishlist" ? "Wishlist" : "Stamp it";

  return (
    <>
      <button className={stampClass} aria-label={`Stamp ${name}`} onClick={() => {cycleStamp(code)}}>
        {stampText}
      </button>
      <span className="cap">{statusText}</span>
    </>
  )
}