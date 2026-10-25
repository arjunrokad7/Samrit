import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScanField } from '../samrit/components';
const camera = vi.hoisted(() => ({ decode: vi.fn(), stop: vi.fn() }));
vi.mock('@zxing/browser', () => ({ BrowserQRCodeReader: class { decodeFromVideoDevice = camera.decode; } }));
describe('voice-requested QR camera', () => {
  it('closes a consumed request and opens again only for a new request', async () => {
    camera.decode.mockResolvedValue({ stop: camera.stop });
    const onChange = vi.fn();
    const { rerender } = render(<ScanField label="Venue QR" value="" onChange={onChange} openRequest={1} />);
    await waitFor(() => expect(camera.decode).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(camera.stop).toHaveBeenCalled();
    rerender(<ScanField label="Venue QR" value="" onChange={onChange} openRequest={2} />);
    await waitFor(() => expect(camera.decode).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
