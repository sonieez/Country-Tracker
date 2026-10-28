type SignInModalProps = {
  open: boolean
  onClose: () => void
  onSignIn: () => void
}

export default function SignInModal({ open, onClose, onSignIn }: SignInModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="box w-full max-w-sm p-8 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-2 text-2xl font-bold">Sign in to StampZ</h2>
        <p className="mb-6 opacity-70">
          Stamp countries, build your wishlist and connect with other travelers.
        </p>
        <button className="fill w-full" onClick={onSignIn}>
          Continue with Google
        </button>
        <button className="mt-3 w-full opacity-70" onClick={onClose}>
          Not now
        </button>
      </div>
    </div>
  )
}