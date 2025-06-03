export interface Student {
  id: string;
  name: string;
  class: string;
}

export interface AssessmentComponent {
  id: string;
  name: string;
  weight: number;
}

export type GradesState = Record<string, Record<string, number | null>>;

export interface GradeTableRowData extends Record<string, any> { 
  id: string;
  name: string;
  class: string;
  finalScore: number | null;
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}
export interface GradeTableMeta {
    editingRowId: string | null;
    isEditingAll: boolean;
    grades: GradesState;
    handleGradeChange: (studentId: string, componentId: string, value: string) => void;
    isSavingRow: string | null;
    isSavingAll: boolean;
    handleEditRowTrigger: (rowId: string) => void;
    handleCancelRow: (rowId: string) => void;
    handleSaveRow: (rowId: string) => Promise<void>;
}