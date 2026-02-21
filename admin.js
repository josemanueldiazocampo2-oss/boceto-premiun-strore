import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

let currentAdmin = null;
const MAIN_ADMIN = { username: 'JOSE', password: '281009', role: 'host' };

function checkSession() {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
        try {
            currentAdmin = JSON.parse(session);
            showAdminInterface();
        } catch (e) {
            sessionStorage.removeItem('adminSession');
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminInterface').style.display = 'none';
}

function showAdminInterface() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminInterface').style.display = 'block';
    document.getElementById('currentUserDisplay').textContent = `Administrador: ${currentAdmin.username}`;
    loadOrders();
}

window.handleLogin = async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim().toUpperCase();
    const password = document.getElementById('loginPassword').value;

    if (username === MAIN_ADMIN.username && password === MAIN_ADMIN.password) {
        currentAdmin = { username: MAIN_ADMIN.username, role: MAIN_ADMIN.role };
        sessionStorage.setItem('adminSession', JSON.stringify(currentAdmin));
        showAdminInterface();
        return;
    }

    try {
        const q = query(collection(db, "admins"), where("username", "==", username));
        const snap = await getDocs(q);
        if (snap.empty) { alert('Credenciales incorrectas'); return; }
        const data = snap.docs[0].data();
        if (data.password === password) {
            currentAdmin = { username: data.username, role: data.role || 'admin', id: snap.docs[0].id };
            sessionStorage.setItem('adminSession', JSON.stringify(currentAdmin));
            showAdminInterface();
        } else { alert('Credenciales incorrectas'); }
    } catch (error) { alert('Error de verificación'); }
};

window.logout = function() {
    sessionStorage.removeItem('adminSession');
    currentAdmin = null;
    location.reload();
};

window.switchTab = function(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}Section`)?.classList.add('active');
    if (tab === 'orders') loadOrders();
    else if (tab === 'products') loadProducts();
    else if (tab === 'team') loadTeam();
};

async function loadOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Cargando...</p>';
    try {
        const snap = await getDocs(collection(db, "orders"));
        list.innerHTML = '';
        if (snap.empty) { list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Sin pedidos</p>'; return; }
        const orders = []; snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        orders.forEach(o => {
            const card = document.createElement('div');
            card.className = 'order-card glass-panel';
            card.innerHTML = `<div class="order-header"><div><div class="order-date">${o.date}</div><div style="color:var(--text-muted);font-size:0.85rem">#${o.id.slice(-6)}</div></div><div class="order-total">$${o.total.toLocaleString()}</div></div><div class="order-customer"><strong>${o.customer.name}</strong><br>📞 ${o.customer.contact}<br>🪪 ${o.customer.cedula}<br>📍 ${o.customer.address}</div><div class="order-items">${o.items.map(i => `<div class="order-item"><img src="${i.img}" class="order-item-img"><div class="order-item-info"><span>${i.name}</span><span style="color:var(--primary);font-weight:bold">$${i.price.toLocaleString()}</span></div></div>`).join('')}</div><button onclick="deleteOrder('${o.id}')" class="delete-btn" style="width:100%">🗑️ Eliminar</button>`;
            list.appendChild(card);
        });
    } catch (e) { list.innerHTML = '<p style="text-align:center;color:#ef4444">Error</p>'; }
}

window.deleteOrder = async function(id) {
    if (!confirm('¿Eliminar pedido?')) return;
    try { await deleteDoc(doc(db, "orders", id)); alert('Eliminado'); loadOrders(); }
    catch (e) { alert('Error'); }
};

async function loadProducts() {
    const list = document.getElementById('inventoryList');
    list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Cargando...</p>';
    try {
        const snap = await getDocs(collection(db, "products"));
        list.innerHTML = '';
        if (snap.empty) { list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Sin productos</p>'; return; }
        snap.forEach(d => {
            const p = d.data();
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `<img src="${p.image}" class="item-thumbnail"><div class="item-details"><div style="font-weight:bold">${p.name}</div><div style="color:var(--text-muted);font-size:0.85rem">${p.category} • $${p.price.toLocaleString()}</div></div><button onclick="deleteProduct('${d.id}')" class="delete-btn">🗑️</button>`;
            list.appendChild(item);
        });
    } catch (e) { list.innerHTML = '<p style="text-align:center;color:#ef4444">Error</p>'; }
}

window.addProduct = async function(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value.trim();
    const image = document.getElementById('productImage').value.trim();
    const desc = document.getElementById('productDescription').value.trim();
    if (!name || !price || !category || !image) { alert('Completa campos obligatorios'); return; }
    try {
        await addDoc(collection(db, "products"), { name, price, category, image, description: desc || 'Sin descripción' });
        alert('Producto agregado'); e.target.reset(); document.getElementById('imagePreview').innerHTML = ''; loadProducts();
    } catch (e) { alert('Error'); }
};

window.deleteProduct = async function(id) {
    if (!confirm('¿Eliminar producto?')) return;
    try { await deleteDoc(doc(db, "products", id)); alert('Eliminado'); loadProducts(); }
    catch (e) { alert('Error'); }
};

window.previewImage = function() {
    const url = document.getElementById('productImage').value.trim();
    const preview = document.getElementById('imagePreview');
    if (url) preview.innerHTML = `<div class="image-preview"><img src="${url}" onerror="this.src='https://via.placeholder.com/300x150?text=Error'"><button type="button" onclick="clearImage()" class="remove-image-btn">×</button></div>`;
    else preview.innerHTML = '';
};
window.clearImage = function() { document.getElementById('productImage').value = ''; document.getElementById('imagePreview').innerHTML = ''; };

async function loadTeam() {
    const list = document.getElementById('teamList');
    let html = `<div class="team-member"><div class="member-avatar">J</div><div class="member-info"><div class="member-name">JOSE</div><div class="member-role host">👑 Principal</div></div></div>`;
    try {
        const snap = await getDocs(collection(db, "admins"));
        snap.forEach(d => {
            const a = d.data();
            const isMe = currentAdmin.username === a.username;
            html += `<div class="team-member"><div class="member-avatar">${a.username.charAt(0)}</div><div class="member-info"><div class="member-name">${a.username} ${isMe ? '(Tú)' : ''}</div><div class="member-role admin">🔧 Admin</div></div>${currentAdmin.role === 'host' ? `<button onclick="deleteAdmin('${d.id}')" class="delete-btn">🗑️</button>` : ''}</div>`;
        });
        list.innerHTML = html;
    } catch (e) { list.innerHTML = html + '<p style="color:#ef4444">Error</p>'; }
}

window.addAdmin = async function(e) {
    e.preventDefault();
    if (currentAdmin.role !== 'host') { alert('Solo el principal puede agregar'); return; }
    const username = document.getElementById('newAdminUsername').value.trim().toUpperCase();
    const password = document.getElementById('newAdminPassword').value;
    if (!username || !password) { alert('Completa todos los campos'); return; }
    if (username === 'JOSE') { alert('No puedes usar ese nombre'); return; }
    if (password.length < 4) { alert('Mínimo 4 caracteres'); return; }
    try {
        const q = query(collection(db, "admins"), where("username", "==", username));
        const snap = await getDocs(q);
        if (!snap.empty) { alert('Ya existe'); return; }
        await addDoc(collection(db, "admins"), { username, password, role: 'admin', createdAt: new Date().toISOString() });
        alert('Administrador agregado'); e.target.reset(); loadTeam();
    } catch (e) { alert('Error'); }
};

window.deleteAdmin = async function(id) {
    if (!confirm('¿Eliminar administrador?')) return;
    try { await deleteDoc(doc(db, "admins", id)); alert('Eliminado'); loadTeam(); }
    catch (e) { alert('Error'); }
};

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    document.getElementById('productImage')?.addEventListener('input', previewImage);
});
