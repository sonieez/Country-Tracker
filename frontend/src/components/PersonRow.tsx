import { Link } from "react-router-dom";
import FollowButton from "./FollowButton";
import type { Person } from "../context/FollowContext";

export default function PersonRow({ person }: { person: Person }) {
  return (
    <div className="box ppl">
      {person.profilePicture ? (
        <img className="av" src={person.profilePicture} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="av" />
      )}
      <Link className="n" to={`/users/${person.id}`}>
        {person.displayName ?? "Traveler"}
        {person.username && (
          <>
            <br />
            <small>@{person.username}</small>
          </>
        )}
      </Link>
      <FollowButton person={person} />
    </div>
  );
}