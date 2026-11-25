import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Country } from "../types";

export type ListData = {
  id: number;
  name: string;
  countries: Pick<Country, "code" | "name" | "flag">[];
};

export default function ListsTab() {
  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let oldRequest = false;

    async function getLists() {
      try {
        setError(null);
        const data = await api("/me/lists");
        if (!oldRequest) {
          setLists(data);
        }
      } catch (err) {
        if (!oldRequest) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!oldRequest) {
          setLoading(false);
        }
      }
    }
    getLists();
    return () => { oldRequest = true; };
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    try {
      setError(null);
      const created: ListData = await api("/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setLists((prev) => [created, ...prev]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteList(id: number) {
    if (!window.confirm("Delete this list?")) return;
    try {
      setError(null);
      await api("/lists/" + id, { method: "DELETE" });
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleRemoveCountry(listId: number, code: string) {
    try {
      setError(null);
      await api(`/lists/${listId}/countries/${code}`, { method: "DELETE" });
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? { ...l, countries: l.countries.filter((c) => c.code !== code) }
            : l
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <>
      <div className="hd">
        <h2>Lists · {lists.length}</h2>
        <small style={{ color: "var(--muted)" }}>Your own country collections</small>
      </div>

      <form className="lform" onSubmit={handleCreate}>
        <input
          className="search"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New list name, e.g. Summer 2026"
          maxLength={50}
        />
        <button className="fill" type="submit" disabled={creating || !newName.trim()}>
          {creating ? "Creating..." : "+ Create list"}
        </button>
      </form>

      {error && <p className="lerr">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : lists.length === 0 ? (
        <div className="lempty">No lists yet. Name your first one above.</div>
      ) : (
        lists.map((list) => (
          <div key={list.id} className="box lc">
            <div className="lh">
              <div>
                <b>{list.name}</b>
                <small>
                  {list.countries.length} {list.countries.length === 1 ? "COUNTRY" : "COUNTRIES"}
                </small>
              </div>
              <button className="sm" onClick={() => handleDeleteList(list.id)}>
                Delete
              </button>
            </div>

            {list.countries.length === 0 ? (
              <div className="lempty">Empty. Open a country and press "Add to list".</div>
            ) : (
              <div className="lchips">
                {list.countries.map((c) => (
                  <span key={c.code} className="lchip">
                    <img src={c.flag} alt="" />
                    <Link to={`/countries/${c.code}`}>{c.name}</Link>
                    <button
                      onClick={() => handleRemoveCountry(list.id, c.code)}
                      aria-label={`Remove ${c.name} from ${list.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}