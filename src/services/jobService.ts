import { Job, JobsState } from "../types/job";
import config from "../config";

/**
 * Fetches a specific page of jobs from the NYC jobs website via our API
 */
export const fetchJobsPage = async (
  page: number,
  customSize?: number
): Promise<{
  jobs: Job[];
  totalPages: number;
}> => {
  try {
    const size = customSize || config.getPageSize();
    const response = await fetch(`/api/jobs?page=${page}&size=${size}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch jobs: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      jobs: data.jobs,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

/**
 * Fetches all jobs from all pages of the NYC jobs website
 * @param onProgress Optional callback to report progress during scanning
 */
export const fetchAllJobs = async (
  onProgress?: (progress: JobsState["scanProgress"]) => void
): Promise<Job[]> => {
  try {
    // First, fetch the first page to get the total number of pages
    const pageSize = config.getPageSize();
    const { totalPages } = await fetchJobsPage(1, pageSize);

    // Average fetch time: 1 second per fetch + 2 seconds delay between pages
    const averageTimePerPage = 3; // seconds

    // Update progress
    if (onProgress) {
      onProgress({
        currentPage: 1,
        totalPages,
        jobsScanned: 0,
        timeRemainingSeconds: (totalPages - 1) * averageTimePerPage,
      });
    }

    // Sequential fetching with random delay instead of parallel
    const allJobs: Job[] = [];

    for (let page = 1; page <= totalPages; page++) {
      // Add a random delay between 300ms-1300ms to avoid rate limiting
      if (page > 1) {
        const delayMs = Math.floor(Math.random() * 1000) + 300;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const result = await fetchJobsPage(page, pageSize);
      allJobs.push(...result.jobs);

      // Log progress to console
      console.log(
        `Fetched page ${page}/${totalPages} (${result.jobs.length} jobs)`
      );

      // Update progress via callback
      if (onProgress) {
        // Calculate time remaining: (remaining pages) * (average time per page)
        const remainingPages = totalPages - page;
        const timeRemaining = remainingPages * averageTimePerPage;

        onProgress({
          currentPage: page,
          totalPages,
          jobsScanned: allJobs.length,
          timeRemainingSeconds: timeRemaining,
        });
      }
    }

    return allJobs;
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    throw error;
  }
};

/**
 * Fetches job details for a specific job to get the "Posted On" date
 * @param jobId The job ID to fetch details for
 * @param jobUrl The URL of the job details page
 * @returns The posted date string in format MM/DD/YYYY or null if not found
 */
export const fetchJobDetails = async (
  jobId: string,
  jobUrl: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `/api/job-details?url=${encodeURIComponent(jobUrl)}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch job details: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.postedDate;
  } catch (error) {
    console.error(`Error fetching details for job ${jobId}:`, error);
    return null;
  }
};

/**
 * Fetches job details for jobs that don't have details yet
 * @param jobs The array of jobs to fetch details for
 * @param onProgress Optional callback to report progress
 * @param batchSize Number of jobs to process before saving to server (default: 10)
 * @param onBatchSaved Optional callback when a batch is saved to update UI
 * @returns Updated array of jobs with details
 */
export const fetchAllJobDetails = async (
  jobs: Job[],
  onProgress?: (current: number, total: number) => void,
  batchSize: number = 10,
  onBatchSaved?: (latestJobs: Job[]) => void
): Promise<Job[]> => {
  const updatedJobs = [...jobs];
  const jobsNeedingDetails = updatedJobs.filter((job) => !job.detailsFetched);

  console.log(
    `Fetching details for ${jobsNeedingDetails.length} jobs (${
      updatedJobs.length - jobsNeedingDetails.length
    } already have details)`
  );

  let processedCount = 0;
  let batchCount = 0;

  for (const job of jobsNeedingDetails) {
    // Add a random delay between 1-3 seconds to avoid rate limiting
    const delayMs = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const postedDate = await fetchJobDetails(job.id, job.url);

    // Find the job in our array and update it
    const jobIndex = updatedJobs.findIndex((j) => j.id === job.id);
    if (jobIndex >= 0) {
      updatedJobs[jobIndex] = {
        ...updatedJobs[jobIndex],
        postedDate: postedDate || undefined,
        detailsFetched: true,
      };
    }

    processedCount++;
    batchCount++;

    if (onProgress) {
      onProgress(processedCount, jobsNeedingDetails.length);
    }

    // Save in batches to avoid losing progress
    if (
      batchCount >= batchSize ||
      processedCount === jobsNeedingDetails.length
    ) {
      console.log(
        `Saving batch of ${batchCount} jobs (${processedCount}/${jobsNeedingDetails.length} total)`
      );
      try {
        await saveJobsToServer(updatedJobs);
        batchCount = 0;

        // After saving a batch, notify for UI update
        if (onBatchSaved) {
          onBatchSaved(updatedJobs);
        }
      } catch (error) {
        console.error("Error saving job batch:", error);
        // Continue processing even if save fails
      }
    }

    // Log progress every 10 jobs
    if (
      processedCount % 10 === 0 ||
      processedCount === jobsNeedingDetails.length
    ) {
      console.log(
        `Fetched details for ${processedCount}/${jobsNeedingDetails.length} jobs`
      );
    }
  }

  // Final save to ensure everything is saved
  if (processedCount > 0) {
    try {
      await saveJobsToServer(updatedJobs);
      if (onBatchSaved) {
        onBatchSaved(updatedJobs);
      }
    } catch (error) {
      console.error("Error saving jobs:", error);
    }
  }

  return updatedJobs;
};

/**
 * Gets the jobs data from the server-side storage
 */
export const getStoredJobs = async (): Promise<{
  jobs: Job[];
  metadata: { lastScan: string | null };
}> => {
  try {
    const response = await fetch("/api/jobs/data");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch stored jobs: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch stored jobs");
    }

    return {
      jobs: data.jobs,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("Error fetching stored jobs:", error);
    throw error;
  }
};

/**
 * Saves the jobs data to the server-side storage
 */
export const saveJobsToServer = async (
  jobs: Job[]
): Promise<{
  success: boolean;
  metadata: { lastScan: string };
}> => {
  try {
    const response = await fetch("/api/jobs/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobs }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to save jobs: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to save jobs");
    }

    return {
      success: true,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("Error saving jobs:", error);
    throw error;
  }
};

/**
 * Resets job details flags - sets postedDate to undefined and detailsFetched to false
 * for all stored jobs
 * @returns Updated jobs with reset details
 */
export const resetJobDetails = async (): Promise<Job[]> => {
  try {
    // Get all stored jobs
    const { jobs } = await getStoredJobs();

    // Reset the details for all jobs
    const resetJobs = jobs.map((job) => ({
      ...job,
      postedDate: undefined,
      detailsFetched: false,
    }));

    // Save the reset jobs
    await saveJobsToServer(resetJobs);
    console.log(`Reset details for ${resetJobs.length} jobs`);

    return resetJobs;
  } catch (error) {
    console.error("Error resetting job details:", error);
    throw error;
  }
};

/**
 * Merges new jobs from a scan with existing jobs, preserving job details
 * for jobs that already exist in the store
 *
 * @param newJobs The newly fetched jobs from the scan
 * @param existingJobs The existing jobs that may have job details
 * @returns Merged jobs array with preserved job details
 */
export const mergeJobsPreservingDetails = (
  newJobs: Job[],
  existingJobs: Job[]
): Job[] => {
  // Create a map of existing jobs by ID for quick lookup
  const existingJobsMap = new Map<string, Job>();
  existingJobs.forEach((job) => {
    existingJobsMap.set(job.id, job);
  });

  // Merge the jobs, preserving details for existing jobs
  return newJobs.map((newJob) => {
    const existingJob = existingJobsMap.get(newJob.id);

    // If this job exists and has details, keep the details
    if (existingJob && existingJob.detailsFetched) {
      return {
        ...newJob, // Start with the new job data (to get any updated fields)
        postedDate: existingJob.postedDate, // Preserve the posted date
        detailsFetched: existingJob.detailsFetched, // Preserve the details fetched flag
      };
    }

    // Otherwise, return the new job as is
    return newJob;
  });
};
