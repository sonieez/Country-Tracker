import { Link } from "react-router-dom";

type Country = { id: number; name: string; code: string; flag: string };

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
        <span className="rate">– / 5</span>
      </div>
      <div className="stub">
        <button className="stamp add" aria-label={`Stamp ${country.name}`}>+</button>
        <span className="cap">Stamp it</span>
      </div>
    </article>
  );
}