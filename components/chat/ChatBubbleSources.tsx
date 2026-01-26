import React from 'react';
import { ArchiveIcon } from '../Icons';

interface ChatBubbleSourcesProps {
    sources: { web?: { uri: string; title?: string } }[];
}

const ChatBubbleSources: React.FC<ChatBubbleSourcesProps> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-slate-600/50">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase">
                <ArchiveIcon />
                Źródła:
            </h4>
            <ul className="list-decimal list-inside text-sm space-y-1">
                {sources.map((source, index) => (
                    source.web && (
                        <li key={index}>
                            <a
                                href={source.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:underline"
                                title={source.web.uri}
                            >
                                {source.web.title || new URL(source.web.uri).hostname}
                            </a>
                        </li>
                    )
                ))}
            </ul>
        </div>
    );
};

export default ChatBubbleSources;
