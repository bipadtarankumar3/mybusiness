'use strict';

const bcrypt = require('bcryptjs');

const PLANS_DATA = [
  {
    code: 'free',
    name: 'Free',
    description: 'Get started with shared WhatsApp CRM & basic follow-ups.',
    priceMonthly: '0.00',
    priceYearly: '0.00',
    currency: 'INR',
    limits: {
      contacts: 100,
      teamMembers: 1,
      messagesPerMonth: 250,
      aiRequestsPerMonth: 10,
      workflows: 1,
    },
    features: [
      'Shared WhatsApp inbox',
      'Up to 100 contacts & tags',
      'Follow-up reminders',
      '1 basic automation workflow',
    ],
    isPublic: true,
    sortOrder: 1,
  },
  {
    code: 'starter',
    name: 'Starter',
    description: 'For growing shops managing daily customer enquiries on WhatsApp.',
    priceMonthly: '199.00',
    priceYearly: '1990.00',
    currency: 'INR',
    limits: {
      contacts: 1000,
      teamMembers: 2,
      messagesPerMonth: 2500,
      aiRequestsPerMonth: 100,
      workflows: 3,
    },
    features: [
      'Up to 1,000 contacts',
      '2 team members',
      'WhatsApp template broadcasts',
      '3 automation workflows',
      '100 AI assistant credits / month',
    ],
    isPublic: true,
    sortOrder: 2,
  },
  {
    code: 'growth',
    name: 'Growth',
    description: 'Full WhatsApp CRM, festive campaigns & smart automation for SMB teams.',
    priceMonthly: '499.00',
    priceYearly: '4990.00',
    currency: 'INR',
    limits: {
      contacts: 5000,
      teamMembers: 5,
      messagesPerMonth: 10000,
      aiRequestsPerMonth: 500,
      workflows: 10,
    },
    features: [
      'Up to 5,000 contacts',
      '5 team members & round-robin assignment',
      'Audience segmentation & cost calculator',
      '10 automation workflows',
      '500 AI assistant credits / month',
      'Sales & lead funnel analytics',
    ],
    isPublic: true,
    sortOrder: 3,
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'High-volume broadcasts, advanced workflows & larger sales teams.',
    priceMonthly: '999.00',
    priceYearly: '9990.00',
    currency: 'INR',
    limits: {
      contacts: 25000,
      teamMembers: 15,
      messagesPerMonth: 50000,
      aiRequestsPerMonth: 2000,
      workflows: 50,
    },
    features: [
      'Up to 25,000 contacts',
      '15 team members & role permissions',
      'Priority campaign queue',
      '50 automation workflows',
      '2,000 AI assistant credits / month',
      'Full revenue & team analytics',
    ],
    isPublic: true,
    sortOrder: 4,
  },
  {
    code: 'business',
    name: 'Business',
    description: 'Tailored volume, multi-store setup & dedicated onboarding.',
    priceMonthly: null,
    priceYearly: null,
    currency: 'INR',
    limits: {
      contacts: -1,
      teamMembers: -1,
      messagesPerMonth: -1,
      aiRequestsPerMonth: -1,
      workflows: -1,
    },
    features: [
      'Unlimited contacts & team seats',
      'Dedicated account manager',
      'Custom integrations & webhooks',
      'SLA guarantee',
    ],
    isPublic: true,
    sortOrder: 5,
  },
];

async function seedPlans(models) {
  const { Plan } = models;
  for (const p of PLANS_DATA) {
    const existing = await Plan.findOne({ where: { code: p.code } });
    if (existing) {
      await existing.update(p);
    } else {
      await Plan.create(p);
    }
  }
}

async function seedDemoWorkspace(models) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const {
    User,
    Plan,
    Business,
    Team,
    BusinessMember,
    Subscription,
    Customer,
    CustomerTag,
    CustomerTagMapping,
    MessageTemplate,
    Conversation,
    Message,
    FollowUpReminder,
    Campaign,
    Workflow,
    WorkflowExecution,
    BusinessIntegration,
    UsageRecord,
    ActivityLog,
    Sale,
  } = models;

  await seedPlans(models);

  const existingDemo = await User.findOne({ where: { email: 'demo@chatflow.local' } });
  if (existingDemo) {
    if (existingDemo.isSuperAdmin) {
      await existingDemo.update({ isSuperAdmin: false });
    }
    const existingAdmin = await User.findOne({ where: { email: 'admin@chatflow.local' } });
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash('Admin@12345', 10);
      const superAdmin = await User.create({
        name: 'Vikram Singh (Platform Admin)',
        email: 'admin@chatflow.local',
        passwordHash: adminHash,
        isSuperAdmin: true,
        isActive: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      });
      const firstBiz = await Business.findOne();
      if (firstBiz) {
        await BusinessMember.findOrCreate({
          where: { businessId: firstBiz.id, userId: superAdmin.id },
          defaults: { businessId: firstBiz.id, userId: superAdmin.id, role: 'owner', status: 'active' },
        });
      }
    }
    return;
  }

  const passwordHash = await bcrypt.hash('Demo@12345', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000);
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 3600 * 1000);
  const hoursFromNow = (h) => new Date(now.getTime() + h * 3600 * 1000);

  const superAdmin = await User.create({
    name: 'Vikram Singh (Platform Admin)',
    email: 'admin@chatflow.local',
    passwordHash: adminPasswordHash,
    isSuperAdmin: true,
    isActive: true,
    emailVerifiedAt: daysAgo(90),
    lastLoginAt: now,
  });

  const owner = await User.create({
    name: 'Rajesh Sharma',
    email: 'demo@chatflow.local',
    passwordHash,
    isSuperAdmin: false,
    isActive: true,
    emailVerifiedAt: daysAgo(60),
    lastLoginAt: hoursAgo(1),
  });

  const adminUser = await User.create({
    name: 'Neha Verma',
    email: 'neha@chatflow.local',
    passwordHash,
    isActive: true,
    emailVerifiedAt: daysAgo(45),
    lastLoginAt: hoursAgo(3),
  });

  const agentUser = await User.create({
    name: 'Amit Patel',
    email: 'amit@chatflow.local',
    passwordHash,
    isActive: true,
    emailVerifiedAt: daysAgo(30),
    lastLoginAt: hoursAgo(5),
  });

  const business = await Business.create({
    name: 'Sharma Fashion House (Demo)',
    slug: 'sharma-fashion-house-demo',
    industry: 'Apparel & Ethnic Retail',
    timezone: 'Asia/Kolkata',
    phone: '+919820112233',
    website: 'https://sharmafashion.example.in',
    aiKnowledge:
      'Store hours: 10:30 AM to 8:30 PM IST (Mon-Sat). Free shipping across India on prepaid orders above ₹1,499. COD available with ₹99 convenience charge. Easy 7-day size exchange on unworn ethnic wear.',
    businessHours: {
      timezone: 'Asia/Kolkata',
      days: [1, 2, 3, 4, 5, 6],
      start: '09:00',
      end: '22:00',
    },
    isDemo: true,
  });

  const salesTeam = await Team.create({
    businessId: business.id,
    name: 'Retail & Festive Sales',
    description: 'Handles WhatsApp catalogue enquiries and festive orders',
  });

  await BusinessMember.bulkCreate([
    { businessId: business.id, userId: superAdmin.id, teamId: salesTeam.id, role: 'owner', status: 'active' },
    { businessId: business.id, userId: owner.id, teamId: salesTeam.id, role: 'owner', status: 'active' },
    { businessId: business.id, userId: adminUser.id, teamId: salesTeam.id, role: 'admin', status: 'active' },
    { businessId: business.id, userId: agentUser.id, teamId: salesTeam.id, role: 'agent', status: 'active' },
  ]);

  const growthPlan = await Plan.findOne({ where: { code: 'growth' } });
  await Subscription.create({
    businessId: business.id,
    planId: growthPlan.id,
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: daysAgo(12),
    currentPeriodEnd: hoursFromNow(18 * 24),
  });

  await BusinessIntegration.create({
    businessId: business.id,
    provider: 'whatsapp_cloud',
    status: 'not_configured',
    config: { displayPhoneNumber: '+91 98201 12233 (Demo Sandbox)' },
  });

  const tagRecords = await CustomerTag.bulkCreate(
    [
      { businessId: business.id, name: 'VIP', color: '#16C784' },
      { businessId: business.id, name: 'Festive Enquiry', color: '#F59E0B' },
      { businessId: business.id, name: 'Wholesale', color: '#3B82F6' },
      { businessId: business.id, name: 'COD Follow-up', color: '#EC4899' },
      { businessId: business.id, name: 'Repeat Buyer', color: '#8B5CF6' },
    ],
    { returning: true }
  );
  const tagsByName = {};
  for (const t of tagRecords) tagsByName[t.name] = t;

  const rawCustomers = [
    { name: 'Priya Nair', phone: '+919876543210', email: 'priya.nair@example.com', leadStatus: 'qualified', source: 'whatsapp', optIn: true, tags: ['VIP', 'Festive Enquiry'], notes: 'Looking for Banarasi silk sarees for sister wedding in November.', days: 2 },
    { name: 'Aarav Mehta', phone: '+919876543211', email: 'aarav.mehta@example.com', leadStatus: 'customer', source: 'whatsapp', optIn: true, tags: ['VIP', 'Repeat Buyer'], notes: 'Ordered 3 kurta sets last Diwali. Prefers express courier.', days: 5 },
    { name: 'Sneha Kulkarni', phone: '+919876543212', email: 'sneha.k@example.com', leadStatus: 'new', source: 'whatsapp', optIn: true, tags: ['Festive Enquiry'], notes: 'Asked for bridal lehenga price range and custom blouse stitching.', days: 1 },
    { name: 'Rohan Deshmukh', phone: '+919876543213', email: 'rohan.d@example.com', leadStatus: 'contacted', source: 'website', optIn: true, tags: ['Wholesale'], notes: 'Boutique owner in Pune, interested in 25-piece wholesale lot.', days: 3 },
    { name: 'Kavita Iyer', phone: '+919876543214', email: 'kavita.iyer@example.com', leadStatus: 'customer', source: 'whatsapp', optIn: true, tags: ['Repeat Buyer'], notes: 'Bought pastel organza saree ₹4,850.', days: 7 },
    { name: 'Vikram Singhania', phone: '+919876543215', email: 'vikram.s@example.com', leadStatus: 'qualified', source: 'referral', optIn: true, tags: ['VIP', 'Wholesale'], notes: 'Referred by Aarav. Needs sherwani trial appointment on Saturday.', days: 4 },
    { name: 'Ananya Chatterjee', phone: '+919876543216', email: 'ananya.c@example.com', leadStatus: 'contacted', source: 'whatsapp', optIn: true, tags: ['COD Follow-up'], notes: 'Requested COD confirmation for Jaipur cotton co-ord set.', days: 2 },
    { name: 'Deepak Joshi', phone: '+919876543217', email: null, leadStatus: 'new', source: 'walk_in', optIn: true, tags: ['Festive Enquiry'], notes: 'Visited store, asked for catalogue PDF on WhatsApp.', days: 1 },
    { name: 'Meera Reddy', phone: '+919876543218', email: 'meera.r@example.com', leadStatus: 'customer', source: 'whatsapp', optIn: true, tags: ['VIP', 'Repeat Buyer'], notes: 'Regular buyer from Hyderabad.', days: 9 },
    { name: 'Karthik Subramanian', phone: '+919876543219', email: null, leadStatus: 'qualified', source: 'whatsapp', optIn: true, tags: ['Festive Enquiry'], notes: 'Shortlisted 2 silk kurtas, waiting for size M restock.', days: 6 },
    { name: 'Pooja Bansal', phone: '+919876543220', email: 'pooja.b@example.com', leadStatus: 'customer', source: 'website', optIn: true, tags: ['Repeat Buyer'], notes: 'Prepaid order delivered.', days: 11 },
    { name: 'Siddharth Malhotra', phone: '+919876543221', email: null, leadStatus: 'contacted', source: 'whatsapp', optIn: true, tags: ['COD Follow-up'], notes: 'Pincode serviceability check for Chandigarh.', days: 8 },
    { name: 'Divya Menon', phone: '+919876543222', email: 'divya.m@example.com', leadStatus: 'new', source: 'whatsapp', optIn: true, tags: ['Festive Enquiry'], notes: 'Enquired about Karwa Chauth red georgette collection.', days: 3 },
    { name: 'Harshita Agarwal', phone: '+919876543223', email: 'harshita@example.com', leadStatus: 'customer', source: 'referral', optIn: true, tags: ['VIP'], notes: 'Purchased family combo worth ₹14,200.', days: 14 },
    { name: 'Nikhil Kapoor', phone: '+919876543224', email: null, leadStatus: 'lost', source: 'whatsapp', optIn: true, tags: [], notes: 'Needed same-day delivery to Noida which was not possible.', days: 16 },
    { name: 'Ritu Saxena', phone: '+919876543225', email: 'ritu.s@example.com', leadStatus: 'qualified', source: 'whatsapp', optIn: true, tags: ['Festive Enquiry'], notes: 'Evaluating 3 Chanderi suit sets.', days: 5 },
    { name: 'Manish Tiwari', phone: '+919876543226', email: null, leadStatus: 'contacted', source: 'manual', optIn: true, tags: ['Wholesale'], notes: 'Sent B2B rate card on WhatsApp.', days: 10 },
    { name: 'Shreya Ghosh', phone: '+919876543227', email: 'shreya.g@example.com', leadStatus: 'customer', source: 'whatsapp', optIn: true, tags: ['Repeat Buyer'], notes: 'Loved the handblock dupatta collection.', days: 15 },
    { name: 'Arjun Nambiar', phone: '+919876543228', email: null, leadStatus: 'new', source: 'website', optIn: true, tags: [], notes: 'Signed up via website WhatsApp widget.', days: 2 },
    { name: 'Tanvi Shah', phone: '+919876543229', email: 'tanvi.shah@example.com', leadStatus: 'customer', source: 'whatsapp', optIn: true, tags: ['VIP', 'Repeat Buyer'], notes: 'Ordered Navratri chaniya choli set.', days: 18 },
    { name: 'Gaurav Bhatia', phone: '+919876543230', email: null, leadStatus: 'contacted', source: 'whatsapp', optIn: true, tags: ['COD Follow-up'], notes: 'Waiting for address landmark confirmation.', days: 4 },
    { name: 'Nandini Rao', phone: '+919876543231', email: 'nandini.rao@example.com', leadStatus: 'qualified', source: 'whatsapp', optIn: true, tags: ['Festive Enquiry'], notes: 'Requested video call showcase for Kanjeevaram sarees.', days: 6 },
    { name: 'Abhishek Jain', phone: '+919876543232', email: null, leadStatus: 'customer', source: 'walk_in', optIn: true, tags: ['Wholesale'], notes: 'Bought sample lot of 10 kurtas.', days: 20 },
    { name: 'Swati Mishra', phone: '+919876543233', email: 'swati.m@example.com', leadStatus: 'new', source: 'whatsapp', optIn: true, tags: ['Festive Enquiry'], notes: 'Asked about blouse alteration timeline.', days: 1 },
    { name: 'Pranav Kulkarni', phone: '+919876543234', email: null, leadStatus: 'contacted', source: 'referral', optIn: false, tags: ['Festive Enquiry'], notes: 'No WhatsApp marketing opt-in yet.', days: 12 },
    { name: 'Zoya Khan', phone: '+919876543235', email: 'zoya.k@example.com', leadStatus: 'qualified', source: 'whatsapp', optIn: false, tags: ['VIP'], notes: 'Opted out of promotional broadcasts; prefers direct 1:1 replies.', optedOut: true, days: 13 },
    { name: 'Kunal Arora', phone: '+919876543236', email: null, leadStatus: 'lost', source: 'import', optIn: false, tags: [], notes: 'Imported from old exhibition sheet.', days: 22 },
  ];

  const createdCustomers = [];
  for (const item of rawCustomers) {
    const cust = await Customer.create({
      businessId: business.id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      leadStatus: item.leadStatus,
      source: item.source,
      notes: item.notes,
      whatsappOptIn: item.optIn,
      optInAt: item.optIn ? daysAgo(item.days + 1) : null,
      optedOutAt: item.optedOut ? daysAgo(2) : null,
      lastContactedAt: hoursAgo(item.days * 6),
      isDemo: true,
      createdAt: daysAgo(item.days),
      updatedAt: daysAgo(Math.max(0, item.days - 1)),
    });
    createdCustomers.push(cust);

    for (const tagName of item.tags) {
      const tag = tagsByName[tagName];
      if (tag) {
        await CustomerTagMapping.create({
          businessId: business.id,
          customerId: cust.id,
          tagId: tag.id,
        });
      }
    }
  }

  // Templates
  const templates = await MessageTemplate.bulkCreate(
    [
      {
        businessId: business.id,
        name: 'festive_collection_launch',
        category: 'marketing',
        language: 'en',
        body: 'Namaste {{1}}! ✨ Our new Festive Silk & Banarasi Collection is now live at Sharma Fashion House. Enjoy flat 15% off on orders above ₹2,999 this week. Reply CATALOGUE to view designs!',
        variables: ['customer_name'],
        status: 'approved',
        providerTemplateId: 'demo_tpl_festive_01',
        isDemo: true,
      },
      {
        businessId: business.id,
        name: 'order_dispatch_update',
        category: 'utility',
        language: 'en',
        body: 'Hi {{1}}, your order #{{2}} from Sharma Fashion House has been packed and dispatched via BlueDart. Expected delivery in 2-4 business days.',
        variables: ['customer_name', 'order_id'],
        status: 'approved',
        providerTemplateId: 'demo_tpl_dispatch_02',
        isDemo: true,
      },
      {
        businessId: business.id,
        name: 'cod_order_confirmation',
        category: 'utility',
        language: 'en',
        body: 'Hello {{1}}, please reply YES to confirm your Cash-on-Delivery order of ₹{{2}} with Sharma Fashion House so we can ship it today.',
        variables: ['customer_name', 'amount'],
        status: 'approved',
        providerTemplateId: 'demo_tpl_cod_03',
        isDemo: true,
      },
    ],
    { returning: true }
  );

  // 8 Demo conversations
  const threadSpecs = [
    {
      customer: createdCustomers[0], // Priya Nair
      assignedToUserId: owner.id,
      status: 'open',
      unreadCount: 2,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Hi! Do you have pure Katan Banarasi sarees in emerald green or rani pink?', status: 'received', agoHours: 5 },
        { direction: 'outbound', type: 'text', body: 'Namaste Priya ji! Yes, we have 6 handwoven Katan silk pieces in both emerald and rani pink (₹6,499 - ₹8,999). Sharing the photos now.', status: 'simulated', sentByUserId: owner.id, agoHours: 4.5 },
        { direction: 'inbound', type: 'text', body: 'The emerald green one with zari border looks gorgeous! Does it come with unstitched blouse piece?', status: 'received', agoHours: 2 },
        { direction: 'inbound', type: 'text', body: 'Also if I order 2 sarees today, how soon can you deliver to Bengaluru?', status: 'received', agoHours: 1 },
      ],
    },
    {
      customer: createdCustomers[1], // Aarav Mehta
      assignedToUserId: adminUser.id,
      status: 'open',
      unreadCount: 0,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Hello Rajesh bhai, need 2 festive kurta sets in size 40 for family function this Friday.', status: 'received', agoHours: 10 },
        { direction: 'outbound', type: 'text', body: 'Hi Aarav! Great to hear from you. Our Lucknowi Chikankari in Ivory and Midnight Blue are available in 40. Shall I reserve them?', status: 'simulated', sentByUserId: adminUser.id, agoHours: 9 },
        { direction: 'inbound', type: 'text', body: 'Yes please! Send me the UPI payment link for both.', status: 'received', agoHours: 6 },
        { direction: 'outbound', type: 'text', body: 'Payment received ₹5,400. Dispatching via BlueDart Priority today!', status: 'simulated', sentByUserId: adminUser.id, agoHours: 5 },
      ],
    },
    {
      customer: createdCustomers[2], // Sneha Kulkarni
      assignedToUserId: agentUser.id,
      status: 'open',
      unreadCount: 1,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Hi, saw your bridal pastel lehenga reel. What is the price and customization time?', status: 'received', agoHours: 4 },
        { direction: 'outbound', type: 'note', body: 'Internal note: Bride wedding date is Dec 14. Offer complimentary latkan customization.', status: 'simulated', sentByUserId: agentUser.id, agoHours: 3.5 },
        { direction: 'outbound', type: 'text', body: 'Hello Sneha! The rose-gold zardozi lehenga is ₹24,500 and takes 12 days for custom fitting.', status: 'simulated', sentByUserId: agentUser.id, agoHours: 3 },
        { direction: 'inbound', type: 'text', body: 'Can we book a video call tomorrow at 4 PM to see the fabric closely?', status: 'received', agoHours: 0.5 },
      ],
    },
    {
      customer: createdCustomers[3], // Rohan Deshmukh
      assignedToUserId: owner.id,
      status: 'pending',
      unreadCount: 0,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Hello, I run a boutique in Kothrud, Pune. What is MOQ for wholesale festive kurtis?', status: 'received', agoHours: 18 },
        { direction: 'outbound', type: 'text', body: 'Hi Rohan! Minimum order is 20 assorted pieces across 4 designs. GST invoice is provided.', status: 'simulated', sentByUserId: owner.id, agoHours: 16 },
        { direction: 'inbound', type: 'text', body: 'Sounds good, please share the wholesale catalogue PDF.', status: 'received', agoHours: 14 },
        { direction: 'outbound', type: 'text', body: 'Shared the wholesale line-sheet! Let me know your preferred sets.', status: 'simulated', sentByUserId: owner.id, agoHours: 12 },
      ],
    },
    {
      customer: createdCustomers[5], // Vikram Singhania
      assignedToUserId: adminUser.id,
      status: 'open',
      unreadCount: 1,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Hi, Aarav Mehta shared your number. Looking for an Indo-Western Bandhgala set.', status: 'received', agoHours: 8 },
        { direction: 'outbound', type: 'text', body: 'Welcome Vikram ji! We would love to host you for a trial or share measurements over WhatsApp.', status: 'simulated', sentByUserId: adminUser.id, agoHours: 7 },
        { direction: 'inbound', type: 'text', body: 'Saturday 11:30 AM works for store visit. Please share Google Maps location.', status: 'received', agoHours: 2 },
      ],
    },
    {
      customer: createdCustomers[6], // Ananya Chatterjee
      assignedToUserId: agentUser.id,
      status: 'pending',
      unreadCount: 0,
      messages: [
        { direction: 'outbound', type: 'template', body: 'Hello Ananya, please reply YES to confirm your Cash-on-Delivery order of ₹2,199 with Sharma Fashion House so we can ship it today.', status: 'simulated', sentByUserId: agentUser.id, agoHours: 9 },
        { direction: 'inbound', type: 'text', body: 'YES confirmed! Please deliver between 11 AM and 5 PM.', status: 'received', agoHours: 6 },
        { direction: 'outbound', type: 'text', body: 'Thank you Ananya! Noted the delivery time instruction on the parcel.', status: 'simulated', sentByUserId: agentUser.id, agoHours: 5.5 },
      ],
    },
    {
      customer: createdCustomers[7], // Deepak Joshi
      assignedToUserId: null,
      status: 'open',
      unreadCount: 1,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Hi, I visited your shop this afternoon. Please send the Chanderi dupatta photos.', status: 'received', agoHours: 3 },
      ],
    },
    {
      customer: createdCustomers[8], // Meera Reddy
      assignedToUserId: owner.id,
      status: 'resolved',
      unreadCount: 0,
      messages: [
        { direction: 'inbound', type: 'text', body: 'Received the organza saree today. Packaging and fall-pico work are super neat! Thank you 🙏', status: 'received', agoHours: 22 },
        { direction: 'outbound', type: 'text', body: 'So happy to hear that Meera ji! Thank you for shopping with Sharma Fashion House ✨', status: 'simulated', sentByUserId: owner.id, agoHours: 21 },
      ],
    },
  ];

  for (const spec of threadSpecs) {
    const lastMsg = spec.messages[spec.messages.length - 1];
    const lastInbound = [...spec.messages].reverse().find((m) => m.direction === 'inbound');
    const conv = await Conversation.create({
      businessId: business.id,
      customerId: spec.customer.id,
      assignedToUserId: spec.assignedToUserId,
      channel: 'whatsapp',
      status: spec.status,
      isDemo: true,
      unreadCount: spec.unreadCount,
      lastMessageAt: hoursAgo(lastMsg.agoHours),
      lastMessagePreview: lastMsg.body.slice(0, 240),
      lastInboundAt: lastInbound ? hoursAgo(lastInbound.agoHours) : hoursAgo(2),
    });

    for (const m of spec.messages) {
      const ts = hoursAgo(m.agoHours);
      await Message.create({
        businessId: business.id,
        conversationId: conv.id,
        sentByUserId: m.sentByUserId || null,
        direction: m.direction,
        type: m.type,
        body: m.body,
        status: m.status,
        createdAt: ts,
        updatedAt: ts,
      });
    }
  }

  // Follow-ups: 2 overdue, 2 today, 2 upcoming
  const startOfToday = new Date(now);
  startOfToday.setHours(12, 0, 0, 0);
  await FollowUpReminder.bulkCreate([
    {
      businessId: business.id,
      customerId: createdCustomers[0].id,
      assignedToUserId: owner.id,
      createdByUserId: owner.id,
      title: 'Send Banarasi saree drape video & blouse measurement chart',
      notes: 'Customer wants 2 sarees shipped to Bengaluru before Friday.',
      dueAt: daysAgo(2),
      status: 'pending',
    },
    {
      businessId: business.id,
      customerId: createdCustomers[3].id,
      assignedToUserId: owner.id,
      createdByUserId: owner.id,
      title: 'Follow up on Pune boutique 25-piece wholesale quotation',
      notes: 'Offer 5% early payment discount on bank transfer.',
      dueAt: daysAgo(1),
      status: 'pending',
    },
    {
      businessId: business.id,
      customerId: createdCustomers[2].id,
      assignedToUserId: agentUser.id,
      createdByUserId: owner.id,
      title: 'Confirm 4 PM bridal lehenga WhatsApp video showcase',
      notes: 'Keep rose-gold and mint pastel samples ready on mannequin.',
      dueAt: startOfToday,
      status: 'pending',
    },
    {
      businessId: business.id,
      customerId: createdCustomers[6].id,
      assignedToUserId: agentUser.id,
      createdByUserId: adminUser.id,
      title: 'Share BlueDart tracking AWB once courier picks up COD parcel',
      notes: 'Order #SFH-1094',
      dueAt: new Date(startOfToday.getTime() + 2 * 3600 * 1000),
      status: 'pending',
    },
    {
      businessId: business.id,
      customerId: createdCustomers[5].id,
      assignedToUserId: adminUser.id,
      createdByUserId: adminUser.id,
      title: 'Prepare Bandhgala size 42 & 44 trial pieces for Saturday visit',
      notes: 'Customer visiting at 11:30 AM.',
      dueAt: hoursFromNow(48),
      status: 'pending',
    },
    {
      businessId: business.id,
      customerId: createdCustomers[9].id,
      assignedToUserId: owner.id,
      createdByUserId: owner.id,
      title: 'Notify Karthik when size M festive silk kurta restocks',
      notes: 'Expected from Jaipur workshop in 3 days.',
      dueAt: hoursFromNow(72),
      status: 'pending',
    },
  ]);

  // 3 Campaigns
  await Campaign.bulkCreate([
    {
      businessId: business.id,
      templateId: templates[0].id,
      createdByUserId: owner.id,
      name: 'Diwali Silk & Banarasi Early-Bird Broadcast',
      status: 'completed',
      audience: { tagIds: [tagsByName['VIP'].id, tagsByName['Festive Enquiry'].id], leadStatuses: [] },
      scheduledAt: daysAgo(5),
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      estimatedRecipients: 14,
      estimatedCost: '12.32',
      demoStats: {
        total: 14,
        queued: 0,
        accepted: 14,
        sent: 14,
        delivered: 13,
        read: 10,
        failed: 1,
        skipped: 0,
      },
      isDemo: true,
    },
    {
      businessId: business.id,
      templateId: templates[2].id,
      createdByUserId: adminUser.id,
      name: 'Weekend COD Order Confirmation Reminder',
      status: 'scheduled',
      audience: { tagIds: [tagsByName['COD Follow-up'].id], leadStatuses: ['contacted'] },
      scheduledAt: hoursFromNow(24),
      estimatedRecipients: 3,
      estimatedCost: '0.39',
      demoStats: {
        total: 3,
        queued: 3,
        accepted: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        skipped: 0,
      },
      isDemo: true,
    },
    {
      businessId: business.id,
      templateId: templates[0].id,
      createdByUserId: owner.id,
      name: 'VIP Repeat Buyers Exclusive Preview',
      status: 'draft',
      audience: { tagIds: [tagsByName['VIP'].id, tagsByName['Repeat Buyer'].id], leadStatuses: ['customer', 'qualified'] },
      estimatedRecipients: 8,
      estimatedCost: '7.04',
      isDemo: true,
    },
  ]);

  // 2 Workflows
  const wf1 = await Workflow.create({
    businessId: business.id,
    createdByUserId: owner.id,
    name: 'Festive Enquiry Instant Welcome & Follow-up',
    description: 'Greets new WhatsApp enquiries during business hours, tags them as Festive Enquiry, and schedules a follow-up.',
    status: 'published',
    triggerType: 'new_conversation',
    triggerConfig: {},
    definition: {
      nodes: [
        { id: 'trig_1', kind: 'trigger', type: 'new_conversation', config: {} },
        { id: 'cond_1', kind: 'condition', type: 'business_hours', config: {} },
        {
          id: 'act_1',
          kind: 'action',
          type: 'send_reply',
          config: {
            text: 'Namaste! Welcome to Sharma Fashion House ✨ Our team has received your message and will share designs shortly.',
          },
        },
        {
          id: 'act_2',
          kind: 'action',
          type: 'add_tag',
          config: { tagId: tagsByName['Festive Enquiry'].id },
        },
        {
          id: 'act_3',
          kind: 'action',
          type: 'create_follow_up',
          config: { title: 'Follow up with new WhatsApp enquiry', delayHours: 4 },
        },
      ],
      edges: [
        { from: 'trig_1', to: 'cond_1' },
        { from: 'cond_1', to: 'act_1' },
        { from: 'act_1', to: 'act_2' },
        { from: 'act_2', to: 'act_3' },
      ],
    },
    publishedAt: daysAgo(10),
    executionCount: 18,
    isDemo: true,
  });

  await Workflow.create({
    businessId: business.id,
    createdByUserId: adminUser.id,
    name: 'Wholesale Keyword Router',
    description: 'Detects WHOLESALE or BULK keywords, updates lead status to qualified, and assigns to owner.',
    status: 'draft',
    triggerType: 'keyword_received',
    triggerConfig: { keywords: ['wholesale', 'bulk', 'moq', 'catalogue'] },
    definition: {
      nodes: [
        { id: 'trig_1', kind: 'trigger', type: 'keyword_received', config: { keywords: ['wholesale', 'bulk', 'moq', 'catalogue'] } },
        { id: 'act_1', kind: 'action', type: 'update_lead_status', config: { status: 'qualified' } },
        { id: 'act_2', kind: 'action', type: 'assign_member', config: { userId: owner.id } },
      ],
      edges: [
        { from: 'trig_1', to: 'act_1' },
        { from: 'act_1', to: 'act_2' },
      ],
    },
    executionCount: 0,
    isDemo: true,
  });

  await WorkflowExecution.create({
    businessId: business.id,
    workflowId: wf1.id,
    customerId: createdCustomers[0].id,
    triggerType: 'new_conversation',
    status: 'completed',
    log: [
      { nodeId: 'trig_1', type: 'new_conversation', outcome: 'matched' },
      { nodeId: 'cond_1', type: 'business_hours', outcome: true },
      { nodeId: 'act_1', type: 'send_reply', outcome: 'simulated' },
    ],
    startedAt: daysAgo(2),
    finishedAt: daysAgo(2),
  });

  // Sales over the last 28 days
  const salesEntries = [
    { customerIdx: 1, amount: '5400.00', note: '2 Lucknowi Chikankari Kurta Sets', days: 1 },
    { customerIdx: 4, amount: '4850.00', note: 'Pastel Organza Saree with Pico', days: 3 },
    { customerIdx: 8, amount: '7200.00', note: 'Kanjeevaram Border Silk Saree', days: 5 },
    { customerIdx: 10, amount: '3299.00', note: 'Festive Anarkali Suit Set', days: 7 },
    { customerIdx: 13, amount: '14200.00', note: 'Family Wedding Combo (3 pieces)', days: 9 },
    { customerIdx: 17, amount: '2850.00', note: 'Handblock Chanderi Dupatta Set', days: 12 },
    { customerIdx: 19, amount: '8900.00', note: 'Navratri Designer Chaniya Choli', days: 15 },
    { customerIdx: 22, amount: '18500.00', note: 'Wholesale 10-Piece Kurta Sample Lot', days: 18 },
    { customerIdx: 1, amount: '6100.00', note: 'Festive Silk Nehru Jacket Combo', days: 21 },
    { customerIdx: 8, amount: '4400.00', note: 'Gota Patti Georgette Suit', days: 25 },
  ];

  for (const s of salesEntries) {
    await Sale.create({
      businessId: business.id,
      customerId: createdCustomers[s.customerIdx].id,
      recordedByUserId: owner.id,
      amount: s.amount,
      currency: 'INR',
      note: s.note,
      recordedAt: daysAgo(s.days),
      isDemo: true,
    });
  }

  // Usage records for current month
  const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  await UsageRecord.bulkCreate([
    { businessId: business.id, metric: 'messages', quantity: 42, unitCost: '0.1300', periodStart, referenceType: 'seed' },
    { businessId: business.id, metric: 'campaign_messages', quantity: 14, unitCost: '0.8800', periodStart, referenceType: 'seed' },
    { businessId: business.id, metric: 'ai_requests', quantity: 6, unitCost: '0.0000', periodStart, referenceType: 'seed' },
  ]);

  // Activity Logs
  await ActivityLog.bulkCreate([
    {
      businessId: business.id,
      actorUserId: owner.id,
      type: 'sale.recorded',
      description: 'Recorded sale of ₹5,400.00 for Aarav Mehta',
      entityType: 'customer',
      entityId: createdCustomers[1].id,
      createdAt: hoursAgo(5),
    },
    {
      businessId: business.id,
      actorUserId: agentUser.id,
      type: 'followup.created',
      description: 'Scheduled bridal lehenga video showcase follow-up for Sneha Kulkarni',
      entityType: 'customer',
      entityId: createdCustomers[2].id,
      createdAt: hoursAgo(3),
    },
    {
      businessId: business.id,
      actorUserId: owner.id,
      type: 'campaign.completed',
      description: 'Completed campaign "Diwali Silk & Banarasi Early-Bird Broadcast" (14 recipients)',
      entityType: 'campaign',
      entityId: 1,
      createdAt: daysAgo(5),
    },
    {
      businessId: business.id,
      actorUserId: adminUser.id,
      type: 'workflow.published',
      description: 'Published workflow "Festive Enquiry Instant Welcome & Follow-up"',
      entityType: 'workflow',
      entityId: wf1.id,
      createdAt: daysAgo(10),
    },
  ]);

  // Second business for tenant-isolation tests
  const otherUser = await User.create({
    name: 'Suresh Verma',
    email: 'other@chatflow.local',
    passwordHash,
    isActive: true,
    emailVerifiedAt: daysAgo(20),
  });
  const otherBusiness = await Business.create({
    name: 'Verma Electronics',
    slug: 'verma-electronics',
    industry: 'Consumer Electronics',
    timezone: 'Asia/Kolkata',
    isDemo: false,
  });
  const freePlan = await Plan.findOne({ where: { code: 'free' } });
  await BusinessMember.create({
    businessId: otherBusiness.id,
    userId: otherUser.id,
    role: 'owner',
    status: 'active',
  });
  await Subscription.create({
    businessId: otherBusiness.id,
    planId: freePlan.id,
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: daysAgo(5),
    currentPeriodEnd: hoursFromNow(25 * 24),
  });
  await Customer.create({
    businessId: otherBusiness.id,
    name: 'Private Tenant Customer',
    phone: '+919999900001',
    leadStatus: 'new',
    source: 'manual',
    whatsappOptIn: true,
  });
}

async function seedAll(models) {
  await seedPlans(models);
  await seedDemoWorkspace(models);
}

// Provide no-op up/down so sequelize-cli db:seed:all ignores this helper module cleanly
async function up() {}
async function down() {}

module.exports = { PLANS_DATA, seedPlans, seedDemoWorkspace, seedAll, up, down };
