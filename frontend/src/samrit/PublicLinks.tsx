import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, ShieldCheck } from 'lucide-react';
import { Brand } from './Auth';

export function TermsNotice({ className = '' }: { className?: string }) {
  return <p className={`text-[11px] leading-relaxed text-slate-600 ${className}`}>
    By using our site, you agree to our{' '}
    <Link to="/terms" className="font-semibold text-samrita-teal underline underline-offset-2">Terms and Conditions</Link>.
  </p>;
}

export function PublicFooter({ showResources = false }: { showResources?: boolean }) {
  return <>
    {showResources && <section aria-label="Terms and food donation guidance" className="mx-auto grid max-w-7xl gap-5 px-6 pb-16 md:grid-cols-2 md:px-12">
      <Link to="/terms" className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-samrita-teal">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-samrita-teal text-white"><BookOpen size={23} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-2xl">Terms and Conditions</h2><p className="mt-2 text-sm text-slate-600">How Samrit works, participant responsibilities, and the limits of our liability terms.</p></div><ArrowUpRight size={20} />
      </Link>
      <Link to="/regulations" className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-samrita-teal">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-samrita-spruce text-white"><ShieldCheck size={23} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-2xl">Food Donation Regulations</h2><p className="mt-2 text-sm text-slate-600">New York protections, federal Good Samaritan law, and food-safety responsibilities.</p></div><ArrowUpRight size={20} />
      </Link>
    </section>}
    <footer className="border-t border-samrita-iron bg-samrita-charcoal px-6 py-7 text-white md:px-12">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-10 gap-y-5">
        <Brand light />
        <div><p className="text-sm text-white">A place at the table. A community behind it.</p><nav aria-label="Footer links" className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/90"><Link to="/consumer" className="underline-offset-4 hover:underline">Meal finder</Link><Link to="/terms" className="underline-offset-4 hover:underline">Terms and Conditions</Link><Link to="/regulations" className="underline-offset-4 hover:underline">Food Donation Regulations</Link></nav></div>
        <small className="text-xs text-white/80">© {new Date().getFullYear()} Samrit</small>
      </div>
    </footer>
  </>;
}
