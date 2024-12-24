import type { MDXComponents } from 'mdx/types';
import Image, { ImageProps } from 'next/image';

const baseTextStyle = {
  color: '#374151', // Gray-700
  lineHeight: '1.75',
  margin: '1rem 0',
};

const headingBaseStyle = {
  fontWeight: '600',
  color: '#111827', // Gray-900
  letterSpacing: '-0.025em',
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Root wrapper for content
    wrapper: ({ children }) => (
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem 1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {children}
      </div>
    ),

    // // Headings
    h1: ({ children }) => (
      <h1
        style={{
          ...headingBaseStyle,
          fontSize: '2.5rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #E5E7EB', // Gray-200
        }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        style={{
          ...headingBaseStyle,
          fontSize: '1.75rem',
          marginTop: '2.5rem',
          marginBottom: '1.25rem',
        }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        style={{
          ...headingBaseStyle,
          fontSize: '1.25rem',
          marginTop: '2rem',
          marginBottom: '1rem',
        }}
      >
        {children}
      </h3>
    ),

    // // Paragraphs and text
    p: ({ children }) => (
      <p
        style={{
          ...baseTextStyle,
          fontSize: '1rem',
        }}
      >
        {children}
      </p>
    ),

    // // Lists
    ul: ({ children }) => (
      <ul
        style={{
          ...baseTextStyle,
          paddingLeft: '1.5rem',
          listStyleType: 'disc',
        }}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        style={{
          ...baseTextStyle,
          paddingLeft: '1.5rem',
          listStyleType: 'decimal',
        }}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li
        style={{
          marginBottom: '0.5rem',
        }}
      >
        {children}
      </li>
    ),

    // // Links
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#2563EB', // Blue-600
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          transition: 'color 0.15s',
        }}
        // onMouseOver={(e) => e.currentTarget.style.color = '#1D4ED8'} // Blue-700
        // onMouseOut={(e) => e.currentTarget.style.color = '#2563EB'}
      >
        {children}
      </a>
    ),

    // // Strong and emphasis
    strong: ({ children }) => (
      <strong
        style={{
          fontWeight: '600',
          color: '#111827', // Gray-900
        }}
      >
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em
        style={{
          fontStyle: 'italic',
        }}
      >
        {children}
      </em>
    ),

    // // Tables
    table: ({ children }) => (
      <div
        style={{
          overflowX: 'auto',
          margin: '1.5rem 0',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th
        style={{
          padding: '0.75rem',
          backgroundColor: '#F3F4F6', // Gray-100
          borderBottom: '2px solid #E5E7EB',
          textAlign: 'left',
          fontWeight: '600',
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          padding: '0.75rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {children}
      </td>
    ),

    // // Images (keeping your existing Image component)
    img: (props) => (
      <Image
        sizes="100vw"
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '0.5rem',
          margin: '1.5rem 0',
        }}
        {...(props as ImageProps)}
      />
    ),

    ...components,
  };
}
