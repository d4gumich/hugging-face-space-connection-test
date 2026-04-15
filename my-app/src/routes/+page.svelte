<script>
    import LighthouseResults from "$lib/components/lighthouse_results.svelte";
    import LighthouseControl from "$lib/components/LighthouseControl.svelte";
    import Console from "$lib/components/Console.svelte";
    import { lighthouseResults, lighthouseActions } from "$lib/lighthouseStore.js";
    import logo from "$lib/assets/D4G-Logo-2.png";

    let file = $state(null);
    let shouldSanitize = $state(false);

    function handleFileChange(event) {
        file = event.target.files[0];
    }

    async function handleUpload() {
        if (!file) {
            alert("Please select a PDF file first.");
            return;
        }
        try {
            await lighthouseActions.uploadPdf(file, shouldSanitize);
        } catch (err) {
            alert("Upload failed. Ensure the Lighthouse engine is RUNNING.");
        }
    }
</script>

<nav class="navbar">
    <div class="nav-content">
        <img src={logo} alt="Data4Good Logo" class="logo" />
        <div class="nav-titles">
            <h1>Lighthouse</h1>
            <p>AI-Powered Profile Analysis</p>
        </div>
    </div>
</nav>

<main class="container">
    <div class="dashboard-grid">
        <div class="sidebar">
            <LighthouseControl />
            
            <div class="card upload-card">
                <h3>Upload Document</h3>
                <p>Analyze your resume or portfolio PDF.</p>
                
                <div class="file-options">
                    <label class="checkbox-container">
                        <input type="checkbox" bind:checked={shouldSanitize} />
                        Sanitize PDF (Remove PII)
                    </label>
                </div>

                <div class="file-input-group">
                    <input 
                        type="file" 
                        id="pdf-upload"
                        accept="application/pdf" 
                        onchange={handleFileChange} 
                        class="file-input"
                    />
                    <label for="pdf-upload" class="file-label">
                        {file ? file.name : "Choose PDF..."}
                    </label>
                </div>
                <button 
                    class="btn-primary w-full" 
                    onclick={handleUpload}
                    disabled={!file || $lighthouseResults.loading}
                >
                    {$lighthouseResults.loading ? "Uploading..." : "Extract Text"}
                </button>
            </div>
        </div>

        <div class="main-content">
            <LighthouseResults />
        </div>
    </div>
</main>

<Console />

<style>
    .navbar {
        background-color: white;
        border-bottom: 1px solid var(--border-color);
        padding: 1rem 0;
        margin-bottom: 2rem;
    }

    .nav-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .logo {
        height: 50px;
        width: auto;
    }

    .nav-titles h1 {
        margin: 0;
        font-size: 1.5rem;
        line-height: 1;
    }

    .nav-titles p {
        margin: 0.2rem 0 0 0;
        font-size: 0.9rem;
        color: #666;
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: 350px 1fr;
        gap: 2rem;
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .upload-card h3 { margin-top: 0; }
    
    .file-options {
        margin: 1rem 0;
        padding: 0.5rem;
        background: #f9f9f9;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .checkbox-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .w-full { width: 100%; }

    .file-input-group {
        margin-bottom: 1rem;
    }

    .file-input {
        display: none;
    }

    .file-label {
        display: block;
        padding: 0.8rem;
        border: 2px dashed var(--border-color);
        border-radius: 4px;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.2s;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .file-label:hover {
        border-color: var(--blue-color-main);
    }

    @media (max-width: 900px) {
        .dashboard-grid {
            grid-template-columns: 1fr;
        }
        
        .nav-content {
            padding: 0 1rem;
        }
    }
</style>
