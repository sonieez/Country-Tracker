import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PersonRow from "./PersonRow";
import type { Person } from "../context/FollowContext";

type PeopleData = { visited: Person[]; wishlist: Person[] };

export default function CountryPeople({
  code,
  visitedCount,
  wishlistCount,
}: {
  code: string;
  visitedCount: number;
  wishlistCount: number;
}) {
  const [data, setData] = useState<PeopleData | null>(null);

  useEffect(() => {
    let oldRequest = false;

    async function getPeople() {
      try {
        const result = await api(`/countries/${code}/people`);
        if (!oldRequest) {
          setData(result);
        }
      } catch {
        if (!oldRequest) {
          setData(null);
        }
      }
    }
    getPeople();
    return () => { oldRequest = true; };
  }, [code]);

  if (!data) return null;

  function renderGroup(title: string, count: number, people: Person[]) {
    return (
      <>
        <div className="hd">
          <h2>{title} · {count}</h2>
        </div>
        {people.length === 0 ? (
          <div className="lempty">Nobody yet. Be the first one!</div>
        ) : (
          <div className="two">
            {people.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {renderGroup("Been here", visitedCount, data.visited)}
      {renderGroup("Want to go", wishlistCount, data.wishlist)}
    </>
  );
}