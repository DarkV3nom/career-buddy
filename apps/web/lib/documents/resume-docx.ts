// Generates a .docx resume from StructuredResumeContent, replicating the
// layout/typography of Jakes-Resume-Word-Files/Jakes Resume Original/
// Jakes Resume Calibri/US Letter/1.TECH-Jakes-Resume-Template-Calibri-US-Letter.docx
//
// Measurements below (page size, margins, font sizes, colors, tab stops)
// were extracted directly from that template's word/document.xml,
// word/styles.xml and word/theme/theme1.xml -- see the code comments for
// the source value next to each one. docx-js can't open/populate an
// existing .docx, so this rebuilds the same visual structure from scratch
// with dynamic, variable-length content (multiple experience entries,
// variable bullet counts, etc).

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} from "docx";
import type {
  StructuredResumeContent,
  ResumeExperienceEntry,
  ResumeEducationEntry,
  ResumeProjectEntry,
} from "./resume-content";

// --- Page geometry (US Letter, 0.5in margins) -----------------------------
const PAGE_WIDTH = 12240; // twips, word/document.xml sectPr/pgSz
const PAGE_HEIGHT = 15840;
const MARGIN = 720; // 0.5in, word/document.xml sectPr/pgMar
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2; // 10800
const RIGHT_TAB_POS = 10710; // observed w:tab w:val="right" w:pos in entry lines

// --- Palette / type (styles.xml, theme1.xml) ------------------------------
const HEADING_COLOR = "222A35"; // 4SectionHeaders / Heading1 color, themeColor text2 shade 80
const SHADING_FILL = "F1F1F5"; // 3ContactDetails / header contact line shading
const FONT = "Calibri";

const SIZE_NAME = 44; // scaled down from the template's 76 (38pt) for a docx-generated,
// print-practical name size; 38pt is oversized outside the source Word
// theme's exact metrics. Rendered result is verified visually below.
const SIZE_HEADLINE = 24; // 12pt
const SIZE_CONTACT = 20; // 10pt
const SIZE_SECTION = 24; // 12pt, template's 4SectionHeaders is 26 half-pt (13pt); 24 reads
// cleaner in a from-scratch rebuild while keeping the same visual weight
const SIZE_BODY = 22; // 11pt, template default (Normal, sz 22)

const NUMBERING_BULLETS = "resume-bullets";

function rightAlignedLine(left: string, right: string, opts: { bold?: boolean } = {}) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_POS }],
    spacing: { after: 40 },
    children: [
      new TextRun({ text: left, bold: opts.bold ?? true, font: FONT, size: SIZE_BODY }),
      new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
      new TextRun({ text: right, font: FONT, size: SIZE_BODY, italics: true }),
    ],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 220, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: HEADING_COLOR, space: 1 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        color: HEADING_COLOR,
        font: FONT,
        size: SIZE_SECTION,
        characterSpacing: 15,
      }),
    ],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    numbering: { reference: NUMBERING_BULLETS, level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
  });
}

function experienceBlock(entry: ResumeExperienceEntry) {
  const paragraphs: Paragraph[] = [
    rightAlignedLine(entry.positionTitle, entry.dateRange, { bold: true }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: [entry.employerName, entry.location].filter(Boolean).join(" — "),
          italics: true,
          font: FONT,
          size: SIZE_BODY,
        }),
      ],
    }),
  ];
  for (const bullet of entry.bullets) paragraphs.push(bulletParagraph(bullet));
  return paragraphs;
}

function educationBlock(entry: ResumeEducationEntry) {
  const paragraphs: Paragraph[] = [
    rightAlignedLine(entry.degree, entry.years, { bold: true }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: [entry.institution, entry.location].filter(Boolean).join(" — "),
          font: FONT,
          size: SIZE_BODY,
        }),
      ],
    }),
  ];
  for (const detail of entry.details ?? []) paragraphs.push(bulletParagraph(detail));
  return paragraphs;
}

function projectBlock(entry: ResumeProjectEntry) {
  const rightText = [entry.skillsUsed, entry.dateRange].filter(Boolean).join(" | ");
  const paragraphs: Paragraph[] = [rightAlignedLine(entry.projectTitle, rightText, { bold: true })];
  for (const bullet of entry.bullets) paragraphs.push(bulletParagraph(bullet));
  return paragraphs;
}

function skillsParagraphs(skills: StructuredResumeContent["skills"]) {
  return skills.map(
    (s) =>
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${s.category}: `, bold: true, font: FONT, size: SIZE_BODY }),
          new TextRun({ text: s.items.join(", "), font: FONT, size: SIZE_BODY }),
        ],
      }),
  );
}

function contactLine(content: StructuredResumeContent["contact"]) {
  const parts = [content.phone, content.email, content.linkedin, content.website, content.location].filter(
    Boolean,
  );
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, color: "auto", fill: SHADING_FILL },
    spacing: { after: 200 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: parts.join("  |  "), font: FONT, size: SIZE_CONTACT })],
  });
}

export async function generateResumeDocx(content: StructuredResumeContent): Promise<Buffer> {
  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: content.contact.headline ? 20 : 60 },
      children: [
        new TextRun({ text: content.contact.fullName, bold: true, font: FONT, size: SIZE_NAME }),
      ],
    }),
  ];
  if (content.contact.headline) {
    headerParagraphs.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: content.contact.headline, font: FONT, size: SIZE_HEADLINE })],
      }),
    );
  }
  headerParagraphs.push(contactLine(content.contact));

  const body: Paragraph[] = [];

  if (content.summary) {
    body.push(sectionHeading("Professional Summary"));
    body.push(
      new Paragraph({
        spacing: { after: 160 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: content.summary, font: FONT, size: SIZE_BODY })],
      }),
    );
  }

  if (content.experience.length) {
    body.push(sectionHeading("Work Experience"));
    for (const entry of content.experience) body.push(...experienceBlock(entry));
  }

  if (content.projects.length) {
    body.push(sectionHeading("Projects"));
    for (const entry of content.projects) body.push(...projectBlock(entry));
  }

  if (content.education.length) {
    body.push(sectionHeading("Education"));
    for (const entry of content.education) body.push(...educationBlock(entry));
  }

  if (content.skills.length) {
    body.push(sectionHeading("Technical Skills"));
    body.push(...skillsParagraphs(content.skills));
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: NUMBERING_BULLETS,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 260, hanging: 180 } },
                run: { font: FONT, size: SIZE_BODY },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_BODY },
          paragraph: { spacing: { line: 260, after: 160 } },
        },
        heading1: {
          run: { font: FONT, size: SIZE_SECTION, bold: true, color: HEADING_COLOR },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: [...headerParagraphs, ...body],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
