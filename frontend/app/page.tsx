import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      redirect('/auth')
    } else {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Error in root page:', error)
    redirect('/auth')
  }
}
