/**
 * PayMongo Webhook API Route
 * Simple webhook endpoint for development
 */

import { handlePayMongoWebhook } from './paymongoWebhook';

export async function POST(request: Request) {
  // Convert Web API Request to Express-like format
  const req = {
    body: await request.json(),
    headers: Object.fromEntries(request.headers.entries())
  };
  
  // Create response object
  let responseData: any;
  let statusCode = 200;
  
  const res = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (data: any) => {
          responseData = data;
        }
      };
    },
    json: (data: any) => {
      responseData = data;
    }
  };
  
  // Handle the webhook
  await handlePayMongoWebhook(req as any, res as any);
  
  return Response.json(responseData, { status: statusCode });
}
