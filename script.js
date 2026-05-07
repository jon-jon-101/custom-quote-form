// 1. URL FIX: Ensure this ends with output=csv so PapaParse can read it!
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS1oZIfz6jaKnthfkeFwrEHNbipyntQYgHBWaiJ3Sk_bKdelfdyCQY2pxiElWd_wwe6iYlRDmGvuzQ/pub?output=csv";

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
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: function(results) {
            pricingData = results.data.filter(row => row.Product);
            console.log("Data loaded:", pricingData); // Useful for debugging
            initForm();
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
