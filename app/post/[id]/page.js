import { supabase } from '../../../lib/supabase';
import Lightbox from '../../../components/Lightbox';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }) {
  const { data: post } = await supabase
    .from('posts')
    .select('id,title,description,created_at,post_images(url,position)')
    .eq('id', params.id)
    .maybeSingle();

  if (!post) return <p className="muted">Postingan tidak ditemukan. <a href="/">Kembali ke galeri</a></p>;

  const images = [...post.post_images].sort((a, b) => a.position - b.position).map((i) => i.url);
  const date = new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <article>
      <p><a href="/" className="muted">Kembali ke galeri</a></p>
      <h1>{post.title}</h1>
      <div className="muted">{date}</div>
      {post.description && <p className="desc">{post.description}</p>}
      <Lightbox images={images} title={post.title} />
    </article>
  );
}
