import { useState } from 'react';

interface SearchResult {
    chunkSignature?: string;
    text?: string;
    source?: {
        bucket?: {
            bucketName?: string;
            applicationName?: string;
        };
        object?: string;
    };
    payloadSignature?: string;
    score?: number;
    type?: string;
}

interface SearchResponse {
    results: SearchResult[];
    requestId: string;
}

export default function SearchInterface() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: query,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Search failed');
            }

            const data: SearchResponse = await response.json();
            console.log('Search response:', data);
            setResults(data.results || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <form onSubmit={handleSearch} className="mb-12">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search your documents..."
                        className="flex-1 px-5 py-3.5 text-base border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-sm"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-8 py-3.5 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md text-red-700 text-sm">
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="text-sm text-gray-500 font-medium mb-6">
                        {results.length} {results.length === 1 ? 'result' : 'results'}
                    </div>
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className="p-6 border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors"
                        >
                            {/* Document header */}
                            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                                <div className="flex-1 min-w-0">
                                    {result.source?.object && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-900 truncate">{result.source.object}</span>
                                        </div>
                                    )}
                                    {result.type && (
                                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                            {result.type}
                                        </span>
                                    )}
                                </div>
                                {result.score !== undefined && (
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Relevance</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {(result.score * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 flex items-center justify-center">
                                            <svg className="transform -rotate-90 w-12 h-12" viewBox="0 0 48 48">
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    className="text-gray-200"
                                                />
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeDasharray={`${2 * Math.PI * 20}`}
                                                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - result.score)}`}
                                                    className="text-primary transition-all"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Main content */}
                            {result.text && (
                                <p className="text-gray-900 leading-relaxed mb-4">
                                    {result.text}
                                </p>
                            )}

                            {/* Footer with metadata */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex gap-2 flex-wrap items-center">
                                    {result.source?.bucket?.bucketName && (
                                        <span className="text-xs text-gray-500">
                                            <span className="font-medium">Bucket:</span> {result.source.bucket.bucketName}
                                        </span>
                                    )}
                                    {result.chunkSignature && (
                                        <span className="text-xs font-mono text-gray-400">
                                            #{result.chunkSignature.substring(0, 8)}
                                        </span>
                                    )}
                                </div>
                                <details className="group">
                                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-900 font-medium list-none">
                                        <span className="flex items-center gap-1">
                                            <span>Details</span>
                                            <svg className="h-3 w-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <pre className="mt-3 text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto font-mono">
{JSON.stringify(result, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && results.length === 0 && query && (
                <div className="text-center text-gray-500 py-12">
                    No results found for <span className="font-medium">"{query}"</span>
                </div>
            )}
        </div>
    );
}
