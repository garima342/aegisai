import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import NewSystemWizardPage from '@/app/systems/new/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('NewSystemWizardPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Step 1 initially with title and progress stepper', () => {
    render(<NewSystemWizardPage />);
    expect(screen.getByText('Register AI System')).toBeDefined();
    expect(screen.getByText('Step 1: System Identification & Purpose')).toBeDefined();
    expect(screen.getByLabelText(/System Name/i)).toBeDefined();
    expect(screen.getByLabelText(/System Purpose/i)).toBeDefined();
  });

  it('shows inline validation errors when submitting empty step 1', async () => {
    render(<NewSystemWizardPage />);
    const continueBtn = screen.getByRole('button', { name: /Continue to Step 2/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('System name must be at least 3 characters')).toBeDefined();
      expect(screen.getByText(/Purpose must be at least 10 characters/i)).toBeDefined();
      expect(screen.getByText(/Intended use must be at least 10 characters/i)).toBeDefined();
      expect(screen.getByText(/Owner or responsible team name is required/i)).toBeDefined();
    });
  });

  it('prefills HR Recruitment AI demo data on prefill click', async () => {
    render(<NewSystemWizardPage />);
    const prefillBtn = screen.getByRole('button', { name: /Prefill HR AI Demo/i });
    fireEvent.click(prefillBtn);

    const nameInput = screen.getByLabelText(/System Name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('HR Recruitment AI');

    const ownerInput = screen.getByLabelText(/Responsible Owner/i) as HTMLInputElement;
    expect(ownerInput.value).toBe('People Operations & AI Team');
  });
});
