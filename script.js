import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

// --- RENDERIZADO DE TIENDA ---
async function renderStore() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const querySnapshot = await getDocs(collection(db, "products"));
    grid.innerHTML = "";
    const categorias = new Set();

    querySnapshot.forEach(docSnap => {
        const p = docSnap.data();
        categorias.add(p.category);

        // Creamos la "caja" del producto
        grid.innerHTML += `
            <div class="product-card" onclick="openProductModal('${docSnap.id}', '${p.name.replace(/'/g, "\\'")}', '${p.description.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                <div class="product-image-container">
                    <img src="${p.image}" class="product-image">
                </div>
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-footer">
                        <p class="product-price">$${p.price.toLocaleString()}</p>
                        <button class="add-quick-btn">+</button>
                    </div>
                </div>
            </div>`;
    });
    renderCategories(Array.from(categorias));
}

function renderCategories(catList) {
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    let html = `<button class="filter-btn active" onclick="filterByCategory('all')">Todas</button>`;
    catList.forEach(cat => {
        html += `<button class="filter-btn" onclick="filterByCategory('${cat}')">${cat}</button>`;
    });
    container.innerHTML = html;
}

window.filterByCategory = async (category) => {
    const grid = document.getElementById('productsGrid');
    const querySnapshot = await getDocs(collection(db, "products"));
    grid.innerHTML = "";
    querySnapshot.forEach(docSnap => {
        const p = docSnap.data();
        if (category === 'all' || p.category === category) {
            grid.innerHTML += `
                <div class="product-card" onclick="openProductModal('${docSnap.id}', '${p.name.replace(/'/g, "\\'")}', '${p.description.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                    <div class="product-image-container">
                        <img src="${p.image}" class="product-image">
                    </div>
                    <div class="product-info">
                        <span class="product-category">${p.category}</span>
                        <h3 class="product-title">${p.name}</h3>
                        <p class="product-price">$${p.price.toLocaleString()}</p>
                    </div>
                </div>`;
        }
    });
};

// --- MODALES Y CARRITO ---
window.openProductModal = (id, name, desc, price, img) => {
    const modal = document.getElementById('productModal');
    document.getElementById('modalImage').src = img;
    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalDescription').textContent = desc || "Sin descripción disponible";
    document.getElementById('modalPrice').textContent = `$${price.toLocaleString()}`;

    const addBtn = document.getElementById('addToCartBtn');
    addBtn.onclick = () => {
        cart.push({ name, price, img });
        updateCartUI();
        modal.classList.remove('active');
    };
    modal.classList.add('active');
};

function updateCartUI() {
    const list = document.getElementById('cartList');
    const total = document.getElementById('cartTotal');
    const count = document.getElementById('cartCount');

    if (count) count.textContent = cart.length;
    if (list) {
        list.innerHTML = cart.map((item, i) => `
            <div class="cart-item" style="display:flex; align-items:center; gap:10px; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <img src="${item.img}" width="50" height="50" style="object-fit:cover; border-radius:5px;">
                <div style="flex:1">
                    <h4 style="margin:0; font-size:0.9rem;">${item.name}</h4>
                    <p style="margin:0; color:var(--primary); font-weight:bold;">$${item.price.toLocaleString()}</p>
                </div>
                <button onclick="removeFromCart(${i})" style="background:none; border:none; color:red; cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>`).join('');
    }
    const totalVal = cart.reduce((s, i) => s + i.price, 0);
    if (total) total.textContent = `$${totalVal.toLocaleString()}`;
}

window.removeFromCart = (i) => { cart.splice(i, 1); updateCartUI(); };

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    renderStore();

    // Abrir Carrito
    document.getElementById('openCartBtn')?.addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('active');
    });

    // CERRAR MODALES (Esta es la parte que arregla la "X")
    document.addEventListener('click', (e) => {
        if (e.target.closest('.close-modal') || e.target.classList.contains('modal-overlay')) {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        }
    });

    // Finalizar Pedido
    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert("Carrito vacío");
        const order = {
            customer: {
                name: document.getElementById('cName').value,
                contact: document.getElementById('cContact').value,
                cedula: document.getElementById('cCedula').value,
                address: document.getElementById('cAddress').value
            },
            items: cart,
            total: cart.reduce((s, i) => s + i.price, 0),
            date: new Date().toLocaleString()
        };
        await addDoc(collection(db, "orders"), order);
        alert("¡Pedido enviado!");
        cart = []; updateCartUI();
        document.getElementById('cartModal').classList.remove('active');
    });
});