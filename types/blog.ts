export interface BlogPost {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    author: {
        name: string
        avatar?: string
    }
    coverImage?: string
    tags: string[]
    createdAt: string
    updatedAt: string
    published: boolean
}

export interface BlogPostMetadata {
    id: string
    title: string
    slug: string
    excerpt: string
    author: {
        name: string
        avatar?: string
    }
    coverImage?: string
    tags: string[]
    createdAt: string
    updatedAt: string
    published: boolean
}

export interface CreateBlogPostRequest {
    title: string
    slug: string
    excerpt: string
    content: string
    author: {
        name: string
        avatar?: string
    }
    coverImage?: string
    tags: string[]
    published?: boolean
}

export interface UpdateBlogPostRequest {
    id: string
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    author?: {
        name: string
        avatar?: string
    }
    coverImage?: string
    tags?: string[]
    published?: boolean
}

export type BlogPostBySlugResponse = { post: BlogPost }
export type BlogPostsResponse = { posts: BlogPostMetadata[]; count: number }
