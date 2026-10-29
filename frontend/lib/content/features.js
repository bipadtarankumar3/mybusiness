/**
 * Feature content used by the homepage grid, /features and /features/[slug].
 * `status` describes what exists today so marketing copy never over-promises.
 */
export const features = [
  {
    slug: 'customer-crm',
    name: 'Customer CRM',
    icon: 'Users',
    tone: 'green',
    short: 'Every customer, enquiry and note — organised in one place.',
    headline: 'A customer list that actually helps you sell.',
    intro:
      'Stop scrolling through chats and notebooks to remember who asked what. Keep every customer, their tags, enquiry history and notes together — so anyone on your team can pick up where you left off.',
    bullets: ['Manage customer records', 'Organise contacts with tags', 'Track enquiry history', 'View customer notes'],
    details: [
      { title: 'Smart tags', text: 'Group customers as VIP, wholesale, new enquiry or any label that matches how you work.', icon: 'Tags' },
      { title: 'Lead status', text: 'Move customers from new to contacted, qualified and customer with one click.', icon: 'TrendingUp' },
      { title: 'Follow-up reminders', text: 'Schedule a reminder against any customer and see what is due today.', icon: 'BellRing' },
      { title: 'Sales records', text: 'Record sales against customers to understand who your best buyers are.', icon: 'IndianRupee' },
    ],
    status: 'Available',
  },
  {
    slug: 'shared-inbox',
    name: 'Shared Inbox',
    icon: 'Inbox',
    tone: 'blue',
    short: 'Handle supported conversations together, without stepping on toes.',
    headline: 'One inbox for the whole team.',
    intro:
      'Give your team one shared view of customer conversations. Assign enquiries, track status, and leave internal notes that customers never see.',
    bullets: [
      'Manage supported conversations in one place',
      'Assign enquiries to team members',
      'Track conversation status',
      'Add internal notes',
    ],
    details: [
      { title: 'Assignment', text: 'Route each enquiry to the right person and see who is handling what.', icon: 'UserCheck' },
      { title: 'Open, pending, resolved', text: 'Clear statuses so nothing slips through the cracks.', icon: 'CircleCheck' },
      { title: 'Internal notes', text: 'Discuss a customer privately right inside the conversation.', icon: 'StickyNote' },
      { title: 'Customer context', text: 'See tags, lead status and history beside every chat.', icon: 'IdCard' },
    ],
    status: 'Demo inbox available · Live WhatsApp requires Business Platform setup',
  },
  {
    slug: 'automation',
    name: 'Smart Automation',
    icon: 'Workflow',
    tone: 'purple',
    short: 'Let routine replies, reminders and assignments run themselves.',
    headline: 'Automate the routine. Keep the personal touch.',
    intro:
      'Build simple workflows from triggers, conditions and actions. Assign new enquiries, create follow-up reminders and update lead status automatically — without code.',
    bullets: [
      'Build workflows using triggers and actions',
      'Schedule eligible reminders',
      'Automate supported responses',
      'Reduce repetitive work',
    ],
    details: [
      { title: 'Triggers', text: 'New conversation, keyword received or tag added.', icon: 'Zap' },
      { title: 'Conditions', text: 'Business hours, customer tags or lead status.', icon: 'GitBranch' },
      { title: 'Actions', text: 'Assign a member, add a tag, create a follow-up or update status.', icon: 'Play' },
      { title: 'Execution log', text: 'See every run and why a step was executed or skipped.', icon: 'ListChecks' },
    ],
    status: 'Workflow builder available · Supported steps only',
  },
  {
    slug: 'campaigns',
    name: 'Campaign Manager',
    icon: 'Megaphone',
    tone: 'coral',
    short: 'Send approved-template campaigns to customers who opted in.',
    headline: 'Campaigns that respect your customers — and your budget.',
    intro:
      'Create campaigns using approved WhatsApp message templates, choose an opted-in audience by tags or lead status, preview the message and see an estimated messaging cost before you launch.',
    bullets: [
      'Create and manage eligible campaigns',
      'Use approved message templates',
      'Track delivery and campaign outcomes',
      'Display estimated messaging charges',
    ],
    details: [
      { title: 'Consent first', text: 'Only customers who opted in are included. Opt-outs are honoured automatically.', icon: 'ShieldCheck' },
      { title: 'Pre-launch checks', text: 'Template approval, audience size and plan limits are validated first.', icon: 'ClipboardCheck' },
      { title: 'Cost estimate', text: 'See an estimated WhatsApp charge before sending anything.', icon: 'Calculator' },
      { title: 'Delivery stats', text: 'Delivered and read counts come only from provider confirmations.', icon: 'BarChart3' },
    ],
    status: 'Drafts & previews available · Sending requires WhatsApp Business Platform setup',
  },
  {
    slug: 'ai-assistant',
    name: 'AI Assistant',
    icon: 'Sparkles',
    tone: 'yellow',
    short: 'Draft replies, summarise chats and write campaign copy faster.',
    headline: 'An assistant that helps you reply faster.',
    intro:
      'Get reply suggestions, quick conversation summaries, enquiry classification and campaign copy ideas — with configurable usage limits so costs never surprise you.',
    bullets: [
      'Generate reply suggestions',
      'Summarise conversations',
      'Classify customer enquiries',
      'Generate campaign copy',
      'Apply configurable AI usage limits',
    ],
    details: [
      { title: 'Reply suggestions', text: 'Draft a response using the conversation and your business knowledge.', icon: 'MessageSquareText' },
      { title: 'Summaries', text: 'Catch up on a long conversation in a few lines.', icon: 'FileText' },
      { title: 'Campaign copy', text: 'Turn a goal into a short, friendly message draft.', icon: 'PenLine' },
      { title: 'Usage limits', text: 'Monthly allowances per plan keep AI costs predictable.', icon: 'Gauge' },
    ],
    status: 'Requires an AI provider to be configured',
  },
  {
    slug: 'analytics',
    name: 'Business Analytics',
    icon: 'BarChart3',
    tone: 'green',
    short: 'See enquiries, conversions, follow-ups and recorded sales at a glance.',
    headline: 'Know what is working — in numbers you trust.',
    intro:
      'Track enquiries over time, lead conversion, follow-up performance, campaign outcomes and recorded sales. Every chart is built from data actually recorded in your workspace.',
    bullets: [
      'Track enquiries and conversions',
      'View campaign performance',
      'Monitor follow-ups',
      'Track recorded sales and estimated ROI',
    ],
    details: [
      { title: 'Enquiry trends', text: 'Daily enquiries for the last 7, 30 or 90 days.', icon: 'LineChart' },
      { title: 'Lead funnel', text: 'See how many leads reach qualified and customer.', icon: 'Filter' },
      { title: 'Recorded sales', text: 'Sales you record, tied back to customers.', icon: 'IndianRupee' },
      { title: 'Usage & costs', text: 'Messaging and AI usage against your plan.', icon: 'Wallet' },
    ],
    status: 'Available',
  },
];

export const featureBySlug = Object.fromEntries(features.map((f) => [f.slug, f]));

export const integrations = [
  { name: 'WhatsApp Business Platform', status: 'In setup', note: 'Official Cloud API foundation built in. Requires your Meta credentials.', icon: 'MessageCircle', tone: 'green' },
  { name: 'Website contact forms', status: 'Planned', note: 'Capture enquiries from your site directly into the CRM.', icon: 'Globe', tone: 'blue' },
  { name: 'Instagram', status: 'Planned', note: 'Manage Instagram direct messages in the same inbox.', icon: 'Instagram', tone: 'coral' },
  { name: 'Facebook Messenger', status: 'Planned', note: 'Bring Messenger conversations into ChatFlow.', icon: 'Facebook', tone: 'blue' },
  { name: 'Payment links', status: 'Planned', note: 'Share payment links in conversations.', icon: 'CreditCard', tone: 'purple' },
  { name: 'Spreadsheets import', status: 'Planned', note: 'Import customer lists from CSV files.', icon: 'Sheet', tone: 'yellow' },
];

