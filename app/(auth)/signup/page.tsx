import Link from 'next/link'
import { signup } from '../actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground mt-2">Get started with Delfyy</p>
      </div>

      {params.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
          {params.error}
        </div>
      )}

      <form className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground/80"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground/80"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 block w-full px-3 py-2 border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 8 characters
          </p>
        </div>

        <button
          formAction={signup}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
