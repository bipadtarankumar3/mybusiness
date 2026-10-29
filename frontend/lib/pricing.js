/**
 * Initial pricing assumptions — update here and the whole site follows.
 * Yearly price = 10 × monthly (2 months free).
 */
export const currency = '₹';

export const plans = [
  {
    code: 'free',
    name: 'Free',
    monthly: 0,
    blurb: 'Try the essentials and organise your first customers.',
    cta: { label: 'Start Free', href: '/register?plan=free' },
    limits: { contacts: '250', members: '1', workflows: '—', campaigns: '—', ai: '50 / mo' },
    features: ['Customer CRM with tags & notes', 'Follow-up reminders', 'Demo inbox to explore', 'Basic analytics'],
  },
  {
    code: 'starter',
    name: 'Starter',
    monthly: 199,
    blurb: 'For solo owners ready to follow up on every enquiry.',
    cta: { label: 'Start Free', href: '/register?plan=starter' },
    limits: { contacts: '2,000', members: '2', workflows: '2', campaigns: '2 / mo', ai: '100 / mo' },
    features: ['Everything in Free', 'Shared inbox (WhatsApp setup required)', '2 automation workflows', 'Approved template campaigns'],
  },
  {
    code: 'growth',
    name: 'Growth',
    monthly: 499,
    recommended: true,
    blurb: 'For small teams that want automation doing the routine work.',
    cta: { label: 'Start Free', href: '/register?plan=growth' },
    limits: { contacts: '10,000', members: '5', workflows: '10', campaigns: '10 / mo', ai: '500 / mo' },
    features: ['Everything in Starter', 'Team assignment & internal notes', '10 automation workflows', 'AI reply suggestions', 'Sales & ROI tracking'],
  },
  {
    code: 'pro',
    name: 'Pro',
    monthly: 999,
    blurb: 'For busy businesses with multiple agents and campaigns.',
    cta: { label: 'Start Free', href: '/register?plan=pro' },
    limits: { contacts: '50,000', members: '15', workflows: 'Unlimited', campaigns: 'Unlimited', ai: '2,000 / mo' },
    features: ['Everything in Growth', 'Unlimited workflows', 'Advanced analytics', 'Priority support'],
  },
  {
    code: 'business',
    name: 'Business',
    monthly: null,
    blurb: 'Custom limits, onboarding and support for larger teams.',
    cta: { label: 'Contact sales', href: '/contact?topic=sales' },
    limits: { contacts: 'Custom', members: 'Custom', workflows: 'Unlimited', campaigns: 'Unlimited', ai: 'Custom' },
    features: ['Everything in Pro', 'Custom usage limits', 'Guided onboarding', 'Dedicated success contact'],
  },
];

export const limitLabels = {
  contacts: 'Contacts',
  members: 'Team members',
  workflows: 'Automation workflows',
  campaigns: 'Campaigns',
  ai: 'AI requests',
};

export function priceFor(plan, cycle) {
  if (plan.monthly === null) return null;
  return cycle === 'yearly' ? plan.monthly * 10 : plan.monthly;
}

export const pricingFaq = [
  {
    q: 'Are WhatsApp messaging charges included in the plan price?',
    a: 'No. Meta charges for certain WhatsApp conversations and template messages. These charges depend on the message category and are billed separately from your ChatFlow subscription. ChatFlow shows an estimate before you launch a campaign.',
  },
  {
    q: 'Is AI usage unlimited?',
    a: 'No. Each plan includes a monthly AI request allowance. AI features require an AI provider to be configured, and heavy usage may be billed separately in future.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can start on Free and move to a paid plan when you need more contacts, team members or automation. Online payments are not yet live — paid plans are currently activated with help from our team.',
  },
  {
    q: 'What does the yearly price include?',
    a: 'Yearly billing is priced at 10 months of the monthly price, so you get two months free compared to paying monthly.',
  },
  {
    q: 'Do you offer unlimited messaging?',
    a: 'No — and we think you should be cautious of anyone who does at very low prices. Messaging costs are set by WhatsApp and depend on volume and category. We keep them transparent instead.',
  },
];

