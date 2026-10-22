/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gh: {
          bg: '#ffffff',
          canvas: '#f6f8fa',
          subtle: '#f3f4f6',
          border: '#d0d7de',
          borderSubtle: '#e5e7eb',
          text: '#1f2328',
          textMuted: '#656d76',
          blue: '#0969da',
          blueHover: '#0550ae',
          blueLight: '#ddf4ff',
          green: '#1a7f37',
          greenLight: '#dafbe1',
          orange: '#bc4c00',
          orangeLight: '#fff8c5',
          red: '#cf222e',
          redLight: '#ffebe9',
          purple: '#8250df',
          purpleLight: '#fbefff',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
