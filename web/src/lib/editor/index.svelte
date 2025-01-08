<script lang="ts">
  import "./styles.scss";

  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import {
    Heading1,
    Heading2,
    Bold,
    Italic,
    Strikethrough,
    ListOrdered,
    List,
  } from "lucide-svelte";
  import { onMount } from "svelte";

  let editor: Editor | null = $state(null);
  let element: HTMLElement;
  let {
    value,
    disabled,
    onUpdate,
  }: { value: string | undefined; disabled: boolean; onUpdate: Function } =
    $props();

  let updateTimeOut: number;
  onMount(() => {
    editor = new Editor({
      element,
      extensions: [StarterKit],
      autofocus: false,
      injectCSS: false,
      editorProps: {
        attributes: {
          class: "p-2 w-full min-h-44 overflow-y-auto border round-md",
        },
      },
      onTransaction: () => {
        // force re-render so `editor.isActive` works as expected
        editor = editor;
      },
      onUpdate: ({ editor }) => {
        if (updateTimeOut) {
          clearTimeout(updateTimeOut);
        }
        updateTimeOut = setTimeout(() => {
          let contentText = editor.getText();
          let contentHtml = editor.getHTML();
          onUpdate(contentText === "" ? null : contentHtml);
        }, 1000);
      },
    });
  });

  $effect(() => {
    if (editor) {
      editor.setEditable(!disabled);
      if (disabled || !value) {
        editor.commands.clearContent();
      } else {
        editor.commands.setContent(value);
      }
    }
  });
</script>

{#if editor}
  <div class="flex flex-row w-full gap-2">
    <button
      onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      class:active={editor.isActive("heading", { level: 1 })}
    >
      <Heading1 />
    </button>
    <button
      onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      class:active={editor.isActive("heading", { level: 2 })}
    >
      <Heading2 />
    </button>
    <button
      onclick={() => editor?.chain().focus().toggleBold().run()}
      class:active={editor.isActive("bold")}><Bold /></button
    >
    <button
      onclick={() => editor?.chain().focus().toggleItalic().run()}
      class:active={editor.isActive("italic")}><Italic /></button
    >
    <button
      onclick={() => editor?.chain().focus().toggleStrike().run()}
      class:active={editor.isActive("strike")}><Strikethrough /></button
    >
    <button
      onclick={() => editor?.chain().focus().toggleOrderedList().run()}
      class:active={editor.isActive("orderedList")}><ListOrdered /></button
    >
    <button
      onclick={() => editor?.chain().focus().toggleBulletList().run()}
      class:active={editor.isActive("bulletList")}><List /></button
    >
  </div>
{/if}
<div bind:this={element} class="w-full"></div>
