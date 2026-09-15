/* Keeps the panel out of search results even if the URL leaks.
   The public pages very much do want to be indexed, so this sits on the
   dashboard's own layout rather than in the root one. */
export const metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }) {
  return children;
}
