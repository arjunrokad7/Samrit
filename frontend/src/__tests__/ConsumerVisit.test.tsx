import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Consumer from '../samrit/Consumer';
import ConsumerCheckIn, { parseVisitCode } from '../samrit/ConsumerCheckIn';

describe('recipient preferences and visit review', () => {
  it('filters multiple allergens and restores results when removed', () => {
    render(<MemoryRouter><Consumer /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Select your allergens' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Wheat' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Soybeans' }));
    expect(screen.getByRole('button', { name: 'Remove Wheat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Soybeans' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search allergens' }), { target: { value: 'not-an-allergen' } });
    expect(screen.getByText('No matching allergens.')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search allergens' }), { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'Search allergens' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'East Village Community Table' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lower East Side Welcome Kitchen' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Wheat' }));
    expect(screen.getByRole('heading', { name: 'East Village Community Table' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Already at a place/ })).toHaveAttribute('href', '/consumer/check-in');
    expect(screen.queryByRole('button', { name: 'Good experience' })).not.toBeInTheDocument();
  });

  it('rejects incorrect phases, invalid codes and a different venue', () => {
    expect(() => parseVisitCode('bad-code', 'entry')).toThrow();
    expect(() => parseVisitCode('samrit:visit:one:exit', 'entry')).toThrow();
    expect(() => parseVisitCode('samrit:visit:two:exit', 'exit', 'one')).toThrow(/same venue/);
  });

  it('requires entry and matching exit, captures visit metadata, and previews a review', async () => {
    const location = vi.fn((success) => success({ coords: { latitude: 40.72, longitude: -73.98, accuracy: 12 }, timestamp: Date.now() }));
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(location);
    render(<MemoryRouter><ConsumerCheckIn /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Leave a private anonymous review' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Entry QR code'), { target: { value: 'samrit:visit:one:entry' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record entry code' }));
    await screen.findByText('Checked in at one.');
    fireEvent.click(screen.getByRole('button', { name: 'Leave a private anonymous review' }));
    expect(screen.queryByRole('button', { name: 'Good experience' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Exit QR code'), { target: { value: 'samrit:visit:two:exit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record exit code' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/same venue/);
    fireEvent.change(screen.getByLabelText('Exit QR code'), { target: { value: 'samrit:visit:one:exit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record exit code' }));
    await screen.findByRole('button', { name: 'Good experience' });
    expect(screen.getByRole('button', { name: 'Preview private review' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Needs attention' }));
    fireEvent.change(screen.getByLabelText('Optional details'), { target: { value: 'Long line, did not get food.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview private review' }));
    expect(screen.getByText(/Review preview complete/)).toBeInTheDocument();
    expect(screen.getByText(/"accuracyMeters": 12/)).toHaveTextContent('elapsedMilliseconds');
    expect(location).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Clear visit and start again' }));
    expect(screen.queryByText(/Review preview complete/)).not.toBeInTheDocument();
  });

  it('allows a visit without location and records it as unavailable', async () => {
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((_success, fail) => fail?.({ code: 1, message: 'Denied' } as GeolocationPositionError));
    render(<MemoryRouter><ConsumerCheckIn /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Entry QR code'), { target: { value: 'samrit:visit:one:entry' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record entry code' }));
    await waitFor(() => expect(screen.getByText(/Location unavailable; this visit can still be reviewed/)).toBeInTheDocument());
  });
});
