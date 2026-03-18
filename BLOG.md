# Blog Feature Documentation

## Overview

The blog feature allows you to create, manage, and display blog posts on the MTG Deck to PNG website. Blog posts are stored in Netlify Blobs and can be managed via GitHub Actions or directly through the API.

## Architecture

### Storage

- **Netlify Blobs**: Blog posts are stored as JSON objects in a dedicated blob store named `blog-posts`
- **Images**: Blog post images (cover images, inline images) are stored with the prefix `image-` in the same blob store
- **Persistence**: Data persists across deployments and is available in both production and deploy-preview environments

### API Endpoints

#### Public API (GET /api/blog)

- **List all published posts**: `GET /api/blog` - Returns metadata for all published blog posts
- **Get single post**: `GET /api/blog?slug=post-slug` - Returns full content of a published post by slug

#### Admin API (requires authentication)

- **List all posts**: `GET /api/blog/admin` - Returns all posts (including unpublished)
- **Get single post**: `GET /api/blog/admin?id=post-id` - Returns full content by ID
- **Create post**: `POST /api/blog/admin` - Creates a new blog post
- **Update post**: `PUT /api/blog/admin` - Updates an existing blog post
- **Delete post**: `DELETE /api/blog/admin?id=post-id` - Deletes a blog post

### Authentication

The admin API uses Bearer token authentication. Set the `ADMIN_AUTH_TOKEN` environment variable in Netlify:

```bash
# In Netlify dashboard: Site settings > Environment variables
ADMIN_AUTH_TOKEN=your-secure-random-token-here
```

Requests must include the header:

```
Authorization: Bearer your-secure-random-token-here
```

## Managing Blog Posts

### Option 1: GitHub Actions (Recommended)

The easiest way to manage blog posts is through the GitHub Actions workflow:

1. Go to your repository on GitHub
2. Click on **Actions** tab
3. Select **Manage Blog Post** workflow
4. Click **Run workflow**
5. Fill in the form:
    - **Action**: Choose create, update, delete, or list
    - **Title**: Post title
    - **Slug**: URL-friendly identifier (e.g., "my-first-post")
    - **Excerpt**: Short description for post previews
    - **Content**: Full post content (Markdown supported)
    - **Author Name**: Author's name
    - **Author Avatar**: (Optional) URL to author's avatar image
    - **Cover Image**: (Optional) URL to cover image
    - **Tags**: Comma-separated tags (e.g., "mtg,tutorial,tips")
    - **Published**: Check to publish immediately, uncheck for draft

### Option 2: Direct API Calls

You can also manage posts via direct API calls using curl or any HTTP client:

#### Create a new post

```bash
curl -X POST https://your-site.netlify.app/api/blog/admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "slug": "my-first-post",
    "excerpt": "This is a short description of my post",
    "content": "# Hello World\n\nThis is the full content of my post.",
    "author": {
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "coverImage": "https://example.com/cover.jpg",
    "tags": ["mtg", "tutorial"],
    "published": true
  }'
```

#### Update a post

```bash
curl -X PUT https://your-site.netlify.app/api/blog/admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "post-1234567890-abc123",
    "title": "Updated Title",
    "published": true
  }'
```

#### Delete a post

```bash
curl -X DELETE "https://your-site.netlify.app/api/blog/admin?id=post-1234567890-abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### List all posts

```bash
curl -X GET https://your-site.netlify.app/api/blog/admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Image Support

### Cover Images

Cover images are displayed in the blog post cards on the home page. You can use any publicly accessible image URL.

### Inline Images

For blog post content, you can use Markdown image syntax:

```markdown
![Alt text](https://example.com/image.jpg)
```

### Uploading Images to Netlify Blobs

You can store images directly in Netlify Blobs for better performance and reliability:

```bash
# This requires custom implementation or using Netlify Blobs API directly
# The storage utility provides saveBlogImage() function for this purpose
```

## Setup Instructions

### 1. Environment Variables

Add to Netlify environment variables:

```bash
# Required for admin API access
ADMIN_AUTH_TOKEN=your-secure-random-token-here

# Already configured for Netlify Blobs
NETLIFY_SITE_ID=your-site-id
NETLIFY_AUTH_TOKEN=your-netlify-token
```

### 2. GitHub Secrets

Add to GitHub repository secrets for the workflow:

```bash
# Repository > Settings > Secrets and variables > Actions
ADMIN_AUTH_TOKEN=your-secure-random-token-here
NETLIFY_DEPLOY_URL=https://your-site.netlify.app
```

### 3. Netlify Blobs

Netlify Blobs is already enabled in `netlify.toml`. The `blog-posts` store is automatically created on first use.

## Frontend Integration

The blog section is automatically displayed on the home page. It shows the 3 most recent published posts. The component gracefully handles:

- **Loading states**: Displays skeleton loaders while fetching
- **Empty states**: Hides the section if no posts exist
- **Error states**: Silently fails to prevent breaking the page

### BlogSection Component

```tsx
import BlogSection from '@/components/BlogSection'

// In your page
;<BlogSection maxPosts={3} />
```

### Custom Blog Pages

To create a dedicated blog page or individual post pages, you can use the public API:

```tsx
// app/blog/page.tsx - List all posts
const response = await fetch('/api/blog')
const { posts } = await response.json()

// app/blog/[slug]/page.tsx - Single post
const response = await fetch(`/api/blog?slug=${slug}`)
const { post } = await response.json()
```

## Blog Post Schema

```typescript
interface BlogPost {
    id: string // Auto-generated unique ID
    title: string // Post title
    slug: string // URL-friendly identifier
    excerpt: string // Short description
    content: string // Full content (Markdown supported)
    author: {
        name: string // Author name
        avatar?: string // Optional avatar URL
    }
    coverImage?: string // Optional cover image URL
    tags: string[] // Array of tags
    createdAt: string // ISO 8601 timestamp
    updatedAt: string // ISO 8601 timestamp
    published: boolean // Publication status
}
```

## Best Practices

1. **Slugs**: Use lowercase, hyphen-separated strings (e.g., "my-awesome-post")
2. **Excerpts**: Keep under 150 characters for best display
3. **Images**: Use high-quality images with good aspect ratios (16:9 recommended for covers)
4. **Content**: Use Markdown for formatting blog post content
5. **Tags**: Use consistent, descriptive tags (3-5 tags per post recommended)
6. **Drafts**: Use `published: false` to save drafts before publishing

## Troubleshooting

### Posts not showing up

- Check that `published: true`
- Verify Netlify Blobs environment variables are set
- Check browser console for API errors

### Authentication errors

- Verify `ADMIN_AUTH_TOKEN` is set in Netlify
- Check that the token matches in GitHub secrets
- Ensure the Authorization header is correctly formatted

### Images not loading

- Verify image URLs are publicly accessible
- Check CORS settings if using external image hosts
- Consider hosting images in Netlify Blobs for reliability

## Future Enhancements

Possible improvements:

- Rich text editor UI for easier content creation
- Image upload directly to Netlify Blobs
- Comments system
- Social sharing buttons
- RSS feed
- Search functionality
- Categories in addition to tags
- Related posts suggestions
