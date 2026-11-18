
type Props = {
  value: number;
  onChange?: (n: number) => void;
};

export default function RatingDots({value, onChange}: Props) {

  return(
    <div className={onChange ? "dots" : "dots s"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} of 5`}
          className={n <= value ? "dot on" : "dot"}
          onClick={ () => onChange?.(n) }
        />
      ))}
    </div>
  )
}