document.addEventListener('DOMContentLoaded', function () {
    setupProductForm();
});

function setupProductForm() {
    const productForm = document.querySelector('.shopify-product-form');
    if (productForm) {
        // Remove any existing listener to prevent duplicates
        productForm.removeEventListener('submit', handleFormSubmit);
        productForm.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(event) {
    event.preventDefault(); 
    
    const formItemId = document.querySelector('input[name="id"]').value;
    const bundleCard = document.querySelector('.bundle-product');
    

    // Check if bundle card is selected and add bundle variant to cart
    const bundleId = new Date().getTime();
    console.log('Bundle ID:', bundleId);

    let cartItems = { item: [] };

    if (bundleCard && bundleCard.hasAttribute('selected')) {
        const bundleVariantId = bundleCard.getAttribute('data-bundle-variant-id');
        if (bundleVariantId) {
            cartItems = {
                items: [
                    {
                        id: formItemId,
                        quantity: 1,
                        properties: { _bundleId : bundleId }
                    },
                    {
                        id: bundleVariantId,
                        quantity: 1,
                        properties: { _bundleId : bundleId }
                    }
                ]
            }
        }
    } else {
        cartItems = {
            items: [
                {
                    id: formItemId,
                    quantity: 1
                },
            ]
        };
    }

    fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItems)
    })
        .then(response => {
            return response.json();
        })
        .then(json_response => {
            console.log('Add to Cart Response:', json_response);
            window.location.href = '/cart';
        })
        .catch((error) => {
            console.error('Error:', error);
        });
};

let bundleSelectionState = {
    isSelected: false,
    variantId: null
};

class VariantPicker extends HTMLElement  {
    constructor() {
        super();
        
    }

    connectedCallback() {
        this.variantSelectors = this.querySelectorAll('input[type="radio"]');
        this.variantSelectors.forEach(selector => {
            selector.addEventListener('change', this.updateVariant.bind(this));
        });
    }

    updateVariant(event) {
        const selectedVariantId = event.currentTarget.value;
        const url = `${window.location.pathname}?variant=${selectedVariantId}&section_id=${this.dataset.sectionId}`;

        // Store current bundle selection state
        const currentBundleCard = document.querySelector('.bundle-product');
        const wasBundleSelected = currentBundleCard && currentBundleCard.hasAttribute('selected');

        fetch(url)
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                document.querySelector('product-page').innerHTML = tempDiv.querySelector('product-page').innerHTML;

                // Re-setup form listeners after content replacement
                setupProductForm();

                // Restore bundle selection state
                if (wasBundleSelected) {
                    const newBundleCard = document.querySelector('.bundle-product');
                    if (newBundleCard) {
                        newBundleCard.setAttribute('selected', '');
                        const bundleCardElement = document.querySelector('bundle-card');
                        if (bundleCardElement) {
                            bundleCardElement.toggleSelection();
                        }
                    }
                }
                const updatedURL = new URL(url, window.location.origin);
                updatedURL.searchParams.delete('section_id');
                window.history.replaceState(null, '', updatedURL);
            })
            .catch((error) => {
                console.error('Error fetching variant data:', error);
            });
    }
}

customElements.define('variant-picker', VariantPicker);


class BundleCard extends HTMLElement {
    constructor() {
        super();
        this.bundleCard = this.querySelector('.bundle-product');
        this.bundleItemPrice = this.querySelector('.bundle-product-value-price');
        this.addEventListener('click', this.toggleSelection.bind(this));
        this.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggleSelection();
        }
    }

    toggleSelection() {
        const mainProductPrice = document.querySelector('.product-price');
        const isSelected = this.bundleCard.hasAttribute('selected');
        const mainBundleDiscount = parseFloat(this.bundleCard.getAttribute('data-bundle-discount')) / 100 || 0.1;
        
        if (isSelected) {
            this.bundleCard.removeAttribute('selected');
            this.bundleCard.setAttribute('aria-pressed', 'false');
            bundleSelectionState.isSelected = false;
            bundleSelectionState.variantId = null;
            
            // Restore bundle item price
            const originalBundlePrice = this.bundleItemPrice.dataset.originalPrice;
            if (originalBundlePrice) {
                this.bundleItemPrice.innerHTML = originalBundlePrice;
            }
            
            // Restore main product price
            const originalMainPrice = mainProductPrice.dataset.originalPrice;
            if (originalMainPrice) {
                mainProductPrice.innerHTML = originalMainPrice;
            }
        } else {
            this.bundleCard.setAttribute('selected', '');
            this.bundleCard.setAttribute('aria-pressed', 'true');
            bundleSelectionState.isSelected = true;
            bundleSelectionState.variantId = this.bundleCard.getAttribute('data-bundle-variant-id');
            
            // Store and update bundle item price
            if (!this.bundleItemPrice.dataset.originalPrice) {
                this.bundleItemPrice.dataset.originalPrice = this.bundleItemPrice.innerHTML;
            }
            
            const bundleOriginalText = this.bundleItemPrice.dataset.originalPrice;
            const bundlePriceMatch = bundleOriginalText.match(/[\d.,]+/);

            if (bundlePriceMatch) {
                const bundleOriginalPrice = parseFloat(bundlePriceMatch[0]);
                const bundleDiscountedPrice = (bundleOriginalPrice * (1 - mainBundleDiscount)).toFixed(2);
                this.bundleItemPrice.innerHTML = `<s>${bundleOriginalText}</s> $${bundleDiscountedPrice}`;
            }
            
            // Store and update main product price
            if (!mainProductPrice.dataset.originalPrice) {
                mainProductPrice.dataset.originalPrice = mainProductPrice.innerHTML;
            }
            
            const mainOriginalText = mainProductPrice.dataset.originalPrice;

            const mainPriceMatch = mainOriginalText.match(/[\d.,]+/);
            
            if (mainPriceMatch) {
                const mainOriginalPrice = parseFloat(mainPriceMatch[0]);
                const mainDiscountedPrice = (mainOriginalPrice * (1 - mainBundleDiscount)).toFixed(2);
                mainProductPrice.innerHTML = `<s>${mainOriginalText}</s> $${mainDiscountedPrice}`;
            } 
        }
    }
}

customElements.define('bundle-card', BundleCard);