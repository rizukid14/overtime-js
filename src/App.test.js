import { render, screen } from '@testing-library/react';
import App from './App';

test('renders overtime calculator heading', () => {
  render(<App />);
  const titleElement = screen.getByText(/Kalkulator Overtime & TER Gaji/i);
  expect(titleElement).toBeInTheDocument();
});
