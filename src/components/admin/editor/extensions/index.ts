import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { common, createLowlight } from 'lowlight';
import { ImageWithUpload } from './ImageWithUpload';

const lowlight = createLowlight(common);

export const MAX_CHARS = 100_000;

export interface BuildExtensionsOptions {
  placeholder?: string;
}

export function buildExtensions(opts: BuildExtensionsOptions = {}) {
  return [
    StarterKit.configure({
      // Override codeBlock with lowlight-powered one below.
      codeBlock: false,
      // Heading levels — limit to 1–4 for blog clarity.
      heading: { levels: [1, 2, 3, 4] },
      // History defaults are fine; bulletList/orderedList default fine.
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ['http', 'https', 'mailto', 'tel'],
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Placeholder.configure({
      placeholder: opts.placeholder ?? '본문을 입력하세요…',
      emptyEditorClass: 'is-editor-empty',
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({ lowlight }),
    Typography,
    CharacterCount.configure({ limit: MAX_CHARS }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Youtube.configure({
      controls: true,
      nocookie: true,
      modestBranding: true,
      width: 640,
      height: 360,
    }),
    ImageWithUpload,
  ];
}
