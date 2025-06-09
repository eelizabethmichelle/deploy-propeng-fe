// components/ui/grade-details/schema.ts

// Interface for the data representing a single component's grade details
export interface ComponentGrade {
    komponen_id?: number // Optional: Backend might not send this if not needed for keys
    komponen: string // Name of the assessment component (e.g., "UTS", "Kuis Bab 1")
    bobot: number | null // Weight of the component (can be null if not set)
    nilai: number | null // The student's score for this component (can be null if not graded)
  }
  
  // Interface for the data structure actually passed to the DataTable component.
  // It includes the calculated row number 'no'.
  export interface ComponentGradeWithNo extends ComponentGrade {
    no: number // Row number for display
  }
  
  // Interface for the grade detail data table props
  export interface GradeDetailTableProps {
    title?: string
    components: ComponentGrade[]
    averageScore?: number | null
    averageLabel?: string
  }
  