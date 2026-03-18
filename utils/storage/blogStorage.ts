import { getStore } from '@netlify/blobs'
import chalk from 'chalk'
import { BlogPost, BlogPostMetadata } from '@/types/blog'

// Lazy initialization of the blob store
let blogStore: ReturnType<typeof getStore> | null = null

function getBlogStore() {
    if (!blogStore) {
        const config: any = { name: 'blog-posts' }

        // Only explicitly set credentials if we're NOT on Netlify (local dev)
        if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
            config.siteID = process.env.NETLIFY_SITE_ID
            config.token = process.env.NETLIFY_AUTH_TOKEN
        }

        blogStore = getStore(config)
    }
    return blogStore
}

const DEV_DEBUG_DISABLE_BLOBS = process.env.NODE_ENV === 'development' && false

/**
 * Get all blog posts metadata (for listing)
 */
export async function getAllBlogPostsMetadata(): Promise<BlogPostMetadata[]> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(chalk.yellow('(Dev Mode) Skipping fetch from Blobs'))
        return []
    }

    try {
        const { blobs } = await getBlogStore().list()
        const posts: BlogPostMetadata[] = []

        for (const blob of blobs) {
            // Skip image blobs (they start with 'image-')
            if (blob.key.startsWith('image-')) continue

            const post = await getBlogStore().get(blob.key, { type: 'json' })
            if (post) {
                const blogPost = post as BlogPost
                posts.push({
                    id: blogPost.id,
                    title: blogPost.title,
                    slug: blogPost.slug,
                    excerpt: blogPost.excerpt,
                    author: blogPost.author,
                    coverImage: blogPost.coverImage,
                    tags: blogPost.tags,
                    createdAt: blogPost.createdAt,
                    updatedAt: blogPost.updatedAt,
                    published: blogPost.published
                })
            }
        }

        // Sort by createdAt descending (newest first)
        return posts.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        )
    } catch (error) {
        console.error(
            chalk.red('Error retrieving blog posts from Blobs'),
            error
        )
        return []
    }
}

/**
 * Get published blog posts metadata only
 */
export async function getPublishedBlogPostsMetadata(): Promise<
    BlogPostMetadata[]
> {
    const allPosts = await getAllBlogPostsMetadata()
    return allPosts.filter((post) => post.published)
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(chalk.yellow(`(Dev Mode) Skipping fetch from Blobs: ${id}`))
        return null
    }

    try {
        const post = await getBlogStore().get(id, { type: 'json' })
        return post as BlogPost | null
    } catch (error) {
        console.error(
            chalk.red(`Error retrieving blog post from Blobs: ${id}`),
            error
        )
        return null
    }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(
    slug: string
): Promise<BlogPost | null> {
    const allPosts = await getAllBlogPostsMetadata()
    const post = allPosts.find((p) => p.slug === slug)

    if (!post) return null

    return getBlogPostById(post.id)
}

/**
 * Save a blog post to Netlify Blobs
 */
export async function saveBlogPost(post: BlogPost): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping save to Blobs: ${post.id}`)
        )
        return
    }

    try {
        await getBlogStore().set(post.id, JSON.stringify(post))
        console.log(chalk.green(`Saved blog post to Blobs: ${post.id}`))
    } catch (error) {
        console.error(
            chalk.red(`Error saving blog post to Blobs: ${post.id}`),
            error
        )
        throw error
    }
}

/**
 * Delete a blog post from Netlify Blobs
 */
export async function deleteBlogPost(id: string): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping delete from Blobs: ${id}`)
        )
        return
    }

    try {
        await getBlogStore().delete(id)
        console.log(chalk.green(`Deleted blog post from Blobs: ${id}`))
    } catch (error) {
        console.error(
            chalk.red(`Error deleting blog post from Blobs: ${id}`),
            error
        )
        throw error
    }
}

/**
 * Save a blog post image to Netlify Blobs
 */
export async function saveBlogImage(
    imageId: string,
    buffer: Buffer,
    contentType: string = 'image/jpeg'
): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping save image to Blobs: ${imageId}`)
        )
        return
    }

    try {
        const key = `image-${imageId}`
        await getBlogStore().set(key, buffer as any, {
            metadata: { contentType } as any
        })
        console.log(chalk.green(`Saved blog image to Blobs: ${key}`))
    } catch (error) {
        console.error(
            chalk.red(`Error saving blog image to Blobs: ${imageId}`),
            error
        )
        throw error
    }
}

/**
 * Get a blog post image from Netlify Blobs
 */
export async function getBlogImage(imageId: string): Promise<Buffer | null> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(
                `(Dev Mode) Skipping fetch image from Blobs: ${imageId}`
            )
        )
        return null
    }

    try {
        const key = `image-${imageId}`
        const result = await getBlogStore().get(key, { type: 'arrayBuffer' })
        if (!result) return null

        return Buffer.from(result)
    } catch (error) {
        console.error(
            chalk.red(`Error retrieving blog image from Blobs: ${imageId}`),
            error
        )
        return null
    }
}

/**
 * Delete a blog post image from Netlify Blobs
 */
export async function deleteBlogImage(imageId: string): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(
                `(Dev Mode) Skipping delete image from Blobs: ${imageId}`
            )
        )
        return
    }

    try {
        const key = `image-${imageId}`
        await getBlogStore().delete(key)
        console.log(chalk.green(`Deleted blog image from Blobs: ${key}`))
    } catch (error) {
        console.error(
            chalk.red(`Error deleting blog image from Blobs: ${imageId}`),
            error
        )
        throw error
    }
}

// Export for testing
export const __testing__ = {
    resetStore: () => {
        blogStore = null
    }
}
