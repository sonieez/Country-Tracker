import { Link } from "react-router-dom";
import StampButton from "./StampButton";

export type Country = {
  id: number
  name: string
  code: string
  flag: string
  average: number | null
  count: number
}

export default function TicketCard({ country }: { country: Country }) {
  return (
    <article className="tk">
      <div className="fb">
        <img src={country.flag} alt={`Flag of ${country.name}`} />
      </div>
      <div className="mid">
        <span className="tg">COUNTRY PASS</span>
        <span className="cd">{country.code}</span>
        <Link className="nm" to={`/countries/${country.code}`}>{country.name}</Link>
        <span className="rate">
          {country.average === null ? "No reviews yet" : country.average.toFixed(1) + " / 5"}
        </span>
      </div>
      <div className="stub">
        <StampButton code={country.code} name={country.name} />
      </div>
    </article>
  );
}