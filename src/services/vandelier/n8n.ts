import { BackendRow } from '@/types/vandelier';

// Fallback to the production n8n url if not specified in env
const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'https://n8n.vandelierai.com/webhook';

export const N8nService = {
  /**
   * Fetch data from the datatable webhook.
   */
  fetchDatatable: async (): Promise<BackendRow[]> => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/datatable`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Ensure we get fresh data
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch datatable from n8n: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in N8nService.fetchDatatable:', error);
      throw error;
    }
  },

  /**
   * Sync or update data with the datatable webhook.
   */
  updateDatatable: async (data: BackendRow | BackendRow[]): Promise<any> => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/datatable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload: data }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update datatable in n8n: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in N8nService.updateDatatable:', error);
      throw error;
    }
  },

  /**
   * Trigger or toggle the main n8n workflow.
   * Useful for the global system toggle switch mentioned in the spec.
   */
  toggleWorkflow: async (active: boolean): Promise<any> => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/n8n-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggle', active }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to toggle workflow in n8n: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in N8nService.toggleWorkflow:', error);
      throw error;
    }
  },

  /**
   * General-purpose webhook caller for extensibility.
   */
  callWebhook: async (endpoint: string, payload: any): Promise<any> => {
    try {
      // Remove leading slash if accidentally provided
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const response = await fetch(`${N8N_BASE_URL}/${cleanEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to call webhook ${endpoint}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error in N8nService.callWebhook (${endpoint}):`, error);
      throw error;
    }
  }
};
