const $ = (s) => document.querySelector(s);
let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "{}"); // {id: qty}

const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

async function loadProducts() {
  const { data, error } = await sb.from("products").select("*").eq("active", true).order("id");
  if (error) { $("#products").innerHTML = `<p>Gagal memuat produk: ${error.message}</p>`; return; }
  products = data;
  renderProducts();
  renderCart();
}

function renderProducts() {
  $("#products").innerHTML = products.map((p) => `
    <article class="card">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="body">
        <h3>${p.name}</h3>
        <p>${p.description || ""}</p>
        <div class="price">${rupiah(p.price)} <small style="font:700 .9rem Nunito;color:var(--mid)">/ 100 g</small></div>
        <div class="stock ${p.stock < 10 ? "low" : ""}">${p.stock > 0 ? "Stok tersisa " + p.stock : "Stok habis"}</div>
        <button class="btn" data-add="${p.id}" ${p.stock < 1 ? "disabled" : ""}>Tambah ke keranjang</button>
      </div>
    </article>`).join("");
}

function renderCart() {
  const ids = Object.keys(cart).filter((id) => products.find((p) => p.id == id));
  let total = 0, count = 0;
  $("#cartItems").innerHTML = ids.length ? ids.map((id) => {
    const p = products.find((x) => x.id == id), q = cart[id];
    total += p.price * q; count += q;
    return `<div class="item"><img src="${p.image}" alt="">
      <div><b>${p.name}</b><br>${rupiah(p.price)}</div>
      <div class="qty"><button data-dec="${id}" aria-label="Kurangi">-</button><b>${q}</b><button data-inc="${id}" aria-label="Tambah">+</button></div></div>`;
  }).join("") : "<p>Keranjang masih kosong. Pilih abon favorit Anda dulu.</p>";
  $("#cartTotal").textContent = rupiah(total);
  $("#cartCount").textContent = count;
  $("#orderBtn").disabled = !ids.length;
}

function change(id, d) {
  const p = products.find((x) => x.id == id);
  const q = (cart[id] || 0) + d;
  if (q <= 0) delete cart[id];
  else if (q > p.stock) return alert("Stok " + p.name + " tinggal " + p.stock);
  else cart[id] = q;
  saveCart(); renderCart();
}

const openCart = (o) => { $("#drawer").classList.toggle("open", o); $("#overlay").classList.toggle("open", o); };

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.add) { change(t.dataset.add, 1); openCart(true); }
  if (t.dataset.inc) change(t.dataset.inc, 1);
  if (t.dataset.dec) change(t.dataset.dec, -1);
});
$("#openCart").onclick = () => openCart(true);
$("#closeCart").onclick = $("#overlay").onclick = () => openCart(false);

// Info rekening saat pilih transfer
const bank = $("#bank");
bank.innerHTML = `Transfer ke <b>${STORE.bank} ${STORE.accountNumber}</b><br>a.n. ${STORE.accountName}<br>Kirim bukti transfer lewat WhatsApp setelah memesan.`;
document.querySelectorAll("[name=pay]").forEach((r) => r.onchange = () => {
  bank.style.display = document.querySelector("[name=pay]:checked").value === "transfer" ? "block" : "none";
});
const contactLinks = [
  {
    name: "WhatsApp",
    label: STORE.whatsappDisplay || STORE.whatsapp,
    url: "https://wa.me/" + STORE.whatsapp,
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6.9 1-3.5-.3-.4A9.7 9.7 0 1 1 12 21Zm5.3-7.3c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.8 4.3.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z"/></svg>',
  },
  {
    name: "Instagram",
    label: STORE.instagram
      ? "@" + new URL(STORE.instagram).pathname.split("/").filter(Boolean)[0]
      : "",
    url: STORE.instagram,
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 2.3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2.2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm5.7-3.1a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"/></svg>',
  },
  {
    name: "Facebook",
    label: STORE.facebook
      ? new URL(STORE.facebook).pathname.split("/").filter(Boolean)[0]
      : "",
    url: STORE.facebook,
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.6 1.6-1.6h1.7V3.5c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2H7v3.1h2.8v8h3.7Z"/></svg>',
  },
].filter((link) => link.url);
const socialLinksElement = $("#socialLinks");
contactLinks.forEach(({ name, label, url, icon }) => {
  const link = document.createElement("a");
  link.className = "contact-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${name}: ${label || url}`);
  const iconElement = document.createElement("span");
  iconElement.className = `contact-icon ${name.toLowerCase()}`;
  iconElement.innerHTML = icon;
  const labelElement = document.createElement("span");
  const nameElement = document.createElement("b");
  nameElement.textContent = name;
  const accountElement = document.createElement("small");
  accountElement.textContent = label || name;
  labelElement.append(nameElement, accountElement);
  link.append(iconElement, labelElement);
  socialLinksElement.append(link);
});

$("#checkout").onsubmit = async (e) => {
  e.preventDefault();
  const btn = $("#orderBtn"), res = $("#result");
  btn.disabled = true; btn.textContent = "Memproses...";
  const items = Object.entries(cart).map(([id, qty]) => ({ id: +id, qty }));
  const pay = document.querySelector("[name=pay]:checked").value;
  const { data, error } = await sb.rpc("place_order", {
    p_name: $("#cName").value, p_phone: $("#cPhone").value, p_address: $("#cAddr").value,
    p_note: $("#cNote").value, p_payment: pay, p_items: items,
  });
  btn.textContent = "Pesan sekarang";
  if (error) { res.innerHTML = `<div class="msg err">Pesanan gagal: ${error.message}</div>`; btn.disabled = false; return; }

  const total = $("#cartTotal").textContent;
  const lines = items.map((i) => { const p = products.find((x) => x.id == i.id); return `- ${p.name} x${i.qty}`; }).join("%0A");
  const wa = `https://wa.me/${STORE.whatsapp}?text=Halo, saya ${encodeURIComponent($("#cName").value)} baru memesan:%0A${lines}%0ATotal: ${total}%0APembayaran: ${pay.toUpperCase()}%0AKode: ${data.slice(0, 8)}`;
  res.innerHTML = `<div class="msg ok">Pesanan diterima. Kode: <b>${data.slice(0, 8)}</b>.<br>Admin akan mengabari jadwal pengantaran.</div>
    <a class="btn" style="margin-top:10px;display:block;text-align:center" target="_blank" href="${wa}">Konfirmasi lewat WhatsApp</a>`;
  cart = {}; saveCart(); e.target.reset(); loadProducts();
};

loadProducts();
