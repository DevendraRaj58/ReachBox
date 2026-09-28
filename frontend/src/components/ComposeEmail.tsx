import {
    AlignCenter,
    AlignLeft,
    Bold,
    Clock3,
    Italic,
    Link2,
    List,
    ListOrdered,
    Paperclip,
    Quote,
    RotateCcw,
    RotateCw,
    Strikethrough,
    Underline,
    Upload,
} from 'lucide-react';
import {
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
} from 'react';
import { scheduleEmails } from '../lib/api';

const SENDERS = [
    {
        id: 'sender-1',
        name: 'Sender One',
        address: 'sender1@example.test',
    },
    {
        id: 'sender-2',
        name: 'Sender Two',
        address: 'sender2@example.test',
    },
];

interface ComposeEmailProps {
    userId: string;
    onScheduled: () => void;
}

function getTomorrow(hour: number, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minute, 0, 0);

    const local = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return local.toISOString().slice(0, 16);
}

export function ComposeEmail({
    userId,
    onScheduled,
}: ComposeEmailProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    const [senderId, setSenderId] = useState('sender-1');
    const selectedSender =
        SENDERS.find((sender) => sender.id === senderId) ?? SENDERS[0];
    const [recipientInput, setRecipientInput] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [delay, setDelay] = useState('2');
    const [hourlyLimit, setHourlyLimit] = useState('200');
    const [startTime, setStartTime] = useState('');
    const [showSchedulePanel, setShowSchedulePanel] = useState(false);
    const [fileName, setFileName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const previewRecipients = useMemo(
        () => recipients.slice(0, 3),
        [recipients],
    );

    function syncBody() {
        setBody(editorRef.current?.innerHTML ?? '');
    }

    function addRecipient(value: string) {
        const normalized = value.trim();

        if (!normalized) return;

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalized)) {
            setMessage('Please enter a valid recipient email.');
            return;
        }

        if (!recipients.includes(normalized)) {
            setRecipients((current) => [...current, normalized]);
        }

        setRecipientInput('');
        setMessage('');
    }

    function handleRecipientKeyDown(
        event: KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addRecipient(recipientInput);
        }
    }

    async function handleFileUpload(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        setFileName(file.name);

        const text = await file.text();

        const matches =
            text.match(
                /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
            ) ?? [];

        const unique = [...new Set(matches)];

        setRecipients((current) => [
            ...current,
            ...unique.filter((email) => !current.includes(email)),
        ]);
    }

    function removeRecipient(email: string) {
        setRecipients((current) =>
            current.filter((item) => item !== email),
        );
    }

    function exec(command: string, value?: string) {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        syncBody();
    }

    async function submitSchedule(
        selectedStartTime: string,
    ) {
        if (!subject.trim()) {
            setMessage('Subject is required.');
            return;
        }

        if (!recipients.length) {
            setMessage('Add at least one recipient.');
            return;
        }

        if (!body.trim()) {
            setMessage('Email body is required.');
            return;
        }

        try {
            setSubmitting(true);
            setMessage('');

            await scheduleEmails({
                userId,
                senderId: selectedSender.id,
                senderAddress: selectedSender.address,
                subject: subject.trim(),
                body,
                startTime: new Date(selectedStartTime).toISOString(),
                delayMs: Math.max(0, Number(delay)) * 1000,
                hourlyLimit: Math.max(1, Number(hourlyLimit)),
                recipients,
            });

            setMessage(
                `Scheduled ${recipients.length} email${recipients.length > 1 ? 's' : ''
                } successfully.`,
            );

            setRecipients([]);
            setRecipientInput('');
            setSubject('');
            setBody('');
            setFileName('');
            setStartTime('');

            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }

            setShowSchedulePanel(false);
            onScheduled();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Failed to schedule emails.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSendNow(
        event?: FormEvent,
    ) {
        event?.preventDefault();

        await submitSchedule(new Date().toISOString());
    }

    return (
        <div className="relative min-h-full bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="text-xl">←</span>
                    <h1 className="text-[20px] font-semibold text-slate-900">
                        Compose New Email
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        className="text-slate-400 hover:text-slate-700"
                        title="Attachment"
                    >
                        <Paperclip size={20} />
                    </button>

                    <button
                        onClick={() => setShowSchedulePanel(true)}
                        className="text-slate-500 hover:text-slate-800"
                        title="Schedule"
                    >
                        <Clock3 size={20} />
                    </button>

                    <button
                        onClick={() => setShowSchedulePanel(true)}
                        disabled={submitting}
                        className="rounded-full border-2 border-[#00a62d] px-5 py-2 text-sm font-semibold text-[#00a62d] hover:bg-green-50 disabled:opacity-60"
                    >
                        Send Later
                    </button>
                </div>
            </div>

            <form
                onSubmit={handleSendNow}
                className="relative mx-auto max-w-[1110px] px-6 py-9"
            >
                <div className="space-y-0">
                    <div className="flex min-h-[48px] items-center border-b border-slate-100">
                        <span className="w-[68px] text-sm font-semibold text-slate-800">
                            From
                        </span>

                        <select
                            value={senderId}
                            onChange={(event) => setSenderId(event.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                        >
                            {SENDERS.map((sender) => (
                                <option key={sender.id} value={sender.id}>
                                    {sender.address}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex min-h-[63px] items-center border-b border-slate-100">
                        <span className="w-[68px] shrink-0 text-sm font-semibold text-slate-800">
                            To
                        </span>

                        <div className="flex flex-1 flex-wrap items-center gap-2">
                            {previewRecipients.map((email) => (
                                <span
                                    key={email}
                                    className="rounded-full border-2 border-[#6ac58a] px-3 py-1 text-xs font-medium text-slate-800"
                                >
                                    {email}
                                    <button
                                        type="button"
                                        className="ml-2 text-slate-400"
                                        onClick={() => removeRecipient(email)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}

                            {recipients.length > 3 && (
                                <span className="rounded-full border-2 border-[#6ac58a] px-3 py-1 text-xs font-medium text-slate-800">
                                    +{recipients.length - 3}
                                </span>
                            )}

                            <input
                                value={recipientInput}
                                onChange={(event) =>
                                    setRecipientInput(event.target.value)
                                }
                                onKeyDown={handleRecipientKeyDown}
                                onBlur={() => {
                                    if (recipientInput) {
                                        addRecipient(recipientInput);
                                    }
                                }}
                                placeholder={
                                    recipients.length
                                        ? 'Add recipient'
                                        : 'recipient@example.com'
                                }
                                className="min-w-[220px] flex-1 bg-transparent text-sm outline-none"
                            />

                            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-medium text-[#00a62d]">
                                <Upload size={17} />
                                Upload List
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex min-h-[58px] items-center border-b border-slate-100">
                        <span className="w-[68px] text-sm font-semibold text-slate-800">
                            Subject
                        </span>

                        <input
                            value={subject}
                            onChange={(event) =>
                                setSubject(event.target.value)
                            }
                            placeholder="Subject"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex items-center gap-12 border-b border-slate-100 py-5">
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                            Delay between 2 emails
                            <input
                                type="number"
                                min="0"
                                value={delay}
                                onChange={(event) =>
                                    setDelay(event.target.value)
                                }
                                className="h-9 w-16 rounded-md border border-slate-100 px-3 text-center text-sm font-normal outline-none"
                            />
                        </label>

                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                            Hourly Limit
                            <input
                                type="number"
                                min="1"
                                value={hourlyLimit}
                                onChange={(event) =>
                                    setHourlyLimit(event.target.value)
                                }
                                className="h-9 w-16 rounded-md border border-slate-100 px-3 text-center text-sm font-normal outline-none"
                            />
                        </label>
                    </div>

                    {fileName && (
                        <p className="py-3 text-xs text-slate-400">
                            Uploaded: {fileName} · {recipients.length}{' '}
                            recipients
                        </p>
                    )}

                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={syncBody}
                        data-placeholder="Type Your Reply..."
                        className="min-h-[390px] py-7 text-[15px] leading-7 text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
                    />

                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 py-4 text-slate-700">
                        <button type="button" onClick={() => exec('undo')}>
                            <RotateCcw size={18} />
                        </button>

                        <button type="button" onClick={() => exec('redo')}>
                            <RotateCw size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('bold')}
                        >
                            <Bold size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('italic')}
                        >
                            <Italic size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('underline')}
                        >
                            <Underline size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('strikeThrough')}
                        >
                            <Strikethrough size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('justifyLeft')}
                        >
                            <AlignLeft size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('justifyCenter')}
                        >
                            <AlignCenter size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('insertUnorderedList')}
                        >
                            <List size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('insertOrderedList')}
                        >
                            <ListOrdered size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => exec('formatBlock', 'blockquote')}
                        >
                            <Quote size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const url = window.prompt('Enter URL');
                                if (url) exec('createLink', url);
                            }}
                        >
                            <Link2 size={18} />
                        </button>
                    </div>

                    {message && (
                        <p className="py-3 text-sm text-slate-500">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-[#00a62d] px-7 py-3 text-sm font-semibold text-white hover:bg-[#008f26] disabled:opacity-60"
                    >
                        {submitting ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>

            {showSchedulePanel && (
                <div className="absolute right-5 top-5 z-20 w-[340px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Send Later
                        </h3>

                        <button
                            onClick={() => setShowSchedulePanel(false)}
                            className="text-xl text-slate-400"
                        >
                            ×
                        </button>
                    </div>

                    <label className="mb-2 block text-sm text-slate-500">
                        Pick date & time
                    </label>

                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(event) =>
                            setStartTime(event.target.value)
                        }
                        className="mb-5 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-green-500"
                    />

                    <div className="space-y-1">
                        <button
                            onClick={() => setStartTime(getTomorrow(9))}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                            Tomorrow
                        </button>

                        <button
                            onClick={() => setStartTime(getTomorrow(10))}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                            Tomorrow, 10:00 AM
                        </button>

                        <button
                            onClick={() => setStartTime(getTomorrow(11))}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                            Tomorrow, 11:00 AM
                        </button>

                        <button
                            onClick={() => setStartTime(getTomorrow(15))}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                            Tomorrow, 3:00 PM
                        </button>
                    </div>

                    <div className="mt-7 flex items-center justify-end gap-3">
                        <button
                            onClick={() => setShowSchedulePanel(false)}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Cancel
                        </button>

                        <button
                            disabled={!startTime || submitting}
                            onClick={() => submitSchedule(startTime)}
                            className="rounded-full border-2 border-[#00a62d] px-5 py-2 text-sm font-semibold text-[#00a62d] disabled:opacity-40"
                        >
                            {submitting ? 'Scheduling...' : 'Done'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}