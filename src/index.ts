import * as dotenv from "dotenv";
import { Queue } from "bullmq";
import { createQueue, createWorker, scheduleRecurringJob } from "./utils/queue";
import { GmailService } from "./services/gmail.service";
import { EmailProcessorService } from "./services/email-processor.service.ts";

dotenv.config();

class EmailAutomationTool {
  private emailProcessorService: EmailProcessorService;
  private emailSyncQueue: Queue;
  private emailProcessingQueue: Queue;

  constructor() {
    this.emailProcessorService = new EmailProcessorService();
    this.emailSyncQueue = createQueue("email-sync");
    this.emailProcessingQueue = createQueue("email-processing");
  }

  async start() {
    // Create email sync worker
    createWorker("email-sync", async (job) => {
      console.log("Executing email-sync job...");
      const gmailService = new GmailService(job.data?.credentials || {});

      try {
        const emails = await gmailService.fetchEmails();
        console.log("Fetched Emails:", emails);

        if (!emails || emails.length === 0) {
          console.log("No emails fetched to process.");
          return;
        }

        // Enqueue each email for processing
        for (const email of emails) {
          if (!email || !email.body) {
            console.error("Invalid email:", email);
            continue;
          }
          console.log("Enqueuing email for processing:", email);
          await this.emailProcessingQueue.add("process-email", { email });
        }
      } catch (err) {
        console.error("Error in email-sync worker:", err);
      }
    });

    // Create email processing worker
    createWorker("email-processing", async (job) => {
      console.log("Processing job data:", job.data);
      if (!job.data || !job.data.email) {
        throw new Error("Invalid job data: Missing email");
      }

      try {
        const processedEmail = await this.emailProcessorService.processEmail(
          job.data.email
        );
        console.log("Processed Email:", processedEmail);
        return processedEmail;
      } catch (err) {
        console.error("Error processing email:", err);
        throw err;
      }
    });

    // Schedule periodic email sync
    await scheduleRecurringJob(
      this.emailSyncQueue, // Use a separate queue for sync
      "email-sync",
      {
        credentials: {
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          userId: process.env.GMAIL_USER_ID,
          access_token: process.env.GMAIL_ACCESS_TOKEN,
          refreshToken:process.env.GMAIL_REFRESH_TOKEN
        },
      },
      parseInt(process.env.EMAIL_SYNC_INTERVAL || "300000")
    );

    console.log(
      "Scheduled email sync every",
      process.env.EMAIL_SYNC_INTERVAL || "300000",
      "ms"
    );

    console.log("Email Automation Tool Started");
  }
}

// Initialize and start the tool
const automationTool = new EmailAutomationTool();
automationTool.start().catch(console.error);