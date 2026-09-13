begin;

insert into public.courses (id, title, slug, description, short_description, price, currency, status)
values
  ('10000000-0000-4000-8000-000000000001', 'Digital Marketing Foundations', 'digital-marketing-foundations', 'Learn audience research, content planning, campaign basics, and practical measurement for modern digital channels.', 'Plan focused digital campaigns and measure what works.', 4500, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000002', 'Graphic Design with Canva', 'graphic-design-with-canva', 'Build confident visual design skills through layout, typography, color, brand consistency, and export workflows.', 'Create polished social and business graphics with Canva.', 3500, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000003', 'Freelancing Starter Program', 'freelancing-starter-program', 'Turn a practical skill into a clear freelance offer, credible profile, strong proposal, and professional client workflow.', 'Build your first focused freelance service and client process.', 5000, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000004', 'Web Development Basics', 'web-development-basics', 'Understand HTML, CSS, responsive layouts, accessibility, and the building blocks of useful websites.', 'Build accessible, responsive pages with web fundamentals.', 6500, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000005', 'Microsoft Office Productivity', 'microsoft-office-productivity', 'Work efficiently with documents, spreadsheets, presentations, file organization, and professional collaboration habits.', 'Strengthen everyday Word, Excel, and presentation skills.', 4000, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000006', 'Spoken English for Work', 'spoken-english-for-work', 'Practice clear introductions, workplace conversations, meeting language, listening, and confident professional communication.', 'Communicate more clearly in everyday workplace situations.', 3000, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000007', 'E-commerce Launchpad', 'ecommerce-launchpad', 'Choose a viable product, define the customer, prepare a storefront, and plan responsible order and support workflows.', 'Plan and launch a focused first online store.', 5500, 'PKR', 'published'),
  ('10000000-0000-4000-8000-000000000008', 'Data Analysis Fundamentals', 'data-analysis-fundamentals', 'Learn to clean simple datasets, choose useful summaries, read charts, and communicate evidence-based findings.', 'Turn basic data into clear summaries and decisions.', 6000, 'PKR', 'published')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  short_description = excluded.short_description,
  price = excluded.price,
  currency = excluded.currency,
  status = excluded.status;

insert into public.course_modules (id, course_id, title, description, sort_order)
select seed.id, c.id, seed.title, seed.description, 1
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 'digital-marketing-foundations', 'Campaign Foundations', 'Start with audience, goals, channels, and measurement.'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'graphic-design-with-canva', 'Visual Design Foundations', 'Use hierarchy, spacing, color, and typography deliberately.'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'freelancing-starter-program', 'Your Freelance Offer', 'Define a service, client, proof, and reliable delivery process.'),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'web-development-basics', 'Web Page Foundations', 'Structure and style a useful responsive web page.'),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'microsoft-office-productivity', 'Productive Office Workflows', 'Create, organize, calculate, and present information clearly.'),
  ('20000000-0000-4000-8000-000000000006'::uuid, 'spoken-english-for-work', 'Workplace Communication', 'Speak clearly in introductions, discussions, and meetings.'),
  ('20000000-0000-4000-8000-000000000007'::uuid, 'ecommerce-launchpad', 'Store Launch Foundations', 'Connect product choice, customer need, and store operations.'),
  ('20000000-0000-4000-8000-000000000008'::uuid, 'data-analysis-fundamentals', 'Working with Data', 'Clean, summarize, visualize, and explain a small dataset.')
) as seed(id, slug, title, description)
join public.courses c on c.slug = seed.slug
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.lessons (id, module_id, title, description, content, sort_order)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Plan a measurable campaign', 'Connect one audience need to one useful campaign goal.', 'Define the audience, the action you want them to take, the channel you will use, and one metric that shows whether the campaign helped.', 1),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Build a clear visual hierarchy', 'Guide attention with size, spacing, contrast, and alignment.', 'Start with the most important message. Use consistent alignment, limited type styles, readable contrast, and enough whitespace to keep the design clear.', 1),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'Define a focused freelance offer', 'Make it easy for a suitable client to understand your service.', 'Describe the client, problem, deliverable, timeframe, boundaries, price basis, and proof that supports your offer.', 1),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'Structure a responsive page', 'Use semantic HTML and adaptable CSS.', 'Organize content with meaningful headings and landmarks. Use flexible layouts, readable spacing, and accessible controls that work across screen sizes.', 1),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005', 'Create an efficient office workflow', 'Choose the right tool and organize files predictably.', 'Use documents for narrative, spreadsheets for structured calculations, and presentations for guided communication. Name and store files consistently.', 1),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000006', 'Speak clearly in workplace conversations', 'Use concise language and active listening.', 'Prepare a clear opening, state one idea at a time, confirm important details, and close with the next action or decision.', 1),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000007', 'Validate a store idea', 'Check demand and operational fit before launch.', 'Define the customer problem, compare alternatives, estimate costs, explain fulfillment, and test the offer before investing heavily.', 1),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000008', 'Summarize a small dataset', 'Prepare reliable data before drawing conclusions.', 'Check missing values and inconsistent formats, calculate relevant summaries, choose a chart that matches the comparison, and state limitations.', 1)
on conflict (id) do update set
  module_id = excluded.module_id,
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  sort_order = excluded.sort_order;

insert into public.quizzes (id, lesson_id, title, description, passing_score, is_published)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Audience and Goals Check', 'Check how well you can connect an audience to a measurable goal.', 70, true),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Campaign Measurement Check', 'Choose useful metrics and responsible campaign decisions.', 70, true),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'Visual Hierarchy Check', 'Review layout, readability, contrast, and consistency.', 70, true),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'Canva Export Check', 'Check practical decisions for preparing finished design files.', 70, true),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', 'Freelance Offer Check', 'Assess the clarity and reliability of a freelance offer.', 70, true),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', 'Responsive Web Basics', 'Review semantic structure, accessibility, and responsive layout.', 70, true),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000005', 'Office Productivity Check', 'Choose suitable tools and reliable file practices.', 70, true),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000006', 'Workplace English Check', 'Review clear and respectful workplace communication.', 70, true),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000007', 'E-commerce Readiness Check', 'Test responsible product and launch planning.', 70, true),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000008', 'Data Analysis Basics', 'Review cleaning, summarizing, charts, and evidence.', 70, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  title = excluded.title,
  description = excluded.description,
  passing_score = excluded.passing_score,
  is_published = excluded.is_published;

insert into public.quiz_questions (id, quiz_id, question, options, correct_answer, points, sort_order)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'What should a campaign goal describe?', '["A measurable audience action","A favorite color","Every possible customer"]', '"A measurable audience action"', 1, 1),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'Which audience description is most useful?', '["People who need the specific solution","Everyone online","Only competitors"]', '"People who need the specific solution"', 1, 2),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', 'Why choose one primary channel first?', '["To focus learning and measurement","To avoid having a goal","To guarantee every sale"]', '"To focus learning and measurement"', 1, 3),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', 'Which metric best matches a signup goal?', '["Completed signups","Logo size","Number of staff"]', '"Completed signups"', 1, 1),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002', 'What should you do when results are weak?', '["Review evidence and test one change","Hide the data","Change everything at once"]', '"Review evidence and test one change"', 1, 2),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000002', 'A useful campaign report should connect results to what?', '["The original goal","A random trend","Unrelated expenses"]', '"The original goal"', 1, 3),
  ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000003', 'What creates visual hierarchy?', '["Size, spacing, contrast, and alignment","Using every font","Removing all whitespace"]', '"Size, spacing, contrast, and alignment"', 1, 1),
  ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000003', 'Why is contrast important?', '["It supports readability","It increases file size","It replaces content"]', '"It supports readability"', 1, 2),
  ('50000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000003', 'What makes a design feel consistent?', '["Repeated styles and alignment","Random spacing","A new palette on every page"]', '"Repeated styles and alignment"', 1, 3),
  ('50000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000004', 'Which export is commonly suitable for a web graphic?', '["PNG or JPG","An unfinished draft only","A spreadsheet"]', '"PNG or JPG"', 1, 1),
  ('50000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000004', 'What should you check before export?', '["Dimensions, spelling, and readability","Only the filename color","Nothing"]', '"Dimensions, spelling, and readability"', 1, 2),
  ('50000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000004', 'Why keep an editable source file?', '["To make controlled revisions later","To reduce clarity","To prevent reuse"]', '"To make controlled revisions later"', 1, 3),
  ('50000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000005', 'A focused freelance offer names which essentials?', '["Client, problem, deliverable, and boundaries","Every possible service","Only a username"]', '"Client, problem, deliverable, and boundaries"', 1, 1),
  ('50000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000005', 'What makes a proposal credible?', '["Relevant proof and a clear plan","Unrelated promises","No timeframe"]', '"Relevant proof and a clear plan"', 1, 2),
  ('50000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000005', 'Why define scope?', '["To align expectations and delivery","To hide the price","To avoid communication"]', '"To align expectations and delivery"', 1, 3),
  ('50000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000006', 'Which HTML choice improves structure?', '["Semantic headings and landmarks","Only generic containers","Images for every word"]', '"Semantic headings and landmarks"', 1, 1),
  ('50000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000006', 'A responsive layout should do what?', '["Adapt without horizontal clipping","Use one fixed width everywhere","Hide all controls on mobile"]', '"Adapt without horizontal clipping"', 1, 2),
  ('50000000-0000-4000-8000-000000000018', '40000000-0000-4000-8000-000000000006', 'Why label form controls?', '["So users and assistive technology understand them","To slow the page","To replace validation"]', '"So users and assistive technology understand them"', 1, 3),
  ('50000000-0000-4000-8000-000000000019', '40000000-0000-4000-8000-000000000007', 'Which tool best fits structured calculations?', '["A spreadsheet","A slide deck","An image editor"]', '"A spreadsheet"', 1, 1),
  ('50000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000007', 'What is a useful file naming habit?', '["Use consistent descriptive names","Use random characters only","Rename every file the same"]', '"Use consistent descriptive names"', 1, 2),
  ('50000000-0000-4000-8000-000000000021', '40000000-0000-4000-8000-000000000007', 'A presentation should primarily support what?', '["A guided message for the audience","Hidden calculations","Unsorted raw files"]', '"A guided message for the audience"', 1, 3),
  ('50000000-0000-4000-8000-000000000022', '40000000-0000-4000-8000-000000000008', 'What improves a workplace introduction?', '["A clear name, role, and purpose","Speaking as fast as possible","Avoiding the listener"]', '"A clear name, role, and purpose"', 1, 1),
  ('50000000-0000-4000-8000-000000000023', '40000000-0000-4000-8000-000000000008', 'Active listening includes what?', '["Confirming important details","Interrupting every sentence","Ignoring questions"]', '"Confirming important details"', 1, 2),
  ('50000000-0000-4000-8000-000000000024', '40000000-0000-4000-8000-000000000008', 'How should a work conversation close?', '["With a clear next action","With unrelated information","Without confirming anything"]', '"With a clear next action"', 1, 3),
  ('50000000-0000-4000-8000-000000000025', '40000000-0000-4000-8000-000000000009', 'What should happen before major store investment?', '["Test demand and costs","Assume every product will sell","Ignore fulfillment"]', '"Test demand and costs"', 1, 1),
  ('50000000-0000-4000-8000-000000000026', '40000000-0000-4000-8000-000000000009', 'A responsible product choice connects to what?', '["A real customer need","Only personal preference","An unavailable supplier"]', '"A real customer need"', 1, 2),
  ('50000000-0000-4000-8000-000000000027', '40000000-0000-4000-8000-000000000009', 'Why plan fulfillment?', '["To understand delivery cost and reliability","To avoid customer support","To remove product details"]', '"To understand delivery cost and reliability"', 1, 3),
  ('50000000-0000-4000-8000-000000000028', '40000000-0000-4000-8000-000000000010', 'What should be checked before analysis?', '["Missing values and inconsistent formats","Only chart colors","The final conclusion"]', '"Missing values and inconsistent formats"', 1, 1),
  ('50000000-0000-4000-8000-000000000029', '40000000-0000-4000-8000-000000000010', 'Which chart commonly compares categories?', '["A bar chart","A random shape","A paragraph only"]', '"A bar chart"', 1, 2),
  ('50000000-0000-4000-8000-000000000030', '40000000-0000-4000-8000-000000000010', 'A responsible conclusion should include what?', '["Evidence and relevant limitations","Certainty without evidence","Hidden assumptions"]', '"Evidence and relevant limitations"', 1, 3)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  question = excluded.question,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  points = excluded.points,
  sort_order = excluded.sort_order;

commit;
