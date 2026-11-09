const steps = [
  { stamp: '+', cls: 'stamp add', title: 'Pick a country', text: 'Browse the list or the map and find a place.' },
  { stamp: 'FR', cls: 'stamp', title: 'Stamp it', text: 'Click once for Visited, again for Wishlist, a third time to clear.' },
  { stamp: 'JP', cls: 'stamp wish', title: 'Build your passport', text: 'Your stamps are saved to your profile.' },
]

const tech = ['React', 'TypeScript', 'Tailwind', 'Express', 'Prisma', 'Supabase']

export default function About() {
  return (
    <>
      <section className="box mt-4 p-8 text-center">
        <img
          src="/stampz-logo-artistic.svg"
          alt=""
          width={96}
          height={96}
          className="mx-auto mb-4"
        />
        <h1 className="text-3xl">About StampZ</h1>
        <p className="mx-auto mt-3 max-w-xl">
          Like Letterboxd, but for countries. Stamp the places you've visited,
          wishlist the ones you dream of, and build your own passport.
        </p>
      </section>

      <section className="box mt-4 p-6">
        <h2 className="s">How it works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="flex flex-col items-center gap-3 text-center">
              <span className={s.cls}>{s.stamp}</span>
              <b>{s.title}</b>
              <small>{s.text}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="box mt-4 p-6 text-center">
        <h2 className="s">Built with</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {tech.map((t) => (
            <span
              key={t}
              className="rounded-full px-4 py-1"
              style={{ border: '1px solid var(--stamp)', color: 'var(--stamp)' }}
            >
              {t}
            </span>
          ))}
        </div>
        <a
          href="https://github.com/sonieez/Country-Tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full px-6 py-2 font-medium"
          style={{ background: 'var(--btn)', color: 'var(--card)', textDecoration: 'none' }}
        >
          View on GitHub
        </a>
      </section>
    </>
  )
}