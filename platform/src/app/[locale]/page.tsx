import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function Home({ params }: { params: { locale: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { locale } = params;
  redirect(user ? `/${locale}/portal` : `/${locale}/login`);
}
