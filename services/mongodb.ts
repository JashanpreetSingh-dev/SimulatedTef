
/**
 * MongoDB Atlas Data API Service
 * This allows direct communication with MongoDB Atlas via HTTPS.
 * Required Env Variables: 
 * - MONGODB_DATA_API_KEY
 * - MONGODB_APP_ID
 * - MONGODB_ENDPOINT (e.g., https://data.mongodb-api.com/app/...)
 */

const API_KEY = process.env.MONGODB_DATA_API_KEY || '';
const APP_ID = process.env.MONGODB_APP_ID || '';
const ENDPOINT = process.env.MONGODB_ENDPOINT || '';
const CLUSTER = 'Cluster0'; // Update with your cluster name
const DATABASE = 'tef_master';

export const mongoDBService = {
  isConfigured(): boolean {
    const configured = !!API_KEY && !!APP_ID && !!ENDPOINT;
    if (!configured) {
      console.debug('MongoDB not configured - missing env vars');
    }
    return configured;
  },

  async request(action: string, collection: string, body: any) {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(`${ENDPOINT}/action/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Request-Headers': '*',
          'api-key': API_KEY,
        },
        body: JSON.stringify({
          dataSource: CLUSTER,
          database: DATABASE,
          collection: collection,
          ...body
        }),
      });

      if (!response.ok) {
        throw new Error(`MongoDB API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MongoDB Request Failed:', error);
      return null;
    }
  },

  async findOne(collection: string, filter: any) {
    return this.request('findOne', collection, { filter });
  },

  async findMany(collection: string, filter: any, sort: any = { timestamp: -1 }) {
    return this.request('find', collection, { filter, sort });
  },

  async insertOne(collection: string, document: any) {
    return this.request('insertOne', collection, { document });
  },

  async updateOne(collection: string, filter: any, update: any) {
    return this.request('updateOne', collection, { filter, update });
  },

  async deleteOne(collection: string, filter: any) {
    return this.request('deleteOne', collection, { filter });
  }
};
