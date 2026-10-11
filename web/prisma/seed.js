async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
  const existingSystem = await prisma.aiSystem.findFirst({
    where: { name: 'HR Recruitment AI' },
  });

  const system =
    existingSystem ??
    (await prisma.aiSystem.create({
      data: {
        name: 'HR Recruitment AI',
        description: 'Applicant screening assistant for early-stage recruitment triage.',
        purpose: 'Screen candidate resumes and rank them for recruiter review.',
        intendedUse: 'Assist recruiters in initial applicant review and shortlist planning.',
        modelType: 'llm_app',
        riskTier: 'high',
        domainContext: 'hiring',
        sensitiveAttributes: ['gender', 'age', 'ethnicity'],
        owner: 'talent-ops',
        llmConfig: {
          endpointUrl: 'https://api.example.com/v1/chat',
          authHeaderName: 'Authorization',
          authHeaderValue: 'Bearer demo-secret',
          systemPrompt: 'You are an HR screening assistant. Provide structured candidate summaries.',
          description: 'Used for resume triage in the hiring pipeline.',
        },
      },
    }));

  const existingAssessment = await prisma.assessment.findUnique({
    where: { id: 'hr-recruitment-assessment' },
  });

  const assessment =
    existingAssessment ??
    (await prisma.assessment.create({
      data: {
        id: 'hr-recruitment-assessment',
        aiSystemId: system.id,
        status: 'intake_complete',
        runDataRisk: true,
        runSecurity: true,
        runGovernance: true,
      },
    }));

  await prisma.artifact.upsert({
    where: { id: 'hr-recruitment-dataset' },
    update: {},
    create: {
      id: 'hr-recruitment-dataset',
      assessmentId: assessment.id,
      kind: 'dataset',
      filename: 'resume-data.csv',
      mime: 'text/csv',
      size: 2048,
      storageKey: 'seed/resume-data.csv',
    },
  });

  await prisma.artifact.upsert({
    where: { id: 'hr-recruitment-llm-config' },
    update: {},
    create: {
      id: 'hr-recruitment-llm-config',
      assessmentId: assessment.id,
      kind: 'llm_config',
      filename: 'llm-config.json',
      mime: 'application/json',
      size: 2048,
      storageKey: 'seed/llm-config.json',
    },
  });

  console.log('Seeded HR Recruitment AI example');
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
