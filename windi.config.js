import typography from 'windicss/plugin/typography'

module.exports = {
  extract: {
    include: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {},
    extend: {
      backgroundImage: {},
      screens: {
        xs: '361px',
        xsheight: { raw: '(min-height: 668px)' },
      },
      colors: {
        rose: {
          50: '#e75681',
          100: '#dd4c77',
          200: '#d3426d',
          300: '#c93863',
          400: '#bf2e59',
          500: '#b5244f',
          600: '#ab1a45',
          700: '#a1103b',
          800: '#970631',
          900: '#8d0027',
        },
        pizazz: {
          50: '#ffb16e',
          100: '#ffa764',
          200: '#ff9d5a',
          300: '#fa9350',
          400: '#f08946',
          500: '#e67f3c',
          600: '#dc7532',
          700: '#d26b28',
          800: '#c8611e',
          900: '#be5714',
        },
        lavender: {
          50: '#ffffff',
          100: '#ffffff',
          200: '#fff5ff',
          300: '#ffebff',
          400: '#fae1ff',
          500: '#f0d7f5',
          600: '#e6cdeb',
          700: '#dcc3e1',
          800: '#d2b9d7',
          900: '#c8afcd',
        },
      },
    },
  },
  plugins: [typography],
}
