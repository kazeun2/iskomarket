/* @vitest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'b1' } }) }))
vi.mock('../../src/contexts/ChatContext', () => ({ useChatOptional: () => ({ refreshConversations: async () => {} }) }))

// Mock the message service so tests can control message lists
const mockGetMessages = vi.fn()
const mockSendMessage = vi.fn()
vi.mock('../../src/services/messageService', () => ({
  getMessages: (opts: any) => mockGetMessages(opts),
  getOrCreateConversation: async () => 'conv-1',
  findConversationBetween: async () => null,
  subscribeToMessages: () => () => {},
  markAsRead: async () => ({}),
  sendMessage: (payload: any) => mockSendMessage(payload),
  sendMessageWithAutoReply: (payload: any) => mockSendMessage(payload),
  getConversationHeader: async () => ({ data: null, error: null }),
}))

import { ChatModal } from '../../src/components/ChatModal'

describe('ChatModal input behavior', () => {
  it('allows typing multiple characters into the message textarea', async () => {
    mockGetMessages.mockResolvedValueOnce({ data: [], error: null })

    render(
      <ChatModal
        isOpen={true}
        onClose={() => {}}
        currentUser={{ id: 'b1' } as any}
        otherUser={{ id: 's1' } as any}
        recipient={{ id: 's1' } as any}
        product={{ id: 99, title: 'Product', price: 100 }}
      />,
    )

    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
    // Ensure focus is kept while typing multiple characters in succession
    fireEvent.focus(textarea)
    fireEvent.change(textarea, { target: { value: 'h' } })
    expect(textarea.value).toBe('h')
    expect(document.activeElement).toBe(textarea)

    fireEvent.change(textarea, { target: { value: 'hi' } })
    expect(textarea.value).toBe('hi')
    expect(document.activeElement).toBe(textarea)

    // also test multi-character paste style update
    fireEvent.change(textarea, { target: { value: 'hello world' } })
    expect(textarea.value).toBe('hello world')
    expect(document.activeElement).toBe(textarea)
  })

  it('disables Choose meet-up button when current user has not sent a message', async () => {
    mockGetMessages.mockResolvedValueOnce({ data: [], error: null })

    render(
      <ChatModal
        isOpen={true}
        onClose={() => {}}
        currentUser={{ id: 'b1' } as any}
        otherUser={{ id: 's1' } as any}
        recipient={'s1'}
        product={{ id: 99, title: 'Product', price: 100 }}
      />,
    )

    const btn = await screen.findByTitle('Choose meet-up date')
    expect(btn).toBeDisabled()
  })

  it('enables Choose meet-up button when current user has previously sent a message', async () => {
    const now = new Date().toISOString()
    mockGetMessages.mockResolvedValueOnce({ data: [{ id: 'm1', message: 'hello', sender_id: 'b1', receiver_id: 's1', created_at: now, is_read: true }], error: null })

    render(
      <ChatModal
        isOpen={true}
        onClose={() => {}}
        currentUser={{ id: 'b1' } as any}
        otherUser={{ id: 's1' } as any}
        recipient={'s1'}
        product={{ id: 99, title: 'Product', price: 100 }}
      />,
    )

    const btn = await screen.findByTitle('Choose meet-up date')
    expect(btn).toBeEnabled()
  })

  it('does not clear input when message send fails', async () => {
    mockGetMessages.mockResolvedValueOnce({ data: [], error: null })
    // Simulate sendMessage failing (server error)
    mockSendMessage.mockResolvedValueOnce({ data: null, error: { message: 'failed' } })

    render(
      <ChatModal
        isOpen={true}
        onClose={() => {}}
        currentUser={{ id: 'b1' } as any}
        otherUser={{ id: 's1' } as any}
        recipient={'s1'}
        product={{ id: 99, title: 'Product', price: 100 }}
      />,
    )

    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'please do not clear' } })
    expect(textarea.value).toBe('please do not clear')

    // submit
    const sendBtn = screen.getByText('➤')
    fireEvent.click(sendBtn)

    // After a failed send, the textarea should still contain the same text
    expect(textarea.value).toBe('please do not clear')
  })

  it('keeps focus when messages are appended (no typing lock)', async () => {
    vi.useFakeTimers();
    // Initially no messages so auto-welcome will be sent when modal opens
    mockGetMessages.mockResolvedValueOnce({ data: [], error: null })

    render(
      <ChatModal
        isOpen={true}
        onClose={() => {}}
        currentUser={{ id: 'b1' } as any}
        otherUser={{ id: 's1' } as any}
        recipient={'s1'}
        product={{ id: 99, title: 'Product', price: 100 }}
      />,
    )

    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
    // focus and type a character
    fireEvent.focus(textarea)
    fireEvent.change(textarea, { target: { value: 'h' } })
    expect(textarea.value).toBe('h')
    expect(document.activeElement).toBe(textarea)

    // Advance time to let the auto-welcome insert a message (1500ms in implementation)
    vi.advanceTimersByTime(1600)

    // The textarea should remain focused and keep the typed value
    expect(document.activeElement).toBe(textarea)
    expect(textarea.value).toBe('h')

    vi.useRealTimers();
  })
})