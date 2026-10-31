// page.tsx
import { Suspense } from 'react'
import CompleteClient from './CompleteClient'


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteClient />
    </Suspense>
  )
}