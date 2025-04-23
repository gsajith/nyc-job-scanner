# NYC Job Scanner

A web application that improves the job search experience for NYC government job listings by scraping and enhancing the official NYC Jobs website (https://cityjobs.nyc.gov/).

## Why This Project Exists

The official NYC Jobs website has significant limitations in its search and filter capabilities. Most importantly, it doesn't prominently display the "Posted On" date for job listings, making it difficult for job seekers to identify the most recent opportunities.

This application solves these problems by:

1. Scraping job listings from the NYC Jobs website
2. Fetching and displaying the "Posted On" date for each job
3. Providing enhanced filtering and sorting options
4. Storing job data locally for faster access and offline browsing

## Features

- **Job Scanning**: Fetches all job listings from the NYC Jobs website, with real-time progress tracking
- **Job Details**: Retrieves the "Posted On" date for each job listing
- **Enhanced Filtering**: Filter jobs by agency, experience level, category, and minimum salary
- **Text Search**: Search across job titles, descriptions, locations, and other fields
- **Sort by Date**: Sort jobs by posting date to easily find the newest opportunities
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent Storage**: Saves job data between sessions
- **Progress Tracking**: Shows detailed progress when scanning jobs or fetching job details

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Framework**: Next.js 15 (App Router)
- **State Management**: Zustand
- **HTML Parsing**: JSDOM
- **Styling**: CSS Modules
- **Data Storage**: Server-side JSON files

## How It Works

1. The application scrapes job listings from the NYC Jobs website using server-side API routes
2. Job data is parsed from HTML responses using JSDOM
3. Job details (including the "Posted On" date) are fetched from individual job pages
4. Data is stored in JSON files on the server
5. The UI provides a clean interface for browsing, filtering, and sorting jobs

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/nyc-job-scanner.git
   cd nyc-job-scanner
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Environment Variables

- `NEXT_PUBLIC_PAGE_SIZE`: Number of job listings to display per page (default: 48)
- `NEXT_PUBLIC_DEBUG_MODE`: Enable debug mode with reduced data (default: false)

## Project Structure

- `/src/app/api/`: Server-side API routes for fetching and storing job data
  - `/jobs/`: Fetches job listings from NYC Jobs website
  - `/job-details/`: Fetches detailed job information including posting date
  - `/jobs/data/`: Manages local storage of job data
- `/src/components/`: React components for the UI
- `/src/services/`: Frontend services for data fetching and management
- `/src/types/`: TypeScript type definitions
- `/src/utils/`: Utility functions including HTML parsing
- `/data/`: Local storage for job data and metadata

## Limitations

- The application relies on scraping the NYC Jobs website, so changes to their HTML structure may require updates
- Rate limiting is implemented to avoid overwhelming the NYC Jobs website, but this means scanning all jobs can take several minutes

## License

This project is open source under the MIT license.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
