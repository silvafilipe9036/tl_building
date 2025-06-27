// API Service for TL Building System
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    this.token = localStorage.getItem('accessToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('accessToken');
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.post('/api/auth/login', credentials);
      if (response.success && response.data.accessToken) {
        this.setToken(response.data.accessToken);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.post('/api/auth/register', userData);
      if (response.success && response.data.accessToken) {
        this.setToken(response.data.accessToken);
      }
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getProfile() {
    return this.get('/api/auth/profile');
  }

  async refreshToken() {
    try {
      const response = await this.post('/api/auth/refresh');
      if (response.success && response.data.accessToken) {
        this.setToken(response.data.accessToken);
      }
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.setToken(null);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await this.get('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, message: 'Backend unavailable' };
    }
  }

  // Properties methods (for future implementation)
  async getProperties(params = {}) {
    return this.get('/api/properties', params);
  }

  async getProperty(id) {
    return this.get(`/api/properties/${id}`);
  }

  async createProperty(propertyData) {
    return this.post('/api/properties', propertyData);
  }

  async updateProperty(id, propertyData) {
    return this.put(`/api/properties/${id}`, propertyData);
  }

  async deleteProperty(id) {
    return this.delete(`/api/properties/${id}`);
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

// Export class for testing
export { ApiService };

