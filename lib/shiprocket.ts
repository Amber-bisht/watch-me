// Shiprocket API Client Library
// Based on Shiprocket API v2 documentation: https://apidocs.shiprocket.in/

interface ShiprocketAuthResponse {
  token: string;
  expires_at: number;
}

interface ShiprocketAuthCache {
  token: string;
  expiresAt: number;
}

// Cache token for 240 hours (10 days) - refresh after 9 days to be safe
let authCache: ShiprocketAuthCache | null = null;
const TOKEN_REFRESH_THRESHOLD = 9 * 24 * 60 * 60 * 1000; // 9 days in milliseconds

const SHIPROCKET_BASE_URL =
  process.env.SHIPROCKET_BASE_URL ||
  'https://apiv2.shiprocket.in/v1/external';

async function getAuthToken(): Promise<string> {
  // Check if cached token is still valid
  if (
    authCache &&
    authCache.expiresAt > Date.now() + TOKEN_REFRESH_THRESHOLD
  ) {
    return authCache.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    const missing = [];
    if (!email) missing.push('SHIPROCKET_EMAIL');
    if (!password) missing.push('SHIPROCKET_PASSWORD');
    
    throw new Error(
      `Shiprocket credentials not configured. Please set ${missing.join(' and ')} in your environment variables (e.g., .env.local file).`
    );
  }

  // Trim whitespace from credentials (common issue with .env files)
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  const requestBody = {
    email: trimmedEmail,
    password: trimmedPassword,
  };

  const requestUrl = `${SHIPROCKET_BASE_URL}/auth/login`;
  const requestHeaders = {
    'Content-Type': 'application/json',
  };
  const requestBodyString = JSON.stringify(requestBody);

  // Log full request details for debugging
  console.log('='.repeat(80));
  console.log('[Shiprocket] Full Authentication Request Details:');
  console.log('='.repeat(80));
  console.log('URL:', requestUrl);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(requestHeaders, null, 2));
  console.log('Body (Raw):', requestBodyString);
  console.log('Body (Parsed):', JSON.stringify(requestBody, null, 2));
  console.log('Email:', trimmedEmail);
  console.log('Email Length:', trimmedEmail.length);
  console.log('Password:', trimmedPassword);
  console.log('Password Length:', trimmedPassword.length);
  console.log('Password Characters:', trimmedPassword.split('').map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(' '));
  console.log('='.repeat(80));

  // Check for potential whitespace issues
  if (email !== email.trim()) {
    console.warn('[Shiprocket] WARNING: Original email had leading/trailing whitespace!');
  }
  if (password !== password.trim()) {
    console.warn('[Shiprocket] WARNING: Original password had leading/trailing whitespace!');
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBodyString,
    });

    // Log response details
    console.log('[Shiprocket] Response Status:', response.status, response.statusText);
    console.log('[Shiprocket] Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Clear any cached token on authentication failure
      authCache = null;
      
      // Try to parse error response
      let errorMessage = response.statusText;
      let errorDetails: any = {};
      let responseText = '';
      
      try {
        responseText = await response.text();
        console.log('[Shiprocket] Response Body (Raw):', responseText);
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorDetails = errorData;
            console.log('[Shiprocket] Response Body (Parsed):', JSON.stringify(errorData, null, 2));
            
            // Shiprocket API error formats
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = typeof errorData.error === 'string' 
                ? errorData.error 
                : errorData.error.message || JSON.stringify(errorData.error);
            } else if (errorData.errors) {
              // If errors is an array or object, extract messages
              if (Array.isArray(errorData.errors)) {
                errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
              } else if (typeof errorData.errors === 'object') {
                errorMessage = Object.entries(errorData.errors)
                  .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                  .join('; ');
              }
            }
          } catch (parseError) {
            // If JSON parsing fails, use status text
            console.log('[Shiprocket] Failed to parse error response as JSON:', parseError);
            errorMessage = `${response.statusText}: ${responseText}`;
          }
        }
      } catch (textError) {
        console.log('[Shiprocket] Failed to read response text:', textError);
      }
      
      // Provide helpful guidance based on status code
      let guidance = '';
      if (response.status === 403) {
        guidance = ' Please verify your SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your .env.local file. The credentials may be incorrect, or your account may need to be activated.';
      } else if (response.status === 401) {
        guidance = ' Authentication failed. Please check your Shiprocket account credentials.';
      } else if (response.status >= 500) {
        guidance = ' Shiprocket API is experiencing issues. Please try again later.';
      }
      
      const fullErrorMessage = `Shiprocket authentication failed: ${errorMessage} (Status: ${response.status})${guidance}`;
      
      console.error('[Shiprocket] Authentication failed:', {
        status: response.status,
        email: trimmedEmail, // Log email for debugging (password is never logged)
        errorMessage,
        errorDetails,
        requestUrl: `${SHIPROCKET_BASE_URL}/auth/login`,
      });
      
      throw new Error(fullErrorMessage);
    }

    const responseText = await response.text();
    console.log('[Shiprocket] Success Response Body (Raw):', responseText);
    
    const data: ShiprocketAuthResponse = JSON.parse(responseText);
    console.log('[Shiprocket] Success Response Body (Parsed):', JSON.stringify(data, null, 2));

    // Validate response has token
    if (!data.token) {
      authCache = null;
      throw new Error('Shiprocket authentication response missing token');
    }

    // Cache token (valid for 240 hours)
    authCache = {
      token: data.token,
      expiresAt: Date.now() + 240 * 60 * 60 * 1000, // 240 hours
    };

    console.log('[Shiprocket] Authentication successful! Token received (length:', data.token.length, ')');
    console.log('='.repeat(80));

    return data.token;
  } catch (error: any) {
    // Clear cache on any error
    authCache = null;
    
    // Don't wrap if it's already our formatted error
    if (error.message && error.message.includes('Shiprocket authentication failed')) {
      console.error('Error authenticating with Shiprocket:', error);
      throw error;
    }
    
    console.error('Error authenticating with Shiprocket:', error);
    throw new Error(
      `Failed to authenticate with Shiprocket: ${error.message || 'Unknown error'}`
    );
  }
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAuthToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Shiprocket API error: ${error.message || response.statusText || 'Unknown error'}`
    );
  }

  return response.json();
}

export interface ServiceabilityResponse {
  status: number;
  data: {
    available_courier_companies: Array<{
      courier_company_id: number;
      courier_name: string;
      estimated_delivery_days: string;
      rate: number;
      cod_charge: number;
      cod_multiplier: number;
      rating: number;
    }>;
  };
}

export interface CreateShipmentPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_pincode: string;
  shipping_state: string;
  shipping_country: string;
  shipping_email: string;
  shipping_phone: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface CreateShipmentResponse {
  status: number;
  order_id: number;
  shipment_id: number;
  status_code: string;
  onway_full_address: string;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

export interface AssignAWBResponse {
  status: number;
  message: string;
  response: {
    shipment_id: number;
    awb_code: string;
    courier_name: string;
  };
}

export interface TrackingResponse {
  tracking_data: {
    shipment_status: number;
    shipment_track: Array<{
      current_status: string;
      current_status_code: string;
      current_status_type: string;
      current_status_label: string;
      awb_code: string;
      shipment_type: string;
      edd: string;
      courier_name: string;
      etd: string;
      destination: string;
      origin: string;
      rto_address: string;
      rto_locality: string;
      rto_city: string;
      rto_state: string;
      rto_pincode: string;
      track: Array<{
        current_status: string;
        current_status_code: string;
        current_status_type: string;
        current_status_label: string;
        current_status_description: string;
        current_status_location: string;
        status_date: string;
      }>;
    }>;
  };
}

/**
 * Check serviceability for a pincode
 */
export async function checkServiceability(
  pincode: string,
  weight: number = 0.5 // default weight in kg
): Promise<ServiceabilityResponse> {
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '';
  
  if (!pickupPincode) {
    throw new Error('Pickup pincode not configured. Please set SHIPROCKET_PICKUP_PINCODE in environment variables.');
  }

  return apiRequest(
    `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&cod=1&weight=${weight}`
  );
}

/**
 * Create a shipment in Shiprocket
 */
export async function createShipment(
  payload: CreateShipmentPayload
): Promise<CreateShipmentResponse> {
  return apiRequest('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Assign AWB (Air Waybill) to a shipment
 */
export async function assignAWB(
  shipmentId: number,
  courierId?: number
): Promise<AssignAWBResponse> {
  const body: any = {
    shipment_id: shipmentId,
  };

  if (courierId) {
    body.courier_id = courierId;
  }

  return apiRequest('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Schedule pickup for a shipment
 */
export async function schedulePickup(
  shipmentId: number
): Promise<{ status: number; message: string }> {
  return apiRequest('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: [shipmentId],
    }),
  });
}

/**
 * Get tracking information for an AWB code
 */
export async function getTracking(awbCode: string): Promise<TrackingResponse> {
  return apiRequest(`/courier/track/awb/${awbCode}`);
}

/**
 * Generate shipping label PDF
 */
export async function generateLabel(shipmentId: number): Promise<{
  status: number;
  label_url: string;
}> {
  return apiRequest('/courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: [shipmentId],
    }),
  });
}

/**
 * Generate invoice PDF
 */
export async function generateInvoice(
  shipmentId: number
): Promise<{ status: number; invoice_url: string }> {
  return apiRequest('/orders/print/invoice', {
    method: 'POST',
    body: JSON.stringify({
      shipment_ids: [shipmentId],
    }),
  });
}

/**
 * Get pickup address from environment variables
 */
export function getPickupAddress() {
  return {
    name:
      process.env.SHIPROCKET_PICKUP_NAME ||
      process.env.SHIPROCKET_PICKUP_EMAIL ||
      'Store',
    email: process.env.SHIPROCKET_PICKUP_EMAIL || '',
    phone: process.env.SHIPROCKET_PICKUP_PHONE || '',
    street: process.env.SHIPROCKET_PICKUP_STREET || '',
    city: process.env.SHIPROCKET_PICKUP_CITY || '',
    state: process.env.SHIPROCKET_PICKUP_STATE || '',
    pincode: process.env.SHIPROCKET_PICKUP_PINCODE || '',
    country: process.env.SHIPROCKET_PICKUP_COUNTRY || 'India',
  };
}
