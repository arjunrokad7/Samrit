import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Auth';
import { PublicFooter } from './PublicLinks';
import { ui } from './design';

const sources = {
  ny: 'https://www.nysenate.gov/legislation/laws/AGM/71-Z',
  federal: 'https://www.govinfo.gov/content/pkg/USCODE-2023-title42/pdf/USCODE-2023-title42-chap13A-sec1791.pdf',
  safety: 'https://home4.nyc.gov/site/doh/business/food-operators/self-inspection-checklist-temporary-events.page',
  state: 'https://www.health.ny.gov/environmental/indoors/food_safety/regs.htm',
  donation: 'https://www.nyc.gov/assets/donate/site/DonateFood/Aboutabout',
};

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="font-semibold text-samrita-teal underline underline-offset-4">{children}</a>;
}

export default function Legal({ regulations = false }: { regulations?: boolean }) {
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [regulations]);
  const title = regulations ? 'Food Donation Regulations' : 'Terms and Conditions';
  return <div className="min-h-screen bg-slate-50 text-samrita-charcoal">
    <nav className={ui('sr-public-nav')} aria-label="Main navigation"><Brand /><div><Link to="/">Home</Link><Link to="/consumer" className={ui('sr-button sr-small')}>Find a meal</Link></div></nav>
    <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <span className={ui('sr-eyebrow')}>A SHARED TABLE, SHARED RESPONSIBILITY</span>
      <h1 className="mt-4 text-4xl md:text-6xl">{title}</h1>
      <p className="mt-5 text-sm text-slate-600">Updated October 24, 2026 · New York City / New York State</p>
      <aside className="my-8 rounded-2xl border border-samrita-teal/30 bg-white p-5 text-sm leading-relaxed">
        {regulations ? 'General information, not legal advice or a food-safety certification. Protections depend on the facts and applicable law; follow your local health department’s requirements.' : 'Draft terms for this hackathon prototype. Operator and legal review are required before public launch. By using our site, you agree to these Terms and Conditions, subject to applicable law.'}
      </aside>
      <div className="space-y-8 text-sm leading-7 [&_h2]:mb-3 [&_h2]:text-2xl [&_section]:rounded-2xl [&_section]:border [&_section]:border-slate-200 [&_section]:bg-white [&_section]:p-6">
        {regulations ? <>
          <section><h2>New York’s food donation protection</h2><p>New York Agriculture &amp; Markets Law §71-z protects qualifying good-faith donors giving apparently fit food to bona fide charities or nonprofits for free distribution. Donors must reasonably inspect it and find it fit. Protection does not apply where the donor knows, or should know, it is contaminated or harmful. The law preserves agencies’ authority to regulate or prohibit food use. Charities organizing or sponsoring gleaning must provide liability insurance for participants.</p><Source href={sources.ny}>Read NY Agriculture &amp; Markets Law §71-z</Source></section>
          <section><h2>Federal Good Samaritan protections</h2><p>The Bill Emerson Good Samaritan Food Donation Act, 42 U.S.C. §1791, as amended in 2023, covers qualifying good-faith donations to nonprofits and nonprofit distribution to people in need at no cost or a qualifying reduced price. Certain qualified direct donors may also donate directly at no cost. Eligibility and conditions matter: this is not blanket immunity for everyone using Samrit. Gross negligence and intentional misconduct are excluded; food generally must meet applicable quality and labeling standards.</p><Source href={sources.federal}>Read the federal statute, including the 2023 amendments</Source></section>
          <section><h2>Food safety still comes first</h2><p>Donation protections do not replace permits, training, inspection, or safe handling. New York State’s Part 14 regulations cover different food-service operations; local requirements also apply. Confirm the rules for your facility and activity with the relevant health department.</p><Source href={sources.state}>New York State food-service regulations</Source><p className="mt-4">For NYC temporary-event operations, the Health Department’s checklist specifies cold holding at 41°F or below and hot holding at 140°F or above for temperature-controlled foods. These are holding temperatures, not cooking or cooling instructions. Follow the full requirements for your operation, including approved sources, hygiene and protection from contamination.</p><Source href={sources.safety}>NYC temporary-event food-safety checklist</Source></section>
          <section><h2>Before every handoff</h2><p>Share ingredients, the nine major allergens, cross-contact risks, preparation and storage information. Use suitable packaging and transport equipment; check food condition and temperatures at receipt. Reject food with uncertain safety or contamination. Keep handling and handoff records. Dietary filters, photos, QR scans and GPS records cannot certify food safety or guarantee an allergen-free meal.</p><Source href={sources.donation}>NYC donateNYC food donation guidance</Source></section>
          <section><h2>Your rights remain</h2><p>Samrit cannot grant statutory immunity, waive health requirements, or decide whether a particular donation qualifies. People seeking food retain their rights under applicable law. Review our <Link className="text-samrita-teal underline" to="/terms">Terms and Conditions</Link> for platform responsibilities and liability limits.</p></section>
        </> : <>
          <section><h2>1. Using Samrit</h2><p>Samrit helps people discover community meals and helps donors, centers and volunteer drivers coordinate donations. Use it lawfully, respectfully and with accurate information. Do not impersonate others, misuse personal information, interfere with the service, or post unsafe or misleading listings. Finding a meal does not require an account.</p></section>
          <section><h2>2. Availability and prototype limitations</h2><p>The current public meal finder contains fictional sample locations and meals, not live availability. Do not travel to a sample location expecting service. In a live service, confirm opening times, eligibility, ingredients and availability directly with the provider. Listings do not guarantee a meal, reservation, transport or service continuity.</p></section>
          <section><h2>3. Participant responsibilities</h2><p>Donors must provide accurate food, ingredient, allergen, storage and pickup information and offer only food suitable for donation. Centers must assess receiving conditions, storage capacity and safe distribution. Drivers must follow agreed pickup instructions and maintain safe transport conditions. Each participant remains responsible for their own conduct, permits and applicable food-safety duties. Do not proceed with an unsafe handoff.</p></section>
          <section><h2>4. Ingredients, allergies and safety concerns</h2><p>Filters and dietary notes are informational and cannot guarantee that food is suitable for an allergy or dietary need. Ask the provider about ingredients and cross-contact before accepting food. Do not consume food you suspect is unsafe. Report concerns directly to the provider and, where appropriate, the local health department. Platform photos and handoff records are not safety inspections.</p></section>
          <section><h2>5. Accounts and shared information</h2><p>Keep credentials private and submit only information you are authorized to share. Authorized workflow participants may see information you provide for coordination, including contact details, handoff photographs and location records. Avoid including recipients’ faces or sensitive personal information in uploads. A complete privacy policy and data-retention process must be established before public launch.</p></section>
          <section><h2>6. Liability limits and limited release</h2><p>To the extent permitted by law, you release Samrit’s operators from claims arising solely from independent third-party participants’ acts, omissions or inaccurate listings, where Samrit’s operators did not cause or contribute to the harm. No term excludes responsibility for the operators’ own negligence, gross negligence or intentional misconduct, or limits non-waivable consumer or other legal rights. This is not a blanket waiver of food-related injury claims, a food-safety guarantee, or a grant of statutory immunity.</p><p className="mt-3">Donation protections depend on statutory eligibility and conduct. Read our <Link className="text-samrita-teal underline" to="/regulations">Food Donation Regulations</Link> page and the linked official laws.</p></section>
          <section><h2>7. Service changes and questions</h2><p>Unsafe or abusive use may lead to removal of listings or restriction of an account. Features and these draft terms may change; the updated date identifies this version. Before a public launch, the operator must publish its legal identity, contact channel, privacy policy and final reviewed terms. This draft does not impose arbitration or waive access to courts.</p></section>
        </>}
      </div>
      <Link to="/consumer" className={`${ui('sr-button')} mt-10`}>Find a meal</Link>
    </main>
    <PublicFooter />
  </div>;
}
