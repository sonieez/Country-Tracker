import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Props = {
  initial: {
    displayName: string | null;
    username: string | null;
    profilePicture: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
};

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export default function EditProfileModal({ initial, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.profilePicture);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (picked.size > MAX_SIZE) {
      setError("Image must be smaller than 2 MB");
      return;
    }
    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      let profilePicture = initial.profilePicture;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        profilePicture = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      await api("/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username: username.trim() === "" ? null : username,
          profilePicture,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center",
        padding: 16, background: "rgba(30,21,48,.55)",
      }}
    >
      <form
        className="box"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{ width: "100%", maxWidth: 420, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <h2 style={{ fontSize: 22 }}>Edit profile</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="photo" style={{
            width: 72, height: 90, border: "1.5px solid var(--line)", borderRadius: 6,
            background: "var(--soft)", overflow: "hidden", display: "grid", placeItems: "center", flex: "none",
          }}>
            {preview ? (
              <img src={preview} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <b>{(displayName || "?").charAt(0).toUpperCase()}</b>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <small style={{ display: "block", color: "var(--muted)", marginBottom: 8 }}>
              Profile photo (max 2 MB)
            </small>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: "none" }}
            />
            <button type="button" className="sm" onClick={() => fileRef.current?.click()}>
              Choose photo
            </button>
            <small
              style={{
                display: "block", marginTop: 6, color: "var(--muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220,
              }}
            >
              {file ? file.name : "No file chosen"}
            </small>
          </div>
        </div>

        <label>
          <small style={{ color: "var(--muted)" }}>Name</small>
          <input
            className="search" style={{ maxWidth: "none" }}
            value={displayName} maxLength={40}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label>
          <small style={{ color: "var(--muted)" }}>Username (a-z, 0-9, _)</small>
          <input
            className="search" style={{ maxWidth: "none" }}
            value={username} maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. traveler_az"
          />
        </label>

        {error && <p className="lerr">{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="fill" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}