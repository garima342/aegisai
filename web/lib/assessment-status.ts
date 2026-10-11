type Scope = {
  runDataRisk: boolean;
  runSecurity: boolean;
  runGovernance: boolean;
};

type ArtifactLike = {
  kind?: string | null;
};

export function validateStatusTransition({
  currentStatus,
  nextStatus,
  scope,
  artifacts,
}: {
  currentStatus: string;
  nextStatus: string;
  scope: Scope;
  artifacts: ArtifactLike[];
}) {
  const errors: string[] = [];

  if (nextStatus !== 'intake_complete') {
    return { ok: true, errors: [], currentStatus, nextStatus };
  }

  if (scope.runDataRisk && !artifacts.some((artifact) => artifact.kind === 'dataset')) {
    errors.push('dataset is required for data risk assessment');
  }

  if (scope.runSecurity && !artifacts.some((artifact) => artifact.kind === 'llm_config')) {
    errors.push('llm_config is required for security assessment');
  }

  return {
    ok: errors.length === 0,
    errors,
    currentStatus,
    nextStatus,
  };
}
