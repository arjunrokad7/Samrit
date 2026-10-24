import { render, screen } from '@testing-library/react';
import App from '../App';
vi.mock('../samrit/Workspace', () => ({ default: () => <div>Workspace</div> }));
describe('Samrit routes', () => {
 beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); });
 it('renders the Samrit landing page and consumer entry point', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Good food/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Find a meal/ })).toHaveAttribute('href', '/consumer');
 });
 it('renders the consumer concept without public quality ratings', () => {
  window.history.replaceState({}, '', '/consumer');
  render(<App />);
  expect(screen.getByText(/NO LIVE AVAILABILITY/)).toBeInTheDocument();

  expect(screen.queryByText(/star rating/i)).not.toBeInTheDocument();
 });
});
