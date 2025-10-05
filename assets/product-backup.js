

document.addEventListener('DOMContentLoaded', function () {
    // Ensure the product form exists before adding event listeners
    const productForm = document.querySelector('.shopify-product-form');
    if (productForm) {

        productForm.addEventListener('input', function (event) {
            const variants = JSON.parse(document.getElementById('product-variants-json').innerText);

            const options1 = productForm.querySelector('.product-option-1').value;
            const options2 = productForm.querySelector('.product-option-2') ? productForm.querySelector('.product-option-2').value : null;
            const options3 = productForm.querySelector('.product-option-3') ? productForm.querySelector('.product-option-3').value : null;

            console.log('Selected Options:', options1, options2, options3);

            const selectedVariant = variants.find(variant => {
                return variant.option1 === options1 &&
                    variant.option2 === options2 &&
                    variant.option3 === options3;
            });
            console.log('Selected Variant:', selectedVariant);

            // Update the form's variant selection
            if (selectedVariant) {
                productForm.querySelector('.product-variant-select').value = selectedVariant.id;
            }

            console.log('All Variants:', variants);
            const current_variant_id = productForm.querySelector('.product-variant-select').value;
            const current_variant = variants.find(variant => variant.id == current_variant_id);
            console.log(current_variant);

            document.querySelector('.product-price').innerText = '$' + (current_variant ? (current_variant.price / 100).toFixed(2) : 'N/A');
            document.querySelector('.product-image').src = current_variant && current_variant.featured_image ? current_variant.featured_image.src : '{{ product.featured_image | image_url: width:400 }}';
            document.querySelector('.product-image').alt = current_variant && current_variant.featured_image ? current_variant.featured_image.alt : '{{ product.alt | escape }}';
            if (current_variant_id) {
                window.history.replaceState(null, '', `${window.location.pathname}?variant=${current_variant_id}`);
            }

            const atcButton = productForm.querySelector('button[type="submit"]');

            if (current_variant.available) {
                atcButton.disabled = false;
                atcButton.innerText = 'Add to Cart';
            } else {
                atcButton.disabled = true;
                atcButton.innerText = 'Sold Out';
            }
        });

        productForm.addEventListener('submit', function (event) {
            event.preventDefault();
            let formData = new FormData(productForm);

            // Check if bundle card is selected and add bundle variant to cart
            const bundleCard = document.querySelector('.bundle-product');
            const bundleId = new Date().getTime(); // Unique ID for this bundle addition
            console.log('Bundle ID:', bundleId);
            
            const items = [];
            
            if (bundleCard && bundleCard.hasAttribute('selected')) {
                const bundleVariantId = bundleCard.getAttribute('data-bundle-variant-id');
                if (bundleVariantId) {
                    formData.append('items[][id]', bundleVariantId);
                    formData.append('items[][quantity]', '1');

                    console.log('Bundle variant added to cart:', bundleVariantId);
                }
            }

            // Convert FormData to object for better logging
            const formDataObject = {};
            for (let [key, value] of formData.entries()) {
                formDataObject[key] = value;
            }
            console.log('Form Data:', formDataObject);

            fetch(window.Shopify.routes.root + 'cart/add.js', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    return response.json();
                })
                .then(json_response => {
                    console.log('Add to Cart Response:', json_response);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });



    }


});


class BundleCard extends HTMLElement {
    constructor() {
        super();
        this.bundleCard = this.querySelector('.bundle-product');
        this.addEventListener('click', this.toggleSelection.bind(this));

    }

    toggleSelection() {
        if (this.bundleCard.hasAttribute('selected')) {
            this.bundleCard.removeAttribute('selected');
            this.bundleCard.style.border = '';
        } else {
            this.bundleCard.setAttribute('selected', '');
            this.bundleCard.style.border = '2px solid blue';
        }
    }
}

customElements.define('bundle-card', BundleCard);