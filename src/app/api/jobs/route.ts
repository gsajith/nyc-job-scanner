import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  parseJobsFromHtml,
  getTotalPagesFromHtml,
} from "../../../utils/jobParser";
import config from "../../../config";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "48";
    const pageSize = parseInt(size, 10);

    const response = await fetch(
      `https://cityjobs.nyc.gov/jobs?page=${page}&size=${size}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch jobs: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse the HTML on the server
    const jobs = parseJobsFromHtml(html);
    const totalPages = config.limitPages(getTotalPagesFromHtml(html, pageSize));

    return NextResponse.json({
      jobs,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching jobs" },
      { status: 500 }
    );
  }
}
