import { Logo } from '@/components/logo'

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background">
      <div className="fixed top-4 left-4">
        <Logo width={120} className="text-foreground" />
      </div>
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">AskDelfyy</h1>
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </main>
  )
}
