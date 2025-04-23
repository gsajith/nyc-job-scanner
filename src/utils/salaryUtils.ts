/**
 * Utility functions for handling salary data
 */

/**
 * Parses a salary string and returns the minimum annual salary
 * Handles different formats like "$50,000-$70,000", "$25.00-$30.00 per hour", etc.
 * Converts hourly rates to annual based on 40hr week, 52 weeks per year
 *
 * @param salaryString The salary string to parse
 * @returns The minimum annual salary as a number, or 0 if unable to parse
 */
export const parseMinimumAnnualSalary = (salaryString: string): number => {
  if (!salaryString) return 0;

  const hourlyPattern =
    /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:-\s*\$\d+(?:,\d+)*(?:\.\d+)?)?\s*(?:per\s+hour|\/hour|hourly)/i;
  const annualPattern =
    /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:-\s*\$\d+(?:,\d+)*(?:\.\d+)?)?/i;

  let minimumSalary = 0;

  // Check if it's an hourly rate
  const hourlyMatch = salaryString.match(hourlyPattern);
  if (hourlyMatch && hourlyMatch[1]) {
    // Convert hourly to annual (40 hours/week * 52 weeks/year)
    const hourlyRate = parseFloat(hourlyMatch[1].replace(/,/g, ""));
    minimumSalary = hourlyRate * 40 * 52;
  } else {
    // Try to match as annual salary
    const annualMatch = salaryString.match(annualPattern);
    if (annualMatch && annualMatch[1]) {
      minimumSalary = parseFloat(annualMatch[1].replace(/,/g, ""));
    }
  }

  return minimumSalary;
};

/**
 * Formats a salary number as a currency string
 *
 * @param salary The salary number to format
 * @returns Formatted salary string (e.g., "$50,000")
 */
export const formatSalary = (salary: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(salary);
};
