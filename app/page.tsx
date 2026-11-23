"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";

type Weapon = {
  id: number;
  name: string;
  type: string;
  caliber: string;
  year: string;
  notes: string;
  image?: string;
};

const seed: Weapon[] = [
  { id: 1, name: "Type 56 Assault Rifle", type: "Assault rifle", caliber: "7.62x39mm", year: "1956", notes: "Chinese-built version of the Soviet AK-47 pattern.", image: "/weapon1.jpg" },
  { id: 2, name: "Type 54 Pistol", type: "Pistol", caliber: "7.62x25mm", year: "1954", notes: "Chinese-built version of the Soviet Tokarev TT-33.", image: "/weapon2.jpg" },
  { id: 3, name: "Type 63 Rifle", type: "Rifle", caliber: "7.62x39mm", year: "1963", notes: "Selective-fire rifle developed from the SKS design.", image: "/weapon3.jpg" },
  { id: 4, name: "Type 81 Rifle", type: "Assault rifle", caliber: "7.62x39mm", year: "1981", notes: "Introduced in the early 1980s as a replacement for older rifles.", image: "/weapon4.jpg" },
];

const emptyForm = { name: "", type: "", caliber: "", year: "", notes: "", image: "" };

// Resize the chosen image so it fits comfortably in localStorage
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  // READ: load saved data (or seed data on first visit)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("weapons");
      if (saved) {
        const data: Weapon[] = JSON.parse(saved);
        setWeapons(
          data.map((w) => {
            const original = seed.find((s) => s.id === w.id);
            return !w.image && original?.image ? { ...w, image: original.image } : w;
          })
        );
      } else {
        setWeapons(seed);
      }
    } catch {
      setWeapons(seed);
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-save on every change
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("weapons", JSON.stringify(weapons));
    } catch {
      alert("Storage is full. Try a smaller image or delete some entries.");
    }
  }, [weapons, ready]);

  function update(field: keyof typeof emptyForm, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function pickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readImage(file);
      setForm((f) => ({ ...f, image: data }));
    } catch {
      alert("Could not read that image.");
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setFileKey((k) => k + 1);
  }

  // CREATE & UPDATE
  function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.type.trim()) return;

    if (editId === null) {
      setWeapons([...weapons, { id: Date.now(), ...form }]);
    } else {
      setWeapons(weapons.map((w) => (w.id === editId ? { ...w, ...form } : w)));
      setEditId(null);
    }
    resetForm();
  }

  function startEdit(w: Weapon) {
    setEditId(w.id);
    setForm({
      name: w.name,
      type: w.type,
      caliber: w.caliber,
      year: w.year,
      notes: w.notes,
      image: w.image ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    resetForm();
  }

  // DELETE
  function remove(id: number) {
    setWeapons(weapons.filter((w) => w.id !== id));
    if (editId === id) cancelEdit();
  }

  return (
    <main className="container">
      <h1 className="title">Chinese Cold War Infantry Arms Library</h1>
      <p className="subtitle">A catalog of small arms used by Chinese infantry, 1950s–1980s.</p>

      <form onSubmit={save} className="form">
        <input className="field" placeholder="Name (e.g. Type 56 Assault Rifle)" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <input className="field" placeholder="Type (e.g. Rifle, Pistol, Machine gun)" value={form.type} onChange={(e) => update("type", e.target.value)} />
        <input className="field" placeholder="Caliber (e.g. 7.62x39mm)" value={form.caliber} onChange={(e) => update("caliber", e.target.value)} />
        <input className="field" placeholder="Year adopted (e.g. 1956)" value={form.year} onChange={(e) => update("year", e.target.value)} />
        <textarea className="field textarea" placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />

        <label className="label">Photo (optional)</label>
        <input key={fileKey} type="file" accept="image/*" onChange={pickImage} className="field file-field" />

        {form.image && (
          <div className="preview-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image} alt="Preview" className="preview" />
            <button type="button" className="btn btn-gray" onClick={() => { update("image", ""); setFileKey((k) => k + 1); }}>
              Remove photo
            </button>
          </div>
        )}

        <button type="submit" className="btn btn-primary">
          {editId === null ? "Add Weapon" : "Save Changes"}
        </button>
        {editId !== null && (
          <button type="button" className="btn btn-gray" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </form>

      {weapons.length === 0 && <p>No weapons in the library yet.</p>}

      {weapons.map((w) => (
        <div key={w.id} className="card">
          {w.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.image} alt={w.name} className="card-img" />
          )}
          <h3 className="card-title">{w.name}</h3>
          <p className="card-meta">
            {w.type} • {w.caliber} • Adopted {w.year}
          </p>
          <p className="card-notes">{w.notes}</p>
          <button className="btn btn-edit" onClick={() => startEdit(w)}>Edit</button>
          <button className="btn btn-delete" onClick={() => remove(w.id)}>Delete</button>
        </div>
      ))}
    </main>
  );
}