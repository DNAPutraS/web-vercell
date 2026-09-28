'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ok = (r) => { if (r.error) throw r.error; return r.data; };

// Kecilkan gambar ke maks 1600px agar hemat kuota penyimpanan gratis
async function shrink(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
}

function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setMsg('Email atau password salah.');
  };
  return (
    <div className="card" style={{ maxWidth: 380 }}>
      <h2>Masuk admin</h2>
      <label htmlFor="e">Email</label>
      <input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="p">Password</label>
      <input id="p" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div className="row" style={{ marginTop: 14 }}><button className="btn primary" onClick={submit}>Masuk</button></div>
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}

function Editor({ post, onDone }) {
  const [title, setTitle] = useState(post?.title || '');
  const [desc, setDesc] = useState(post?.description || '');
  const [imgs, setImgs] = useState(() => [...(post?.post_images || [])].sort((a, b) => a.position - b.position));
  const [removed, setRemoved] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= imgs.length) return;
    const a = [...imgs];
    [a[i], a[j]] = [a[j], a[i]];
    setImgs(a);
  };
  const cover = (i) => setImgs([imgs[i], ...imgs.filter((_, n) => n !== i)]);
  const drop = (i) => { setRemoved([...removed, imgs[i]]); setImgs(imgs.filter((_, n) => n !== i)); };

  const save = async () => {
    if (!title.trim()) return setMsg('Judul wajib diisi.');
    setBusy(true); setMsg('');
    try {
      let id = post?.id;
      if (id) ok(await supabase.from('posts').update({ title, description: desc }).eq('id', id));
      else id = ok(await supabase.from('posts').insert({ title, description: desc }).select().single()).id;

      if (removed.length) {
        await supabase.storage.from('images').remove(removed.map((r) => r.path));
        ok(await supabase.from('post_images').delete().in('id', removed.map((r) => r.id)));
      }
      for (let i = 0; i < imgs.length; i++) {
        ok(await supabase.from('post_images').update({ position: i }).eq('id', imgs[i].id));
      }
      const rows = [];
      for (const f of files) {
        const blob = await shrink(f);
        const ext = blob === f ? f.name.split('.').pop().toLowerCase() : 'jpg';
        const path = `${id}/${crypto.randomUUID()}.${ext}`;
        ok(await supabase.storage.from('images').upload(path, blob, { contentType: blob.type }));
        const url = supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
        rows.push({ post_id: id, path, url, position: imgs.length + rows.length });
      }
      if (rows.length) ok(await supabase.from('post_images').insert(rows));
      onDone();
    } catch (e) {
      setMsg('Gagal menyimpan: ' + (e.message || e));
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>{post ? 'Edit postingan' : 'Postingan baru'}</h2>
      <label htmlFor="t">Judul</label>
      <input id="t" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="d">Deskripsi</label>
      <textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} />

      {imgs.length > 0 && (
        <>
          <label>Gambar (yang pertama jadi sampul)</label>
          <div className="edimgs">
            {imgs.map((im, i) => (
              <figure key={im.id}>
                <img src={im.url} alt="" />
                <figcaption>
                  <button onClick={() => move(i, -1)} title="Geser ke kiri">←</button>
                  <button onClick={() => move(i, 1)} title="Geser ke kanan">→</button>
                  <button onClick={() => cover(i)} title="Jadikan sampul">Sampul</button>
                  <button onClick={() => drop(i)} title="Hapus" style={{ color: '#c0392b' }}>Hapus</button>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      <label htmlFor="f">Tambah gambar</label>
      <input id="f" type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
      {files.length > 0 && <div className="muted">{files.length} gambar baru akan diunggah.</div>}

      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
        <button className="btn" disabled={busy} onClick={() => onDone()}>Batal</button>
      </div>
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // null = daftar, {} = baru, post = edit

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = async () => {
    const { data } = await supabase.from('posts').select('*,post_images(*)').order('created_at', { ascending: false });
    setPosts(data || []);
  };
  useEffect(() => { if (session) load(); }, [session]);

  const remove = async (p) => {
    if (!confirm(`Hapus "${p.title}" beserta semua gambarnya?`)) return;
    if (p.post_images.length) await supabase.storage.from('images').remove(p.post_images.map((i) => i.path));
    await supabase.from('posts').delete().eq('id', p.id);
    load();
  };

  if (session === undefined) return <p className="muted">Memuat...</p>;
  if (!session) return <Login />;

  if (editing) {
    return <Editor post={editing.id ? editing : null} onDone={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Kelola postingan</h2>
        <div className="row">
          <button className="btn primary" onClick={() => setEditing({})}>Postingan baru</button>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Keluar</button>
        </div>
      </div>
      {posts.length === 0 && <p className="muted">Belum ada postingan. Klik "Postingan baru" untuk mulai.</p>}
      {posts.map((p) => (
        <div key={p.id} className="list-item">
          <a href={`/post/${p.id}`} target="_blank" rel="noreferrer">{p.title} <span className="muted">({p.post_images.length} foto)</span></a>
          <div className="row">
            <button className="btn" onClick={() => setEditing(p)}>Edit</button>
            <button className="btn danger" onClick={() => remove(p)}>Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
}
