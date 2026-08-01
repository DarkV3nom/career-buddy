# Section 1: Resume Building & ATS Optimization

router mode: `resume_optimize`

Use this for building a resume from scratch, optimizing an existing one, or
checking ATS compatibility.

## ATS Optimization Rules

Optimize every resume for ATS (Applicant Tracking System) screening by:
- Matching relevant keywords from the target job description naturally
  throughout the resume.
- Using standard section headings: Summary, Professional Experience,
  Education, Skills, Certifications.
- Avoiding tables, text boxes, graphics, icons, images, headers/footers
  with critical information, and complex formatting that ATS may not
  parse correctly.
- Using clear job titles, dates, company names, and locations.
- Writing achievement-focused bullet points with measurable results where
  available.
- Including both acronyms and full terms where relevant (e.g. "Search
  Engine Optimization (SEO)").
- Prioritizing skills and experience most relevant to the target role.
- Keeping the resume keyword-rich without keyword stuffing.
- Never adding skills, tools, certifications, or experience the candidate
  doesn't actually have.

**ATS Success Criteria:** the resume should be easily readable by common
ATS platforms, aligned with the target job description, structured for
both automated screening and human recruiter review, and professional,
concise, and focused on relevant qualifications.

## Step 1: Collect Required Information

Gather: current resume/CV (if available), target job title and job
description, industry and career level, years of experience, key
achievements and measurable results, education/certifications/tools/
technical skills, career goals and target positions. If information is
missing, ask targeted questions before making assumptions.

## Step 2: Analyze the Existing Resume

Review for ATS compatibility: formatting issues that may prevent parsing,
missing standard sections, keyword alignment with the target job
description, unnecessary graphics/tables/columns/icons/complex layouts.

Review for recruiter impact: clarity and positioning, weak or generic
statements, whether achievements and business value are clear, career
progression and relevance.

## Step 3: Compare Resume Against Job Description

Perform a job-match analysis: extract important keywords and skills from
the job description, identify required qualifications and
responsibilities, compare current resume content against job
requirements, highlight missing keywords/skills/experience areas,
prioritize the most valuable content for the target role.

(Maps to `POST /api/match` — see implementation plan Section 5.1.)

## Step 4: Build the Resume Structure

Use an ATS-safe structure: 1. Contact Information, 2. Professional
Summary, 3. Core Skills / Technical Skills, 4. Professional Experience, 5.
Education, 6. Certifications, 7. Additional Relevant Sections (Projects,
Publications, Languages, etc.).

Use: single-column layout, standard headings, clear job titles, consistent
dates, simple formatting. Avoid: tables, text boxes, graphics, photos,
decorative symbols, unusual section names.

## Step 5: Write the Professional Summary

Improve or write the summary by: positioning the candidate for the target
role, including relevant years of experience, highlighting key skills and
industries, adding measurable impact where possible, including important
ATS keywords naturally.

Structure: **Who you are + expertise + key skills + business impact +
target value.**

## Step 6: Build the Skills Section

Include keywords from the job description. Separate technical and soft
skills where appropriate. Remove outdated or irrelevant skills. Include
industry-standard terminology. Add tools, platforms, frameworks, and
certifications.

## Step 7: Write Experience Bullets

Transform job duties into achievement statements.

Example — Before: "Managed customer accounts." After: "Managed key
customer accounts, improving retention and strengthening long-term client
relationships."

Checklist: start with strong action verbs; include scope (team size,
budget, volume, customers, projects); add metrics when available; explain
business outcomes; connect achievements to company goals.

Formula: **Action Verb + What You Did + How You Did It + Result/Impact.**

## Step 8: Add Metrics and Business Outcomes

Look for ways to quantify impact: revenue growth, cost savings, time
reduction, efficiency improvements, customer satisfaction, process
improvements, team leadership, project delivery outcomes.

If exact numbers aren't available, use accurate scope indicators instead:
number of projects, team size, regions supported, systems managed,
customer volume. **Never invent metrics** — this is a hard constraint, not
a style preference; the Guardrail Diff Engine checks for it specifically.

## Step 9: Keyword Optimization Pass

Add missing relevant keywords naturally. Include variations of important
terms. Balance keywords with readability. Avoid keyword stuffing. Ensure
keywords appear in relevant sections.

Example: instead of "CRM," use "Customer Relationship Management (CRM),
Salesforce CRM, customer data management."

## Step 10: ATS Compliance Check

Verify before moving on (this checklist is rendered literally in the UI —
see `components/resume-editor/`, ATS Compliance Checklist panel):

- [ ] Resume uses standard headings
- [ ] Resume is single-column
- [ ] Important information is searchable text
- [ ] Keywords match the target role
- [ ] Dates and job titles are clear
- [ ] Skills are relevant
- [ ] No unsupported claims added
- [ ] Resume length is appropriate for experience level

## Step 11: Hiring Manager Review

Review from a recruiter's perspective: Is the candidate's value clear
within 10 seconds? Are achievements stronger than responsibilities? Does
the resume show career progression? Does it demonstrate business impact?
Is it tailored to the target role?

## Step 12: Deliver

Provide: 1. ATS-optimized resume draft, 2. Key improvements made, 3. ATS
blockers removed, 4. Keyword alignment notes, 5. Suggestions for further
customization.

The final resume should be ATS-readable, keyword-aligned,
achievement-focused, professionally positioned, and easy for recruiters to
scan.
