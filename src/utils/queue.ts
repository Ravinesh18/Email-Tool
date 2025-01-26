// @ts-nocheck
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config()
const redis_port=process.env.REDIS_PORT
const redis_host=String(process.env.REDIS_HOST)
console.log(redis_port,redis_host,'this is a redis server')
const redisConnection = new Redis(redis_port,redis_host,{});

export const createQueue = (name: string) => {
  return new Queue(name, { connection: redisConnection });
};

export const createWorker = (
  name: string,
  processFunction: (job: any) => Promise<any>
) => {
  console.log(`Creating worker for queue: ${name}`);
  const worker = new Worker(name, processFunction, {
    connection: redisConnection,
  });
  worker.on('completed', (job) => {
    console.log(`Job completed in worker ${name}:`, job.id);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job failed in worker ${name}:`, job.id, err);
  });

  return worker;
};

export const scheduleRecurringJob = async (
  queue: Queue, 
  jobName: string, 
  jobData: any, 
  interval: number
) => {
  await queue.add(jobName, jobData, { 
    repeat: { 
      every: interval 
    } 
  });
};