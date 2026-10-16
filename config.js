// ISI DENGAN DATA ANDA (Supabase > Project Settings > API)
const SUPABASE_URL = "https://xmohazrbijqanzhejlps.supabase.co/";
const SUPABASE_ANON_KEY = "sb_publishable_Wr2SUADJT52Nw4_fm3kULw_O52tOllw";

// Info toko
const STORE = {
  name: "Fish Floss by Gacor16",
  whatsapp: "6281339515121", // format 62..., tanpa + atau 0 di depan
  whatsappDisplay: "0813-3951-5121",
  instagram:
    "https://www.instagram.com/fishfloss_gacor16?utm_source=qr&mdxt=MWExdGp3Ym1mb2x5dA==", // URL profil Instagram, contoh: https://www.instagram.com/username/
  facebook: "https://www.facebook.com/profile.php?id=61594567025221", // URL halaman Facebook, contoh: https://www.facebook.com/namahalaman
  bank: "BRI",
  accountNumber: "027601053905507",
  accountName: "Flavia Stivany Fahik",
};

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
