import Image from '@tiptap/extension-image';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Image extension that auto-uploads paste/drop files to Vercel Blob.
 *
 * Why a custom extension: the default @tiptap/extension-image accepts any
 * URL. In our codebase, external image URLs are forbidden (CLAUDE.md
 * "외부 CDN 의존 금지"). When a user pastes a screenshot or drags a file
 * into the editor, we intercept the file *before* a temporary blob: URL
 * leaks into the document, upload it to /api/admin/upload, then insert
 * the resulting public URL.
 *
 * Failure modes:
 *   - Upload error → no insertion, console.error. The editor is unchanged.
 *   - Mixed paste (text + image) → text is handled by the default paste
 *     handler, image is uploaded separately. We don't preventDefault for
 *     the text portion.
 */
async function uploadImage(file: File, subdir = 'blog'): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  form.append('subdir', subdir);
  try {
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
    if (!res.ok || !data.success || !data.url) {
      console.error('[Editor] image upload failed:', data?.message);
      return null;
    }
    return data.url;
  } catch (err) {
    console.error('[Editor] image upload threw:', err);
    return null;
  }
}

export const ImageWithUpload = Image.extend({
  name: 'image',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('image-upload-handler'),
        props: {
          handlePaste: (view, event) => {
            const items = Array.from(event.clipboardData?.items ?? []);
            const images = items.filter((it) => it.kind === 'file' && it.type.startsWith('image/'));
            if (images.length === 0) return false;

            event.preventDefault();
            for (const item of images) {
              const file = item.getAsFile();
              if (!file) continue;
              uploadImage(file).then((url) => {
                if (!url) return;
                const { schema, tr } = view.state;
                const node = schema.nodes.image.create({ src: url, alt: file.name });
                view.dispatch(tr.replaceSelectionWith(node));
              });
            }
            return true;
          },
          handleDrop: (view, event) => {
            const dt = (event as DragEvent).dataTransfer;
            if (!dt) return false;
            const files = Array.from(dt.files ?? []).filter((f) => f.type.startsWith('image/'));
            if (files.length === 0) return false;
            event.preventDefault();

            const coords = view.posAtCoords({
              left: (event as DragEvent).clientX,
              top: (event as DragEvent).clientY,
            });
            const insertPos = coords?.pos ?? view.state.selection.from;

            (async () => {
              let cursor = insertPos;
              for (const file of files) {
                const url = await uploadImage(file);
                if (!url) continue;
                const node = view.state.schema.nodes.image.create({ src: url, alt: file.name });
                const tr = view.state.tr.insert(cursor, node);
                view.dispatch(tr);
                cursor += node.nodeSize;
              }
            })();

            return true;
          },
        },
      }),
    ];
  },
}).configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: { class: 'blog-editor-image' },
});

export { uploadImage };
