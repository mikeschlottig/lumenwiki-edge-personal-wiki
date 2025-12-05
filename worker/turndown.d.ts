declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '*' | '-' | '+';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: '```' | '~~~';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
    blankReplacement?: (content: string, node: any) => string;
    keepReplacement?: (content: string, node: any) => string;
    defaultReplacement?: (content: string, node: any) => string;
  }
  class TurndownService {
    constructor(options?: TurndownOptions);
    public turndown(html: string | Node): string;
    public addRule(key: string, rule: any): this;
    public keep(filter: any): this;
    public remove(filter: any): this;
    public use(plugins: any | any[]): this;
  }
  export = TurndownService;
}