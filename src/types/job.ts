export interface Job {
  id: string;
  title: string;
  salary: string;
  location: string;
  jobType: string;
  category: string;
  experienceLevel: string;
  agency: string;
  description: string;
  url: string;
  postedDate?: string;
  detailsFetched?: boolean;
}

export interface JobsState {
  jobs: Job[];
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  scanProgress?: {
    currentPage: number;
    totalPages: number;
    jobsScanned: number;
    timeRemainingSeconds?: number;
  };
  detailsProgress?: {
    currentJob: number;
    totalJobs: number;
    isLoading: boolean;
  };
}
