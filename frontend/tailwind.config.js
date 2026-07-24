/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#111111', // Mapped to RGB 17, 17, 17

        // ── Vendor Panel ────────────────────────────────────────────────
        vendor: {
          bg: 'rgb(var(--vendor-bg) / <alpha-value>)',
          primary: 'rgb(var(--vendor-primary) / <alpha-value>)',
          accent: 'rgb(var(--vendor-accent) / <alpha-value>)',
          accentHover: 'rgb(var(--vendor-accent-hover) / <alpha-value>)',
        },

        // ── Buyer Brand System (Figma-aligned) ──────────────────────────
        brand: {
          // Backgrounds
          bg:       '#FFFFFF',      // Pure white page background
          bgDeep:   '#FFFFFF',      // Pure white deep background
          surface:  '#FFFFFF',      // Pure white card/surface
          card:     '#FFFFFF',

          // Text
          text:     '#111111',      // Mapped to RGB 17, 17, 17
          navy:     '#111111',      
          muted:    '#111111',      
          subtle:   'rgba(17, 17, 17, 0.4)',

          // Primary accent – Saffron orange mapped to Amber (rgba(245, 166, 35))
          saffron:  '#F5A623',      // Primary CTA, badges, highlights
          saffronLight: 'rgba(245, 166, 35, 0.1)',  // Amber tint
          saffronDark:  '#F5A623',  // Hover state

          // Heritage gold mapped to Amber
          gold:     '#F5A623',      
          goldLight:'rgba(245, 166, 35, 0.1)',

          // Status
          sale:     '#111111',      
          wishlist: '#F5A623',      // Amber for wishlist
          success:  '#111111',      
          successLight: '#FFFFFF',

          // Borders
          border:   'rgba(17, 17, 17, 0.15)', // Light transparent charcoal border
          borderLight: 'rgba(17, 17, 17, 0.08)',
        },

        // ── Redesign Theme Colors (HTML reference 100% match) ──────────
        "surface": "#ffffff",
        "surface-dim": "rgba(17, 17, 17, 0.1)",
        "surface-bright": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ffffff",
        "surface-container": "#ffffff",
        "surface-container-high": "#ffffff",
        "surface-container-highest": "#ffffff",
        "on-surface": "#111111",
        "on-surface-variant": "#111111",
        "inverse-surface": "#111111",
        "inverse-on-surface": "#ffffff",
        "outline": "rgba(17, 17, 17, 0.2)",
        "outline-variant": "rgba(17, 17, 17, 0.1)",
        "surface-tint": "#111111",
        "on-primary": "#ffffff",
        "primary-container": "#ffffff",
        "on-primary-container": "#111111",
        "inverse-primary": "#111111",
        "on-secondary": "#ffffff",
        "secondary-container": "#ffffff",
        "on-secondary-container": "#111111",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#ffffff",
        "on-tertiary-container": "#111111",
        "on-error": "#ffffff",
        "error-container": "#ffffff",
        "on-error-container": "#111111",
        "primary-fixed": "#ffffff",
        "primary-fixed-dim": "#ffffff",
        "on-primary-fixed": "#111111",
        "on-primary-fixed-variant": "#111111",
        "secondary-fixed": "#ffffff",
        "secondary-fixed-dim": "#ffffff",
        "on-secondary-fixed": "#111111",
        "on-secondary-fixed-variant": "#111111",
        "tertiary-fixed": "#ffffff",
        "tertiary-fixed-dim": "#ffffff",
        "on-tertiary-fixed": "#111111",
        "on-tertiary-fixed-variant": "#111111",
        "background": "#ffffff",
        "on-background": "#111111",
        "surface-variant": "#ffffff",

        // ── Extended Primary (purple/brown – admin/vendor/buyer UI) ──────
        primary: {
          DEFAULT: '#111111',
          50:  '#ffffff',
          100: '#ffffff',
          200: '#ffffff',
          300: '#ffffff',
          400: '#ffffff',
          500: '#F5A623',
          600: '#F5A623',
          700: '#111111',
          800: '#111111',
          900: '#111111',
        },

        // ── Secondary ───────────────────────────────────────────────────
        secondary: {
          DEFAULT: '#111111',
          50:  '#ffffff',
          100: '#ffffff',
          200: '#ffffff',
          300: '#ffffff',
          400: '#ffffff',
          500: '#F5A623',
          600: '#F5A623',
          700: '#111111',
          800: '#111111',
          900: '#111111',
        },

        // ── Tertiary (blue) ─────────────────────────────────────────────
        tertiary: {
          DEFAULT: '#111111',
        },

        // ── Accent (green ramp) ─────────────────────────────────────────
        accent: {
          50:  '#ffffff',
          100: '#ffffff',
          200: '#ffffff',
          300: '#ffffff',
          400: '#ffffff',
          500: '#F5A623',
          600: '#F5A623',
          700: '#F5A623',
          800: '#F5A623',
          900: '#F5A623',
        },

        // ── Error (red) ─────────────────────────────────────────────────
        error: {
          DEFAULT: '#111111',
        },
      },

      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        // Body font (clean, modern Inter)
        sans:    ['Inter', '"Poppins"', '"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Display/heading font (Poppins to match UserApp headings)
        heading: ['"Poppins"', 'Inter', '-apple-system', 'sans-serif'],
        // Brand logo font
        brand:   ['"Poppins"', 'Inter', 'sans-serif'],
        // Standard serif override
        serif:   ['"Playfair Display"', 'Lora', 'serif'],
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
