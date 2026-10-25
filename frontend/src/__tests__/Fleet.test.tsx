import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Fleet, { FleetSummary } from '../samrit/Fleet';
import type { Overview } from '../samrit/api';
import { request } from '../samrit/api';
vi.mock('../samrit/api', async importOriginal => ({ ...await importOriginal<typeof import('../samrit/api')>(), request: vi.fn() }));
const data: Overview = {
  config: { city: 'New York City', timeZone: 'America/New_York', aiConfigured: false }, batches: [], centers: [], events: [], reviews: [], scans: [],
  drivers: [{ id: 'driver-a', name: 'Assigned driver', isAvailable: true, isActive: true }, { id: 'driver-b', name: 'Free driver', isAvailable: true, isActive: true }],
  vehicles: [{ vehicleId: 'truck-a', name: 'Assigned truck', registration: 'NY-01', capacityServings: 100, capabilities: ['hot'], equipment: ['Hot boxes'], status: 'ready', createdAt: '', updatedAt: '' }, { vehicleId: 'truck-b', name: 'Ready truck', registration: 'NY-02', capacityServings: 200, capabilities: ['shelf_stable'], equipment: [], status: 'ready', createdAt: '', updatedAt: '' }],
  routes: [{ routeId: 'route-a', driverId: 'driver-a', vehicleId: 'truck-a', centerId: 'center', status: 'active', assignedBatches: [], distanceMiles: 1, estimatedMinutes: 20, createdAt: '', waypoints: [] }],
};
describe('central NGO fleet', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('counts availability separately from active assignments', () => {
    const { container } = render(<FleetSummary data={data} />);
    const counts = Array.from(container.querySelectorAll('strong')).map(item => item.textContent);
    expect(counts).toEqual(['1', '1', '1', '0']);
  });
  it('locks vehicle editing during an active route and provisions through admin UI', () => {
    render(<Fleet data={data} refresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Assigned.*editing locked/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Provision driver' }));
    expect(screen.getByRole('dialog', { name: 'Provision NGO driver' })).toBeInTheDocument();
    expect(screen.getByLabelText('Issued password (10+ characters)')).toHaveAttribute('type', 'password');
  });
  it('submits vehicle equipment and capacity to the fleet endpoint', async () => {
    vi.mocked(request).mockResolvedValue({});
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<Fleet data={data} refresh={refresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));
    fireEvent.change(screen.getByLabelText('Vehicle name'), { target: { value: 'NGO delivery truck' } });
    fireEvent.change(screen.getByLabelText('Registration / fleet identifier'), { target: { value: 'NY-03' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save vehicle' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('/api/fleet/vehicles', 'POST', expect.objectContaining({ name: 'NGO delivery truck', registration: 'NY-03', capacityServings: 100, capabilities: ['shelf_stable'], status: 'ready' })));
  });
});
