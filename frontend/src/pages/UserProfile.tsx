import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import FollowButton from "../components/FollowButton";
import PassportView, { type PassportData } from "../components/PassportView";

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let oldRequest = false;

    if (!id) return;

    async function getUser() {
      setLoading(true);
      try {
        setError(null);
        const result = await api("/users/" + id);
        if (!oldRequest) {
          setData(result);
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
    getUser();
    return () => { oldRequest = true; };
  }, [id, reloadKey]);

  if (me && me.id === id) return <Navigate to="/profile" replace />;
  if (loading && !data) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>No data</p>;

  return (
    <PassportView
      key={data.user.id}
      data={data}
      isOwn={false}
      actions={
        <div className="follow">
          <FollowButton person={data.user} onChange={() => setReloadKey((k) => k + 1)} />
        </div>
      }
    />
  );
}