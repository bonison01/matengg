// components/navbar/PageSearchBar.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

const MAX_MATCHES = 2000;
const SKIP = "script,style,noscript,textarea,input,select,option,[hidden]";

// Injected as a plain <style> tag instead of living in globals.css: Next's CSS
// pipeline (Turbopack) rejects the ::highlight() pseudo-element at build time,
// but browsers handle it fine at runtime.
const HIGHLIGHT_CSS =
    "::highlight(page-search){background-color:#facc15;color:#000}" +
    "::highlight(page-search-active){background-color:#ea580c;color:#fff}";

// CSS Custom Highlight API: highlights text without touching the DOM, so it is
// safe with React. Types are loose because TS DOM libs differ by version.
const hl = () => (typeof CSS !== "undefined" ? (CSS as any).highlights : undefined);
const canHighlight = () => Boolean(hl()) && typeof (window as any).Highlight !== "undefined";

export default function PageSearchBar({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [count, setCount] = useState(0);
    const [active, setActive] = useState(0);
    const ranges = useRef<Range[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const pathname = usePathname();

    const clearHighlights = useCallback(() => {
        hl()?.delete("page-search");
        hl()?.delete("page-search-active");
        ranges.current = [];
    }, []);

    const focusMatch = useCallback((i: number) => {
        const r = ranges.current[i];
        if (!r) return;
        if (canHighlight()) {
            const activeHl = new (window as any).Highlight(r);
            activeHl.priority = 1; // paint the current match above the others
            hl().set("page-search-active", activeHl);
        }
        const rect = r.getBoundingClientRect();
        window.scrollTo({
            top: Math.max(0, rect.top + window.scrollY - window.innerHeight / 3),
            behavior: "smooth",
        });
        setActive(i);
    }, []);

    const runSearch = useCallback(
        (raw: string) => {
            clearHighlights();
            setCount(0);
            setActive(0);
            const q = raw.trim().toLowerCase();
            if (!q || !canHighlight()) return;

            // Search the page content (inside <main>), not the navbar itself.
            const root = document.querySelector("main") ?? document.body;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    const el = node.parentElement;
                    if (!el || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    if (el.closest(SKIP)) return NodeFilter.FILTER_REJECT;
                    if (typeof el.checkVisibility === "function" && !el.checkVisibility()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            });

            const found: Range[] = [];
            let node = walker.nextNode();
            while (node && found.length < MAX_MATCHES) {
                const text = (node.nodeValue ?? "").toLowerCase();
                let from = 0;
                let i = text.indexOf(q, from);
                while (i !== -1 && found.length < MAX_MATCHES) {
                    const range = new Range();
                    range.setStart(node, i);
                    range.setEnd(node, i + q.length);
                    found.push(range);
                    from = i + q.length;
                    i = text.indexOf(q, from);
                }
                node = walker.nextNode();
            }

            ranges.current = found;
            setCount(found.length);
            if (found.length) {
                hl().set("page-search", new (window as any).Highlight(...found));
                focusMatch(0);
            }
        },
        [clearHighlights, focusMatch]
    );

    // Live search as you type (debounced). Re-runs when the route changes.
    useEffect(() => {
        const t = setTimeout(() => runSearch(query), 120);
        return () => clearTimeout(t);
    }, [query, pathname, runSearch]);

    useEffect(() => {
        // Add the highlight styles straight to <head> (once). This sits outside
        // React and outside Next's CSS pipeline, so it always applies.
        if (!document.getElementById("page-search-style")) {
            const el = document.createElement("style");
            el.id = "page-search-style";
            el.textContent = HIGHLIGHT_CSS;
            document.head.appendChild(el);
        }
        inputRef.current?.focus();
        return clearHighlights;
    }, [clearHighlights]);

    const step = (dir: 1 | -1) => {
        if (canHighlight() && ranges.current.length) {
            focusMatch((active + dir + ranges.current.length) % ranges.current.length);
        } else if (query.trim()) {
            // Older browsers without the Highlight API: use the native find.
            (window as any).find?.(query, false, dir === -1, true);
        }
    };

    const noResults = query.trim() !== "" && count === 0 && canHighlight();

    return (
        <div role="search" className="h-16 flex items-center gap-3 px-4">
            <Search size={18} className="text-white/50 flex-shrink-0" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        step(e.shiftKey ? -1 : 1);
                    } else if (e.key === "Escape") {
                        onClose();
                    }
                }}
                placeholder="Find on this page…"
                aria-label="Find on this page"
                className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
            />

            {query.trim() !== "" && (
                <span className="text-xs tabular-nums text-white/60 whitespace-nowrap">
                    {noResults ? "No results" : count > 0 ? `${active + 1} / ${count}` : ""}
                </span>
            )}

            <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous match"
                disabled={count === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
                <ChevronUp size={18} />
            </button>
            <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next match"
                disabled={count === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
                <ChevronDown size={18} />
            </button>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            >
                <X size={18} />
            </button>
        </div>
    );
}