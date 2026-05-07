// 1. The link to your published Google Sheet CSV
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS1oZIfz6jaKnthfkeFwrEHNbipyntQYgHBWaiJ3Sk_bKdelfdyCQY2pxiElWd_wwe6iYlRDmGvuzQ/pubhtml";

// 2. This starts as an empty list and gets filled by the spreadsheet
let pricingData = []; 

// State: Track which products are currently in the form
let activeProductsOnForm = [];

// This function downloads the spreadsheet and then starts the form
async function loadSheetData() {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: function(results) {
            // Store the spreadsheet data in our pricingData variable
            pricingData = results.data.filter(row => row.Product);
            
            // Now that we have the data, we can build the form
            initForm();
        }
    });
}

// Tell the browser to start loading the sheet as soon as the page opens
document.addEventListener('DOMContentLoaded', loadSheetData);

// DOM Elements
const productContainer = document.getElementById('product-container');
const productTemplate = document.getElementById('product-template');
const addProductButton = document.getElementById('addAnotherProduct');
const formView = document.getElementById('form-view');
const quoteView = document.getElementById('quote-view');
const mainForm = document.getElementById('quoteForm');

// Initialize the form with one product
document.addEventListener('DOMContentLoaded', initForm);

function initForm() {
  addProductItemToForm(); // Start with one row
  updateOverallFormTotals(); // Initial calc
}

// Function to add a single dynamic product item
function addProductItemToForm() {
    const clone = productTemplate.content.cloneNode(true);
    const productRowElement = clone.querySelector('.product-item');
    
    // 1. Give this specific row a unique ID for the radio buttons
    const rowId = Date.now() + Math.random(); 
    const radios = productRowElement.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.name = "colors_" + rowId;
    });

    // 2. Populate the product dropdown with UNIQUE names from the spreadsheet
    const select = productRowElement.querySelector('.product-selector');
    const uniqueProducts = [...new Set(pricingData.map(item => item.Product))];

    uniqueProducts.forEach(productName => {
        const option = document.createElement('option');
        option.value = productName;
        option.text = productName;
        select.appendChild(option);
    });

    // 3. Attach quantity button listeners
    const quantityInput = productRowElement.querySelector('.quantity-input');
    productRowElement.querySelector('.plus').addEventListener('click', () => { 
        quantityInput.stepUp(); 
        updateProductRowVisuals(productRowElement); // Update image/price if needed
    });
    productRowElement.querySelector('.minus').addEventListener('click', () => { 
        quantityInput.stepDown(); 
        updateProductRowVisuals(productRowElement);
    });

    // 4. Update the image immediately when the dropdown changes
    select.addEventListener('change', () => {
        updateProductRowVisuals(productRowElement);
    });

    // 5. Add to the page
    productContainer.appendChild(productRowElement);
    activeProductsOnForm.push(productRowElement);
    
    // Set initial image for this new row
    updateProductRowVisuals(productRowElement);
}

// --- Dynamic Calculation Core Logic ---

// Function to update the unit price/image for one specific product row
function updateProductRowTotals(productRowElement) {
  const selectedProduct = productRowElement.querySelector('.product-selector').value;
  const quantity = parseInt(productRowElement.querySelector('.quantity-input').value) || 0;
  
  // Find which radio is checked
  const colorCount = parseInt(productRowElement.querySelector('.color-count:checked').value);
  
  // Get data from the 'spreadsheet'
  const productData = productDatabase[selectedProduct];

  // Update UI: image and text
  productRowElement.querySelector('.product-image').src = productData.imageUrl;

  // Real-time calculation logic: Base + Color cost
  // You might want to display this unit price in the form too!
  // const calculatedUnitPrice = productData.baseUnitPrice + productData.colorPremiums[colorCount];
}

// Function to sum all active products and generate final numbers
function updateOverallFormTotals() {
  // You could implement live 'Estimated Total' here
}

// --- Main Form Submission & View Switching ---

mainForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Stop page reload
  
  generateQuoteResponse();
  
  // Flip the view
  formView.classList.remove('active-view');
  formView.classList.add('hidden-view');
  
  quoteView.classList.remove('hidden-view');
  quoteView.classList.add('active-view');
});

function generateQuoteResponse() {
    const quoteItemsContainer = document.getElementById('quote-items-container');
    quoteItemsContainer.innerHTML = ''; // Clear previous
    
    let grandTotal = 0;

    activeProductsOnForm.forEach(productRowElement => {
        const selectedProduct = productRowElement.querySelector('.product-selector').value;
        const quantity = parseInt(productRowElement.querySelector('.quantity-input').value) || 0;
        
        // Find the checked radio button specifically in this row
        const checkedRadio = productRowElement.querySelector('input[type="radio"]:checked');
        const colorCount = checkedRadio ? checkedRadio.value : "1";
        
        // --- STEP 4 LOGIC STARTS HERE ---
        // Find the correct row in your spreadsheet based on Product + Quantity
        const bracket = pricingData.find(row => 
            row.Product === selectedProduct && 
            quantity >= parseInt(row.MinQty) && 
            quantity <= parseInt(row.MaxQty)
        );

        // If we found a match in the spreadsheet, calculate the price
        if (bracket) {
            const unitPrice = parseFloat(bracket[`Color${colorCount}Price`]);
            const lineTotal = unitPrice * quantity;
            grandTotal += lineTotal;

            const quoteItemHTML = `
                <div class="quote-response-item">
                    <img src="${bracket.ImageURL}" class="product-image" style="width: 100px;">
                    <div class="item-meta">
                        <h4>${selectedProduct}</h4>
                        <div>${colorCount} colour print</div>
                        <div>Unit price £${unitPrice.toFixed(2)}</div>
                        <div>Quantity x ${quantity}</div>
                    </div>
                    <div class="line-price">£${lineTotal.toFixed(2)}</div>
                </div>
                <div class="divider"></div>
            `;
            quoteItemsContainer.insertAdjacentHTML('beforeend', quoteItemHTML);
        } else {
            console.error("No price bracket found for:", selectedProduct, "at quantity:", quantity);
        }
    });
    
    // Update the final total display
    document.getElementById('total-price').innerText = `£${grandTotal.toFixed(2)}`;
}
  
  // Final summary update
  document.getElementById('total-price').innerText = `£${grandTotal.toFixed(2)}`;
}

// Add another product handler
addProductButton.addEventListener('click', addProductItemToForm);

function updateProductRowVisuals(productRowElement) {
    const selectedProduct = productRowElement.querySelector('.product-selector').value;
    const productImage = productRowElement.querySelector('.product-image');
    
    // Find the first row in the spreadsheet that matches this product to get the image
    const productInfo = pricingData.find(row => row.Product === selectedProduct);
    
    if (productInfo && productInfo.ImageURL) {
        productImage.src = productInfo.ImageURL;
    }
}
