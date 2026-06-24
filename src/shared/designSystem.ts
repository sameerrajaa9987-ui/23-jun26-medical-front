/**
 * MedStock Design System — Clean Clinical (2026 edition).
 *
 * Calm clinical teal + cobalt accent on near-white surfaces. Tuned for a
 * medical inventory SaaS used all day at a desk and on the go: strategic
 * minimalism, generous whitespace, soft (blurred) elevation, large rounded
 * corners, and glass accents. Same token *structure* as the goat-farm system
 * so the shared/ui kit ports cleanly — only the values change.
 */

export const palette = {
  // Primary ink — slate (cool, calm, high-legibility text)
  ink: {
    900: "#0F172A",
    800: "#1E293B",
    700: "#334155",
    600: "#475569",
    500: "#64748B",
    400: "#94A3B8",
    300: "#CBD5E1",
    200: "#E2E8F0",
    100: "#F1F5F9",
    50: "#F8FAFC",
  },

  // Primary brand — clinical teal
  teal: {
    900: "#0A3B3A",
    800: "#0E4F4D",
    700: "#0F6562",
    600: "#0E7C7B",
    500: "#14958F",
    400: "#2FB3AC",
    300: "#5FCFC8",
    200: "#A7E6E1",
    100: "#D6F5F2",
    50: "#ECFBF9",
  },

  // Accent — cobalt blue (links, secondary CTAs, info)
  cobalt: {
    900: "#0B254E",
    800: "#103572",
    700: "#1A4D9E",
    600: "#2563EB",
    500: "#3B82F6",
    400: "#60A5FA",
    300: "#93C5FD",
    200: "#BFDBFE",
    100: "#DBEAFE",
    50: "#EFF6FF",
  },

  // Cool neutral surfaces
  neutral: {
    0: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  surface: {
    primary: "#FFFFFF",
    secondary: "#F6F8FB",
    tertiary: "#F1F5F9",
    raised: "#FFFFFF",
    sunken: "#EEF2F7",
    dark: "#0F172A",
    darkRaised: "#1E293B",
  },

  text: {
    primary: "#0F172A",
    secondary: "#334155",
    tertiary: "#64748B",
    disabled: "#A0AEC0",
    inverse: "#FFFFFF",
    accent: "#0E7C7B",
    link: "#2563EB",
  },

  border: {
    subtle: "#EEF2F7",
    default: "#E2E8F0",
    strong: "#CBD5E1",
    focus: "#14958F",
    dark: "#334155",
  },

  // Semantic — stock / expiry / billing states
  success: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  danger: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  info: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
} as const;

export const spacing = {
  "0": 0,
  px: 1,
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "12": 48,
  "14": 56,
  "16": 64,
  "20": 80,
} as const;

// Soft, rounded corners for the clinical / minimal language.
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
} as const;

// Thin, light hairline outline (replaces the farm's heavy 2px black outline).
export const outline = { width: 1, color: "#E2E8F0" } as const;

export const typography = {
  display: {
    large: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
    },
    medium: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700" as const,
      letterSpacing: -0.4,
    },
    small: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: "700" as const,
      letterSpacing: -0.3,
    },
  },
  heading: {
    h1: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700" as const,
      letterSpacing: -0.4,
    },
    h2: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "600" as const,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600" as const,
      letterSpacing: -0.1,
    },
  },
  body: {
    large: { fontSize: 17, lineHeight: 26, fontWeight: "400" as const },
    default: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
    small: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  },
  label: {
    large: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600" as const,
      letterSpacing: -0.1,
    },
    medium: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600" as const,
      letterSpacing: 0,
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
} as const;

// Soft, blurred elevation (clinical depth) — replaces the farm's hard offsets.
const soft = (y: number, radius: number, opacity: number, elev: number) => ({
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: elev,
});

export const shadows = {
  none: {},
  xs: soft(1, 2, 0.05, 1),
  sm: soft(2, 6, 0.07, 2),
  md: soft(4, 12, 0.09, 4),
  lg: soft(8, 22, 0.11, 8),
  xl: soft(14, 34, 0.14, 14),
} as const;

export const elevation = {
  base: shadows.xs,
  raised: shadows.sm,
  floating: shadows.md,
  overlay: shadows.lg,
} as const;

export const motion = {
  duration: { fast: 150, medium: 250, slow: 400 },
  spring: {
    gentle: { damping: 18, stiffness: 180 },
    default: { damping: 20, stiffness: 220 },
    bouncy: { damping: 12, stiffness: 200 },
    crisp: { damping: 25, stiffness: 300 },
  },
} as const;

/** Gradients — soft clinical sweeps consumed by expo-linear-gradient. */
export const gradients = {
  hero: ["#0E7C7B", "#0F6562", "#0A3B3A"] as const, // teal hero
  teal: ["#14958F", "#0E7C7B"] as const,
  cobalt: ["#3B82F6", "#2563EB", "#1A4D9E"] as const,
  light: ["#FFFFFF", "#F6F8FB"] as const,
  mist: ["#ECFBF9", "#EFF6FF"] as const,
} as const;

/** Glass — translucent frosted panels for overlays over gradients/imagery. */
export const glass = {
  light: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
  },
  lighter: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
  },
  dark: {
    backgroundColor: "rgba(15,23,42,0.30)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
  },
} as const;

export const layout = {
  screenPadding: 20,
  cardPadding: 20,
  sectionGap: 28,
  itemGap: 12,
  sidebarWidth: 264,
  sidebarCollapsedWidth: 76,
  tabBarHeight: 72,
  tabBarClearance: 96,
  chipHeight: 36,
  chipRowHeight: 44,
  contentMaxWidth: 1200,
  // Width at/above which the layout switches to the desktop sidebar shell.
  wideBreakpoint: 900,
} as const;
