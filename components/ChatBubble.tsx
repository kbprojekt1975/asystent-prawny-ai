import React from 'react';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon, ArchiveIcon, DocumentTextIcon, CalendarIcon, ListIcon, ExternalLinkIcon } from './Icons';

interface ChatBubbleProps {
  message: ChatMessage;
  onPreviewDocument?: (content: string) => void;
  onAddDeadline?: (date: string, title: string, description: string) => void;
  onAddTask?: (text: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPreviewDocument,
  onAddDeadline,
  onAddTask
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center my-4">
        <p className="text-sm text-slate-400 bg-slate-800/50 rounded-full px-4 py-1 inline-block">{message.content}</p>
      </div>
    );
  }

  const hasDocument = !isUser && message.content.includes('--- PROJEKT PISMA ---');
  const hasDeadline = !isUser && message.content.includes('--- PROJEKT TERMINU ---');
  const hasTask = !isUser && message.content.includes('--- PROJEKT ZADANIA ---');

  const extractDocumentContent = () => {
    const parts = message.content.split('--- PROJEKT PISMA ---');
    return parts[1] ? parts[1].trim() : '';
  };

  const renderDeadlineButtons = () => {
    const parts = message.content.split('--- PROJEKT TERMINU ---');
    // Filter for content between delimiters, assuming an even number of parts for content
    return parts.filter((_, i) => i % 2 !== 0).map((content, idx) => {
      const [date, title, description] = content.split('|').map(s => s.trim());
      return (
        <button
          key={`deadline-${idx}`}
          onClick={() => onAddDeadline?.(date, title, description)}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition-all active:scale-95 text-left"
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span>Dodaj do Terminarza: {title} ({date})</span>
        </button>
      );
    });
  };

  const renderTaskButtons = () => {
    const parts = message.content.split('--- PROJEKT ZADANIA ---');
    // Filter for content between delimiters
    return parts.filter((_, i) => i % 2 !== 0).map((content, idx) => {
      const text = content.trim();
      return (
        <button
          key={`task-${idx}`}
          onClick={() => onAddTask?.(text)}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 transition-all active:scale-95 text-left"
        >
          <ListIcon className="h-4 w-4 shrink-0" />
          <span>Dodaj Zadanie: {text}</span>
        </button>
      );
    });
  };

  const formatContentWithISAPLinks = (text: string) => {
    // Regex for common Polish legal citations: Art. 123 [possible paragraph] Code
    const regex = /(?:Art\.|art\.)\s+(\d+[a-z]*)(?:\s+§\s+\d+)?\s+(?:k\.?c\.?|k\.?p\.?|k\.?k\.?|k\.?r\.?o\.?|k\.?p\.?c\.?|k\.?p\.?k\.?|k\.?s\.?h\.?|ustawy)/gi;

    if (!text) return null;

    const parts = text.split(regex);
    const matches = text.match(regex);

    if (!matches) return <p className="whitespace-pre-wrap">{text}</p>;

    return (
      <p className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (i < matches.length) {
            const citation = matches[i];
            const isapUrl = `https://isap.sejm.gov.pl/isap.nsf/search.xsp?query=${encodeURIComponent(citation)}&type=3`;
            return (
              <React.Fragment key={i}>
                {part}
                <a
                  href={isapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 hover:underline decoration-dash underline-offset-4 bg-cyan-950/30 px-1 rounded transition-colors"
                  title="Zobacz treść przepisu w ISAP"
                >
                  {citation}
                  <ExternalLinkIcon className="w-3 h-3 opacity-50" />
                </a>
              </React.Fragment>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </p>
    );
  };

  return (
    <div className={`flex items-start gap-4 my-6 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex-shrink-0 flex items-center justify-center border-2 border-slate-700">
          <BotIcon />
        </div>
      )}
      <div
        className={`max-w-2xl p-4 shadow-md ${isUser
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-t-2xl rounded-bl-2xl'
          : 'bg-slate-700/80 backdrop-blur-sm text-slate-200 rounded-t-2xl rounded-br-2xl'
          }`}
      >
        {formatContentWithISAPLinks(message.content)}

        {hasDocument && onPreviewDocument && (
          <div className="mt-4 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
            <p className="text-xs font-semibold text-cyan-400 uppercase">Wykryto projekt dokumentu</p>
            <button
              onClick={() => onPreviewDocument(extractDocumentContent())}
              className="flex items-center justify-center gap-2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-all"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Podgląd i Drukuj
            </button>
          </div>
        )}

        {hasDeadline && renderDeadlineButtons()}
        {hasTask && renderTaskButtons()}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-600/50">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase">
              <ArchiveIcon />
              Źródła:
            </h4>
            <ul className="list-decimal list-inside text-sm space-y-1">
              {message.sources.map((source, index) => (
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
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center border-2 border-slate-700">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;