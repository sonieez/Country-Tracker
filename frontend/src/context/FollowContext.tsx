import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

export type Person = {
  id: string;
  displayName: string | null;
  username: string | null;
  profilePicture: string | null;
};

type FollowContextType = {
  following: Person[];
  isFollowing: (id: string) => boolean;
  toggleFollow: (person: Person) => Promise<void>;
};

const FollowContext = createContext<FollowContextType | null>(null);

export function FollowProvider({ children }: { children: ReactNode }) {
  const { user, openSignIn } = useAuth();
  const [following, setFollowing] = useState<Person[]>([]);

  useEffect(() => {
    let oldRequest = false;

    if (!user) {
      setFollowing([]);
      return;
    }

    async function loadFollowing() {
      try {
        const data = await api("/me/following");
        if (!oldRequest) {
          setFollowing(data);
        }
      } catch {
        // leave the list empty if loading fails
      }
    }
    loadFollowing();
    return () => { oldRequest = true; };
  }, [user]);

  function isFollowing(id: string) {
    return following.some((p) => p.id === id);
  }

  async function toggleFollow(person: Person) {
    if (!user) {
      openSignIn();
      return;
    }
    const wasFollowing = isFollowing(person.id);

    // optimistic update
    setFollowing((prev) =>
      wasFollowing ? prev.filter((p) => p.id !== person.id) : [person, ...prev]
    );

    try {
      await api(`/users/${person.id}/follow`, {
        method: wasFollowing ? "DELETE" : "PUT",
      });
    } catch {
      // roll back
      setFollowing((prev) =>
        wasFollowing ? [person, ...prev] : prev.filter((p) => p.id !== person.id)
      );
    }
  }

  return (
    <FollowContext.Provider value={{ following, isFollowing, toggleFollow }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be used inside FollowProvider");
  return ctx;
}