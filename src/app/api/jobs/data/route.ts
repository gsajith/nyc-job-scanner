import "server-only";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Path to the data file relative to the project root
const DATA_FILE_PATH = path.join(process.cwd(), "data", "jobs.json");
const METADATA_FILE_PATH = path.join(process.cwd(), "data", "metadata.json");

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Get the last scan time
async function getMetadata() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(METADATA_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    // If file doesn't exist or has invalid JSON, return default metadata
    return { lastScan: null };
  }
}

// Update the last scan time
async function updateMetadata() {
  try {
    await ensureDataDirectory();
    const metadata = { lastScan: new Date().toISOString() };
    await fs.writeFile(METADATA_FILE_PATH, JSON.stringify(metadata, null, 2));
    return metadata;
  } catch (error) {
    console.error("Error writing metadata file:", error);
    throw error;
  }
}

// GET request handler - returns all jobs and metadata
export async function GET() {
  try {
    await ensureDataDirectory();

    // Get metadata
    const metadata = await getMetadata();

    // Check if jobs data exists
    try {
      const data = await fs.readFile(DATA_FILE_PATH, "utf-8");
      const jobs = JSON.parse(data);

      return NextResponse.json({
        jobs,
        metadata,
        success: true,
      });
    } catch {
      // If file doesn't exist, return empty array
      return NextResponse.json({
        jobs: [],
        metadata,
        success: true,
      });
    }
  } catch (error) {
    console.error("Error reading jobs data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch job data",
        success: false,
      },
      { status: 500 }
    );
  }
}

// POST request handler - stores new job data
export async function POST(request: NextRequest) {
  try {
    const { jobs } = await request.json();

    if (!Array.isArray(jobs)) {
      return NextResponse.json(
        {
          error: "Invalid data format. Expected an array of jobs.",
          success: false,
        },
        { status: 400 }
      );
    }

    await ensureDataDirectory();

    // Write jobs data to file
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(jobs, null, 2));

    // Update metadata
    const metadata = await updateMetadata();

    return NextResponse.json({
      message: "Job data stored successfully",
      metadata,
      count: jobs.length,
      success: true,
    });
  } catch (error) {
    console.error("Error storing job data:", error);
    return NextResponse.json(
      {
        error: "Failed to store job data",
        success: false,
      },
      { status: 500 }
    );
  }
}
