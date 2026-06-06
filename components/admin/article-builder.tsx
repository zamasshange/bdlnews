'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Delete, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const blockTypes = [
  { value: 'heading', label: 'Heading' },
  { value: 'subheading', label: 'Subheading' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'image', label: 'Image' },
  { value: 'image_gallery', label: 'Image Gallery' },
  { value: 'quote', label: 'Quote' },
  { value: 'video', label: 'Video' },
  { value: 'embed', label: 'Embed' },
  { value: 'fact_box', label: 'Fact Box' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'pull_quote', label: 'Pull Quote' },
  { value: 'ai_summary', label: 'AI Summary Block' },
  { value: 'custom_html', label: 'Custom HTML' },
] as const

type BlockType = (typeof blockTypes)[number]['value']

type Block = {
  id: string
  type: BlockType
  text?: string
  url?: string
  alt?: string
  caption?: string
  items?: string[]
  html?: string
}

function createBlock(type: BlockType): Block {
  const id = `block-${Math.random().toString(36).slice(2, 10)}`
  return {
    id,
    type,
    text: type === 'paragraph' ? '' : type === 'heading' ? '' : type === 'subheading' ? '' : '',
    url: '',
    alt: '',
    caption: '',
    items: type === 'image_gallery' || type === 'timeline' || type === 'statistics' ? [''] : [],
    html: type === 'custom_html' ? '' : undefined,
  }
}

export function ArticleBuilder({ initialContent, headline, subtitle }: { initialContent?: string; headline?: string; subtitle?: string }) {
  const blocksFromContent = useMemo<Block[]>(() => {
    if (!initialContent) return [{ ...createBlock('paragraph'), text: '' }]
    try {
      const parsed = JSON.parse(initialContent)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, index) => ({
          id: `block-${index}-${Math.random().toString(36).slice(2, 8)}`,
          ...item,
        }))
      }
    } catch {
      if (initialContent.trim()) {
        return [{ ...createBlock('paragraph'), text: initialContent }]
      }
    }
    return [{ ...createBlock('paragraph'), text: '' }]
  }, [initialContent])

  const [blocks, setBlocks] = useState<Block[]>(blocksFromContent)
  const [selectedBlock, setSelectedBlock] = useState<string>(blocks[0]?.id || '')

  const activeBlock = blocks.find((block) => block.id === selectedBlock) ?? blocks[0]

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)))
  }

  function moveBlock(id: string, direction: 'up' | 'down') {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id)
      if (index === -1) return prev
      const nextIndex = direction === 'up' ? index - 1 : index + 1
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      next.splice(nextIndex, 0, removed)
      return next
    })
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== id))
    if (selectedBlock === id && blocks.length > 1) {
      setSelectedBlock(blocks.find((block) => block.id !== id)?.id ?? '')
    }
  }

  function addBlock(type: BlockType) {
    const next = createBlock(type)
    setBlocks((prev) => [...prev, next])
    setSelectedBlock(next.id)
  }

  function updateItem(blockId: string, index: number, value: string) {
    setBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block
      const items = [...(block.items ?? [])]
      items[index] = value
      return { ...block, items }
    }))
  }

  function addItem(blockId: string) {
    setBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block
      return { ...block, items: [...(block.items ?? []), ''] }
    }))
  }

  const contentValue = JSON.stringify(blocks)

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[0.45fr_0.55fr]">
        <div>
          <p className="text-sm font-semibold text-slate-900">Block editor</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compose articles as structured blocks. Add headings, images, quotes, summaries, and AI-enhanced paragraphs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blockTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => addBlock(type.value)}
              className="rounded-full border border-border px-3 py-2 text-xs font-black uppercase text-slate-700 transition hover:border-primary hover:text-primary"
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr]">
        <aside className="space-y-3 rounded-3xl border border-border bg-muted p-4">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">Blocks</p>
          {blocks.map((block, index) => (
            <button
              key={block.id}
              type="button"
              onClick={() => setSelectedBlock(block.id)}
              className={`block w-full rounded-3xl border px-4 py-3 text-left text-sm transition ${selectedBlock === block.id ? 'border-primary bg-white text-foreground' : 'border-transparent bg-muted text-slate-700 hover:border-border'}`}
            >
              <span className="font-semibold">{blockTypes.find((type) => type.value === block.type)?.label}</span>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">{String(block.text ?? block.url ?? 'Empty block')}</p>
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          {activeBlock ? (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">Selected block</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{blockTypes.find((type) => type.value === activeBlock.type)?.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveBlock(activeBlock.id, 'up')} className="rounded-full border border-border p-2 text-slate-700 transition hover:border-primary hover:text-primary">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => moveBlock(activeBlock.id, 'down')} className="rounded-full border border-border p-2 text-slate-700 transition hover:border-primary hover:text-primary">
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => removeBlock(activeBlock.id)} className="rounded-full border border-border p-2 text-slate-700 transition hover:border-destructive hover:text-destructive">
                    <Delete className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {['heading', 'subheading', 'paragraph', 'quote', 'fact_box', 'ai_summary', 'pull_quote'].includes(activeBlock.type) && (
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Content
                    <textarea
                      value={activeBlock.text ?? ''}
                      onChange={(event) => updateBlock(activeBlock.id, { text: event.target.value })}
                      rows={activeBlock.type === 'paragraph' ? 6 : 3}
                      className="min-h-[6rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                )}

                {activeBlock.type === 'image' && (
                  <>
                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                      Image URL
                      <input
                        value={activeBlock.url ?? ''}
                        onChange={(event) => updateBlock(activeBlock.id, { url: event.target.value })}
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                      Alt text
                      <input
                        value={activeBlock.alt ?? ''}
                        onChange={(event) => updateBlock(activeBlock.id, { alt: event.target.value })}
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                      Caption
                      <input
                        value={activeBlock.caption ?? ''}
                        onChange={(event) => updateBlock(activeBlock.id, { caption: event.target.value })}
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </>
                )}

                {(activeBlock.type === 'image_gallery' || activeBlock.type === 'timeline' || activeBlock.type === 'statistics') && (
                  <div className="space-y-4">
                    {(activeBlock.items ?? []).map((item, itemIndex) => (
                      <label key={itemIndex} className="grid gap-2 text-sm font-medium text-slate-700">
                        Item {itemIndex + 1}
                        <input
                          value={item}
                          onChange={(event) => updateItem(activeBlock.id, itemIndex, event.target.value)}
                          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem(activeBlock.id)}>
                      Add item
                    </Button>
                  </div>
                )}

                {activeBlock.type === 'video' && (
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Video embed URL
                    <input
                      value={activeBlock.url ?? ''}
                      onChange={(event) => updateBlock(activeBlock.id, { url: event.target.value })}
                      className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                )}

                {activeBlock.type === 'embed' && (
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Embed URL or HTML
                    <textarea
                      value={activeBlock.html ?? ''}
                      onChange={(event) => updateBlock(activeBlock.id, { html: event.target.value })}
                      rows={4}
                      className="min-h-[6rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                )}

                {activeBlock.type === 'custom_html' && (
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Custom HTML
                    <textarea
                      value={activeBlock.html ?? ''}
                      onChange={(event) => updateBlock(activeBlock.id, { html: event.target.value })}
                      rows={6}
                      className="min-h-[8rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                )}
              </div>

              <div className="mt-6 rounded-3xl border border-border bg-muted p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
                  <Sparkles className="size-4" />
                  AI Assist
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Use AI to rewrite, clarify, expand, or summarize the selected block. You can also generate pull quotes and image metadata.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => updateBlock(activeBlock.id, { text: `${activeBlock.text ?? ''}` })}>
                    Rewrite
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateBlock(activeBlock.id, { text: `${activeBlock.text ?? ''}` })}>
                    Improve clarity
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <input type="hidden" name="content" value={contentValue} />
      <input type="hidden" name="builder_mode" value="blocks" />
    </div>
  )
}
