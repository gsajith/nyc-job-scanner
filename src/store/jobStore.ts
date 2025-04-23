import { create } from "zustand";
import { JobsState } from "../types/job";
import {
  fetchJobsPage,
  fetchAllJobs,
  getStoredJobs,
  saveJobsToServer,
  fetchAllJobDetails,
  resetJobDetails,
  mergeJobsPreservingDetails,
} from "../services/jobService";
import config from "../config";

interface JobStore extends JobsState {
  lastScanTime: string | null;
  debugMode: boolean;
  fetchJobs: (page: number) => Promise<void>;
  rescanAllJobs: () => Promise<void>;
  loadStoredJobs: () => Promise<void>;
  setPage: (page: number) => void;
  updateScanProgress: (progress: JobsState["scanProgress"]) => void;
  resetJobDetailsData: () => Promise<void>;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  totalJobs: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  scanProgress: undefined,
  detailsProgress: undefined,
  lastScanTime: null,
  debugMode: config.debugMode,

  updateScanProgress: (progress) => {
    set({ scanProgress: progress });
  },

  resetJobDetailsData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Reset all job details
      const resetJobs = await resetJobDetails();

      // Update the display with reset jobs
      const pageSize = config.getPageSize();
      const currentPage = get().currentPage || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, resetJobs.length);
      const paginatedJobs = resetJobs.slice(startIndex, endIndex);

      set({
        jobs: paginatedJobs,
        totalJobs: resetJobs.length,
        isLoading: false,
        error: null,
      });

      alert(
        "All job details have been reset. You can now rescan to fetch them again."
      );
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while resetting job details",
      });
    }
  },

  fetchJobs: async (page: number) => {
    set({ isLoading: true, error: null });
    try {
      const { jobs, totalPages } = await fetchJobsPage(page);
      set({
        jobs,
        totalJobs: jobs.length,
        currentPage: page,
        totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching jobs",
      });
    }
  },

  loadStoredJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { jobs, metadata } = await getStoredJobs();

      const pageSize = config.getPageSize();
      const totalPages = config.limitPages(Math.ceil(jobs.length / pageSize));

      const currentPage = 1;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, jobs.length);
      const paginatedJobs = jobs.slice(startIndex, endIndex);

      set({
        jobs: paginatedJobs,
        totalJobs: jobs.length,
        currentPage,
        totalPages,
        lastScanTime: metadata.lastScan,
        isLoading: false,
        scanProgress: undefined,
      });

      // After loading jobs, check if there are any jobs that need details fetched
      const jobsNeedingDetails = jobs.filter((job) => !job.detailsFetched);
      if (jobsNeedingDetails.length > 0) {
        // Start fetching details in the background - don't set loading state
        set({
          detailsProgress: {
            currentJob: 0,
            totalJobs: jobsNeedingDetails.length,
            isLoading: false, // Set to false so the UI remains usable
          },
        });

        // Get the stored jobs again to ensure we have the latest data
        const { jobs: latestJobs } = await getStoredJobs();

        // Incremental saving is handled inside fetchAllJobDetails
        fetchAllJobDetails(
          latestJobs,
          (current, total) => {
            set({
              detailsProgress: {
                currentJob: current,
                totalJobs: total,
                isLoading: false, // Set to false so the UI remains usable
              },
            });
          },
          10, // Save every 10 jobs
          (updatedJobs) => {
            // Update the UI immediately after each batch is saved
            const currentPage = get().currentPage;
            const pageSize = config.getPageSize();
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = Math.min(
              startIndex + pageSize,
              updatedJobs.length
            );
            const paginatedJobs = updatedJobs.slice(startIndex, endIndex);

            set({
              jobs: paginatedJobs,
            });
          }
        ).then(() => {
          // Finalize when all processing is done
          set({
            detailsProgress: undefined,
          });
        });
      }
    } catch (error) {
      console.error("Error loading stored jobs:", error);

      try {
        await fetchJobsPage(1);
      } catch {
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "An error occurred while loading jobs",
        });
      }
    }
  },

  rescanAllJobs: async () => {
    set({
      isLoading: true,
      error: null,
      scanProgress: {
        currentPage: 0,
        totalPages: 0,
        jobsScanned: 0,
      },
    });

    try {
      // First, get existing jobs to preserve details
      const { jobs: existingJobs } = await getStoredJobs();

      // Step 1: Fetch all job listings from all pages
      const newlyScannedJobs = await fetchAllJobs((progress) => {
        set({ scanProgress: progress });
      });

      // Merge the newly scanned jobs with existing jobs, preserving job details
      const mergedJobs = mergeJobsPreservingDetails(
        newlyScannedJobs,
        existingJobs
      );

      // First save the jobs so users can see the results
      const { metadata } = await saveJobsToServer(mergedJobs);

      // Display the jobs to the user immediately after scanning is complete
      const currentPage = 1;
      const pageSize = config.getPageSize();
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, mergedJobs.length);
      const paginatedJobs = mergedJobs.slice(startIndex, endIndex);
      const totalPages = config.limitPages(
        Math.ceil(mergedJobs.length / pageSize)
      );

      set({
        jobs: paginatedJobs,
        totalJobs: mergedJobs.length,
        currentPage,
        totalPages,
        lastScanTime: metadata.lastScan,
        isLoading: false,
        scanProgress: undefined,
      });

      // Step 2: After showing the user the job listings, fetch details for jobs that don't have them yet
      const jobsNeedingDetails = mergedJobs.filter(
        (job) => !job.detailsFetched
      );

      if (jobsNeedingDetails.length > 0) {
        // Set the details progress but don't block the UI (isLoading remains false)
        set({
          detailsProgress: {
            currentJob: 0,
            totalJobs: jobsNeedingDetails.length,
            isLoading: false, // Keep isLoading false so user can still interact
          },
        });

        // Get the stored jobs again to ensure we have the latest data
        const { jobs: latestJobs } = await getStoredJobs();

        // Fetch job details with incremental saving - updates happen in batches
        fetchAllJobDetails(
          latestJobs,
          (current, total) => {
            set({
              detailsProgress: {
                currentJob: current,
                totalJobs: total,
                isLoading: false, // Keep isLoading false so user can still interact
              },
            });
          },
          10, // Save every 10 jobs
          (updatedJobs) => {
            // Update the UI immediately after each batch is saved
            const currentPageIndex = (get().currentPage - 1) * pageSize;
            const currentPageEndIndex = Math.min(
              currentPageIndex + pageSize,
              updatedJobs.length
            );
            const updatedPaginatedJobs = updatedJobs.slice(
              currentPageIndex,
              currentPageEndIndex
            );

            set({
              jobs: updatedPaginatedJobs,
            });
          }
        ).then(() => {
          // Only update the lastScanTime at the end of the process
          getStoredJobs().then(({ metadata }) => {
            set({
              lastScanTime: metadata.lastScan,
              detailsProgress: undefined,
            });
          });
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while rescanning jobs",
        scanProgress: undefined,
        detailsProgress: undefined,
      });
    }
  },

  setPage: (page: number) => {
    set(() => {
      getStoredJobs()
        .then(({ jobs }) => {
          const pageSize = config.getPageSize();
          const startIndex = (page - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, jobs.length);
          const paginatedJobs = jobs.slice(startIndex, endIndex);

          set({
            jobs: paginatedJobs,
            currentPage: page,
          });
        })
        .catch((error) => {
          console.error("Error fetching jobs for pagination:", error);
        });

      return { currentPage: page };
    });
  },
}));
