/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Vendor Panel ────────────────────────────────────────────────
        vendor: {
          bg: 'rgb(var(--vendor-bg) / <alpha-value>)',
          primary: 'rgb(var(--vendor-primary) / <alpha-value>)',
          accent: 'rgb(var(--vendor-accent) / <alpha-value>)',
          accentHover: 'rgb(var(--vendor-accent-hover) / <alpha-value>)',
        },

        // ── Buyer Brand System (Figma-aligned) ──────────────────────────
        brand: {
          // Backgrounds (warm cream from Figma)
          bg:       '#FFF8F0',      // Warm cream page background
          bgDeep:   '#FFF3E4',      // Slightly deeper cream for sections
          surface:  '#FFFFFF',      // Pure white card/surface
          card:     '#FFFFFF',

          // Text
          text:     '#2C1A0E',      // Deep warm brown for body text
          navy:     '#2C1A0E',      // Primary headings (rich dark brown)
          muted:    '#7A6152',      // Muted warm brown for secondary text
          subtle:   '#BFA99A',      // Very light warm grey for placeholders

          // Primary accent – Saffron orange (Figma brand color)
          saffron:  '#F1641E',      // Primary CTA, badges, highlights
          saffronLight: '#FFF0E8',  // Saffron tint for backgrounds
          saffronDark:  '#D4521A',  // Hover state for saffron

          // Heritage gold (accent tier 2)
          gold:     '#C9922A',      // Luxury gold for premium labels
          goldLight:'#FDF3DC',      // Gold tint background

          // Status
          sale:     '#E53E3E',      // Red for sale/discount badges
          wishlist: '#F1641E',      // Saffron for wishlist/heart
          success:  '#2E7D52',      // Green for success states
          successLight: '#EAF5EE',

          // Borders
          border:   '#EDE0D4',      // Warm beige border
          borderLight: '#F5EDE4',   // Lighter warm border
        },

        // ── Redesign Theme Colors (HTML reference 100% match) ──────────
        "surface": "#fff8f5",
        "surface-dim": "#e9d7cb",
        "surface-bright": "#fff8f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#fff1e9",
        "surface-container": "#fdeade",
        "surface-container-high": "#f7e5d9",
        "surface-container-highest": "#f2dfd3",
        "on-surface": "#231a13",
        "on-surface-variant": "#554336",
        "inverse-surface": "#392e26",
        "inverse-on-surface": "#ffede3",
        "outline": "#887364",
        "outline-variant": "#dbc2b0",
        "surface-tint": "#904d00",
        "on-primary": "#ffffff",
        "primary-container": "#b15f00",
        "on-primary-container": "#fffbff",
        "inverse-primary": "#ffb77d",
        "on-secondary": "#ffffff",
        "secondary-container": "#a0f399",
        "on-secondary-container": "#217128",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#007abd",
        "on-tertiary-container": "#fdfcff",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#ffdcc3",
        "primary-fixed-dim": "#ffb77d",
        "on-primary-fixed": "#2f1500",
        "on-primary-fixed-variant": "#6e3900",
        "secondary-fixed": "#a3f69c",
        "secondary-fixed-dim": "#88d982",
        "on-secondary-fixed": "#002204",
        "on-secondary-fixed-variant": "#005312",
        "tertiary-fixed": "#cee5ff",
        "tertiary-fixed-dim": "#96ccff",
        "on-tertiary-fixed": "#001d32",
        "on-tertiary-fixed-variant": "#004a75",
        "background": "#fff8f5",
        "on-background": "#231a13",
        "surface-variant": "#f2dfd3",

        // ── Extended Primary (purple – admin/vendor UI) ─────────────────
        primary: {
          DEFAULT: '#8d4b00',
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B0764',
        },

        // ── Secondary (warm green DEFAULT, orange ramp admin/vendor) ───
        secondary: {
          DEFAULT: '#1b6d24',
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },

        // ── Tertiary (blue) ─────────────────────────────────────────────
        tertiary: {
          DEFAULT: '#006096',
        },

        // ── Accent (green ramp) ─────────────────────────────────────────
        accent: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        // ── Error (red) ─────────────────────────────────────────────────
        error: {
          DEFAULT: '#ba1a1a',
        },
      },

      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        // Body font (clean, modern)
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        // Display/heading font (Figma uses Lora – elegant serif)
        heading: ['Lora', 'Georgia', 'serif'],
        // Brand logo font (Playfair for the hero brand name)
        brand:   ['Playfair Display', 'Lora', 'Georgia', 'serif'],
      },

      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },

      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },

      // ── Spacing Scale ─────────────────────────────────────────────────
      spacing: {
        'xs': '4px',
        'base': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '40px',
        'xxl': '64px',
        'container-margin': '20px',
        'gutter': '16px',
      },

      // ── Box Shadow ────────────────────────────────────────────────────
      boxShadow: {
        'card':    '0 2px 12px 0 rgba(44, 26, 14, 0.08)',
        'card-hover': '0 8px 30px 0 rgba(44, 26, 14, 0.14)',
        'saffron': '0 4px 20px 0 rgba(241, 100, 30, 0.25)',
        'header':  '0 1px 0 0 #EDE0D4',
      },
    },
  },
  plugins: [],
};
