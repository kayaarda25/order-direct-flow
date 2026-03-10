import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InlineTextProps {
  value: string;
  onChange: (val: string) => void;
  isActive: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
}

const InlineText = ({
  value,
  onChange,
  isActive,
  as: Tag = 'span',
  className,
  style,
  multiline,
  placeholder = "Text eingeben...",
}: InlineTextProps) => {
  const ref = useRef<HTMLElement>(null);

  // Sync value to DOM when value changes externally and element is not focused
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = value || '';
    }
  }, [value]);

  if (!isActive) {
    return React.createElement(Tag, { className, style }, value || placeholder);
  }

  return React.createElement(Tag, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    className: cn(
      className,
      "outline-none ring-2 ring-blue-400/40 rounded-sm px-1 -mx-1 cursor-text transition-shadow focus:ring-blue-500/60 min-w-[60px]"
    ),
    style,
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const newVal = e.currentTarget.innerText || '';
      if (newVal !== value) onChange(newVal);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    dangerouslySetInnerHTML: { __html: multiline ? (value || '').replace(/\n/g, '<br>') : (value || '') },
  });
};

export default InlineText;
