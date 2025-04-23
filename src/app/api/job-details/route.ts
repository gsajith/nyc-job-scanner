import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Make sure to use the full URL if it's a relative one
    const fullUrl = url.startsWith("http")
      ? url
      : `https://cityjobs.nyc.gov${url.startsWith("/") ? "" : "/"}${url}`;

    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch job details: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse the HTML to extract the posted date
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Look for the "Posted on:" date element
    const dateWidgets = document.querySelectorAll(".date-widget");
    let postedDate: string | null = null;

    for (const widget of Array.from(dateWidgets)) {
      const label = widget.querySelector(".date-label");
      if (
        label &&
        label.textContent &&
        label.textContent.trim() === "Posted on:"
      ) {
        // Get the text node following the label
        const dateText =
          widget.textContent?.trim().replace("Posted on:", "").trim() || null;
        postedDate = dateText;
        break;
      }
    }

    return NextResponse.json({ postedDate });
  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching job details" },
      { status: 500 }
    );
  }
}
