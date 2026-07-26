"use client";

import * as React from "react";
import {
  Minus,
  ArrowsOutSimple,
  X,
  Paperclip,
  ImageSquare,
  Link,
  Smiley,
  Signature,
  TextB,
  TextItalic,
  TextUnderline,
  ArrowCounterClockwise,
  ArrowClockwise,
  ListBullets,
  ListNumbers,
  TextAlignLeft,
  PaperPlaneTilt,
  CaretUp,
} from "@phosphor-icons/react";

export type EmailEditorAttachment = {
  filename: string;
  contentType: string;
  size: number;
  contentBase64: string;
};

export type EmailEditorPayload = {
  to: string;

  // IMPORTANT:
  // Backend /newinvitations/create checks these fields to resolve influencer email.
  recipientEmail: string;
  influencerEmail: string;
  creatorEmail: string;
  businessEmail: string;
  contactEmail: string;

  subject: string;
  body: string;
  htmlBody: string;
  attachments: EmailEditorAttachment[];

  fromEmail: string;
  fromName: string;
  fromProxyMailId: string;

  toName: string;
  toEmail: string;
  toProxyMailId: string;
};

export type EmailEditorProps = {
  open: boolean;
  onClose: () => void;

  fromName?: string;
  fromEmail?: string;
  fromAvatar?: string | null;
  fromProxyMailId?: string;

  toLabel?: string;
  toName?: string;
  toEmail?: string;
  toAvatar?: string | null;
  toProxyMailId?: string;

  subject?: string;
  initialBody?: string;
  initialHtmlBody?: string;
  startExpanded?: boolean;
  sending?: boolean;
  onSend: (payload: EmailEditorPayload) => Promise<void> | void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function isValidEmail(value = "") {
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(
    String(value || "").trim(),
  );
}

function getFirstValidEmail(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const email = String(value || "").trim();
    if (isValidEmail(email)) return email;
  }

  return "";
}

function getFallback(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function IdentityAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar?: string | null;
  className?: string;
}) {
  const safeName = name.trim() || "User";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={safeName}
        className={cn("h-6 w-6 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white",
        className,
      )}
    >
      {getFallback(safeName)}
    </div>
  );
}

function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#5f6368] transition hover:bg-[#f1f3f4] hover:text-[#202124]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function ToolbarButton({
  children,
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-2 text-[#202124] transition hover:bg-[#f1f3f4]",
        active && "bg-[#e4e5e7]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] || "" : result;
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🔥",
  "✨",
  "👍",
  "👏",
  "🙏",
  "🎉",
  "❤️",
  "😊",
  "😉",
];

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  unorderedList: boolean;
  orderedList: boolean;
};

export default function EmailEditor({
  open,
  onClose,
  toLabel = "",
  toName = "",
  toEmail = "",
  toAvatar = "",
  toProxyMailId = "",
  fromName = "",
  fromEmail = "",
  fromAvatar = "",
  fromProxyMailId = "",
  subject = "",
  initialBody = "",
  initialHtmlBody = "",
  startExpanded = false,
  sending = false,
  onSend,
}: EmailEditorProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);

  const [to, setTo] = React.useState(toLabel);
  const [mailSubject, setMailSubject] = React.useState(subject);
  const [attachments, setAttachments] = React.useState<EmailEditorAttachment[]>(
    [],
  );
  const [, setEditorHtml] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [selectedFont, setSelectedFont] = React.useState("Inter");
  const [formatState, setFormatState] = React.useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
  });

  const fromDisplayName = fromName.trim() || "You";
  const fromProxy = (fromProxyMailId || "").trim();
  const fromReal = (fromEmail || "").trim();
  const fromPrimaryMail = fromProxy || fromReal;

  const toDisplayName = toName.trim();
  const toProxy = (toProxyMailId || "").trim();
  const toReal = (toEmail || "").trim();
  const toPrimaryMail = toProxy || to || toReal;

  const resolvedRecipientEmail = getFirstValidEmail(toReal, to, toProxy);

  const syncEditorState = React.useCallback(() => {
    if (!editorRef.current) return;
    setEditorHtml(editorRef.current.innerHTML);
  }, []);

  const updateFormatState = React.useCallback(() => {
    try {
      setFormatState({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      // queryCommandState can throw if the editor is not focused.
    }
  }, []);

  const focusEditor = React.useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const exec = React.useCallback(
    (command: string, value?: string) => {
      focusEditor();
      document.execCommand(command, false, value);
      syncEditorState();
      updateFormatState();
    },
    [focusEditor, syncEditorState, updateFormatState],
  );

  React.useEffect(() => {
    if (!open) return;

    // IMPORTANT:
    // Prefer real influencer email first. Proxy should only be fallback.
    const initialTo = toLabel || toEmail || toProxyMailId || "";

    setTo(initialTo);
    setMailSubject(subject || "");
    setAttachments([]);
    setShowEmojiPicker(false);
    setMinimized(false);
    setExpanded(Boolean(startExpanded));
    setSelectedFont("Inter");

    const html =
      initialHtmlBody && initialHtmlBody.trim()
        ? initialHtmlBody
        : initialBody
          ? plainTextToHtml(initialBody)
          : "";

    setEditorHtml(html);

    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
    });
  }, [
    open,
    toLabel,
    toEmail,
    toProxyMailId,
    subject,
    initialBody,
    initialHtmlBody,
    startExpanded,
  ]);

  React.useEffect(() => {
    const handleSelectionChange = () => {
      if (!open) return;
      updateFormatState();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [open, updateFormatState]);

  const handlePickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const parsed = await Promise.all(
      Array.from(files).map(async (file) => ({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        contentBase64: await fileToBase64(file),
      })),
    );

    setAttachments((prev) => [...prev, ...parsed]);
  };

  const handleInsertInlineImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    focusEditor();

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const base64 = await fileToBase64(file);
      const src = `data:${file.type || "image/png"};base64,${base64}`;
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${src}" alt="${escapeHtml(
          file.name,
        )}" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" />`,
      );
    }

    syncEditorState();
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    exec("insertText", emoji);
    setShowEmojiPicker(false);
  };

  const insertLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;
    exec("createLink", url);
  };

  const insertSignature = () => {
    const signatureHtml = `<br /><br />—<br /><strong>${escapeHtml(
      fromDisplayName,
    )}</strong>${fromPrimaryMail ? `<br />${escapeHtml(fromPrimaryMail)}` : ""}`;

    exec("insertHTML", signatureHtml);
  };

  const applyFont = (font: string) => {
    setSelectedFont(font);
    exec("fontName", font);
  };

  const getPlainBody = () => {
    return (editorRef.current?.innerText || "").trim();
  };

  const getHtmlBody = () => {
    return (editorRef.current?.innerHTML || "").trim();
  };

  const buildPayload = (): EmailEditorPayload => {
    // IMPORTANT:
    // Do not read recipient email from the visible To field.
    // In invitation flow, visible To is the creator handle.
    // Backend resolves real email privately from channelId.
    const recipientEmail = getFirstValidEmail(toReal, toProxy);

    return {
      to: (to || toReal || toProxy).trim(),

      recipientEmail,
      influencerEmail: recipientEmail,
      creatorEmail: recipientEmail,
      businessEmail: recipientEmail,
      contactEmail: recipientEmail,

      subject: mailSubject.trim(),
      body: getPlainBody(),
      htmlBody: getHtmlBody(),
      attachments,

      fromEmail: fromReal || fromProxy,
      fromName: fromDisplayName,
      fromProxyMailId: fromProxy,

      toName: toDisplayName,
      toEmail: toReal,
      toProxyMailId: toProxy,
    };
  };

  const handleSend = async () => {
    await onSend(buildPayload());
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[200] flex items-end justify-end",
        expanded
          ? "inset-2 sm:inset-10"
          : "bottom-0 right-0 p-0 sm:bottom-0 sm:right-16 lg:right-24",
      )}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handlePickFiles(e.target.files)}
      />

      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleInsertInlineImages(e.target.files)}
      />

      <div
        className={cn(
          "pointer-events-auto flex flex-col overflow-hidden bg-white shadow-[0_8px_30px_rgba(60,64,67,0.15)] border transition-all duration-200 ease-in-out",
          minimized
            ? "h-[44px] w-full rounded-t-xl border border-[#dadce0] sm:w-[320px]"
            : expanded
              ? "h-full w-full rounded-xl border border-[#dadce0]"
              : "h-[calc(100vh-80px)] max-h-[640px] w-full rounded-t-xl border border-[#dadce0] sm:w-[660px]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#e0e0e0] bg-[#f2f2f2] px-4 py-1">
          <div className="text-[14px] font-medium text-[#202124]">
            New Message
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              aria-label={minimized ? "Expand" : "Minimize"}
              onClick={() => {
                setMinimized((prev) => !prev);
                if (expanded) setExpanded(false);
              }}
            >
              {minimized ? <CaretUp size={16} /> : <Minus size={16} />}
            </IconButton>
            <IconButton
              aria-label={expanded ? "Restore down" : "Pop out"}
              onClick={() => {
                setExpanded((prev) => !prev);
                setMinimized(false);
              }}
            >
              <ArrowsOutSimple size={16} />
            </IconButton>
            <IconButton aria-label="Close" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>
        </div>

        {!minimized && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-[#ececec] px-4 py-3 text-[13px] text-[#5f6368]">
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0">From</span>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <IdentityAvatar
                    name={fromDisplayName || fromPrimaryMail}
                    avatar={fromAvatar}
                  />

                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#202124]">
                      {fromDisplayName}
                    </div>

                    {fromProxy ? (
                      <div className="truncate text-[12px] text-[#5f6368]">
                        {fromProxy}
                      </div>
                    ) : fromReal ? (
                      <div className="truncate text-[12px] text-[#5f6368]">
                        {fromReal}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-b border-[#ececec] px-4 py-2.5">
              <div className="flex items-center gap-3 text-[13px] text-[#5f6368]">
                <div className="w-10 shrink-0">To</div>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <IdentityAvatar
                    name={toDisplayName || toPrimaryMail || "Recipient"}
                    avatar={toAvatar}
                  />

                  <div className="min-w-0 flex-1">
                    {toDisplayName ? (
                      <div className="truncate text-[13px] font-medium text-[#202124]">
                        {toDisplayName}
                      </div>
                    ) : null}

                    <input
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="Recipient handle"
                      className={cn(
                        "w-full min-w-0 border-0 bg-transparent p-0 outline-none",
                        toDisplayName
                          ? "text-[12px] text-[#5f6368]"
                          : "text-[13px] font-medium text-[#202124]",
                      )}
                    />

                    {toProxy && toProxy !== to ? (
                      <div className="truncate text-[12px] text-[#5f6368]">
                        Proxy: {toProxy}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-b border-[#ececec] px-4 py-3">
              <input
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
                placeholder="Subject"
                className="w-full border-0 bg-transparent p-0 text-[13px] font-medium text-[#202124] outline-none placeholder:font-normal placeholder:text-[#757575]"
              />
            </div>

            <div className="relative shrink-0 border-b border-[#ececec]">
              <div className="hide-scrollbar flex w-full items-center gap-0.5 overflow-x-auto px-3 py-2">
                <div className="relative flex shrink-0 items-center">
                  <select
                    value={selectedFont}
                    onChange={(e) => applyFont(e.target.value)}
                    className="mr-2 h-8 shrink-0 appearance-none rounded-md border-0 bg-transparent px-2 pr-6 text-[13px] font-medium text-[#202124] outline-none hover:bg-[#f1f3f4]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23202124' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 6px center",
                    }}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier</option>
                  </select>
                </div>

                <div className="mx-1 h-4 w-[1px] shrink-0 bg-[#e0e0e0]" />

                <ToolbarButton onClick={() => exec("foreColor", "#202124")}>
                  <div className="h-3.5 w-3.5 rounded-full bg-[#202124]" />
                </ToolbarButton>

                <div className="mx-1 h-4 w-[1px] shrink-0 bg-[#e0e0e0]" />

                <ToolbarButton
                  active={formatState.bold}
                  onClick={() => exec("bold")}
                >
                  <TextB size={16} weight="bold" />
                </ToolbarButton>
                <ToolbarButton
                  active={formatState.italic}
                  onClick={() => exec("italic")}
                >
                  <TextItalic size={16} />
                </ToolbarButton>
                <ToolbarButton
                  active={formatState.underline}
                  onClick={() => exec("underline")}
                >
                  <TextUnderline size={16} />
                </ToolbarButton>

                <div className="mx-1 h-4 w-[1px] shrink-0 bg-[#e0e0e0]" />

                <ToolbarButton onClick={() => exec("undo")}>
                  <ArrowCounterClockwise size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec("redo")}>
                  <ArrowClockwise size={16} />
                </ToolbarButton>

                <div className="mx-1 h-4 w-[1px] shrink-0 bg-[#e0e0e0]" />

                <ToolbarButton
                  active={formatState.unorderedList}
                  onClick={() => exec("insertUnorderedList")}
                >
                  <ListBullets size={16} />
                </ToolbarButton>
                <ToolbarButton
                  active={formatState.orderedList}
                  onClick={() => exec("insertOrderedList")}
                >
                  <ListNumbers size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec("justifyLeft")}>
                  <TextAlignLeft size={16} />
                </ToolbarButton>
              </div>

              {showEmojiPicker && (
                <div className="absolute bottom-[calc(100%+8px)] left-3 z-20 flex w-[220px] flex-wrap gap-2 rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-xl">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-[#f3f4f6]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto bg-white p-4">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                  syncEditorState();
                  updateFormatState();
                }}
                className={cn(
                  "min-h-[120px] w-full flex-1 border-0 bg-transparent text-[13px] leading-[1.6] text-[#202124] outline-none",
                  "empty:before:pointer-events-none empty:before:text-[#9aa0a6] empty:before:content-[attr(data-placeholder)]",
                )}
                data-placeholder="Write your message..."
                style={{ fontFamily: selectedFont }}
              />

              {attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {attachments.map((item, index) => (
                    <div
                      key={`${item.filename}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5 text-[12px] font-medium text-[#202124]"
                    >
                      <Paperclip size={14} className="text-[#5f6368]" />
                      <span className="max-w-[150px] truncate sm:max-w-[200px]">
                        {item.filename}
                      </span>
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-[#5f6368] hover:bg-[#eceff1] hover:text-[#202124]"
                        onClick={() => removeAttachment(index)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#ececec] px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-0.5 text-[#5f6368]">
                  <IconButton
                    aria-label="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={18} />
                  </IconButton>

                  <IconButton aria-label="Insert link" onClick={insertLink}>
                    <Link size={18} />
                  </IconButton>

                  <IconButton
                    aria-label="Emoji"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                  >
                    <Smiley size={18} />
                  </IconButton>

                  <IconButton aria-label="Signature" onClick={insertSignature}>
                    <Signature size={18} />
                  </IconButton>

                  <IconButton
                    aria-label="Insert inline image"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageSquare size={18} />
                  </IconButton>
                </div>

                <button
                  type="button"
                  disabled={sending || !mailSubject.trim() || !getPlainBody()}
                  onClick={handleSend}
                  className="inline-flex items-center gap-2 rounded-full bg-[#202124] px-5 py-2 text-[13px] font-medium text-white transition hover:bg-black disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send"}
                  <PaperPlaneTilt size={14} weight="fill" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}