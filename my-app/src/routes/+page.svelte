<script>
    const host_url = 'https://d4gumsi.pythonanywhere.com/';
    const endpoint = 'api/v2/products/lighthouse';
    const url = host_url + endpoint;
    let file = null;

    // Handle file selection
    function handleFileChange(event) {
        file = event.target.files[0];
    }

    // Send PDF to PythonAnywhere backend
    async function uploadPDF() {
        if (!file) {
            alert("Please select a PDF file first.");
            return;
        }

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            //TODO: 
            // 1) Determine what format is returned 
            // 2) Add a check for hugging face space status 
            // 3) Articulate steps to user with waiting wheel 

            const result = await response.json();
            alert(`Upload successful: ${result.filename}`);
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
