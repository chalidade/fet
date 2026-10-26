import type { MarkdownRenderer } from "vitepress";

// Mengubah item list "- [ ] teks" menjadi checkbox. Nomor urut (data-task) sama
// di versi Indonesia dan Inggris karena urutan peta konsepnya sama, jadi
// centang yang tersimpan berlaku untuk kedua bahasa. Checkbox dirender
// disabled; komponen StageBanner mengaktifkannya di halaman tahap roadmap.
export function taskList(md: MarkdownRenderer): void {
  md.core.ruler.after("inline", "fet-task-list", (state) => {
    const tokens = state.tokens;
    let index = 0;
    for (let i = 2; i < tokens.length; i++) {
      const inline = tokens[i]!;
      if (inline.type !== "inline" || tokens[i - 1]!.type !== "paragraph_open" || tokens[i - 2]!.type !== "list_item_open") continue;
      const first = inline.children?.[0];
      const match = first?.type === "text" ? /^\[([ xX])\]\s+/.exec(first.content) : null;
      if (!first || !match) continue;
      first.content = first.content.slice(match[0].length);
      const checkbox = new state.Token("html_inline", "", 0);
      const checked = match[1] !== " " ? " checked" : "";
      checkbox.content = `<input type="checkbox" class="fet-task" data-task="${index++}" disabled${checked}> `;
      inline.children!.unshift(checkbox);
      tokens[i - 2]!.attrJoin("class", "fet-task-item");
    }
  });
}
