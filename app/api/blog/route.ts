import { NextRequest, NextResponse } from 'next/server'
import chalk from 'chalk'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'
import {
    getPublishedBlogPostsMetadata,
    getBlogPostBySlug
} from '@/utils/storage/blogStorage'

// Mark route as dynamic since we use searchParams
export const dynamic = 'force-dynamic'

/**
 * GET /api/blog - Get all published blog posts (metadata only)
 * GET /api/blog?slug=post-slug - Get a single blog post by slug (full content)
 */
export async function GET(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('GET /api/blog')))

        const { searchParams } = new URL(request.url)
        const slug = searchParams.get('slug')

        if (slug) {
            // Get single post by slug
            const post = await getBlogPostBySlug(slug)

            if (!post) {
                return NextResponse.json(
                    { error: 'Blog post not found' },
                    { status: 404 }
                )
            }

            // Only return published posts via public API
            if (!post.published) {
                return NextResponse.json(
                    { error: 'Blog post not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json({ post })
        }

        // Get all published posts (metadata only)
        const posts = await getPublishedBlogPostsMetadata()

        return NextResponse.json({
            posts,
            count: posts.length
        })
    } catch (error) {
        console.error(chalk.red('Error fetching blog posts:'), error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
