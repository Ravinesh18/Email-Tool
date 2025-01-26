export interface EmailModel {
    id: string;
    provider: 'gmail' | 'outlook';
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
    category?: 'Interested' | 'Not Interested' | 'More Information';
  }