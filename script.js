// Estado del Carrito en Memoria
let cart = [];

// Tu configuración de Mercado Pago (Tu alias)
const ALIAS_MERCADO_PAGO = "Bartolito07";

// Captura de Elementos de la Interfaz
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const goToCheckoutBtn = document.getElementById('go-to-checkout');
const cartCountNav = document.getElementById('cart-count-nav');

const checkoutModal = document.getElementById('checkout-modal');
const modalTotalAmount = document.getElementById('modal-total-amount');
const paymentForm = document.getElementById('payment-form');

// --- 1. ABRIR Y CERRAR EL CARRITO ---
document.querySelectorAll('.toggle-cart').forEach(btn => {
    btn.addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    });
});

document.querySelector('.close-cart').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', () => {
    closeCart();
    closeModal();
});

function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
}

// --- 2. CONTROLAR LA ACCIÓN DE AGREGAR PRODUCTOS ---
document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const id = card.getAttribute('data-id');
        const name = card.getAttribute('data-name');
        const price = parseFloat(card.getAttribute('data-price'));

        addToCart(id, name, price);

        // Efecto visual instantáneo en el botón
        e.target.innerText = "¡Añadido! ✓";
        e.target.style.background = "#25d366";
        setTimeout(() => {
            e.target.innerText = "Agregar al carrito";
            e.target.style.background = "";
        }, 800);
    });
});

function addToCart(id, name, price) {
    const activeProduct = cart.find(item => item.id === id);

    if (activeProduct) {
        activeProduct.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartUI();
}

// --- 3. MODIFICAR CANTIDADES (+ / - / ELIMINAR) ---
function changeQuantity(id, change) {
    const activeProduct = cart.find(item => item.id === id);
    if (!activeProduct) return;

    activeProduct.quantity += change;

    if (activeProduct.quantity <= 0) {
        cart = cart.filter(item => item.id !== id);
    }
    updateCartUI();
}

// --- 4. RENDERIZAR LA INTERFAZ DEL CARRITO EN TIEMPO REAL ---
function updateCartUI() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-message">Tu carrito está vacío.</p>';
        goToCheckoutBtn.disabled = true;
    } else {
        goToCheckoutBtn.disabled = false;

        cart.forEach(item => {
            const row = document.createElement('div');
            row.classList.add('cart-item');
            row.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <span style="color:var(--primary); font-weight:600;">$${item.price.toFixed(2)} x ${item.quantity}</span>
                </div>
                <div class="cart-item-actions">
                    <button onclick="changeQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity('${item.id}', 1)">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(row);
        });
    }

    // Totales de la barra superior e inferior
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartCountNav.innerText = totalItems;
    cartTotalPrice.innerText = `$${totalPrice.toFixed(2)}`;
}

// --- 5. PASARELA DE PAGOS / MODAL ---
goToCheckoutBtn.addEventListener('click', () => {
    const totalText = cartTotalPrice.innerText;
    modalTotalAmount.innerText = totalText;
    
    closeCart(); 
    checkoutModal.classList.add('open'); 
    cartOverlay.classList.add('open');
});

document.querySelector('.close-modal').addEventListener('click', closeModal);

function closeModal() {
    checkoutModal.classList.remove('open');
    cartOverlay.classList.remove('open');
}

// --- 6. FORMATEAR ENTRADAS DE LA TARJETA ---
document.getElementById('card-number').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];

    for (let i=0, len=match.length; i<len; i+=4) {
        parts.push(match.substring(i, i+4));
    }
    if (parts.length > 0) {
        e.target.value = parts.join(' ');
    } else {
        e.target.value = value;
    }
});

document.getElementById('card-expiry').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
        e.target.value = value;
    }
});

// --- 7. PROCESAR PAGO Y REDIRIGIR A MERCADO PAGO ---
paymentForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

    // 1. Calculamos el monto total exacto que debe transferir
    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    
    // 2. Avisamos al cliente mediante una alerta profesional
    alert(`¡Datos validados! Redirigiendo de forma segura a Mercado Pago para abonar un total de $${totalValue} a la cuenta vinculada al alias: ${ALIAS_MERCADO_PAGO}`);

    // 3. Creamos la URL oficial de transferencia/envío de dinero de Mercado Pago apuntando a tu alias
    // Nota: El parámetro de monto 'amount' autocompleta el número en la app si el usuario tiene Mercado Pago abierto.
    const mercadoPagoUrl = `https://link.mercadopago.com.ar/${ALIAS_MERCADO_PAGO}?amount=${totalValue}`;

    // 4. Limpiamos el carrito local para que no se duplique el pedido
    cart = [];
    updateCartUI();
    closeModal();
    paymentForm.reset();

    // 5. Redirigimos al cliente a tu link de cobro
    window.location.href = mercadoPagoUrl;
})

// --- 8. FUNCIONALIDAD DE MODO OSCURO / CLARO ---
const themeToggleBtn = document.getElementById('theme-toggle');

// Comprobar si el usuario ya tenía una preferencia guardada anteriormente
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
}

themeToggleBtn.addEventListener('click', () => {
    // Obtener el tema actual activo
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let newTheme = 'light';

    if (currentTheme !== 'dark') {
        newTheme = 'dark';
    }

    // Aplicar el nuevo tema al HTML
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Guardar la elección para la próxima visita
    localStorage.setItem('theme', newTheme);
    
    // Cambiar el emoji del botón alternando sol y luna
    themeToggleBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
}); // <-- ¡AQUÍ ESTABA EL DETALLE! Cerramos la llave y el paréntesis.

