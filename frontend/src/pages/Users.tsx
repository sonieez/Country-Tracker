import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PersonRow from "../components/PersonRow";

type Person = {
  id: string;
  displayName: string | null;
  username: string | null;
  profilePicture: string | null;
};

export default function Users() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = input.trim();
  const tooShort = q.replace(/^@/, "").length < 2;

  useEffect(() => {
    if (tooShort) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let oldRequest = false;
    setLoading(true);

    // 300ms gözləyirik ki, hər hərfə sorğu getməsin
    const timer = setTimeout(async () => {
      try {
        setError(null);
        const res = await api(`/users?search=${encodeURIComponent(q)}`);
        if (!oldRequest) setResults(res);
      } catch (err) {
        if (!oldRequest) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!oldRequest) setLoading(false);
      }
    }, 300);

    return () => {
      oldRequest = true;
      clearTimeout(timer);
    };
  }, [q, tooShort]);

  return (
    <section style={{ marginTop: 16 }}>
      <h1 style={{ fontSize: 34 }}>Find travelers</h1>
      <p style={{ color: "var(--muted)", margin: "8px 0 14px" }}>
        Search by name or @username, follow people and see where they have been.
      </p>

      <input
        className="search"
        placeholder="Search travelers..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />

      <div style={{ marginTop: 18 }}>
        {tooShort ? (
          <div className="lempty">Type at least 2 characters to search.</div>
        ) : error ? (
          <p className="lerr">{error}</p>
        ) : loading ? (
          <p>Searching...</p>
        ) : results.length === 0 ? (
          <div className="lempty">No travelers found.</div>
        ) : (
          <div className="two">
            {results.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}