import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FigureNode } from './FigureNode.js'
import FigurePanel from './FigurePanel.jsx'
import { defaultFigure } from './figureOptions.js'
import { uploadImage } from '../lib/cloudinary.js'
import { uploadLabel } from './uploadStage.js'
import '../styles/figure.css'
import './RichTextField.css'

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    codeBlock: false,
    horizontalRule: false,
    link: { openOnClick: false },
  }),
  FigureNode,
]

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      className={active ? 'rt-button is-active' : 'rt-button'}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

export default function RichTextField({ label, value, onChange, disabled }) {
  const lastEmitted = useRef(value)
  const fileInput = useRef(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [stage, setStage] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [figure, setFigure] = useState(null)

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      lastEmitted.current = html
      onChange(html)
    },
  })

  useEffect(() => {
    if (editor && value !== lastEmitted.current) {
      lastEmitted.current = value
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) {
    return null
  }

  const figureActive = editor.isActive('figure')

  function openLink() {
    setLinkValue(editor.getAttributes('link').href ?? '')
    setLinkOpen(true)
  }

  function applyLink() {
    const chain = editor.chain().focus().extendMarkRange('link')

    if (linkValue.trim()) {
      chain.setLink({ href: linkValue.trim() }).run()
    } else {
      chain.unsetLink().run()
    }

    setLinkOpen(false)
  }

  async function handleFile(event) {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    setStage('upload')
    setUploadError(null)

    try {
      const src = await uploadImage(file, setStage)
      setFigure({ mode: 'insert', src, values: { ...defaultFigure } })
    } catch (failure) {
      setUploadError(failure.message)
    }

    setStage(null)
    event.target.value = ''
  }

  function editFigure() {
    const attrs = editor.getAttributes('figure')

    setFigure({
      mode: 'edit',
      src: attrs.src,
      values: {
        ratio: attrs.ratio,
        orientation: attrs.orientation,
        size: attrs.size,
        caption: attrs.caption,
        wrap: attrs.wrap,
      },
    })
  }

  function applyFigure() {
    if (figure.mode === 'insert') {
      editor
        .chain()
        .focus()
        .insertContentAt(editor.state.selection.to, {
          type: 'figure',
          attrs: { src: figure.src, ...figure.values },
        })
        .run()
    } else {
      editor.chain().focus().updateAttributes('figure', figure.values).run()
    }

    setFigure(null)
  }

  return (
    <div className="rich-text">
      <span className="rt-label">{label}</span>

      {!disabled && (
        <div className="rt-toolbar">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Félkövér"
          >
            <strong>B</strong>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Dőlt"
          >
            <em>I</em>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Aláhúzott"
          >
            <u>U</u>
          </ToolbarButton>

          <span className="rt-divider" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Nagy címsor"
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Kis címsor"
          >
            H3
          </ToolbarButton>

          <span className="rt-divider" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Felsorolás"
          >
            Lista
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Számozott lista"
          >
            1. 2. 3.
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Idézet"
          >
            Idézet
          </ToolbarButton>

          <span className="rt-divider" />

          <ToolbarButton onClick={openLink} active={editor.isActive('link')} title="Link">
            Link
          </ToolbarButton>

          <ToolbarButton
            onClick={() => fileInput.current.click()}
            disabled={Boolean(stage)}
            title="Kép beszúrása"
          >
            {uploadLabel(stage, 'Kép')}
          </ToolbarButton>

          {figureActive && (
            <ToolbarButton onClick={editFigure} title="A kijelölt kép beállításai">
              Kép beállításai
            </ToolbarButton>
          )}

          <span className="rt-divider" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Visszavonás"
          >
            Vissza
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Újra"
          >
            Újra
          </ToolbarButton>

          <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} hidden />
        </div>
      )}

      {linkOpen && (
        <div className="rt-link">
          <input
            type="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://..."
            autoFocus
          />
          <button type="button" className="admin-button" onClick={applyLink}>
            Beállítás
          </button>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => setLinkOpen(false)}
          >
            Mégsem
          </button>
        </div>
      )}

      {figure && (
        <FigurePanel
          src={figure.src}
          values={figure.values}
          onChange={(values) => setFigure({ ...figure, values })}
          onSubmit={applyFigure}
          onCancel={() => setFigure(null)}
          submitLabel={figure.mode === 'insert' ? 'Beszúrás' : 'Frissítés'}
        />
      )}

      {uploadError && <p className="admin-error">Képfeltöltés: {uploadError}</p>}

      <EditorContent editor={editor} className="rt-content" />
    </div>
  )
}
