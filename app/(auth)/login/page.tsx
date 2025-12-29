import Link from 'next/link'
import { login } from '../actions'
import { Page } from '@/components/layout/page'
import { Stack } from '@/components/layout/stack'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { H1, Muted } from '@/components/typography'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <Page width="narrow" className="flex items-center justify-center">
      <Card className="w-full max-w-md p-6 space-y-6">
        <CardHeader className="p-0 text-center">
          <CardTitle>
            <H1>Welcome back</H1>
          </CardTitle>
          <CardDescription>
            <Muted>Sign in to your account</Muted>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Stack size={4}>
            {params.error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {params.error}
              </div>
            )}

            {params.message && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                {params.message}
              </div>
            )}

            <form>
              <Stack size={4}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button formAction={login} className="w-full sm:w-auto">
                    Sign in
                  </Button>
                </div>
              </Stack>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </Stack>
        </CardContent>
      </Card>
    </Page>
  )
}
