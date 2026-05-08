// 1. Point to the file you just created on GitHub
const sheetUrl = "data.csv"; 

let pricingData = []; 
let activeProductsOnForm = [];

// DOM Elements
const productContainer = document.getElementById('product-container');
const productTemplate = document.getElementById('product-template');
const addProductButton = document.getElementById('addAnotherProduct');
const formView = document.getElementById('form-view');
const quoteView = document.getElementById('quote-view');
const mainForm = document.getElementById('quoteForm');

// 2. Simplified Loading Function
async function loadSheetData() {
    // No more proxies needed! Just a direct read.
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Filter and clean the data
            pricingData = results.data.filter(row => row.Product && row.Product.trim() !== "");
            
            // Clean prices of any leftover £ symbols just in case
            pricingData.forEach(row => {
                ['Color1Price', 'Color2Price', 'Color3Price'].forEach(key => {
                    if (row[key]) row[key] = row[key].replace(/[£,]/g, '');
                });
            });

            console.log("Data loaded successfully from GitHub!");
            initForm();
        },
        error: function(err) {
            console.error("Error reading data.csv:", err);
        }
    });
}

document.addEventListener('DOMContentLoaded', loadSheetData);

document.addEventListener('DOMContentLoaded', loadSheetData);

function initForm() {
    // Clear container to prevent double-loading
    productContainer.innerHTML = '';
    activeProductsOnForm = [];
    
    addProductItemToForm();
}

function addProductItemToForm() {
    const clone = productTemplate.content.cloneNode(true);
    const productRowElement = clone.querySelector('.product-item');
    
    const rowId = Date.now() + Math.random(); 
    const radios = productRowElement.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.name = "colors_" + rowId;
    });

    const select = productRowElement.querySelector('.product-selector');
    const uniqueProducts = [...new Set(pricingData.map(item => item.Product))];

    uniqueProducts.forEach(productName => {
        const option = document.createElement('option');
        option.value = productName;
        option.text = productName;
        select.appendChild(option);
    });

    const quantityInput = productRowElement.querySelector('.quantity-input');
    productRowElement.querySelector('.plus').addEventListener('click', () => { 
        quantityInput.stepUp(); 
        updateProductRowVisuals(productRowElement); 
    });
    productRowElement.querySelector('.minus').addEventListener('click', () => { 
        quantityInput.stepDown(); 
        updateProductRowVisuals(productRowElement);
    });

    select.addEventListener('change', () => {
        updateProductRowVisuals(productRowElement);
    });

    productContainer.appendChild(productRowElement);
    activeProductsOnForm.push(productRowElement);
    
    updateProductRowVisuals(productRowElement);

    const quantityInput = productRowElement.querySelector('.quantity-input');
const select = productRowElement.querySelector('.product-selector');
const radios = productRowElement.querySelectorAll('input[type="radio"]');

// 1. Listen for plus/minus clicks
productRowElement.querySelector('.plus').addEventListener('click', () => { 
    updateLiveUnitPrice(productRowElement); 
});
productRowElement.querySelector('.minus').addEventListener('click', () => { 
    updateLiveUnitPrice(productRowElement); 
});

// 2. Listen for typing in the quantity box
quantityInput.addEventListener('input', () => {
    updateLiveUnitPrice(productRowElement);
});

// 3. Listen for product changes
select.addEventListener('change', () => {
    updateLiveUnitPrice(productRowElement);
});

// 4. Listen for radio button (color) changes
radios.forEach(radio => {
    radio.addEventListener('change', () => {
        updateLiveUnitPrice(productRowElement);
    });
});

// Run once at start so it isn't £0.00 initially
updateLiveUnitPrice(productRowElement);

    
}

function updateProductRowVisuals(productRowElement) {
    const selectedProduct = productRowElement.querySelector('.product-selector').value;
    const productImage = productRowElement.querySelector('.product-image');
    
    const productInfo = pricingData.find(row => row.Product === selectedProduct);
    
    if (productInfo && productInfo.ImageURL) {
        productImage.src = productInfo.ImageURL;
    }
}

// Add another product button
addProductButton.addEventListener('click', addProductItemToForm);

// SUBMIT LOGIC
mainForm.addEventListener('submit', (e) => {
    e.preventDefault();
    generateQuoteResponse();
    
    formView.classList.remove('active-view');
    formView.classList.add('hidden-view');
    quoteView.classList.remove('hidden-view');
    quoteView.classList.add('active-view');
});

function generateQuoteResponse() {
    const quoteItemsContainer = document.getElementById('quote-items-container');
    quoteItemsContainer.innerHTML = ''; 
    let grandTotal = 0;

    activeProductsOnForm.forEach(productRowElement => {
        const selectedProduct = productRowElement.querySelector('.product-selector').value;
        const quantity = parseInt(productRowElement.querySelector('.quantity-input').value) || 0;
        
        const checkedRadio = productRowElement.querySelector('input[type="radio"]:checked');
        const colorCount = checkedRadio ? checkedRadio.value : "1";
        
        // Lookup logic for tiered pricing
        const bracket = pricingData.find(row => 
            row.Product === selectedProduct && 
            quantity >= parseInt(row.MinQty) && 
            quantity <= parseInt(row.MaxQty)
        );

        if (bracket) {
    // We use parseFloat to ensure the price is treated as a number for the math
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
        }
    });
    
    document.getElementById('total-price').innerText = `£${grandTotal.toFixed(2)}`;
}

function updateLiveUnitPrice(productRowElement) {
    const selectedProduct = productRowElement.querySelector('.product-selector').value;
    const quantity = parseInt(productRowElement.querySelector('.quantity-input').value) || 0;
    const checkedRadio = productRowElement.querySelector('input[type="radio"]:checked');
    const colorCount = checkedRadio ? checkedRadio.value : "1";
    const displayElement = productRowElement.querySelector('.unit-price-value');

    // Find the correct bracket in our data
    const bracket = pricingData.find(row => 
        row.Product === selectedProduct && 
        quantity >= parseInt(row.MinQty) && 
        quantity <= parseInt(row.MaxQty)
    );

    if (bracket && displayElement) {
        const unitPrice = parseFloat(bracket[`Color${colorCount}Price`]);
        displayElement.innerText = `£${unitPrice.toFixed(2)}`;
    } else {
        displayElement.innerText = "£0.00";
    }
}
