import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon, DocumentDuplicateIcon, CheckIcon, DownloadIcon, PencilIcon, LightbulbIcon } from './Icons';
import { useChatBubble } from '../hooks/useChatBubble';
import { useChatContext } from '../context/ChatContext';
import LoadingSpinner from './LoadingSpinner';

// Sub-components
import ChatBubbleNote from './chat/ChatBubbleNote';
import ChatBubbleSpecialContent from './chat/ChatBubbleSpecialContent';
import ChatBubbleSources from './chat/ChatBubbleSources';
import ChatBubbleFollowUps from './chat/ChatBubbleFollowUps';

interface ChatBubbleProps {
  message: ChatMessage;
  onPreviewDocument?: (content: string) => void;
  onAddDeadline?: (date: string, title: string, description: string) => void;
  onAddTask?: (text: string) => void;
  onAddNote?: (content: string, linkedMsg?: string, noteId?: string) => void;
  onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
  onDeleteNote?: (noteId: string) => void;
  onSelectMode?: (mode: any) => void;
  lawArea?: string;
  topic?: string;
  existingNotes?: any[];
  onStartAgent?: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPreviewDocument,
  onAddDeadline,
  onAddTask,
  onAddNote,
  onUpdateNotePosition,
  onDeleteNote,
  onSelectMode,
  lawArea,
  topic,
  existingNotes,
  onStartAgent
}) => {
  const { t } = useTranslation();
  const { handleSuggestSolutions, isSuggestionsLoading, chatHistory } = useChatContext();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const {
    isAddingNote, setIsAddingNote,
    noteContent, setNoteContent,
    activeNoteId, setActiveNoteId,
    isCopied, chatBubbleRef,
    handleCopy, handleDragStart,
    handleSaveNote, handleDownloadPDF
  } = useChatBubble({
    message,
    existingNotes,
    onAddNote,
    onUpdateNotePosition
  });

  if (isSystem) {
    return (
      <div className="text-center my-4">
        <p className="text-sm text-slate-400 bg-slate-800/50 rounded-full px-4 py-1 inline-block">{message.content}</p>
      </div>
    );
  }

  const formatContentWithISAPLinks = (text: string) => {
    const regex = /(?:Art\.|art\.)\s+(\d+[a-z]*)(?:\s+§\s+\d+)?\s+(?:k\.?c\.?|k\.?p\.?|k\.?k\.?|k\.?r\.?o\.?|k\.?p\.?c\.?|k\.?p\.?k\.?|k\.?s\.?h\.?|ustawy)/gi;
    if (!text) return null;
    const parts = text.split(regex);
    const matches = text.match(regex);
    if (!matches) return <p className="whitespace-pre-wrap">{text}</p>;

    return (
      <p className="whitespace-pre-wrap">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < matches.length && (
              <a
                href={`https://isap.sejm.gov.pl/isap.nsf/search.xsp?query=${encodeURIComponent(matches[i])}&type=3`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 hover:underline decoration-dash underline-offset-4 bg-cyan-950/30 px-1 rounded transition-colors"
                title="Zobacz treść przepisu w ISAP"
              >
                {matches[i]}
              </a>
            )}
          </React.Fragment>
        ))}
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
        className={`relative max-w-2xl p-4 shadow-md group ${isUser
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-t-2xl rounded-bl-2xl'
          : 'bg-slate-700/80 backdrop-blur-sm text-slate-200 rounded-t-2xl rounded-br-2xl'
          }`}
      >
        {positionedNotes?.map((note: any) => (
          <ChatBubbleNote
            key={note.id}
            note={note}
            activeNoteId={activeNoteId}
            setActiveNoteId={setActiveNoteId}
            isAddingNote={isAddingNote}
            setIsAddingNote={setIsAddingNote}
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            handleSaveNote={handleSaveNote}
            onDeleteNote={onDeleteNote}
            handleDragStart={handleDragStart}
            onUpdateNotePosition={onUpdateNotePosition}
            chatBubbleRef={chatBubbleRef}
            isPinned
          />
        ))}

        {formatContentWithISAPLinks(message.content)}

        {message.isAgentIntro && onStartAgent && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onStartAgent}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20 animate-bounce"
            >
              <BotIcon className="w-5 h-5" />
              <span>ROZPOCZNIJ ANALIZĘ</span>
            </button>
          </div>
        )}

        {onAddNote && (
          <div className="flex flex-col gap-2 mt-4 relative z-0">
            <div className="flex flex-wrap justify-between gap-2 items-center min-h-[32px]">
              <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg transition-all ${isUser ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50'}`}
                  title="Kopiuj tekst"
                >
                  {isCopied ? <CheckIcon className="w-4 h-4" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDownloadPDF(topic)}
                  className={`p-1.5 rounded-lg transition-all ${isUser ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50'}`}
                  title="Pobierz PDF / Drukuj"
                >
                  <DownloadIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap justify-end gap-2 items-center">
                {dockNotes?.map((note: any) => (
                  <ChatBubbleNote
                    key={note.id}
                    note={note}
                    activeNoteId={activeNoteId}
                    setActiveNoteId={setActiveNoteId}
                    isAddingNote={isAddingNote}
                    setIsAddingNote={setIsAddingNote}
                    noteContent={noteContent}
                    setNoteContent={setNoteContent}
                    handleSaveNote={handleSaveNote}
                    onDeleteNote={onDeleteNote}
                    handleDragStart={handleDragStart}
                    onUpdateNotePosition={onUpdateNotePosition}
                    chatBubbleRef={chatBubbleRef}
                  />
                ))}

                {!isUser && (
                  <button
                    onClick={handleSuggestSolutions}
                    disabled={isSuggestionsLoading || chatHistory.length < 6}
                    className={`p-2 rounded-lg transition-all border ${chatHistory.length < 6
                        ? 'opacity-50 cursor-not-allowed bg-slate-700/30 text-slate-500 border-slate-700'
                        : 'bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 hover:text-cyan-300 border-cyan-500/30'
                      } relative`}
                    title={chatHistory.length < 6 ? t('suggestions.tooltipDisabled') : t('suggestions.button')}
                  >
                    {isSuggestionsLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <LightbulbIcon className="w-4 h-4" />
                        {chatHistory.length >= 6 && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                        )}
                      </>
                    )}
                  </button>
                )}

                {!isAddingNote && (
                  <button
                    onClick={() => { setIsAddingNote(true); setActiveNoteId(null); setNoteContent(''); }}
                    className={`p-2 rounded-lg transition-all border ${isUser ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-400 hover:text-white border-slate-600/50'}`}
                    title="Dodaj nową notatkę"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {(isAddingNote || (activeNoteId && dockNotes?.some(n => n.id === activeNoteId))) && (
              <div className="bg-slate-800/95 border border-slate-700/50 rounded-xl p-3 animate-in zoom-in-95 duration-200 shadow-xl backdrop-blur-md relative">
                <button onClick={() => { setActiveNoteId(null); setIsAddingNote(false); }} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
                  <div className="w-4 h-4 flex items-center justify-center transform hover:rotate-90 transition-transform">
                    <span className="block w-full h-px bg-current rotate-45 absolute"></span>
                    <span className="block w-full h-px bg-current -rotate-45 absolute"></span>
                  </div>
                </button>
                <div className="pr-6">
                  <textarea
                    className="w-full bg-transparent text-slate-200 text-xs focus:outline-none min-h-[60px] resize-none"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={isAddingNote && !activeNoteId ? "Nowa notatka..." : "Treść notatki..."}
                    autoFocus
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    {activeNoteId && !isAddingNote && (
                      <button
                        onClick={() => { if (confirm('Czy na pewno chcesz usunąć tę notatkę?')) { onDeleteNote?.(activeNoteId); setActiveNoteId(null); setIsAddingNote(false); } }}
                        className="px-3 py-1 bg-red-600/20 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all uppercase flex items-center gap-1 border border-red-500/30"
                      >
                        Usuń
                      </button>
                    )}
                    <button
                      onClick={handleSaveNote}
                      disabled={!noteContent.trim()}
                      className="px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-all uppercase flex items-center gap-1"
                    >
                      <CheckIcon className="w-3 h-3" />
                      {isAddingNote && !activeNoteId ? 'Zapisz' : 'Zaktualizuj'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <ChatBubbleSpecialContent
          content={message.content}
          onPreviewDocument={onPreviewDocument}
          onAddDeadline={onAddDeadline}
          onAddTask={onAddTask}
        />

        <ChatBubbleSources sources={message.sources || []} />

        <ChatBubbleFollowUps followUpOptions={message.followUpOptions || []} onSelectMode={onSelectMode!} />
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