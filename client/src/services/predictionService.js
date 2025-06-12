import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const predictionService = {
    trainModel: async (symbol) => {
        try {
            const response = await axios.post(`${API_URL}/train`, { symbol });
            return response.data;
        } catch (error) {
            console.error('Error training model:', error);
            throw error;
        }
    },

    getPrediction: async (symbol) => {
        try {
            const response = await axios.get(`${API_URL}/predict?symbol=${symbol}`);
            return response.data;
        } catch (error) {
            console.error('Error getting prediction:', error);
            throw error;
        }
    },

    getHistoricalAccuracy: async (symbol) => {
        try {
            const response = await axios.get(`${API_URL}/accuracy?symbol=${symbol}`);
            return response.data;
        } catch (error) {
            console.error('Error getting historical accuracy:', error);
            throw error;
        }
    }
};