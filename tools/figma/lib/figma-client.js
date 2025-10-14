import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const FIGMA_API_BASE = 'https://api.figma.com/v1';

class FigmaClient {
  constructor() {
    this.accessToken = process.env.FIGMA_ACCESS_TOKEN;
    this.fileId = process.env.FIGMA_FILE_ID;

    if (!this.accessToken) {
      throw new Error('FIGMA_ACCESS_TOKEN is required in .env file');
    }

    if (!this.fileId) {
      throw new Error('FIGMA_FILE_ID is required in .env file');
    }

    this.client = axios.create({
      baseURL: FIGMA_API_BASE,
      headers: {
        'X-Figma-Token': this.accessToken,
      },
    });
  }

  /**
   * Get file data including all nodes
   */
  async getFile(nodeIds = []) {
    try {
      const params = nodeIds.length > 0 ? { ids: nodeIds.join(',') } : {};
      const response = await this.client.get(`/files/${this.fileId}`, { params });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get file styles (colors, text styles, etc.)
   */
  async getFileStyles() {
    try {
      const response = await this.client.get(`/files/${this.fileId}/styles`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get specific style details
   */
  async getStyle(styleKey) {
    try {
      const response = await this.client.get(`/styles/${styleKey}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get file components
   */
  async getFileComponents() {
    try {
      const response = await this.client.get(`/files/${this.fileId}/components`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get image URLs for specific nodes
   */
  async getImages(nodeIds, options = {}) {
    try {
      const params = {
        ids: nodeIds.join(','),
        format: options.format || 'png',
        scale: options.scale || 2,
        ...options,
      };
      const response = await this.client.get(`/images/${this.fileId}`, { params });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Download image from URL
   */
  async downloadImage(url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Extract colors from paint fills
   */
  extractColor(paint) {
    if (!paint || paint.type !== 'SOLID') return null;
    
    const { r, g, b, a = 1 } = paint.color;
    const toHex = (value) => Math.round(value * 255).toString(16).padStart(2, '0');
    
    if (a === 1) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  }

  /**
   * Traverse node tree
   */
  traverseNodes(node, callback, depth = 0) {
    callback(node, depth);
    
    if (node.children) {
      node.children.forEach(child => {
        this.traverseNodes(child, callback, depth + 1);
      });
    }
  }

  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 403) {
        return new Error('Invalid Figma access token. Please check your FIGMA_ACCESS_TOKEN in .env');
      }
      if (status === 404) {
        return new Error('Figma file not found. Please check your FIGMA_FILE_ID in .env');
      }
      
      return new Error(`Figma API error (${status}): ${data.message || JSON.stringify(data)}`);
    }
    
    return error;
  }
}

export default FigmaClient;
