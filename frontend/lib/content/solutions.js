/** Industry solutions — each has its own examples, workflows and featured capabilities. */
export const solutions = [
  {
    slug: 'retail',
    name: 'Retail & local shops',
    short: 'Answer stock enquiries quickly and turn walk-ins into repeat buyers.',
    icon: 'Store',
    tone: 'green',
    headline: 'Turn “Is this available?” into a sale.',
    intro:
      'Clothing stores, electronics shops, kirana and gift shops get dozens of product questions every day. Keep every enquiry organised, follow up with interested buyers and bring regulars back with festive offers sent to customers who opted in.',
    pains: [
      'Product enquiries get lost between personal and business chats',
      'Interested buyers are never followed up',
      'No record of who bought what, or when',
    ],
    workflows: [
      { trigger: 'Keyword “price” or “stock”', steps: ['Tag as Product enquiry', 'Assign to store staff', 'Create follow-up in 1 day'] },
      { trigger: 'Customer tagged “Purchased”', steps: ['Record sale', 'Set lead status to Customer', 'Remind in 30 days for repeat offer'] },
    ],
    sample: {
      customer: 'Hi, is the blue kurta available in size M?',
      reply: 'Yes, size M is in stock! We also have it in maroon. Would you like photos?',
      tag: 'Product enquiry',
    },
    featureSlugs: ['customer-crm', 'shared-inbox', 'campaigns'],
  },
  {
    slug: 'coaching',
    name: 'Coaching centres',
    short: 'Manage admission enquiries, demo classes and batch reminders.',
    icon: 'GraduationCap',
    tone: 'purple',
    headline: 'Fill every batch without chasing every parent.',
    intro:
      'Tuition classes, competitive exam coaching and skill academies juggle admission enquiries, demo-class bookings and fee reminders. ChatFlow keeps each student lead on track from first question to enrolment.',
    pains: [
      'Parents ask the same fee and timing questions repeatedly',
      'Demo-class attendees are not followed up',
      'Batch updates are sent manually one by one',
    ],
    workflows: [
      { trigger: 'New admission enquiry', steps: ['Tag with course interest', 'Assign to counsellor', 'Create demo-class follow-up'] },
      { trigger: 'Lead status → Qualified', steps: ['Add tag “Demo attended”', 'Follow up in 2 days', 'Notify counsellor'] },
    ],
    sample: {
      customer: 'What are the timings for the Class 10 maths batch?',
      reply: 'We have batches at 7 AM and 5 PM. Would you like to book a free demo class?',
      tag: 'Admission enquiry',
    },
    featureSlugs: ['customer-crm', 'automation', 'ai-assistant'],
  },
  {
    slug: 'salons',
    name: 'Beauty salons',
    short: 'Handle booking requests and remind clients when it is time to rebook.',
    icon: 'Scissors',
    tone: 'coral',
    headline: 'Keep your appointment book full.',
    intro:
      'Salons, spas and beauty studios live on repeat visits. Track service history, follow up on booking requests and remind regular clients when it is time for their next appointment.',
    pains: ['Booking requests arrive at all hours', 'Clients forget to rebook', 'No view of each client’s service history'],
    workflows: [
      { trigger: 'Keyword “appointment” or “booking”', steps: ['Check business hours', 'Assign to front desk', 'Create follow-up for today'] },
      { trigger: 'Sale recorded for “Hair colour”', steps: ['Tag as Colour client', 'Rebooking reminder in 6 weeks'] },
    ],
    sample: {
      customer: 'Can I book a haircut for Saturday evening?',
      reply: 'Sure! We have 5:30 PM and 6:30 PM available on Saturday. Which works for you?',
      tag: 'Booking request',
    },
    featureSlugs: ['shared-inbox', 'automation', 'customer-crm'],
  },
  {
    slug: 'restaurants',
    name: 'Restaurants & home kitchens',
    short: 'Take order enquiries, share menus and collect feedback.',
    icon: 'UtensilsCrossed',
    tone: 'yellow',
    headline: 'More orders, fewer missed messages.',
    intro:
      'Cloud kitchens, home chefs, cafés and restaurants receive order and table enquiries in bursts. ChatFlow helps your team respond quickly at peak time and stay in touch with regular customers.',
    pains: ['Orders get missed during the dinner rush', 'Regulars are not recognised', 'No easy way to share weekly specials with opted-in customers'],
    workflows: [
      { trigger: 'New conversation outside hours', steps: ['Check business hours', 'Tag “After hours”', 'Create follow-up for opening time'] },
      { trigger: 'Keyword “order”', steps: ['Assign to kitchen manager', 'Set status to Contacted'] },
    ],
    sample: {
      customer: 'Do you deliver to Koramangala tonight?',
      reply: 'Yes, we deliver to Koramangala until 10:30 PM. Shall I share today’s menu?',
      tag: 'Order enquiry',
    },
    featureSlugs: ['shared-inbox', 'campaigns', 'analytics'],
  },
  {
    slug: 'real-estate',
    name: 'Real estate',
    short: 'Qualify property leads and schedule site visits.',
    icon: 'Building2',
    tone: 'blue',
    headline: 'Never lose a property lead again.',
    intro:
      'Brokers, builders and property consultants handle long sales cycles. Capture budget and location preferences, schedule site visits and nurture leads over weeks — with every conversation in one place.',
    pains: ['Leads from portals and ads go cold', 'Site-visit follow-ups are inconsistent', 'Hard to see which leads are serious'],
    workflows: [
      { trigger: 'New property enquiry', steps: ['Tag by location', 'Assign to agent (round robin)', 'Site-visit follow-up in 1 day'] },
      { trigger: 'Tag “Site visit done”', steps: ['Lead status → Qualified', 'Follow up in 3 days'] },
    ],
    sample: {
      customer: 'Looking for a 2BHK near Whitefield under 80 lakh.',
      reply: 'We have 3 options matching your budget. Would you like to schedule a site visit this weekend?',
      tag: 'Qualified lead',
    },
    featureSlugs: ['customer-crm', 'automation', 'analytics'],
  },
  {
    slug: 'ecommerce',
    name: 'Small e-commerce',
    short: 'Answer pre-sale questions and recover interested shoppers.',
    icon: 'ShoppingBag',
    tone: 'green',
    headline: 'Answer faster. Recover more shoppers.',
    intro:
      'D2C brands and Instagram sellers get questions about sizes, delivery and returns. Organise every enquiry, follow up with undecided shoppers and keep customers informed with approved utility messages.',
    pains: ['Pre-sale questions go unanswered', 'Undecided shoppers are never followed up', 'Order updates are sent manually'],
    workflows: [
      { trigger: 'Keyword “size” or “COD”', steps: ['Tag “Pre-sale”', 'Assign to support', 'Follow up next day'] },
      { trigger: 'Lead status → Customer', steps: ['Record sale', 'Add tag “Repeat-eligible”'] },
    ],
    sample: {
      customer: 'Is cash on delivery available for Pune?',
      reply: 'Yes, COD is available for Pune. Delivery takes 3–4 days. Shall I share the order link?',
      tag: 'Pre-sale question',
    },
    featureSlugs: ['shared-inbox', 'customer-crm', 'campaigns'],
    // Shown on homepage/solutions index; detailed page routes to the closest match.
    hasPage: false,
  },
];

export const solutionPages = solutions.filter((s) => s.hasPage !== false);
export const solutionBySlug = Object.fromEntries(solutionPages.map((s) => [s.slug, s]));

