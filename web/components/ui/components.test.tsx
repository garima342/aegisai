import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RiskTierBadge } from './RiskTierBadge';
import { Stepper, StepItem } from './Stepper';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { EmptyState } from './EmptyState';
import { Shield } from 'lucide-react';

describe('UI Reusable Components', () => {
  describe('RiskTierBadge', () => {
    it('renders High Risk badge with appropriate text and role', () => {
      render(<RiskTierBadge tier="high" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeDefined();
      expect(screen.getByText('High Risk')).toBeDefined();
    });

    it('renders Minimal Risk badge', () => {
      render(<RiskTierBadge tier="minimal" />);
      expect(screen.getByText('Minimal Risk')).toBeDefined();
    });

    it('renders Unacceptable Risk badge', () => {
      render(<RiskTierBadge tier="unacceptable" />);
      expect(screen.getByText('Unacceptable Risk')).toBeDefined();
    });
  });

  describe('Stepper', () => {
    const steps: StepItem[] = [
      { id: 1, title: 'Step One', subtitle: 'First' },
      { id: 2, title: 'Step Two', subtitle: 'Second' },
      { id: 3, title: 'Step Three', subtitle: 'Third' },
    ];

    it('renders all step titles and marks current step', () => {
      render(<Stepper steps={steps} currentStep={2} />);
      expect(screen.getByText('Step One')).toBeDefined();
      expect(screen.getByText('Step Two')).toBeDefined();
      expect(screen.getByText('Step Three')).toBeDefined();
    });
  });

  describe('Card', () => {
    it('renders card title and children correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content inside card</p>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('System Information')).toBeDefined();
      expect(screen.getByText('Content inside card')).toBeDefined();
    });
  });

  describe('EmptyState', () => {
    it('renders empty state title and description', () => {
      render(
        <EmptyState
          icon={Shield}
          title="No systems found"
          description="Register your first system to get started"
          actionLabel="Register System"
          actionHref="/systems/new"
        />
      );
      expect(screen.getByText('No systems found')).toBeDefined();
      expect(screen.getByText('Register your first system to get started')).toBeDefined();
      expect(screen.getByText('Register System')).toBeDefined();
    });
  });
});
