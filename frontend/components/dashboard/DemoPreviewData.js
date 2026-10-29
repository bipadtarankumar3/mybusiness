/**
 * Realistic Indian SMB demo & preview fallback data.
 * Used ONLY when the backend API is unreachable during preview or when viewing
 * clearly labelled Demo Previews (e.g. unconfigured AI / WhatsApp).
 */

export const DEMO_SESSION = {
  user: {
    id: 1,
    name: 'Aarav Mehta',
    email: 'demo@chatflow.local',
    isSuperAdmin: false,
  },
  impersonatedBy: null,
  business: {
    id: 1,
    name: 'Ananya Ethnic Studio',
    slug: 'ananya-ethnic-studio',
    isDemo: true,
    industry: 'Retail & Boutique',
    timezone: 'Asia/Kolkata',
    phone: '+91 98201 44500',
    website: 'https://ananyastudio.in',
    businessHours: {
      mon: { open: true, start: '10:00', end: '20:00' },
      tue: { open: true, start: '10:00', end: '20:00' },
      wed: { open: true, start: '10:00', end: '20:00' },
      thu: { open: true, start: '10:00', end: '20:00' },
      fri: { open: true, start: '10:00', end: '20:30' },
      sat: { open: true, start: '10:30', end: '21:00' },
      sun: { open: false, start: '11:00', end: '18:00' },
    },
  },
  role: 'owner',
  plan: {
    code: 'growth',
    name: 'Growth',
  },
};

export const DEMO_ADMIN_SESSION = {
  user: {
    id: 99,
    name: 'Vikram Singh (Platform Admin)',
    email: 'admin@chatflow.local',
    isSuperAdmin: true,
  },
  impersonatedBy: null,
  business: {
    id: 1,
    name: 'ChatFlow Super Admin Platform',
    slug: 'chatflow-super-admin',
    isDemo: false,
    industry: 'SaaS Platform Control',
    timezone: 'Asia/Kolkata',
  },
  role: 'superadmin',
  plan: {
    code: 'business',
    name: 'Super Admin',
  },
};

export const DEMO_TAGS = [
  { id: 1, name: 'VIP Buyer', color: '#16C784', customerCount: 18 },
  { id: 2, name: 'Festive Enquiry', color: '#8B5CF6', customerCount: 34 },
  { id: 3, name: 'Bridal Trial', color: '#FB7185', customerCount: 9 },
  { id: 4, name: 'Wholesale Lead', color: '#60A5FA', customerCount: 12 },
  { id: 5, name: 'Payment Pending', color: '#FBBF24', customerCount: 6 },
];

export const DEMO_TEAM = [
  { id: 1, userId: 1, name: 'Aarav Mehta', email: 'demo@chatflow.local', role: 'owner', status: 'active' },
  { id: 2, userId: 2, name: 'Neha Kulkarni', email: 'neha@chatflow.local', role: 'admin', status: 'active' },
  { id: 3, userId: 3, name: 'Rohan Joshi', email: 'rohan@chatflow.local', role: 'agent', status: 'active' },
];

export const DEMO_CONTACTS = [
  {
    id: 1,
    name: 'Priya Sharma',
    phone: '+919876543210',
    email: 'priya.sharma@example.in',
    leadStatus: 'qualified',
    source: 'whatsapp',
    notes: 'Interested in Banarasi silk saree collection for sister wedding in November. Prefers pastel shades.',
    whatsappOptIn: true,
    optInAt: '2026-10-12T09:30:00.000Z',
    optedOutAt: null,
    lastContactedAt: '2026-10-29T10:15:00.000Z',
    createdAt: '2026-10-10T08:20:00.000Z',
    tags: [
      { id: 1, name: 'VIP Buyer', color: '#16C784' },
      { id: 3, name: 'Bridal Trial', color: '#FB7185' },
    ],
  },
  {
    id: 2,
    name: 'Vikram Patel',
    phone: '+919820411223',
    email: 'vikram.patel@surattextiles.in',
    leadStatus: 'customer',
    source: 'referral',
    notes: 'Ordered 15 festive gift hampers for corporate Diwali gifting. Invoice #INV-204 paid via UPI.',
    whatsappOptIn: true,
    optInAt: '2026-10-04T11:00:00.000Z',
    optedOutAt: null,
    lastContactedAt: '2026-10-28T16:40:00.000Z',
    createdAt: '2026-10-02T14:10:00.000Z',
    tags: [
      { id: 1, name: 'VIP Buyer', color: '#16C784' },
      { id: 4, name: 'Wholesale Lead', color: '#60A5FA' },
    ],
  },
  {
    id: 3,
    name: 'Meera Nair',
    phone: '+919740088112',
    email: 'meera.nair@gmail.com',
    leadStatus: 'new',
    source: 'website',
    notes: 'Enquired from Instagram catalogue link about embroidered kurta sets in size M.',
    whatsappOptIn: true,
    optInAt: '2026-10-29T07:45:00.000Z',
    optedOutAt: null,
    lastContactedAt: '2026-10-29T07:50:00.000Z',
    createdAt: '2026-10-29T07:45:00.000Z',
    tags: [{ id: 2, name: 'Festive Enquiry', color: '#8B5CF6' }],
  },
  {
    id: 4,
    name: 'Arjun Verma',
    phone: '+919811223344',
    email: 'arjun.v@outlook.com',
    leadStatus: 'contacted',
    source: 'walk_in',
    notes: 'Visited store on Saturday. Waiting for custom sherwani measurement confirmation.',
    whatsappOptIn: true,
    optInAt: '2026-10-24T13:15:00.000Z',
    optedOutAt: null,
    lastContactedAt: '2026-10-27T12:10:00.000Z',
    createdAt: '2026-10-24T13:15:00.000Z',
    tags: [{ id: 5, name: 'Payment Pending', color: '#FBBF24' }],
  },
  {
    id: 5,
    name: 'Kavita Deshmukh',
    phone: '+919922033445',
    email: null,
    leadStatus: 'qualified',
    source: 'whatsapp',
    notes: 'Requested video call walkthrough of new Paithani collection.',
    whatsappOptIn: true,
    optInAt: '2026-10-19T10:00:00.000Z',
    optedOutAt: null,
    lastContactedAt: '2026-10-28T14:25:00.000Z',
    createdAt: '2026-10-19T10:00:00.000Z',
    tags: [{ id: 2, name: 'Festive Enquiry', color: '#8B5CF6' }],
  },
  {
    id: 6,
    name: 'Siddharth Malhotra',
    phone: '+919650011998',
    email: 'siddharth@example.com',
    leadStatus: 'lost',
    source: 'manual',
    notes: 'Needed same-day international courier to Dubai which was unavailable.',
    whatsappOptIn: false,
    optInAt: null,
    optedOutAt: '2026-10-21T09:00:00.000Z',
    lastContactedAt: '2026-10-20T18:00:00.000Z',
    createdAt: '2026-10-18T11:00:00.000Z',
    tags: [],
  },
];

export const DEMO_CONVERSATIONS = [
  {
    id: 101,
    channel: 'whatsapp',
    status: 'open',
    isDemo: true,
    unreadCount: 2,
    lastMessageAt: '2026-10-29T10:15:00.000Z',
    lastMessagePreview: 'Can we book a bridal trial slot this Friday around 4 PM?',
    assignedTo: { id: 1, name: 'Aarav Mehta' },
    customer: DEMO_CONTACTS[0],
  },
  {
    id: 102,
    channel: 'whatsapp',
    status: 'pending',
    isDemo: true,
    unreadCount: 0,
    lastMessageAt: '2026-10-29T07:50:00.000Z',
    lastMessagePreview: 'Shared the Festive Lookbook PDF and size chart.',
    assignedTo: { id: 3, name: 'Rohan Joshi' },
    customer: DEMO_CONTACTS[2],
  },
  {
    id: 103,
    channel: 'whatsapp',
    status: 'open',
    isDemo: true,
    unreadCount: 1,
    lastMessageAt: '2026-10-28T16:40:00.000Z',
    lastMessagePreview: 'Payment of ₹28,500 transferred via UPI. Please share GST invoice.',
    assignedTo: { id: 2, name: 'Neha Kulkarni' },
    customer: DEMO_CONTACTS[1],
  },
  {
    id: 104,
    channel: 'whatsapp',
    status: 'resolved',
    isDemo: true,
    unreadCount: 0,
    lastMessageAt: '2026-10-27T12:10:00.000Z',
    lastMessagePreview: 'Thank you! Will visit for trial on Saturday.',
    assignedTo: null,
    customer: DEMO_CONTACTS[3],
  },
];

export const DEMO_MESSAGES_BY_CONV = {
  101: [
    {
      id: 1001,
      conversationId: 101,
      direction: 'inbound',
      type: 'text',
      body: 'Namaste! I saw your Pastel Organza & Banarasi collection on Instagram. Is it available in store?',
      status: 'received',
      providerMessageId: null,
      errorMessage: null,
      sentBy: null,
      createdAt: '2026-10-29T09:50:00.000Z',
    },
    {
      id: 1002,
      conversationId: 101,
      direction: 'outbound',
      type: 'text',
      body: 'Namaste Priya ji! Yes, the entire festive Banarasi & Organza range is available at our flagship studio. Would you like photos of the pastel mint and rose gold pieces?',
      status: 'simulated',
      providerMessageId: null,
      errorMessage: null,
      sentBy: { id: 1, name: 'Aarav Mehta' },
      createdAt: '2026-10-29T09:56:00.000Z',
    },
    {
      id: 1003,
      conversationId: 101,
      direction: 'outbound',
      type: 'note',
      body: 'Internal Note: Priya is a repeat VIP customer (referred by Ritu). Keep the 10% loyalty discount ready if she books 2+ sarees.',
      status: 'simulated',
      providerMessageId: null,
      errorMessage: null,
      sentBy: { id: 1, name: 'Aarav Mehta' },
      createdAt: '2026-10-29T10:01:00.000Z',
    },
    {
      id: 1004,
      conversationId: 101,
      direction: 'inbound',
      type: 'text',
      body: 'Can we book a bridal trial slot this Friday around 4 PM?',
      status: 'received',
      providerMessageId: null,
      errorMessage: null,
      sentBy: null,
      createdAt: '2026-10-29T10:15:00.000Z',
    },
  ],
  102: [
    {
      id: 1005,
      conversationId: 102,
      direction: 'inbound',
      type: 'text',
      body: 'Hi, do you have the Emerald Chanderi Kurta set in Medium size? What is the price with shipping to Bengaluru?',
      status: 'received',
      providerMessageId: null,
      errorMessage: null,
      sentBy: null,
      createdAt: '2026-10-29T07:45:00.000Z',
    },
    {
      id: 1006,
      conversationId: 102,
      direction: 'outbound',
      type: 'text',
      body: 'Hi Meera! Yes, Size M is ready to ship. It is ₹3,490 with free express shipping to Bengaluru (3-4 days).',
      status: 'simulated',
      providerMessageId: null,
      errorMessage: null,
      sentBy: { id: 3, name: 'Rohan Joshi' },
      createdAt: '2026-10-29T07:50:00.000Z',
    },
  ],
  103: [
    {
      id: 1007,
      conversationId: 103,
      direction: 'inbound',
      type: 'text',
      body: 'Payment of ₹28,500 transferred via UPI. Please share GST invoice.',
      status: 'received',
      providerMessageId: null,
      errorMessage: null,
      sentBy: null,
      createdAt: '2026-10-28T16:40:00.000Z',
    },
  ],
  104: [
    {
      id: 1008,
      conversationId: 104,
      direction: 'inbound',
      type: 'text',
      body: 'Thank you! Will visit for trial on Saturday.',
      status: 'received',
      providerMessageId: null,
      errorMessage: null,
      sentBy: null,
      createdAt: '2026-10-27T12:10:00.000Z',
    },
  ],
};

export const DEMO_FOLLOW_UPS = [
  {
    id: 201,
    customerId: 1,
    customer: { id: 1, name: 'Priya Sharma', phone: '+919876543210' },
    title: 'Confirm Friday 4 PM bridal trial slot & stylist',
    notes: 'Keep 4 pastel Banarasi sarees ready in trial room B.',
    dueAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // overdue
    status: 'pending',
    completedAt: null,
    assignedToUserId: 1,
  },
  {
    id: 202,
    customerId: 4,
    customer: { id: 4, name: 'Arjun Verma', phone: '+919811223344' },
    title: 'Collect 50% advance UPI link for custom sherwani',
    notes: 'Total order value ₹18,900. Advance ₹9,450.',
    dueAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // today
    status: 'pending',
    completedAt: null,
    assignedToUserId: 1,
  },
  {
    id: 203,
    customerId: 3,
    customer: { id: 3, name: 'Meera Nair', phone: '+919740088112' },
    title: 'Share Bengaluru courier tracking link once dispatched',
    notes: 'BlueDart Express airway bill.',
    dueAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(), // upcoming
    status: 'pending',
    completedAt: null,
    assignedToUserId: 3,
  },
  {
    id: 204,
    customerId: 2,
    customer: { id: 2, name: 'Vikram Patel', phone: '+919820411223' },
    title: 'Send GST tax invoice #INV-204 on WhatsApp',
    notes: 'Completed after verifying UPI settlement.',
    dueAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    status: 'completed',
    completedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    assignedToUserId: 2,
  },
];

export const DEMO_SALES = [
  {
    id: 301,
    customerId: 2,
    amount: '28500.00',
    note: '15 Corporate Festive Hampers (#INV-204)',
    recordedAt: '2026-10-28T16:45:00.000Z',
  },
  {
    id: 302,
    customerId: 1,
    amount: '14800.00',
    note: 'Handloom Kanjeevaram Saree + Blouse stitching',
    recordedAt: '2026-10-22T14:20:00.000Z',
  },
  {
    id: 303,
    customerId: 5,
    amount: '9200.00',
    note: 'Festive Paithani Dupatta Set',
    recordedAt: '2026-10-20T11:30:00.000Z',
  },
];

export const DEMO_TEMPLATES = [
  {
    id: 1,
    name: 'diwali_festive_showcase_2026',
    category: 'marketing',
    language: 'en_IN',
    body: 'Namaste {{1}}! ✨ Our handcrafted Festive & Wedding Edit is now live at Ananya Studio. Enjoy flat ₹1,000 off on orders above ₹7,999 this week. Reply YES to get the lookbook on WhatsApp!',
    variables: ['customer_name'],
    status: 'approved',
    isDemo: true,
  },
  {
    id: 2,
    name: 'appointment_trial_reminder',
    category: 'utility',
    language: 'en_IN',
    body: 'Hi {{1}}, your styling appointment at Ananya Ethnic Studio is scheduled for {{2}}. Reply 1 to confirm or 2 to reschedule.',
    variables: ['customer_name', 'appointment_time'],
    status: 'approved',
    isDemo: true,
  },
  {
    id: 3,
    name: 'order_payment_confirmation',
    category: 'utility',
    language: 'en_IN',
    body: 'Thank you {{1}}! We have received your payment of ₹{{2}}. Your order is being packed and tracking details will be shared within 24 hours.',
    variables: ['customer_name', 'amount'],
    status: 'approved',
    isDemo: true,
  },
  {
    id: 4,
    name: 'vip_early_access_invite',
    category: 'marketing',
    language: 'en_IN',
    body: 'Hello {{1}}, as a valued VIP member, you get 48-hour early access to our Limited Edition Bridal Collection. Visit us or book a video shopping slot today!',
    variables: ['customer_name'],
    status: 'pending',
    isDemo: true,
  },
];

export const DEMO_CAMPAIGNS = [
  {
    id: 1,
    name: 'Festive Wedding Collection Launch',
    status: 'completed',
    templateId: 1,
    template: DEMO_TEMPLATES[0],
    audience: { tagIds: [1, 2], leadStatuses: ['qualified', 'customer'] },
    scheduledAt: '2026-10-20T10:00:00.000Z',
    estimatedRecipients: 42,
    estimatedCost: '36.96',
    currency: 'INR',
    stats: {
      total: 42,
      queued: 0,
      accepted: 42,
      delivered: 40,
      read: 33,
      failed: 2,
      skipped: 0,
    },
  },
  {
    id: 2,
    name: 'Weekend Bridal Trial Reminder',
    status: 'draft',
    templateId: 2,
    template: DEMO_TEMPLATES[1],
    audience: { tagIds: [3], leadStatuses: ['qualified'] },
    scheduledAt: null,
    estimatedRecipients: 9,
    estimatedCost: '1.17',
    currency: 'INR',
    stats: {
      total: 9,
      queued: 0,
      accepted: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      skipped: 0,
    },
  },
];

export const DEMO_WORKFLOWS = [
  {
    id: 1,
    name: 'Instant Festive Catalogue Auto-Reply & Assignment',
    status: 'published',
    trigger: {
      type: 'keyword_received',
      config: { keywords: ['price', 'catalogue', 'saree', 'bridal', 'collection'] },
    },
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          category: 'trigger',
          type: 'keyword_received',
          label: 'Keyword Received',
          config: { keywords: ['price', 'catalogue', 'saree', 'bridal', 'collection'] },
        },
        {
          id: 'cond-1',
          category: 'condition',
          type: 'business_hours',
          label: 'During Business Hours',
          config: { mode: 'within_hours' },
        },
        {
          id: 'act-1',
          category: 'action',
          type: 'add_tag',
          label: 'Add Tag: Festive Enquiry',
          config: { tagId: 2 },
        },
        {
          id: 'act-2',
          category: 'action',
          type: 'send_reply',
          label: 'Send Welcome & Lookbook Reply',
          config: {
            text: 'Namaste! Thank you for messaging Ananya Studio. Here is our latest Festive Lookbook. Our stylist will assist you shortly!',
          },
        },
        {
          id: 'act-3',
          category: 'action',
          type: 'create_follow_up',
          label: 'Create 4h Follow-up Task',
          config: { title: 'Follow up on catalogue enquiry', delayHours: 4 },
        },
      ],
      edges: [
        { from: 'trigger-1', to: 'cond-1' },
        { from: 'cond-1', to: 'act-1' },
        { from: 'act-1', to: 'act-2' },
        { from: 'act-2', to: 'act-3' },
      ],
    },
    publishedAt: '2026-10-15T09:00:00.000Z',
    executionCount: 128,
  },
  {
    id: 2,
    name: 'VIP Tag Lead Qualification & Round-Robin',
    status: 'draft',
    trigger: {
      type: 'tag_added',
      config: { tagId: 1 },
    },
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          category: 'trigger',
          type: 'tag_added',
          label: 'When Tag Added: VIP Buyer',
          config: { tagId: 1 },
        },
        {
          id: 'act-1',
          category: 'action',
          type: 'update_lead_status',
          label: 'Set Status → Qualified',
          config: { status: 'qualified' },
        },
        {
          id: 'act-2',
          category: 'action',
          type: 'assign_member',
          label: 'Assign to Senior Stylist',
          config: { userId: 1 },
        },
      ],
      edges: [
        { from: 'trigger-1', to: 'act-1' },
        { from: 'act-1', to: 'act-2' },
      ],
    },
    publishedAt: null,
    executionCount: 0,
  },
];

export function buildDemoAnalyticsOverview(days = 30) {
  const numPoints = days === 7 ? 7 : days === 90 ? 15 : 12;
  const enquiriesSeries = [];
  const salesSeries = [];
  const now = new Date();

  for (let i = numPoints - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * Math.max(1, Math.floor(days / numPoints)));
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    enquiriesSeries.push({
      date: label,
      count: 8 + ((i * 7 + 3) % 19),
    });
    salesSeries.push({
      date: label,
      amount: 4500 + ((i * 3900 + 2000) % 24000),
    });
  }

  return {
    totals: {
      contacts: 148,
      newEnquiries: days === 7 ? 38 : days === 90 ? 310 : 124,
      openConversations: 14,
      followUpsDue: 5,
      activeCampaigns: 2,
      recordedSales: days === 7 ? 64500 : days === 90 ? 684000 : 246800,
    },
    enquiriesSeries,
    salesSeries,
    leadFunnel: [
      { status: 'new', count: 48 },
      { status: 'contacted', count: 39 },
      { status: 'qualified', count: 31 },
      { status: 'customer', count: 22 },
      { status: 'lost', count: 8 },
    ],
    recentActivity: [
      {
        id: 1,
        type: 'sale.recorded',
        description: 'Recorded sale of ₹28,500 for Vikram Patel (#INV-204)',
        createdAt: '2026-10-28T16:45:00.000Z',
        actor: 'Neha Kulkarni',
      },
      {
        id: 2,
        type: 'message.inbound',
        description: 'Priya Sharma asked for a Friday 4 PM bridal trial slot',
        createdAt: '2026-10-29T10:15:00.000Z',
        actor: 'Customer',
      },
      {
        id: 3,
        type: 'workflow.executed',
        description: 'Workflow "Instant Festive Catalogue Auto-Reply" triggered for Meera Nair',
        createdAt: '2026-10-29T07:45:00.000Z',
        actor: 'Automation',
      },
      {
        id: 4,
        type: 'campaign.completed',
        description: 'Campaign "Festive Wedding Collection Launch" completed (40/42 delivered)',
        createdAt: '2026-10-26T18:20:00.000Z',
        actor: 'Aarav Mehta',
      },
    ],
  };
}

export function buildDemoConversationAnalytics(days = 30) {
  const numPoints = days === 7 ? 7 : 10;
  const series = [];
  const now = new Date();
  for (let i = numPoints - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * Math.max(1, Math.floor(days / numPoints)));
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    series.push({
      date: label,
      inbound: 14 + ((i * 5) % 16),
      outbound: 18 + ((i * 7) % 18),
    });
  }
  return {
    byStatus: [
      { status: 'open', count: 14 },
      { status: 'pending', count: 9 },
      { status: 'resolved', count: 64 },
    ],
    series,
  };
}

export function formatINR(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const DEMO_ADMIN_PLANS = [
  {
    id: 1,
    code: 'free',
    name: 'Free',
    description: 'Get started with shared WhatsApp CRM & basic follow-ups.',
    priceMonthly: '0.00',
    priceYearly: '0.00',
    currency: 'INR',
    limits: { contacts: 100, teamMembers: 1, messagesPerMonth: 250, aiRequestsPerMonth: 10, workflows: 1 },
    features: ['Shared WhatsApp inbox', 'Up to 100 contacts & tags', 'Follow-up reminders', '1 basic automation workflow'],
    isPublic: true,
    sortOrder: 1,
    subscriberCount: 1,
  },
  {
    id: 2,
    code: 'starter',
    name: 'Starter',
    description: 'For growing shops managing daily customer enquiries on WhatsApp.',
    priceMonthly: '199.00',
    priceYearly: '1990.00',
    currency: 'INR',
    limits: { contacts: 1000, teamMembers: 2, messagesPerMonth: 2500, aiRequestsPerMonth: 100, workflows: 3 },
    features: ['Up to 1,000 contacts', '2 team members', 'Approved template campaigns', '3 automation workflows'],
    isPublic: true,
    sortOrder: 2,
    subscriberCount: 1,
  },
  {
    id: 3,
    code: 'growth',
    name: 'Growth',
    description: 'For busy Indian SMBs scaling sales, broadcasts & AI assistance.',
    priceMonthly: '499.00',
    priceYearly: '4990.00',
    currency: 'INR',
    limits: { contacts: 5000, teamMembers: 5, messagesPerMonth: 10000, aiRequestsPerMonth: 500, workflows: 10 },
    features: ['Up to 5,000 contacts', '5 team members', 'AI reply suggestions & summaries', '10 automation workflows'],
    isPublic: true,
    sortOrder: 3,
    subscriberCount: 2,
  },
  {
    id: 4,
    code: 'pro',
    name: 'Pro',
    description: 'High-volume automation, multi-team routing & full analytics.',
    priceMonthly: '999.00',
    priceYearly: '9990.00',
    currency: 'INR',
    limits: { contacts: 25000, teamMembers: 15, messagesPerMonth: 50000, aiRequestsPerMonth: 2000, workflows: 50 },
    features: ['Up to 25,000 contacts', '15 team members', '2,000 AI requests/month', '50 automation workflows'],
    isPublic: true,
    sortOrder: 4,
    subscriberCount: 1,
  },
  {
    id: 5,
    code: 'business',
    name: 'Business',
    description: 'Tailored volume, multi-store setup & dedicated onboarding.',
    priceMonthly: null,
    priceYearly: null,
    currency: 'INR',
    limits: { contacts: -1, teamMembers: -1, messagesPerMonth: -1, aiRequestsPerMonth: -1, workflows: -1 },
    features: ['Unlimited contacts & team seats', 'Dedicated account manager', 'Custom integrations & webhooks'],
    isPublic: true,
    sortOrder: 5,
    subscriberCount: 0,
  },
];

export const DEMO_ADMIN_USERS = [
  {
    id: 1,
    name: 'Vikram Singh (Platform Admin)',
    email: 'admin@chatflow.local',
    isSuperAdmin: true,
    isActive: true,
    role: 'owner',
    lastLoginAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: '2026-08-01T09:00:00.000Z',
    business: {
      id: 1,
      name: 'Sharma Fashion House (Demo)',
      slug: 'sharma-fashion-house-demo',
      industry: 'Apparel & Ethnic Retail',
      isDemo: true,
      phone: '+919820112233',
      timezone: 'Asia/Kolkata',
    },
    subscription: {
      id: 1,
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodEnd: '2026-11-18T00:00:00.000Z',
      plan: { id: 3, code: 'growth', name: 'Growth', priceMonthly: '499.00' },
    },
    counts: { contacts: 27, conversations: 8, campaigns: 3, workflows: 2 },
  },
  {
    id: 2,
    name: 'Rajesh Sharma',
    email: 'demo@chatflow.local',
    isSuperAdmin: true,
    isActive: true,
    role: 'owner',
    lastLoginAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    createdAt: '2026-09-01T10:00:00.000Z',
    business: {
      id: 1,
      name: 'Sharma Fashion House (Demo)',
      slug: 'sharma-fashion-house-demo',
      industry: 'Apparel & Ethnic Retail',
      isDemo: true,
      phone: '+919820112233',
      timezone: 'Asia/Kolkata',
    },
    subscription: {
      id: 1,
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodEnd: '2026-11-18T00:00:00.000Z',
      plan: { id: 3, code: 'growth', name: 'Growth', priceMonthly: '499.00' },
    },
    counts: { contacts: 27, conversations: 8, campaigns: 3, workflows: 2 },
  },
  {
    id: 3,
    name: 'Neha Verma',
    email: 'neha@chatflow.local',
    isSuperAdmin: false,
    isActive: true,
    role: 'admin',
    lastLoginAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    createdAt: '2026-09-14T11:30:00.000Z',
    business: {
      id: 1,
      name: 'Sharma Fashion House (Demo)',
      slug: 'sharma-fashion-house-demo',
      industry: 'Apparel & Ethnic Retail',
      isDemo: true,
      phone: '+919820112233',
      timezone: 'Asia/Kolkata',
    },
    subscription: {
      id: 1,
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodEnd: '2026-11-18T00:00:00.000Z',
      plan: { id: 3, code: 'growth', name: 'Growth', priceMonthly: '499.00' },
    },
    counts: { contacts: 27, conversations: 8, campaigns: 3, workflows: 2 },
  },
  {
    id: 4,
    name: 'Suresh Verma',
    email: 'other@chatflow.local',
    isSuperAdmin: false,
    isActive: true,
    role: 'owner',
    lastLoginAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    createdAt: '2026-10-05T14:20:00.000Z',
    business: {
      id: 2,
      name: 'Verma Electronics',
      slug: 'verma-electronics',
      industry: 'Consumer Electronics',
      isDemo: false,
      phone: '+919811223344',
      timezone: 'Asia/Kolkata',
    },
    subscription: {
      id: 2,
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodEnd: '2026-11-24T00:00:00.000Z',
      plan: { id: 1, code: 'free', name: 'Free', priceMonthly: '0.00' },
    },
    counts: { contacts: 1, conversations: 0, campaigns: 0, workflows: 0 },
  },
  {
    id: 5,
    name: 'Dr. Kavita Iyer',
    email: 'kavita@apexcoaching.in',
    isSuperAdmin: false,
    isActive: true,
    role: 'owner',
    lastLoginAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    createdAt: '2026-10-12T08:15:00.000Z',
    business: {
      id: 3,
      name: 'Apex NEET & JEE Academy',
      slug: 'apex-neet-jee-academy',
      industry: 'Coaching & Education',
      isDemo: false,
      phone: '+919845098450',
      timezone: 'Asia/Kolkata',
    },
    subscription: {
      id: 3,
      status: 'active',
      billingCycle: 'yearly',
      currentPeriodEnd: '2027-10-12T00:00:00.000Z',
      plan: { id: 4, code: 'pro', name: 'Pro', priceMonthly: '999.00' },
    },
    counts: { contacts: 412, conversations: 86, campaigns: 6, workflows: 4 },
  },
];

