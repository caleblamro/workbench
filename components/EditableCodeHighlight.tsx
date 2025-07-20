import { useEffect, useMemo, useRef } from 'react';
import { useHighlight } from '@mantine/code-highlight';
import { Box, useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { getHotkeyHandler, HotkeyItem } from '@mantine/hooks';

interface EditableCodeHighlightProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  onKeys?: HotkeyItem[];
}

export function EditableCodeHighlight({
  value,
  onChange,
  language = 'sql',
  placeholder = 'Enter your code here...',
  minRows = 6,
  maxRows = 12,
  onKeys,
}: EditableCodeHighlightProps) {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme();
  const highlight = useHighlight();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLElement>(null);
  const isLight = useMemo(() => {
    return colorScheme === 'light';
  }, [colorScheme]);

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Use the same highlighting as CodeHighlight component
  const highlightedCode = highlight({
    code: value.trim(),
    language,
    colorScheme,
  });

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

  const backgroundColor = isLight ? theme.colors.gray[0] : theme.colors.dark[8];
  const placeholderColor = theme.colors.gray[5];
  const textColor = theme.colors.gray[7];

  const codeContent = highlightedCode.isHighlighted
    ? { dangerouslySetInnerHTML: { __html: highlightedCode.highlightedCode } }
    : { children: value.trim() };

  return (
    <Box
      style={{
        position: 'relative',
        borderRadius: theme.radius.sm,
        backgroundColor,
        overflow: 'hidden',
        transition: 'border-color 150ms ease',
      }}
    >
      {/* Syntax highlighted background - uses exact same approach as CodeHighlight */}
      <code
        ref={highlightRef}
        {...highlightedCode.codeElementProps}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          padding: 'var(--mantine-spacing-xs)',
          width: '100%',
          height: '100%',
          fontSize: 'var(--mantine-font-size-sm)',
          fontFamily: 'var(--mantine-font-family-monospace)',
          lineHeight: '20px',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          overflow: 'hidden',
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          display: 'block',
          ...highlightedCode.codeElementProps?.style,
        }}
        {...codeContent}
      />

      {/* Editable textarea overlay */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 0,
          padding: 'var(--mantine-spacing-xs)',
          width: '100%',
          fontSize: 'var(--mantine-font-size-sm)',
          fontFamily: 'var(--mantine-font-family-monospace)',
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
        onKeyDown={getHotkeyHandler(onKeys || [])}
      />
    </Box>
  );
}
