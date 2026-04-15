<script>
    import { lighthouseResults, lighthouseActions, lighthouseStatus } from '../lighthouseStore.js';
    import { fade, slide } from 'svelte/transition';

    let { extracted_text } = $props(); // Backward compatibility if needed
    
    // Use $derived for reactive values from stores in Svelte 5
    let results = $derived($lighthouseResults.analysis);
    let sections = $derived($lighthouseResults.sections);
    let isSanitized = $derived($lighthouseResults.isSanitized);
    let isEngineRunning = $derived($lighthouseStatus.stage === 'RUNNING');

    // Filter text based on selected sections
    let selectedText = $derived(
        sections
            .filter(s => s.selected)
            .map(s => s.content)
            .join('\n\n')
    );

    async function triggerAnalysis() {
        if (selectedText) {
            await lighthouseActions.analyzeText(selectedText);
        }
    }

    function highlightRedacted(content) {
        if (!content) return "";
        // Escape HTML for security
        let escaped = content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        
        // Highlight anything in brackets like [NAME], [LOCATION]
        const placeholders = /\[(NAME|LOCATION|EMAIL|PHONE|POSTAL_CODE|IP_ADDRESS|URL|SOCIAL_LINK|PERSON|GPE|LOC|FAC)\]/g;
        return escaped.replace(placeholders, '<span class="pii-highlight">$&</span>');
    }

    const sectionColors = [
        '#e3b878', // button-color (gold)
        '#1b3350', // blue-color-main
        '#afb6a6', // button-color-green
        '#388e3c', // success-color
        '#f57c00', // warning-color
        '#d32f2f'  // error-color
    ];

    function getSectionBorder(index) {
        return sectionColors[index % sectionColors.length];
    }
</script>

<div class="results-layout">
    {#if $lighthouseResults.loading}
        <div class="loading-overlay" in:fade>
            <div class="spinner"></div>
            <p>Lighthouse is scanning your profile...</p>
        </div>
    {/if}

    {#if sections.length > 0 && !results}
        <div class="card analysis-trigger" in:fade>
            <h4>Analysis Readiness</h4>
            <p>
                Selected {sections.filter(s => s.selected).length} of {sections.length} sections 
                ({selectedText.length} characters).
            </p>
            {#if !isEngineRunning}
                <p class="warning-text">Lighthouse engine must be RUNNING to perform AI analysis.</p>
            {/if}
            <button 
                class="btn-primary" 
                onclick={triggerAnalysis}
                disabled={!isEngineRunning || $lighthouseResults.loading || selectedText.length === 0}
            >
                {isEngineRunning ? 'Run AI Analysis' : 'Engine Inactive'}
            </button>
        </div>
    {/if}

    {#if results}
        <div class="analysis-grid" in:slide>
            <div class="card skills-card">
                <h3>Extracted Skills</h3>
                <div class="skills-list">
                    {#if results.extracted_skills}
                        {#each results.extracted_skills as skill}
                            <span class="skill-tag">{skill}</span>
                        {/each}
                    {:else}
                        <p>No specific skills identified.</p>
                    {/if}
                </div>
            </div>

            <div class="card jobs-card">
                <h3>Top Job Matches</h3>
                <div class="jobs-list">
                    {#if results.top_jobs}
                        {#each results.top_jobs as job}
                            <div class="job-item">
                                <strong>{job.title}</strong>
                                <span class="score">Match: {Math.round(job.score * 100)}%</span>
                            </div>
                        {/each}
                    {:else}
                        <p>No direct matches found.</p>
                    {/if}
                </div>
            </div>

            <div class="card recommendations-card">
                <h3>Recommendations</h3>
                {#if results.recommendations && results.recommendations.length > 0}
                    <ul class="recommendations">
                        {#each results.recommendations as rec}
                            <li>{@html rec}</li>
                        {/each}
                    </ul>
                {:else}
                    <p>Profile looks solid!</p>
                {/if}
            </div>

            <button class="btn-accent w-full" onclick={() => lighthouseResults.update(r => ({...r, analysis: null}))}>
                Back to Document
            </button>
        </div>
    {/if}

    {#if sections.length > 0 && !results}
        <div class="card text-preview">
            <div class="preview-header">
                <h3>Document Partitions</h3>
                <p class="instruction">Select the sections you want to include in the AI analysis.</p>
                {#if isSanitized}
                    <span class="sanitized-badge">Sanitized</span>
                {/if}
            </div>
            
            <div class="sections-container">
                {#each sections as section, i}
                    <div 
                        class="section-block" 
                        class:unselected={!section.selected}
                        style="border-left: 4px solid {getSectionBorder(i)}"
                    >
                        <div class="section-header">
                            <label class="checkbox-container">
                                <input 
                                    type="checkbox" 
                                    checked={section.selected} 
                                    onchange={() => lighthouseActions.toggleSection(i)}
                                />
                                <span class="section-title">{section.title}</span>
                            </label>
                        </div>
                        <div class="section-content">
                            {@html highlightRedacted(section.content)}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .results-layout {
        position: relative;
        min-height: 200px;
    }

    .loading-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255,255,243,0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10;
        border-radius: 8px;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border-color);
        border-top: 4px solid var(--blue-color-main);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .skill-tag {
        background-color: var(--button-color-green);
        color: var(--text-color-main);
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .job-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
    }

    .score {
        color: var(--success-color);
        font-weight: 600;
        font-size: 0.9rem;
    }

    .sections-container {
        margin-top: 0.5rem;
    }

    .section-block {
        background: #fdfdfd;
        margin-bottom: 1rem;
        padding: 1rem;
        border-radius: 0 4px 4px 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: opacity 0.2s, filter 0.2s;
    }

    .section-block.unselected {
        opacity: 0.5;
        filter: grayscale(0.5);
    }

    .section-header {
        margin-bottom: 0.5rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.3rem;
    }

    .section-title {
        font-weight: 700;
        font-family: 'Outfit', sans-serif;
        text-transform: uppercase;
        font-size: 0.9rem;
        color: var(--blue-color-main);
    }

    .section-content {
        font-size: 0.85rem;
        color: #555;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
    }

    :global(.pii-highlight) {
        background-color: var(--button-color);
        color: var(--text-color-main);
        padding: 0 2px;
        border-radius: 2px;
        font-weight: 600;
    }

    .error-card {
        border-left: 4px solid var(--error-color);
        color: var(--error-color);
    }

    .analysis-trigger {
        text-align: center;
        border: 2px dashed var(--blue-color-main);
    }

    .warning-text {
        color: var(--warning-color);
        font-size: 0.85rem;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .preview-header {
        display: flex;
        flex-direction: column;
        margin-bottom: 1.5rem;
    }

    .preview-header h3 { margin: 0; }
    .instruction { font-size: 0.9rem; color: #666; margin: 0.2rem 0; }

    .sanitized-badge {
        align-self: flex-start;
        margin-top: 0.5rem;
        background: #fff3e0;
        color: #ef6c00;
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-weight: 700;
        text-transform: uppercase;
        border: 1px solid #ffe0b2;
    }

    .checkbox-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .w-full { width: 100%; }

    ul.recommendations {
        padding-left: 1.2rem;
    }
    
    ul.recommendations li {
        margin-bottom: 0.5rem;
    }
</style>
