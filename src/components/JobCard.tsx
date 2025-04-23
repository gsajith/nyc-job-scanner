"use client";

import { Job } from "../types/job";
import styles from "./JobCard.module.css";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  // Get a shortened job type tag (FT or PT)
  const getJobTypeTag = (jobType: string): string => {
    if (jobType.toLowerCase().includes("full")) return "Full-time";
    if (jobType.toLowerCase().includes("part")) return "Part-time";
    return jobType;
  };

  const jobTypeTag = getJobTypeTag(job.jobType);

  return (
    <div className={styles.jobCard}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>{job.title}</h3>
        <div
          className={`${styles.tag} ${
            jobTypeTag === "Full-time" ? styles.fullTime : styles.partTime
          }`}>
          {jobTypeTag}
        </div>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <p className={styles.label}>Salary</p>
          <p className={styles.value}>{job.salary}</p>
        </div>

        <div className={styles.infoItem}>
          <p className={styles.label}>Location</p>
          <p className={styles.value}>{job.location}</p>
        </div>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <p className={styles.label}>Category</p>
          <p className={styles.value}>{job.category}</p>
        </div>

        <div className={styles.infoItem}>
          <p className={styles.label}>Experience Level</p>
          <p className={styles.value}>{job.experienceLevel}</p>
        </div>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <p className={styles.label}>Agency</p>
          <p className={styles.value}>{job.agency}</p>
        </div>

        {job.postedDate && (
          <div className={styles.infoItem}>
            <p className={styles.label}>Posted On</p>
            <p className={styles.value}>{job.postedDate}</p>
          </div>
        )}
      </div>

      <hr />

      <div className={styles.description}>
        <p className={styles.label}>Description</p>
        <p className={styles.value}>{job.description}</p>
      </div>

      <div className={styles.buttons}>
        <a
          href={`https://cityjobs.nyc.gov${job.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.button}>
          Learn More
        </a>
      </div>
    </div>
  );
}
