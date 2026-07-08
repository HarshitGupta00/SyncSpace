/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class", // class-based dark mode — toggled by adding "dark" to <html>
  theme: {
    extend: {
      // ─── Colors extracted from the 11 UI reference screenshots ───
      colors: {
        // Base surfaces — the app is almost entirely these
        app: "#FAFAFA",          // page background (very light warm gray)
        surface: "#FFFFFF",      // cards, sidebar, panels
        border: "#E5E5E5",       // subtle card borders, dividers

        // Text scale
        primary:   "#0A0A0A",   // headings, main text (near-black)
        secondary: "#6B6B6B",   // descriptions, metadata
        tertiary:  "#9CA3AF",   // placeholders, timestamps

        // Accent — the UI is black-first, NOT blue-first
        accent: {
          DEFAULT: "#0A0A0A",   // primary buttons, active nav items
          hover:   "#1A1A1A",   // button hover state
          purple:  "#7C5CFC",   // AI badge, onboarding gradient accents ONLY
        },

        // Status colors (used in pills/badges only, sparingly)
        status: {
          green:  "#16A34A",    // active, completed, success
          amber:  "#F59E0B",    // medium priority, pending
          blue:   "#3B82F6",    // in progress, info
          red:    "#DC2626",    // delete, decline, danger
        },
      },

      // ─── Typography ───
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Matching the reference: compact, professional scale
        "2xs": ["11px", { lineHeight: "16px" }],
        xs:    ["12px", { lineHeight: "16px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["14px", { lineHeight: "20px" }],
        md:    ["15px", { lineHeight: "22px" }],
        lg:    ["16px", { lineHeight: "24px" }],
        xl:    ["18px", { lineHeight: "28px" }],
        "2xl": ["20px", { lineHeight: "28px" }],
        "3xl": ["24px", { lineHeight: "32px" }],
        "4xl": ["28px", { lineHeight: "36px" }],
        "5xl": ["32px", { lineHeight: "40px" }],
      },

      // ─── Spacing — consistent with reference screenshots ───
      spacing: {
        "4.5": "18px",  // used between avatar stack items
        "13":  "52px",  // topbar height offset
        "18":  "72px",
        "22":  "88px",
        "sidebar": "220px", // fixed sidebar width
        "topbar":  "64px",  // fixed topbar height
      },

      // ─── Border radius — rounded-xl throughout ───
      borderRadius: {
        sm:   "6px",
        md:   "8px",
        lg:   "10px",
        xl:   "12px",
        "2xl":"16px",
        full: "9999px",
      },

      // ─── Box shadows — near-flat, very subtle ───
      boxShadow: {
        sm:  "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        md:  "0 2px 8px 0 rgb(0 0 0 / 0.06)",
        lg:  "0 4px 16px 0 rgb(0 0 0 / 0.08)",
        xl:  "0 8px 32px 0 rgb(0 0 0 / 0.10)",
        // Used for modals/drawers
        modal: "0 20px 60px 0 rgb(0 0 0 / 0.15)",
      },

      // ─── Animation durations ───
      transitionDuration: {
        fast:   "100ms",
        normal: "150ms",
        slow:   "200ms",
        slower: "300ms",
      },

      // ─── Keyframes for custom animations ───
      keyframes: {
        // Skeleton shimmer loader
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  },
        },
        // Slide in from right (for drawers)
        slideInRight: {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        // Slide in from bottom (for mobile nav)
        slideInUp: {
          "0%":   { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        // Fade in (for modals, overlays)
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Scale in (for dropdowns/popovers)
        scaleIn: {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
      },
      animation: {
        shimmer:      "shimmer 1.5s infinite linear",
        slideInRight: "slideInRight 200ms ease-out",
        slideInUp:    "slideInUp 200ms ease-out",
        fadeIn:       "fadeIn 150ms ease-out",
        scaleIn:      "scaleIn 150ms ease-out",
      },
    },
  },
  plugins: [],
};
