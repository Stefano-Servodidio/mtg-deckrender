import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StreamController, createSSEStream, SSE_HEADERS } from '../stream'

describe('stream utilities', () => {
    describe('StreamController', () => {
        let mockController: ReadableStreamDefaultController<Uint8Array>

        beforeEach(() => {
            mockController = {
                enqueue: vi.fn(),
                close: vi.fn()
            } as unknown as ReadableStreamDefaultController<Uint8Array>
        })

        it('should send SSE formatted messages', () => {
            const controller = new StreamController(mockController)
            const data = { type: 'progress', current: 1, total: 10 }

            controller.send(data)

            expect(mockController.enqueue).toHaveBeenCalledTimes(1)
            const [encoded] = (mockController.enqueue as any).mock.calls[0]
            const decoded = new TextDecoder().decode(encoded)
            expect(decoded).toBe(`data: ${JSON.stringify(data)}\n\n`)
        })

        it('should close the underlying controller', () => {
            const controller = new StreamController(mockController)

            controller.close()

            expect(mockController.close).toHaveBeenCalledTimes(1)
        })

        it('should handle multiple sends', () => {
            const controller = new StreamController(mockController)

            controller.send({ type: 'progress', current: 1, total: 10 })
            controller.send({ type: 'progress', current: 2, total: 10 })
            controller.send({ type: 'complete', message: 'Done' })

            expect(mockController.enqueue).toHaveBeenCalledTimes(3)
        })

        it('should encode complex objects correctly', () => {
            const controller = new StreamController(mockController)
            const complexData = {
                type: 'progress',
                data: {
                    nested: {
                        value: 'test'
                    },
                    array: [1, 2, 3]
                }
            }

            controller.send(complexData)

            const [encoded] = (mockController.enqueue as any).mock.calls[0]
            const decoded = new TextDecoder().decode(encoded)
            expect(decoded).toContain(JSON.stringify(complexData))
        })
    })

    describe('SSE_HEADERS', () => {
        it('should have correct headers for SSE', () => {
            expect(SSE_HEADERS).toEqual({
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no'
            })
        })
    })

    describe('createSSEStream', () => {
        it('should create a Response with ReadableStream', async () => {
            const handler = vi.fn(async () => {})
            const response = createSSEStream(handler)

            expect(response).toBeInstanceOf(Response)
            expect(response.body).toBeInstanceOf(ReadableStream)
        })

        it('should include SSE headers', () => {
            const handler = vi.fn(async () => {})
            const response = createSSEStream(handler)

            expect(response.headers.get('Content-Type')).toBe(
                'text/plain; charset=utf-8'
            )
            expect(response.headers.get('Cache-Control')).toBe('no-cache')
            expect(response.headers.get('Connection')).toBe('keep-alive')
            expect(response.headers.get('X-Accel-Buffering')).toBe('no')
        })

        it('should merge additional headers', () => {
            const handler = vi.fn(async () => {})
            const response = createSSEStream(handler, {
                'X-Custom-Header': 'test-value'
            })

            expect(response.headers.get('X-Custom-Header')).toBe('test-value')
            expect(response.headers.get('Content-Type')).toBe(
                'text/plain; charset=utf-8'
            )
        })

        it('should call handler with StreamController', async () => {
            let capturedController: StreamController | null = null
            const handler = vi.fn(async (controller: StreamController) => {
                capturedController = controller
            })

            const response = createSSEStream(handler)

            // Read the stream to trigger the handler
            const reader = response.body!.getReader()
            await reader.read()

            expect(handler).toHaveBeenCalledTimes(1)
            expect(capturedController).toBeInstanceOf(StreamController)
        })

        it('should send messages through the stream', async () => {
            const handler = async (controller: StreamController) => {
                controller.send({ type: 'test', message: 'Hello' })
            }

            const response = createSSEStream(handler)
            const reader = response.body!.getReader()

            const { value, done } = await reader.read()
            expect(done).toBe(false)

            const decoded = new TextDecoder().decode(value)
            expect(decoded).toContain('"type":"test"')
            expect(decoded).toContain('"message":"Hello"')
        })

        it('should handle handler errors gracefully', async () => {
            const handler = async (controller: StreamController) => {
                controller.send({ type: 'start' })
                throw new Error('Test error')
            }

            const consoleError = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {})
            const response = createSSEStream(handler)
            const reader = response.body!.getReader()

            const messages: string[] = []
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                messages.push(new TextDecoder().decode(value))
            }

            const allMessages = messages.join('')
            expect(allMessages).toContain('"type":"start"')
            expect(allMessages).toContain('"type":"error"')
            expect(consoleError).toHaveBeenCalled()

            consoleError.mockRestore()
        })

        it('should always close the stream', async () => {
            const handler = async (controller: StreamController) => {
                controller.send({ type: 'message' })
            }

            const response = createSSEStream(handler)
            const reader = response.body!.getReader()

            // Read all chunks
            while (true) {
                const { done } = await reader.read()
                if (done) break
            }

            // If we reach here without hanging, the stream was properly closed
            expect(true).toBe(true)
        })

        it('should close stream even when handler throws', async () => {
            const handler = async () => {
                throw new Error('Test error')
            }

            const consoleError = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {})
            const response = createSSEStream(handler)
            const reader = response.body!.getReader()

            // Read all chunks
            let chunks = 0
            while (true) {
                const { done } = await reader.read()
                chunks++
                if (done) break
                if (chunks > 10) throw new Error('Stream did not close')
            }

            consoleError.mockRestore()
        })
    })
})
