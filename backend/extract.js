const fs = require('fs');
const pdf = require('pdf-parse');

async function extractTextByPages(filePath) {
    const dataBuffer = fs.readFileSync(filePath);

    // Ye function har page ka text alag karega
    let options = {
        pagerender: function(pageData) {
            return pageData.getTextContent()
                .then(function(textContent) {
                    let lastY, text = '';
                    for (let item of textContent.items) {
                        if (lastY == item.transform[5] || !lastY){
                            text += item.str;
                        } else {
                            text += '\n' + item.str;
                        }
                        lastY = item.transform[5];
                    }
                    // Page separator marker add karna
                    return `---PAGE_SPLIT_${pageData.pageIndex + 1}---` + text;
                });
        }
    };

    const data = await pdf(dataBuffer, options);
    return data.text; // Isme ab page markers honge
}

// Example usage
extractTextByPages('data/uploads/jesc101.pdf').then(text => {
    // Ab aap is text ko split karke database mein sahi pageNumber ke saath save kar sakti hain
    console.log("Text extracted with page markers!");
});