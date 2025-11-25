
export type PlanID = 'free' | 'plus' | 'pro' | 'ultra' | 'team' | 'business';

export interface Plan {
  id: PlanID;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    annual: number;
  };
  credits: number;
  features: string[] | ((billingCycle: 'monthly' | 'annual') => string[]);
  isFeatured?: boolean;
}

export const freePlan: Plan = {
  id: 'free',
  name: 'Free Trial',
  description: 'A one-time starter pack to explore Social Butterfly.',
  pricing: {
    monthly: 0,
    annual: 0,
  },
  credits: 300,
  features: [
    '<strong>300</strong> one-time credits',
    'Access to Chat Strategy',
    'Standard AI Models',
    'No monthly refill',
  ],
};

export const individualPlans: Plan[] = [
  {
    id: 'plus',
    name: 'Plus',
    description: 'For extra AI power and removing Gamma branding',
    pricing: {
      monthly: 15,
      annual: 12,
    },
    credits: 1000,
    features: [
      '<strong>1,000</strong> monthly credits',
      'Unlimited AI creations',
      'Core business strategy tools',
      'Standard Image Generation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For premium AI models, API, and more customization',
    pricing: {
      monthly: 29,
      annual: 24,
    },
    credits: 4000,
    features: [
      '<strong>4,000</strong> monthly credits',
      'Everything in Plus, and:',
      'Premium Image models (Imagen 4)',
      'Video Generation (Veo)',
      'Document Analysis (Gemini 2.5 Pro)',
      'Early access to new features',
    ],
    isFeatured: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'For 20x more AI usage and unlocking access to the most advanced models',
    pricing: {
      monthly: 99,
      annual: 80,
    },
    credits: 20000,
    features: [
      '<strong>20,000</strong> monthly credits',
      'Everything in Pro, and:',
      'Access to the most advanced AI models',
      'Priority Support',
      'Highest generation limits',
    ],
  },
];

export const teamPlans: Plan[] = [
    {
      id: 'team',
      name: 'Team',
      description: 'For teams who want more collaboration, AI, and branding tools.',
      pricing: {
        monthly: 25,
        annual: 20,
      },
      credits: 6000,
      features: (billingCycle) => [
        `<strong>6,000</strong> monthly credits per seat`,
        'Unlimited AI creations',
        'Centralized billing',
        'Shared resources & templates',
        'All <strong>Pro</strong> plan features',
        `Billed at <strong>$${billingCycle === 'annual' ? 240 : 25 * 12}/year/seat</strong>`,
      ],
      isFeatured: true,
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For organizations ready to make it official with Social Butterfly AI.',
      pricing: {
        monthly: 49,
        annual: 40,
      },
      credits: 10000,
      features: (billingCycle) => [
        `<strong>10,000</strong> monthly credits per seat`,
        'Everything in Team, and:',
        'Advanced collaboration controls',
        'Admin roles and permissions',
        'Dedicated success manager',
        `Billed at <strong>$${billingCycle === 'annual' ? 480 : 49 * 12}/year/seat</strong>`,
      ],
    },
];

const allPlans: { [key in PlanID]: Plan } = {
    free: freePlan,
    plus: individualPlans[0],
    pro: individualPlans[1],
    ultra: individualPlans[2],
    team: teamPlans[0],
    business: teamPlans[1],
};

export const getPlanDetails = (id: PlanID): Plan | undefined => {
    return allPlans[id];
};
