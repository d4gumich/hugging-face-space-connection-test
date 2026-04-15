<script>
    import { lighthouseResults, lighthouseActions } from '../lighthouseStore.js';
    import { fade, slide } from 'svelte/transition';

    let { extracted_text } = $props(); // Backward compatibility if needed
    
    // Use $derived for reactive values from stores in Svelte 5
    let results = $derived($lighthouseResults.analysis);
    let text = $derived($lighthouseResults.extractedText || extracted_text);

    async function triggerAnalysis() {
        if (text) {
            await lighthouseActions.analyzeText(text);
        }
    }
</script>

<div class="results-layout">
    {#if $lighthouseResults.loading}
        <div class="loading-overlay" in:fade>
            <div class="spinner"></div>
            <p>Lighthouse is scanning your profile...</p>
        </div>
    {/if}

    {#if text && !results}
        <div class="card analysis-trigger" in:fade>
            <h4>Text Extracted Successfully</h4>
            <p>Found {text.length} characters of content. Analysis is ready.</p>
            <button class="btn-primary" onclick={triggerAnalysis}>
                Run AI Analysis
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
                {#if results.recommendations}
                    <ul class="recommendations">
                        {#each results.recommendations as rec}
                            <li>{rec}</li>
                        {/each}
                    </ul>
                {:else}
                    <p>Profile looks solid!</p>
                {/if}
            </div>
        </div>
    {/if}

    {#if text && !results}
        <div class="card text-preview">
            <h3>Extracted Text Preview</h3>
            <div class="text-content">
                {text.substring(0, 1000)}{text.length > 1000 ? '...' : ''}
            </div>
        </div>
    {/if}

    {#if $lighthouseResults.error}
        <div class="card error-card" in:fade>
            <p class="error">{$lighthouseResults.error}</p>
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

    .text-content {
        font-size: 0.85rem;
        color: #555;
        white-space: pre-wrap;
        max-height: 300px;
        overflow-y: auto;
        background: #f9f9f9;
        padding: 1rem;
        border-radius: 4px;
    }

    .error-card {
        border-left: 4px solid var(--error-color);
        color: var(--error-color);
    }

    .analysis-trigger {
        text-align: center;
        border: 2px dashed var(--blue-color-main);
    }

    ul.recommendations {
        padding-left: 1.2rem;
    }
    
    ul.recommendations li {
        margin-bottom: 0.5rem;
    }
</style>
