// Centers page content and caps it on very large screens so lines/tables don't
// stretch edge-to-edge on wide monitors. The AppShell <main> owns the outer
// padding (responsive); this just constrains width. Use once at the top of a page.
export default function PageContainer({ children, style, size = 'default' }) {
  const maxWidth = size === 'narrow' ? '896px' : size === 'wide' ? '1800px' : '1600px'
  return (
    <div
      style={{
        margin: '0 auto',
        width: '100%',
        maxWidth,
        ...style
      }}
    >
      {children}
    </div>
  )
}
