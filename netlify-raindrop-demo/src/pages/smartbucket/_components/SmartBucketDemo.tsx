import { useState } from 'react';
import UploadInterface from '../../upload/_components/UploadInterface';
import SearchInterface from '../../search/_components/SearchInterface';

export default function SmartBucketDemo() {
    const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');

    return (
        <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`
                            py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${
                                activeTab === 'upload'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        Upload Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`
                            py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${
                                activeTab === 'search'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        Search Documents
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'upload' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
                            <p className="text-gray-600">
                                Upload PDF, text, or markdown files to your SmartBucket. Documents are automatically chunked and embedded for semantic search.
                            </p>
                        </div>
                        <UploadInterface />
                    </div>
                )}
                {activeTab === 'search' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">Search Documents</h2>
                            <p className="text-gray-600">
                                Use natural language to search across your uploaded documents. Results are ranked by semantic similarity.
                            </p>
                        </div>
                        <SearchInterface />
                    </div>
                )}
            </div>
        </div>
    );
}
