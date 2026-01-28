import { NextRequest, NextResponse } from 'next/server'
import chalk from 'chalk'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'
import {
    getAllBlogPostsMetadata,
    getBlogPostById,
    saveBlogPost,
    deleteBlogPost
} from '@/utils/storage/blogStorage'
import { BlogPost, CreateBlogPostRequest } from '@/types/blog'

// Mark route as dynamic since we use searchParams and authentication
export const dynamic = 'force-dynamic'

/**
 * Simple authentication check using a secret token
 */
function isAuthenticated(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.BLOG_ADMIN_TOKEN

    if (!expectedToken) {
        console.warn(
            chalk.yellow(
                'BLOG_ADMIN_TOKEN not set - admin API will reject all requests'
            )
        )
        return false
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false
    }

    const token = authHeader.substring(7)
    return token === expectedToken
}

/**
 * GET /api/blog/admin - Get all blog posts (including unpublished)
 * Requires authentication
 */
export async function GET(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('GET /api/blog/admin')))

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            // Get single post by ID
            const post = await getBlogPostById(id)

            if (!post) {
                return NextResponse.json(
                    { error: 'Blog post not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json({ post })
        }

        // Get all posts (including unpublished)
        const posts = await getAllBlogPostsMetadata()

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

/**
 * POST /api/blog/admin - Create a new blog post
 * Requires authentication
 */
export async function POST(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/blog/admin')))

        const body: CreateBlogPostRequest = await request.json()

        // Validate required fields
        if (
            !body.title ||
            !body.slug ||
            !body.excerpt ||
            !body.content ||
            !body.author?.name
        ) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: title, slug, excerpt, content, author.name'
                },
                { status: 400 }
            )
        }

        // Check if slug already exists
        const existingPosts = await getAllBlogPostsMetadata()
        if (existingPosts.some((p) => p.slug === body.slug)) {
            return NextResponse.json(
                { error: 'A post with this slug already exists' },
                { status: 409 }
            )
        }

        // Create new blog post
        const now = new Date().toISOString()
        const post: BlogPost = {
            id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: body.title,
            slug: body.slug,
            excerpt: body.excerpt,
            content: body.content,
            author: body.author,
            coverImage: body.coverImage,
            tags: body.tags || [],
            createdAt: now,
            updatedAt: now,
            published: body.published ?? false
        }

        await saveBlogPost(post)

        return NextResponse.json(
            { post, message: 'Blog post created successfully' },
            { status: 201 }
        )
    } catch (error) {
        console.error(chalk.red('Error creating blog post:'), error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/blog/admin - Update an existing blog post
 * Requires authentication
 */
export async function PUT(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('PUT /api/blog/admin')))

        const body = await request.json()

        if (!body.id) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 }
            )
        }

        // Get existing post
        const existingPost = await getBlogPostById(body.id)

        if (!existingPost) {
            return NextResponse.json(
                { error: 'Blog post not found' },
                { status: 404 }
            )
        }

        // Check if slug is being changed and if new slug already exists
        if (body.slug && body.slug !== existingPost.slug) {
            const existingPosts = await getAllBlogPostsMetadata()
            if (existingPosts.some((p) => p.slug === body.slug)) {
                return NextResponse.json(
                    { error: 'A post with this slug already exists' },
                    { status: 409 }
                )
            }
        }

        // Update post
        const updatedPost: BlogPost = {
            ...existingPost,
            ...body,
            updatedAt: new Date().toISOString()
        }

        await saveBlogPost(updatedPost)

        return NextResponse.json({
            post: updatedPost,
            message: 'Blog post updated successfully'
        })
    } catch (error) {
        console.error(chalk.red('Error updating blog post:'), error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/blog/admin?id=<post-id> - Delete a blog post
 * Requires authentication
 */
export async function DELETE(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('DELETE /api/blog/admin')))

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required parameter: id' },
                { status: 400 }
            )
        }

        // Check if post exists
        const existingPost = await getBlogPostById(id)

        if (!existingPost) {
            return NextResponse.json(
                { error: 'Blog post not found' },
                { status: 404 }
            )
        }

        await deleteBlogPost(id)

        return NextResponse.json({ message: 'Blog post deleted successfully' })
    } catch (error) {
        console.error(chalk.red('Error deleting blog post:'), error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
