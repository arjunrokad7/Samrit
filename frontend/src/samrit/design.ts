// Samrit's shared Tailwind recipes. sr-* tokens remain useful DOM hooks, but
// all visual styling comes from these utilities and tailwind.config.js.
const recipes: Record<string, string> = {
  "sr-design":
    "min-h-screen bg-slate-50 font-body text-samrita-charcoal antialiased selection:bg-samrita-teal selection:text-white [&_h1]:font-display [&_h1]:font-normal [&_h1]:tracking-normal [&_h2]:font-display [&_h2]:font-normal [&_h2]:tracking-normal [&_h3]:font-display [&_h3]:font-normal [&_h3]:tracking-normal [&_h4]:font-display [&_h4]:font-normal [&_h4]:tracking-normal [&_p]:leading-relaxed [&_small]:leading-relaxed [&_svg]:shrink-0 [&_button]:transition [&_button]:duration-150 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-samrita-teal [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-samrita-teal [&_label]:my-4 [&_label]:flex [&_label]:flex-col [&_label]:gap-2 [&_label]:text-xs [&_label]:font-medium [&_label]:text-samrita-iron [&_input:not([type=checkbox]):not([type=file])]:w-full [&_input:not([type=checkbox]):not([type=file])]:min-w-0 [&_input:not([type=checkbox]):not([type=file])]:rounded-2xl [&_input:not([type=checkbox]):not([type=file])]:border [&_input:not([type=checkbox]):not([type=file])]:border-slate-300 [&_input:not([type=checkbox]):not([type=file])]:bg-white [&_input:not([type=checkbox]):not([type=file])]:px-4 [&_input:not([type=checkbox]):not([type=file])]:py-3 [&_input:not([type=checkbox]):not([type=file])]:text-sm [&_input]:accent-samrita-fern [&_input:focus]:outline-samrita-teal [&_select]:w-full [&_select]:min-w-0 [&_select]:rounded-2xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_select]:text-sm [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-2xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm [&_input[type=checkbox]]:h-4 [&_input[type=checkbox]]:w-4 [&_input[type=checkbox]]:shrink-0 motion-reduce:[&_*]:!transition-none motion-reduce:[&_*]:!animate-none",
  "sr-brand":
    "relative block h-[72px] w-[148px] shrink-0 overflow-hidden [&>img]:absolute [&>img]:-left-[17px] [&>img]:-top-[16px] [&>img]:w-[186px] [&>img]:max-w-none",
  "sr-eyebrow":
    "inline-flex items-center gap-2 text-[10px] font-bold uppercase leading-relaxed tracking-[0.16em] text-samrita-teal",
  "sr-live-dot":
    "mr-2 inline-block h-2 w-2 shrink-0 rounded-full bg-samrita-fern",
  "sr-button":
    "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-2xl border border-samrita-spruce bg-samrita-fern px-5 py-3 text-sm font-semibold leading-normal text-white shadow-stacked shadow-samrita-spruce hover:-translate-y-0.5 hover:bg-samrita-spruce active:translate-y-1 active:shadow-none disabled:transform-none",
  "sr-secondary":
    "!border-slate-300 !bg-white !text-samrita-charcoal !shadow-stacked-sm !shadow-slate-300 hover:!bg-slate-100",
  "sr-small": "!gap-2 !px-4 !py-2.5 !text-xs",
  "sr-wide": "w-full",
  "sr-text-link":
    "inline-flex items-center gap-2 bg-transparent p-0 text-xs font-semibold text-samrita-teal underline-offset-4 hover:underline",
  "sr-icon-button":
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-transparent p-2 text-samrita-charcoal hover:bg-slate-100",
  "sr-muted": "text-xs text-slate-600",
  "sr-icon-box":
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-samrita-teal text-white",
  coral: "!bg-samrita-fern !text-white",
  "sr-green": "text-samrita-spruce",
  "sr-coral": "text-amber-800",
  "sr-public-nav":
    "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 md:px-12 [&>div]:flex [&>div]:items-center [&>div]:gap-5 md:[&>div]:gap-8 [&_a:not(.sr-brand)]:inline-flex [&_a:not(.sr-brand)]:items-center [&_a:not(.sr-brand)]:gap-2 [&_a:not(.sr-brand)]:text-xs max-sm:[&>div>a:first-child]:hidden",
  "sr-landing": "bg-slate-50",
  "sr-hero":
    "mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 overflow-hidden px-6 pb-16 pt-8 md:grid-cols-2 md:gap-8 md:px-12 md:pb-24 md:pt-14 [&_h1]:mb-6 [&_h1]:mt-5 [&_h1]:text-[3.3rem] [&_h1]:leading-[1.04] md:[&_h1]:text-[4.1rem] xl:[&_h1]:text-[4.8rem] [&_h1_em]:not-italic [&_h1_em]:text-samrita-teal [&>div>p]:max-w-md [&>div>p]:text-sm [&>div>p]:text-slate-600",
  "sr-hero-actions":
    "mt-8 flex flex-wrap items-center gap-6 [&>.sr-text-link]:text-xs",
  "sr-region":
    "mt-10 flex flex-wrap items-center gap-2 text-xs text-slate-600 [&>span]:ml-1 [&>span]:border-l [&>span]:border-slate-300 [&>span]:pl-3",
  "sr-hero-visual":
    "relative mx-auto flex min-h-[420px] w-full max-w-[520px] items-center justify-center lg:min-h-[490px]",
  "sr-orbit":
    "absolute h-[340px] w-[340px] rounded-full border border-dashed border-samrita-teal/30 sm:h-[380px] sm:w-[380px]",
  "sr-orbit-one": "rotate-12",
  "sr-orbit-two":
    "!h-[400px] !w-[400px] -rotate-12 max-sm:!h-[360px] max-sm:!w-[360px]",
  "sr-food-illustration":
    "relative flex h-[310px] w-[300px] -rotate-6 items-center justify-center rounded-[3rem] bg-samrita-teal text-white shadow-stacked shadow-samrita-charcoal sm:h-[350px] sm:w-[340px]",
  "sr-plate-caption":
    "absolute bottom-5 left-0 w-full rotate-6 text-center font-display text-xl text-white",
  "sr-floating":
    "absolute z-10 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold text-samrita-charcoal shadow-stacked-sm shadow-slate-300 [&_small]:mt-1 [&_small]:block [&_small]:text-[10px] [&_small]:font-normal [&_small]:text-slate-600",
  "sr-floating-one": "left-0 top-7 -rotate-3 sm:top-10",
  "sr-floating-two":
    "bottom-5 right-0 rotate-3 sm:bottom-10 [&>svg]:text-samrita-teal",
  "sr-visual-caption":
    "absolute -bottom-6 text-[9px] font-bold tracking-[0.22em] text-samrita-teal",
  "sr-principles":
    "grid grid-cols-2 gap-5 border-y border-slate-200 bg-white px-6 py-6 md:flex md:justify-center md:gap-9 [&>span]:flex [&>span]:items-center [&>span]:gap-3 [&>span]:text-[11px] [&>span]:text-samrita-iron [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-samrita-teal",
  "sr-how": "mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20",
  "sr-section-heading":
    "mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end [&_h2]:mt-4 [&_h2]:text-4xl [&_h2]:leading-tight [&>p]:text-sm [&>p]:text-slate-600",
  "sr-face-grid": "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4",
  "sr-face-card":
    "flex flex-col items-start gap-5 rounded-2xl bg-samrita-teal p-7 text-white shadow-stacked shadow-samrita-charcoal transition-transform hover:-translate-y-1 [&:nth-child(2)]:bg-samrita-fern [&:nth-child(2)]:shadow-samrita-spruce [&:nth-child(3)]:bg-samrita-charcoal [&:nth-child(3)]:shadow-samrita-iron [&:nth-child(4)]:bg-samrita-spruce [&:nth-child(4)]:shadow-samrita-iron [&_.sr-eyebrow]:!text-white/90 [&_.sr-eyebrow]:!text-[9px] [&_.sr-eyebrow]:!tracking-[0.1em] [&_h3]:text-2xl [&_p]:flex-1 [&_p]:text-sm [&_p]:text-white/90 [&>svg:last-child]:self-end",
  "sr-bottom-cta":
    "relative mx-6 mb-16 rounded-2xl bg-samrita-spruce p-8 text-white shadow-stacked shadow-samrita-iron md:mx-auto md:max-w-[1184px] md:p-12 [&>.sr-eyebrow]:!text-white/90 [&_h2]:my-5 [&_h2]:text-4xl md:[&_h2]:text-5xl [&>.sr-button]:bg-white [&>.sr-button]:text-samrita-spruce [&>.sr-button]:shadow-samrita-charcoal md:[&>.sr-button]:absolute md:[&>.sr-button]:right-12 md:[&>.sr-button]:top-1/2 md:[&>.sr-button]:-translate-y-1/2",
  "sr-footer":
    "flex flex-wrap items-center justify-between gap-5 border-t border-samrita-iron bg-samrita-charcoal px-6 py-5 text-xs text-white md:px-12 [&>span]:text-white/90 max-sm:[&>span:nth-child(2)]:hidden",
  "sr-auth": "grid min-h-screen grid-cols-1 md:grid-cols-[45%_55%]",
  "sr-auth-story":
    "hidden flex-col items-start bg-samrita-teal p-10 text-white md:flex xl:px-16 [&>.sr-eyebrow]:mt-24 [&>.sr-eyebrow]:!text-white/90 [&_h1]:my-6 [&_h1]:text-[3.2rem] [&_h1]:leading-tight [&>p]:max-w-sm [&>p]:text-sm [&>p]:text-white/90 [&>.sr-muted]:mt-8 [&>.sr-muted]:!text-white/80",
  "sr-auth-proof":
    "mt-auto flex gap-4 pt-16 text-sm text-white [&_small]:mt-2 [&_small]:block [&_small]:text-xs [&_small]:text-white/85",
  "sr-auth-main": "flex min-h-screen flex-col px-7 py-8 md:px-12 xl:px-16",
  "sr-back": "text-xs text-samrita-teal hover:underline",
  "sr-auth-form":
    "m-auto w-full max-w-[410px] py-10 [&_h2]:my-3 [&_h2]:text-4xl [&>p]:mb-6 [&>p]:text-sm [&>p]:text-slate-600 [&>p:last-of-type]:mt-7 [&_p>a]:inline-flex [&_p>a]:items-center [&_p>a]:font-semibold [&_p>a]:text-samrita-teal",
  "sr-workspace": "flex min-h-screen",
  "sr-sidebar":
    "fixed inset-y-0 left-0 z-30 flex w-[244px] -translate-x-full flex-col border-r border-samrita-charcoal bg-samrita-charcoal px-5 pb-5 pt-5 text-white transition-transform min-[701px]:translate-x-0 [&_.sr-brand]:ml-1 [&_.sr-icon-button]:!text-white",
  "is-open": "!translate-x-0",
  "sr-workspace-label":
    "mb-7 ml-1 mt-1 text-[8px] font-semibold tracking-[0.15em] text-white/80",
  "sr-role-card":
    "flex items-center gap-3 rounded-2xl bg-samrita-teal p-3 text-white shadow-stacked-sm shadow-samrita-iron [&_strong]:block [&_strong]:max-w-[145px] [&_strong]:truncate [&_strong]:text-xs [&_small]:text-[10px] [&_small]:text-white/85",
  "sr-avatar":
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-samrita-fern text-xs font-semibold text-white",
  "sr-avatar-small": "!h-8 !w-8",
  "sr-nav-label":
    "mb-3 ml-3 mt-9 text-[9px] font-semibold tracking-widest text-white/75",
  "sr-sidebar-bottom":
    "mt-auto pt-7 [&>a]:flex [&>a]:items-center [&>a]:gap-3 [&>a]:px-3 [&>a]:py-3 [&>a]:text-xs [&>a]:text-white/90 [&>button]:flex [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-2xl [&>button]:bg-transparent [&>button]:px-3 [&>button]:py-3 [&>button]:text-xs [&>button]:text-white/90",
  "sr-community-note":
    "flex flex-col gap-3 rounded-2xl bg-samrita-spruce p-5 text-white shadow-stacked-sm shadow-samrita-iron [&_strong]:font-display [&_strong]:text-xl [&_strong]:font-normal [&_strong]:leading-snug [&_small]:text-xs [&_small]:text-white/85",
  "sr-nav-dot": "ml-auto h-1.5 w-1.5 rounded-full bg-white",
  "sr-workspace-main":
    "w-full min-w-0 min-[701px]:ml-[244px] min-[701px]:w-[calc(100%-244px)]",
  "sr-topbar":
    "flex h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 text-xs text-slate-600 md:px-8 [&>span]:flex [&>span]:items-center [&>div]:flex [&>div]:items-center [&>div]:gap-2 max-md:[&>div>span:not(.sr-avatar)]:hidden",
  "sr-topbar-divider": "mx-3 text-slate-300",
  "sr-content": "mx-auto max-w-[1600px] px-5 pt-8 md:px-8 xl:px-10",
  "sr-page-heading":
    "mb-8 flex items-center justify-between gap-5 max-sm:items-start [&_h1]:mt-2 [&_h1]:text-[1.9rem] [&_h1]:leading-tight md:[&_h1]:text-[2.3rem] [&_p]:mt-2 [&_p]:text-sm [&_p]:text-slate-600 [&>.sr-button]:shrink-0 max-sm:[&>.sr-button]:!gap-0 max-sm:[&>.sr-button]:!p-3 max-sm:[&>.sr-button]:!text-[0px]",
  "sr-panel":
    "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 md:p-6 [&_h2]:mb-3 [&_h2]:mt-2 [&_h2]:text-3xl [&_h2]:leading-tight [&_h3]:text-2xl [&_h3]:leading-tight [&>p]:mb-5 [&>p]:mt-3 [&>p]:text-sm [&>p]:text-slate-600 [&_small]:text-xs [&_small]:text-slate-600",
  "sr-panel-heading":
    "mb-5 flex items-center justify-between gap-4 [&_h2]:text-3xl [&_h3]:mt-1 [&_h3]:text-2xl [&>span]:text-xs [&>span]:text-slate-600",
  "sr-stack": "flex flex-col gap-6",
  "sr-two-col":
    "grid grid-cols-1 gap-6 min-[1100px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
  "sr-fit": "self-start",
  "sr-overview-cols":
    "min-[1100px]:!grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]",
  "sr-stats":
    "mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4 [&>div]:rounded-2xl [&>div]:border [&>div]:border-slate-200 [&>div]:bg-white [&>div]:p-5 [&>div>span]:text-[9px] [&>div>span]:font-bold [&>div>span]:tracking-[0.12em] [&>div>span]:text-samrita-teal [&_strong]:mb-2 [&_strong]:mt-4 [&_strong]:flex [&_strong]:items-center [&_strong]:justify-between [&_strong]:font-display [&_strong]:text-4xl [&_strong]:font-normal [&_strong_svg]:w-6 [&_strong_svg]:text-samrita-fern [&_small]:text-[11px] [&_small]:text-slate-600",
  "sr-next-step":
    "!relative !min-h-[340px] !overflow-hidden !border-samrita-teal !bg-samrita-teal !text-white !shadow-stacked !shadow-samrita-charcoal [&>.sr-eyebrow]:!text-white/85 [&>h2]:!my-5 [&>h2]:max-w-sm [&>h2]:!text-4xl [&>p]:!text-white/90 [&>.sr-button]:relative [&>.sr-button]:z-10 [&>.sr-button]:mt-3 [&>.sr-button]:!bg-white [&>.sr-button]:!text-samrita-charcoal [&>.sr-button]:!shadow-samrita-charcoal",
  "sr-next-step-art":
    "absolute -bottom-2 right-4 flex -rotate-12 items-center gap-5 text-white/15",
  "sr-map":
    "relative h-[330px] min-h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 [&_.leaflet-container]:font-body",
  "sr-map-offline":
    "pointer-events-none absolute bottom-6 left-3 right-3 z-[1000] rounded-xl border border-slate-200 bg-white/95 p-3 text-[10px] text-samrita-iron",
  "sr-map-legend":
    "mt-4 flex flex-wrap items-center gap-5 text-[10px] text-samrita-teal [&>span:nth-child(2)]:text-samrita-fern",
  "sr-section-space": "mt-9",
  "sr-card-grid":
    "grid grid-cols-1 gap-5 md:grid-cols-2 min-[1350px]:grid-cols-3",
  "sr-batch":
    "min-w-0 rounded-2xl border border-slate-200 bg-white p-6 [&_h3]:break-words [&_h3]:text-2xl [&_h3]:leading-tight [&>p]:my-3 [&>p]:text-xs [&>p]:text-slate-600",
  "sr-batch-top":
    "mb-5 flex items-center justify-between gap-2 [&>.sr-eyebrow]:text-[9px] [&>.sr-eyebrow]:tracking-wider",
  "sr-batch-meta": "my-5 flex flex-col gap-2 text-xs text-slate-600",
  "sr-allergens":
    "my-4 flex flex-wrap gap-2 [&>span]:rounded-xl [&>span]:border [&>span]:border-slate-200 [&>span]:bg-slate-50 [&>span]:px-2 [&>span]:py-1 [&>span]:text-[10px] [&>span]:text-samrita-iron",
  "sr-custody-mini":
    "mt-5 flex justify-between gap-2 border-t border-slate-200 pt-4 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:text-[10px] [&>span]:text-slate-500 [&>.complete]:text-samrita-spruce",
  "sr-status":
    "inline-flex items-center whitespace-nowrap rounded-xl bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold capitalize leading-tight tracking-wide text-samrita-iron",
  pending: "!bg-amber-50 !text-amber-900",
  matched: "!bg-samrita-charcoal !text-white",
  active: "!bg-samrita-teal !text-white",
  in_transit: "!bg-samrita-teal !text-white",
  delivered: "!bg-samrita-fern !text-white",
  approved: "!bg-samrita-fern !text-white",
  completed: "!bg-samrita-spruce !text-white",
  rejected: "!bg-red-50 !text-red-800",
  cancelled: "!bg-samrita-iron !text-white",
  "sr-empty":
    "rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center [&>.sr-icon-box]:mb-4 [&>h3]:font-display [&>h3]:text-2xl [&>p]:mx-auto [&>p]:mt-3 [&>p]:max-w-sm [&>p]:text-sm [&>p]:text-slate-600",
  "sr-workspace-footer":
    "mt-12 flex justify-between gap-5 border-t border-slate-200 py-7 text-[10px] text-slate-600 max-sm:[&>span:last-child]:hidden",
  "sr-loading": "p-20 text-center text-sm text-samrita-teal",
  "sr-mobile-menu": "min-[701px]:!hidden",
  "sr-form-grid": "grid grid-cols-2 gap-x-4",
  "sr-input-action":
    "flex items-center gap-3 [&>label]:!m-0 [&>label]:flex-1 [&>input]:flex-1 [&>.sr-button]:shrink-0 [&>.sr-button]:!p-3",
  "sr-field-label": "text-xs font-semibold text-samrita-iron",
  "sr-checkbox":
    "!flex-row !items-center !gap-2.5 !font-normal [&_small]:block",
  "sr-equipment":
    "flex flex-wrap items-center gap-3 [&>span]:rounded-2xl [&>span]:bg-samrita-teal [&>span]:px-3 [&>span]:py-2 [&>span]:text-xs [&>span]:text-white",
  "sr-divider": "my-7 h-px bg-slate-200",
  "sr-menu-upload":
    "mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 [&>input]:max-w-[250px] [&>input]:flex-1 [&>input]:text-xs",
  "sr-menu-item": "my-5 rounded-2xl border border-slate-200 bg-slate-50 p-5",
  "sr-allergen-checks":
    "flex flex-wrap gap-x-4 gap-y-1 [&>label]:!my-2 [&>label]:!flex-row [&>label]:items-center [&>label]:!gap-2 [&>label]:!text-xs [&>label]:!font-normal",
  "sr-confirm": "!rounded-2xl !bg-white !p-3 !text-xs",
  "sr-note":
    "my-4 flex flex-wrap items-start gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs leading-relaxed text-samrita-iron",
  "sr-error":
    "my-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800 [&>button]:ml-4",
  "sr-success": "mt-4 text-sm text-samrita-spruce",
  "sr-callout":
    "my-5 flex items-start gap-3 rounded-2xl border border-samrita-teal bg-samrita-teal p-5 text-sm leading-relaxed text-white [&_small]:!block [&_small]:!text-xs [&_small]:!text-white/85",
  "sr-driver-banner":
    "!mt-0 !flex-wrap !items-center [&>div]:flex-1 [&>.sr-button]:!bg-white [&>.sr-button]:!text-samrita-charcoal",
  "sr-qr":
    "my-5 flex items-center gap-5 border-y border-slate-200 py-5 [&>svg]:max-w-[100px] [&>svg]:shrink-0 [&>svg]:rounded-2xl [&>svg]:bg-white [&>svg]:p-2 [&>div]:min-w-0 [&_strong]:block [&_strong]:text-xs [&_small]:my-2 [&_small]:block [&_small]:break-all [&_small]:text-[10px] [&_small]:text-slate-600 [&_span]:text-[10px] [&_span]:text-slate-600",
  "sr-event-summary":
    "border-b border-slate-200 py-6 [&_h4]:text-xl [&_p]:my-2 [&_p]:text-xs",
  "sr-photo-field":
    "!my-5 !flex !flex-col !items-center !justify-center !gap-2 !rounded-2xl !border !border-dashed !border-slate-300 !bg-slate-50 !p-6 !text-center [&_small]:text-xs [&_input]:max-w-[260px] [&_input]:text-xs [&_input]:file:mr-2 [&_input]:file:rounded-xl [&_input]:file:border-0 [&_input]:file:bg-samrita-teal [&_input]:file:px-3 [&_input]:file:py-2 [&_input]:file:text-xs [&_input]:file:text-white [&_img]:mt-3 [&_img]:max-h-[180px] [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:object-cover",
  "sr-triage-list": "my-5",
  "sr-triage-item":
    "flex items-center gap-4 border-b border-slate-200 py-3 [&>.sr-checkbox]:flex-1 [&_strong]:text-sm [&_small]:mt-1 [&_small]:text-[11px]",
  "sr-servings": "max-w-[85px]",
  "sr-scan": "my-4",
  "sr-camera": "max-h-[50vh] w-full rounded-2xl bg-samrita-charcoal",
  "sr-route-summary":
    "py-5 text-sm [&>small]:mb-5 [&>small]:mt-2 [&>small]:block [&>div]:flex [&>div]:items-center [&>div]:py-3 [&>div]:text-xs",
  "sr-waypoint":
    "mr-3 inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-samrita-teal",
  done: "!bg-samrita-teal",
  "sr-proof-grid": "grid grid-cols-1 gap-5 sm:grid-cols-3",
  "sr-proof":
    "flex min-w-0 flex-col gap-2 [&>strong]:text-xs [&>strong]:font-semibold [&_img]:h-[190px] [&_img]:w-full [&_img]:rounded-2xl [&_img]:object-cover [&_small]:text-[11px]",
  "sr-proof-pending":
    "flex h-[190px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500",
  "sr-evidence-hash": "font-mono text-[9px] text-slate-500",
  "sr-table-wrap":
    "overflow-auto [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_th]:whitespace-nowrap [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-4 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:text-samrita-charcoal [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-4 [&_td]:text-xs [&_td]:text-samrita-iron",
  "sr-queue": "",
  "sr-queue-row":
    "flex flex-wrap items-center gap-4 border-t border-slate-200 py-6 [&>div]:min-w-[130px] [&>div]:flex-1 [&_h4]:text-xl [&_p]:my-2 [&_p]:text-xs [&_small]:text-[11px] max-sm:[&>.sr-button]:w-full",
  "sr-queue-icon":
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-samrita-teal text-white",
  "sr-spin": "animate-spin",
  "sr-consumer":
    "mx-auto min-h-screen max-w-[850px] bg-slate-50 [&>main]:mx-auto [&>main]:max-w-[600px] [&>main]:px-5 [&>main]:py-7 md:[&>main]:px-10 [&_h1]:my-5 [&_h1]:text-5xl [&_h1]:leading-tight [&>main>p]:mb-6 [&>main>p]:text-sm [&>main>p]:text-slate-600 [&_.sr-panel]:my-6 [&_.sr-panel-heading_h2]:text-3xl",
  "sr-demo-label":
    "mb-9 rounded-2xl border border-slate-200 bg-white p-3 text-center text-[9px] font-semibold tracking-wider text-samrita-teal",
  "sr-consumer-venue":
    "[&>small]:my-2 [&>small]:flex [&>small]:items-center [&>small]:gap-2 [&>.sr-text-link]:mt-4",
  "sr-consumer-map":
    "relative my-8 flex h-[250px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-samrita-charcoal bg-samrita-teal text-white shadow-stacked-sm shadow-samrita-charcoal [&>span]:text-xs [&>span]:text-white/85",
  "sr-demo-pin":
    "absolute flex h-9 w-9 -rotate-45 items-center justify-center rounded-[50%_50%_50%_0] bg-white text-samrita-teal [&>svg]:rotate-45",
  p1: "left-8 top-12",
  p2: "right-8 top-20",
  p3: "bottom-7 right-24",
  "sr-choice-row": "my-5 flex flex-wrap gap-3 [&>.sr-button]:!text-xs",
};

export function ui(tokens: string): string {
  return tokens
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `${token} ${recipes[token] || ""}`)
    .join(" ");
}
