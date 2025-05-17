import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import Link from "next/link"

import data from "./data.json"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link 
          href="/dashboard/transcripts" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          View Transcripts
        </Link>
      </div>
      <SectionCards />
      <div>
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  )
}
