import { writable, get } from 'svelte/store';

const HOST_URL = 'http://127.0.0.1:8000';
const BASE_PATH = '/api/v1/products/lighthouse';

export const lighthouseStatus = writable({
    stage: 'UNKNOWN',
    hardware: 'UNKNOWN',
    message: '',
    loading: false,
    isRefreshing: false,
    requestedHardware: null, // Tracks pending hardware changes
    error: null
});

export const lighthouseResults = writable({
    extractedText: null,
    sections: [], // Array of { title: string, content: string, selected: boolean }
    analysis: null, // { extracted_skills, top_jobs, recommendations }
    isSanitized: false,
    loading: false,
    error: null
});

function formatError(err) {
    const message = err.message || String(err);
    const isHFError = message.includes('MaxRetryError') || 
                     message.includes('502') || 
                     message.includes('Bad Gateway') || 
                     message.includes('HTTPSConnectionPool') ||
                     message.includes('ProxyError');
    
    if (isHFError) {
        return `Hugging Face Service Error: The engine is currently unreachable (Bad Gateway/Max Retries). This usually happens during a cold start or high load. Please wait 1-2 minutes and try again. Original error: ${message}`;
    }
    return message;
}

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
            lighthouseStatus.update(s => {
                // Clear requestedHardware once the backend reports a valid hardware string 
                // that isn't NULL or UNKNOWN
                const isHardwareReady = status.hardware && 
                                      status.hardware !== 'UNKNOWN' && 
                                      status.hardware !== 'NULL' && 
                                      status.hardware !== 'None';
                
                return {
                    ...status,
                    loading: false,
                    isRefreshing: false,
                    requestedHardware: isHardwareReady ? null : s.requestedHardware,
                    error: null
                };
            });
            return status;
        } catch (err) {
            lighthouseStatus.update(s => ({ 
                ...s, 
                loading: false, 
                isRefreshing: false, 
                error: formatError(err)
            }));
        }
    },

    async wakeup() {
        lighthouseStatus.update(s => ({ ...s, loading: true, requestedHardware: 'T4 Small' }));
        try {
            const status = await apiRequest('/wakeup', { method: 'POST' });
            // Don't immediately clear requestedHardware here, let fetchStatus do it 
            // when the hardware actually shows up in the metadata
            lighthouseStatus.update(s => ({ 
                ...status, 
                loading: false, 
                requestedHardware: s.requestedHardware 
            }));
            return status;
        } catch (err) {
            lighthouseStatus.update(s => ({ 
                ...s, 
                loading: false, 
                error: formatError(err),
                requestedHardware: null 
            }));
        }
    },

    async pause() {
        lighthouseStatus.update(s => ({ ...s, loading: true }));
        try {
            const status = await apiRequest('/pause', { method: 'POST' });
            lighthouseStatus.set({ 
                ...status, 
                loading: false, 
                isRefreshing: false, 
                requestedHardware: null, 
                error: null 
            });
            return status;
        } catch (err) {
            lighthouseStatus.update(s => ({ 
                ...s, 
                loading: false, 
                error: formatError(err)
            }));
        }
    },

    async uploadPdf(file, sanitize = false) {
        lighthouseResults.update(r => ({ ...r, loading: true, error: null, isSanitized: false, sections: [] }));
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sanitize', sanitize);

        try {
            const result = await apiRequest('/parse-pdf', {
                method: 'POST',
                body: formData
            });
            
            const rawText = result.extracted_text;
            const sections = this.splitIntoSections(rawText);

            lighthouseResults.update(r => ({ 
                ...r, 
                extractedText: rawText,
                sections: sections,
                isSanitized: sanitize,
                loading: false 
            }));
            return result;
        } catch (err) {
            lighthouseResults.update(r => ({ ...r, loading: false, error: formatError(err) }));
            throw err;
        }
    },

    splitIntoSections(text) {
        if (!text) return [];
        
        // Regex to identify common resume headers
        const headerPattern = /^([A-Z][A-Z\s]{2,20}|Professional Summary|Work Experience|Employment History|Technical Skills|Academic Background|Core Competencies|Education|Skills|Projects|Certifications|Awards|Summary|Experience):?\s*$/gm;
        
        const sections = [];
        let match;
        const matches = [];
        
        // Reset lastIndex for the regex
        headerPattern.lastIndex = 0;
        
        while ((match = headerPattern.exec(text)) !== null) {
            matches.push({
                index: match.index,
                title: match[1].trim(),
                length: match[0].length
            });
        }

        if (matches.length === 0) {
            return [{ title: 'Main Content', content: text, selected: true }];
        }

        // Handle text before the first header (usually contact info/header)
        if (matches[0].index > 0) {
            sections.push({
                title: 'Header / Contact',
                content: text.substring(0, matches[0].index).trim(),
                selected: true
            });
        }

        for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index + matches[i].length;
            const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
            sections.push({
                title: matches[i].title,
                content: text.substring(start, end).trim(),
                selected: true
            });
        }

        return sections.filter(s => s.content.length > 0);
    },

    toggleSection(index) {
        lighthouseResults.update(r => {
            const newSections = [...r.sections];
            if (newSections[index]) {
                newSections[index] = { ...newSections[index], selected: !newSections[index].selected };
            }
            return { ...r, sections: newSections };
        });
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
            lighthouseResults.update(r => ({ ...r, loading: false, error: formatError(err) }));
            throw err;
        }
    }
};
