/**
 * Word Document Export for Bible Studies
 *
 * Uses the `docx` library to generate Word documents client-side.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { EditableStudyFull } from '../types';

// Helper to create a styled heading
function createHeading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 400, after: 200 },
  });
}

// Helper to create a section divider
function createDivider(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: 'CCCCCC',
      },
    },
    spacing: { before: 200, after: 200 },
  });
}

// Helper to create labeled content
function createLabeledContent(label: string, content: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: label, bold: true, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: content, size: 22 })],
      spacing: { after: 200 },
    }),
  ];
}

// Helper to get question type label
function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'observation':
      return 'Observation';
    case 'interpretation':
      return 'Interpretation';
    case 'feeling':
      return 'Feeling';
    case 'application':
      return 'Application';
    default:
      return type;
  }
}

/**
 * Export an editable study to a Word document.
 *
 * @param study - The editable study to export
 * @param reference - The passage reference (e.g., "John 1:1-18")
 * @param passageText - The passage text to include (optional)
 */
export async function exportStudyToWord(
  study: EditableStudyFull,
  reference: string,
  passageText?: string
): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: reference, bold: true, size: 36 }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      text: 'Bible Study Guide',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(createDivider());

  // Purpose
  if (study.purpose) {
    children.push(...createLabeledContent('PURPOSE', study.purpose));
  }

  // Context
  if (study.context) {
    children.push(...createLabeledContent('CONTEXT', study.context));
  }

  // Key Themes
  if (study.key_themes.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'KEY THEMES: ', bold: true, size: 24 }),
          new TextRun({ text: study.key_themes.join(' | '), size: 22 }),
        ],
        spacing: { before: 200, after: 200 },
      })
    );
  }

  children.push(createDivider());

  // Study Sections
  children.push(createHeading('STUDY SECTIONS', HeadingLevel.HEADING_1));

  for (let i = 0; i < study.study_flow.length; i++) {
    const section = study.study_flow[i];

    // Section header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Section ${i + 1}: ${section.section_heading}`,
            bold: true,
            size: 26,
          }),
          new TextRun({
            text: ` (${section.passage_section})`,
            italics: true,
            size: 22,
          }),
        ],
        spacing: { before: 300, after: 200 },
      })
    );

    // Questions in this section
    for (const question of section.questions) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${getQuestionTypeLabel(question.type)}: `,
              bold: true,
              size: 22,
              color: getQuestionTypeColor(question.type),
            }),
            new TextRun({ text: question.question, size: 22 }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );

      if (question.answer) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Answer: ', bold: true, size: 20 }),
              new TextRun({ text: question.answer, size: 20 }),
            ],
            spacing: { after: 150 },
            indent: { left: 720 }, // 0.5 inch indent
          })
        );
      }
    }

    // Connection to next section
    if (section.connection) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Connection: ', bold: true, italics: true, size: 20 }),
            new TextRun({ text: section.connection, italics: true, size: 20 }),
          ],
          spacing: { before: 100, after: 200 },
        })
      );
    }
  }

  children.push(createDivider());

  // Summary
  if (study.summary) {
    children.push(createHeading('SUMMARY', HeadingLevel.HEADING_1));
    children.push(
      new Paragraph({
        text: study.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Application Questions
  if (study.application_questions.length > 0) {
    children.push(createHeading('APPLICATION QUESTIONS', HeadingLevel.HEADING_1));
    for (let i = 0; i < study.application_questions.length; i++) {
      const q = study.application_questions[i];
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 22 }),
            new TextRun({ text: q.question, size: 22 }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  // Cross-References
  if (study.cross_references.length > 0) {
    children.push(createHeading('CROSS-REFERENCES', HeadingLevel.HEADING_1));
    for (const ref of study.cross_references) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `\u2022 ${ref.reference}`, bold: true, size: 22 }),
            new TextRun({ text: ` - ${ref.note}`, size: 22 }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  // Prayer Prompt
  if (study.prayer_prompt) {
    children.push(createDivider());
    children.push(createHeading('PRAYER PROMPT', HeadingLevel.HEADING_1));
    children.push(
      new Paragraph({
        text: study.prayer_prompt,
        spacing: { after: 200 },
      })
    );
  }

  // Passage Text (if provided)
  if (passageText && passageText !== '(Enter your passage text or notes here)') {
    children.push(createDivider());
    children.push(createHeading('PASSAGE TEXT', HeadingLevel.HEADING_1));
    children.push(
      new Paragraph({
        text: passageText,
        spacing: { after: 200 },
      })
    );
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Generate and save the file
  const blob = await Packer.toBlob(doc);
  const filename = `${reference.replace(/[^a-zA-Z0-9\s]/g, '-')}-study.docx`;
  saveAs(blob, filename);
}

// Helper to get color for question type
function getQuestionTypeColor(type: string): string {
  switch (type) {
    case 'observation':
      return '4A90A4'; // Teal
    case 'interpretation':
      return '8B5CF6'; // Purple
    case 'feeling':
      return 'EC4899'; // Pink
    case 'application':
      return 'F59E0B'; // Amber
    default:
      return '000000';
  }
}
