import { logout } from '@/app/(auth)/actions'
import { Page } from '@/components/layout/page'
import { Stack } from '@/components/layout/stack'
import { Inline } from '@/components/layout/inline'
import { SectionTitle } from '@/components/layout/section-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { H1, Muted } from '@/components/typography'

export default function DashboardPage() {
  return (
    <Page width="narrow">
      <Inline className="justify-between">
        <H1>Dashboard</H1>
        <form>
          <Button formAction={logout} variant="secondary" size="sm">
            Logout
          </Button>
        </form>
      </Inline>

      <Stack size={6}>
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0">
            <CardTitle>
              <SectionTitle>Recent decisions</SectionTitle>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Muted>No decisions yet. Create your first decision to see it here.</Muted>
          </CardContent>
        </Card>
      </Stack>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button>New decision</Button>
      </div>
    </Page>
  )
}
