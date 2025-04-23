/**
 * Application configuration using environment variables
 */

// Parse environment variables with appropriate defaults
const config = {
  /**
   * Number of job listings to display per page
   */
  pageSize: parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE || "48", 10),

  /**
   * Debug mode
   * When true, only loads 2 pages max with a reduced page size of 12
   */
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",

  /**
   * Debug page size (when in debug mode)
   */
  debugPageSize: 12,

  /**
   * Maximum number of pages to load in debug mode
   */
  debugMaxPages: 2,

  /**
   * Get the effective page size based on debug mode
   */
  getPageSize(): number {
    return this.debugMode ? this.debugPageSize : this.pageSize;
  },

  /**
   * Limit the number of pages based on debug mode
   */
  limitPages(totalPages: number): number {
    if (this.debugMode) {
      return Math.min(totalPages, this.debugMaxPages);
    }
    return totalPages;
  },
};

export default config;
