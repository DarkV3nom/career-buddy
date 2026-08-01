// Generates a .docx cover letter matching the same type family/margins as
// the resume generator (Calibri, US Letter, 0.5in margins) for visual
// consistency between the two documents a candidate downloads together.

import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";

const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN = 1080; // 0.75in -- letters read better with slightly wider margins than the resume
const FONT = "Calibri";
const SIZE_BODY = 22; // 11pt
const SIZE_NAME = 32; // 16pt

export interface CoverLetterContent {
  fullName: string;
  contactLine?: string; // phone | email | linkedin, single line under the name
  date?: string;
  recipient?: string; // e.g. "Hiring Manager\nAcme Corp"
  salutation?: string; // e.g. "Dear Hiring Manager,"
  bodyParagraphs: string[];
  signOff?: string; // e.g. "Sincerely,"
}

export async function generateCoverLetterDocx(content: CoverLetterContent): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: content.fullName, bold: true, font: FONT, size: SIZE_NAME })],
    }),
  ];

  if (content.contactLine) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: content.contactLine, font: FONT, size: SIZE_BODY - 2 })],
      }),
    );
  }

  if (content.date) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: content.date, font: FONT, size: SIZE_BODY })],
      }),
    );
  }

  if (content.recipient) {
    for (const line of content.recipient.split("\n")) {
      children.push(
        new Paragraph({
          spacing: { after: 0 },
          children: [new TextRun({ text: line, font: FONT, size: SIZE_BODY })],
        }),
      );
    }
    children.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
  }

  if (content.salutation) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: content.salutation, font: FONT, size: SIZE_BODY })],
      }),
    );
  }

  for (const para of content.bodyParagraphs) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: para, font: FONT, size: SIZE_BODY })],
      }),
    );
  }

  if (content.signOff) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 0 },
        children: [new TextRun({ text: content.signOff, font: FONT, size: SIZE_BODY })],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { before: 400 },
        children: [new TextRun({ text: content.fullName, font: FONT, size: SIZE_BODY })],
      }),
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE_BODY } },
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
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
