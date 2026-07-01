'use client';
/**
 * react-helmet-async compatibility shim.
 * SEO metadata (title, description, canonical, OG) is authoritative via Next's
 * server-side Metadata API on each route. This shim keeps <Helmet> usages from
 * the ported CRA pages from crashing, and best-effort syncs document.title on
 * client-side navigation. It intentionally does NOT inject meta/canonical into
 * <head> to avoid duplicating the server-rendered tags.
 */
import React, { useEffect } from 'react';

function extractTitle(children) {
  let title = null;
  React.Children.forEach(children, (child) => {
    if (!child || typeof child !== 'object') return;
    if (child.type === 'title') {
      const c = child.props && child.props.children;
      title = Array.isArray(c) ? c.join('') : c;
    }
  });
  return title;
}

export function Helmet({ children }) {
  const title = extractTitle(children);
  useEffect(() => {
    if (title && typeof document !== 'undefined') {
      document.title = title;
    }
  }, [title]);
  return null;
}

export function HelmetProvider({ children }) {
  return children;
}

export default { Helmet, HelmetProvider };
