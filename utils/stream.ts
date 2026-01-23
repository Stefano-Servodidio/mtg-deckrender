/**
 * Shared utilities for ReadableStream implementation in API routes
 * Provides common patterns for Server-Sent Events (SSE) streaming
 */

/**
 * Singleton TextEncoder instance to avoid creating new instances repeatedly
 */
class StreamEncoder {
    private static instance: TextEncoder

    static getInstance(): TextEncoder {
        if (!StreamEncoder.instance) {
            StreamEncoder.instance = new TextEncoder()
        }
        return StreamEncoder.instance
    }

    /**
     * Encode a string to Uint8Array
     */
    static encode(text: string): Uint8Array {
        return StreamEncoder.getInstance().encode(text)
    }
}

/**
 * Wrapper for ReadableStreamDefaultController to simplify enqueueing SSE messages
 */
export class StreamController {
    private controller: ReadableStreamDefaultController<Uint8Array>

    constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
        this.controller = controller
    }

    /**
     * Send a Server-Sent Event message
     * @param data - The data object to send (will be JSON stringified)
     */
    send(data: unknown): void {
        const message = `data: ${JSON.stringify(data)}\n\n`
        this.controller.enqueue(StreamEncoder.encode(message))
    }

    /**
     * Close the stream
     */
    close(): void {
        this.controller.close()
    }
}

/**
 * Standard SSE response headers for streaming
 */
export const SSE_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
} as const

/**
 * Create a ReadableStream for Server-Sent Events with a start handler
 * @param startHandler - Async function that receives a StreamController
 * @param headers - Optional additional headers to merge with SSE_HEADERS
 * @returns Response with ReadableStream body and appropriate headers
 */
export function createSSEStream(
    startHandler: (_controller: StreamController) => Promise<void>,
    headers?: Record<string, string>
): Response {
    const stream = new ReadableStream({
        async start(controller) {
            const streamController = new StreamController(controller)
            try {
                await startHandler(streamController)
            } catch (error) {
                console.error('Error in SSE stream:', error)
                streamController.send({
                    type: 'error',
                    error: 'Internal server error',
                    message: 'An unexpected error occurred'
                })
            } finally {
                streamController.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            ...SSE_HEADERS,
            ...(headers || {})
        }
    })
}
