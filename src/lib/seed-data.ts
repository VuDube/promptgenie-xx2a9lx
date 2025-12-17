import type { PromptTemplate } from './db';
export const INITIAL_TEMPLATES: Omit<PromptTemplate, 'id'>[] = [
  // CO-STAR Framework
  {
    title: 'CO-STAR: Feature Announcement',
    framework: 'CO-STAR',
    category: 'Marketing',
    content: `**Context:** Announcing a new feature for our product, [Product Name]. The target audience is [Target Audience].
**Objective:** To generate excitement and drive adoption of the new [Feature Name].
**Style:** Enthusiastic, clear, and benefit-oriented.
**Tone:** Professional yet approachable.
**Audience:** Existing users of [Product Name].
**Response:** A concise and engaging announcement post for our blog and social media channels.`,
  },
  {
    title: 'CO-STAR: Bug Report Analysis',
    framework: 'CO-STAR',
    category: 'Code',
    content: `**Context:** I have received a bug report from a user. The report states: "[User's Bug Description]".
**Objective:** Analyze the bug report, identify the likely cause, and suggest a course of action for the development team.
**Style:** Technical, analytical, and precise.
**Tone:** Inquisitive and problem-solving.
**Audience:** Software developers and QA engineers.
**Response:** A structured analysis of the bug, including potential root causes, affected components, and recommended next steps for debugging and fixing.`,
  },
  // CRISPE Framework
  {
    title: 'CRISPE: Sales Email',
    framework: 'CRISPE',
    category: 'Sales',
    content: `**Capacity and Role:** I am a Sales Development Representative for [Your Company].
**Insight:** I noticed your company, [Prospect's Company], is expanding its [Department, e.g., marketing team] and might be facing challenges with [Common Challenge, e.g., scaling lead generation].
**Statement:** Our product, [Your Product], helps companies like yours solve this by [Key Benefit, e.g., automating outreach and personalizing communication at scale].
**Problem:** Without an effective solution, scaling can lead to [Negative Consequence, e.g., inconsistent messaging and missed opportunities].
**Ethos:** We've helped similar companies in the [Industry] industry, like [Client Example], achieve [Specific Result, e.g., a 30% increase in qualified leads].
**Response:** Draft a compelling and personalized cold email to the Head of [Department] at [Prospect's Company].`,
  },
  {
    title: 'CRISPE: Content Strategy Pitch',
    framework: 'CRISPE',
    category: 'Creative',
    content: `**Capacity and Role:** I am a Content Strategist pitching a new blog series to my manager.
**Insight:** Our competitors are not adequately covering the topic of [Niche Topic]. There is a clear content gap and high search intent.
**Statement:** I propose a 5-part blog series titled "[Series Title]" that will establish us as thought leaders in this area.
**Problem:** By ignoring this topic, we are missing out on significant organic traffic and the opportunity to engage a key segment of our audience.
**Ethos:** My previous series on [Previous Topic] increased organic traffic by [Percentage]% in [Timeframe]. I will apply the same successful methodology here.
**Response:** Create a concise, persuasive pitch to my manager outlining the series, its goals, and its potential impact.`,
  },
  // Legal Category
  {
    title: 'Summarize Legal Document',
    framework: 'Analysis',
    category: 'Legal',
    content: `Please review the following legal text and provide a summary in plain English. Focus on the key obligations, rights, and potential liabilities for [Party Name].
Legal Text:
"""
[Paste Legal Text Here]
"""`,
  },
  {
    title: 'Draft a Cease and Desist Letter',
    framework: 'Drafting',
    category: 'Legal',
    content: `Draft a formal cease and desist letter.
**Sender:** [Your Name/Company Name]
**Recipient:** [Recipient Name/Company Name]
**Infringement:** [Describe the specific infringing activity, e.g., unauthorized use of copyrighted material, trademark violation].
**Demand:** The letter should demand that the recipient immediately stop the infringing activity and provide written confirmation of their compliance within [Number] days.
**Tone:** Firm, professional, and unequivocal.`,
  },
  // Code Category
  {
    title: 'Explain a Code Snippet',
    framework: 'Code Analysis',
    category: 'Code',
    content: `Explain the following code snippet line by line. Describe its purpose, how it works, and any potential edge cases or improvements.
\`\`\`[language]
[Paste Code Here]
\`\`\``,
  },
  {
    title: 'Generate a REST API Endpoint',
    framework: 'Code Generation',
    category: 'Code',
    content: `Generate a REST API endpoint using [Framework, e.g., Node.js with Express] for the following resource:
**Resource:** [Resource Name, e.g., 'Product']
**Properties:** [List of properties, e.g., 'id', 'name', 'price', 'description']
**Actions:** Create endpoints for GET (all), GET (by ID), POST, PUT (by ID), and DELETE (by ID).
**Details:** Include basic validation and error handling.`,
  },
  {
    title: 'Refactor for Readability',
    framework: 'Code Refactoring',
    category: 'Code',
    content: `Refactor the following code to improve its readability and maintainability. Add comments where necessary and adhere to the [Language/Style Guide, e.g., PEP 8 for Python] style guide.
\`\`\`[language]
[Paste Code Here]
\`\`\``,
  },
  // Creative Category
  {
    title: 'Brainstorm Blog Post Titles',
    framework: 'Ideation',
    category: 'Creative',
    content: `Brainstorm 10 compelling blog post titles for an article about [Topic]. The titles should be a mix of different styles (e.g., how-to, listicle, question, controversial). The target audience is [Target Audience].`,
  },
  {
    title: 'Write a Short Story Opening',
    framework: 'Narrative',
    category: 'Creative',
    content: `Write the opening paragraph (150-200 words) of a short story with the following elements:
**Genre:** [e.g., Sci-Fi, Fantasy, Mystery]
**Setting:** [e.g., A neon-lit cyberpunk city, an ancient enchanted forest]
**Protagonist:** [e.g., A cynical detective, a young mage]
**Inciting Incident:** [e.g., A mysterious message appears, a magical artifact is discovered]`,
  },
  // APE Framework
  {
    title: 'APE: Social Media Campaign',
    framework: 'APE',
    category: 'Marketing',
    content: `**Action:** Create a 3-post social media campaign for Instagram.
**Purpose:** To promote our upcoming webinar on [Webinar Topic].
**Expectation:** The posts should be engaging, informative, and drive registrations. Each post should have a clear call-to-action. Include relevant hashtags.`,
  },
  // TCEF Framework
  {
    title: 'TCEF: Customer Support Response',
    framework: 'TCEF',
    category: 'Support',
    content: `**Task:** Draft a response to an unhappy customer.
**Context:** The customer's order ([Order Number]) was delayed, and they are frustrated.
**Exemplar:** "We sincerely apologize for the delay in your order. I've looked into it, and it appears there was a logistical issue at our warehouse. We have expedited your shipping at no extra cost, and you can expect it to arrive by [New Date]. Here is a 15% discount code for your next purchase as a token of our apology: [CODE]."
**Format:** An empathetic and solution-oriented email.`,
  },
  // Role-Based Framework
  {
    title: 'Role-Based: Product Manager Persona',
    framework: 'Role-Based',
    category: 'Product',
    content: `Act as an experienced Product Manager at a fast-growing SaaS company. Your task is to write a Product Requirements Document (PRD) for a new feature: "[Feature Name]". The document should include sections for Introduction/Problem Statement, Goals/Objectives, User Personas, User Stories, and Success Metrics.`,
  },
  {
    title: 'Role-Based: Financial Analyst',
    framework: 'Role-Based',
    category: 'Finance',
    content: `You are a financial analyst. Analyze the following (hypothetical) quarterly financial data and provide a summary of the company's performance. Highlight key trends, strengths, and weaknesses.
**Revenue:** [Amount]
**Cost of Goods Sold:** [Amount]
**Operating Expenses:** [Amount]
**Net Income:** [Amount]
**Previous Quarter Net Income:** [Amount]`,
  },
];