import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1v2ozSy5dRh_F1lDy4_DBhO4h8km1-rs",
    authDomain: "premiun-store.firebaseapp.com",
    projectId: "premiun-store",
    storageBucket: "premiun-store.firebasestorage.app",
    messagingSenderId: "333909032538",
    appId: "1:333909032538:web:fcb2b7f830941bba326263",
    measurementId: "G-12QTJNR1DL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];
let allProducts = [];
let allCategories = new Set();

async function renderStore() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    try {
        const snap = await getDocs(collection(db, "products"));
        grid.innerHTML = "";
        allProducts = [];
        allCategories.clear();

        if (snap.empty) {
            grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1">No hay productos disponibles</p>';
            return;
        }

        snap.forEach(docSnap => {
            const p = docSnap.data();
            p.id = docSnap.id;
            allProducts.push(p);
            allCategories.add(p.category);

            grid.innerHTML += `
                <div class="product-card glass-panel" onclick="openProductModal('${docSnap.id}')">
                    <div class="card-img-container">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <span class="card-category">${p.category}</span>
                        <h3>${p.name}</h3>
                        <p class="card-price">$${p.price.toLocaleString()}</p>
                    </div>
                    <button class="add-quick-btn" onclick="event.stopPropagation(); quickAddToCart('${docSnap.id}')">+</button>
                </div>`;
        });

        updateCategorySelect();
    } catch (error) {
        console.error('Error cargando productos:', error);
        grid.innerHTML = '<p style="text-align:center;color:#ef4444;grid-column:1/-1">Error al cargar productos</p>';
    }
}

function updateCategorySelect() {
    const select = document.getElementById('categorySelect');
    if (!select) return;

    const currentValue = select.value;
    let html = '<option value="all">Todas las Categorías</option>';
    allCategories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = html;
    select.value = currentValue;
}

window.filterByCategory = function(category) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = "";

    const filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1">No hay productos en esta categoría</p>';
        return;
    }

    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="product-card glass-panel" onclick="openProductModal('${p.id}')">
                <div class="card-img-container">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </div>
                <div class="card-info">
                    <span class="card-category">${p.category}</span>
                    <h3>${p.name}</h3>
                    <p class="card-price">$${p.price.toLocaleString()}</p>
                </div>
                <button class="add-quick-btn" onclick="event.stopPropagation(); quickAddToCart('${p.id}')">+</button>
            </div>`;
    });
};

window.openProductModal = function(productId) {
    const p = allProducts.find(prod => prod.id === productId);
    if (!p) return;

    document.getElementById('modalImage').src = p.image;
    document.getElementById('modalCategory').textContent = p.category;
    document.getElementById('modalTitle').textContent = p.name;
    document.getElementById('modalPrice').textContent = `$${p.price.toLocaleString()}`;
    document.getElementById('modalDescription').textContent = p.description || "Sin descripción disponible";

    document.getElementById('addToCartBtn').onclick = () => {
        cart.push({ id: p.id, name: p.name, price: p.price, img: p.image });
        updateCartUI();
        closeModal('productModal');
        showNotification('Producto agregado al carrito');
    };

    document.getElementById('productModal').classList.add('active');
};

window.quickAddToCart = function(productId) {
    const p = allProducts.find(prod => prod.id === productId);
    if (!p) return;
    cart.push({ id: p.id, name: p.name, price: p.price, img: p.image });
    updateCartUI();
    showNotification('Producto agregado al carrito');
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
};

function updateCartUI() {
    const list = document.getElementById('cartList');
    const total = document.getElementById('cartTotal');
    const count = document.getElementById('cartCount');

    if (count) count.textContent = cart.length;

    if (list) {
        if (cart.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Tu carrito está vacío</p>';
        } else {
            list.innerHTML = cart.map((item, i) => `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-price">$${item.price.toLocaleString()}</span>
                    </div>
                    <button onclick="removeFromCart(${i})" class="remove-item-btn">&times;</button>
                </div>`).join('');
        }
    }

    const totalVal = cart.reduce((s, i) => s + i.price, 0);
    if (total) total.textContent = `$${totalVal.toLocaleString()}`;
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

function showNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderStore();

    document.getElementById('openCartBtn')?.addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('active');
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) { alert("Carrito vacío"); return; }

        const order = {
            customer: {
                name: document.getElementById('cName').value,
                contact: document.getElementById('cContact').value,
                cedula: document.getElementById('cCedula').value,
                address: document.getElementById('cAddress').value
            },
            items: cart,
            total: cart.reduce((s, i) => s + i.price, 0),
            date: new Date().toLocaleString('es-CO')
        };

        try {
            await addDoc(collection(db, "orders"), order);
            alert("¡Pedido enviado exitosamente!");
            cart = [];
            updateCartUI();
            closeModal('cartModal');
            e.target.reset();
        } catch (error) {
            console.error('Error enviando pedido:', error);
            alert('Error al enviar el pedido');
        }
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
