import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import './RichTextEditor.css';

/**
 * Extension providing Alt+Space shortcut for inserting a non-breaking space (&nbsp; / \u00A0)
 */
const NonBreakingSpace = Extension.create({
  name: 'nonBreakingSpace',

  addKeyboardShortcuts() {
    return {
      // In ProseMirror/TipTap, key name for Space is literally ' '
      'Alt- ': () => this.editor.commands.insertContent('\u00A0'),
      'Alt-Space': () => this.editor.commands.insertContent('\u00A0'),
      'Mod-Alt- ': () => this.editor.commands.insertContent('\u00A0'),
      'Mod-Alt-Space': () => this.editor.commands.insertContent('\u00A0'),
      'Ctrl-Shift- ': () => this.editor.commands.insertContent('\u00A0'),
      'Ctrl-Shift-Space': () => this.editor.commands.insertContent('\u00A0'),
      'Shift-Alt- ': () => this.editor.commands.insertContent('\u00A0'),
      'Shift-Alt-Space': () => this.editor.commands.insertContent('\u00A0'),
    };
  },
});

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: true,
        italic: true,
        paragraph: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      NonBreakingSpace,
    ],
    editorProps: {
      handleKeyDown: (view, event) => {
        const isSpace = event.key === ' ' || event.code === 'Space' || event.keyCode === 32;
        const isAlt = event.altKey || (Boolean(event.getModifierState) && event.getModifierState('AltGraph'));
        const isCtrlShift = (event.ctrlKey || event.metaKey) && event.shiftKey;

        // Catch Alt+Space, AltGr+Space, and Ctrl+Shift+Space
        if (isSpace && (isAlt || isCtrlShift)) {
          event.preventDefault();
          event.stopPropagation();
          view.dispatch(view.state.tr.insertText('\u00A0'));
          return true;
        }
        return false;
      },
    },
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content when external content changes (e.g. language tab switch)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== content) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (e.g. https://example.com):', previousUrl || '');

    // cancelled
    if (url === null) return;

    // empty -> remove link
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // add protocol if missing
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl) && !/^\//.test(finalUrl) && !/^#/.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  }, [editor]);

  if (!editor) {
    return <div className="rich-editor rich-editor--loading">Loading editor...</div>;
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar" role="toolbar" aria-label="Text Formatting">
        {/* Bold */}
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('bold') ? 'rich-editor__btn--active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>

        {/* Cursive / Italic */}
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('italic') ? 'rich-editor__btn--active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursive / Italic (Ctrl+I)"
          aria-label="Cursive / Italic"
        >
          <em>I</em>
        </button>

        {/* Underline */}
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('underline') ? 'rich-editor__btn--active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <u>U</u>
        </button>

        {/* Non-breaking space */}
        <button
          type="button"
          className="rich-editor__btn"
          onClick={() => editor.chain().focus().insertContent('\u00A0').run()}
          title="Non-breaking space (Alt+Space)"
          aria-label="Non-breaking space"
        >
          <span style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>NBSP</span>
        </button>

        <span className="rich-editor__divider" />

        {/* Link */}
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('link') ? 'rich-editor__btn--active' : ''}`}
          onClick={setLink}
          title="Insert / Edit Link"
          aria-label="Link"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        {editor.isActive('link') && (
          <button
            type="button"
            className="rich-editor__btn"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
            aria-label="Remove Link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <span className="rich-editor__divider" />

        {/* Headings */}
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('heading', { level: 3 }) ? 'rich-editor__btn--active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('heading', { level: 4 }) ? 'rich-editor__btn--active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Heading 4"
        >
          H4
        </button>

        <span className="rich-editor__divider" />

        {/* Undo / Redo */}
        <button
          type="button"
          className="rich-editor__btn"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          type="button"
          className="rich-editor__btn"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      <EditorContent editor={editor} className="rich-editor__content" />
    </div>
  );
};

export default RichTextEditor;
