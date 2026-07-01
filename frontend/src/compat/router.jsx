'use client';
/**
 * react-router-dom compatibility shim for Next.js App Router.
 * Aliased in next.config.js so ported CRA components keep working unchanged.
 */
import React, { useEffect, useCallback } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation';

function toHref(to) {
  if (to == null) return '/';
  if (typeof to === 'string') return to;
  // react-router location object { pathname, search, hash }
  const { pathname = '', search = '', hash = '' } = to;
  return `${pathname}${search || ''}${hash || ''}`;
}

export const Link = React.forwardRef(function Link({ to, href, replace, state, children, ...rest }, ref) {
  const target = href != null ? href : toHref(to);
  return (
    <NextLink ref={ref} href={target} replace={replace} {...rest}>
      {children}
    </NextLink>
  );
});

export const NavLink = React.forwardRef(function NavLink({ to, href, className, style, children, end, ...rest }, ref) {
  const pathname = usePathname();
  const target = href != null ? href : toHref(to);
  const isActive = end ? pathname === target : (pathname === target || pathname.startsWith(target + '/'));
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  const st = typeof style === 'function' ? style({ isActive }) : style;
  const childNodes = typeof children === 'function' ? children({ isActive }) : children;
  return (
    <NextLink ref={ref} href={target} className={cls} style={st} {...rest}>
      {childNodes}
    </NextLink>
  );
});

export function useNavigate() {
  const router = useRouter();
  return useCallback((to, opts = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    const target = toHref(to);
    if (opts && opts.replace) router.replace(target);
    else router.push(target);
  }, [router]);
}

export function useParams() {
  return useNextParams() || {};
}

export function useLocation() {
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const search = sp && sp.toString() ? `?${sp.toString()}` : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  return { pathname: pathname || '/', search, hash, state: null, key: 'default' };
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const params = new URLSearchParams(sp ? sp.toString() : '');
  const setSearchParams = useCallback((next, opts = {}) => {
    let usp;
    if (typeof next === 'function') usp = new URLSearchParams(next(new URLSearchParams(params)).toString ? next(new URLSearchParams(params)).toString() : '');
    else if (next instanceof URLSearchParams) usp = next;
    else usp = new URLSearchParams(next || {});
    const qs = usp.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (opts.replace) router.replace(url); else router.push(url);
  }, [router, pathname, params]);
  return [params, setSearchParams];
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    const target = toHref(to);
    if (replace) router.replace(target); else router.push(target);
  }, [router, to, replace]);
  return null;
}

// Passthrough no-ops so accidental imports don't crash a build.
export function Outlet({ children }) { return children || null; }
export function BrowserRouter({ children }) { return children; }
export function Routes({ children }) { return children; }
export function Route() { return null; }

export default { Link, NavLink, useNavigate, useParams, useLocation, useSearchParams, Navigate, Outlet, BrowserRouter, Routes, Route };
