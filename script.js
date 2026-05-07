// 1. URL FIX: Ensure this ends with output=csv so PapaParse can read it!
const sheetUrl = "https://docs.google.com/spreadsheets/d/1XWk89YC9ghE1foClJ9529Lqh-fgBJ0Xx6rAIr6QINUQ/export?format=csv.";

let pricingData = []; 
let activeProductsOnForm = [];

// DOM Elements
const productContainer = document.getElementById('product-container');
const productTemplate = document.getElementById('product-template');
const addProductButton = document.getElementById('addAnotherProduct');
const formView = document.getElementById('form-view');
const quoteView = document.getElementById('quote-view');
const mainForm = document.getElementById('quoteForm');

// START: Load data first
async function loadSheetData() {
    // We use a different proxy approach that is often more stable for Google Sheets
    const directCsvUrl = sheetUrl; 
    
    Papa.parse(directCsvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Clean and filter the data
            pricingData = results.data.filter(row => row.Product && row.Product.trim() !== "");
            
            if (pricingData.length === 0) {
                console.error("Spreadsheet loaded but no products were found. Check your column headers!");
            } else {
                console.log("Success! Data loaded:", pricingData);
                initForm();
            }
        },
        error: function(err) {
            console.error("PapaParse failed to get the file. Trying Proxy fallback...");
            // Fallback to proxy if direct access fails
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directCsvUrl)}`;
            Papa.parse(proxyUrl, {
                download: true,
                header: true,
                complete: function(res) {
                    pricingData = res.data.filter(row => row.Product);
                    initForm();
                }
            });
        }
    });
}

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
