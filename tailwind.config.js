/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        steady: {
          ink: '#243642',
          paper: '#f7f4ee',
          teal: '#4b7f8c',
          gold: '#e9b44c',
          moss: '#4f7d4b',
          clay: '#b56d43'
        }
      },
      borderRadius: {
        steady: '8px'
      }
    }
  },
  plugins: []
};
