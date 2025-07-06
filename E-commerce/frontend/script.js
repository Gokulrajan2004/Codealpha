// --- User Info Setup ---
const user = JSON.parse(localStorage.getItem("user"));
const cartKey = user ? `ToyCrazeCart_${user.username}` : "ToyCrazeCart_guest";

// --- Load Cart ---
let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

// --- Cart Counter ---
const cartCountSpan = document.getElementById("cart-count")?.querySelector("span");
if (cartCountSpan) cartCountSpan.textContent = cart.length;

// --- Add-to-Cart ---
document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    const card = button.closest(".card");
    const title = card.querySelector(".card-title").innerText;
    const price = card.querySelector(".card-text").innerText;
    const image = new URL(card.querySelector("img").getAttribute("src"), window.location.href).pathname;

    const existingItem = cart.find(item => item.title === title);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ title, price, image, quantity: 1 });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    if (cartCountSpan) cartCountSpan.textContent = cart.length;
  });
});

// --- Display Logged-in User ---
const welcomeEl = document.getElementById("welcome-user");
if (user && welcomeEl) {
  welcomeEl.innerHTML = `👋 Welcome, <b>${user.username}</b> 
    <button onclick="logout()" class="btn btn-sm btn-danger ms-2">Logout</button>`;
}

// --- Logout Function ---
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
