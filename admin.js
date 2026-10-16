const $ = (s) => document.querySelector(s);
const STATUS = ["baru", "dibayar", "diproses", "diantar", "selesai", "batal"];
let orders = [], prods = [];

async function init() {
  const { data } = await sb.auth.getSession();
  data.session ? showPanel() : ($("#loginForm").classList.remove("hide"));
}

$("#loginForm").onsubmit = async (e) => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $("#email").value, password: $("#pass").value });
  if (error) $("#loginMsg").innerHTML = `<div class="msg err">Login gagal: ${error.message}</div>`;
  else showPanel();
};
$("#logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };

async function showPanel() {
  $("#loginForm").classList.add("hide");
  $("#panel").classList.remove("hide");
  $("#logout").classList.remove("hide");
  await refresh();
}

async function refresh() {
  const [o, p] = await Promise.all([
    sb.from("orders").select("*").order("created_at", { ascending: false }),
    sb.from("products").select("*").order("id"),
  ]);
  orders = o.data || []; prods = p.data || [];
  renderStats(); renderOrders(); renderStock();
}

function renderStats() {
  const valid = orders.filter((o) => o.status !== "batal");
  const revenue = orders.filter((o) => ["dibayar", "diproses", "diantar", "selesai"].includes(o.status) || (o.payment_method === "cod" && o.status === "selesai"))
    .reduce((s, o) => s + o.total, 0);
  $("#stats").innerHTML = `
    <div class="stat">Pesanan baru<b>${orders.filter((o) => o.status === "baru").length}</b></div>
    <div class="stat">Perlu diantar<b>${orders.filter((o) => ["dibayar", "diproses", "diantar"].includes(o.status)).length}</b></div>
    <div class="stat">Total pesanan<b>${valid.length}</b></div>
    <div class="stat">Pendapatan<b>${rupiah(revenue)}</b></div>`;
}

function renderOrders() {
  $("#orders").innerHTML = orders.length ? orders.map((o) => `
    <div class="order">
      <div class="top">
        <div><b>${o.customer_name}</b> <span class="tag">${o.payment_method.toUpperCase()}</span><br>
          <small>${new Date(o.created_at).toLocaleString("id-ID")} &middot; Kode ${o.id.slice(0, 8)}</small></div>
        <b>${rupiah(o.total)}</b>
      </div>
      <p>${o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</p>
      <p><a target="_blank" href="https://wa.me/${o.phone.replace(/^0/, "62").replace(/\D/g, "")}">${o.phone}</a> &middot; ${o.address}${o.note ? " &middot; Catatan: " + o.note : ""}</p>
      <div class="ctrl">
        <div><label>Status</label><select id="st-${o.id}">${STATUS.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div><label>Jadwal antar</label><input type="date" id="dt-${o.id}" value="${o.delivery_date || ""}"></div>
        <button class="btn dark" data-save-order="${o.id}">Simpan</button>
      </div>
    </div>`).join("") : "<p>Belum ada pesanan masuk.</p>";
}

function renderStock() {
  $("#stock").innerHTML = prods.map((p) => `
    <div class="prow">
      <img src="${p.image}" alt="">
      <div><b>${p.name}</b><br><small>${p.flavor || ""}</small></div>
      <div><label>Harga</label><input type="number" id="pr-${p.id}" value="${p.price}"></div>
      <div><label>Stok</label><input type="number" id="sk-${p.id}" value="${p.stock}" min="0"></div>
      <button class="btn dark" data-save-prod="${p.id}">Simpan</button>
    </div>`).join("");
}

document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.dataset.tab) {
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b === t));
    $("#orders").classList.toggle("hide", t.dataset.tab !== "orders");
    $("#stock").classList.toggle("hide", t.dataset.tab !== "stock");
  }
  if (t.dataset.saveOrder) {
    const id = t.dataset.saveOrder;
    const { error } = await sb.from("orders").update({
      status: $("#st-" + id).value, delivery_date: $("#dt-" + id).value || null,
    }).eq("id", id);
    if (error) return alert("Gagal menyimpan: " + error.message);
    // Pesanan dibatalkan: kembalikan stok
    const o = orders.find((x) => x.id === id);
    if ($("#st-" + id).value === "batal" && o.status !== "batal") {
      for (const i of o.items) {
        const p = prods.find((x) => x.id === i.id);
        if (p) await sb.from("products").update({ stock: p.stock + i.qty }).eq("id", p.id);
      }
    }
    t.textContent = "Tersimpan"; await refresh();
  }
  if (t.dataset.saveProd) {
    const id = t.dataset.saveProd;
    const { error } = await sb.from("products").update({
      price: +$("#pr-" + id).value, stock: +$("#sk-" + id).value,
    }).eq("id", id);
    if (error) return alert("Gagal menyimpan: " + error.message);
    t.textContent = "Tersimpan";
  }
});

init();
