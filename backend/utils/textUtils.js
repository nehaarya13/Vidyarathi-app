const pdf = require('pdf-parse');
const fs = require('fs'); // 🔥 Local file read karne ke liye must hai

/**
 * 1. Har page ka text alag-alag nikalne ke liye (Local File Version)
 * @param {string} filePath - Local path of the PDF (e.g., 'data/uploads/file.pdf')
 */
async function extractTextWithPages(filePath) {
    try {
        console.log("📂 Reading local file from:", filePath);

        // Check if file actually exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at path: ${filePath}`);
        }

        // Buffer mein file read karo (Axios ki zaroorat nahi hai)
        const dataBuffer = fs.readFileSync(filePath); 
        
        let pages = [];

        // pdf-parse options to capture text page by page
        let options = {
            pagerender: function(pageData) {
                return pageData.getTextContent().then(function(textContent) {
                    // Page ke saare text items ko join karna
                    let text = textContent.items.map(item => item.str).join(' ');
                    
                    // 🧼 CLEANING: Extra spaces aur non-readable characters saaf karna
                    let cleanedText = text
                        .replace(/\s+/g, ' ') // Multiple spaces ko single space mein badlo
                        .replace(/[^\x20-\x7E\t\n\r]/g, '') // Junk symbols hatao
                        .trim();

                    pages.push({
                        page: pageData.pageIndex + 1,
                        text: cleanedText
                    });
                    return cleanedText;
                });
            }
        };

        // PDF parsing start
        await pdf(dataBuffer, options);
        
        // Pages ko order mein sort karna (Async ki wajah se order bigad sakta hai)
        const sortedPages = pages.sort((a, b) => a.page - b.page); 
        
        console.log(`📄 Successfully extracted ${sortedPages.length} pages.`);
        return sortedPages;
        
    } catch (error) {
        console.error("❌ PDF Extraction Error:", error.message);
        throw error;
    }
}

/**
 * 2. Text ko AI ke liye chote pieces (Chunks) mein todne ke liye
 */
const createChunks = (text, maxLength = 800, overlap = 150) => {
    if (!text) return [];

    // Sentences mein todna taaki context cut na ho
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    const chunks = [];
    let currentChunk = "";

    for (let sentence of sentences) {
        // Agar current chunk limit cross kar raha hai toh save karo
        if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
            }
            
            // 🧠 Context Overlap: Agle chunk mein pichle 15 words carry forward karo
            const words = currentChunk.split(' ');
            currentChunk = words.slice(-15).join(' ') + " " + sentence;
        } else {
            currentChunk += " " + sentence;
        }
    }

    // Aakhri chunk add karo agar kuch bacha hai
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
};

module.exports = { extractTextWithPages, createChunks };