// src/app/page.tsx
import { redirect } from 'next/navigation';

// This component will simply redirect any traffic from '/' to '/dashboard'
export default function RootPage() {
  redirect('/dashboard');
  // Note: In Next.js App Router, redirect() should be used outside of the return statement.
  // It will automatically handle the redirection server-side or client-side as appropriate.
  // No JSX needs to be returned here.
}