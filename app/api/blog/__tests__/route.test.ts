import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock maintenance mode
vi.mock('@/utils/maintenance', () => ({
    isMaintenanceMode: vi.fn(() => false),
    maintenanceResponse: vi.fn(() =>
        Response.json({ error: 'Maintenance mode' }, { status: 503 })
    )
}))

// Mock blog storage
vi.mock('@/utils/storage/blogStorage', () => ({
    getPublishedBlogPostsMetadata: vi.fn(),
    getBlogPostBySlug: vi.fn()
}))

describe('GET /api/blog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const mockPosts = [
        {
            id: 'post-1',
            title: 'Test Post 1',
            slug: 'test-post-1',
            excerpt: 'Excerpt 1',
            author: { name: 'Author 1' },
            tags: ['test'],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            published: true
        },
        {
            id: 'post-2',
            title: 'Test Post 2',
            slug: 'test-post-2',
            excerpt: 'Excerpt 2',
            author: { name: 'Author 2' },
            tags: ['test'],
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            published: true
        }
    ]

    describe('List all published posts', () => {
        it('should return all published posts', async () => {
            const { getPublishedBlogPostsMetadata } = await import(
                '@/utils/storage/blogStorage'
            )
            vi.mocked(getPublishedBlogPostsMetadata).mockResolvedValue(
                mockPosts
            )

            const request = new NextRequest('http://localhost:3000/api/blog')
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.posts).toHaveLength(2)
            expect(data.count).toBe(2)
        })

        it('should return empty array when no posts', async () => {
            const { getPublishedBlogPostsMetadata } = await import(
                '@/utils/storage/blogStorage'
            )
            vi.mocked(getPublishedBlogPostsMetadata).mockResolvedValue([])

            const request = new NextRequest('http://localhost:3000/api/blog')
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.posts).toEqual([])
            expect(data.count).toBe(0)
        })
    })

    describe('Get single post by slug', () => {
        it('should return post when found', async () => {
            const { getBlogPostBySlug } = await import(
                '@/utils/storage/blogStorage'
            )
            const fullPost = {
                ...mockPosts[0],
                content: '# Test Post\n\nThis is the content'
            }
            vi.mocked(getBlogPostBySlug).mockResolvedValue(fullPost)

            const request = new NextRequest(
                'http://localhost:3000/api/blog?slug=test-post-1'
            )
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.post.id).toBe('post-1')
            expect(data.post.content).toBe('# Test Post\n\nThis is the content')
        })

        it('should return 404 when post not found', async () => {
            const { getBlogPostBySlug } = await import(
                '@/utils/storage/blogStorage'
            )
            vi.mocked(getBlogPostBySlug).mockResolvedValue(null)

            const request = new NextRequest(
                'http://localhost:3000/api/blog?slug=non-existent'
            )
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toBe('Blog post not found')
        })

        it('should return 404 for unpublished posts', async () => {
            const { getBlogPostBySlug } = await import(
                '@/utils/storage/blogStorage'
            )
            const unpublishedPost = {
                ...mockPosts[0],
                published: false,
                content: 'Content'
            }
            vi.mocked(getBlogPostBySlug).mockResolvedValue(unpublishedPost)

            const request = new NextRequest(
                'http://localhost:3000/api/blog?slug=test-post-1'
            )
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toBe('Blog post not found')
        })
    })

    describe('Error handling', () => {
        it('should handle internal errors', async () => {
            const { getPublishedBlogPostsMetadata } = await import(
                '@/utils/storage/blogStorage'
            )
            vi.mocked(getPublishedBlogPostsMetadata).mockRejectedValue(
                new Error('Database error')
            )

            const request = new NextRequest('http://localhost:3000/api/blog')
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe('Internal server error')
        })
    })

    describe('Maintenance mode', () => {
        it('should return maintenance response when in maintenance mode', async () => {
            const { isMaintenanceMode, maintenanceResponse } = await import(
                '@/utils/maintenance'
            )
            vi.mocked(isMaintenanceMode).mockReturnValue(true)

            const request = new NextRequest('http://localhost:3000/api/blog')
            const response = await GET(request)

            expect(isMaintenanceMode).toHaveBeenCalled()
            expect(maintenanceResponse).toHaveBeenCalled()
        })
    })
})
