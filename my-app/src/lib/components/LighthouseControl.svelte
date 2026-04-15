<script>
    import { onMount, onDestroy } from 'svelte';
    import { lighthouseStatus, lighthouseActions } from '../lighthouseStore.js';

    let interval;

    onMount(() => {
        lighthouseActions.fetchStatus(true);
    });

    onDestroy(() => {
        // No interval to clear
    });

    function getStatusClass(stage) {
        if (stage === 'RUNNING') return 'status-active';
        if (stage === 'STOPPED' || stage === 'PAUSED') return 'status-inactive';
        if (stage === 'BUILDING' || stage === 'STARTING') return 'status-loading';
        return '';
    }
</script>

<div class="card">
    <div class="control-header">
        <h3>Lighthouse Engine</h3>
        <span class="status-badge {getStatusClass($lighthouseStatus.stage)}">
            {$lighthouseStatus.stage}
        </span>
    </div>
    
    <div class="status-details">
        <p><strong>Hardware:</strong> {$lighthouseStatus.hardware}</p>
        {#if $lighthouseStatus.message}
            <p class="message">{$lighthouseStatus.message}</p>
        {/if}
    </div>

    <div class="actions">
        <button 
            class="btn-primary" 
            onclick={lighthouseActions.wakeup}
            disabled={$lighthouseStatus.loading || $lighthouseStatus.stage === 'RUNNING'}
        >
            {$lighthouseStatus.loading ? 'Processing...' : 'Wake Up Space'}
        </button>
        
        <button 
            class="btn-accent" 
            onclick={lighthouseActions.pause}
            disabled={$lighthouseStatus.loading || $lighthouseStatus.stage === 'STOPPED'}
        >
            Pause Space
        </button>
        
        <button 
            class="btn-refresh" 
            onclick={() => lighthouseActions.fetchStatus(true)}
            disabled={$lighthouseStatus.loading || $lighthouseStatus.isRefreshing}
            title="Refresh Status"
        >
            <span class:spinning={$lighthouseStatus.isRefreshing}>↻</span>
        </button>
    </div>
</div>

<style>
    .control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    h3 { margin: 0; }

    .status-details {
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }

    .status-details p { margin: 0.2rem 0; }

    .message { color: #666; font-style: italic; }
    .error { color: var(--error-color); font-weight: 600; }

    .actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .btn-refresh {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-color-main);
        padding: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
    }

    .btn-refresh:hover:not(:disabled) {
        background: #f0f0f0;
    }

    .spinning {
        display: inline-block;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>
