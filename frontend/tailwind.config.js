/** Tailwind co-existence with MUI (see ../agent-team/skills/react-mui-tailwind/SKILL.md):
 *  - `important: '#root'` raises specificity so utilities win over MUI's Emotion styles
 *  - MUI owns components; Tailwind owns layout/spacing utilities only. */
module.exports = {
  important: '#root',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Keep one source of truth for colors: mirror MUI theme palette here if extended.
    },
  },
  plugins: [],
};
