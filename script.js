// 1. Point to the file on GitHub
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

// Load data first
async function loadSheetData() {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Clean and filter the data
            pricingData = results.data.filter(row => row.Product && row.Product.trim() !== "");
            
            // Clean prices of symbols
            pricingData.forEach(row => {
                ['Color1Price', 'Color2Price', 'Color3Price', 'Color4Price', 'Color5Price', 'Color6Price', 'ColorFullPrice'].forEach(key => {
                    if (row[key]) row[key] = row[key].replace(/[£,]/g, '');
                });
            });

            console.log("Data loaded successfully!");
            initForm();
        }
    });
}

document.addEventListener('DOMContentLoaded', loadSheetData);

function initForm() {
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
        // Add listener to radios for live price update
        radio.addEventListener('change', () => updateLiveUnitPrice(productRowElement));
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
        updateLiveUnitPrice(productRowElement);
        updateProductRowVisuals(productRowElement);
    });
    
    productRowElement.querySelector('.minus').addEventListener('click', () => { 
        quantityInput.stepDown(); 
        updateLiveUnitPrice(productRowElement);
        updateProductRowVisuals(productRowElement);
    });

    quantityInput.addEventListener('input', () => updateLiveUnitPrice(productRowElement));

    select.addEventListener('change', () => {
        updateProductRowVisuals(productRowElement);
        updateLiveUnitPrice(productRowElement);
    });

    productContainer.appendChild(productRowElement);
    activeProductsOnForm.push(productRowElement);
    
    updateProductRowVisuals(productRowElement);
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

function updateLiveUnitPrice(productRowElement) {
    const selectedProduct = productRowElement.querySelector('.product-selector').value;
    const quantity = parseInt(productRowElement.querySelector('.quantity-input').value) || 0;
    const checkedRadio = productRowElement.querySelector('input[type="radio"]:checked');
    const displayElement = productRowElement.querySelector('.unit-price-value');

    if (!checkedRadio || !displayElement) return;

    const colorValue = checkedRadio.value; // "1", "2", "Full", etc.
    const priceKey = colorValue === "Full" ? "ColorFullPrice" : `Color${colorValue}Price`;

    const bracket = pricingData.find(row => 
        row.Product === selectedProduct && 
        quantity >= parseInt(row.MinQty) && 
        quantity <= parseInt(row.MaxQty)
    );

    if (bracket && bracket[priceKey]) {
        const unitPrice = parseFloat(bracket[priceKey]);
        displayElement.innerText = `£${unitPrice.toFixed(2)}`;
    } else {
        displayElement.innerText = "£0.00";
    }
}

addProductButton.addEventListener('click', addProductItemToForm);

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
        const colorValue = checkedRadio ? checkedRadio.value : "1";
        const priceKey = colorValue === "Full" ? "ColorFullPrice" : `Color${colorValue}Price`;
        
        const bracket = pricingData.find(row => 
            row.Product === selectedProduct && 
            quantity >= parseInt(row.MinQty) && 
            quantity <= parseInt(row.MaxQty)
        );

        if (bracket && bracket[priceKey]) {
            const unitPrice = parseFloat(bracket[priceKey]);
            const lineTotal = unitPrice * quantity;
            grandTotal += lineTotal;

            const quoteItemHTML = `
                <div class="quote-response-item">
                    <img src="${bracket.ImageURL}" class="product-image" style="width: 80px;">
                    <div class="item-meta">
                        <h4>${selectedProduct}</h4>
                        <div>${colorValue === "Full" ? "Full Colour" : colorValue + " colour"} print</div>
                        <div>Unit price £${unitPrice.toFixed(2)} | Qty: ${quantity}</div>
                    </div>
                    <div class="line-price">£${lineTotal.toFixed(2)}</div>
                </div>
            `;
            quoteItemsContainer.insertAdjacentHTML('beforeend', quoteItemHTML);
        }
    });
    document.getElementById('total-price').innerText = `£${grandTotal.toFixed(2)}`;
}
