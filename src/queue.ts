import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { processEmails } from './processor';
import dotenv from 'dotenv';

dotenv.config();

// Define the Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined, // Password can be undefined if not required
};

// Create instances of Queue, Worker, and QueueEvents
const emailQueue = new Queue('emailQueue', { connection: redisConfig });
const emailQueueScheduler = new QueueEvents('emailQueue', { connection: redisConfig });

const worker = new Worker('emailQueue', async (job: Job) => {
  const { email, provider } = job.data;
  await processEmails(email, provider);
}, { connection: redisConfig });

// Event listeners for job completion and failure
worker.on('completed', (job: Job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

worker.on('failed', (job: Job | undefined, err: Error, prev: string) => {
  if (job) {
    console.log(`Job with id ${job.id} has failed with error ${err.message}`);
  } else {
    console.log(`Job is undefined, failed with error ${err.message}`);
  }
});

// Function to add jobs to the queue
export const addEmailToQueue = async (email: string, provider: string) => {
  await emailQueue.add('processEmail', { email, provider });
};
