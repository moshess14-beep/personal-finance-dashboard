import MonthlySavingsCard from '../components/dashboard/MonthlySavingsCard'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">לוח בקרה</h1>
      <div className="max-w-xs">
        <MonthlySavingsCard />
      </div>
      <p className="text-sm text-slate-400">שאר הדשבורד בבנייה...</p>
    </div>
  )
}
