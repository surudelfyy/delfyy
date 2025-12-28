import { logout } from '@/app/(auth)/actions'

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form>
          <button
            formAction={logout}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Logout
          </button>
        </form>
      </div>
      <p className="text-gray-600 mt-2">No decisions yet.</p>
    </div>
  )
}
