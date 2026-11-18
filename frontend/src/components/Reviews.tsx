import { useEffect, useState } from "react";
import { api } from "../lib/api";
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

export default function Reviews({ code }: { code: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


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
  }, [code]);

  return(
    <div>
      <div className="hd"><h2>Reviews · {data?.count ?? 0}</h2></div>
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