
class SideCartItem extends HTMLElement {
    constructor() {
        super();

        this.querySelector('.increase-qty').addEventListener('click', this.addQty.bind(this));
        this.querySelector('.decrease-qty').addEventListener('click', this.minusQty.bind(this));
        this.querySelector('.remove-item').addEventListener('click', this.removeItem.bind(this));
        this.itemKey = this.getAttribute('item-key');
        this.itemQty = this.getAttribute('item-qty');

    }

    updateCart(updates) {

        fetch(window.Shopify.routes.root + 'cart/update.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ updates })
        })
            .then(response => {
                return response.json();
            })
            .then(json_response => {
                console.log('Update Cart Response:', json_response);
                document.querySelector('side-cart').getCart();
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    addQty() {
        let updates = {};
        updates[this.itemKey] = parseInt(this.itemQty) + 1;
        this.updateCart(updates);
    }
    minusQty() {
        let updates = {};
        updates[this.itemKey] = parseInt(this.itemQty) - 1;
        this.updateCart(updates);
    }
    removeItem() {
        let updates = {};
        updates[this.itemKey] = 0;
        this.updateCart(updates);
        
    }
}

customElements.define('side-cart-item', SideCartItem);

class SideCart extends HTMLElement {
    constructor() {
        super();
        this.cart = null;

    }
    connectedCallback() {
        this.getCart();
    }

    getCart() {
        fetch(window.Shopify.routes.root + 'cart.js')
            .then(response => response.json())
            .then(data => {
                // Process cart data
                this.cart = data;
                this.buildCart();
            })
    }

    buildCart() {
        console.log('Cart Data:', this.cart);
        // Example: Display cart items
        const cartItemsContainer = this.querySelector('.cart-items');
        if (cartItemsContainer && this.cart) {
            cartItemsContainer.innerHTML = '';
            this.cart.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                <side-cart-item item-key="${item.key}" item-qty="${item.quantity}">
                <div class="item-title">${item.title}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
                <div class="cart-item-quantity">
                    <span class="decrease-qty" data-line="${item.key}">-</span>
                    <input type="number" class="item-qty-input" data-line="${item.key}" value="${item.quantity}" min="1">
                    <span class="increase-qty" data-line="${item.key}">+</span>
                </div>
                <div class="item-price">Price: $${(item.final_price / 100).toFixed(2)}</div>
                <div class="remove-item" data-line="${item.key}">Remove</div>
                </side-cart-item>
            `;
                cartItemsContainer.appendChild(itemElement);
            });

            this.querySelector('.cart-total').innerText = 'Total: $' + (this.cart.total_price / 100).toFixed(2);
        }
    }
}

customElements.define('side-cart', SideCart);