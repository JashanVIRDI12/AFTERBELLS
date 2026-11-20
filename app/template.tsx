/** Re-mounts on every navigation, giving each page a soft arrival. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>
}
