<script>
    import LighthouseResults from "../lib/components/lighthouse_results.svelte";

    // Change host_url based on where backend is running (i.e. local vs pythonanywhere)
    const host_url = 'http://127.0.0.1:8000/';
    const base_path = 'api/v1/products/';
    // If needed, update the below lighthouse path depending on what backend API will
    // be exposed for ingesting pdf
    const lighthouse_path = 'lighthouse/parse-pdf';
    const url = host_url + base_path + lighthouse_path;
    let file = null;
    // status_active is hard coded in the meantime (still deciding backend workflow)
    let status_active = true;
    let extracted_texts = $state(null);

    // Handle file selection
    function handleFileChange(event) {
        file = event.target.files[0];
    }

    // Send PDF to backend as formdata 
    async function uploadPDF() {
        if (!file) {
            alert("Please select a PDF file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Next steps for team: 
            // 1) (Suggested) Add hugging face space status check incorporated
            // as part of the backend work flow automatically (the user ONLY has to upload file 
            // and receive results as opposed to them having to click a separate button to wake the space)
            // 2) Receive and display information through svelte component 
            // 3) Add visualization that articulates steps to user with waiting wheel 
            // 4) Add this frontend code to official site 

            const result = await response.json();
            alert(`Upload successful: ${result.extracted_text}`);
            extracted_texts = result.extracted_text;
            console.log(extracted_texts);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload PDF.");
        }
    }
</script>

<div>
    <h1>Testing Lighthouse Frontend</h1>
    <input type="file" accept="application/pdf" onchange={handleFileChange} />
    <button onclick={uploadPDF}>Upload PDF</button>
</div>

<div class="results-container">
            {#if status_active}
                {#if extracted_texts}
                    <div class="output-container">
                        <div class="output">
                                <LighthouseResults extracted_text={extracted_texts}/>
                        </div>
                    </div>
                    {/if}
            {:else}
                <p>
                    <strong>The Hugging Face Space is inactive</strong>
                </p>
            {/if}
    </div>
<!-- Depending on the backend workflow the below code will need to change for
the results to display -->


