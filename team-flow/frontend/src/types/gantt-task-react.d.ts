declare module 'gantt-task-react' {
  export enum ViewMode {
    QuarterDay = 'Quarter Day',
    HalfDay = 'Half Day',
    Day = 'Day',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
  }

  export interface Task {
    start: Date;
    end: Date;
    name: string;
    id: string;
    type: 'task' | 'milestone' | 'project';
    progress: number;
    dependencies?: string[];
    isDisabled?: boolean;
    styles?: {
      backgroundColor?: string;
      backgroundSelectedColor?: string;
      progressColor?: string;
      progressSelectedColor?: string;
    };
  }

  export interface GanttProps {
    tasks: Task[];
    viewMode?: ViewMode;
    onDateChange?: (task: Task, children: Task[]) => void;
    onProgressChange?: (task: Task, children: Task[]) => void;
    onDoubleClick?: (task: Task) => void;
    onClick?: (task: Task) => void;
    onSelect?: (task: Task) => void;
    listCellWidth?: string;
    projectBackgroundColor?: string;
    projectProgressColor?: string;
    projectProgressSelectedColor?: string;
    rowHeight?: number;
  }

  export const Gantt: React.FC<GanttProps>;
}
