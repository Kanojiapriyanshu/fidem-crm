'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Building2,
    Check,
    Edit3,
    FolderKanban,
    Link2,
    Loader2,
    Mail,
    Plus,
    RefreshCw,
    Save,
    Send,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import swal from 'sweetalert';

import { get, post } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type TabKey = 'outreach' | 'roster' | 'pitch';

type InvitationStatus = '' | 'sent' | 'accepted' | 'reject' | 'failed';

type PipelineRow = {
    _id: string;
    campaignId?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;

    name?: string;
    followers?: number | null;
    links?: string[];
    primaryLink?: string;
    niche?: string[];
    email?: string;
    country?: string;
    platform?: string;
    username?: string;
    handle?: string;

    outreachDate?: string | null;
    outreached?: boolean | null;
    followUp1SentAt?: string | null;
    followUp2SentAt?: string | null;
    replyChecked?: boolean;
    repliedAt?: string | null;

    emailState?: {
        threadId?: string | null;
        outreachSentAt?: string | null;
        followUp1SentAt?: string | null;
        followUp2SentAt?: string | null;
        replyChecked?: boolean;
        repliedAt?: string | null;
    };

    demographics?: string;
    engagementRate?: number | null;
    deliverables?: string;
    rates?: number | null;
    mediaKit?: string;
    address?: string;

    additionalInfo?: string;
    selectionReason?: string;
    goodFit?: boolean | null;
    rateUsd?: number | null;
    ourFeePct?: number | null;
    comments?: string;

    linkedInfluencerId?: string | null;
    campaignInvitationId?: string | null;
    campaignInvitationStatus?: InvitationStatus;
    campaignInvitationSentAt?: string | null;
    hasInvited?: boolean;
    hasInvitedAt?: string | null;
};

type PipelineListResponse = {
    page?: number;
    limit?: number;
    total?: number;
    results?: PipelineRow[];
};

type CampaignItem = {
    _id: string;
    brandId?: string;
    brandName?: string;
    campaignTitle?: string;
    campaignType?: string;
    campaignCategory?: string;
    campaignSubcategory?: string;
    numberOfInfluencers?: number;
    targetCountry?: string;
    campaignBudget?: number;
    budget?: number;
    influencerBudget?: number;
    paymentType?: string;
    platformSelection?: string[];
    scheduledAt?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: string;
    publishStatus?: string;
    createdAt?: string;
    updatedAt?: string;
};

type CampaignListResponse = {
    success: boolean;
    count: number;
    data: CampaignItem[];
};

type DraftState = Record<string, any>;

const DASH = '--';

function showErr(message: string) {
    return swal({
        title: 'Error',
        text: message || 'Something went wrong.',
        icon: 'error',
    });
}

function showSuccess(message: string) {
    return swal({
        title: 'Success',
        text: message,
        icon: 'success',
    });
}

function asText(v: unknown) {
    if (v === undefined || v === null) return '';
    return String(v).trim();
}

function joinList(v?: string[] | null) {
    return Array.isArray(v) && v.length ? v.join(', ') : DASH;
}

function parseCsv(v: string) {
    return (v || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}

function toNullableNumber(v: any) {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function formatNumber(n?: number | null) {
    if (n == null || !Number.isFinite(n)) return DASH;
    return new Intl.NumberFormat('en-IN').format(n);
}

function formatPercent(x?: number | null) {
    if (x == null || !Number.isFinite(x)) return DASH;
    return `${(x * 100).toFixed(2)}%`;
}

function formatDate(iso?: string | null) {
    if (!iso) return DASH;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return DASH;

    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    }).format(d);
}

function getDefaultCreateDraft() {
    return {
        name: '',
        followers: '',
        links: '',
        niche: '',
        email: '',
        country: '',
        demographics: '',
        engagementRate: '',
        deliverables: '',
        rates: '',
        mediaKit: '',
        address: '',
        additionalInfo: '',
        selectionReason: '',
        goodFit: false,
        rateUsd: '',
        ourFeePct: '',
        comments: '',
    };
}

function getInvitationTone(status?: InvitationStatus, hasInvited?: boolean) {
    if (status === 'accepted') return 'default';
    if (status === 'failed') return 'destructive';
    if (status === 'reject') return 'secondary';
    if (status === 'sent' || hasInvited) return 'outline';
    return 'secondary';
}

function getInvitationLabel(row: PipelineRow) {
    if (row.campaignInvitationStatus === 'accepted') return 'Accepted';
    if (row.campaignInvitationStatus === 'failed') return 'Failed';
    if (row.campaignInvitationStatus === 'reject') return 'Rejected';
    if (row.campaignInvitationStatus === 'sent' || row.hasInvited) return 'Invited';
    return 'Not invited';
}

function isInvitationLocked(row: PipelineRow) {
    return row.campaignInvitationStatus === 'accepted' || row.hasInvited === true;
}

function getBestRosterLink(row: PipelineRow) {
    const direct = [row.mediaKit, row.primaryLink, ...(row.links || [])]
        .map((item) => asText(item))
        .find((item) => /^https?:\/\//i.test(item));

    if (direct) return direct;

    const fallback = [row.mediaKit, row.primaryLink, ...(row.links || [])]
        .map((item) => asText(item))
        .find(Boolean);

    return fallback || '';
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
                </div>
                <div className="rounded-2xl border bg-muted/50 p-3 text-muted-foreground">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

function SectionCard({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
                </div>
                {action}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </Label>
            {children}
        </div>
    );
}

export default function CampaignPipelinePage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const campaignId = asText(searchParams.get('id'));
    const initialName = asText(searchParams.get('name'));

    const [campaign, setCampaign] = useState<CampaignItem | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('outreach');
    const [rows, setRows] = useState<PipelineRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [metaLoading, setMetaLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [sendingInviteId, setSendingInviteId] = useState<string>('');

    const [editingId, setEditingId] = useState<string>('');
    const [draft, setDraft] = useState<DraftState>({});

    const [showCreateRow, setShowCreateRow] = useState(false);
    const [createDraft, setCreateDraft] = useState<DraftState>(getDefaultCreateDraft());

    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

    const [counts, setCounts] = useState({
        outreach: 0,
        roster: 0,
        pitch: 0,
    });

    const selectedCount = useMemo(
        () => Object.values(selectedIds).filter(Boolean).length,
        [selectedIds]
    );

    const allSelected = useMemo(() => {
        if (!rows.length) return false;
        return rows.every((row) => !!selectedIds[row._id]);
    }, [rows, selectedIds]);

    const someSelected = useMemo(() => {
        if (!rows.length) return false;
        return rows.some((row) => !!selectedIds[row._id]);
    }, [rows, selectedIds]);

    const selectedOutreachRows = useMemo(() => {
        return rows.filter((row) => !!selectedIds[row._id] && !!row.email);
    }, [rows, selectedIds]);

    async function loadCampaignMeta() {
        if (!campaignId) return;

        setMetaLoading(true);
        try {
            const resp = await get<CampaignListResponse>('/admins/campaign/list');
            const items = Array.isArray(resp?.data) ? resp.data : [];
            const found = items.find((item) => String(item._id) === campaignId) || null;
            setCampaign(found);
        } catch (e: any) {
            console.error('Failed to load campaign meta:', e?.message || e);
        } finally {
            setMetaLoading(false);
        }
    }

    async function loadCounts() {
        if (!campaignId) return;

        try {
            const [outreachResp, rosterResp, pitchResp] = await Promise.all([
                get<PipelineListResponse>('/pipeline/list', {
                    campaignId,
                    status: 'outreach',
                    page: 1,
                    limit: 1,
                }),
                get<PipelineListResponse>('/pipeline/list', {
                    campaignId,
                    status: 'roster',
                    page: 1,
                    limit: 1,
                }),
                get<PipelineListResponse>('/pipeline/list', {
                    campaignId,
                    status: 'pitch',
                    page: 1,
                    limit: 1,
                }),
            ]);

            setCounts({
                outreach: Number(outreachResp?.total || 0),
                roster: Number(rosterResp?.total || 0),
                pitch: Number(pitchResp?.total || 0),
            });
        } catch (e) {
            console.error('Failed to load counts', e);
        }
    }

    async function loadRows(tab: TabKey = activeTab) {
        if (!campaignId) return;

        setLoading(true);
        try {
            const resp = await get<PipelineListResponse>('/pipeline/list', {
                campaignId,
                status: tab,
                page: 1,
                limit: 100,
            });

            setRows(Array.isArray(resp?.results) ? resp.results : []);
        } catch (e: any) {
            await showErr(e?.message || 'Failed to load pipeline.');
        } finally {
            setLoading(false);
        }
    }

    async function refreshAll(tab: TabKey = activeTab) {
        await Promise.all([loadRows(tab), loadCounts(), loadCampaignMeta()]);
    }

    useEffect(() => {
        if (!campaignId) return;
        setSelectedIds({});
        setShowCreateRow(false);
        setEditingId('');
        setDraft({});
        setCreateDraft(getDefaultCreateDraft());
        refreshAll(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId, activeTab]);

    function startEdit(row: PipelineRow) {
        setShowCreateRow(false);
        setEditingId(row._id);
        setDraft({
            id: row._id,
            name: row.name || '',
            followers: row.followers ?? '',
            links: Array.isArray(row.links) ? row.links.join(', ') : row.primaryLink || '',
            niche: Array.isArray(row.niche) ? row.niche.join(', ') : '',
            email: row.email || '',
            country: row.country || '',
            demographics: row.demographics || '',
            engagementRate: row.engagementRate ?? '',
            deliverables: row.deliverables || '',
            rates: row.rates ?? '',
            mediaKit: row.mediaKit || '',
            address: row.address || '',
            additionalInfo: row.additionalInfo || '',
            selectionReason: row.selectionReason || '',
            goodFit: !!row.goodFit,
            rateUsd: row.rateUsd ?? '',
            ourFeePct: row.ourFeePct ?? '',
            comments: row.comments || '',
        });
    }

    function cancelEdit() {
        setEditingId('');
        setDraft({});
    }

    function openCreateRow() {
        setEditingId('');
        setDraft({});
        setShowCreateRow(true);
        setCreateDraft(getDefaultCreateDraft());
    }

    function cancelCreateRow() {
        setShowCreateRow(false);
        setCreateDraft(getDefaultCreateDraft());
    }

    function setField(key: string, value: any) {
        setDraft((p) => ({ ...p, [key]: value }));
    }

    function setCreateField(key: string, value: any) {
        setCreateDraft((p) => ({ ...p, [key]: value }));
    }

    function toggleRowSelection(id: string, checked: boolean) {
        setSelectedIds((prev) => ({ ...prev, [id]: checked }));
    }

    function toggleSelectAll(checked: boolean) {
        const next: Record<string, boolean> = {};
        rows.forEach((row) => {
            next[row._id] = checked;
        });
        setSelectedIds(next);
    }

    function goToBulkEmailSend() {
        if (!selectedOutreachRows.length) {
            showErr('Please select at least one outreach row with an email.');
            return;
        }

        const ids = selectedOutreachRows.map((row) => row._id).join(',');
        router.push(`/admin/inbound-emails?campaignId=${campaignId}&pipelineIds=${ids}`);
    }

    async function saveRow() {
        try {
            const id = asText(draft.id);
            if (!id) return;

            if (activeTab === 'outreach') {
                await post('/pipeline/outreach/update', {
                    id,
                    email: asText(draft.email),
                });
            }

            if (activeTab === 'roster') {
                await post('/pipeline/roster/update', {
                    id,
                    demographics: asText(draft.demographics),
                    engagementRate: draft.engagementRate === '' ? null : Number(draft.engagementRate),
                    deliverables: asText(draft.deliverables),
                    rates: draft.rates === '' ? null : Number(draft.rates),
                    mediaKit: asText(draft.mediaKit),
                    address: asText(draft.address),
                    email: asText(draft.email),
                });
            }

            if (activeTab === 'pitch') {
                await post('/pipeline/pitch/update', {
                    id,
                    country: asText(draft.country),
                    additionalInfo: asText(draft.additionalInfo),
                    selectionReason: asText(draft.selectionReason),
                    goodFit: !!draft.goodFit,
                    rateUsd: draft.rateUsd === '' ? null : Number(draft.rateUsd),
                    ourFeePct: draft.ourFeePct === '' ? null : Number(draft.ourFeePct),
                    comments: asText(draft.comments),
                });
            }

            setEditingId('');
            setDraft({});
            await refreshAll(activeTab);
            await showSuccess('Row updated successfully.');
        } catch (e: any) {
            await showErr(e?.message || 'Failed to save row.');
        }
    }

    async function createRow() {
        try {
            if (!campaignId) return;
            setCreating(true);

            await post('/pipeline/create', {
                campaignId,
                status: activeTab,

                name: asText(createDraft.name),
                followers: toNullableNumber(createDraft.followers),
                links: parseCsv(asText(createDraft.links)),
                niche: parseCsv(asText(createDraft.niche)),
                email: asText(createDraft.email),
                country: asText(createDraft.country),

                demographics: asText(createDraft.demographics),
                engagementRate: toNullableNumber(createDraft.engagementRate),
                deliverables: asText(createDraft.deliverables),
                rates: toNullableNumber(createDraft.rates),
                mediaKit: asText(createDraft.mediaKit),
                address: asText(createDraft.address),

                additionalInfo: asText(createDraft.additionalInfo),
                selectionReason: asText(createDraft.selectionReason),
                goodFit: !!createDraft.goodFit,
                rateUsd: toNullableNumber(createDraft.rateUsd),
                ourFeePct: toNullableNumber(createDraft.ourFeePct),
                comments: asText(createDraft.comments),
            });

            setShowCreateRow(false);
            setCreateDraft(getDefaultCreateDraft());
            await refreshAll(activeTab);
            await showSuccess('Pipeline row created successfully.');
        } catch (e: any) {
            await showErr(e?.message || 'Failed to create row.');
        } finally {
            setCreating(false);
        }
    }

    async function moveToRoster(id: string) {
        try {
            await post('/pipeline/move-to-roster', { id });
            await refreshAll('outreach');
            await showSuccess('Moved to roster successfully.');
        } catch (e: any) {
            await showErr(e?.message || 'Failed to move to roster.');
        }
    }

    async function moveToPitch(id: string) {
        try {
            await post('/pipeline/move-to-pitch', { id });
            await refreshAll('roster');
            await showSuccess('Moved to pitch successfully.');
        } catch (e: any) {
            await showErr(e?.message || 'Failed to move to pitch.');
        }
    }

    async function sendCampaignInvitation(pipelineId: string) {
        try {
            setSendingInviteId(pipelineId);
            await post('/pipeline/pitch/send-invitation', {
                campaignId,
                pipelineId,
            });

            await refreshAll('pitch');
            await showSuccess('Campaign invitation sent successfully.');
        } catch (e: any) {
            await showErr(e?.message || 'Failed to send campaign invitation.');
        } finally {
            setSendingInviteId('');
        }
    }

    async function handleGetRosterLink(row: PipelineRow) {
        try {
            const provider = asText(row.platform).toLowerCase();
            const username =
                asText(row.username).replace(/^@/, '') ||
                asText(row.handle).replace(/^@/, '');

            if (!provider) {
                await showErr('Platform is missing for this creator.');
                return;
            }

            if (!username) {
                await showErr('Username/handle is missing for this creator.');
                return;
            }

            const resp = await get<{
                success: boolean;
                data?: {
                    modashId: string;
                    link: string;
                    username?: string;
                    platform?: string;
                };
                error?: string;
            }>('/modash/media-kit-link', {
                platform: provider,
                username,
            });

            const link = resp?.data?.link;

            if (!link) {
                await showErr(resp?.error || 'Could not generate media kit link.');
                return;
            }

            await navigator.clipboard.writeText(link);
            await showSuccess('Media kit link copied.');
        } catch (e: any) {
            await showErr(e?.message || 'Failed to copy media kit link.');
        }
    }

    const campaignTitle = campaign?.campaignTitle || initialName || 'Campaign Pipeline';
    const brandName = campaign?.brandName || DASH;

    if (!campaignId) {
        return (
            <div className="min-h-screen overflow-x-hidden bg-background">
                <div className="mx-auto max-w-4xl px-4 py-12">
                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Invalid Campaign</CardTitle>
                            <CardDescription>
                                Campaign id is missing in the URL. Open this page with <span className="font-mono">?id=campaignId</span>.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card className="overflow-hidden rounded-3xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-teal-900 via-teal-700 to-lime-600 px-6 py-7 text-white sm:px-8">
                            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Campaign workflow
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                                            <FolderKanban className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{campaignTitle}</h1>
                                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
                                                <span className="inline-flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    Brand: <b className="text-white">{brandName}</b>
                                                </span>
                                                <span>Status: <b className="capitalize text-white">{campaign?.status || DASH}</b></span>
                                                <span>Platforms: <b className="text-white">{campaign?.platformSelection?.join(', ') || DASH}</b></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
                                    <StatCard label="Outreach" value={counts.outreach} icon={<Mail className="h-5 w-5" />} />
                                    <StatCard label="Roster" value={counts.roster} icon={<Users className="h-5 w-5" />} />
                                    <StatCard label="Pitch" value={counts.pitch} icon={<Sparkles className="h-5 w-5" />} />
                                    <StatCard label="Selected" value={selectedCount} icon={<Check className="h-5 w-5" />} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
                        <TabsList className="h-auto rounded-2xl p-1">
                            <TabsTrigger value="outreach" className="rounded-xl px-4 py-2.5">Outreach ({counts.outreach})</TabsTrigger>
                            <TabsTrigger value="roster" className="rounded-xl px-4 py-2.5">Roster ({counts.roster})</TabsTrigger>
                            <TabsTrigger value="pitch" className="rounded-xl px-4 py-2.5">Pitch ({counts.pitch})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => refreshAll(activeTab)}>
                            {loading || metaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Refresh
                        </Button>
                        <Button className="rounded-xl" onClick={openCreateRow}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New
                        </Button>
                        {activeTab === 'outreach' ? (
                            <>
                                <Button className="rounded-xl" onClick={goToBulkEmailSend} disabled={!selectedOutreachRows.length}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Bulk Email Send
                                </Button>
                                <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/admin/modash?id=${campaign?._id}`)}>
                                    Add from Modash
                                </Button>
                                <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/admin/youtube?id=${campaign?._id}`)}>
                                    Add from Youtube
                                </Button>
                            </>
                        ) : null}
                        {activeTab === 'pitch' ? (
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={async () => {
                                    const link = `${window.location.origin}/influencer-sheet?campaignId=${campaignId}`;
                                    await navigator.clipboard.writeText(link);
                                    await showSuccess('Pitch sheet link copied.');
                                }}
                            >
                                <Link2 className="mr-2 h-4 w-4" />
                                Copy Pitch Sheet Link
                            </Button>
                        ) : null}
                    </div>
                </div>

                <SectionCard
                    title={`${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)} Pipeline`}
                    description={
                        activeTab === 'pitch'
                            ? 'Manage shortlisted creators and send campaign invitations to signed-up influencers.'
                            : activeTab === 'roster'
                                ? 'Track creators who replied and are ready for pitch qualification.'
                                : 'Monitor outreach, replies, and progression to roster.'
                    }
                    action={
                        loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading rows
                            </div>
                        ) : null
                    }
                >
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    ) : !rows.length && !showCreateRow ? (
                        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                            No rows found in {activeTab}.
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1100px]">
                                <Table className="w-full table-auto">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[56px]">
                                                <Checkbox
                                                    checked={allSelected || (someSelected ? 'indeterminate' : false)}
                                                    onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                                                    aria-label="Select all"
                                                />
                                            </TableHead>

                                            {activeTab === 'outreach' ? (
                                                <>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Followers</TableHead>
                                                    <TableHead>Links</TableHead>
                                                    <TableHead>Niche</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Outreached</TableHead>
                                                    <TableHead>Follow Up 1</TableHead>
                                                    <TableHead>Follow Up 2</TableHead>
                                                    <TableHead>Reply</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </>
                                            ) : null}

                                            {activeTab === 'roster' ? (
                                                <>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Followers</TableHead>
                                                    <TableHead>Links</TableHead>
                                                    <TableHead>Niche</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Demographics</TableHead>
                                                    <TableHead>Engagement Rate</TableHead>
                                                    <TableHead>Deliverables</TableHead>
                                                    <TableHead>Rates</TableHead>
                                                    <TableHead>Media Kit</TableHead>
                                                    <TableHead>Address</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </>
                                            ) : null}

                                            {activeTab === 'pitch' ? (
                                                <>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Followers</TableHead>
                                                    <TableHead>Links</TableHead>
                                                    <TableHead>Niche</TableHead>
                                                    <TableHead>Country</TableHead>
                                                    <TableHead>Additional Info</TableHead>
                                                    <TableHead>Selection Reason</TableHead>
                                                    <TableHead>Good Fit</TableHead>
                                                    <TableHead>Rate USD</TableHead>
                                                    <TableHead>Our Fee (%)</TableHead>
                                                    <TableHead>Invitation</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </>
                                            ) : null}
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {showCreateRow ? (
                                            <TableRow className="bg-muted/40">
                                                <TableCell />

                                                {activeTab === 'outreach' ? (
                                                    <>
                                                        <TableCell><Input value={createDraft.name} onChange={(e) => setCreateField('name', e.target.value)} /></TableCell>
                                                        <TableCell><Input type="number" value={createDraft.followers} onChange={(e) => setCreateField('followers', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.links} onChange={(e) => setCreateField('links', e.target.value)} placeholder="comma separated" /></TableCell>
                                                        <TableCell><Input value={createDraft.niche} onChange={(e) => setCreateField('niche', e.target.value)} placeholder="comma separated" /></TableCell>
                                                        <TableCell><Input value={createDraft.email} onChange={(e) => setCreateField('email', e.target.value)} /></TableCell>
                                                        <TableCell>{DASH}</TableCell>
                                                        <TableCell>{DASH}</TableCell>
                                                        <TableCell>{DASH}</TableCell>
                                                        <TableCell>{DASH}</TableCell>
                                                        <TableCell>{DASH}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" onClick={createRow} disabled={creating}>
                                                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={cancelCreateRow}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : null}

                                                {activeTab === 'roster' ? (
                                                    <>
                                                        <TableCell><Input value={createDraft.name} onChange={(e) => setCreateField('name', e.target.value)} /></TableCell>
                                                        <TableCell><Input type="number" value={createDraft.followers} onChange={(e) => setCreateField('followers', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.links} onChange={(e) => setCreateField('links', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.niche} onChange={(e) => setCreateField('niche', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.email} onChange={(e) => setCreateField('email', e.target.value)} /></TableCell>
                                                        <TableCell><Textarea value={createDraft.demographics} onChange={(e) => setCreateField('demographics', e.target.value)} rows={2} /></TableCell>
                                                        <TableCell><Input type="number" value={createDraft.engagementRate} onChange={(e) => setCreateField('engagementRate', e.target.value)} /></TableCell>
                                                        <TableCell><Textarea value={createDraft.deliverables} onChange={(e) => setCreateField('deliverables', e.target.value)} rows={2} /></TableCell>
                                                        <TableCell><Input type="number" value={createDraft.rates} onChange={(e) => setCreateField('rates', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.mediaKit} onChange={(e) => setCreateField('mediaKit', e.target.value)} /></TableCell>
                                                        <TableCell><Textarea value={createDraft.address} onChange={(e) => setCreateField('address', e.target.value)} rows={2} /></TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" onClick={createRow} disabled={creating}>
                                                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={cancelCreateRow}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : null}

                                                {activeTab === 'pitch' ? (
                                                    <>
                                                        <TableCell><Input value={createDraft.name} onChange={(e) => setCreateField('name', e.target.value)} /></TableCell>
                                                        <TableCell><Input type="number" value={createDraft.followers} onChange={(e) => setCreateField('followers', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.links} onChange={(e) => setCreateField('links', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.niche} onChange={(e) => setCreateField('niche', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={createDraft.country} onChange={(e) => setCreateField('country', e.target.value)} /></TableCell>
                                                        <TableCell><Textarea value={createDraft.additionalInfo} onChange={(e) => setCreateField('additionalInfo', e.target.value)} rows={2} /></TableCell>
                                                        <TableCell><Textarea value={createDraft.selectionReason} onChange={(e) => setCreateField('selectionReason', e.target.value)} rows={2} /></TableCell>
                                                        <TableCell>
                                                            <Checkbox checked={!!createDraft.goodFit} onCheckedChange={(checked) => setCreateField('goodFit', !!checked)} />
                                                        </TableCell>
                                                        <TableCell><Input type="number" value={createDraft.rateUsd} onChange={(e) => setCreateField('rateUsd', e.target.value)} /></TableCell>
                                                        <TableCell><Input type="number" value={createDraft.ourFeePct} onChange={(e) => setCreateField('ourFeePct', e.target.value)} /></TableCell>
                                                        <TableCell><Badge variant="secondary">Not invited</Badge></TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" onClick={createRow} disabled={creating}>
                                                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={cancelCreateRow}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : null}
                                            </TableRow>
                                        ) : null}

                                        {rows.map((row) => {
                                            const isEdit = editingId === row._id;

                                            return (
                                                <TableRow key={row._id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={!!selectedIds[row._id]}
                                                            onCheckedChange={(checked) => toggleRowSelection(row._id, !!checked)}
                                                            aria-label={`Select ${row.name || 'row'}`}
                                                        />
                                                    </TableCell>

                                                    {activeTab === 'outreach' ? (
                                                        <>
                                                            <TableCell className="font-medium">{row.name || DASH}</TableCell>
                                                            <TableCell>{formatNumber(row.followers)}</TableCell>
                                                            <TableCell>
                                                                {row.primaryLink ? (
                                                                    <a href={row.primaryLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">
                                                                        Open
                                                                    </a>
                                                                ) : (
                                                                    joinList(row.links)
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{joinList(row.niche)}</TableCell>
                                                            <TableCell>{isEdit ? <Input value={draft.email ?? ''} onChange={(e) => setField('email', e.target.value)} /> : (row.email || DASH)}</TableCell>
                                                            <TableCell>{formatDate(row.outreachDate || row.createdAt)}</TableCell>
                                                            <TableCell><Badge variant={row.outreached ? 'default' : 'secondary'}>{row.outreached ? 'Yes' : 'No'}</Badge></TableCell>
                                                            <TableCell>{formatDate(row.followUp1SentAt)}</TableCell>
                                                            <TableCell>{formatDate(row.followUp2SentAt)}</TableCell>
                                                            <TableCell><Badge variant={row.replyChecked ? 'default' : 'secondary'}>{row.replyChecked ? 'Yes' : 'No'}</Badge></TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {isEdit ? (
                                                                        <>
                                                                            <Button size="sm" onClick={saveRow}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                                            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button size="sm" variant="outline" onClick={() => startEdit(row)}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
                                                                            <Button size="sm" onClick={() => moveToRoster(row._id)} disabled={!row.replyChecked}><Check className="mr-2 h-4 w-4" />Move to Roster</Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </>
                                                    ) : null}

                                                    {activeTab === 'roster' ? (
                                                        <>
                                                            <TableCell className="font-medium">{row.name || DASH}</TableCell>
                                                            <TableCell>{formatNumber(row.followers)}</TableCell>
                                                            <TableCell>
                                                                {row.primaryLink ? (
                                                                    <a href={row.primaryLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">
                                                                        Open
                                                                    </a>
                                                                ) : (
                                                                    joinList(row.links)
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{joinList(row.niche)}</TableCell>
                                                            <TableCell>{isEdit ? <Input value={draft.email ?? ''} onChange={(e) => setField('email', e.target.value)} /> : (row.email || DASH)}</TableCell>
                                                            <TableCell>{isEdit ? <Textarea value={draft.demographics ?? ''} onChange={(e) => setField('demographics', e.target.value)} rows={2} /> : (row.demographics || DASH)}</TableCell>
                                                            <TableCell>{isEdit ? <Input type="number" value={draft.engagementRate ?? ''} onChange={(e) => setField('engagementRate', e.target.value)} /> : formatPercent(row.engagementRate)}</TableCell>
                                                            <TableCell>{isEdit ? <Textarea value={draft.deliverables ?? ''} onChange={(e) => setField('deliverables', e.target.value)} rows={2} /> : (row.deliverables || DASH)}</TableCell>
                                                            <TableCell>{isEdit ? <Input type="number" value={draft.rates ?? ''} onChange={(e) => setField('rates', e.target.value)} /> : formatNumber(row.rates)}</TableCell>
                                                            <TableCell>{isEdit ? <Input value={draft.mediaKit ?? ''} onChange={(e) => setField('mediaKit', e.target.value)} /> : (row.mediaKit || DASH)}</TableCell>
                                                            <TableCell>{isEdit ? <Textarea value={draft.address ?? ''} onChange={(e) => setField('address', e.target.value)} rows={2} /> : (row.address || DASH)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {isEdit ? (
                                                                        <>
                                                                            <Button size="sm" onClick={saveRow}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                                            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleGetRosterLink(row)}
                                                                                disabled={!row.platform || !(row.username || row.handle)}
                                                                            >
                                                                                <Link2 className="mr-2 h-4 w-4" />
                                                                                Get Link
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" onClick={() => startEdit(row)}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
                                                                            <Button size="sm" onClick={() => moveToPitch(row._id)}><Check className="mr-2 h-4 w-4" />Move to Pitch</Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </>
                                                    ) : null}

                                                    {activeTab === 'pitch' ? (
                                                        <>
                                                            <TableCell className="font-medium">{row.name || DASH}</TableCell>
                                                            <TableCell>{formatNumber(row.followers)}</TableCell>
                                                            <TableCell>
                                                                {row.primaryLink ? (
                                                                    <a href={row.primaryLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">
                                                                        Open
                                                                    </a>
                                                                ) : (
                                                                    joinList(row.links)
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{joinList(row.niche)}</TableCell>
                                                            <TableCell>{isEdit ? <Input value={draft.country ?? ''} onChange={(e) => setField('country', e.target.value)} /> : (row.country || DASH)}</TableCell>
                                                            <TableCell>{isEdit ? <Textarea value={draft.additionalInfo ?? ''} onChange={(e) => setField('additionalInfo', e.target.value)} rows={2} /> : (row.additionalInfo || DASH)}</TableCell>
                                                            <TableCell>{isEdit ? <Textarea value={draft.selectionReason ?? ''} onChange={(e) => setField('selectionReason', e.target.value)} rows={2} /> : (row.selectionReason || DASH)}</TableCell>
                                                            <TableCell>
                                                                {isEdit ? (
                                                                    <Checkbox checked={!!draft.goodFit} onCheckedChange={(checked) => setField('goodFit', !!checked)} />
                                                                ) : (
                                                                    <Badge variant={row.goodFit ? 'default' : 'secondary'}>{row.goodFit ? 'Yes' : 'No'}</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{isEdit ? <Input type="number" value={draft.rateUsd ?? ''} onChange={(e) => setField('rateUsd', e.target.value)} /> : formatNumber(row.rateUsd)}</TableCell>
                                                            <TableCell>{isEdit ? <Input type="number" value={draft.ourFeePct ?? ''} onChange={(e) => setField('ourFeePct', e.target.value)} /> : (row.ourFeePct ?? DASH)}</TableCell>
                                                            <TableCell>
                                                                <div className="space-y-2">
                                                                    <Badge variant={getInvitationTone(row.campaignInvitationStatus, row.hasInvited) as any}>
                                                                        {getInvitationLabel(row)}
                                                                    </Badge>
                                                                    {(row.hasInvitedAt || row.campaignInvitationSentAt) ? (
                                                                        <p className="text-xs text-muted-foreground">{formatDate(row.hasInvitedAt || row.campaignInvitationSentAt)}</p>
                                                                    ) : null}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {isEdit ? (
                                                                        <>
                                                                            <Button size="sm" onClick={saveRow}><Save className="mr-2 h-4 w-4" />Save</Button>
                                                                            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => sendCampaignInvitation(row._id)}
                                                                                disabled={sendingInviteId === row._id || isInvitationLocked(row)}
                                                                            >
                                                                                {sendingInviteId === row._id ? (
                                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <Send className="mr-2 h-4 w-4" />
                                                                                )}
                                                                                {row.hasInvited ? 'Invited' : 'Campaign Invitation'}
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" onClick={() => startEdit(row)}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </>
                                                    ) : null}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </SectionCard>

                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Quick notes</CardTitle>
                        <CardDescription>
                            Pitch invitations are enabled from the pitch table and will reflect invitation state using the backend fields like <span className="font-mono">hasInvited</span> and <span className="font-mono">campaignInvitationStatus</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <Field label="Campaign title">
                            <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{campaignTitle}</div>
                        </Field>
                        <Field label="Brand">
                            <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{brandName}</div>
                        </Field>
                        <Field label="Meta status">
                            <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm capitalize">
                                {metaLoading ? 'Loading...' : campaign?.status || DASH}
                            </div>
                        </Field>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
