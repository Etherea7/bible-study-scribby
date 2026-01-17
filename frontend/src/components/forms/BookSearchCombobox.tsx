import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Book } from 'lucide-react';
import { BIBLE_BOOKS, getBooksGroupedByTestament } from '../../utils/bibleData';

interface BookSearchComboboxProps {
    value: string;
    onChange: (book: string) => void;
    className?: string;
}

export function BookSearchCombobox({ value, onChange, className = '' }: BookSearchComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { oldTestament, newTestament } = useMemo(() => getBooksGroupedByTestament(), []);

    // Filter books based on search query
    const filteredBooks = useMemo(() => {
        if (!searchQuery.trim()) {
            return BIBLE_BOOKS;
        }
        const query = searchQuery.toLowerCase().trim();
        return BIBLE_BOOKS.filter((book) =>
            book.name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    // Group filtered books by testament
    const groupedBooks = useMemo(() => {
        const ot = filteredBooks.filter((b) => oldTestament.includes(b.name));
        const nt = filteredBooks.filter((b) => newTestament.includes(b.name));
        return { oldTestament: ot, newTestament: nt };
    }, [filteredBooks, oldTestament, newTestament]);

    // Flat list for keyboard navigation
    const flatList = useMemo(() => {
        return [...groupedBooks.oldTestament, ...groupedBooks.newTestament];
    }, [groupedBooks]);

    // Reset highlighted index when filtered list changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredBooks]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlightedElement = listRef.current.querySelector('[data-highlighted="true"]');
            highlightedElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < flatList.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (flatList[highlightedIndex]) {
                    handleSelect(flatList[highlightedIndex].name);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchQuery('');
                break;
        }
    };

    const handleSelect = (bookName: string) => {
        onChange(bookName);
        setIsOpen(false);
        setSearchQuery('');
    };

    const selectedBook = BIBLE_BOOKS.find((b) => b.name === value);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Book
            </label>

            {/* Trigger Button / Search Input */}
            <div
                className={`
          relative flex items-center w-full px-3 py-2.5
          bg-[var(--bg-elevated)] border border-[var(--border-color)]
          rounded-lg cursor-pointer transition-all duration-200
          ${isOpen ? 'ring-2 ring-[var(--color-observation)]/30 border-[var(--color-observation)]' : ''}
        `}
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
            >
                {isOpen ? (
                    <>
                        <Search className="h-4 w-4 text-[var(--text-muted)] mr-2 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search books..."
                            className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                            autoComplete="off"
                        />
                    </>
                ) : (
                    <>
                        <Book className="h-4 w-4 text-[var(--color-observation)] mr-2 flex-shrink-0" />
                        <span className="flex-1 text-[var(--text-primary)]">
                            {selectedBook?.name || 'Select a book'}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] mr-2">
                            {selectedBook?.chapters} ch.
                        </span>
                        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                    </>
                )}
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <div
                    ref={listRef}
                    className="
            absolute z-50 mt-1 w-full max-h-64 overflow-auto
            bg-[var(--bg-surface)] border border-[var(--border-color)]
            rounded-lg shadow-lg
          "
                >
                    {flatList.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[var(--text-muted)] text-center">
                            No books found
                        </div>
                    ) : (
                        <>
                            {/* Old Testament Group */}
                            {groupedBooks.oldTestament.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-elevated)] sticky top-0">
                                        Old Testament
                                    </div>
                                    {groupedBooks.oldTestament.map((book, idx) => {
                                        const globalIndex = idx;
                                        const isHighlighted = highlightedIndex === globalIndex;
                                        const isSelected = book.name === value;

                                        return (
                                            <div
                                                key={book.name}
                                                data-highlighted={isHighlighted}
                                                onClick={() => handleSelect(book.name)}
                                                className={`
                          flex items-center justify-between px-4 py-2 cursor-pointer
                          transition-colors duration-100
                          ${isHighlighted ? 'bg-[var(--color-observation)]/10' : ''}
                          ${isSelected ? 'text-[var(--color-observation)] font-medium' : 'text-[var(--text-primary)]'}
                          hover:bg-[var(--bg-elevated)]
                        `}
                                            >
                                                <span className="text-sm">{book.name}</span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {book.chapters} ch.
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* New Testament Group */}
                            {groupedBooks.newTestament.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-elevated)] sticky top-0">
                                        New Testament
                                    </div>
                                    {groupedBooks.newTestament.map((book, idx) => {
                                        const globalIndex = groupedBooks.oldTestament.length + idx;
                                        const isHighlighted = highlightedIndex === globalIndex;
                                        const isSelected = book.name === value;

                                        return (
                                            <div
                                                key={book.name}
                                                data-highlighted={isHighlighted}
                                                onClick={() => handleSelect(book.name)}
                                                className={`
                          flex items-center justify-between px-4 py-2 cursor-pointer
                          transition-colors duration-100
                          ${isHighlighted ? 'bg-[var(--color-observation)]/10' : ''}
                          ${isSelected ? 'text-[var(--color-observation)] font-medium' : 'text-[var(--text-primary)]'}
                          hover:bg-[var(--bg-elevated)]
                        `}
                                            >
                                                <span className="text-sm">{book.name}</span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {book.chapters} ch.
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
