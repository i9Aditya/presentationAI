import { z } from "zod";

export const OutputTypeSchema = z.enum([
  "presentation",
  "academic_report",
  "business_document",
  "research_paper",
  "pitch_deck",
  "assignment",
  "summary",
  "resume",
  "project_report",
  "viva_material"
]);

export const AudienceSchema = z.enum([
  "engineering_students",
  "mba_students",
  "business_professionals",
  "startup_founders",
  "researchers",
  "general"
]);

export const CitationSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()).default([]),
  year: z.number().optional(),
  sourceUrl: z.string().url().optional(),
  doi: z.string().optional(),
  style: z.enum(["APA", "IEEE", "MLA"]).default("IEEE"),
  formattedText: z.string(),
  reliabilityScore: z.number().min(0).max(1).default(0.5)
});

export const ChartBlockSchema = z.object({
  type: z.literal("chart"),
  chartKind: z.enum(["bar", "line", "pie", "doughnut", "scatter"]),
  title: z.string(),
  data: z.object({
    labels: z.array(z.string()),
    values: z.array(z.number())
  })
});

export const DiagramBlockSchema = z.object({
  type: z.literal("diagram"),
  diagramKind: z.enum(["mermaid", "excalidraw", "uml", "architecture", "flowchart"]),
  title: z.string(),
  source: z.string()
});

export const TextBlockSchema = z.object({
  type: z.literal("text"),
  role: z.enum(["heading", "subtitle", "paragraph", "callout"]),
  text: z.string()
});

export const BulletBlockSchema = z.object({
  type: z.literal("bullets"),
  items: z.array(z.string())
});

export const TableBlockSchema = z.object({
  type: z.literal("table"),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string()))
});

export const ContentBlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  BulletBlockSchema,
  ChartBlockSchema,
  DiagramBlockSchema,
  TableBlockSchema
]);

export const SectionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  layout: z.string().optional(),
  contentBlocks: z.array(ContentBlockSchema),
  speakerNotes: z.string().optional(),
  citationIds: z.array(z.string()).default([])
});

export const ThemeSchema = z.object({
  fontHeading: z.string().default("Inter"),
  fontBody: z.string().default("Source Sans 3"),
  primary: z.string().default("#2563EB"),
  accent: z.string().default("#F97316"),
  background: z.string().default("#FFFFFF"),
  foreground: z.string().default("#111827")
});

export const DocumentIRSchema = z.object({
  documentId: z.string(),
  type: OutputTypeSchema,
  audience: AudienceSchema,
  language: z.string().default("en-IN"),
  style: z.string().default("academic-modern"),
  title: z.string(),
  sections: z.array(SectionSchema),
  citations: z.array(CitationSchema).default([]),
  theme: ThemeSchema.default({})
});

export type DocumentIR = z.infer<typeof DocumentIRSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

