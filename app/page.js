import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: posts } = await supabase
    .from('posts')
    .select('id,title,description,post_images(url,position)')
    .order('created_at', { ascending: false });

  if (!posts || posts.length === 0) {
    return <p className="muted">Belum ada postingan.</p>;
  }

  return (
    <div className="grid">
      {posts.map((p) => {
        const imgs = [...p.post_images].sort((a, b) => a.position - b.position);
        return (
          <a key={p.id} href={`/post/${p.id}`} className="post" style={{ position: 'relative' }}>
            {imgs[0] ? <img className="cover" src={imgs[0].url} alt={p.title} loading="lazy" /> : <div className="cover" />}
            {imgs.length > 1 && <span className="badge">{imgs.length} foto</span>}
            <div className="meta">
              <h2>{p.title}</h2>
              {p.description && <p>{p.description}</p>}
            </div>
          </a>
        );
      })}
    </div>
  );
}
