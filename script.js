import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, update, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAwrXlL0oaON4pE4Ko9LEZsBj1PI5YqtkM",
  authDomain: "website-4f366.firebaseapp.com",
  databaseURL: "https://website-4f366-default-rtdb.firebaseio.com",
  projectId: "website-4f366",
  storageBucket: "website-4f366.appspot.com",
  messagingSenderId: "915291737784",
  appId: "1:915291737784:web:5f5b0a2803f29d299d6e4d",
  measurementId: "G-GSTM5TR39X"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const items = [
  { name: 'Hot Cheetos', price: 2.5 },
  { name: 'Mountain Dew', price: 1.75 },
  { name: 'Twix', price: 1.25 },
  { name: 'Red Bull', price: 3.00 },
  { name: 'Takis', price: 2.75 },
  { name: 'Pepsi', price: 1.50 },
  { name: 'Gummy Worms', price: 1.00 },
  { name: 'KitKat', price: 1.30 },
  { name: 'Water Bottle', price: 1.00 },
  { name: 'Random Snack', price: 2.00 },
  { name: 'Energy Shot', price: 2.99 }
];

let totalSales = 0;
let isAdmin = false;
const shop = document.getElementById('shop');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const modalText = document.getElementById('modal-text');
const adminModal = document.getElementById('adminModal');
const adminPanel = document.getElementById('adminPanel');
const purchaseRequests = document.getElementById('purchaseRequests');
const totalSalesSpan = document.getElementById('totalSales');

// Display all items with smooth animations
items.forEach(item => {
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `<h3>${item.name}</h3><p>$${item.price.toFixed(2)}</p>`;
  div.onclick = () => {
    if (isAdmin) {
      alert('Admins cannot buy items.');
      return;
    }
    askPaymentMethod(item);
  };
  shop.appendChild(div);
});

// Ask for payment method
function askPaymentMethod(item) {
  modal.style.display = 'flex';
  modalContent.innerHTML = `
    <h3>How are you paying?</h3>
    <button onclick="sendPurchaseRequest('${item.name}', ${item.price}, 'PayPal')">PayPal</button>
    <button onclick="sendPurchaseRequest('${item.name}', ${item.price}, 'CashApp')">CashApp</button>
    <button onclick="sendPurchaseRequest('${item.name}', ${item.price}, 'Apple Pay')">Apple Pay</button>
  `;
}

// Send Purchase Request to Firebase
window.sendPurchaseRequest = (item, price, method) => {
  const request = {
    item,
    price,
    method,
    confirmed: false,
    timestamp: Date.now()
  };
  const newRequestRef = push(ref(db, 'purchaseRequests'), request);
  modalContent.innerHTML = `
    <p>Send your payment via ${method}</p>
    ${method === 'PayPal' ? `
      <p>Send to: <strong>kailanpacheco70@gmail.com</strong></p>
      <button onclick="navigator.clipboard.writeText('kailanpacheco70@gmail.com')">Copy Email</button>
      <a href="https://www.paypal.com" target="_blank">Go to PayPal</a>
    ` : '<p>Please complete your payment and wait for confirmation.</p>'}
    <p>Waiting for seller to confirm purchase...</p>
    <button onclick="closeModal()">Close</button>
  `;
};

// Admin listens for purchases
window.listenForAdmin = () => {
  const requestsRef = ref(db, 'purchaseRequests');
  onChildAdded(requestsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data.confirmed) {
      const div = document.createElement('div');
      div.id = snapshot.key;
      div.innerHTML = `
        <p><strong>${data.item}</strong> - $${data.price} via ${data.method}</p>
        <button onclick="confirmPurchase('${snapshot.key}', ${data.price})">Confirm</button>
      `;
      purchaseRequests.appendChild(div);
    }
  });
};

// Admin confirms purchase
window.confirmPurchase = (key, price) => {
  const requestRef = ref(db, `purchaseRequests/${key}`);
  update(requestRef, { confirmed: true });

  // Update total sales
  totalSales += price;
  totalSalesSpan.textContent = totalSales.toFixed(2);

  // Show success message and tip options for the buyer
  modal.style.display = 'flex';
  modalContent.innerHTML = `
    <p>Thank you for your purchase!</p>
    <p>Choose a tip:</p>
    <button onclick="thankUser(20)">Tip 20%</button>
    <button onclick="thankUser(30)">Tip 30%</button>
    <button onclick="thankUser(50)">Tip 50%</button>
  `;
};

// Show thank you message and close modal
window.thankUser = (tip) => {
  modalContent.innerHTML = `<p>Thanks for tipping ${tip}%! 🎉</p><button onclick="closeModal()">Close</button>`;
};

// Close the modal
window.closeModal = () => {
  modal.style.display = 'none';
};

// Admin login and panel
window.toggleAdminLogin = function() {
  adminModal.style.display = 'flex';
};

window.loginAdmin = function() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  if (user === 'admin' && pass === 'diddy') {
    isAdmin = true;
    adminPanel.style.display = 'block';
    adminModal.style.display = 'none';
    document.getElementById('adminMessage').textContent = '✅ Logged in as Admin';
    listenForAdmin();
  } else {
    document.getElementById('adminMessage').textContent = '❌ Incorrect credentials';
  }
};

window.clearAllRequests = () => {
  const requestsRef = ref(db, 'purchaseRequests');
  remove(requestsRef);
  purchaseRequests.innerHTML = '';
};

