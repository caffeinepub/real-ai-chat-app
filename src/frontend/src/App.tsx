import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Bot,
  ChevronRight,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Role } from "./backend.d";
import type { Message } from "./backend.d";
import {
  useClearHistory,
  useCreateConversation,
  useGetCurrentConversationId,
  useGetHistory,
  useListConversations,
  useSendMessage,
  useSwitchConversation,
} from "./hooks/useQueries";

const queryClient = new QueryClient();

const SUGGESTED_PROMPTS = [
  { label: "Explain quantum computing", icon: "⚛️" },
  { label: "Write a short poem about the cosmos", icon: "🌌" },
  { label: "Help me debug my code", icon: "🐛" },
  { label: "What's the meaning of life?", icon: "🤔" },
  { label: "Suggest a recipe for tonight", icon: "🍳" },
  { label: "Tell me a fascinating fun fact", icon: "💡" },
];

function TypingIndicator() {
  return (
    <div
      data-ocid="chat.loading_state"
      className="flex items-end gap-3 px-4 py-2 animate-fade-in"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="assistant-bubble rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
          <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
          <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === Role.user;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex items-end gap-3 px-4 py-1.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "user-bubble rounded-br-sm"
            : "assistant-bubble rounded-bl-sm",
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-glow-sm">
          Y
        </div>
      )}
    </motion.div>
  );
}

function ChatApp() {
  const [input, setInput] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations = [] } = useListConversations();
  const { data: history = [] } = useGetHistory();
  const { data: currentConvId } = useGetCurrentConversationId();

  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const switchConversation = useSwitchConversation();
  const clearHistory = useClearHistory();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger
  }, [optimisticMessages, history, isTyping]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMsg: Message = {
        id: BigInt(Date.now()),
        content: trimmed,
        role: Role.user,
        timestamp: BigInt(Date.now()),
      };
      setOptimisticMessages([...history, userMsg]);
      setIsTyping(true);

      try {
        const reply = await sendMessage.mutateAsync(trimmed);
        const assistantMsg: Message = {
          id: BigInt(Date.now() + 1),
          content: reply,
          role: Role.assistant,
          timestamp: BigInt(Date.now()),
        };
        setOptimisticMessages([...history, userMsg, assistantMsg]);
      } catch {
        toast.error("Failed to send message");
        setOptimisticMessages([]);
      } finally {
        setIsTyping(false);
        setTimeout(() => setOptimisticMessages([]), 100);
      }
    },
    [history, isTyping, sendMessage],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleNewChat = async () => {
    const name = `Chat ${new Date().toLocaleString()}`;
    try {
      await createConversation.mutateAsync(name);
      setOptimisticMessages([]);
    } catch {
      toast.error("Failed to create conversation");
    }
  };

  const handleSwitchConversation = async (id: bigint) => {
    try {
      await switchConversation.mutateAsync(id);
      setOptimisticMessages([]);
    } catch {
      toast.error("Failed to switch conversation");
    }
  };

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clearHistory.mutateAsync();
      setOptimisticMessages([]);
      toast.success("Conversation cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const displayMessages =
    optimisticMessages.length > 0 ? optimisticMessages : history;
  const isEmpty = displayMessages.length === 0 && !isTyping;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-700 tracking-tight text-sidebar-foreground">
            NeuralChat
          </span>
        </div>

        {/* New Chat button */}
        <div className="p-3">
          <Button
            data-ocid="sidebar.new_chat_button"
            onClick={handleNewChat}
            disabled={createConversation.isPending}
            className="w-full justify-start gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:shadow-glow-sm transition-all"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-4">
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Conversations
            </p>
            <AnimatePresence>
              {conversations.length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  No conversations yet
                </p>
              )}
              {conversations.map(([id, name], idx) => {
                const isActive =
                  currentConvId !== undefined && id === currentConvId;
                return (
                  <motion.div
                    key={id.toString()}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ delay: idx * 0.04 }}
                    data-ocid={`chat.conversation.item.${idx + 1}`}
                    onClick={() => handleSwitchConversation(id)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs">{name}</span>
                    <button
                      type="button"
                      data-ocid="chat.clear_button"
                      onClick={handleClearHistory}
                      className="invisible flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:visible transition-colors"
                      aria-label="Clear conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {isActive && (
                      <ChevronRight className="h-3 w-3 shrink-0 text-primary" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <p className="text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Built with{" "}
            <span className="text-primary">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-3.5 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-glow-sm animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              AI Assistant
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Online
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <motion.div
                data-ocid="chat.messages.empty_state"
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="flex h-full min-h-[calc(100vh-160px)] flex-col items-center justify-center px-6 py-12"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/30 shadow-glow">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h1 className="mb-2 font-display text-3xl font-700 tracking-tight text-foreground">
                  NeuralChat
                </h1>
                <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
                  Your intelligent AI assistant. Ask me anything — from complex
                  questions to creative ideas.
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      type="button"
                      key={prompt.label}
                      data-ocid={`chat.prompt_chip.${idx + 1}`}
                      onClick={() => handleSend(prompt.label)}
                      className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-glow-sm active:scale-95"
                    >
                      <span>{prompt.icon}</span>
                      <span className="text-xs font-medium">
                        {prompt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4"
              >
                {displayMessages.map((msg) => (
                  <MessageBubble key={msg.id.toString()} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="relative flex-1 rounded-2xl border border-border bg-card transition-all focus-within:border-primary/50 focus-within:shadow-glow-sm">
              <Textarea
                ref={textareaRef}
                data-ocid="chat.message_input"
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Message NeuralChat..."
                disabled={isTyping}
                rows={1}
                className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              data-ocid="chat.send_button"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-glow-sm transition-all hover:scale-105 hover:shadow-glow disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Press{" "}
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              Shift+Enter
            </kbd>{" "}
            for new line
          </p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatApp />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
