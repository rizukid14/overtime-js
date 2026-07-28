# GEMINI.md - Overtime JS Project Guide

## Overview
**overtime-js** (overtime-calc-jmkd) is a React web application designed for calculating employee overtime pay, payroll tax estimations (TER - Tarif Efektif Rata-rata), and exporting/importing calculation reports.

---

## Tech Stack
- **Frontend Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Create React App (`react-scripts`)
- **Styling:** Tailwind CSS (`tailwindcss` v4)
- **Icons:** Lucide React (`lucide-react`)
- **Data Export/Processing:** SheetJS (`xlsx`)
- **Testing:** React Testing Library & Jest (`@testing-library/react`)

---

## Project Structure
```
overtime-js/
├── public/                 # Static assets and index.html
├── src/
│   ├── App.js              # Main application component & overtime calculation UI
│   ├── App.css             # Component styling
│   ├── index.js            # React application entry point
│   ├── index.css           # Global CSS & Tailwind imports
│   ├── terData.js          # Tax calculation tables (TER data)
│   └── setupTests.js       # Test environment configuration
├── old.js                  # Legacy/reference calculation code
├── package.json            # Project dependencies and npm scripts
└── README.md               # Standard CRA documentation
```

---

## Available Scripts

In the project root, you can run:

- `npm start` - Starts the development server at `http://localhost:3000`
- `npm run build` - Builds the optimized production bundle in the `build/` folder
- `npm test` - Launches the interactive test runner
- `npm run eject` - Ejects CRA config (Caution: irreversible)

---

## Development Guidelines

1. **Active Branch:** Always work on `miiovt-main` unless instructed otherwise.
2. **Component Architecture:**
   - Keep React components modular and functional using React Hooks.
   - Ensure tax calculation formulas in `terData.js` and overtime calculations in `App.js` maintain numerical accuracy.
3. **Styling:**
   - Use Tailwind CSS classes for UI styling.
   - Maintain modern, clean UI with high visual quality and responsive design.
4. **Dependencies:**
   - Do not remove essential packages like `xlsx` or `lucide-react` without verifying usage across components.
