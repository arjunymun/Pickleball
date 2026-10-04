import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";

/* eslint-disable @next/next/no-img-element -- This isolated browser fixture needs a native image element for its Next Image shim. */

export function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return <a href={href} {...props}>{children}</a>;
}

export function Image({ fill, sizes: _sizes, priority: _priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string; priority?: boolean }) {
  void _sizes;
  void _priority;
  return <img {...props} alt={props.alt ?? ""} style={fill ? { ...props.style, position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : props.style} />;
}

export function useRouter() {
  return { push(path: string) {
    const destination = new URL(path, location.origin);
    if (destination.pathname.includes("confirmation")) destination.searchParams.set("fixture", "success");
    else if (destination.pathname === "/book/review") destination.searchParams.set("fixture", "held");
    else if (!destination.searchParams.has("fixture") && location.search) destination.search = location.search;
    location.assign(destination.toString());
  } };
}

export function usePathname() { return location.pathname; }
