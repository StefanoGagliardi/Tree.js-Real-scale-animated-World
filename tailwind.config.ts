import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import typographyPlugin from '@tailwindcss/typography'
import flattenColorPaletteImport from 'tailwindcss/lib/util/flattenColorPalette'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flattenColorPalette = (flattenColorPaletteImport as any)?.default || flattenColorPaletteImport

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontSize: {
      xsm: ['13px', '20px'],
      sm: ['14px', '20px'],
      base: ['16px', '24px'],
      paragraph: ['18px', '28px'],
      paragraphLg: ['22px', '34px'],
      lg: ['20px', '28px'],
      lgm: ['26px', '32px'],
      xl: ['40px', '48px'],
      xxl: ['48px', '56px'],
    },
    fontFamily: {
      avenir: ['avenir next', 'sans-serif'],
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 800,
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      maxWidth: {
        '8xl': '1600px',
      },
      colors: {
        ctaStart: 'var(--color-bg-cta-start)',
        ctaStop: 'var(--color-bg-cta-stop)',
        green: {
          light: 'var(--color-green-light)',
          DEFAULT: 'var(--color-green-dark)',
          dark: 'var(--color-green-dark)',
        },
        logoBlue: '#145fb4',
        accent: 'var(--color-bg-accent)',
        accent2: 'var(--color-bg-accent2)',
      },
      backgroundColor: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
        service: 'var(--color-bg-service)',
        accent: 'var(--color-bg-accent)',
        input: 'var(--bg-input)',
        'input-gray': 'var(--bg-input-gray)',
        contact: 'var(--color-contacts-bg)',
        unset: 'unset',
        'gray-1': 'var(--color-gray-1)',
        'gray-2': 'var(--color-gray-2)',
        'gray-3': 'var(--color-gray-3)',
        'gray-4': 'var(--color-gray-4)',
        'gray-5': 'var(--color-gray-5)',
        'gray-light-1': 'var(--color-light-gray-1)',
        'gray-light-5': 'var(--color-light-gray-5)',
        'input-prefix': 'var(--color-input-prefix)',
        'gray-dark-3': 'var(--color-dark-gray-3)',
      },
      gradientColorStops: {
        ctaStop: 'var(--color-bg-cta-stop)',
      },
      textColor: {
        accent: 'var(--color-text-accent)',
        accent2: 'var(--color-text-accent2)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        input: 'var(--color-input)',
        dark: 'var(--color-text-dark)',
        'dark-gray': {
          1: 'var(--color-dark-gray-1)',
          2: 'var(--color-dark-gray-2)',
          3: 'var(--color-dark-gray-3)',
          4: 'var(--color-dark-gray-4)',
          5: 'var(--color-dark-gray-5)',
        },
        'light-gray': {
          1: 'var(--color-light-gray-1)',
          2: 'var(--color-light-gray-2)',
          3: 'var(--color-light-gray-3)',
          4: 'var(--color-light-gray-4)',
          5: 'var(--color-light-gray-5)',
        },
      },
      textOpacity: {
        20: '0.2',
        80: '0.8',
      },
      lineHeight: {
        22: '22px',
      },
      spacing: {
        header: '80px',
        '20px': '20px',
        '25px': '25px',
        '50px': '50px',
        '60px': '60px',
        '90px': '90px',
        '150px': '150px',
        '180px': '180px',
        '200px': '200px',
        '50vw': '50vw',
        '50vh': '50vh',
      },
      height: {
        header: '80px',
        '40px': '40px',
      },
      width: {
        '45%': '45%',
      },
      margin: {
        30: '30px',
        '60px': '60px',
        50: '50px',
      },
      padding: {
        '60px': '60px',
        '20px': '20px',
      },
      zIndex: {
        3: '3',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '4xl': '1600px',
    },
    borderWidth: {
      DEFAULT: '1px',
      1: '1px',
      0: '0',
      2: '2px',
      3: '3px',
      4: '4px',
      6: '6px',
      8: '8px',
    },
  },
  plugins: [
    typographyPlugin,
    plugin(function ({ matchUtilities, theme }) {
      if (typeof flattenColorPalette === 'function') {
        matchUtilities(
          {
            'my-custom-class': (value) => ({
              backgroundColor: value,
              color: theme('colors.white'),
            }),
            'service-figure-width': (value) => ({
              '.section-service .figure-wrapper': {
                maxWidth: value,
              },
            }),
          },
          { values: flattenColorPalette(theme('colors')) },
        )
      }
    }),
  ],
}

export default config