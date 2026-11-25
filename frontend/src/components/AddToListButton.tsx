import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ListData } from "./ListsTab";

export default function AddToListButton({ code }: { code: string }) {
  const { user, openSignIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function loadLists() {
    try {
      setError(null);
      const data = await api("/me/lists");
      setLists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleToggleMenu() {
    if (!user) {
      openSignIn();
      return;
    }
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    await loadLists();
    setLoading(false);
  }

  async function handleToggleList(list: ListData) {
    if (busyId !== null) return;
    const inList = list.countries.some((c) => c.code === code);

    setBusyId(list.id);
    try {
      setError(null);
      await api(`/lists/${list.id}/countries/${code}`, {
        method: inList ? "DELETE" : "PUT",
      });
      await loadLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="dd" ref={rootRef}>
      <button className="sm" onClick={handleToggleMenu} aria-expanded={open}>
        + Add to list
      </button>

      {open && (
        <div className="box ddm">
          <div className="ddt">ADD TO LIST</div>

          {loading ? (
            <p className="ddmsg">Loading...</p>
          ) : lists.length === 0 ? (
            <p className="ddmsg">No lists yet.</p>
          ) : (
            lists.map((list) => {
              const inList = list.countries.some((c) => c.code === code);
              return (
                <button
                  key={list.id}
                  className={"ddi" + (inList ? " on" : "")}
                  onClick={() => handleToggleList(list)}
                  disabled={busyId !== null}
                >
                  <span className="ddk">{inList && "✓"}</span>
                  <span className="ddn">{list.name}</span>
                  <small>{list.countries.length}</small>
                </button>
              );
            })
          )}

          {error && <p className="ddmsg err">{error}</p>}

          <Link className="ddf" to="/profile" onClick={() => setOpen(false)}>
            Manage lists in your profile →
          </Link>
        </div>
      )}
    </div>
  );
}