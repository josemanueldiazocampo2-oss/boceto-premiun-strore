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

// Usuario Maestro
const USUARIO_RAIZ = { username: "JOSE", password: "281009", role: "host" };
let currentAdminUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = [];

// --- FUNCIONES DE TIENDA (CLIENTE) ---
async function renderStore() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const querySnapshot = await getDocs(collection(db, "products"));
    grid.innerHTML = "";
    querySnapshot.forEach(docSnap => {
        const p = docSnap.data();
        grid.innerHTML += `
            <div class="product-card" onclick="openProductModal('${docSnap.id}', '${p.name}', '${p.description}', ${p.price}, '${p.image}')">
                <img src="${p.image}" class="product-image">
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <h3 class="product-title">${p.name}</h3>
                    <p class="product-price">$${p.price.toLocaleString()}</p>
                </div>
            </div>`;
    });
}

window.openProductModal = (id, name, desc, price, img) => {
    const modal = document.getElementById('productModal');
    document.getElementById('modalImage').src = img;
    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalDescription').textContent = desc;
    document.getElementById('modalPrice').textContent = `$${price.toLocaleString()}`;
    const btn = document.querySelector('.add-to-cart-btn');
    btn.onclick = () => {
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
    if (list) list.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <img src="${item.img}" width="40">
            <div style="flex:1; margin-left:10px;">${item.name}</div>
            <div>$${item.price.toLocaleString()}</div>
            <button onclick="removeFromCart(${i})" style="color:red; background:none; border:none; margin-left:10px; cursor:pointer;">×</button>
        </div>`).join('');
    if (total) total.textContent = `$${cart.reduce((s, i) => s + i.price, 0).toLocaleString()}`;
}

window.removeFromCart = (i) => { cart.splice(i, 1); updateCartUI(); };

// --- FUNCIONES DE ADMINISTRACIÓN ---
window.handleLogin = async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    if (u === USUARIO_RAIZ.username && p === USUARIO_RAIZ.password) {
        currentAdminUser = USUARIO_RAIZ;
    } else {
        const q = query(collection(db, "team"), where("username", "==", u), where("password", "==", p));
        const res = await getDocs(q);
        if (res.empty) return alert("Error de acceso");
        currentAdminUser = res.docs[0].data();
    }
    localStorage.setItem('currentUser', JSON.stringify(currentAdminUser));
    location.reload();
};

window.addProduct = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "products"), {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value
    });
    alert("Producto en la nube");
    location.reload();
};

async function renderAdminOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    const res = await getDocs(collection(db, "orders"));
    list.innerHTML = res.docs.map(d => {
        const o = d.data();
        return `<div class="glass-panel order-card">
            <p><strong>${o.customer.name}</strong> - $${o.total.toLocaleString()}</p>
            <p>Télefono: ${o.customer.contact}</p>
            <button class="btn" onclick="completeOrder('${d.id}')">Completar</button>
        </div>`;
    }).join('');
}

window.completeOrder = async (id) => { await deleteDoc(doc(db, "orders", id)); renderAdminOrders(); };

// --- INICIO ---
document.addEventListener('DOMContentLoaded', () => {
    renderStore();
    if (currentAdminUser) {
        const adminInt = document.getElementById('adminInterface');
        if (adminInt) adminInt.style.display = 'block';
        const loginScr = document.getElementById('loginScreen');
        if (loginScr) loginScr.style.display = 'none';
        renderAdminOrders();
    }
    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const order = {
            customer: { name: document.getElementById('cName').value, contact: document.getElementById('cContact').value },
            items: cart, total: cart.reduce((s, i) => s + i.price, 0), date: new Date().toLocaleString()
        };
        await addDoc(collection(db, "orders"), order);
        alert("¡Pedido enviado!");
        cart = []; updateCartUI();
    });
});