{
  "project": {
    "name": "The Local Jewel — Lead Generation Wizard",
    "app_type": "hybrid_fullstack",
    "audience": {
      "primary": "Mobile-first social traffic (25–45) shopping for engagement rings/wedding bands/luxury jewelry",
      "intent": "High intent, wants premium experience + better-than-retail value; low patience for long forms",
      "success_actions": [
        "Start wizard",
        "Complete wizard to value reveal",
        "Upload inspiration (optional)",
        "Submit contact details",
        "OTP login",
        "View dashboard quotes/orders"
      ]
    },
    "brand_attributes": [
      "premium",
      "restrained",
      "private-jeweler",
      "precise",
      "trustworthy",
      "generous whitespace",
      "minimal ornamentation"
    ]
  },

  "design_tokens": {
    "note": "MUST match brief exactly. Implement via CSS variables + Tailwind usage. No transparent backgrounds; always dark base.",
    "colors": {
      "bg": "#0B0B0C",
      "surface": "#121214",
      "text": "#F5F2EA",
      "muted": "#B9B2A6",
      "border": "#2A2A2E",
      "accent": "#C9A86A",
      "accent_2": "#E7D3A7",
      "danger": "#E25C5C",
      "success": "#56C271"
    },
    "typography": {
      "font_family": "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      "sizes_px": {
        "h1": "28px/34px",
        "h2": "22px/28px",
        "body": "16px/24px",
        "small": "13px/18px"
      },
      "tailwind_mapping": {
        "h1": "text-[28px] leading-[34px] font-semibold tracking-[-0.01em]",
        "h2": "text-[22px] leading-[28px] font-medium tracking-[-0.005em]",
        "body": "text-[16px] leading-[24px]",
        "small": "text-[13px] leading-[18px]"
      }
    },
    "spacing_px": [4, 8, 12, 16, 24, 32, 48],
    "radius_px": {
      "r_sm": 10,
      "r_md": 14,
      "r_lg": 18
    },
    "shadows": {
      "shadow_1": "0 6px 18px rgba(0,0,0,0.35)",
      "shadow_2": "0 12px 30px rgba(0,0,0,0.45)"
    },
    "icons": {
      "library": "lucide-react",
      "stroke": "1.5–2px",
      "style": "outline"
    },
    "buttons": {
      "min_height": 44
    },
    "motion": {
      "duration": "~300ms",
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "reduced_motion": "Honor prefers-reduced-motion"
    }
  },

  "global_css_and_theming": {
    "instructions": [
      "Update /frontend/src/index.css :root and .dark tokens to match the provided hex colors (convert to HSL if required by existing shadcn token format).",
      "Set body background to bg (#0B0B0C) and foreground to text (#F5F2EA).",
      "Remove or ignore starter CRA App.css centering; do NOT center the app container.",
      "Add a subtle noise overlay as a background pseudo-element for depth (very low opacity; not a gradient).",
      "No transparent surfaces: cards/sheets/dialogs must use surface color #121214 (solid)."
    ],
    "css_custom_properties": {
      "add_to_index_css": {
        "--lj-bg": "#0B0B0C",
        "--lj-surface": "#121214",
        "--lj-text": "#F5F2EA",
        "--lj-muted": "#B9B2A6",
        "--lj-border": "#2A2A2E",
        "--lj-accent": "#C9A86A",
        "--lj-accent-2": "#E7D3A7",
        "--lj-danger": "#E25C5C",
        "--lj-success": "#56C271",
        "--lj-r-sm": "10px",
        "--lj-r-md": "14px",
        "--lj-r-lg": "18px",
        "--lj-shadow-1": "0 6px 18px rgba(0,0,0,0.35)",
        "--lj-shadow-2": "0 12px 30px rgba(0,0,0,0.45)",
        "--lj-ease": "cubic-bezier(0.2, 0.8, 0.2, 1)",
        "--lj-dur": "300ms"
      },
      "noise_scaffold": "body::before { content: ''; position: fixed; inset: 0; pointer-events: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"200\" height=\"200\" filter=\"url(%23n)\" opacity=\"0.08\"/></svg>'); opacity: 0.08; mix-blend-mode: soft-light; } @media (prefers-reduced-motion: reduce){ body::before{ opacity:0.05; } }"
    },
    "tailwind_usage_notes": [
      "Prefer token-driven classes like bg-[color] only when necessary; otherwise set shadcn tokens (background/card/border/foreground).",
      "For borders: use border border-[--lj-border] or border-border once tokens are updated.",
      "For accent: use text-[--lj-accent] / bg-[--lj-accent] and ensure contrast on dark surfaces."
    ]
  },

  "layout_system": {
    "mobile_first_grid": {
      "outer_padding": "px-4 (16px)",
      "max_widths": {
        "wizard": "max-w-[520px] mx-auto",
        "landing": "max-w-6xl mx-auto",
        "dashboard": "max-w-6xl mx-auto"
      },
      "vertical_rhythm": "Use 24–32px between major blocks; 12–16px within cards",
      "safe_area": "Use pb-[env(safe-area-inset-bottom)] for bottom CTAs on iOS"
    },
    "screen_shell": {
      "wizard": "Sticky top: logo + click-to-call + progress. Content center-left aligned. Sticky bottom: primary CTA.",
      "landing": "Hero with CTA, social proof strip, then 3 value pillars, then testimonials, then final CTA.",
      "dashboard": "Header with tabs (Quotations/Orders), card list, empty states."
    }
  },

  "components_and_paths": {
    "primary_shadcn_components": {
      "buttons": "/app/frontend/src/components/ui/button.jsx",
      "cards": "/app/frontend/src/components/ui/card.jsx",
      "progress": "/app/frontend/src/components/ui/progress.jsx",
      "radio_group": "/app/frontend/src/components/ui/radio-group.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "form": "/app/frontend/src/components/ui/form.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "input_otp": "/app/frontend/src/components/ui/input-otp.jsx",
      "toast_sonner": "/app/frontend/src/components/ui/sonner.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "carousel": "/app/frontend/src/components/ui/carousel.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx"
    },
    "custom_components_to_create": [
      {
        "name": "WizardShell",
        "purpose": "Unified wizard layout: sticky header (logo/call/progress), content area, sticky bottom CTA",
        "notes": "All screens reuse. Avoid layout shift."
      },
      {
        "name": "OptionCard",
        "purpose": "Single-select option tiles (icon + label) with premium states",
        "notes": "Use button + aria-pressed or RadioGroupItem styled as card."
      },
      {
        "name": "IconCardGrid",
        "purpose": "Grid for product type, diamond shape, metal preference",
        "notes": "2 columns mobile, 3 columns tablet."
      },
      {
        "name": "ValueRevealCounter",
        "purpose": "Animated savings reveal screen",
        "notes": "Framer Motion + count-up; obey reduced motion."
      },
      {
        "name": "FloatingContactRail",
        "purpose": "WhatsApp + Chat floating buttons (bottom-right)",
        "notes": "Use Lucide icons; strong hit area; not obtrusive."
      }
    ]
  },

  "component_styles": {
    "surfaces": {
      "card": "bg-[--lj-surface] border border-[--lj-border] rounded-[var(--lj-r-md)] shadow-[var(--lj-shadow-1)]",
      "card_hover": "hover:border-[color:color-mix(in_srgb,var(--lj-accent)_55%,var(--lj-border))] hover:shadow-[var(--lj-shadow-2)]",
      "divider": "bg-[--lj-border]"
    },
    "buttons": {
      "primary": {
        "base": "min-h-11 px-5 rounded-[var(--lj-r-md)] bg-[--lj-accent] text-[#0B0B0C] font-medium",
        "hover": "hover:bg-[--lj-accent-2]",
        "focus": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--lj-accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--lj-bg]",
        "motion": "transition-colors duration-300"
      },
      "secondary": {
        "base": "min-h-11 px-5 rounded-[var(--lj-r-md)] bg-[--lj-surface] text-[--lj-text] border border-[--lj-border]",
        "hover": "hover:border-[--lj-accent]",
        "focus": "focus-visible:ring-2 focus-visible:ring-[--lj-accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--lj-bg]",
        "motion": "transition-colors duration-300"
      },
      "ghost": {
        "base": "min-h-11 px-4 rounded-[var(--lj-r-md)] text-[--lj-text]",
        "hover": "hover:bg-[#161618]",
        "motion": "transition-colors duration-300"
      },
      "destructive": {
        "base": "min-h-11 px-5 rounded-[var(--lj-r-md)] bg-[--lj-danger] text-[#0B0B0C]",
        "motion": "transition-colors duration-300"
      }
    },
    "inputs": {
      "base": "min-h-11 bg-[--lj-surface] border border-[--lj-border] rounded-[var(--lj-r-sm)] text-[--lj-text] placeholder:text-[--lj-muted]",
      "focus": "focus-visible:ring-2 focus-visible:ring-[--lj-accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--lj-bg]",
      "motion": "transition-colors duration-300"
    },
    "option_cards_single_select": {
      "layout": "w-full text-left rounded-[var(--lj-r-md)] bg-[--lj-surface] border border-[--lj-border] px-4 py-4",
      "hover": "hover:border-[--lj-accent]",
      "selected": "data-[state=checked]:border-[--lj-accent] data-[state=checked]:shadow-[var(--lj-shadow-1)]",
      "motion": "transition-colors duration-300"
    },
    "progress": {
      "track": "bg-[#1A1A1D]",
      "indicator": "bg-[--lj-accent]"
    },
    "badges": {
      "gold_chip": "bg-[#1B1610] text-[--lj-accent-2] border border-[#2B241A]"
    }
  },

  "page_blueprints": {
    "landing_screen_0": {
      "structure": [
        "Top utility bar: logo-left (logo-main.png), click-to-call button right",
        "Hero: H1 promise + H2 supporting line + primary CTA (Start your private quote)",
        "Social proof strip: 3 metrics (e.g., '5-star clients', 'Insured shipping', 'GIA options')",
        "Value pillars: 3 cards with icons (Craftsmanship, Transparent pricing, Concierge service)",
        "Testimonials carousel (3–5)",
        "Final CTA card with WhatsApp quick-start"
      ],
      "micro_interactions": [
        "Hero CTA: subtle glow via box-shadow on hover (no gradient)",
        "Social proof strip: horizontal scroll on mobile with scroll-snap",
        "Testimonials: carousel with gentle drag; reduced motion fallback (no autoplay)"
      ]
    },
    "wizard_screens_1_to_10A": {
      "pattern": [
        "Sticky header: Back button + Step X of Y + progress bar",
        "Question block: H2 question + small helper line",
        "Answer area: icon card grid OR option list OR select/input",
        "Sticky bottom: Continue button (disabled until selection)"
      ],
      "branching": "Keep progress display as X of Y where Y is dynamic for branch; if too complex, show 'Step X' + subtle dots indicator.",
      "special_screens": {
        "file_upload": "Use Card with dropzone-like button + preview grid (2 columns). Also include optional link input.",
        "ring_size": "Yes/No cards; if yes, reveal Select (shadcn Select).",
        "bracelet_specifics": "Multi-field: length, clasp style, engraving. Use Form + Input/Select/Textarea."
      }
    },
    "value_reveal_screen_11": {
      "layout": [
        "Full-screen focus: large number counter (savings) + subtext describing how it's calculated",
        "Secondary: 'See your quote' / 'Continue' CTA",
        "Trust line: 'No obligation. Private consultation.'"
      ],
      "animation": {
        "library": "framer-motion + lightweight count-up",
        "behavior": "Counter eases from 0 to value in ~900ms; subtle shimmer on accent divider; respect reduced motion"
      }
    },
    "contact_form_screen_12": {
      "fields": [
        "Full name",
        "Phone (required)",
        "Email (optional)",
        "City",
        "Preferred contact method (WhatsApp/Call/Text)",
        "Notes (optional)"
      ],
      "validation": "Inline errors in danger color; keep wording calm and premium.",
      "trust": "Under submit: small line about privacy + response time."
    },
    "thank_you_screen_13": {
      "content": [
        "Confirmation title",
        "Summary of selections (collapsible)",
        "Next steps: 'We’ll reach out within X hours'",
        "Buttons: 'Back to home' + 'Login to dashboard'"
      ]
    },
    "otp_login": {
      "pattern": [
        "Single card centered vertically but left-aligned content",
        "Phone input -> send OTP -> InputOTP",
        "Resend timer",
        "Primary button: Verify"
      ],
      "components": ["input", "input-otp", "button", "card"]
    },
    "dashboard": {
      "layout": [
        "Top header: logo + small user chip + logout",
        "Tabs: My Quotations / My Orders",
        "List cards with status badges (Pending/Quoted/Ordered)",
        "Empty states with clear CTA to start wizard"
      ],
      "tables_optional": "If showing many records, use shadcn Table; otherwise card list is more premium on mobile."
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Default duration ~300ms; only transition color/opacity/shadow — not transforms globally.",
      "Use small press feedback: active:scale-[0.99] ONLY on primary CTA (not all buttons).",
      "Wizard screen transitions: crossfade + slight y-translation (4–6px) via Framer Motion; disabled on reduced motion.",
      "Progress indicator animates width changes smoothly."
    ],
    "scroll": [
      "Use sticky bottom CTA; content scrolls beneath.",
      "Avoid parallax (not needed for premium funnel; keep calm)."
    ]
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast: accent text on dark bg is fine; ensure muted text still readable (use muted only for secondary).",
      "Visible focus states on all interactive elements.",
      "Hit targets >= 44px (already required).",
      "Use aria labels for icon-only buttons (back, call, WhatsApp).",
      "Respect prefers-reduced-motion."
    ]
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid.",
    "examples": {
      "landing": [
        "data-testid=\"landing-start-wizard-button\"",
        "data-testid=\"landing-click-to-call-button\"",
        "data-testid=\"landing-whatsapp-fab\""
      ],
      "wizard": [
        "data-testid=\"wizard-back-button\"",
        "data-testid=\"wizard-progress\"",
        "data-testid=\"wizard-option-card-<slug>\"",
        "data-testid=\"wizard-continue-button\"",
        "data-testid=\"wizard-file-upload-input\""
      ],
      "value_reveal": [
        "data-testid=\"value-reveal-savings-amount\"",
        "data-testid=\"value-reveal-continue-button\""
      ],
      "contact": [
        "data-testid=\"contact-form-phone-input\"",
        "data-testid=\"contact-form-submit-button\"",
        "data-testid=\"contact-form-error-text\""
      ],
      "login": [
        "data-testid=\"otp-login-phone-input\"",
        "data-testid=\"otp-login-send-otp-button\"",
        "data-testid=\"otp-login-otp-input\"",
        "data-testid=\"otp-login-verify-button\""
      ],
      "dashboard": [
        "data-testid=\"dashboard-tabs\"",
        "data-testid=\"dashboard-quotation-card\"",
        "data-testid=\"dashboard-empty-state-start-wizard-button\""
      ]
    }
  },

  "images_and_assets": {
    "brand": {
      "logo": {
        "file": "logo-main.png",
        "usage": "Header left; also on login card"
      }
    },
    "image_urls": [
      {
        "category": "landing_hero",
        "description": "Close-up premium ring on dark textile; use as right-side image on desktop or subtle background crop on mobile hero.",
        "url": "https://images.unsplash.com/photo-1605089315716-64d4e9696796?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "social_proof_or_testimonials",
        "description": "Rings on black table — use as blurred thumbnail behind testimonial carousel header (very subtle, low opacity).",
        "url": "https://images.unsplash.com/photo-1653972894881-45e6d9610655?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "wizard_empty_state",
        "description": "Minimal dark flatlay — use for empty states (dashboard no quotes/orders) as a small illustration-like image.",
        "url": "https://images.unsplash.com/photo-1700998059702-089b86471898?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "craftsmanship_story",
        "description": "Hands/jewelry detail — use in landing 'private jeweler' story block.",
        "url": "https://images.unsplash.com/photo-1618606778801-79f6c933b927?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "libraries_and_setup": {
    "recommended": [
      {
        "name": "framer-motion",
        "why": "Wizard screen transitions + value reveal animation with reduced-motion handling",
        "install": "npm i framer-motion",
        "usage_notes": "Use <AnimatePresence mode=\"wait\"> around wizard screen container. Keep motion subtle (opacity + y: 6)."
      },
      {
        "name": "react-countup",
        "why": "Reliable count-up for savings reveal",
        "install": "npm i react-countup",
        "usage_notes": "Only on value reveal screen; if prefers-reduced-motion, render final value immediately."
      }
    ],
    "do_not_use": [
      "Heavy particle backgrounds (too gimmicky for private jeweler)",
      "Auto-playing large animations"
    ]
  },

  "instructions_to_main_agent": [
    "Implement exact hex tokens; do not invent new colors. Gold accents must be sparse and intentional.",
    "Ensure every wizard screen is one-question-per-screen with sticky bottom CTA and back navigation.",
    "Use shadcn/ui components from /frontend/src/components/ui (JS, not TSX).",
    "No transparent backgrounds: dialogs/sheets/cards use solid surface color.",
    "Add data-testid to all interactive and key informational elements (kebab-case).",
    "Avoid gradients except very small decorative overlays; prefer solid premium surfaces + subtle noise.",
    "Button min height 44px across the app; keep typography sizes per brief.",
    "Wizard option cards should feel tactile via border + shadow changes (no big scale animations)."
  ]
}


<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
