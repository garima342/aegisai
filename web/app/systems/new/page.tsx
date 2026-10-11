'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  RotateCcw,
  Shield,
  Layers,
  Database,
  Lock,
  FileCheck2,
  Loader2,
} from 'lucide-react';

import {
  step1Schema,
  step2Schema,
  step4Schema,
  Step1FormData,
  Step2FormData,
  Step4FormData,
} from '@/lib/validations/system';
import { RiskSuggestion } from '@/lib/types/system';
import { Stepper, StepItem } from '@/components/ui/Stepper';
import { RiskTierBadge } from '@/components/ui/RiskTierBadge';
import { FileDropzone, UploadedFileItem } from '@/components/ui/FileDropzone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

const STEPS: StepItem[] = [
  { id: 1, title: 'System Details', subtitle: 'Basic identity & ownership' },
  { id: 2, title: 'Model & Risk', subtitle: 'Architecture & classification' },
  { id: 3, title: 'Artifacts / Config', subtitle: 'Files or LLM endpoint' },
  { id: 4, title: 'Review & Scope', subtitle: 'Audit modules & confirm' },
];

const LOCAL_STORAGE_KEY = 'aegis_wizard_intake_draft_v1';

const SENSITIVE_ATTRIBUTE_OPTIONS = [
  'gender',
  'age',
  'race',
  'ethnicity',
  'disability',
  'religion',
  'sexual_orientation',
  'marital_status',
  'zip_code',
  'nationality',
];

export default function NewSystemWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Risk suggestion state
  const [riskSuggestion, setRiskSuggestion] = useState<RiskSuggestion | null>(null);
  const [isSuggestingRisk, setIsSuggestingRisk] = useState<boolean>(false);

  // File uploads state for Step 3
  const [datasetFiles, setDatasetFiles] = useState<UploadedFileItem[]>([]);
  const [modelFiles, setModelFiles] = useState<UploadedFileItem[]>([]);
  const [docFiles, setDocFiles] = useState<UploadedFileItem[]>([]);

  // LLM App configuration state for Step 3
  const [llmConfig, setLlmConfig] = useState({
    endpointUrl: '',
    authHeaderName: 'Authorization',
    authHeaderValue: '',
    systemPrompt: '',
    description: '',
  });
  const [llmConfigErrors, setLlmConfigErrors] = useState<{ [key: string]: string }>({});

  // react-hook-form setups per step
  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      description: '',
      purpose: '',
      intendedUse: '',
      owner: '',
    },
    mode: 'onTouched',
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      modelType: 'tabular_classifier',
      domainContext: 'hiring',
      sensitiveAttributes: ['gender', 'age'],
      riskTier: 'high',
      suggestedRiskTier: 'high',
      riskRationale: '',
    },
    mode: 'onTouched',
  });

  const step4Form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      runDataRisk: true,
      runSecurity: true,
      runGovernance: true,
    },
  });

  // Load draft from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step1) step1Form.reset(parsed.step1);
        if (parsed.step2) step2Form.reset(parsed.step2);
        if (parsed.step4) step4Form.reset(parsed.step4);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.maxAccessibleStep) setMaxAccessibleStep(parsed.maxAccessibleStep);
        if (parsed.datasetFiles) setDatasetFiles(parsed.datasetFiles);
        if (parsed.modelFiles) setModelFiles(parsed.modelFiles);
        if (parsed.docFiles) setDocFiles(parsed.docFiles);
        if (parsed.llmConfig) setLlmConfig(parsed.llmConfig);
        if (parsed.riskSuggestion) setRiskSuggestion(parsed.riskSuggestion);
      }
    } catch (e) {
      console.warn('Failed to restore draft from localStorage:', e);
    }
  }, [step1Form, step2Form, step4Form]);

  // Persist draft to localStorage on changes
  useEffect(() => {
    try {
      const draft = {
        currentStep,
        maxAccessibleStep,
        step1: step1Form.getValues(),
        step2: step2Form.getValues(),
        step4: step4Form.getValues(),
        datasetFiles,
        modelFiles,
        docFiles,
        llmConfig,
        riskSuggestion,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save draft to localStorage:', e);
    }
  }, [
    currentStep,
    maxAccessibleStep,
    step1Form,
    step2Form,
    step4Form,
    datasetFiles,
    modelFiles,
    docFiles,
    llmConfig,
    riskSuggestion,
  ]);

  // Query risk suggestion when domainContext or modelType changes in Step 2
  const watchedDomain = step2Form.watch('domainContext');
  const watchedModelType = step2Form.watch('modelType');
  const watchedSensitiveAttrs = step2Form.watch('sensitiveAttributes') || [];

  useEffect(() => {
    if (!watchedDomain) return;

    let active = true;
    const fetchRisk = async () => {
      setIsSuggestingRisk(true);
      try {
        const res = await fetch('/api/systems/suggest-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domainContext: watchedDomain,
            modelType: watchedModelType,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (active && json.data) {
            setRiskSuggestion(json.data);
            step2Form.setValue('suggestedRiskTier', json.data.suggestedTier);
            step2Form.setValue('riskRationale', json.data.rationale);
            // Default user selection to suggested tier if unchanged
            step2Form.setValue('riskTier', json.data.suggestedTier);
          }
        }
      } catch (err) {
        console.error('Error fetching risk suggestion:', err);
      } finally {
        if (active) setIsSuggestingRisk(false);
      }
    };

    const timer = setTimeout(fetchRisk, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [watchedDomain, watchedModelType, step2Form]);

  // Helper to prefill HR Recruitment AI case study
  const handlePrefillHRCaseStudy = () => {
    step1Form.reset({
      name: 'HR Recruitment AI',
      description: 'Automated candidate CV screening and ranking pipeline for software engineering roles.',
      purpose: 'Analyze candidate resumes, extract qualifications, and predict hiring match score to streamline talent shortlisting.',
      intendedUse: 'Pre-screening inbound engineering applicants prior to recruiter human interview.',
      owner: 'People Operations & AI Team',
    });

    step2Form.reset({
      modelType: 'tabular_classifier',
      domainContext: 'hiring',
      sensitiveAttributes: ['gender', 'age', 'race'],
      riskTier: 'high',
      suggestedRiskTier: 'high',
      riskRationale: 'Under EU AI Act Annex III (Point 4), AI systems intended for recruitment, screening, ranking candidates, or making employment decisions are classified as High-Risk.',
    });

    // Populate simulated sample files
    setDatasetFiles([
      {
        id: 'f-hr-ds',
        name: 'hr_recruitment.csv',
        size: 184320,
        type: 'text/csv',
        kind: 'dataset',
        progress: 100,
        status: 'completed',
        storageKey: 'datasets/hr_recruitment.csv',
      },
    ]);

    setModelFiles([
      {
        id: 'f-hr-mdl',
        name: 'hr_model.joblib',
        size: 512000,
        type: 'application/octet-stream',
        kind: 'model',
        progress: 100,
        status: 'completed',
        storageKey: 'models/hr_model.joblib',
      },
    ]);

    setDocFiles([
      {
        id: 'f-hr-doc',
        name: 'recruitment_model_card_v1.pdf',
        size: 1420000,
        type: 'application/pdf',
        kind: 'documentation',
        progress: 100,
        status: 'completed',
        storageKey: 'docs/recruitment_model_card_v1.pdf',
      },
    ]);

    step4Form.reset({
      runDataRisk: true,
      runSecurity: true,
      runGovernance: true,
    });

    setMaxAccessibleStep(4);
  };

  const handleResetDraft = () => {
    if (confirm('Are you sure you want to discard your draft and start over?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      step1Form.reset();
      step2Form.reset();
      step4Form.reset();
      setDatasetFiles([]);
      setModelFiles([]);
      setDocFiles([]);
      setLlmConfig({
        endpointUrl: '',
        authHeaderName: 'Authorization',
        authHeaderValue: '',
        systemPrompt: '',
        description: '',
      });
      setCurrentStep(1);
      setMaxAccessibleStep(1);
    }
  };

  // Step 1 Validation & Next
  const onStep1Submit = step1Form.handleSubmit(() => {
    setCurrentStep(2);
    setMaxAccessibleStep((prev) => Math.max(prev, 2));
  });

  // Step 2 Validation & Next
  const onStep2Submit = step2Form.handleSubmit(() => {
    setCurrentStep(3);
    setMaxAccessibleStep((prev) => Math.max(prev, 3));
  });

  // Step 3 Validation & Next
  const onStep3Submit = () => {
    const isLlm = ['llm_app', 'rag_system', 'agent'].includes(step2Form.getValues('modelType'));

    if (isLlm) {
      const errors: { [key: string]: string } = {};
      if (!llmConfig.endpointUrl) {
        errors.endpointUrl = 'Endpoint URL is required';
      } else {
        try {
          new URL(llmConfig.endpointUrl);
        } catch {
          errors.endpointUrl = 'Must be a valid URL starting with http:// or https://';
        }
      }

      if (!llmConfig.systemPrompt || llmConfig.systemPrompt.trim().length < 10) {
        errors.systemPrompt = 'System prompt must be at least 10 characters for injection testing';
      }

      setLlmConfigErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    setCurrentStep(4);
    setMaxAccessibleStep((prev) => Math.max(prev, 4));
  };

  // Step 4 Final Submission
  const onFinalSubmit = step4Form.handleSubmit(async (scopeData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const step1Data = step1Form.getValues();
      const step2Data = step2Form.getValues();
      const isLlm = ['llm_app', 'rag_system', 'agent'].includes(step2Data.modelType);

      // Consolidate artifacts
      const allArtifacts = [
        ...datasetFiles.map((f) => ({
          kind: 'dataset' as const,
          filename: f.name,
          mime: f.type,
          size: f.size,
          storageKey: f.storageKey,
        })),
        ...modelFiles.map((f) => ({
          kind: 'model' as const,
          filename: f.name,
          mime: f.type,
          size: f.size,
          storageKey: f.storageKey,
        })),
        ...docFiles.map((f) => ({
          kind: 'documentation' as const,
          filename: f.name,
          mime: f.type,
          size: f.size,
          storageKey: f.storageKey,
        })),
      ];

      const payload = {
        name: step1Data.name,
        description: step1Data.description || undefined,
        purpose: step1Data.purpose,
        intendedUse: step1Data.intendedUse,
        owner: step1Data.owner,
        modelType: step2Data.modelType,
        domainContext: step2Data.domainContext,
        sensitiveAttributes: step2Data.sensitiveAttributes,
        riskTier: step2Data.riskTier,
        llmConfig: isLlm ? llmConfig : undefined,
        assessmentScope: {
          runDataRisk: scopeData.runDataRisk,
          runSecurity: scopeData.runSecurity,
          runGovernance: scopeData.runGovernance,
        },
        artifacts: allArtifacts,
      };

      const res = await fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Failed to register AI system');
      }

      const resJson = await res.json();
      const createdSystem = resJson.data;

      // Clear draft after successful creation
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      // Redirect to system details page
      router.push(`/systems/${createdSystem.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during submission';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLlmArchitecture = ['llm_app', 'rag_system', 'agent'].includes(
    step2Form.watch('modelType')
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <button
            type="button"
            onClick={() => router.push('/systems')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Systems
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Register AI System
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Complete the 4-step intake wizard to register metadata, risk parameters, artifacts, and assessment scope.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrefillHRCaseStudy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5C1A2B] bg-[#5C1A2B]/10 hover:bg-[#5C1A2B]/20 rounded-xl transition"
            title="Auto-fill with sample HR Recruitment AI system"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Prefill HR AI Demo
          </button>

          <button
            type="button"
            onClick={handleResetDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
            title="Clear draft"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Stepper Component */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          onStepClick={(stepId) => setCurrentStep(stepId)}
        />
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: Register System Basic Info                                        */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: System Identification & Purpose</CardTitle>
            <CardDescription>
              Define the AI system&apos;s name, business purpose, intended deployment context, and responsible owner.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="step1-form" onSubmit={onStep1Submit} className="space-y-6">
              {/* System Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-semibold text-stone-800">
                  System Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. HR Recruitment AI"
                  {...step1Form.register('name')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    step1Form.formState.errors.name
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-stone-300 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B]'
                  }`}
                  aria-invalid={!!step1Form.formState.errors.name}
                  aria-describedby={step1Form.formState.errors.name ? 'name-error' : undefined}
                />
                {step1Form.formState.errors.name && (
                  <p id="name-error" className="text-xs text-rose-600 font-medium mt-1">
                    {step1Form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="description" className="block text-sm font-semibold text-stone-800">
                  Description <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="description"
                  rows={2}
                  placeholder="High-level overview of the system architecture and business objective..."
                  {...step1Form.register('description')}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                />
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label htmlFor="purpose" className="block text-sm font-semibold text-stone-800">
                  System Purpose <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="purpose"
                  rows={2}
                  placeholder="What specifically does the AI model predict, classify, or generate?"
                  {...step1Form.register('purpose')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    step1Form.formState.errors.purpose
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-stone-300 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B]'
                  }`}
                  aria-invalid={!!step1Form.formState.errors.purpose}
                  aria-describedby={step1Form.formState.errors.purpose ? 'purpose-error' : undefined}
                />
                {step1Form.formState.errors.purpose && (
                  <p id="purpose-error" className="text-xs text-rose-600 font-medium mt-1">
                    {step1Form.formState.errors.purpose.message}
                  </p>
                )}
              </div>

              {/* Intended Use */}
              <div className="space-y-1.5">
                <label htmlFor="intendedUse" className="block text-sm font-semibold text-stone-800">
                  Intended Use & Deployment Scenario <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="intendedUse"
                  rows={2}
                  placeholder="Describe the operational setting (e.g. autonomous decision vs. human-in-the-loop recommendation)."
                  {...step1Form.register('intendedUse')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    step1Form.formState.errors.intendedUse
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-stone-300 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B]'
                  }`}
                  aria-invalid={!!step1Form.formState.errors.intendedUse}
                  aria-describedby={step1Form.formState.errors.intendedUse ? 'intendedUse-error' : undefined}
                />
                {step1Form.formState.errors.intendedUse && (
                  <p id="intendedUse-error" className="text-xs text-rose-600 font-medium mt-1">
                    {step1Form.formState.errors.intendedUse.message}
                  </p>
                )}
              </div>

              {/* Owner */}
              <div className="space-y-1.5">
                <label htmlFor="owner" className="block text-sm font-semibold text-stone-800">
                  Responsible Owner / Team <span className="text-rose-600">*</span>
                </label>
                <input
                  id="owner"
                  type="text"
                  placeholder="e.g. People Operations & AI Engineering"
                  {...step1Form.register('owner')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    step1Form.formState.errors.owner
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-stone-300 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B]'
                  }`}
                  aria-invalid={!!step1Form.formState.errors.owner}
                  aria-describedby={step1Form.formState.errors.owner ? 'owner-error' : undefined}
                />
                {step1Form.formState.errors.owner && (
                  <p id="owner-error" className="text-xs text-rose-600 font-medium mt-1">
                    {step1Form.formState.errors.owner.message}
                  </p>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="pt-6 border-t border-stone-200 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#722136] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5C1A2B] transition"
                >
                  Continue to Step 2
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Model Type & Risk Context                                         */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Model Architecture & Risk Context</CardTitle>
            <CardDescription>
              Select the system architecture, domain context, and sensitive attributes. The engine suggests an EU AI Act aligned risk tier that you can override.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="step2-form" onSubmit={onStep2Submit} className="space-y-6">
              {/* Model Type */}
              <div className="space-y-1.5">
                <label htmlFor="modelType" className="block text-sm font-semibold text-stone-800">
                  Model Architecture <span className="text-rose-600">*</span>
                </label>
                <select
                  id="modelType"
                  {...step2Form.register('modelType')}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                >
                  <option value="tabular_classifier">Tabular Classifier (e.g. LightGBM, XGBoost, Scikit-learn)</option>
                  <option value="tabular_regressor">Tabular Regressor</option>
                  <option value="llm_app">LLM Application (Chatbot, Prompt pipeline)</option>
                  <option value="rag_system">RAG System (Retrieval Augmented Generation)</option>
                  <option value="agent">Autonomous Agent / Multi-agent system</option>
                  <option value="other">Other / Custom</option>
                </select>
              </div>

              {/* Domain Context */}
              <div className="space-y-1.5">
                <label htmlFor="domainContext" className="block text-sm font-semibold text-stone-800">
                  Domain Context <span className="text-rose-600">*</span>
                </label>
                <input
                  id="domainContext"
                  type="text"
                  placeholder="e.g. hiring, credit scoring, healthcare, customer support"
                  {...step2Form.register('domainContext')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    step2Form.formState.errors.domainContext
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-stone-300 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B]'
                  }`}
                />
                <p className="text-xs text-stone-500">
                  Keywords like <span className="font-mono text-stone-700">hiring</span>,{' '}
                  <span className="font-mono text-stone-700">credit</span>, or{' '}
                  <span className="font-mono text-stone-700">health</span> trigger high-risk regulatory classifications.
                </p>
                {step2Form.formState.errors.domainContext && (
                  <p className="text-xs text-rose-600 font-medium">
                    {step2Form.formState.errors.domainContext.message}
                  </p>
                )}
              </div>

              {/* Sensitive Attributes Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-800">
                  Protected & Sensitive Attributes Monitored for Fairness
                </label>
                <p className="text-xs text-stone-500">
                  Select demographic attributes that require demographic parity and equalized odds testing.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SENSITIVE_ATTRIBUTE_OPTIONS.map((attr) => {
                    const isSelected = watchedSensitiveAttrs.includes(attr);

                    return (
                      <button
                        type="button"
                        key={attr}
                        onClick={() => {
                          const updated = isSelected
                            ? watchedSensitiveAttrs.filter((a) => a !== attr)
                            : [...watchedSensitiveAttrs, attr];
                          step2Form.setValue('sensitiveAttributes', updated);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                          isSelected
                            ? 'bg-[#5C1A2B] text-white border-[#5C1A2B] shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {attr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Risk Tier Box */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#5C1A2B]" />
                    <span className="text-sm font-bold text-stone-900">
                      Suggested Regulatory Risk Tier
                    </span>
                    {isSuggestingRisk && <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />}
                  </div>
                  {riskSuggestion && (
                    <RiskTierBadge tier={riskSuggestion.suggestedTier} size="md" />
                  )}
                </div>

                {riskSuggestion ? (
                  <div className="space-y-2 text-xs text-stone-700">
                    <p className="leading-relaxed">{riskSuggestion.rationale}</p>
                    {riskSuggestion.regulatoryReferences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {riskSuggestion.regulatoryReferences.map((ref) => (
                          <span
                            key={ref}
                            className="bg-white border border-stone-200 px-2 py-0.5 rounded text-[11px] font-mono text-stone-600"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">
                    Enter your domain context above to compute suggested EU AI Act classification.
                  </p>
                )}
              </div>

              {/* User Override Risk Tier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="riskTier" className="block text-sm font-semibold text-stone-800">
                    Assigned Risk Tier (Override) <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-xs text-stone-500">
                    You can override the suggestion if specific exemptions apply
                  </span>
                </div>

                <select
                  id="riskTier"
                  {...step2Form.register('riskTier')}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                >
                  <option value="minimal">Minimal Risk - Broad transparency and basic logging</option>
                  <option value="limited">Limited Risk - Transparency obligations (Art. 50)</option>
                  <option value="high">High Risk - Comprehensive audit, bias tests & governance</option>
                  <option value="unacceptable">Unacceptable Risk - Prohibited use case</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#722136] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5C1A2B] transition"
                >
                  Continue to Step 3
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Artifact Uploads or LLM Endpoint Config                           */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isLlmArchitecture ? 'Step 3: LLM App Security Endpoint & Prompt' : 'Step 3: Upload Model, Dataset & Documentation'}
            </CardTitle>
            <CardDescription>
              {isLlmArchitecture
                ? 'Configure the target LLM endpoint and system prompt for jailbreak and prompt-injection security audits.'
                : 'Upload your training or evaluation dataset (.csv), serialized model (.joblib/.pkl/.onnx), and system documentation.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {isLlmArchitecture ? (
              /* LLM Application Configuration Form */
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <p className="leading-relaxed">
                    For LLM and Generative AI applications, AegisAI audits prompt injection vulnerability, system prompt leakage, and jailbreak resilience through harmless synthetic test payloads.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="endpointUrl" className="block text-sm font-semibold text-stone-800">
                    Target LLM Endpoint URL <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="endpointUrl"
                    type="url"
                    value={llmConfig.endpointUrl}
                    onChange={(e) => setLlmConfig({ ...llmConfig, endpointUrl: e.target.value })}
                    placeholder="https://api.yourdomain.com/v1/chat/completions"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                  />
                  {llmConfigErrors.endpointUrl && (
                    <p className="text-xs text-rose-600 font-medium">{llmConfigErrors.endpointUrl}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="authHeaderName" className="block text-sm font-semibold text-stone-800">
                      Authorization Header Name
                    </label>
                    <input
                      id="authHeaderName"
                      type="text"
                      value={llmConfig.authHeaderName}
                      onChange={(e) => setLlmConfig({ ...llmConfig, authHeaderName: e.target.value })}
                      placeholder="Authorization"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="authHeaderValue" className="block text-sm font-semibold text-stone-800">
                      Bearer Token / API Key <span className="text-stone-400 font-normal">(stored server-side)</span>
                    </label>
                    <input
                      id="authHeaderValue"
                      type="password"
                      value={llmConfig.authHeaderValue}
                      onChange={(e) => setLlmConfig({ ...llmConfig, authHeaderValue: e.target.value })}
                      placeholder="Bearer sec_..."
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="systemPrompt" className="block text-sm font-semibold text-stone-800">
                    System Prompt Instructions <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="systemPrompt"
                    rows={4}
                    value={llmConfig.systemPrompt}
                    onChange={(e) => setLlmConfig({ ...llmConfig, systemPrompt: e.target.value })}
                    placeholder="You are a helpful customer assistant. You must never divulge financial secrets..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
                  />
                  {llmConfigErrors.systemPrompt && (
                    <p className="text-xs text-rose-600 font-medium">{llmConfigErrors.systemPrompt}</p>
                  )}
                </div>

                {/* Optional Documentation Upload for LLM */}
                <FileDropzone
                  kind="documentation"
                  title="System Documentation / Safety Policies"
                  description="Upload safety guidelines, guardrail specs, or design docs (.pdf, .md, .txt)"
                  acceptedExtensions={['.pdf', '.md', '.txt']}
                  maxSizeBytes={10 * 1024 * 1024}
                  maxFiles={3}
                  files={docFiles}
                  onFilesChange={setDocFiles}
                />
              </div>
            ) : (
              /* Tabular / Classical Model Uploads */
              <div className="space-y-8">
                {/* Dataset Dropzone */}
                <FileDropzone
                  kind="dataset"
                  title="Validation Dataset (.csv)"
                  description="Dataset containing target and protected attributes for data quality and bias testing"
                  acceptedExtensions={['.csv']}
                  maxSizeBytes={25 * 1024 * 1024}
                  maxFiles={1}
                  files={datasetFiles}
                  onFilesChange={setDatasetFiles}
                  required
                />

                {/* Model Dropzone */}
                <FileDropzone
                  kind="model"
                  title="Trained Model File"
                  description="Pre-trained serialized model (.pkl, .joblib, .onnx) for performance & explainability tests"
                  acceptedExtensions={['.joblib', '.pkl', '.onnx']}
                  maxSizeBytes={100 * 1024 * 1024}
                  maxFiles={1}
                  files={modelFiles}
                  onFilesChange={setModelFiles}
                />

                {/* Documentation Dropzone */}
                <FileDropzone
                  kind="documentation"
                  title="System Documentation & Model Cards"
                  description="Architecture diagrams, intended use policies, or model cards (.pdf, .md, .txt)"
                  acceptedExtensions={['.pdf', '.md', '.txt']}
                  maxSizeBytes={10 * 1024 * 1024}
                  maxFiles={3}
                  files={docFiles}
                  onFilesChange={setDocFiles}
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={onStep3Submit}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#722136] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5C1A2B] transition"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Review Screen & Assessment Scope Selection                       */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Review Details & Select Assessment Scope</CardTitle>
            <CardDescription>
              Verify your system registration parameters and select which AegisAI audit modules to execute.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Summary Review Card */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {step1Form.getValues('name') || 'Unnamed System'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Owner: {step1Form.getValues('owner')} &bull; Domain: {step2Form.getValues('domainContext')}
                  </p>
                </div>
                <RiskTierBadge tier={step2Form.getValues('riskTier')} size="md" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-stone-200">
                <div>
                  <span className="font-semibold text-stone-700">Purpose:</span>
                  <p className="text-stone-600 mt-0.5">{step1Form.getValues('purpose')}</p>
                </div>
                <div>
                  <span className="font-semibold text-stone-700">Intended Use:</span>
                  <p className="text-stone-600 mt-0.5">{step1Form.getValues('intendedUse')}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700">Architecture:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200">
                    {step2Form.getValues('modelType')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700">Sensitive Attributes:</span>
                  {step2Form.getValues('sensitiveAttributes')?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {step2Form.getValues('sensitiveAttributes').map((a) => (
                        <span key={a} className="bg-white px-2 py-0.5 rounded border border-stone-200 font-mono text-[11px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-stone-400">None declared</span>
                  )}
                </div>

                {/* Uploaded Artifacts list */}
                <div className="pt-2">
                  <span className="font-semibold text-stone-700 block mb-1">Attached Artifacts:</span>
                  {isLlmArchitecture ? (
                    <p className="text-stone-600">
                      LLM Endpoint: <code className="bg-white px-1.5 py-0.5 rounded border">{llmConfig.endpointUrl || 'Configured'}</code>
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {datasetFiles.length === 0 && modelFiles.length === 0 && docFiles.length === 0 && (
                        <p className="text-stone-400">No files attached</p>
                      )}
                      {datasetFiles.map((f) => (
                        <p key={f.id} className="text-stone-600 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Dataset: <strong>{f.name}</strong></span>
                        </p>
                      ))}
                      {modelFiles.map((f) => (
                        <p key={f.id} className="text-stone-600 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          <span>Model: <strong>{f.name}</strong></span>
                        </p>
                      ))}
                      {docFiles.map((f) => (
                        <p key={f.id} className="text-stone-600 flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Doc: <strong>{f.name}</strong></span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Scope Selection */}
            <form id="step4-form" onSubmit={onFinalSubmit} className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-stone-900 mb-1">
                  Select Assessment Modules to Run
                </h4>
                <p className="text-xs text-stone-500 mb-4">
                  Select which automated compliance and technical audits should be executed.
                </p>

                <div className="space-y-3">
                  {/* Module 2: Data Risk & Fairness */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-[#5C1A2B]/40 cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      {...step4Form.register('runDataRisk')}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#5C1A2B] focus:ring-[#5C1A2B]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#5C1A2B]" />
                        <span className="text-sm font-semibold text-stone-900">
                          M2: Data & Model Risk (Quality & Fairness)
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Detects missing data, outliers, class imbalance, and evaluates disparate impact across sensitive attributes (four-fifths rule).
                      </p>
                    </div>
                  </label>

                  {/* Module 3: Security & Explainability */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-[#5C1A2B]/40 cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      {...step4Form.register('runSecurity')}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#5C1A2B] focus:ring-[#5C1A2B]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#5C1A2B]" />
                        <span className="text-sm font-semibold text-stone-900">
                          M3: Security & Explainability Audit
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Simulates prompt injections / jailbreaks for LLMs, tests serialization security, and generates feature importance explanations.
                      </p>
                    </div>
                  </label>

                  {/* Module 4: Governance Mapping */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-[#5C1A2B]/40 cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      {...step4Form.register('runGovernance')}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#5C1A2B] focus:ring-[#5C1A2B]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#5C1A2B]" />
                        <span className="text-sm font-semibold text-stone-900">
                          M4: Regulatory Governance Mapping
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Maps controls against the EU AI Act High-Risk requirements, NIST AI RMF, and ISO/IEC 42001 standards.
                      </p>
                    </div>
                  </label>
                </div>

                {step4Form.formState.errors.runDataRisk && (
                  <p className="text-xs text-rose-600 font-medium mt-2">
                    {step4Form.formState.errors.runDataRisk.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#722136] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5C1A2B] transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering System...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Create Assessment & Register
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
