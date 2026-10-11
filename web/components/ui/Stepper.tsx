import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  subtitle: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  maxAccessibleStep?: number;
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  maxAccessibleStep = 1,
}: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && step.id <= maxAccessibleStep;

          return (
            <li
              key={step.id}
              className={`relative flex flex-1 items-center ${
                index !== steps.length - 1 ? 'pr-4 sm:pr-8' : ''
              }`}
            >
              <div
                className={`group flex items-center w-full ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => {
                  if (isClickable) onStepClick(step.id);
                }}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onStepClick(step.id);
                  }
                }}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step circle indicator */}
                <span className="flex items-center">
                  <span
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[#5C1A2B] text-white shadow-xs'
                        : isCurrent
                        ? 'border-2 border-[#5C1A2B] bg-white text-[#5C1A2B] ring-4 ring-[#5C1A2B]/10 font-bold'
                        : 'border border-stone-300 bg-stone-100 text-stone-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </span>
                  <span className="ml-3 hidden sm:flex flex-col text-left">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-[#5C1A2B]'
                          : isCompleted
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      Step {step.id}
                    </span>
                    <span
                      className={`text-sm font-medium leading-tight ${
                        isCurrent
                          ? 'text-stone-900 font-semibold'
                          : isCompleted
                          ? 'text-stone-700'
                          : 'text-stone-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </span>
                </span>

                {/* Connecting horizontal line */}
                {index !== steps.length - 1 && (
                  <div
                    className="ml-4 flex-1 hidden sm:block"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-0.5 w-full rounded-full transition-colors duration-300 ${
                        step.id < currentStep
                          ? 'bg-[#5C1A2B]'
                          : 'bg-stone-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
