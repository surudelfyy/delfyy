import Link from 'next/link'
import { signup } from '../actions'
import { Page } from '@/components/layout/page'
import { Stack } from '@/components/layout/stack'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { H1, Muted } from '@/components/typography'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <Page width="narrow" className="flex items-center justify-center">
      <Card className="w-full max-w-md p-6 space-y-6">
        <CardHeader className="p-0 text-center">
          <CardTitle>
            <H1>Create an account</H1>
          </CardTitle>
          <CardDescription>
            <Muted>Get started with Delfyy</Muted>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Stack size={4}>
            {params.error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-sm">
                {params.error}
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
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                  />
                  <span className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button formAction={signup} className="w-full sm:w-auto">
                    Create account
                  </Button>
                </div>
              </Stack>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </Stack>
        </CardContent>
      </Card>
    </Page>
  )
}
