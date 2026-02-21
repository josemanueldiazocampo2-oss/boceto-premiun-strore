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

const USUARIO_RAIZ = { username: "JOSE", password: "281009", role: "host" };
let currentAdminUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = [];

// --- TIENDA Y PRODUCTOS ---
async function renderStore() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const querySnapshot = await getDocs(collection(db, "products"));
    grid.innerHTML = "";

    const categorias = new Set();

    querySnapshot.forEach(docSnap => {
        const p = docSnap.data();
        categorias.add(p.category);

        // Limpiamos el texto de comillas para evitar errores en el onclick
        const cleanDesc = p.description ? p.description.replace(/'/g, "&apos;") : "";
        const cleanName = p.name.replace(/'/g, "&apos;");

        grid.innerHTML += `
            <div class="product-card" onclick="openProductModal('${docSnap.id}', '${cleanName}', '${cleanDesc}', ${p.price}, '${p.image}')">
                <img src="${p.image}" class="product-image">
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <h3 class="product-title">${p.name}</h3>
                    <p class="product-price">$${p.price.toLocaleString()}</p>
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
            const cleanDesc = p.description ? p.description.replace(/'/g, "&apos;") : "";
            const cleanName = p.name.replace(/'/g, "&apos;");
            grid.innerHTML += `
                <div class="product-card" onclick="openProductModal('${docSnap.id}', '${cleanName}', '${cleanDesc}', ${p.price}, '${p.image}')">
                    <img src="${p.image}" class="product-image">
                    <div class="product-info">
                        <span class="product-category">${p.category}</span>
                        <h3 class="product-title">${p.name}</h3>
                        <p class="product-price">$${p.price.toLocaleString()}</p>
                    </div>
                </div>`;
        }
    });
};

// --- MODAL Y CARRITO ---
window.openProductModal = (id, name, desc, price, img) => {
    const modal = document.getElementById('productModal');
    document.getElementById('modalImage').src = img;
    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalDescription').textContent = desc;
    document.getElementById('modalPrice').textContent = `$${price.toLocaleString()}`;

    // Configurar botón de agregar (En tu HTML es el botón dentro de product-modal-content)
    const addBtn = modal.querySelector('.btn');
    addBtn.onclick = (e) => {
        e.stopPropagation();
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
            <div class="cart-item">
                <img src="${item.img}" width="40" style="border-radius:4px">
                <div style="flex:1; margin-left:10px;">
                    <div style="font-size:0.9rem">${item.name}</div>
                    <div style="color:var(--primary); font-weight:bold">$${item.price.toLocaleString()}</div>
                </div>
                <button onclick="removeFromCart(${i})" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:1.2rem">&times;</button>
            </div>`).join('');
    }
    const totalAmount = cart.reduce((s, i) => s + i.price, 0);
    if (total) total.textContent = `$${totalAmount.toLocaleString()}`;
}

window.removeFromCart = (i) => { cart.splice(i, 1); updateCartUI(); };

// --- ADMIN LOGIC ---
window.handleLogin = async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    if (u === USUARIO_RAIZ.username && p === USUARIO_RAIZ.password) {
        currentAdminUser = USUARIO_RAIZ;
    } else {
        const q = query(collection(db, "team"), where("username", "==", u), where("password", "==", p));
        const res = await getDocs(q);
        if (res.empty) return alert("Credenciales incorrectas");
        currentAdminUser = res.docs[0].data();
    }
    localStorage.setItem('currentUser', JSON.stringify(currentAdminUser));
    location.reload();
};

window.addProduct = async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "products"), {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            image: document.getElementById('productImage').value,
            description: document.getElementById('productDescription').value
        });
        alert("Producto guardado con éxito");
        location.reload();
    } catch (err) { alert("Error al guardar: " + err); }
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    renderStore();

    // Mostrar interfaz admin si está logueado
    if (currentAdminUser && document.getElementById('adminInterface')) {
        document.getElementById('adminInterface').style.display = 'block';
        document.getElementById('loginScreen').style.display = 'none';
        renderAdminOrders();
    }

    // Abrir Carrito
    document.getElementById('openCartBtn')?.addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('active');
    });

    // Cerrar Modales (X y Overlay)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-overlay')) {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        }
    });

    // Formulario de pedido
    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert("El carrito está vacío");
        const order = {
            customer: {
                name: document.getElementById('cName').value,
                contact: document.getElementById('cContact').value,
                address: document.getElementById('cAddress').value,
                cedula: document.getElementById('cCedula').value
            },
            items: cart,
            total: cart.reduce((s, i) => s + i.price, 0),
            date: new Date().toLocaleString()
        };
        await addDoc(collection(db, "orders"), order);
        alert("¡Pedido enviado con éxito!");
        cart = []; updateCartUI();
        document.getElementById('cartModal').classList.remove('active');
    });
});

async function renderAdminOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    const res = await getDocs(collection(db, "orders"));
    list.innerHTML = res.docs.map(d => {
        const o = d.data();
        return `
            <div class="glass-panel" style="padding:1rem; margin-bottom:1rem; border-left:4px solid var(--primary)">
                <p><strong>Cliente:</strong> ${o.customer.name}</p>
                <p><strong>Total:</strong> $${o.total.toLocaleString()}</p>
                <button class="btn" onclick="deleteOrder('${d.id}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem">Completar / Eliminar</button>
            </div>`;
    }).join('');
}
window.deleteOrder = async (id) => { if (confirm("¿Marcar como completado?")) { await deleteDoc(doc(db, "orders", id)); renderAdminOrders(); } };