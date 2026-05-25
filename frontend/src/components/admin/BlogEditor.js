import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Quote, Minus,
} from 'lucide-react';

/**
 * Minimal but production-quality WYSIWYG editor for blog posts.
 * Uses TipTap (ProseMirror) with StarterKit + Image + Link + Placeholder.
 *
 * Props:
 *   value:    initial HTML string
 *   onChange: callback(html) called on every change
 *   onImageUpload: async (file) => returns hosted url (R2)
 */
export default function BlogEditor({ value = '', onChange, onImageUpload }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'blog-img' } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'blog-link' } }),
      Placeholder.configure({ placeholder: 'Write the story… Drop in images, headings, quotes — whatever the post needs.' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => { if (onChange) onChange(editor.getHTML()); },
  });

  React.useEffect(() => {
    if (!editor) return;
    // Sync external value changes (e.g. switching between posts)
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const addImage = async () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        const url = onImageUpload ? await onImageUpload(file) : '';
        if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) { console.error('image upload failed', e); }
    };
    inp.click();
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const Btn = ({ onClick, active, label, children, testid }) => (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      data-testid={testid}
      className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors"
      style={{
        background: active ? 'rgba(15,94,76,0.10)' : 'transparent',
        color: active ? 'var(--lj-accent)' : 'var(--lj-text)',
      }}>
      {children}
    </button>
  );

  return (
    <div className="rounded-[12px] overflow-hidden" data-testid="blog-editor"
      style={{ background: 'var(--lj-bg)', border: '1px solid var(--lj-border)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 flex-wrap"
        style={{ borderBottom: '1px solid var(--lj-border)', background: 'var(--lj-surface)' }}>
        <Btn label="Heading 1" testid="ed-h1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}><Heading1 size={15} /></Btn>
        <Btn label="Heading 2" testid="ed-h2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 size={15} /></Btn>
        <Btn label="Heading 3" testid="ed-h3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 size={15} /></Btn>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--lj-border)' }} />
        <Btn label="Bold" testid="ed-bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold size={15} /></Btn>
        <Btn label="Italic" testid="ed-italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic size={15} /></Btn>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--lj-border)' }} />
        <Btn label="Bulleted list" testid="ed-bullet" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List size={15} /></Btn>
        <Btn label="Numbered list" testid="ed-ordered" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered size={15} /></Btn>
        <Btn label="Quote" testid="ed-quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote size={15} /></Btn>
        <Btn label="Divider" testid="ed-hr" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={15} /></Btn>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--lj-border)' }} />
        <Btn label="Link" testid="ed-link" onClick={setLink} active={editor.isActive('link')}><LinkIcon size={15} /></Btn>
        <Btn label="Image" testid="ed-image" onClick={addImage}><ImageIcon size={15} /></Btn>
        <span className="flex-1" />
        <Btn label="Undo" testid="ed-undo" onClick={() => editor.chain().focus().undo().run()}><Undo size={15} /></Btn>
        <Btn label="Redo" testid="ed-redo" onClick={() => editor.chain().focus().redo().run()}><Redo size={15} /></Btn>
      </div>
      <EditorContent editor={editor} className="blog-content tiptap-editor min-h-[320px] px-5 py-4 text-[15px] leading-[1.6] outline-none"
        style={{ color: 'var(--lj-text)' }} />
    </div>
  );
}
