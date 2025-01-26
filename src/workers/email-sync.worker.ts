// src/workers/email-sync.worker.ts
import { Worker, Queue } from 'bullmq';
import { Gmail } from './gmail.service';
import { Outlook } from './outlook.service';

export class EmailSyncWorker {
  private gmailWorker: Worker;
  private outlookWorker: Worker;
  private emailQueue: Queue;

  constructor() {
    this.emailQueue = new Queue('email-processing');
    
    // Continuous Gmail Sync
    this.gmailWorker = new Worker('gmail-sync', async () => {
      const gmail = new Gmail();
      const emails = await gmail.fetchNewEmails();
      
      // Enqueue emails for processing
      emails.forEach(email => 
        this.emailQueue.add('process-email', { 
          provider: 'gmail', 
          email 
        })
      );
    }, { 
      // Run every 5 minutes
      repeat: { every: 5 * 60 * 1000 } 
    });

    // Similar worker for Outlook
    this.outlookWorker = new Worker('outlook-sync', async () => {
      const outlook = new Outlook();
      const emails = await outlook.fetchNewEmails();
      
      emails.forEach(email => 
        this.emailQueue.add('process-email', { 
          provider: 'outlook', 
          email 
        })
      );
    }, { 
      repeat: { every: 5 * 60 * 1000 } 
    });
  }
}