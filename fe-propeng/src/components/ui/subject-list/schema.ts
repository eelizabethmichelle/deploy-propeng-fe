import { z } from 'zod';

export interface ComponentSummary {
    id: string;
    name: string;
    weight?: number | null; 
    type: 'Pengetahuan' | 'Keterampilan' | string;
}
export const componentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().nullable().optional(),
  type: z.enum(['Pengetahuan', 'Keterampilan']).or(z.string()),
});

export type SubjectStatusType = 'Terisi Penuh' | 'Dalam Proses' | 'Belum Dimulai' | string;
const subjectStatusEnum = z.enum(['Terisi Penuh', 'Dalam Proses', 'Belum Dimulai']);

export interface SubjectSummary {
    id: string; 
    subjectId?: string; 
    name: string;
    academicYear: string;
    knowledgeWeight: number; 
    skillWeight: number;     
    componentCount: number;  
    studentCount: number;    
    status: SubjectStatusType; 
    statusPengetahuan: SubjectStatusType; 
    statusKeterampilan: SubjectStatusType;
    components: ComponentSummary[];
}
export const subjectSummarySchema = z.object({
  id: z.string().uuid(), 
  subjectId: z.string().optional(), 
  name: z.string(),
  academicYear: z.string(),
  knowledgeWeight: z.number(), 
  skillWeight: z.number(),    
  componentCount: z.number(),
  studentCount: z.number(),
  status: z.enum(['Terisi Penuh', 'Dalam Proses', 'Belum Dimulai']).or(z.string()), 
  statusPengetahuan: subjectStatusEnum.or(z.string()),
  statusKeterampilan: subjectStatusEnum.or(z.string()),
  components: z.array(componentSummarySchema),
});

export interface Student { id: string; name: string; }
export interface AssessmentComponent { id: string; name: string; weight: number; type: 'Pengetahuan' | 'Keterampilan' | string; }
export type GradesState = Record<string, Record<string, number | null>>;
export interface GradeTableRowData { id: string; name: string; finalScore?: number | null; [key: string]: any; }
export const gradeTableRowSchema = z.object({ id: z.string(), name: z.string(), finalScore: z.number().nullable().optional() }).passthrough();