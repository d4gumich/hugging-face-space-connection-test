import { writable, get } from 'svelte/store';

const HOST_URL = 'http://127.0.0.1:8000';
const BASE_PATH = '/api/v1/products/lighthouse';

export const lighthouseStatus = writable({
    stage: 'UNKNOWN',
    hardware: 'UNKNOWN',
    message: '',
    loading: false,
    isRefreshing: false,
    error: null
});

export const lighthouseResults = writable({
    extractedText: null,
    analysis: null, // { extracted_skills, top_jobs, recommendations }
    isSanitized: false,
    loading: false,
    error: null
});

async function apiRequest(path, options = {}) {
    try {
        const response = await fetch(`${HOST_URL}${BASE_PATH}${path}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error(`API Request failed: ${path}`, err);
        throw err;
    }
}

export const lighthouseActions = {
    async fetchStatus(isSilent = false) {
        if (isSilent) {
            lighthouseStatus.update(s => ({ ...s, isRefreshing: true }));
        } else {
            lighthouseStatus.update(s => ({ ...s, loading: true }));
        }
        
        try {
            const status = await apiRequest('/status');
            lighthouseStatus.set({ 
                ...status, 
                loading: false, 
                isRefreshing: false, 
                error: null 
            });
            return status;
        } catch (err) {
            lighthouseStatus.update(s => ({ 
                ...s, 
                loading: false, 
                isRefreshing: false, 
                error: err.message 
            }));
        }
    },

    async wakeup() {
        lighthouseStatus.update(s => ({ ...s, loading: true }));
        try {
            const status = await apiRequest('/wakeup', { method: 'POST' });
            lighthouseStatus.set({ ...status, loading: false, error: null });
            return status;
        } catch (err) {
            lighthouseStatus.update(s => ({ ...s, loading: false, error: err.message }));
        }
    },

    async pause() {
        lighthouseStatus.update(s => ({ ...s, loading: true }));
        try {
            const status = await apiRequest('/pause', { method: 'POST' });
            lighthouseStatus.set({ ...status, loading: false, error: null });
            return status;
        } catch (err) {
            lighthouseStatus.update(s => ({ ...s, loading: false, error: err.message }));
        }
    },

    async uploadPdf(file, sanitize = false) {
        lighthouseResults.update(r => ({ ...r, loading: true, error: null, isSanitized: false }));
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sanitize', sanitize);

        try {
            const result = await apiRequest('/parse-pdf', {
                method: 'POST',
                body: formData
            });
            lighthouseResults.update(r => ({ 
                ...r, 
                extractedText: result.extracted_text, 
                isSanitized: sanitize,
                loading: false 
            }));
            return result;
        } catch (err) {
            lighthouseResults.update(r => ({ ...r, loading: false, error: err.message }));
            throw err;
        }
    },

    async analyzeText(text, sanitize = false) {
        lighthouseResults.update(r => ({ ...r, loading: true, error: null }));
        try {
            const result = await apiRequest('/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_text: text, sanitize })
            });
            lighthouseResults.update(r => ({ 
                ...r, 
                analysis: result, 
                isSanitized: sanitize || get(lighthouseResults).isSanitized,
                loading: false 
            }));
            return result;
        } catch (err) {
            lighthouseResults.update(r => ({ ...r, loading: false, error: err.message }));
            throw err;
        }
    }
};
