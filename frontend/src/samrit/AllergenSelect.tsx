import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { ALLERGENS } from './api';

export default function AllergenSelect({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const filtered = ALLERGENS.filter((item) => item.toLowerCase().includes(search.toLowerCase()));
  return <div ref={root} className="relative my-4" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }}>
    <span id={`${id}-label`} className="mb-2 block text-xs font-medium text-samrita-iron">Select your allergens</span>
    <div className="flex min-h-14 items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:ring-2 focus-within:ring-samrita-teal">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {value.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-xl bg-samrita-teal/10 pl-3 text-xs font-medium text-samrita-charcoal">{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(value.filter((selected) => selected !== item))} className="rounded-xl p-2 hover:bg-samrita-teal/15"><X size={14} /></button></span>)}
        <button ref={trigger} type="button" aria-label="Select your allergens" aria-expanded={open} aria-controls={`${id}-options`} onClick={() => setOpen(!open)} className="min-h-9 flex-1 rounded-xl px-2 text-left text-sm text-slate-600">{value.length ? 'Add allergens' : 'Show all allergens'}</button>
      </div>
      <button type="button" aria-label={open ? 'Close allergen options' : 'Open allergen options'} aria-expanded={open} aria-controls={`${id}-options`} onClick={() => setOpen(!open)} className="shrink-0 rounded-xl p-2 text-samrita-teal"><ChevronDown size={18} className={open ? 'rotate-180' : ''} /></button>
    </div>
    {open && <div id={`${id}-options`} role="group" aria-labelledby={`${id}-label`} className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-500" /><input autoFocus aria-label="Search allergens" placeholder="Search allergens…" value={search} onChange={(event) => setSearch(event.target.value)} className="!py-3 !pl-9" /></div>
      <label onMouseDown={(event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }} className="!my-2 !flex-row !items-center border-b border-slate-100 px-2 py-3"><input type="checkbox" checked={value.length === ALLERGENS.length} ref={(node) => { if (node) node.indeterminate = value.length > 0 && value.length < ALLERGENS.length; }} onChange={() => onChange(value.length === ALLERGENS.length ? [] : [...ALLERGENS])} />Select all allergens</label>
      <div className="max-h-56 overflow-y-auto">
        {filtered.map((item) => <label key={item} onMouseDown={(event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }} className="!my-0 !flex-row !items-center rounded-xl px-2 py-3 hover:bg-slate-50"><input type="checkbox" checked={value.includes(item)} onChange={() => onChange(value.includes(item) ? value.filter((selected) => selected !== item) : [...value, item])} />{item}</label>)}
        {!filtered.length && <p className="p-3 text-sm text-slate-500">No matching allergens.</p>}
      </div>
    </div>}
  </div>;
}
