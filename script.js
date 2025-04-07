<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Snack Shop</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    #shop {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }
    .item {
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      cursor: pointer;
      transition: 0.2s;
    }
    .item:hover {
      background: #eaeaea;
    }
    #modal, #adminModal {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.6);
      display: none;
      justify-content: center;
      align-items: center;
    }
    #modal-content, #adminModalContent {
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      width: 90%;
      max-width: 400px;
    }
    button {
      margin: 10px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      background: #4CAF50;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background: #45a049;
    }
    #adminPanel {
      display: none;
      margin-top: 30px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
    }
    input {
      padding: 8px;
      width: 100%;
      margin-bottom: 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }
  </style>
</head>
<body>

  <h1>Snack Shop</h1>
  <div id="shop"></div>

  <br/>
  <button onclick="toggleAdminLogin()">🔐 Admin Login</button>

  <div id="adminPanel">
    <h2>Admin Panel</h2>
    <p>Total Sales: $<span id="totalSales">0.00</span></p>
    <button onclick="clearAllRequests()">🗑 Clear All</button>
    <div id="purchaseRequests"></div>
  </div>

  <!-- Buyer Modal -->
  <div id="modal">
    <div id="modal-content"></div>
  </div>

  <!-- Admin Login Modal -->
  <div id="adminModal">
    <div id="adminModalContent">
      <h2>Admin Login</h2>
      <input id="username" placeholder="Username" />
      <input id="password" type="password" placeholder="Password" />
      <button onclick="loginAdmin()">Login</button>
      <p id="adminMessage"></p>
    </div>
  </div>

  <!-- Script -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getDatabase, ref, push, onChildAdded, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
    let currentPurchaseKey = null;

    const shop = document.getElementById('shop');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const adminModal = document.getElementById('adminModal');
    const adminPanel = document.getElementById('adminPanel');
    const purchaseRequests = document.getElementById('purchaseRequests');
    const totalSalesSpan = document.getElementById('totalSales');

    // Render shop items
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `<h3>${item.name}</h3><p>$${item.price.toFixed(2)}</p>`;
      div.onclick = () => {
        if (isAdmin) return alert("Admins cannot purchase.");
        showPaymentOptions(item.name, item.price);
      };
      shop.appendChild(div);
    });

    function showPaymentOptions(itemName, price) {
      modal.style.display = "flex";
      modalContent.innerHTML = `
        <p>Select payment method:</p>
        <button onclick="selectPayment('paypal', '${itemName}', ${price})">PayPal</button>
        <button onclick="selectPayment('cashapp', '${itemName}', ${price})">Cash App</button>
        <button onclick="selectPayment('applepay', '${itemName}', ${price})">Apple Pay</button>
      `;
    }

    window.selectPayment = (method, itemName, price) => {
      let instructions = "";

      if (method === "paypal") {
        instructions = `
          <p>Send $${price.toFixed(2)} to:</p>
          <input type="text" value="kailanpacheco70@gmail.com" id="paypal-email" readonly />
          <button onclick="copyEmail()">📋 Copy Email</button>
          <a href="https://paypal.com" target="_blank"><button>Go to PayPal</button></a>
        `;
      } else {
        instructions = `<p>Please send $${price.toFixed(2)} using <strong>${method}</strong>.</p>`;
      }

      modalContent.innerHTML = `
        ${instructions}
        <br/><br/>
        <button onclick="confirmSend('${itemName}', ${price})">I sent the payment</button>
      `;
    };

    window.copyEmail = () => {
      const emailInput = document.getElementById("paypal-email");
      emailInput.select();
      navigator.clipboard.writeText(emailInput.value);
      alert("Email copied!");
    };

    window.confirmSend = (itemName, price) => {
      const request = {
        item: itemName,
        price: price,
        confirmed: false,
        timestamp: Date.now()
      };
      const newRef = push(ref(db, "purchaseRequests"), request);
      currentPurchaseKey = newRef.key;

      modalContent.innerHTML = `<p>Waiting for seller confirmation...</p><button onclick="closeModal()">Close</button>`;

      const requestRef = ref(db, `purchaseRequests/${currentPurchaseKey}`);
      onValue(requestRef, (snap) => {
        const data = snap.val();
        if (data && data.confirmed) showTipScreen(data.price);
      });
    };

    function showTipScreen(price) {
      modal.style.display = "flex";
      modalContent.innerHTML = `
        <p>Thanks for your purchase!</p>
        <p>Want to leave a tip?</p>
        <button onclick="thankUser(${price}, 0.2)">Tip 20%</button>
        <button onclick="thankUser(${price}, 0.3)">Tip 30%</button>
        <button onclick="thankUser(${price}, 0.5)">Tip 50%</button>
      `;
    }

    window.thankUser = (price, percent) => {
      const tip = (price * percent).toFixed(2);
      modalContent.innerHTML = `<p>You tipped $${tip}! 🎉</p><button onclick="closeModal()">Close</button>`;
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
      const msg = document.getElementById("adminMessage");

      if (user === "admin" && pass === "diddy") {
        isAdmin = true;
        msg.innerHTML = `<p style="color:green;">✅ Welcome Admin!</p>`;
        adminPanel.style.display = "block";
        adminModal.style.display = "none";
        listenForAdmin();
      } else {
        msg.innerHTML = `<p style="color:red;">❌ Incorrect credentials</p>`;
      }
    };

    function listenForAdmin() {
      const reqRef = ref(db, "purchaseRequests");
      onChildAdded(reqRef, (snap) => {
        const data = snap.val();
        if (!data.confirmed) {
          const div = document.createElement("div");
          div.id = `request-${snap.key}`;
          div.innerHTML = `
            <p><strong>${data.item}</strong> - $${data.price.toFixed(2)}</p>
            <button onclick="confirmPurchase('${snap.key}', ${data.price})">Confirm</button>
          `;
          purchaseRequests.appendChild(div);
        }
      });
    }

    window.confirmPurchase = (key, price) => {
      const requestRef = ref(db, `purchaseRequests/${key}`);
      update(requestRef, { confirmed: true });

      const el = document.getElementById(`request-${key}`);
      if (el) el.remove();

      totalSales += price;
      totalSalesSpan.textContent = totalSales.toFixed(2);
    };

    window.clearAllRequests = () => {
      const reqRef = ref(db, "purchaseRequests");
      remove(reqRef);
      purchaseRequests.innerHTML = "";
    };
  </script>
</body>
</html>
