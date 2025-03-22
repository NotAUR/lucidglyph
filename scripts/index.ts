import TextStream from '@textstream/core';
import assert from 'assert';
import chalk from 'chalk';
import MarkdownIt, { Token as MarkdownToken } from 'markdown-it';

const mdParser = new MarkdownIt();


type Section = (
  | IMarkdownHeadingSection
  | IMarkdownParagraphSection
  | IMarkdownBlockquoteSection
  | IMarkdownInlineSection
  | IMarkdownBulletListSection
  | IMarkdownOrderedListSection
  | IMarkdownListItemSection
  | IMarkdownFenceSection
);

interface IMarkdownSectionBase {
  nesting: MarkdownIt.Token.Nesting | null;
  level: number | null;
}

interface IMarkdownInlineSection extends IMarkdownSectionBase {
  type: 'inline';
  children: Section[];
}

interface IMarkdownFenceSection extends IMarkdownSectionBase {
  type: 'fence';
  content: string | null;
}

interface IMarkdownHeadingSection extends IMarkdownSectionBase {
  type: 'heading';
  children: Section[];
}
interface IMarkdownParagraphSection extends IMarkdownSectionBase {
  type: 'paragraph';
  children: Section[];
}
interface IMarkdownBlockquoteSection extends IMarkdownSectionBase {
  type: 'blockquote';
  children: Section[];
}
interface IMarkdownBulletListSection extends IMarkdownSectionBase {
  type: 'bullet_list';
  children: Section[];
}
interface IMarkdownListItemSection extends IMarkdownSectionBase {
  type: 'list_item';
  children: Section[];
}
interface IMarkdownOrderedListSection extends IMarkdownSectionBase {
  type: 'ordered_list';
  children: Section[];
}

function cleanLine(line: string): string {
  return line.replace(/\n{1,}/gm, ' ');
}

class ShellScriptFormatter {
  #ts: TextStream;

  constructor() {
    this.#ts = new TextStream({ indentationSize: 2 });
  }

  format(sections: Section[]): string {
    this.#ts.write('#!/bin/sh\n\n');
    this.#ts.write('post_install() {\n');

    this.#ts.indentBlock(() => {
      // sections.forEach((section) => this.#formatSection(section));
      for (const section of sections) {
        this.#formatSection(section);
        this.#ts.write('printf \'\\n\'\n');
      }

    });

    this.#ts.write('}\n\n');
    this.#ts.write('post_install\n');

    return this.#ts.value();
  }

  #formatSection(section: Section): void {
    switch (section.type) {
      case 'heading':
        this.#printHeading(section);
        break;
      case 'paragraph':
        this.#printParagraph(section);
        break;
      case 'blockquote':
        this.#printBlockquote(section);
        break;
      case 'fence':
        this.#ts.write('echo \'```\'\n')
        this.#printFence(section);
        this.#ts.write('echo \'```\'\n')
        break;
      default:
        throw new Error(`Unhandled section type: ${section}`);
    }
  }

  #printHeading(section: IMarkdownHeadingSection): void {
    const content = cleanLine(this.#collectContent(section));
    this.#ts.write(`echo '${chalk.bold.blue(content)}'\n`);
  }

  #printParagraph(section: IMarkdownParagraphSection): void {
    const content = cleanLine(this.#collectContent(section));
    this.#ts.write(`echo '${chalk.white(content)}'\n`);
  }

  #printBlockquote(section: IMarkdownBlockquoteSection): void {
    const content = this.#collectContent(section).replace(/'/g, "'\\''");
    this.#ts.write(`echo '${chalk.gray('> ' + content)}'\n`);
  }

  #printFence(section: IMarkdownFenceSection): void {
    if (!section.content) return;

    const escapedContent = section.content.replace(/'/g, "'\\''");

    this.#ts.write(`echo '${chalk.greenBright(escapedContent
      /*
      .replace(/\n{1,}$/gm, '').replace(/^\n{1,}/, '')
      */
      .replace(/\n{1,}/gm, '')

    )}'\n`);
  }

  #collectContent(section: Section, level: number = section.level ?? 0): string {
    let text: string;

    switch (section.type) {
      case 'heading': {
        for (const child of section.children) {
          if (child.type !== 'fence') {
            break;
          }
          level += child.level ?? 0;
        }
      }
    }

    if (section.type === 'fence') {
      text = section.content ?? '';
    } else if ('children' in section && section.children) {
      text = section.children.map((child) => this.#collectContent(child, level)).join(' ');
    } else {
      text = '';
    }

    for (let i = 0; i < level; i++) {
      text = `  ${text}`;
    }

    return text;
  }
}

class MarkdownConverter {
  readonly #tokens;
  #offset = 0;
  public constructor(tokens: MarkdownToken[]) {
    this.#tokens = tokens;
  }

  public read() {
    let sections = new Array<Section>();

    while (!this.#eof()) {
      const section = (this.#readSection());

      assert.strict.ok(section !== null, `Section not found in README.md`);

      if (!Array.isArray(section)) {
        sections = [...sections, section].flat();
      } else {
        sections = [...sections, ...section];
      }
    }

    return sections;
  }

  #peek() {
    if (this.#eof()) return null;
    return this.#tokens[this.#offset] ?? null;
  }

  #expect() {
    const token = this.#peek();

    assert(token !== null, 'Unexpected EOF');

    this.#consume();

    return token;
  }

  #readParagraph(): Section {
    return {
      type: 'paragraph',
      ...this.#indentationAttrs(),
      children: this.#readTokenSpan('paragraph_open', 'paragraph_close')
    };
  }

  #indentationAttrs() {
    const token = this.#peek();
    return {
      nesting: token?.nesting ?? null,
      level: token?.level ?? null,
    }
  }

  #readBlockquote(): Section {
    return {
      type: 'blockquote',
      ...this.#indentationAttrs(),
      children: this.#readTokenSpan('blockquote_open', 'blockquote_close')
    };
  }

  #consume() {
    if (this.#eof()) {
      throw new Error('Unexpected EOF');
    }
    this.#offset++;
  }

  #readHeading(): Section {
    return {
      ...this.#indentationAttrs(),
      type: 'heading',
      children: this.#readTokenSpan('heading_open', 'heading_close')
    };
  }

  #readTokenSpan(startWithType: string, endWithType: string) {
    if (this.#eof()) {
      throw new Error('Unexpected EOF');
    }
    let sections = new Array<Section>();
    assert.strict.ok(this.#expect().type === startWithType);
    while (!this.#eof() && this.#peek()?.type !== endWithType) {
      const section = this.#readSection();
      assert.strict.ok(section !== null);
      sections = [...sections, section].flat();
    }
    assert.strict.ok(this.#expect().type === endWithType);
    return sections;
  }

  #readBulletList() {
    return this.#readTokenSpan('bullet_list_open', 'bullet_list_close');
  }

  #readSection(): Section[] | Section | null {
    const token = this.#peek();

    if (token === null) {
      return null;
    }

    switch (token.type) {
      case 'fence':
      case 'inline':
        return {
          ...this.#indentationAttrs(),
          type: 'fence',
          content: this.#expect().content ?? null
        };
      case 'heading_open':
        return this.#readHeading();
      case 'paragraph_open':
        return this.#readParagraph();
      case 'blockquote_open':
        return this.#readBlockquote();
      case 'bullet_list_open':
        return this.#readBulletList();
      case 'list_item_open':
        return this.#readTokenSpan('list_item_open', 'list_item_close');
      case 'ordered_list_open':
        return this.#readTokenSpan('ordered_list_open', 'ordered_list_close');
      default:
        throw new Error(`Unhandled token type: ${token.type}`);
    }
  }

  #eof() {
    return this.#offset === this.#tokens.length
  }
}

(async () => {
  const { default: fetch } = (await import('node-fetch'))
  const res = await fetch('https://raw.githubusercontent.com/maximilionus/lucidglyph/refs/heads/master/README.md')
  const markdown = await res.text()
  const tokens = mdParser.parse(markdown, {});
  const converter = new MarkdownConverter(tokens);

  console.log(new ShellScriptFormatter().format(converter.read()));

})().catch(err => {
  console.error(err)
});

