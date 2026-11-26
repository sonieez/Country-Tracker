import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useFollow } from "../context/FollowContext";
import PassportView, { type PassportData } from "../components/PassportView";
import ListsTab from "../components/ListsTab";
import EditProfileModal from "../components/EditProfileModal";

export default function Profile() {
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { user, openSignIn } = useAuth();
  const { following } = useFollow();

  useEffect(() => {
    let oldRequest = false;

    if (!user) return;

    async function getProfile() {
      setLoading(true);
      try {
        setError(null);
        const response = await api("/me/profile");
        if (!oldRequest) {
          setData(response);
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
    getProfile();
    return () => { oldRequest = true; };
  }, [user?.id]);

  async function copyLink() {
    if (!data) return;
    const url = `${window.location.origin}/users/${data.user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your profile link:", url);
    }
  }

  if (!user) {
    return (
      <div>
        <p>Sign in to see your passport</p>
        <button className="fill" onClick={openSignIn}>Sign in</button>
      </div>
    );
  }
  if (loading && !data) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>No data</p>;

  return (
    <>
      <PassportView
        key={data.user.id}
        data={{ ...data, followingCount: following.length }}
        isOwn
        lists={<ListsTab />}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <button className="fill sm" onClick={() => setEditOpen(true)}>Edit profile</button>
            <button className="sm" onClick={copyLink}>
              {copied ? "Link copied ✓" : "Copy link"}
            </button>
          </div>
        }
      />
      {editOpen && (
        <EditProfileModal
          initial={data.user}
          onClose={() => setEditOpen(false)}
          onSaved={() => window.location.reload()}
        />
      )}
    </>
  );
}