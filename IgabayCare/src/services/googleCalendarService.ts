// Google Calendar configuration
const CALENDAR_ID = 'primary'; // or your specific calendar ID
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface AppointmentDetails {
  patientName: string;
  doctorName: string;
  service: string;
  date: string;
  time: string;
  duration?: number; // in minutes, default to 30
  patientEmail?: string;
  doctorEmail?: string;
  notes?: string;
}

// Browser-compatible JWT signing (simplified)
class SimpleJWT {
  private static base64UrlEscape(str: string): string {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private static base64UrlEncode(str: string): string {
    return this.base64UrlEscape(btoa(str));
  }

  private static async importKey(pem: string): Promise<CryptoKey> {
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = pem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
  }

  static async createJWT(
    header: any,
    payload: any,
    privateKeyPem: string
  ): Promise<string> {
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const key = await this.importKey(privateKeyPem);
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(data)
    );
    
    const encodedSignature = this.base64UrlEscape(
      btoa(String.fromCharCode(...new Uint8Array(signature)))
    );
    
    return `${data}.${encodedSignature}`;
  }
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // No immediate initialization needed for browser version
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Create JWT for service account authentication
      const now = Math.floor(Date.now() / 1000);
      const expiry = now + 3600; // 1 hour

      const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: import.meta.env.VITE_GOOGLE_PRIVATE_KEY_ID,
      };

      const payload = {
        iss: import.meta.env.VITE_GOOGLE_CLIENT_EMAIL,
        scope: SCOPES.join(' '),
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: expiry,
      };

      const jwt = await SimpleJWT.createJWT(
        header,
        payload,
        import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      );

      // Exchange JWT for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get access token: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Google Calendar access token:', error);
      throw error;
    }
  }

  private async makeCalendarRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
    const url = `${GOOGLE_CALENDAR_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async createAppointmentEvent(appointmentDetails: AppointmentDetails): Promise<string | null> {
    try {
      const { patientName, doctorName, service, date, time, duration = 30, patientEmail, doctorEmail, notes } = appointmentDetails;

      // Parse the date and time
      const appointmentDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(appointmentDateTime.getTime() + duration * 60000);

      // Format for Google Calendar
      const startTime = appointmentDateTime.toISOString();
      const endTime = endDateTime.toISOString();

      // Prepare attendees
      const attendees = [];
      if (patientEmail) {
        attendees.push({ email: patientEmail, displayName: patientName });
      }
      if (doctorEmail) {
        attendees.push({ email: doctorEmail, displayName: doctorName });
      }

      // Create the event
      const event = {
        summary: `Medical Appointment: ${patientName} - ${service}`,
        description: [
          `Patient: ${patientName}`,
          `Doctor: ${doctorName}`,
          `Service: ${service}`,
          notes ? `Notes: ${notes}` : '',
        ].filter(Boolean).join('\n'),
        start: {
          dateTime: startTime,
          timeZone: 'UTC', // You might want to make this configurable
        },
        end: {
          dateTime: endTime,
          timeZone: 'UTC',
        },
        attendees,
        location: 'IgabayCare Medical Clinic', // You can make this configurable
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
        // Add metadata for n8n integration
        extendedProperties: {
          private: {
            source: 'IgabayCare',
            appointmentType: service,
            patientName,
            doctorName,
          },
        },
      };

      console.log('Creating Google Calendar event:', event);

      const response = await this.makeCalendarRequest(
        'POST',
        `/calendars/${CALENDAR_ID}/events?sendUpdates=all`,
        event
      );

      console.log('Google Calendar event created:', response);
      return response.id;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      return null;
    }
  }

  async updateAppointmentEvent(eventId: string, appointmentDetails: Partial<AppointmentDetails>): Promise<boolean> {
    try {
      const { patientName, doctorName, service, date, time, duration = 30, notes } = appointmentDetails;

      const updateData: any = {};

      if (patientName && doctorName && service) {
        updateData.summary = `Medical Appointment: ${patientName} - ${service}`;
      }

      if (patientName || doctorName || service || notes) {
        updateData.description = [
          patientName ? `Patient: ${patientName}` : '',
          doctorName ? `Doctor: ${doctorName}` : '',
          service ? `Service: ${service}` : '',
          notes ? `Notes: ${notes}` : '',
        ].filter(Boolean).join('\n');
      }

      if (date && time) {
        const appointmentDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(appointmentDateTime.getTime() + duration * 60000);

        updateData.start = {
          dateTime: appointmentDateTime.toISOString(),
          timeZone: 'UTC',
        };
        updateData.end = {
          dateTime: endDateTime.toISOString(),
          timeZone: 'UTC',
        };
      }

      const response = await this.makeCalendarRequest(
        'PATCH',
        `/calendars/${CALENDAR_ID}/events/${eventId}?sendUpdates=all`,
        updateData
      );

      console.log('Google Calendar event updated:', response);
      return true;
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      return false;
    }
  }

  async deleteAppointmentEvent(eventId: string): Promise<boolean> {
    try {
      await this.makeCalendarRequest(
        'DELETE',
        `/calendars/${CALENDAR_ID}/events/${eventId}?sendUpdates=all`
      );

      console.log('Google Calendar event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      return false;
    }
  }

  async getAppointmentEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        q: 'IgabayCare', // Filter for our appointments
      });

      if (timeMax) {
        params.append('timeMax', timeMax);
      }

      const response = await this.makeCalendarRequest(
        'GET',
        `/calendars/${CALENDAR_ID}/events?${params.toString()}`
      );

      return response.items || [];
    } catch (error) {
      console.error('Failed to get Google Calendar events:', error);
      return [];
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
