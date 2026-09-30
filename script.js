/* Mobile nav */
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar && nav) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (close && nav) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}

if (nav) {
    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => nav.classList.remove('active'));
    });
}

/* Cart storage (localStorage, shared across pages) */
const CART_KEY = 'franc_cart';

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(cart) ? cart : [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(item, qty) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...item, qty });
    }
    saveCart(cart);
}

function removeFromCart(id) {
    saveCart(getCart().filter((i) => i.id !== id));
}

function setQty(id, qty) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) {
        item.qty = Math.max(1, qty);
        saveCart(cart);
    }
}

function updateCartBadge() {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count').forEach((el) => {
        el.textContent = String(count);
        el.hidden = count === 0;
    });
}

function formatPrice(n) {
    return '$' + n.toFixed(2);
}

updateCartBadge();

/* Add-to-cart buttons on product cards (home, store, related products) */
document.querySelectorAll('.products .pro .cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pro = btn.closest('.pro');
        if (!pro) return;
        const img = pro.querySelector('img');
        const name = pro.querySelector('.des h5')?.textContent.trim() || 'Product';
        const priceText = pro.querySelector('.des h4')?.textContent.trim() || '$0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const src = img ? img.getAttribute('src') : name;
        addToCart({ id: src, name, price, img: src }, 1);
        btn.classList.add('added');
        setTimeout(() => btn.classList.remove('added'), 600);
    });
});

/* Product cards link through to the product detail page (keyboard accessible) */
document.querySelectorAll('.products .pro').forEach((pro) => {
    pro.setAttribute('tabindex', '0');
    pro.setAttribute('role', 'link');
    const name = pro.querySelector('.des h5');
    if (name) pro.setAttribute('aria-label', 'View ' + name.textContent.trim());

    const go = () => { window.location.href = 'sproduct.html'; };

    pro.addEventListener('click', (e) => {
        if (e.target.closest('.cart')) return;
        go();
    });
    pro.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.cart')) {
            e.preventDefault();
            go();
        }
    });
});

/* Buttons that just navigate somewhere (hero/banner CTAs) */
document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
        window.location.href = btn.dataset.nav;
    });
});

/* Single product page: gallery + add to cart */
(function initProductDetail() {
    const mainImg = document.getElementById('MainImg');
    const thumbs = document.querySelectorAll('.small-img');
    if (mainImg && thumbs.length) {
        thumbs.forEach((thumb) => {
            thumb.addEventListener('click', () => {
                mainImg.src = thumb.src;
            });
        });
    }

    const addBtn = document.getElementById('addToCartBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
        const sizeSelect = document.getElementById('sizeSelect');
        const qtyInput = document.getElementById('qtyInput');
        const msg = document.getElementById('addToCartMsg');

        if (sizeSelect && !sizeSelect.value) {
            if (msg) {
                msg.textContent = 'Please select a size.';
                msg.className = 'form-msg error';
            }
            return;
        }

        const qty = Math.max(1, parseInt(qtyInput?.value, 10) || 1);
        const name = document.querySelector('#prodetails .single-pro-details h4')?.textContent.trim() || 'Product';
        const priceText = document.querySelector('#prodetails .single-pro-details h2')?.textContent.trim() || '$0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const img = mainImg ? mainImg.getAttribute('src') : '';
        const size = sizeSelect ? sizeSelect.value : '';
        const id = img + (size ? '-' + size : '');
        const label = size ? `${name} (${size})` : name;

        addToCart({ id, name: label, price, img }, qty);

        if (msg) {
            msg.textContent = 'Added to cart!';
            msg.className = 'form-msg success';
        }
    });
})();

/* Cart page: render items from storage, wire quantity/remove/coupon/checkout */
(function initCartPage() {
    const body = document.getElementById('cartBody');
    if (!body) return;

    const table = document.querySelector('#cart table');
    const emptyMsg = document.getElementById('cart-empty');
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    const discountRow = document.getElementById('discountRow');
    const discountEl = document.getElementById('cartDiscount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const couponBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('couponInput');
    const couponMsg = document.getElementById('couponMsg');

    let discountRate = 0;

    function draw() {
        const cart = getCart();
        body.innerHTML = '';

        if (cart.length === 0) {
            if (table) table.hidden = true;
            if (emptyMsg) emptyMsg.hidden = false;
        } else {
            if (table) table.hidden = false;
            if (emptyMsg) emptyMsg.hidden = true;

            cart.forEach((item) => {
                const tr = document.createElement('tr');

                const removeTd = document.createElement('td');
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'icon-btn';
                removeBtn.setAttribute('aria-label', 'Remove ' + item.name);
                removeBtn.innerHTML = '<i class="fas fa-times-circle" aria-hidden="true"></i>';
                removeBtn.addEventListener('click', () => {
                    removeFromCart(item.id);
                    draw();
                });
                removeTd.appendChild(removeBtn);

                const imgTd = document.createElement('td');
                const img = document.createElement('img');
                img.src = item.img;
                img.alt = item.name;
                imgTd.appendChild(img);

                const nameTd = document.createElement('td');
                nameTd.textContent = item.name;

                const priceTd = document.createElement('td');
                priceTd.textContent = formatPrice(item.price);

                const qtyTd = document.createElement('td');
                const qtyInput = document.createElement('input');
                qtyInput.type = 'number';
                qtyInput.min = '1';
                qtyInput.value = String(item.qty);
                qtyInput.setAttribute('aria-label', 'Quantity for ' + item.name);
                qtyInput.addEventListener('change', () => {
                    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
                    setQty(item.id, qty);
                    draw();
                });
                qtyTd.appendChild(qtyInput);

                const subtotalTd = document.createElement('td');
                subtotalTd.textContent = formatPrice(item.price * item.qty);

                tr.append(removeTd, imgTd, nameTd, priceTd, qtyTd, subtotalTd);
                body.appendChild(tr);
            });
        }

        const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const discount = subtotal * discountRate;
        const total = subtotal - discount;

        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (discountRow && discountEl) {
            if (discountRate > 0) {
                discountRow.hidden = false;
                discountEl.textContent = '-' + formatPrice(discount);
            } else {
                discountRow.hidden = true;
            }
        }
        if (totalEl) totalEl.textContent = formatPrice(total);
    }

    if (couponBtn && couponInput && couponMsg) {
        couponBtn.addEventListener('click', () => {
            const code = (couponInput.value || '').trim().toUpperCase();
            if (code === 'SAVE10') {
                discountRate = 0.1;
                couponMsg.textContent = 'Coupon applied: 10% off.';
                couponMsg.className = 'form-msg success';
            } else {
                discountRate = 0;
                couponMsg.textContent = 'Invalid coupon code.';
                couponMsg.className = 'form-msg error';
            }
            draw();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (getCart().length === 0) {
                alert('Your cart is empty.');
                return;
            }
            alert('Thank you! Your order has been placed.');
            saveCart([]);
            discountRate = 0;
            draw();
        });
    }

    draw();
})();

/* Newsletter sign-up forms (no backend - shows a local confirmation) */
document.querySelectorAll('[data-newsletter-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');

        let msg = form.nextElementSibling;
        if (!msg || !msg.classList.contains('form-msg')) {
            msg = document.createElement('p');
            msg.className = 'form-msg';
            form.insertAdjacentElement('afterend', msg);
        }

        if (input && input.checkValidity()) {
            msg.textContent = 'Thanks for subscribing!';
            msg.className = 'form-msg success';
            form.reset();
        } else {
            msg.textContent = 'Please enter a valid email address.';
            msg.className = 'form-msg error';
        }
    });
});

/* Contact form (no backend - shows a local confirmation) */
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.querySelector('[data-contact-msg]');
        if (contactForm.checkValidity()) {
            if (msg) {
                msg.textContent = "Thanks for reaching out! We'll get back to you soon.";
                msg.className = 'form-msg success';
            }
            contactForm.reset();
        } else {
            if (msg) {
                msg.textContent = 'Please fill in your name, a valid email, and a message.';
                msg.className = 'form-msg error';
            }
            contactForm.reportValidity();
        }
    });
}
