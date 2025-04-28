import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock BroadcastChannel
global.BroadcastChannel = class {
  constructor() {
    return {
      postMessage: vi.fn(),
      close: vi.fn(),
      name: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
  }
} as any;

// Mock URL.createObjectURL
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
}

// Mock URL.revokeObjectURL
if (!global.URL.revokeObjectURL) {
  global.URL.revokeObjectURL = vi.fn();
}

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});