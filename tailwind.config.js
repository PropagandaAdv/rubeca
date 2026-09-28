/** Design token Rubeca Motori: unica fonte di verità per colori e font. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#001E50',  // primario: hero/dark, titoli su chiaro, footer
          slate: '#1E293B', // secondario: testo corpo su chiaro
          blue: '#0066FF',  // accento: CTA, link, linea firma (dosi rare)
          mist: '#F4F6F9',  // canvas chiaro
          ice: '#EEF6FA',   // sezioni alternate, card
        },
      },
      fontFamily: { sans: ['Montserrat', 'system-ui', 'sans-serif'] },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
};
