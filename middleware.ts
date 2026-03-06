// middleware.ts  (root of project, next to package.json)
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

// Only protect /dashboard — nothing else.
// /api/auth/* is intentionally excluded so NextAuth callbacks
// always complete and the session cookie is set BEFORE
// the browser hits /dashboard and middleware runs.
export const config = {
  matcher: ["/dashboard/:path*"],
};
