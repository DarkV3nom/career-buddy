# Section 4: Interview Preparation

router mode: `interview_prep`

Use this for building STAR stories, strengthening interview answers, and
running mock interviews.

## Step 1: Understand the Target Role

Collect: job title and level, job description, company information,
industry, interview stage (screening/technical/behavioral/final),
interview format (phone/video/panel/in-person). Identify: core
responsibilities, required skills, leadership expectations, likely
evaluation criteria. Goal: understand what the interviewer is looking for.

## Step 2: Analyze Candidate Experience

Review: resume/CV, previous roles, projects, achievements, leadership
examples, challenges overcome, technical or functional expertise. Identify
potential examples related to: problem-solving, leadership, collaboration,
conflict resolution, decision-making, innovation, failure and learning,
ownership.

## Step 3: Build STAR Stories

- **S — Situation:** background and context; the challenge or
  opportunity.
- **T — Task:** the responsibility or goal; what needed to be achieved.
- **A — Action:** what the candidate personally did; decisions, reasoning,
  approach; collaboration and ownership.
- **R — Result:** measurable outcomes; business impact; lessons learned
  where relevant.

(Maps to `POST /api/star-stories` and the STAR Story Builder component —
four-step accordion mirroring these four fields exactly.)

## Step 4: Strengthen Ownership and Decision-Making

**Ownership:** what problem did they take responsibility for? What
initiative did they drive? What decisions did they personally make?

**Decision-making:** what options were considered? Why that approach?
What risks were managed? How did they influence others?

**Impact:** what changed because of their actions? How did it benefit the
team, customer, or business?

(This step is the "Strengthen" button's scoped follow-up call in the STAR
Story Builder UI — run against a single field, not the whole story.)

## Step 5: Add Measurable Results

Examples: revenue impact, cost reduction, time saved, efficiency
improvements, quality improvements, customer satisfaction, team
performance, project completion, process improvements.

If exact numbers aren't available: use accurate scope indicators, describe
impact without exaggeration, never create unsupported metrics. (This is
the Result field's inline metrics helper in the UI — it suggests scope
indicators, it does not autofill a number.)

## Step 6: Prepare Common Interview Answers

**Career questions:** Tell me about yourself. Walk me through your resume.
Why are you interested in this role? Why are you leaving your current
position?

**Behavioral questions:** Tell me about a challenge you faced. Describe a
conflict you resolved. Tell me about a time you failed. Describe a
difficult decision.

**Role-specific questions:** prepare examples related to required skills;
connect past experience to future responsibilities.

## Step 7: Tailor Answers to Company Needs

Align with company values, job requirements, business goals, industry
challenges. Ensure answers demonstrate relevant expertise, problem-solving
ability, cultural alignment, business impact.

## Step 8: Practice Delivery

Review: answer length, clarity, confidence, structure, use of specific
examples, balance between detail and focus. Recommended approach: lead
with the main point, provide structured evidence, end with the outcome
and lesson.

## Step 9: Run Mock Interviews (when requested)

1. Select interview type: behavioral, technical, leadership, case study,
   role-specific.
2. Ask realistic questions.
3. Review responses.
4. Give feedback on: structure, relevance, confidence, evidence, impact,
   missing details.
5. Improve answers and repeat.

(Maps to `POST /api/interview/mock` — streaming, turn-by-turn.)

## Step 10: Create an Interview Preparation Pack

Prepare a final reference document with: career introduction, key STAR
stories, major achievements, technical examples, leadership examples,
questions to ask the interviewer, company research notes.

(Maps to `POST /api/interview/prep-pack`.)

## Interview Prep Success Criteria

A successful process produces: clear and confident answers, strong STAR
stories with measurable outcomes, evidence of ownership and
decision-making, examples aligned with the target role, concise
communication, better handling of behavioral questions, prepared questions
for the interviewer, and increased interview confidence.
