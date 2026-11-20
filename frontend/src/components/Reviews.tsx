import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import RatingDots from "./RatingDots";

type Review = {
  userId: string;
  rating: number;
  text: string;
  createdAt: string;
  user: { displayName: string | null; profilePicture: string | null };
};

type ReviewsData = {
  reviews: Review[];
  average: number | null;
  count: number;
};

export default function Reviews({ code, onReviewsChanged }: { code: string; onReviewsChanged?: () => void }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { user, openSignIn } = useAuth();

  const myReview = data?.reviews.find((r) => r.userId === user?.id)

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setText(myReview?.text ?? "");
  }, [myReview]);

  async function handleSubmit() {
    if (!user) {
      openSignIn();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try{
      await api(`/countries/${code}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });
      setReloadKey((k) => k + 1);
      onReviewsChanged?.();
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong");
      }    
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setSubmitError(null);
    try{
      await api(`/countries/${code}/review`, { method:  "DELETE"})
      setReloadKey((k) => k + 1);
      onReviewsChanged?.();
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong");
      } 
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    let oldRequest = false;

    if (!code) return;

    async function getReview() {
      setLoading(true);
      try{
        setError(null);
        const response = await api(`/countries/${code}/reviews`);
        if(!oldRequest){
          setData(response);
        }
      } catch(err) {
        if (!oldRequest) {  
          if (err instanceof Error){
            setError(err.message);
          } else {
            setError("Something went wrong")
          }
        }
      } finally {
        if (!oldRequest) {
          setLoading(false);
        }
      }
    }
    getReview();
    return () => {oldRequest = true;}
  }, [code, reloadKey]);

  return(
    <div>
      <div className="hd"><h2>Reviews · {data?.count ?? 0}</h2></div>
      <section className="box rv">
        <div className="row" style={{ justifyContent: "flex-start", gap: 14 }}>
          <b>Your rating:</b>
          <RatingDots value={rating} onChange={setRating} />
        </div>
        <b>Your review:</b>
        <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "flex-end" }}>
          <textarea
            placeholder="What was it like?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
          <button className="fill" onClick={handleSubmit} disabled={submitting || rating === 0}>
            {myReview ? "Update" : "Post"}
          </button>
          {myReview && <button onClick={handleDelete} disabled={submitting}>Delete</button>}
        </div>
        {submitError && <p>{submitError}</p>}
      </section>
      {loading ? <p>Loading...</p>
        : error ? <p>{error}</p>
        : !data || data.reviews.length === 0 ? <p>No reviews yet. Be the first!</p>
        : data.reviews.map((review) => (
            <section className="box rv" key={review.userId}>
              <div className="row">
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {review.user.profilePicture ? (
                    <img className="av" src={review.user.profilePicture} alt="" />
                  ) : (
                    <span className="av" />
                  )}
                  <b>{review.user.displayName ?? "Anonymous"}</b>
                </span>
                <RatingDots value={review.rating} />
              </div>
              {review.text && <p>{review.text}</p>}
              <small style={{ color: "var(--muted)" }}>
                {new Date(review.createdAt).toLocaleDateString()}
              </small>
            </section>
          ))}
    </div>
    
  )
}