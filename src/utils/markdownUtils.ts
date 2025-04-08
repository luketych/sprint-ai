export interface ParsedMarkdown {
  title: string;
  metadata: Record<string, string>;
  content: string;
}

export const markdownUtils = {
  parseMarkdown(content: string): ParsedMarkdown {
    const lines = content.split('\n');
    let title = '';
    const metadata: Record<string, string> = {};
    let contentLines: string[] = [];
    let inMetadata = false;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.substring(2).trim();
      } else if (line.startsWith('---')) {
        inMetadata = !inMetadata;
      } else if (inMetadata) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      } else {
        contentLines.push(line);
      }
    }

    return {
      title,
      metadata,
      content: contentLines.join('\n').trim(),
    };
  },

  generateMarkdown(data: ParsedMarkdown): string {
    const lines: string[] = [];

    if (data.title) {
      lines.push(`# ${data.title}`);
      lines.push('');
    }

    if (Object.keys(data.metadata).length > 0) {
      lines.push('---');
      for (const [key, value] of Object.entries(data.metadata)) {
        lines.push(`${key}: ${value}`);
      }
      lines.push('---');
      lines.push('');
    }

    if (data.content) {
      lines.push(data.content);
    }

    return lines.join('\n');
  }
}; 