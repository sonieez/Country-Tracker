import { useAuth } from "../context/AuthContext";
import { useFollow } from "../context/FollowContext";
import type { Person } from "../context/FollowContext";

export default function FollowButton({
  person,
  onChange,
}: {
  person: Person;
  onChange?: () => void;
}) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollow();

  if (user?.id === person.id) return null;

  const on = isFollowing(person.id);

  async function handleClick() {
    await toggleFollow(person);
    onChange?.();
  }

  return (
    <button className={"sm" + (on ? " on" : "")} onClick={handleClick}>
      {on ? "Following" : "Follow"}
    </button>
  );
}