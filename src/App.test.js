import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

const mockFetchResponse = {
  doors: [
    { id: 1, name: 'Front Door', status: 0 },
    { id: 2, name: 'Back Door', status: 1 }
  ],
  history: [
    { doorId: 1, timeStamp: '2025-10-28T10:00:00', newStatus: 0 }
  ]
};

// Mock environment variable
beforeAll(() => {
  process.env.REACT_APP_API_BASE = 'https://localhost:7230';
});

// Mock fetch
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockFetchResponse)
    })
  );
});

// Mock SignalR
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    build() {
      return {
        start: jest.fn().mockResolvedValue(),
        stop: jest.fn().mockResolvedValue(),
        on: jest.fn()
      };
    }
  }
}));

describe('Door Control Dashboard', () => {
  test('renders main headings', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Building Access Control Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Door Control Pannel')).toBeInTheDocument();
      expect(screen.getByText('Live Event feed')).toBeInTheDocument();
    });
  });

  test('renders door table headers', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Door Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  test('displays doors from API', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Front Door')).toBeInTheDocument();
      expect(screen.getByText('Back Door')).toBeInTheDocument();
    });
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  test('displays history entries', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Door 1/)).toBeInTheDocument();
      expect(screen.getByText(/2025-10-28T10:00:00/)).toBeInTheDocument();
    });
  });

  test('handles door toggle', async () => {
    render(<App />);
    // Wait for initial data to load and the Toggle buttons to appear
    await waitFor(() => {
      expect(screen.getByText('Front Door')).toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByText('Toggle');
    // Mock the next fetch (the POST request triggered by clicking the toggle)
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    fireEvent.click(toggleButtons[0]);

    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:7230/api/doors/1/toggle',
      { method: 'POST' }
    );
  });

  test('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));
    render(<App />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching doors:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
