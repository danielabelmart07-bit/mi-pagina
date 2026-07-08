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

// SOLUCIÓN DEFINITIVA PARA EL FORMATO: Fuerza los puntos de miles estilo Argentina
function formatCurrency(value) {
    const numeroEntero = Math.round(value);
    return '$' + numeroEntero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- 1. ABRIR Y CERRAR EL CARRITO ---
document.querySelectorAll('.toggle-cart').forEach(btn => {
    btn.addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    });
});

if (document.querySelector('.close-cart')) {
    document.querySelector('.close-cart').addEventListener('click', closeCart);
}

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
        
        // Leemos el precio que viene del HTML
        let price = parseFloat(card.getAttribute('data-price'));

        // TRUCO DE EMERGENCIA: Si el precio es menor a 100 (ej: 2.2 o 4.5), lo convertimos a miles (2200 o 4500)
        if (price < 100) {
            price = price * 1000;
        }

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
            
            // CORRECCIÓN: Multiplicamos el precio por la cantidad para mostrar el subtotal real de ese producto
            row.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <span style="color:var(--primary); font-weight:600;">${formatCurrency(item.price * item.quantity)}</span>
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
    
    // Mostramos el total con el formato manual de puntos
    cartTotalPrice.innerText = formatCurrency(totalPrice);
}

// --- 5. PASARELA DE PAGOS / MODAL ---
goToCheckoutBtn.addEventListener('click', () => {
    const totalText = cartTotalPrice.innerText;
    modalTotalAmount.innerText = totalText;
    
    closeCart(); 
    checkoutModal.classList.add('open'); 
    cartOverlay.classList.add('open');
});

if (document.querySelector('.close-modal')) {
    document.querySelector('.close-modal').addEventListener('click', closeModal);
}

function closeModal() {
    checkoutModal.classList.remove('open');
    cartOverlay.classList.remove('open');
}

// --- 6. FORMATEAR ENTRADAS DE LA TARJETA (Se mantienen por compatibilidad si existen campos) ---
const cardNumberInput = document.getElementById('card-number');
if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
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
}

const cardExpiryInput = document.getElementById('card-expiry');
if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
        if (value.length >= 2) {
            e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
        } else {
            e.target.value = value;
        }
    });
}

// --- 7. PROCESAR PEDIDO Y ENVIAR POR WHATSAPP ---
if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        // Tu número de teléfono configurado
        const TELEFONO_PANADERIA = "5491167878640"; 

        // Capturamos los datos del formulario limpio
        const nombreCliente = document.getElementById('client-name').value;
        const direccionCliente = document.getElementById('client-address').value;
        const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Armamos la lista de productos en texto para el mensaje
        let listaProductosText = "";
        cart.forEach(item => {
            listaProductosText += `- ${item.quantity}x ${item.name} (${formatCurrency(item.price * item.quantity)})\n`;
        });

        // Diseñamos el mensaje que te va a llegar a tu celular
        const mensajeWhatsApp = `Hola Masa Madre! 🥖\n\n` +
                                `Quiero realizar el siguiente pedido:\n` +
                                `${listaProductosText}\n` +
                                `*Total:* ${formatCurrency(totalValue)}\n\n` +
                                `*Datos de entrega:*\n` +
                                `• Nombre: ${nombreCliente}\n` +
                                `• Dirección: ${direccionCliente}\n\n` +
                                `Aguardó confirmación para transferir al alias. ¡Gracias!`;

        // Convertimos el texto a un formato que entienda el navegador
        const mensajeCodificado = encodeURIComponent(mensajeWhatsApp);
        
        // Creamos el link oficial de WhatsApp
        const whatsappUrl = `https://wa.me/${TELEFONO_PANADERIA}?text=${mensajeCodificado}`;

        // Limpiamos el carrito local
        cart = [];
        updateCartUI();
        closeModal();
        paymentForm.reset();

        // Redirigimos al cliente a su WhatsApp con el mensaje listo para enviar
        window.location.href = whatsappUrl;
    });
}

// --- 8. FUNCIONALIDAD DE MODO OSCURO / CLARO ---
const themeToggleBtn = document.getElementById('theme-toggle');

const SVG_LUNA = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
const SVG_SOL = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

if (themeToggleBtn) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggleBtn.innerHTML = savedTheme === 'dark' ? SVG_SOL : SVG_LUNA;
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'light';

        if (currentTheme !== 'dark') {
            newTheme = 'dark';
        }

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        themeToggleBtn.innerHTML = newTheme === 'dark' ? SVG_SOL : SVG_LUNA;
    });
}