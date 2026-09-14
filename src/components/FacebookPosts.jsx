import SectionTitle from './SectionTitle.jsx'
import FacebookEmbed from './FacebookEmbed.jsx'
import { useVisibleFacebookPosts } from '../hooks/useVisibleFacebookPosts.js'
import { facebookPage } from '../data/site.js'
import { relativeTime } from '../lib/format.js'
import './FacebookPosts.css'

const maxPosts = 3

export default function FacebookPosts() {
  const { posts, loading } = useVisibleFacebookPosts(maxPosts)

  if (loading) {
    return null
  }

  if (posts.length === 0) {
    return <FacebookEmbed />
  }

  return (
    <section className="fbwall">
      <SectionTitle linkLabel="Facebook oldal" linkHref={facebookPage}>
        Facebook
      </SectionTitle>

      {posts.map((post) => (
        <a className="fbpost" href={post.permalink_url} target="_blank" rel="noreferrer" key={post.id}>
          {post.image_url && <img src={post.image_url} alt="" loading="lazy" />}
          <div className="fbpost-body">
            <span className="fbpost-date">{relativeTime(post.created_time)}</span>
            {post.message && <p>{post.message}</p>}
          </div>
        </a>
      ))}
    </section>
  )
}
