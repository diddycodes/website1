import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onValue,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase config
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
  { name: "Hot Cheetos", price: 2.5 },
  { name: "Mountain Dew", price: 1.75 },
  { name: "Twix", price: 1.25 },
  { name: "Red Bull", price: 3.0 },
  { name: "Takis", price: 2.75 },
  { name: "Pepsi", price: 1.5 },
  { name: "Gummy Worms", price: 1.0 },
  { name: "KitKat", price: 1.3 },
  { name: "Water Bottle", price: 1.0 },
  { name: "Random Snack", price: 2.0 },
  { name: "Energy Shot", price: 2.99 }
];

let totalSales = 0;
let isAdmin = false;
let currentPurchaseKey = null;

const shop = document.getElementById("shop");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const modalText = document.getElementById("modal-text");
const adminModal = document.getElementById("adminModal");
const adminPanel = document.getElementById("adminPanel");
const purchaseRequests = document.getElementById("purchaseRequests");
const totalSalesSpan = document.getElementById("totalSales");

// Show items
items.forEach(item => {
  const div = document.createElement("div");
  div.className = "item";
  div.innerHTML = `<h3>${item.name}</h3><p>$${item.price.toFixed(2)}</p>`;
  div.onclick = () => {
    if (isAdmin) {
      alert("Admins cannot buy items.");
      return;
    }
    sendPurchaseRequest(item.name, item.price);
  };
  shop.appendChild(div);
});

function sendPurchaseRequest(itemName, price) {
  const request = {
    item: itemName,
    price: price,
    confirmed: false,
    timestamp: Date.now()
  };
  const newRequestRef = push(ref(db, "purchaseRequests"), request);
  currentPurchaseKey = newRequestRef.key;
  modal.style.display = "flex";
  modalText.textContent = "Waiting for seller to confirm proof of purchase...";

  // Watch for confirmation
  const requestRef = ref(db, `purchaseRequests/${currentPurchaseKey}`);
  onValue(requestRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.confirmed) {
      showTipScreen(data.price);
    }
  });
}

function showTipScreen(price) {
  modalContent.innerHTML = `
    <p>Thank you for your purchase!</p>
    <p>Select a tip amount:</p>
    <button onclick="thankUser(20, ${price})">Tip 20%</button>
    <button onclick="thankUser(30, ${price})">Tip 30%</button>
    <button onclick="thankUser(50, ${price})">Tip 50%</button>
  `;
}

window.thankUser = (tip, base) => {
  const tipAmount = base * (tip / 100);
  totalSales += tipAmount;
  totalSalesSpan.textContent = totalSales.toFixed(2);
  modalContent.innerHTML = `
    <p>Thanks for buying and tipping <strong>${tip}%</strong>! 🎉</p>
    <button onclick="closeModal()" style="margin-top:20px; padding:10px 20px; background:#4CAF50; color:white; border:none; border-radius:8px;">Close</button>
  `;
};

window.closeModal = () => {
  modal.style.display = "none";
};

window.toggleAdminLogin = () => {
  adminModal.style.display = "flex";
};

window.loginAdmin = () => {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "admin" && pass === "diddy") {
    isAdmin = true;
    adminPanel.style.display = "block";
    adminModal.style.display = "none";
    document.getElementById("adminMessage").innerHTML = '<p style="color: green;">✅ Logged in as Admin</p>';
    setTimeout(() => {
      document.getElementById("adminMessage").innerHTML = "";
    }, 3000);
    listenForAdmin();
  } else {
    document.getElementById("adminMessage").innerHTML = '<p style="color: red;">❌ Incorrect credentials</p>';
  }
};

function listenForAdmin() {
  const requestsRef = ref(db, "purchaseRequests");
  onChildAdded(requestsRef, (snapshot) => {
    const data = snapshot.val();
    const key = snapshot.key;
    if (!data.confirmed) {
      const div = document.createElement("div");
      div.id = `request-${key}`;
      div.innerHTML = `
        <p><strong>${data.item}</strong> - $${data.price.toFixed(2)}</p>
        <button onclick="confirmPurchase('${key}', ${data.price})">Confirm</button>
      `;
      purchaseRequests.appendChild(div);
    }
  });
}

window.confirmPurchase = (key, price) => {
  const requestRef = ref(db, `purchaseRequests/${key}`);
  update(requestRef, { confirmed: true });

  const requestDiv = document.getElementById(`request-${key}`);
  if (requestDiv) requestDiv.remove();

  totalSales += price;
  totalSalesSpan.textContent = totalSales.toFixed(2);
};

window.clearAllRequests = () => {
  const requestsRef = ref(db, "purchaseRequests");
  remove(requestsRef);
  purchaseRequests.innerHTML = "";
};
