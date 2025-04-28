import { supabase } from '../../lib/supabase';
import { SmsMessage, SmsResponse, ApiResponse } from './types';
import { formatSmsMessage } from '../../utils/smsUtils';

const SMS_API_URL = import.meta.env.VITE_SMS_API_URL;
const SMS_API_USER = import.meta.env.VITE_SMS_API_USER;
const SMS_API_PASS = import.meta.env.VITE_SMS_API_PASS;
const APP_URL = import.meta.env.VITE_APP_URL;

const sendSmsChunk = async (messages: SmsMessage[]): Promise<SmsResponse[]> => {
  const responses: SmsResponse[] = [];

  for (const message of messages) {
    if (message.phoneType === 'k') { // Only send to mobile phones
      const params = new URLSearchParams({
        type: '3',
        sender: 'NTE Wroclaw',
        'long-sms': '0',
        'special-chars': '0',
        'dlr-url': `${APP_URL}/api/sms-report?smsid=%smsID&delivery_date=%timestamp&report=%report`,
        'return-send-recipients': 'true',
        text: formatSmsMessage(message),
        recipients: message.phone.replace(/[^0-9]/g, '')
      });

      try {
        const response = await fetch(SMS_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(SMS_API_USER + ':' + SMS_API_PASS)}`,
            'Accept': 'text/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const data: ApiResponse = await response.json();
        const smsDate = new Date().toISOString();

        // Update SMS status in database
        const recipientResult = data.response.recipientsResults[0];
        if (recipientResult) {
          const status = recipientResult.status === '0' ? 3 : 11;
          await supabase
            .from('sms_messages')
            .insert({
              id: message.smsId,
              phone: message.phone,
              phone_type: message.phoneType,
              message: params.get('text') || '',
              status: status,
              sms_date: smsDate,
              api_id: recipientResult['sms-id'],
              delivery_date: smsDate
            });

          responses.push({
            smsId: message.smsId,
            status: parseInt(recipientResult.status),
            apiId: recipientResult['sms-id'],
            smsDate: smsDate,
            url: params.toString()
          });
        }
      } catch (error) {
        console.error('Failed to send SMS:', error);
        responses.push({
          smsId: message.smsId,
          status: 11, // Error status
          smsDate: new Date().toISOString()
        });
      }
    } else {
      // Update status for landline numbers
      await supabase
        .from('sms_messages')
        .update({
          status: 2,
          delivery_date: new Date().toISOString()
        })
        .eq('id', message.smsId);

      responses.push({
        smsId: message.smsId,
        status: 2,
        smsDate: new Date().toISOString()
      });
    }
  }

  return responses;
};

export const sendBulkSms = async (messages: SmsMessage[]): Promise<SmsResponse[]> => {
  const responses: SmsResponse[] = [];
  
  // Split messages into chunks of 20
  const chunks = Array.from({ length: Math.ceil(messages.length / 20) }, (_, i) =>
    messages.slice(i * 20, (i + 1) * 20)
  );

  for (const chunk of chunks) {
    const chunkResponses = await sendSmsChunk(chunk);
    responses.push(...chunkResponses);
    
    // Wait 10 seconds between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // Optimize table after sending all messages
  await supabase.rpc('optimize_sms_messages');

  return responses;
};