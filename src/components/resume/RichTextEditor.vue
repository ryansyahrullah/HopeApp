<template>
  <div class="rich-text-editor-wrapper">
    <!-- Toolbar -->
    <div class="editor-toolbar" v-if="editor && !readonly">
      <button 
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
      >
        <strong>B</strong>
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
      >
        <em>I</em>
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        • List
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
      >
        1. List
      </button>
    </div>

    <!-- Tiptap Editor Content -->
    <editor-content :editor="editor" class="editor-content-box" :class="{ 'is-readonly': readonly }" />
  </div>
</template>

<script setup>
import { watch, onBeforeUnmount, ref, onMounted } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  placeholder: {
     type: String,
     default: 'Ketik materi yang kamu pelajari di pertemuan ini...'
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = ref(null)

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    editable: !props.readonly,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: props.placeholder,
      })
    ],
    onUpdate: () => {
      // Pas editor ngetik, emit value ke v-model si parent
      const html = editor.value.getHTML()
      emit('update:modelValue', html)
    },
  })
})

watch(() => props.modelValue, (value) => {
  // Biar sync klo valuenya ganti dari prop
  const isSame = editor.value.getHTML() === value
  if (isSame) {
    return
  }
  editor.value.commands.setContent(value, false)
})

watch(() => props.readonly, (newReadonly) => {
   if(editor.value) editor.value.setEditable(!newReadonly)
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
.rich-text-editor-wrapper {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--c-surface);
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
}

.editor-toolbar button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  color: var(--c-text-main);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  transition: all 0.2s;
}

.editor-toolbar button:hover {
  background-color: var(--c-border);
}

.editor-toolbar button.is-active {
  background-color: var(--c-primary);
  color: #fff;
}

.editor-content-box {
  flex-grow: 1;
  min-height: 250px;
  display: flex;
  flex-direction: column;
}

.editor-content-box.is-readonly {
  min-height: auto;
}
</style>

<style>
/* Tiptap Global CSS */
.tiptap {
  padding: 1.25rem;
  outline: none;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--c-text-main);
  flex-grow: 1;
}

.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap ul, .tiptap ol {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
