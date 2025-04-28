export interface SmsMessage {
  smsId: string;
  phoneType: 'k' | 's';  // k = mobile, s = landline
  phone: string;
  name: string;
  eventDate: string;
  title: string;
  eventCity: string;
  tickets: string;
}

export interface SmsResponse {
  smsId: string;
  status: number;
  apiId?: string;
  smsDate: string;
  url?: string;
}

export interface ApiResponse {
  response: {
    status: string;
    recipientsResults: {
      status: string;
      'sms-id': string;
    }[];
  };
}