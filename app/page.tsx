import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="fixed top-4 left-4">
        <Image
          src="/delfyylogo.svg"
          alt="Delfyy"
          width={120}
          height={22}
          style={{ height: 'auto' }}
          priority
        />
      </div>
      <div className="text-center space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          AskDelfyy
        </h1>
        <p className="text-zinc-400">Coming soon.</p>
      </div>
    </main>
  )
}
