/**
 * Central brand + site configuration.
 * Change the brand name, tagline, domain, contact details, or social links here.
 */
export const siteConfig = {
  name: 'ChatFlow',
  tagline: 'Turn Every Conversation Into Growth.',
  description:
    'One affordable platform to manage customers, automate conversations, recover leads, and grow your business.',
  shortDescription: 'Affordable WhatsApp CRM and business automation for growing Indian businesses.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  locale: 'en_IN',
  announcement: 'Introducing affordable business automation for India’s growing businesses.',
  contact: {
    // Leave empty until real addresses are configured — the UI hides empty values.
    email: '',
    phone: '',
    address: 'India',
  },
  // Social links: set a URL to show the icon as a real link. Empty = shown as "coming soon".
  social: {
    linkedin: '',
    x: '',
    instagram: '',
    youtube: '',
  },
  docsUrl: '', // External documentation URL, when available.
};

export const mainNav = [
  {
    label: 'Product',
    items: [
      { label: 'Shared Inbox', href: '/features/shared-inbox', description: 'Every conversation, one team view.', icon: 'Inbox' },
      { label: 'Customer CRM', href: '/features/customer-crm', description: 'Contacts, tags, notes and history.', icon: 'Users' },
      { label: 'Campaigns', href: '/features/campaigns', description: 'Approved-template broadcasts.', icon: 'Megaphone' },
      { label: 'Analytics', href: '/features/analytics', description: 'Enquiries, conversions and ROI.', icon: 'BarChart3' },
    ],
  },
  {
    label: 'Features',
    items: [
      { label: 'All features', href: '/features', description: 'Explore the full platform.', icon: 'LayoutGrid' },
      { label: 'Smart Automation', href: '/features/automation', description: 'Triggers, conditions and actions.', icon: 'Workflow' },
      { label: 'AI Assistant', href: '/features/ai-assistant', description: 'Suggestions, summaries and copy.', icon: 'Sparkles' },
    ],
  },
  {
    label: 'Solutions',
    items: [
      { label: 'Retail & local shops', href: '/solutions/retail', description: 'Stock enquiries to repeat buyers.', icon: 'Store' },
      { label: 'Coaching centres', href: '/solutions/coaching', description: 'Admissions and batch reminders.', icon: 'GraduationCap' },
      { label: 'Beauty salons', href: '/solutions/salons', description: 'Bookings and rebooking nudges.', icon: 'Scissors' },
      { label: 'Restaurants', href: '/solutions/restaurants', description: 'Orders, menus and feedback.', icon: 'UtensilsCrossed' },
      { label: 'Real estate', href: '/solutions/real-estate', description: 'Site visits and lead nurturing.', icon: 'Building2' },
    ],
  },
  { label: 'Integrations', href: '/features#integrations' },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources',
    items: [
      { label: 'About us', href: '/about', description: 'Why we are building ChatFlow.', icon: 'Heart' },
      { label: 'Contact', href: '/contact', description: 'Talk to our team.', icon: 'Mail' },
      { label: 'Pricing FAQ', href: '/pricing#faq', description: 'Usage and billing explained.', icon: 'HelpCircle' },
    ],
  },
];

export const footerNav = [
  {
    title: 'Product',
    links: [
      { label: 'All features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/features#integrations' },
      { label: 'Start free', href: '/register' },
    ],
  },
  {
    title: 'Features',
    links: [
      { label: 'Customer CRM', href: '/features/customer-crm' },
      { label: 'Shared Inbox', href: '/features/shared-inbox' },
      { label: 'Automation', href: '/features/automation' },
      { label: 'Campaigns', href: '/features/campaigns' },
      { label: 'AI Assistant', href: '/features/ai-assistant' },
      { label: 'Analytics', href: '/features/analytics' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Retail', href: '/solutions/retail' },
      { label: 'Coaching', href: '/solutions/coaching' },
      { label: 'Salons', href: '/solutions/salons' },
      { label: 'Restaurants', href: '/solutions/restaurants' },
      { label: 'Real estate', href: '/solutions/real-estate' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Documentation', href: siteConfig.docsUrl || '/contact?topic=docs' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

