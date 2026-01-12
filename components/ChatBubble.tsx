import React from 'react';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon, ArchiveIcon, DocumentTextIcon, CalendarIcon, ListIcon, ExternalLinkIcon, DocumentDuplicateIcon, CheckIcon, PinSlashIcon, TrashIcon, NotebookIcon, PencilIcon } from './Icons';

interface ChatBubbleProps {
  message: ChatMessage;
  onPreviewDocument?: (content: string) => void;
  onAddDeadline?: (date: string, title: string, description: string) => void;
  onAddTask?: (text: string) => void;
  onAddNote?: (content: string, linkedMsg?: string, noteId?: string) => void;
  lawArea?: string;
  topic?: string;
  existingNotes?: any[];
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPreviewDocument,
  onAddDeadline,
  onAddTask,
  onAddNote,
  onUpdateNotePosition,
  onDeleteNote,
  lawArea,
  topic,
  existingNotes
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [isAddingNote, setIsAddingNote] = React.useState(false);
  const [noteContent, setNoteContent] = React.useState('');
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null);
  const chatBubbleRef = React.useRef<HTMLDivElement>(null);
  const [draggingNoteId, setDraggingNoteId] = React.useState<string | null>(null);

  // If we have an active note, ensure content is synced for editing
  React.useEffect(() => {
    if (activeNoteId && existingNotes) {
      const note = existingNotes.find((n: any) => n.id === activeNoteId);
      if (note) setNoteContent(note.content);
    } else if (isAddingNote) {
      setNoteContent('');
    }
  }, [activeNoteId, isAddingNote, existingNotes]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, note: any) => {
    e.stopPropagation();
    if (activeNoteId === note.id) return;
    setDraggingNoteId(note.id);
  };

  React.useEffect(() => {
    if (!draggingNoteId) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!chatBubbleRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rect = chatBubbleRef.current.getBoundingClientRect();
      const x = clientX - rect.left - 16;
      const y = clientY - rect.top - 16;

      // Constrain to bubble
      const constrainedX = Math.max(0, Math.min(x, rect.width - 32));
      const constrainedY = Math.max(0, Math.min(y, rect.height - 32));

      onUpdateNotePosition?.(draggingNoteId, { x: constrainedX, y: constrainedY });
    };

    const handleUp = () => {
      setDraggingNoteId(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingNoteId, onUpdateNotePosition]);


  if (isSystem) {
    return (
      <div className="text-center my-4">
        <p className="text-sm text-slate-400 bg-slate-800/50 rounded-full px-4 py-1 inline-block">{message.content}</p>
      </div>
    );
  }

  const handleSaveNote = () => {
    if (noteContent.trim()) {
      // Pass content, snippet/link, and existing note ID if updating
      onAddNote?.(noteContent, message.content.substring(0, 50), activeNoteId || undefined);
      setIsAddingNote(false);
      setActiveNoteId(null);
      // Ideally keep the just-saved one open or just collapsed to icon. 
      // "notatka powinna byc widoczna w takiej formie" -> icon.
      // So collapse to icon.
    }
  };

  const hasDocument = !isUser && message.content.includes('--- PROJEKT PISMA ---');
  const hasDeadline = !isUser && message.content.includes('--- PROJEKT TERMINU ---');
  const hasTask = !isUser && message.content.includes('--- PROJEKT ZADANIA ---');

  const extractDocumentContent = () => {
    const parts = message.content.split('--- PROJEKT PISMA ---');
    return parts[1] ? parts[1].trim() : '';
  };

  const renderDeadlineButtons = () => {
    const parts = message.content.split('--- PROJEKT TERMINU ---');
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

  const positionedNotes = existingNotes?.filter((n: any) => n.position);
  const dockNotes = existingNotes?.filter((n: any) => !n.position);

  return (
    <div className={`flex items-start gap-4 my-6 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex-shrink-0 flex items-center justify-center border-2 border-slate-700">
          <BotIcon />
        </div>
      )}
      <div
        ref={chatBubbleRef}
        className={`relative max-w-2xl p-4 shadow-md group ${isUser // Relative and group for positioning
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-t-2xl rounded-bl-2xl'
          : 'bg-slate-700/80 backdrop-blur-sm text-slate-200 rounded-t-2xl rounded-br-2xl'
          }`}
      >
        {/* Render Positioned Notes */}
        {positionedNotes?.map((note: any) => (
          <div
            key={note.id}
            style={{ left: note.position.x, top: note.position.y }}
            className="absolute z-10"
          >
            <div
              onMouseDown={(e) => handleDragStart(e, note)}
              onTouchStart={(e) => handleDragStart(e, note)}
              className="relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle expand
                  if (activeNoteId === note.id) {
                    setActiveNoteId(null);
                    setIsAddingNote(false);
                  } else {
                    setActiveNoteId(note.id);
                    setIsAddingNote(false);
                  }
                }}
                className={`p-2 rounded-lg transition-all shadow-sm backdrop-blur-sm cursor-move ${activeNoteId === note.id
                  ? 'bg-amber-500/90 text-white border-amber-400'
                  : 'bg-slate-800/80 text-amber-500 border border-amber-500/30 hover:bg-slate-800'}`}
              >
                <DocumentTextIcon className="w-4 h-4" />
              </button>
              {/* Unpin button - appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateNotePosition?.(note.id, null); // Return to dock
                }}
                className="absolute -top-2 -right-2 bg-slate-700 hover:bg-red-500 text-slate-400 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-600"
                title="Odepnij notatkę"
              >
                <PinSlashIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {formatContentWithISAPLinks(message.content)}

        {onAddNote && (
          <div className="flex flex-col gap-2 mt-4 relative z-0">
            <div className="flex flex-wrap justify-end gap-2 items-center min-h-[32px]">
              {/* Render icons for existing notes */}
              {dockNotes?.map((note: any) => (
                <button
                  key={note.id}
                  onMouseDown={(e) => handleDragStart(e, note)}
                  onTouchStart={(e) => handleDragStart(e, note)}
                  onClick={() => {
                    if (activeNoteId === note.id) {
                      setActiveNoteId(null);
                      setIsAddingNote(false);
                    } else {
                      setActiveNoteId(note.id);
                      setIsAddingNote(false);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all border cursor-move ${activeNoteId === note.id
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500/70 hover:text-amber-500 border-amber-500/20'}`}
                  title="Pokaż notatkę"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                </button>
              ))}

              {/* Add Note Button */}
              {!isAddingNote && (
                <button
                  onClick={() => {
                    setIsAddingNote(true);
                    setActiveNoteId(null);
                    setNoteContent('');
                  }}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center border ${isUser
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    : 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-400 hover:text-white border-slate-600/50'}`}
                  title="Dodaj nową notatkę"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content Area for Active Note or New Note */}
            {(activeNoteId || isAddingNote) && (
              <div className="bg-slate-800/95 border border-slate-700/50 rounded-xl p-3 animate-in zoom-in-95 duration-200 shadow-xl backdrop-blur-md relative">
                <button
                  onClick={() => {
                    setActiveNoteId(null);
                    setIsAddingNote(false);
                  }}
                  className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
                >
                  <div className="w-4 h-4 flex items-center justify-center transform hover:rotate-90 transition-transform">
                    <span className="block w-full h-px bg-current rotate-45 absolute"></span>
                    <span className="block w-full h-px bg-current -rotate-45 absolute"></span>
                  </div>
                </button>

                {activeNoteId && !isAddingNote ? (
                  <div className="pr-6">
                    <textarea
                      className="w-full bg-transparent text-slate-200 text-xs focus:outline-none min-h-[60px] resize-none"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Treść notatki..."
                    />
                    <div className="flex justify-end mt-2 gap-2">
                      <button
                        onClick={() => {
                          if (onDeleteNote && activeNoteId) {
                            if (confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
                              onDeleteNote(activeNoteId);
                              setActiveNoteId(null);
                              setIsAddingNote(false);
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600/20 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all uppercase flex items-center gap-1 border border-red-500/30"
                      >
                        <TrashIcon className="w-3 h-3" />
                        Usuń
                      </button>
                      <button
                        onClick={handleSaveNote}
                        disabled={!noteContent.trim()}
                        className="px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-all uppercase flex items-center gap-1"
                      >
                        <CheckIcon className="w-3 h-3" />
                        Zaktualizuj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pr-6">
                    <textarea
                      className="w-full bg-transparent text-slate-200 text-xs focus:outline-none min-h-[60px] resize-none"
                      placeholder="Nowa notatka..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSaveNote}
                        disabled={!noteContent.trim()}
                        className="px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-all uppercase flex items-center gap-1"
                      >
                        <CheckIcon className="w-3 h-3" />
                        Zapisz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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