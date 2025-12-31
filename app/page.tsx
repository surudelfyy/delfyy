import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-white">
      <div className="fixed top-4 left-4">
        <Image
          src="/delfyylogo.svg"
          alt="Delfyy"
          width={140}
          height={50}
          priority
        />
      </div>
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold">AskDelfyy</h1>
        <p className="text-gray-600">Coming soon.</p>
      </div>
    </main>
  )
}