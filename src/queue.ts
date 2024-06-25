import { Queue, Worker, QueueScheduler } from 'bullmq';
import { processEmails } from './processor';
import { redisConfig } from './redis';
import dotenv from 'dotenv';

dotenv.config();

const emailQueue = new Queue('emailQueue', { connection: redisConfig });
const emailQueueScheduler = new QueueScheduler('emailQueue', { connection: redisConfig });

const worker = new Worker('emailQueue', async job => {
  const { email, provider } = job.data;
  await processEmails(email, provider);
}, { connection: redisConfig });

worker.on('completed', job => {
  console.log(`Job with id ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.log(`Job with id ${job.id} has failed with error ${err.message}`);
});

export const addEmailToQueue = async (email: string, provider: string) => {
  await emailQueue.add('processEmail', { email, provider });
};
