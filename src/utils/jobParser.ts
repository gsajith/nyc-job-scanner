import "server-only";
import { Job } from "../types/job";
import { JSDOM } from "jsdom";

export const parseJobsFromHtml = (html: string): Job[] => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const jobElements = document.querySelectorAll(".attrax-vacancy-tile");
  const jobs: Job[] = [];

  jobElements.forEach((jobElement: Element) => {
    const id = jobElement.getAttribute("data-jobid") || "";
    const titleElement = jobElement.querySelector(
      ".attrax-vacancy-tile__title"
    );
    const title = titleElement?.textContent?.trim() || "";
    const url = titleElement?.getAttribute("href") || "";

    const salary =
      jobElement
        .querySelector(".attrax-vacancy-tile__salary-value")
        ?.textContent?.trim() || "";
    const location =
      jobElement
        .querySelector(
          ".attrax-vacancy-tile__location-freetext .attrax-vacancy-tile__item-value"
        )
        ?.textContent?.trim() || "";

    const jobType =
      jobElement
        .querySelector(
          ".attrax-vacancy-tile__option-job-type .attrax-vacancy-tile__item-value"
        )
        ?.textContent?.trim() || "";
    const category =
      jobElement
        .querySelector(
          ".attrax-vacancy-tile__option-category .attrax-vacancy-tile__item-value"
        )
        ?.textContent?.trim() || "";
    const experienceLevel =
      jobElement
        .querySelector(
          ".attrax-vacancy-tile__option-experience-level .attrax-vacancy-tile__item-value"
        )
        ?.textContent?.trim() || "";
    const agency =
      jobElement
        .querySelector(
          ".attrax-vacancy-tile__option-agency .attrax-vacancy-tile__item-value"
        )
        ?.textContent?.trim() || "";

    const description =
      jobElement
        .querySelector(".attrax-vacancy-tile__description-value")
        ?.textContent?.trim() || "";

    jobs.push({
      id,
      title,
      salary,
      location,
      jobType,
      category,
      experienceLevel,
      agency,
      description,
      url,
    });
  });

  return jobs;
};

export const getTotalPagesFromHtml = (
  html: string,
  pageSize: number = 48
): number => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Find the total results element
  const totalResultsElement = document.querySelector(
    ".attrax-pagination__total-results"
  );
  if (!totalResultsElement) return 1;

  // Extract the total results count (e.g., "4080 results" -> 4080)
  const totalResultsText = totalResultsElement.textContent?.trim() || "";
  const totalResultsMatch = totalResultsText.match(/(\d+)/);

  if (!totalResultsMatch) return 1;

  const totalResults = parseInt(totalResultsMatch[1], 10);
  if (isNaN(totalResults)) return 1;

  // Calculate total pages based on provided page size
  return Math.ceil(totalResults / pageSize);
};
