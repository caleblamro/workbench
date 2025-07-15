import { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import { Box, useMantineColorScheme, useMantineTheme } from '@mantine/core';

interface EditableCodeHighlightProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
}

export function EditableCodeHighlight({
  value,
  onChange,
  language = 'sql',
  placeholder = 'Enter your code here...',
  minRows = 6,
  maxRows = 12,
}: EditableCodeHighlightProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Theme-aware colors
  const colors = {
    keyword: colorScheme === 'dark' ? '#569cd6' : '#0000ff',
    string: colorScheme === 'dark' ? '#ce9178' : '#a31515',
    number: colorScheme === 'dark' ? '#b5cea8' : '#098658',
    comment: colorScheme === 'dark' ? '#6a9955' : '#008000',
    builtin: colorScheme === 'dark' ? '#4ec9b0' : '#267f99',
    literal: colorScheme === 'dark' ? '#569cd6' : '#0000ff',
  };

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Apply syntax highlighting with colors
  const highlightedCode = () => {
    if (!value.trim()) {
      return '';
    }
    try {
      let highlighted = hljs.highlight(value, { language }).value;

      // Apply custom colors by replacing class attributes with inline styles
      highlighted = highlighted
        .replace(/class="hljs-keyword"/g, `style="color: ${colors.keyword}; font-weight: bold;"`)
        .replace(/class="hljs-string"/g, `style="color: ${colors.string};"`)
        .replace(/class="hljs-number"/g, `style="color: ${colors.number};"`)
        .replace(/class="hljs-comment"/g, `style="color: ${colors.comment}; font-style: italic;"`)
        .replace(/class="hljs-built_in"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-type"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-literal"/g, `style="color: ${colors.literal}; font-weight: bold;"`)
        .replace(/class="hljs-name"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-attribute"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-function"/g, `style="color: ${colors.builtin}; font-weight: bold;"`)
        .replace(/class="hljs-title"/g, `style="color: ${colors.builtin}; font-weight: bold;"`)
        .replace(/class="hljs-operator"/g, `style="color: ${colors.keyword}; font-weight: bold;"`)
        .replace(/class="hljs-symbol"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-variable"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-params"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-quote"/g, `style="color: ${colors.comment}; font-style: italic;"`)
        .replace(/class="hljs-tag"/g, `style="color: ${colors.keyword};"`)
        .replace(/class="hljs-selector-tag"/g, `style="color: ${colors.keyword};"`)
        .replace(/class="hljs-selector-id"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-selector-class"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-property"/g, `style="color: ${colors.builtin};"`)
        .replace(/class="hljs-value"/g, `style="color: ${colors.string};"`)
        .replace(/class="hljs-regexp"/g, `style="color: ${colors.string};"`)
        .replace(/class="hljs-meta"/g, `style="color: ${colors.comment};"`)
        .replace(/class="hljs-doctag"/g, `style="color: ${colors.comment}; font-weight: bold;"`)
        .replace(/class="hljs-section"/g, `style="color: ${colors.keyword}; font-weight: bold;"`)
        .replace(/class="hljs-strong"/g, `style="font-weight: bold;"`)
        .replace(/class="hljs-emphasis"/g, `style="font-style: italic;"`)
        .replace(
          /class="hljs-link"/g,
          `style="color: ${colors.builtin}; text-decoration: underline;"`
        );

      return highlighted;
    } catch {
      return hljs.highlightAuto(value).value;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 20;
      const minHeight = minRows * lineHeight + 24;
      const maxHeight = maxRows * lineHeight + 24;

      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [value, minRows, maxRows]);

  const borderColor = isFocused
    ? theme.colors.blue[6]
    : colorScheme === 'dark'
      ? theme.colors.dark[4]
      : theme.colors.gray[4];

  const backgroundColor = colorScheme === 'dark' ? theme.colors.dark[6] : theme.white;

  const textColor = colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7];

  const placeholderColor = colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[5];

  return (
    <Box
      style={{
        position: 'relative',
        border: `1px solid ${borderColor}`,
        borderRadius: theme.radius.sm,
        backgroundColor,
        overflow: 'hidden',
        transition: 'border-color 150ms ease',
      }}
    >
      {/* Syntax highlighted background */}
      <pre
        ref={highlightRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          padding: '12px',
          width: '100%',
          height: '100%',
          fontSize: '14px',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Menlo, "Liberation Mono", "Roboto Mono", Consolas, "Courier New", monospace',
          lineHeight: '20px',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          overflow: 'hidden',
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        dangerouslySetInnerHTML={{
          __html: highlightedCode(),
        }}
      />

      {/* Editable textarea overlay */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onScroll={handleScroll}
        placeholder={placeholder}
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 0,
          padding: '12px',
          width: '100%',
          fontSize: '14px',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Menlo, "Liberation Mono", "Roboto Mono", Consolas, "Courier New", monospace',
          lineHeight: '20px',
          color: value ? 'transparent' : placeholderColor,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          caretColor: textColor,
        }}
      />
    </Box>
  );
}
