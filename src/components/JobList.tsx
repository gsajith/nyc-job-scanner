"use client";

import { useEffect, useState } from "react";
import { useJobStore } from "../store/jobStore";
import { Job } from "../types/job";
import JobCard from "./JobCard";
import Pagination from "./Pagination";
import FilterBar from "./FilterBar";
import styles from "./JobList.module.css";
import config from "../config";

export default function JobList() {
  const {
    jobs,
    totalJobs,
    currentPage,
    totalPages,
    isLoading,
    error,
    lastScanTime,
    debugMode,
    scanProgress,
    detailsProgress,
    fetchJobs,
    setPage,
    loadStoredJobs,
    rescanAllJobs,
    resetJobDetailsData,
  } = useJobStore();

  // State for filtered jobs
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const [sortByRecent, setSortByRecent] = useState(false);

  // Load jobs from server storage on initial render
  useEffect(() => {
    loadStoredJobs();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Update filtered jobs when jobs change or sorting option changes
  useEffect(() => {
    if (jobs.length > 0) {
      let jobsToDisplay = isFiltered ? [...filteredJobs] : [...jobs];

      // Apply sorting if enabled
      if (sortByRecent) {
        jobsToDisplay = sortJobsByPostedDate(jobsToDisplay);
      }

      setFilteredJobs(jobsToDisplay);
    }
  }, [jobs, sortByRecent]); // Don't include filteredJobs in the dependency array to avoid infinite loops

  // Function to sort jobs by posted date (most recent first)
  const sortJobsByPostedDate = (jobsToSort: Job[]): Job[] => {
    return [...jobsToSort].sort((a, b) => {
      // If neither has a posted date, maintain original order
      if (!a.postedDate && !b.postedDate) return 0;

      // If only one has a posted date, put the one without at the beginning
      if (!a.postedDate) return -1; // Move jobs without dates to the beginning
      if (!b.postedDate) return 1;

      // Compare dates (most recent first)
      const dateA = new Date(a.postedDate);
      const dateB = new Date(b.postedDate);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRescan = async () => {
    await rescanAllJobs();
  };

  const handleResetJobDetails = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all job details? This will clear all Posted On dates and require re-fetching them."
      )
    ) {
      await resetJobDetailsData();
    }
  };

  // Toggle reset button visibility
  const toggleResetButton = () => {
    setShowResetButton(!showResetButton);
  };

  // Handler for when filters change
  const handleFilterChange = (filtered: Job[]) => {
    // First determine if this is a filtered set
    const isNewFiltered = filtered.length !== jobs.length;

    // Apply sorting if needed
    let jobsToDisplay = [...filtered];
    if (sortByRecent) {
      jobsToDisplay = sortJobsByPostedDate(jobsToDisplay);
    }

    // Update state
    setFilteredJobs(jobsToDisplay);
    setIsFiltered(isNewFiltered);
  };

  // Handler for sort checkbox change
  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortByRecent(e.target.checked);
  };

  // Format the last scan date for display
  const formatLastScanDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} minute${
        minutes !== 1 ? "s" : ""
      } ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>NYC Job Listings</h1>
          {debugMode && (
            <div
              className={styles.debugBadge}
              title={`Debug mode is ON. Page size: ${config.debugPageSize}, Max pages: ${config.debugMaxPages}`}>
              DEBUG
            </div>
          )}
          {/* Hidden reset button that shows when the debug badge is clicked */}
          {debugMode && (
            <div
              className={styles.debugButton}
              onClick={toggleResetButton}
              title="Show/hide reset button">
              ⚙️
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <p className={styles.lastScan}>
            Last scan: {formatLastScanDate(lastScanTime)}
          </p>
          <div className={styles.actionButtons}>
            <button
              className={styles.rescanButton}
              onClick={handleRescan}
              disabled={isLoading}>
              {isLoading && scanProgress ? "Scanning..." : "Rescan All Jobs"}
            </button>

            {showResetButton && (
              <button
                className={styles.resetButton}
                onClick={handleResetJobDetails}
                disabled={isLoading}>
                Reset Job Details
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading && scanProgress && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Scanning NYC Jobs site...</p>
          <div className={styles.progressInfo}>
            <p>
              Page {scanProgress.currentPage} of {scanProgress.totalPages}
            </p>
            <p>Jobs found: {scanProgress.jobsScanned}</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${
                    (scanProgress.currentPage / scanProgress.totalPages) * 100
                  }%`,
                }}></div>
            </div>
            {scanProgress.timeRemainingSeconds !== undefined && (
              <p className={styles.timeRemaining}>
                Estimated time remaining:{" "}
                {formatTimeRemaining(scanProgress.timeRemainingSeconds)}
              </p>
            )}
            <p className={styles.progressNote}>
              Adding random delay between page fetches to avoid rate limiting
            </p>
          </div>
        </div>
      )}

      {isLoading && !scanProgress && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading job listings...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button
            className={styles.retryButton}
            onClick={() => fetchJobs(currentPage)}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Add FilterBar component with sort controls */}
          <FilterBar
            jobs={jobs}
            onFilterChange={handleFilterChange}
            sortByRecent={sortByRecent}
            onSortChange={handleSortChange}
          />

          {/* Show background details fetching progress if active */}
          {detailsProgress && detailsProgress.totalJobs > 0 && (
            <div className={styles.backgroundProgress}>
              <div className={styles.backgroundProgressInner}>
                <p>
                  Fetching job details: {detailsProgress.currentJob} of{" "}
                  {detailsProgress.totalJobs}
                  {jobs.length > detailsProgress.totalJobs && (
                    <span className={styles.preservedDetails}>
                      {" "}
                      (Preserved details for{" "}
                      {jobs.length - detailsProgress.totalJobs} jobs)
                    </span>
                  )}
                </p>
                <div className={styles.miniProgressBar}>
                  <div
                    className={styles.miniProgressFill}
                    style={{
                      width: `${
                        (detailsProgress.currentJob /
                          detailsProgress.totalJobs) *
                        100
                      }%`,
                    }}></div>
                </div>
                <p className={styles.progressNote}>
                  Details are saved in batches of 10 as they are fetched
                </p>
              </div>
            </div>
          )}

          <div className={styles.statsBar}>
            <p>
              {isFiltered
                ? `Showing ${filteredJobs.length} filtered jobs out of ${totalJobs} total jobs`
                : `Showing ${jobs.length} jobs out of ${totalJobs} total jobs`}
              {debugMode && (
                <span className={styles.debugInfo}>
                  {" "}
                  - Debug mode: Page size {config.debugPageSize}, Max{" "}
                  {config.debugMaxPages} pages
                </span>
              )}
            </p>
          </div>

          {filteredJobs.length === 0 && isFiltered ? (
            <div className={styles.noResults}>
              <p>
                No jobs match your filter criteria. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className={styles.jobGrid}>
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {totalPages > 1 && !isFiltered && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
