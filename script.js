// Step 1: Simulate the Spreadsheet Data.
// In reality, this data would be *fetched* from your source.
const productDatabase = {
  "Organic Crew Neck T-shirt": {
    baseUnitPrice: 3.00,
    imageUrl: "https://github.com/jon-jon-101/custom-quote-form/blob/main/t-shirt-oat.png?raw=true", // Replace with your actual paths
    colorPremiums: { "1": 0, "2": 1.50, "3": 3.00 } // Price increases per color
  },
  "Organic Pullover Hoodie": {
    baseUnitPrice: 12.00,
    imageUrl: "https://github.com/jon-jon-101/custom-quote-form/blob/main/hoodie-stone.png?raw=true",
    colorPremiums: { "1": 0, "2": 2.50, "3": 5.00 }
    },
  "Organic Sweatshirt": {
    baseUnitPrice: 12.00,
    imageUrl: "https://github.com/jon-jon-101/custom-quote-form/blob/main/sweatshirt-navy.png?raw=true",
    colorPremiums: { "1": 0, "2": 2.50, "3": 5.00 }
    },
  "Organic Cotton Tote Bag": {
    baseUnitPrice: 12.00,
    imageUrl: "https://github.com/jon-jon-101/custom-quote-form/blob/main/tote-natural.png?raw=true",
    colorPremiums: { "1": 0, "2": 2.50, "3": 5.00 }
  }
};


// State: Track which products are currently in the form
let activeProductsOnForm = [];

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
function addProductItemToForm() {
  const clone = productTemplate.content.cloneNode(true);
  const productRowElement = clone.querySelector('.product-item');
  
  // 1. Create a unique ID based on the current time
  const uniqueId = Date.now(); 

  // 2. Find the radio buttons in this specific clone and give them a unique name
  const radios = productRowElement.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    radio.name = "color_group_" + uniqueId; 
  });

  // ... (the rest of your existing logic for dropdowns and listeners) ...
  
  productContainer.appendChild(productRowElement);
  activeProductsOnForm.push(productRowElement);
}

  // 3. Attach standard interaction handlers to this cloned item
  const quantityInput = productRowElement.querySelector('.quantity-input');
  const plusBtn = productRowElement.querySelector('.plus');
  const minusBtn = productRowElement.querySelector('.minus');

  plusBtn.addEventListener('click', () => { quantityInput.stepUp(); updateProductRowTotals(productRowElement); });
  minusBtn.addEventListener('click', () => { quantityInput.stepDown(); updateProductRowTotals(productRowElement); });
  quantityInput.addEventListener('input', () => updateProductRowTotals(productRowElement));
  
  select.addEventListener('change', () => updateProductRowTotals(productRowElement));
  
  const colorRadios = productRowElement.querySelectorAll('.color-count');
  colorRadios.forEach(radio => radio.addEventListener('change', () => updateProductRowTotals(productRowElement)));

  // 4. Set initial data
  updateProductRowTotals(productRowElement);

  // 5. Finally, append to the document
  productContainer.appendChild(productRowElement);
  
  // Track this dynamic element
  activeProductsOnForm.push(productRowElement);
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
  let totalProductsCount = 0;

  // Process each product from the form
  activeProductsOnForm.forEach(productRowElement => {
    const selectedProduct = productRowElement.querySelector('.product-selector').value;
    const quantity = parseInt(productRowElement.querySelector('.quantity-input').value) || 0;
    const colorCount = parseInt(productRowElement.querySelector('.color-count:checked').value);
    
    // Get database info
    const productData = productDatabase[selectedProduct];
    
    // Line item calculation
    const calculatedUnitPrice = productData.baseUnitPrice + productData.colorPremiums[colorCount];
    const lineTotal = calculatedUnitPrice * quantity;
    
    // Update grand total
    grandTotal += lineTotal;
    totalProductsCount += quantity;
    
    // Dynamic Quote Row Template (Hardcoded here for clarity)
    const quoteItemHTML = `
        <div class="quote-response-item">
            <img src="${productData.imageUrl}" class="product-image">
            <div class="item-meta">
                <h4>${selectedProduct}</h4>
                <div>${colorCount} colour print</div>
                <div>Unit price £${calculatedUnitPrice.toFixed(2)}</div>
                <div>Quantity x ${quantity}</div>
            </div>
            <div class="line-price">£${lineTotal.toFixed(2)}</div>
        </div>
        <div class="divider"></div>
    `;
    
    quoteItemsContainer.insertAdjacentHTML('beforeend', quoteItemHTML);
  });
  
  // Final summary update
  document.getElementById('total-price').innerText = `£${grandTotal.toFixed(2)}`;
}

// Add another product handler
addProductButton.addEventListener('click', addProductItemToForm);
