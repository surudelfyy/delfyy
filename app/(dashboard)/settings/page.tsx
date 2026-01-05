import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, PAID_CONTEXT_LIMIT } from '@/lib/subscription'
import { DefaultContextForm } from '@/components/default-context-form'
import { Page } from '@/components/layout/page'
import { Stack } from '@/components/layout/stack'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { H1, Muted } from '@/components/typography'

export const metadata = { title: 'Settings | Delfyy' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { isPaid, expiresAt } = await getUserSubscription(user.id)
  if (!isPaid) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_context')
    .eq('id', user.id)
    .single()

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A'

  return (
    <Page width="narrow">
      <Stack size={8}>
        <H1>Settings</H1>

        {/* Default Context */}
        <Card>
          <CardHeader>
            <CardTitle>Default Context</CardTitle>
            <CardDescription>
              <Muted>Automatically added to every decision</Muted>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DefaultContextForm
              initialContext={profile?.default_context || ''}
              limit={PAID_CONTEXT_LIMIT}
            />
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Delfyy Pro</p>
                <Muted>£85/year</Muted>
              </div>
              <Muted>Renews {formatDate(expiresAt)}</Muted>
            </div>
            <button
              disabled
              className="mt-4 text-sm text-muted-foreground cursor-not-allowed"
            >
              Manage billing → (coming soon)
            </button>
          </CardContent>
        </Card>
      </Stack>
    </Page>
  )
}
