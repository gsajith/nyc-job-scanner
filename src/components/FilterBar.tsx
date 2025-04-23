"use client";

import { useState, useEffect, useCallback } from "react";
import { Job } from "../types/job";
import styles from "./FilterBar.module.css";
import { parseMinimumAnnualSalary, formatSalary } from "../utils/salaryUtils";

interface FilterBarProps {
  jobs: Job[];
  onFilterChange: (filteredJobs: Job[]) => void;
  sortByRecent: boolean;
  onSortChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FilterBar({
  jobs,
  onFilterChange,
  sortByRecent,
  onSortChange,
}: FilterBarProps) {
  // Extract unique values for each filter
  const [agencies, setAgencies] = useState<string[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [maxSalary, setMaxSalary] = useState<number>(0);

  // Selected filter values
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<
    string[]
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dropdown visibility state
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);
  const [experienceDropdownOpen, setExperienceDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Extract unique filter options from jobs
  useEffect(() => {
    if (jobs?.length) {
      // Extract unique values and sort them
      const uniqueAgencies = [
        ...new Set(jobs.map((job) => job.agency).filter(Boolean)),
      ].sort();
      const uniqueExperienceLevels = [
        ...new Set(jobs.map((job) => job.experienceLevel).filter(Boolean)),
      ].sort();
      const uniqueCategories = [
        ...new Set(jobs.map((job) => job.category).filter(Boolean)),
      ].sort();

      setAgencies(uniqueAgencies);
      setExperienceLevels(uniqueExperienceLevels);
      setCategories(uniqueCategories);

      // Find maximum salary for slider range
      let highestSalary = 0;
      jobs.forEach((job) => {
        const salary = parseMinimumAnnualSalary(job.salary);
        if (salary > highestSalary) {
          highestSalary = salary;
        }
      });

      // Round up to the nearest $10,000 for a cleaner max value
      const roundedMaxSalary = Math.ceil(highestSalary / 10000) * 10000;
      setMaxSalary(roundedMaxSalary);
    }
  }, [jobs]);

  // Filter the jobs based on selected options and search query
  const applyFilters = useCallback(() => {
    let filteredJobs = [...jobs];

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => {
        // Search in multiple fields
        return (
          (job.title && job.title.toLowerCase().includes(query)) ||
          (job.category && job.category.toLowerCase().includes(query)) ||
          (job.location && job.location.toLowerCase().includes(query)) ||
          (job.description && job.description.toLowerCase().includes(query)) ||
          (job.agency && job.agency.toLowerCase().includes(query))
        );
      });
    }

    // Filter by agency
    if (selectedAgencies.length > 0) {
      filteredJobs = filteredJobs.filter((job) =>
        selectedAgencies.includes(job.agency)
      );
    }

    // Filter by experience level
    if (selectedExperienceLevels.length > 0) {
      filteredJobs = filteredJobs.filter((job) =>
        selectedExperienceLevels.includes(job.experienceLevel)
      );
    }

    // Filter by category
    if (selectedCategories.length > 0) {
      filteredJobs = filteredJobs.filter((job) =>
        selectedCategories.includes(job.category)
      );
    }

    // Filter by minimum salary
    if (minSalary > 0) {
      filteredJobs = filteredJobs.filter((job) => {
        const salary = parseMinimumAnnualSalary(job.salary);
        return salary >= minSalary;
      });
    }

    onFilterChange(filteredJobs);
  }, [
    jobs,
    selectedAgencies,
    selectedExperienceLevels,
    selectedCategories,
    minSalary,
    searchQuery,
    onFilterChange,
  ]);

  // Apply filters when selection changes
  useEffect(() => {
    applyFilters();
  }, [
    selectedAgencies,
    selectedExperienceLevels,
    selectedCategories,
    minSalary,
    searchQuery,
    applyFilters,
  ]);

  // Toggle selection of a filter option
  const toggleOption = (
    option: string,
    selectedOptions: string[],
    setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((item) => item !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedAgencies([]);
    setSelectedExperienceLevels([]);
    setSelectedCategories([]);
    setMinSalary(0);
    setSearchQuery("");
  };

  // Handle salary slider change
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinSalary(Number(e.target.value));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside dropdowns and close them
      if (!target.closest(`.${styles.dropdown}`)) {
        setAgencyDropdownOpen(false);
        setExperienceDropdownOpen(false);
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.filterBar}>
      {/* Search bar */}
      <div className={styles.searchFilter}>
        <input
          type="text"
          placeholder="Search jobs..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.dropdown}>
          <button
            className={styles.dropdownToggle}
            onClick={() => setAgencyDropdownOpen(!agencyDropdownOpen)}>
            Agency{" "}
            {selectedAgencies.length > 0 && `(${selectedAgencies.length})`}
            <span className={styles.arrow}>▼</span>
          </button>

          {agencyDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.searchWrapper}>
                {agencies.map((agency) => (
                  <label key={agency} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={selectedAgencies.includes(agency)}
                      onChange={() =>
                        toggleOption(
                          agency,
                          selectedAgencies,
                          setSelectedAgencies
                        )
                      }
                    />
                    <span className={styles.checkboxLabel}>{agency}</span>
                  </label>
                ))}
                {agencies.length === 0 && (
                  <div className={styles.noOptions}>No options available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.dropdown}>
          <button
            className={styles.dropdownToggle}
            onClick={() => setExperienceDropdownOpen(!experienceDropdownOpen)}>
            Experience Level{" "}
            {selectedExperienceLevels.length > 0 &&
              `(${selectedExperienceLevels.length})`}
            <span className={styles.arrow}>▼</span>
          </button>

          {experienceDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.searchWrapper}>
                {experienceLevels.map((level) => (
                  <label key={level} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={selectedExperienceLevels.includes(level)}
                      onChange={() =>
                        toggleOption(
                          level,
                          selectedExperienceLevels,
                          setSelectedExperienceLevels
                        )
                      }
                    />
                    <span className={styles.checkboxLabel}>{level}</span>
                  </label>
                ))}
                {experienceLevels.length === 0 && (
                  <div className={styles.noOptions}>No options available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.dropdown}>
          <button
            className={styles.dropdownToggle}
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}>
            Category{" "}
            {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            <span className={styles.arrow}>▼</span>
          </button>

          {categoryDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.searchWrapper}>
                {categories.map((category) => (
                  <label key={category} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() =>
                        toggleOption(
                          category,
                          selectedCategories,
                          setSelectedCategories
                        )
                      }
                    />
                    <span className={styles.checkboxLabel}>{category}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <div className={styles.noOptions}>No options available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabel}>
            <span>Minimum Salary</span>
            <span className={styles.salaryValue}>
              {minSalary > 0 ? formatSalary(minSalary) : "Any"}
            </span>
          </div>
          <div className={styles.sliderWrapper}>
            <div
              className={styles.sliderProgress}
              style={{ width: `${(minSalary / maxSalary) * 100}%` }}></div>
            <input
              type="range"
              min="0"
              max={maxSalary}
              step="5000"
              value={minSalary}
              onChange={handleSalaryChange}
              className={styles.slider}
              style={{
                backgroundImage:
                  minSalary > 0
                    ? `linear-gradient(to right, #1e40af 0%, #1e40af ${
                        (minSalary / maxSalary) * 100
                      }%, #cbd5e1 ${
                        (minSalary / maxSalary) * 100
                      }%, #cbd5e1 100%)`
                    : undefined,
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.sortCheckbox}>
          <input
            type="checkbox"
            checked={sortByRecent}
            onChange={onSortChange}
          />
          <span className={styles.checkboxLabel}>Sort by most recent</span>
        </label>
      </div>

      {(selectedAgencies.length > 0 ||
        selectedExperienceLevels.length > 0 ||
        selectedCategories.length > 0 ||
        minSalary > 0 ||
        searchQuery.trim() !== "") && (
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset Filters
        </button>
      )}
    </div>
  );
}
