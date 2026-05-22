import { Suspense } from 'react'
import GoLiveContent from './GoLiveContent'

export default function GoLivePage({
  searchParams,
}: {
  searchParams: { gameId?: string }
}) {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <div className="w-8 h-8 border-2 border-[#F2871E]/30 border-t-[#F2871E] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    }>
      <GoLiveContent initialGameId={searchParams.gameId} />
    </Suspense>
  )
}
