import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Users,
  BarChart3,
  Upload,
  Download,
  Copy,
  Check,
  Shield,
  LogOut,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  XCircle,
  ChevronRight,
  Sparkles,
  Building2,
  FileSpreadsheet,
  Globe,
  Settings,
  Bell,
  History,
  Send,
  Award,
  Flame,
  PhoneMissed,
  PhoneCall,
  HelpCircle,
  Eye,
  Trash2,
  Edit3
} from 'lucide-react';

// ==========================================
// LIVE GOOGLE SHEETS WEB APP API URL
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbxyvjO-SOOCyKY8L4sPTx9FjPBb8qIRvz46Inil4PzM6CmYZTfdp5y1yk9ZQ73ixTxF/exec";

// ==========================================
// CONSTANTS & BUSINESS FUNNEL CONFIGURATION
// ==========================================
const DEFAULT_AGENTS = [
  { id: 'nusrat', sheetName: 'Nusrat', name: 'Nusrat', pin: '1111', role: 'agent', avatarColor: 'bg-emerald-600', campaignDefault: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD' },
  { id: 'jannat', sheetName: 'Jannat', name: 'Jannat', pin: '2222', role: 'agent', avatarColor: 'bg-indigo-600', campaignDefault: 'PD -Jabia-Sniper-$10--NOV8' },
  { id: 'agent3', sheetName: 'Tanvir', name: 'Tanvir', pin: '3333', role: 'agent', avatarColor: 'bg-amber-600', campaignDefault: 'PD | JABIYA | 10$ | CRORE | 7 JULY' },
  { id: 'admin', sheetName: 'Admin', name: 'Boss / Admin', pin: '9999', role: 'admin', avatarColor: 'bg-slate-900', campaignDefault: 'ALL' }
];

// Exact Statuses Synced Between UI & Google Sheet Column N
const LEAD_STATUSES = [
  { id: 'New Leads', label: 'New Leads', queue: 'new', badge: 'bg-blue-100 text-blue-800 border-blue-200', icon: Sparkles },
  { id: 'Not Answered', label: 'Not Answered', queue: 'retry', badge: 'bg-orange-100 text-orange-800 border-orange-200', icon: PhoneMissed },
  { id: 'Busy Right Now', label: 'Busy Right Now', queue: 'followup', badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  { id: 'Asked to Call Later', label: 'Asked to Call Later', queue: 'followup', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: Calendar },
  { id: 'Needs Follow-Up', label: 'Needs Follow-Up', queue: 'followup', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: RefreshCw },
  { id: 'Said Yes to Join Seminar', label: 'Said Yes to Join Seminar', queue: 'seminar', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  { id: 'Joined Seminar', label: 'Joined Seminar (Attended)', queue: 'converted', badge: 'bg-teal-100 text-teal-900 border-teal-300', icon: UserCheck },
  { id: 'Paying Partner', label: 'Converted as Paying Partner', queue: 'converted', badge: 'bg-yellow-100 text-yellow-900 border-yellow-400', icon: Award },
  { id: 'Not Interested', label: 'Not Interested', queue: 'closed', badge: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle }
];

const DISQUALIFICATION_REASONS = [
  'Expecting a Salaried Job Opportunity',
  'No Capital / Cannot Pay Package Fee',
  'Not Interested in Real Estate Referral',
  'Doesn\'t Understand the Offer / Skeptical',
  'Outside Dhaka / Cannot Attend Seminar in Person',
  'Fake / Wrong / Switched Off Number'
];

const CAMPAIGNS_LIST = [
  'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
  'PD -Jabia-Sniper-$10--NOV8',
  'PD | JABIYA | 10$ | CRORE | 7 JULY',
  'Property Deal | Nusrat | Crore | 22 June | 5$'
];

const getRelativeDateTime = (hoursOffset: number) => {
  const d = new Date(Date.now() + hoursOffset * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Normalize statuses coming from Google Sheet
const normalizeStatus = (rawStatus: string) => {
  const s = String(rawStatus || 'New Leads').trim();
  if (s === 'New Lead' || s === 'New Leads' || s === '') return 'New Leads';
  if (s === 'Busy' || s === 'Busy Right Now') return 'Busy Right Now';
  if (s === 'Attended Seminar' || s === 'Joined Seminar') return 'Joined Seminar';
  if (s === 'Converted Partner' || s === 'Paying Partner') return 'Paying Partner';
  return s;
};

// Normalize agent assignment coming from Google Sheet
const normalizeAgentId = (rawAgent: string) => {
  const a = String(rawAgent || '').trim().toLowerCase();
  if (a.includes('nusrat')) return 'nusrat';
  if (a.includes('jannat') || a.includes('jabia') || a.includes('jabiya')) return 'jannat';
  if (a.includes('tanvir') || a.includes('agent3')) return 'agent3';
  return 'unassigned';
};

const agentIdToSheetName = (agentId: string, customAgent3Name: string) => {
  if (agentId === 'nusrat') return 'Nusrat';
  if (agentId === 'jannat') return 'Jannat';
  if (agentId === 'agent3') return customAgent3Name || 'Tanvir';
  return 'Unassigned';
};

export default function App() {
  // ==========================================
  // PERSISTENT LOGIN & PIN MANAGEMENT STATE
  // ==========================================
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [pins, setPins] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pd_crm_pins');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return { Nusrat: '1111', Jannat: '2222', Tanvir: '3333', Admin: '9999' };
  });

  // Logged-in session persists across browser refreshes
  const [loggedInRoleKey, setLoggedInRoleKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pd_crm_user') || null;
    }
    return null;
  });

  const [loginSelectKey, setLoginSelectKey] = useState<string>('Nusrat');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Current viewed workspace (Admin can switch between Agent desks at 1 click; Agents stay in their own desk)
  const [currentAccount, setCurrentAccount] = useState(DEFAULT_AGENTS[0]);

  // Leads state synced with Master Google Sheet
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncBadge, setSyncBadge] = useState<string>('');

  // Agent Workspace Filters
  const [activeAgentTab, setActiveAgentTab] = useState('new'); // 'priority' | 'new' | 'retry' | 'seminar' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('ALL');

  // Admin Workspace Tabs
  const [activeAdminTab, setActiveAdminTab] = useState('scoreboard'); // 'scoreboard' | 'overdue' | 'campaigns' | 'import' | 'bossreport'

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalNextFollowUp, setModalNextFollowUp] = useState('');
  const [modalRejectionReason, setModalRejectionReason] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalError, setModalError] = useState('');

  // Bulk Import / New Lead Modal
  const [bulkText, setBulkText] = useState('');
  const [bulkCampaign, setBulkCampaign] = useState(CAMPAIGNS_LIST[0]);
  const [bulkAssignMode, setBulkAssignMode] = useState('nusrat');
  const [importFeedback, setImportFeedback] = useState('');

  // Settings & Spend Inputs for Boss Report
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customAgent3Name, setCustomAgent3Name] = useState('Tanvir');
  const [copiedReport, setCopiedReport] = useState(false);

  const [nusratSpend, setNusratSpend] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('pd_nusrat_spend') || '30.00' : '30.00'
  );
  const [jannatSpend, setJannatSpend] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('pd_jannat_spend') || '10.00' : '10.00'
  );

  // Sync currentAccount when loggedInRoleKey changes
  useEffect(() => {
    if (!loggedInRoleKey) return;
    if (loggedInRoleKey === 'Admin') {
      setCurrentAccount(agents.find((a) => a.id === 'admin') || DEFAULT_AGENTS[3]);
    } else if (loggedInRoleKey === 'Nusrat') {
      setCurrentAccount(agents.find((a) => a.id === 'nusrat') || DEFAULT_AGENTS[0]);
    } else if (loggedInRoleKey === 'Jannat') {
      setCurrentAccount(agents.find((a) => a.id === 'jannat') || DEFAULT_AGENTS[1]);
    } else {
      setCurrentAccount(agents.find((a) => a.id === 'agent3') || DEFAULT_AGENTS[2]);
    }
  }, [loggedInRoleKey, agents]);

  // ==========================================
  // LIVE GOOGLE SHEET FETCH & SYNC ENGINE
  // ==========================================
  const fetchCloudPins = () => {
    fetch(`${API_URL}?action=get_pins&_t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.pins) {
          setPins(data.pins);
          if (typeof window !== 'undefined') {
            localStorage.setItem('pd_crm_pins', JSON.stringify(data.pins));
          }
        }
      })
      .catch(() => {});
  };

  const fetchSheetLeads = () => {
    if (!loggedInRoleKey) return;
    setLoading(true);
    setSyncBadge('⏳ Syncing with Master Sheet...');
    // Fetch all active cohort leads so Admin and Agent views stay 100% in sync
    fetch(`${API_URL}?agent=Admin&_t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.pins) {
          setPins(data.pins);
          if (typeof window !== 'undefined') {
            localStorage.setItem('pd_crm_pins', JSON.stringify(data.pins));
          }
        }
        if (data && Array.isArray(data.leads)) {
          const mapped = data.leads
            .filter((row: any) => String(row.status || '').trim() !== 'Archived')
            .map((row: any) => {
              const normStatus = normalizeStatus(row.status);
              const profParts = [
                row.jobTitle ? String(row.jobTitle).trim() : '',
                row.location ? `📍 ${String(row.location).trim()}` : '',
                row.seminarInfo ? `🎟️ ${String(row.seminarInfo).trim()}` : ''
              ].filter(Boolean);

              const createdMs = row.createdTime ? new Date(row.createdTime).getTime() : 0;

              return {
                id: String(row.id || '').trim(),
                rowNumber: row.rowNumber,
                name: String(row.name || 'Prospect').trim(),
                phone: String(row.phone || '').trim(),
                profession: profParts.join(' • ') || 'Dhaka Prospect',
                campaign: String(row.campaign || row.sourceSheet || 'Meta Lead').trim(),
                assignedTo: normalizeAgentId(row.agent),
                status: normStatus,
                attempts: normStatus === 'New Leads' ? 0 : 1,
                nextFollowUp: row.followUpTime ? String(row.followUpTime) : '',
                rejectionReason: '',
                seminarReminder24h: String(row.notes || '').includes('[24h-Pin-Sent]'),
                seminarMorningConfirm: String(row.notes || '').includes('[Morning-Confirmed]'),
                lastNote: String(row.notes || '').trim(),
                createdTime: row.createdTime,
                createdAt: isNaN(createdMs) ? 0 : createdMs,
                history: row.notes
                  ? [
                      {
                        time: row.lastUpdated ? formatDateTimeReadable(row.lastUpdated) : 'Recorded in Sheet',
                        actor: row.agent || 'Agent',
                        action: normStatus,
                        note: String(row.notes)
                      }
                    ]
                  : []
              };
            })
            // Sort Newest to Oldest so today's leads are always at the top
            .sort((a: any, b: any) => (b.createdAt || b.rowNumber || 0) - (a.createdAt || a.rowNumber || 0));

          setLeads(mapped);
          setSyncBadge(`✅ Synced (${mapped.length} Active Leads)`);
          setTimeout(() => setSyncBadge(''), 3000);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error syncing with Master Sheet:', err);
        setSyncBadge('❌ Sync Error — Check Script Deployment');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCloudPins();
  }, []);

  useEffect(() => {
    if (loggedInRoleKey) {
      fetchSheetLeads();
    }
  }, [loggedInRoleKey]);

  // Write Lead Update Back to Google Sheet in Real Time
  const syncLeadToGoogleSheet = (leadId: string, updates: { status?: string; followUpTime?: string; notes?: string; agent?: string }) => {
    setSyncBadge('⏳ Saving to Master Sheet...');
    const params = new URLSearchParams({
      action: 'update',
      id: leadId,
      _t: Date.now().toString()
    });
    if (updates.status !== undefined) params.append('status', updates.status);
    if (updates.followUpTime !== undefined) params.append('followUpTime', updates.followUpTime);
    if (updates.notes !== undefined) params.append('notes', updates.notes);
    if (updates.agent !== undefined) params.append('agent', updates.agent);

    fetch(`${API_URL}?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result && result.updated > 0) {
          setSyncBadge(`✅ Saved to Sheet (Row #${result.rowNumber})`);
        } else {
          fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ id: leadId, ...updates })
          }).then(() => setSyncBadge('✅ Saved to Sheet'));
        }
        setTimeout(() => setSyncBadge(''), 3500);
      })
      .catch(() => {
        setSyncBadge('❌ Sync Error — Check Script');
      });
  };

  // ==========================================
  // LOGIN & LOGOUT HANDLERS
  // ==========================================
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = String(pins[loginSelectKey] || '').trim();
    if (String(pinInput).trim() === expectedPin) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pd_crm_user', loginSelectKey);
      }
      setLoggedInRoleKey(loginSelectKey);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect 4-Digit PIN. Please try again.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pd_crm_user');
    }
    setLoggedInRoleKey(null);
    setPinInput('');
    setPinError('');
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const isOverdue = (dateStr: string, status: string) => {
    if (!dateStr) return false;
    if (!['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up', 'Not Answered'].includes(status)) return false;
    const due = new Date(dateStr).getTime();
    return !isNaN(due) && due < Date.now();
  };

  const isDueToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  function formatDateTimeReadable(dateStr: string) {
    if (!dateStr) return 'Not scheduled';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  const getAgentName = (agentId: string) => {
    const found = agents.find((a) => a.id === agentId);
    return found ? found.name : agentId;
  };

  const getStatusMeta = (statusId: string) => {
    return LEAD_STATUSES.find((s) => s.id === statusId) || LEAD_STATUSES[0];
  };

  // ==========================================
  // LEAD UPDATE & FUNNEL RULES ENGINE
  // ==========================================
  const openLeadModal = (lead: any, presetStatus: string | null = null) => {
    setSelectedLead(lead);
    const targetStatus = presetStatus || lead.status;
    setModalStatus(targetStatus);
    setModalNextFollowUp(lead.nextFollowUp || getRelativeDateTime(3));
    setModalRejectionReason(lead.rejectionReason || DISQUALIFICATION_REASONS[0]);
    setModalNote(lead.lastNote || '');
    setModalError('');
  };

  const saveLeadDisposition = async () => {
    if (!selectedLead) return;

    // MANDATORY VALIDATION 1: Follow-Up states require Next Follow-Up Date/Time & Call Note
    if (['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up'].includes(modalStatus)) {
      if (!modalNextFollowUp) {
        setModalError('Mandatory Rule: You must select a Callback Date & Time before saving this follow-up.');
        return;
      }
      if (!modalNote.trim() && !selectedLead.lastNote) {
        setModalError('Mandatory Rule: Please write a brief note explaining when/why the prospect asked to be called back.');
        return;
      }
    }

    // MANDATORY VALIDATION 2: "Not Interested" requires a specific reason
    if (modalStatus === 'Not Interested' && !modalRejectionReason) {
      setModalError('Mandatory Rule: Every "Not Interested" lead must have a specific disqualification reason.');
      return;
    }

    let updatedAttempts = selectedLead.attempts || 0;
    let updatedFollowUp = modalNextFollowUp;

    if (modalStatus === 'Not Answered') {
      updatedAttempts += 1;
      if (!updatedFollowUp) {
        updatedFollowUp = getRelativeDateTime(3);
      }
    } else if (selectedLead.status === 'New Leads' && modalStatus !== 'New Leads') {
      updatedAttempts = Math.max(1, updatedAttempts);
    }

    const nowFormatted = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const noteSummary =
      modalStatus === 'Not Interested'
        ? `Reason: ${modalRejectionReason}${modalNote ? ` — ${modalNote}` : ''}`
        : modalNote.trim() || selectedLead.lastNote || `Status updated to ${modalStatus}`;

    const newHistoryEntry = {
      time: nowFormatted,
      actor: currentAccount.name,
      action:
        modalStatus === 'Not Answered'
          ? `Attempt #${updatedAttempts}: Not Answered`
          : `Marked as ${modalStatus}`,
      note: noteSummary
    };

    const updatedHistory = [newHistoryEntry, ...(selectedLead.history || [])];
    const cleanFollowUp = ['Not Interested', 'Paying Partner', 'New Leads'].includes(modalStatus)
      ? ''
      : updatedFollowUp;

    const updatedLead = {
      ...selectedLead,
      status: modalStatus,
      attempts: updatedAttempts,
      nextFollowUp: cleanFollowUp,
      rejectionReason: modalStatus === 'Not Interested' ? modalRejectionReason : '',
      lastNote: noteSummary,
      history: updatedHistory
    };

    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setSelectedLead(null);

    // Sync directly to Google Sheet Master Sheet
    syncLeadToGoogleSheet(updatedLead.id, {
      status: modalStatus,
      followUpTime: cleanFollowUp,
      notes: noteSummary
    });
  };

  const toggleSeminarCheck = (lead: any, field: 'seminarReminder24h' | 'seminarMorningConfirm') => {
    const newVal = !lead[field];
    const tag = field === 'seminarReminder24h' ? '[24h-Pin-Sent]' : '[Morning-Confirmed]';
    let updatedNote = lead.lastNote || '';
    if (newVal && !updatedNote.includes(tag)) {
      updatedNote = `${updatedNote} ${tag}`.trim();
    } else if (!newVal) {
      updatedNote = updatedNote.replace(tag, '').trim();
    }

    const updatedLead = {
      ...lead,
      [field]: newVal,
      lastNote: updatedNote
    };

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
    syncLeadToGoogleSheet(lead.id, { notes: updatedNote });
  };

  // Save Agent Names & All 4 PINs from Settings Modal
  const saveSettingsAndPins = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAgent3Name.trim()) {
      setAgents((prev) =>
        prev.map((a) => (a.id === 'agent3' ? { ...a, name: customAgent3Name.trim() } : a))
      );
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('pd_crm_pins', JSON.stringify(pins));
    }
    setSyncBadge('⏳ Saving PINs to Cloud...');
    fetch(`${API_URL}?action=save_pins&pins=${encodeURIComponent(JSON.stringify(pins))}&_t=${Date.now()}`)
      .then((res) => res.json())
      .then(() => {
        setSyncBadge('✅ All Agent PINs Updated!');
        setTimeout(() => setSyncBadge(''), 3500);
      })
      .catch(() => {
        setSyncBadge('✅ PINs Saved Locally');
        setTimeout(() => setSyncBadge(''), 3500);
      });
    setShowSettingsModal(false);
  };

  // Export CSV for Backup
  const exportToCSV = () => {
    const headers = [
      'Lead ID',
      'Sheet Row #',
      'Name',
      'Phone',
      'Profession/Area',
      'Campaign',
      'Assigned Agent',
      'Status',
      'Next Follow-Up',
      'Last Call Note'
    ];
    const rows = leads.map((l) => [
      l.id,
      l.rowNumber || '',
      `"${(l.name || '').replace(/"/g, '""')}"`,
      l.phone,
      `"${(l.profession || '').replace(/"/g, '""')}"`,
      `"${(l.campaign || '').replace(/"/g, '""')}"`,
      getAgentName(l.assignedTo),
      l.status,
      l.nextFollowUp || '',
      `"${(l.lastNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PropertyDeals_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // COMPUTED METRICS FOR SCOREBOARD & QUEUES
  // ==========================================
  const calculateStatsForList = (list: any[]) => {
    const total = list.length;
    const newLeads = list.filter((l) => l.status === 'New Leads').length;
    const notAnswered = list.filter((l) => l.status === 'Not Answered').length;
    const notInterested = list.filter((l) => l.status === 'Not Interested').length;
    const callLater = list.filter((l) => l.status === 'Asked to Call Later').length;
    const busy = list.filter((l) => l.status === 'Busy Right Now').length;
    const needsFollowUp = list.filter((l) => l.status === 'Needs Follow-Up').length;

    const saidYesOnly = list.filter((l) => l.status === 'Said Yes to Join Seminar').length;
    const attendedOnly = list.filter((l) => l.status === 'Joined Seminar').length;
    const convertedPartner = list.filter((l) => l.status === 'Paying Partner').length;

    const totalSaidYesCumulative = saidYesOnly + attendedOnly + convertedPartner;
    const totalAttendedCumulative = attendedOnly + convertedPartner;

    const contacted =
      notInterested + callLater + busy + needsFollowUp + totalSaidYesCumulative;

    const activeFollowUpPool = callLater + busy + needsFollowUp;

    const overdueCount = list.filter((l) => isOverdue(l.nextFollowUp, l.status)).length;
    const dueTodayCount = list.filter(
      (l) =>
        ['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up'].includes(l.status) &&
        (isOverdue(l.nextFollowUp, l.status) || isDueToday(l.nextFollowUp))
    ).length;

    const contactRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
    const yesRateFromContacted =
      contacted > 0 ? Math.round((totalSaidYesCumulative / contacted) * 100) : 0;

    return {
      total,
      newLeads,
      notAnswered,
      contacted,
      contactRate,
      notInterested,
      callLater,
      busy,
      needsFollowUp,
      activeFollowUpPool,
      overdueCount,
      dueTodayCount,
      saidYesActive: saidYesOnly,
      totalSaidYesCumulative,
      yesRateFromContacted,
      totalAttendedCumulative,
      convertedPartner
    };
  };

  const scoreboard: any = useMemo(() => {
    const nusratLeads = leads.filter((l) => l.assignedTo === 'nusrat');
    const jannatLeads = leads.filter((l) => l.assignedTo === 'jannat');
    const agent3Leads = leads.filter((l) => l.assignedTo === 'agent3');

    return {
      nusrat: calculateStatsForList(nusratLeads),
      jannat: calculateStatsForList(jannatLeads),
      agent3: calculateStatsForList(agent3Leads),
      total: calculateStatsForList(leads)
    };
  }, [leads]);

  const agentLeads = useMemo(() => {
    const base =
      currentAccount.role === 'admin'
        ? leads
        : leads.filter((l) => l.assignedTo === currentAccount.id);

    return base.filter((l) => {
      const matchesCampaign = campaignFilter === 'ALL' || l.campaign === campaignFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery) ||
        (l.profession || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCampaign && matchesSearch;
    });
  }, [leads, currentAccount, campaignFilter, searchQuery]);

  const agentStats = useMemo(() => calculateStatsForList(agentLeads), [agentLeads]);

  const displayedQueueLeads = useMemo(() => {
    let list = [...agentLeads];
    if (activeAgentTab === 'priority') {
      list = list.filter((l) =>
        ['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up'].includes(l.status)
      );
      list.sort((a, b) => {
        const tA = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : Infinity;
        const tB = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : Infinity;
        return tA - tB;
      });
    } else if (activeAgentTab === 'new') {
      list = list.filter((l) => l.status === 'New Leads');
    } else if (activeAgentTab === 'retry') {
      list = list.filter((l) => l.status === 'Not Answered');
    } else if (activeAgentTab === 'seminar') {
      list = list.filter((l) =>
        ['Said Yes to Join Seminar', 'Joined Seminar', 'Paying Partner'].includes(l.status)
      );
    }
    return list;
  }, [agentLeads, activeAgentTab]);

  // Plain-English Boss Report Text (With USD Spend & Partner Math)
  const plainLanguageBossReport = useMemo(() => {
    const t = scoreboard.total;
    const n = scoreboard.nusrat;
    const j = scoreboard.jannat;
    const a3 = scoreboard.agent3;
    const agent3Name = getAgentName('agent3');

    const nSpend = parseFloat(nusratSpend) || 0;
    const jSpend = parseFloat(jannatSpend) || 0;
    const totalSpend = nSpend + jSpend;
    const costPerYes = t.totalSaidYesCumulative > 0 ? (totalSpend / t.totalSaidYesCumulative).toFixed(2) : '0.00';
    const nCostPerYes = n.totalSaidYesCumulative > 0 ? (nSpend / n.totalSaidYesCumulative).toFixed(2) : '0.00';
    const jCostPerYes = j.totalSaidYesCumulative > 0 ? (jSpend / j.totalSaidYesCumulative).toFixed(2) : '0.00';
    const costPerAttendee = t.totalAttendedCumulative > 0 ? (totalSpend / t.totalAttendedCumulative).toFixed(2) : '0.00';
    const partnerRevenue = (t.convertedPartner * 100).toFixed(2);

    return `📊 *DAILY BUSINESS & SEMINAR REPORT (MAIN ACCOUNT)*
📅 Date: ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}

*1. MONEY SPENT VS. MONEY MADE (USD)*
- Total Ad Money Spent: $${totalSpend.toFixed(2)}
- Converted as Paying Partners ($100 Package Fee): ${t.convertedPartner} Partners ($${partnerRevenue})

*2. HOW MANY SAID "YES" TO SEMINAR & WHICH CAMPAIGN*
- *Total Said "YES" to Join Seminar:* ${t.totalSaidYesCumulative} People (Cost us $${costPerYes} per Yes)
  1) Nusrat Campaign (PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD):
     Spent $${nSpend.toFixed(2)} → ${n.total} Leads → ${n.totalSaidYesCumulative} Said Yes ($${nCostPerYes} per Yes)
  2) Jannat Campaign (Jabiya $10 Crore / Sniper):
     Spent $${jSpend.toFixed(2)} → ${j.total} Leads → ${j.totalSaidYesCumulative} Said Yes ($${jCostPerYes} per Yes)

*3. SEMINAR ATTENDANCE & COST TO BRING THEM IN*
- Actually Joined the Seminar: ${t.totalAttendedCumulative} People
- Ad Money Spent per Person Who Joined Seminar: $${costPerAttendee}

*4. FULL CALL BREAKDOWN (OUT OF ${t.total} ACTIVE LEADS)*
- Spoke on Phone (Contacted): ${t.contacted} (${t.contactRate}%) | Did Not Answer: ${t.notAnswered} | Untouched New: ${t.newLeads}
- Said Yes to Join Seminar: ${t.totalSaidYesCumulative}
- *Active Follow-Up Pool (${t.activeFollowUpPool} Total):* ${t.callLater} Asked to Call Later | ${t.busy} Busy | ${t.needsFollowUp} Need Follow-Up
- Not Interested: ${t.notInterested}

*5. AGENT-BY-AGENT CALL SUMMARY*
- *Nusrat:* ${n.total} Assigned | ${n.newLeads} New | ${n.contacted} Contacted | ${n.activeFollowUpPool} Follow-Up | ${n.totalSaidYesCumulative} Seminar Yes
- *Jannat:* ${j.total} Assigned | ${j.newLeads} New | ${j.contacted} Contacted | ${j.activeFollowUpPool} Follow-Up | ${j.totalSaidYesCumulative} Seminar Yes
- *${agent3Name}:* ${a3.total} Assigned | ${a3.newLeads} New | ${a3.contacted} Contacted | ${a3.activeFollowUpPool} Follow-Up | ${a3.totalSaidYesCumulative} Seminar Yes`;
  }, [scoreboard, nusratSpend, jannatSpend, agents]);

  const copyBossReport = () => {
    navigator.clipboard.writeText(plainLanguageBossReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const getWhatsAppUrl = (lead: any) => {
    const cleanPhone = String(lead.phone || '').replace(/[^0-9]/g, '');
    const text = `আসসালামু আলাইকুম ${lead.name} স্যার, আমি Property Deals BD থেকে ${currentAccount.name} বলছি। চাকরি বা ব্যবসার পাশাপাশি রিয়েল এস্টেট রেফারেল কমিশনের মাধ্যমে মাসিক বাড়তি আয়ের ফ্রি সেমিনারে আপনার আসনটি নিশ্চিত করার জন্য মেসেজ দিচ্ছি।`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // ==========================================
  // SCREEN 1: PIN LOGIN GATE (PERSISTENT ON REFRESH)
  // ==========================================
  if (!loggedInRoleKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 mx-auto mb-3 shadow">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 text-center">Property Deals BD</h1>
          <p className="text-xs text-slate-500 text-center mb-6">
            Call Center & Follow-Up CRM Portal
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Select Your Account
              </label>
              <select
                value={loginSelectKey}
                onChange={(e) => setLoginSelectKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm font-bold text-slate-900 bg-slate-50"
              >
                <option value="Nusrat">🎧 Agent 1: Nusrat</option>
                <option value="Jannat">🎧 Agent 2: Jannat</option>
                <option value="Tanvir">🎧 Agent 3: {getAgentName('agent3')}</option>
                <option value="Admin">👑 Boss / Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Enter Security PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-center text-xl tracking-widest font-mono bg-slate-50"
                required
              />
            </div>

            {pinError && (
              <p className="text-xs font-bold text-rose-600 text-center">{pinError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
            >
              Login to Workspace
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ==========================================
          TOP NAVIGATION & ROLE SWITCHER BAR
          ========================================== */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Live Sync Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  propertydealbd
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Sheet CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                {syncBadge ? (
                  <span className="text-emerald-300 font-bold">{syncBadge}</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected to Master Google Sheet
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Account Switcher (Visible to Admin so Boss can inspect any Agent's Queue) */}
          {loggedInRoleKey === 'Admin' && (
            <div className="flex items-center flex-wrap gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 px-2 font-medium hidden md:inline">
                Inspect Desk:
              </span>
              {agents.map((acc) => {
                const active = currentAccount.id === acc.id;
                const accStats =
                  acc.id === 'admin'
                    ? scoreboard.total
                    : scoreboard[acc.id] || { overdueCount: 0 };
                return (
                  <button
                    key={acc.id}
                    onClick={() => setCurrentAccount(acc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{acc.role === 'admin' ? '👑 Boss / Admin' : `🎧 ${acc.name}`}</span>
                    {accStats.overdueCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          active ? 'bg-slate-950 text-rose-400' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {accStats.overdueCount}!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Actions (Sync, PIN Settings, Logout) */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSheetLeads}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              title="Pull latest leads from Master Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Sheet</span>
            </button>

            {loggedInRoleKey === 'Admin' && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="Change Representative & Admin PINs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage PINs</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN CONTENT AREA: ADMIN VS AGENT VIEW
          ========================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {currentAccount.role === 'admin' ? (
          /* ==========================================
             BOSS / ADMIN COMMAND CENTER VIEW
             ========================================== */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                    BOSS & ADMIN VIEW
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Live Connected to Property Deals LEADS Master Sheet
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  3-Agent Call Center & Follow-Up Funnel Monitor
                </h2>
                <p className="text-sm text-slate-600">
                  Track every active lead assigned to <strong>Nusrat</strong>, <strong>Jannat</strong>, and{' '}
                  <strong>{getAgentName('agent3')}</strong> across your 8 call outcomes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveAdminTab('bossreport')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Plain-English Boss Report</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Executive Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-medium text-slate-500">Active Cohort Leads</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {scoreboard.total.total}
                </div>
                <span className="text-[11px] text-blue-600 font-medium">
                  {scoreboard.total.newLeads} untouched new
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-medium text-slate-500">Contacted (Spoke)</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {scoreboard.total.contacted}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {scoreboard.total.contactRate}% Contact Rate
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
                <span className="text-xs font-semibold text-amber-800">Active Follow-Up Pool</span>
                <div className="text-2xl font-extrabold text-amber-900 mt-1">
                  {scoreboard.total.activeFollowUpPool}
                </div>
                <span className="text-[11px] text-amber-700">
                  Call Later + Busy + Follow-Up
                </span>
              </div>

              <div
                onClick={() => setActiveAdminTab('overdue')}
                className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-sm cursor-pointer hover:border-rose-400 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700">Overdue Callbacks</span>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-extrabold text-rose-700 mt-1">
                  {scoreboard.total.overdueCount}
                </div>
                <span className="text-[11px] text-rose-600 font-medium underline">
                  Click to inspect missed calls
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
                <span className="text-xs font-bold text-emerald-800">Said &quot;Yes&quot; to Seminar</span>
                <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                  {scoreboard.total.totalSaidYesCumulative}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {scoreboard.total.yesRateFromContacted}% of contacted leads
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-yellow-300 bg-yellow-50/50 shadow-sm">
                <span className="text-xs font-bold text-yellow-900">Paying Partners</span>
                <div className="text-2xl font-extrabold text-yellow-800 mt-1">
                  {scoreboard.total.convertedPartner}
                </div>
                <span className="text-[11px] text-yellow-800 font-medium">
                  From {scoreboard.total.totalAttendedCumulative} seminar attendees
                </span>
              </div>
            </div>

            {/* Admin Sub-Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              {[
                { id: 'scoreboard', label: '📊 3-Agent Performance Scoreboard' },
                { id: 'overdue', label: `🚨 Overdue & Pending Follow-Ups (${scoreboard.total.activeFollowUpPool})` },
                { id: 'campaigns', label: '🎯 Campaign Seminar Breakdown' },
                { id: 'bossreport', label: '📝 Plain-Language Boss Update' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    activeAdminTab === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: 3-AGENT SIDE-BY-SIDE SCOREBOARD TABLE */}
            {activeAdminTab === 'scoreboard' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Side-by-Side Call Center Agent Funnel Comparison
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tracks the exact 8 call statuses synced directly with your Google Sheet Master Sheet.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-5 font-bold">Funnel Stage / Call Parameter</th>
                        <th className="py-3.5 px-4 font-bold text-emerald-800 bg-emerald-50/50">
                          🎧 Agent 1: Nusrat
                        </th>
                        <th className="py-3.5 px-4 font-bold text-indigo-800 bg-indigo-50/50">
                          🎧 Agent 2: Jannat
                        </th>
                        <th className="py-3.5 px-4 font-bold text-amber-800 bg-amber-50/50">
                          🎧 Agent 3: {getAgentName('agent3')}
                        </th>
                        <th className="py-3.5 px-5 font-extrabold text-slate-900 bg-slate-200/60">
                          Total Team Cohort
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-semibold text-slate-900">
                          1. Total Active Leads Assigned
                        </td>
                        <td className="py-3 px-4 font-bold">{scoreboard.nusrat.total}</td>
                        <td className="py-3 px-4 font-bold">{scoreboard.jannat.total}</td>
                        <td className="py-3 px-4 font-bold">{scoreboard.agent3.total}</td>
                        <td className="py-3 px-5 font-extrabold bg-slate-50">{scoreboard.total.total}</td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 text-slate-600 pl-8">
                          • Untouched New Leads (Waiting for 1st Call)
                        </td>
                        <td className="py-3 px-4 text-blue-700 font-bold">{scoreboard.nusrat.newLeads}</td>
                        <td className="py-3 px-4 text-blue-700 font-bold">{scoreboard.jannat.newLeads}</td>
                        <td className="py-3 px-4 text-blue-700 font-bold">{scoreboard.agent3.newLeads}</td>
                        <td className="py-3 px-5 font-bold text-blue-800 bg-slate-50">{scoreboard.total.newLeads}</td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-semibold text-orange-800">
                          2. Not Answered (In 3-Strike Retry Queue)
                        </td>
                        <td className="py-3 px-4 text-orange-700 font-semibold">{scoreboard.nusrat.notAnswered}</td>
                        <td className="py-3 px-4 text-orange-700 font-semibold">{scoreboard.jannat.notAnswered}</td>
                        <td className="py-3 px-4 text-orange-700 font-semibold">{scoreboard.agent3.notAnswered}</td>
                        <td className="py-3 px-5 font-bold text-orange-800 bg-slate-50">{scoreboard.total.notAnswered}</td>
                      </tr>

                      <tr className="bg-slate-50/90">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          3. Successfully Contacted (Spoke on Phone)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {scoreboard.nusrat.contacted} ({scoreboard.nusrat.contactRate}%)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {scoreboard.jannat.contacted} ({scoreboard.jannat.contactRate}%)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {scoreboard.agent3.contacted} ({scoreboard.agent3.contactRate}%)
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-slate-900 bg-slate-100">
                          {scoreboard.total.contacted} ({scoreboard.total.contactRate}%)
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 text-rose-700 font-medium pl-8">
                          • Not Interested (Hard No / Disqualified)
                        </td>
                        <td className="py-3 px-4 text-rose-700">{scoreboard.nusrat.notInterested}</td>
                        <td className="py-3 px-4 text-rose-700">{scoreboard.jannat.notInterested}</td>
                        <td className="py-3 px-4 text-rose-700">{scoreboard.agent3.notInterested}</td>
                        <td className="py-3 px-5 font-bold text-rose-800 bg-slate-50">{scoreboard.total.notInterested}</td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 text-purple-800 font-medium pl-8">
                          • Asked to Call Later (Scheduled Callback)
                        </td>
                        <td className="py-3 px-4 text-purple-800 font-semibold">{scoreboard.nusrat.callLater}</td>
                        <td className="py-3 px-4 text-purple-800 font-semibold">{scoreboard.jannat.callLater}</td>
                        <td className="py-3 px-4 text-purple-800 font-semibold">{scoreboard.agent3.callLater}</td>
                        <td className="py-3 px-5 font-bold text-purple-900 bg-slate-50">{scoreboard.total.callLater}</td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 text-amber-800 font-medium pl-8">
                          • Busy Right Now (Quick Retry Needed)
                        </td>
                        <td className="py-3 px-4 text-amber-800 font-semibold">{scoreboard.nusrat.busy}</td>
                        <td className="py-3 px-4 text-amber-800 font-semibold">{scoreboard.jannat.busy}</td>
                        <td className="py-3 px-4 text-amber-800 font-semibold">{scoreboard.agent3.busy}</td>
                        <td className="py-3 px-5 font-bold text-amber-900 bg-slate-50">{scoreboard.total.busy}</td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 text-cyan-800 font-medium pl-8">
                          • Needs Follow-Up (Warm / Details Sent on WhatsApp)
                        </td>
                        <td className="py-3 px-4 text-cyan-800 font-semibold">{scoreboard.nusrat.needsFollowUp}</td>
                        <td className="py-3 px-4 text-cyan-800 font-semibold">{scoreboard.jannat.needsFollowUp}</td>
                        <td className="py-3 px-4 text-cyan-800 font-semibold">{scoreboard.agent3.needsFollowUp}</td>
                        <td className="py-3 px-5 font-bold text-cyan-900 bg-slate-50">{scoreboard.total.needsFollowUp}</td>
                      </tr>

                      <tr className="bg-amber-50/70">
                        <td className="py-3.5 px-5 font-bold text-amber-950">
                          4. Total Pending Follow-Up Pool (Call Later + Busy + Follow-Up)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-950">
                          {scoreboard.nusrat.activeFollowUpPool}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-950">
                          {scoreboard.jannat.activeFollowUpPool}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-950">
                          {scoreboard.agent3.activeFollowUpPool}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-amber-950 bg-amber-100/70">
                          {scoreboard.total.activeFollowUpPool} ({scoreboard.total.overdueCount} Overdue)
                        </td>
                      </tr>

                      <tr className="bg-emerald-50/70">
                        <td className="py-3.5 px-5 font-extrabold text-emerald-950">
                          5. Said &quot;YES&quot; to Join Seminar (Cumulative)
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          {scoreboard.nusrat.totalSaidYesCumulative}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          {scoreboard.jannat.totalSaidYesCumulative}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          {scoreboard.agent3.totalSaidYesCumulative}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-emerald-900 bg-emerald-100/80">
                          {scoreboard.total.totalSaidYesCumulative}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-bold text-teal-900">
                          6. Actually Joined Seminar (Attended)
                        </td>
                        <td className="py-3 px-4 font-bold text-teal-800">{scoreboard.nusrat.totalAttendedCumulative}</td>
                        <td className="py-3 px-4 font-bold text-teal-800">{scoreboard.jannat.totalAttendedCumulative}</td>
                        <td className="py-3 px-4 font-bold text-teal-800">{scoreboard.agent3.totalAttendedCumulative}</td>
                        <td className="py-3 px-5 font-extrabold text-teal-900 bg-slate-50">{scoreboard.total.totalAttendedCumulative}</td>
                      </tr>

                      <tr className="bg-yellow-50/90">
                        <td className="py-3.5 px-5 font-extrabold text-yellow-950">
                          7. Converted as Paying Partner ($100 Package Fee)
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-yellow-900">{scoreboard.nusrat.convertedPartner}</td>
                        <td className="py-3.5 px-4 font-extrabold text-yellow-900">{scoreboard.jannat.convertedPartner}</td>
                        <td className="py-3.5 px-4 font-extrabold text-yellow-900">{scoreboard.agent3.convertedPartner}</td>
                        <td className="py-3.5 px-5 font-extrabold text-yellow-950 bg-yellow-100">
                          {scoreboard.total.convertedPartner} Paying Partners
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: OVERDUE & PENDING FOLLOW-UP MONITOR */}
            {activeAdminTab === 'overdue' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600" />
                  <span>Active & Overdue Follow-Up Monitor Across All 3 Agents</span>
                </h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {leads
                    .filter((l) =>
                      ['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up'].includes(l.status)
                    )
                    .map((lead) => {
                      const overdue = isOverdue(lead.nextFollowUp, lead.status);
                      const statusMeta = getStatusMeta(lead.status);
                      return (
                        <div
                          key={lead.id}
                          className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            overdue ? 'bg-rose-50/60' : 'bg-white'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900">{lead.name}</span>
                              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                {lead.phone}
                              </span>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusMeta.badge}`}>
                                {lead.status}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                                Assigned: {getAgentName(lead.assignedTo)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              <strong>Last Note:</strong> {lead.lastNote || 'None'} •{' '}
                              <strong>Callback:</strong> {formatDateTimeReadable(lead.nextFollowUp)}
                            </p>
                          </div>
                          <button
                            onClick={() => openLeadModal(lead)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                          >
                            Update / Inspect
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 3: CAMPAIGN SEMINAR BREAKDOWN */}
            {activeAdminTab === 'campaigns' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-base text-slate-900">
                    Campaign Seminar Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-xs uppercase border-b border-slate-200">
                        <th className="py-3.5 px-5 font-bold">Campaign Name</th>
                        <th className="py-3.5 px-4 font-bold">Total Leads</th>
                        <th className="py-3.5 px-4 font-bold">Contacted</th>
                        <th className="py-3.5 px-4 font-bold text-amber-800">In Follow-Up Pool</th>
                        <th className="py-3.5 px-4 font-bold text-emerald-800">Said &quot;Yes&quot; to Seminar</th>
                        <th className="py-3.5 px-4 font-bold text-teal-800">Joined Seminar</th>
                        <th className="py-3.5 px-4 font-bold text-yellow-900">Paying Partners</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Array.from(new Set(leads.map((l) => l.campaign))).map((camp: any) => {
                        const cLeads = leads.filter((l) => l.campaign === camp);
                        const st = calculateStatsForList(cLeads);
                        return (
                          <tr key={camp} className="hover:bg-slate-50">
                            <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-900">
                              {camp}
                            </td>
                            <td className="py-3.5 px-4 font-bold">{st.total}</td>
                            <td className="py-3.5 px-4">
                              {st.contacted} ({st.contactRate}%)
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-amber-800">
                              {st.activeFollowUpPool}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                              {st.totalSaidYesCumulative}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-teal-800">
                              {st.totalAttendedCumulative}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-yellow-900">
                              {st.convertedPartner}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: PLAIN-ENGLISH BOSS REPORT GENERATOR */}
            {activeAdminTab === 'bossreport' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      1-Click Plain-Language Boss Report (USD & WhatsApp Ready)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Zero marketing acronyms. Shows your boss money spent vs. money made, seminar RSVPs by campaign, and full call center outcomes.
                    </p>
                  </div>
                  <button
                    onClick={copyBossReport}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied for WhatsApp!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Report for Boss</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nusrat Campaign Ad Spend ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={nusratSpend}
                      onChange={(e) => {
                        setNusratSpend(e.target.value);
                        if (typeof window !== 'undefined') localStorage.setItem('pd_nusrat_spend', e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jannat Campaign Ad Spend ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={jannatSpend}
                      onChange={(e) => {
                        setJannatSpend(e.target.value);
                        if (typeof window !== 'undefined') localStorage.setItem('pd_jannat_spend', e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                    />
                  </div>
                </div>

                <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
                  {plainLanguageBossReport}
                </pre>
              </div>
            )}
          </div>
        ) : (
          /* ==========================================
             CALL CENTER AGENT WORKSPACE VIEW (NUSRAT / JANNAT / TANVIR)
             ========================================== */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl ${currentAccount.avatarColor} text-white flex items-center justify-center font-extrabold text-xl shadow-sm`}
                >
                  {currentAccount.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {currentAccount.name}&apos;s Calling & Follow-Up Desk
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Newest Leads First
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every status update automatically saves to your row in the Master Google Sheet.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-700 block">Due / Overdue</span>
                  <span className="text-lg font-extrabold text-rose-700">
                    {agentStats.dueTodayCount}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-700 block">New Leads</span>
                  <span className="text-lg font-extrabold text-blue-800">{agentStats.newLeads}</span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block">Contacted</span>
                  <span className="text-lg font-extrabold text-slate-900">{agentStats.contacted}</span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 block">Follow-Up Pool</span>
                  <span className="text-lg font-extrabold text-amber-900">
                    {agentStats.activeFollowUpPool}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block">Seminar &quot;Yes&quot;</span>
                  <span className="text-lg font-extrabold text-emerald-800">
                    {agentStats.totalSaidYesCumulative}
                  </span>
                </div>
              </div>
            </div>

            {/* Logical Follow-Up Funnel Queue Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    id: 'new',
                    label: '🆕 1. New Leads (To Call)',
                    count: agentStats.newLeads,
                    badgeColor: 'bg-blue-600 text-white'
                  },
                  {
                    id: 'priority',
                    label: '🔥 2. Priority Follow-Up Queue',
                    count: agentStats.activeFollowUpPool,
                    badgeColor: 'bg-rose-600 text-white'
                  },
                  {
                    id: 'retry',
                    label: '🔄 3. Not Answered (Retry)',
                    count: agentStats.notAnswered,
                    badgeColor: 'bg-orange-600 text-white'
                  },
                  {
                    id: 'seminar',
                    label: '🎟️ 4. Seminar "Yes" & Reminders',
                    count: agentStats.totalSaidYesCumulative,
                    badgeColor: 'bg-emerald-600 text-white'
                  },
                  {
                    id: 'all',
                    label: '📋 All My Leads',
                    count: agentStats.total,
                    badgeColor: 'bg-slate-700 text-white'
                  }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveAgentTab(t.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeAgentTab === t.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeAgentTab === t.id ? 'bg-emerald-400 text-slate-950' : t.badgeColor
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or phone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* AGENT LEAD CARDS LIST */}
            <div className="space-y-3">
              {displayedQueueLeads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">
                    This Queue Is All Clear!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No leads waiting in this bucket right now. Switch to another funnel queue tab above or click Sync Sheet.
                  </p>
                </div>
              ) : (
                displayedQueueLeads.map((lead) => {
                  const statusMeta = getStatusMeta(lead.status);
                  const overdue = isOverdue(lead.nextFollowUp, lead.status);
                  const dueToday = isDueToday(lead.nextFollowUp);

                  return (
                    <div
                      key={lead.id}
                      className={`bg-white rounded-2xl border transition shadow-sm p-4 sm:p-5 ${
                        overdue
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{lead.name}</h3>
                            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200">
                              {lead.phone}
                            </span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badge}`}
                            >
                              {lead.status}
                            </span>
                            {lead.rowNumber && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                                Row #{lead.rowNumber} • {formatDateTimeReadable(lead.createdTime)}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{lead.profession}</span> •{' '}
                            Campaign: <span className="font-mono text-[11px]">{lead.campaign}</span>
                          </p>

                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900">Last Note: </span>
                              <span>{lead.lastNote || 'No call notes recorded yet.'}</span>
                            </div>
                            {lead.nextFollowUp && (
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                ⏰ Callback: {formatDateTimeReadable(lead.nextFollowUp)}
                              </span>
                            )}
                          </div>

                          {['Said Yes to Join Seminar', 'Joined Seminar', 'Paying Partner'].includes(
                            lead.status
                          ) && (
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold text-emerald-900">
                                Seminar Show-Up Checklist:
                              </span>
                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <input
                                  type="checkbox"
                                  checked={!!lead.seminarReminder24h}
                                  onChange={() => toggleSeminarCheck(lead, 'seminarReminder24h')}
                                  className="rounded text-emerald-600"
                                />
                                <span>1. 24h Reminder Call & WhatsApp Pin Sent</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <input
                                  type="checkbox"
                                  checked={!!lead.seminarMorningConfirm}
                                  onChange={() => toggleSeminarCheck(lead, 'seminarMorningConfirm')}
                                  className="rounded text-emerald-600"
                                />
                                <span>2. Seminar Morning Final Confirmation</span>
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 shrink-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${lead.phone}`}
                              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Dial Now</span>
                            </a>

                            <a
                              href={getWhatsAppUrl(lead)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            <button
                              onClick={() => openLeadModal(lead)}
                              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Mark Outcome</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1">
                            {[
                              { label: 'No Answer', status: 'Not Answered', style: 'hover:bg-orange-100 text-orange-800 border-orange-200' },
                              { label: 'Busy', status: 'Busy Right Now', style: 'hover:bg-amber-100 text-amber-800 border-amber-200' },
                              { label: 'Call Later', status: 'Asked to Call Later', style: 'hover:bg-purple-100 text-purple-800 border-purple-200' },
                              { label: 'Follow-Up', status: 'Needs Follow-Up', style: 'hover:bg-cyan-100 text-cyan-800 border-cyan-200' },
                              { label: '✅ Seminar YES', status: 'Said Yes to Join Seminar', style: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
                              { label: '❌ Not Interested', status: 'Not Interested', style: 'hover:bg-rose-100 text-rose-800 border-rose-200' }
                            ].map((q) => (
                              <button
                                key={q.status}
                                onClick={() => openLeadModal(lead, q.status)}
                                className={`px-2 py-1 rounded-lg text-[11px] border bg-white transition ${q.style}`}
                              >
                                {q.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL 1: LEAD OUTCOME & MANDATORY FOLLOW-UP SCHEDULER
          ========================================== */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                  Update Call Outcome & Sync to Master Sheet (Row #{selectedLead.rowNumber})
                </span>
                <h3 className="text-lg font-bold">
                  {selectedLead.name} ({selectedLead.phone})
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Select Call Outcome
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LEAD_STATUSES.filter((s) => s.id !== 'New Leads').map((st) => {
                    const active = modalStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setModalStatus(st.id);
                          setModalError('');
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between gap-1 ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{st.label}</span>
                        <span
                          className={`text-[10px] font-normal ${
                            active ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          Queue: {st.queue}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up', 'Not Answered', 'Said Yes to Join Seminar'].includes(
                modalStatus
              ) && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-950">
                      ⏰ Next Follow-Up Date & Time{' '}
                      {['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up'].includes(modalStatus) && (
                        <span className="text-rose-600">* (MANDATORY)</span>
                      )}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: '+2 Hours', hrs: 2 },
                        { label: 'This Evening', hrs: 5 },
                        { label: 'Tomorrow 11 AM', hrs: 18 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setModalNextFollowUp(getRelativeDateTime(preset.hrs))}
                          className="px-2 py-1 rounded bg-white border border-amber-300 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    value={modalNextFollowUp}
                    onChange={(e) => setModalNextFollowUp(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900"
                  />
                </div>
              )}

              {modalStatus === 'Not Interested' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-rose-900">
                    Why Was This Lead Not Interested? <span className="text-rose-600">* (Mandatory Rule)</span>
                  </label>
                  <select
                    value={modalRejectionReason}
                    onChange={(e) => setModalRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900"
                  >
                    {DISQUALIFICATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Call Summary / Conversation Note{' '}
                  {['Asked to Call Later', 'Busy Right Now', 'Needs Follow-Up'].includes(modalStatus) && (
                    <span className="text-rose-600">* (Required for Follow-Up)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Write what the prospect said..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveLeadDisposition}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
              >
                Save Outcome & Sync to Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: LIVE PIN & AGENT SETTINGS MANAGER
          ========================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">🔐 Manage Representative PINs & Names</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveSettingsAndPins} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['Nusrat', 'Jannat', 'Tanvir', 'Admin'] as const).map((roleKey) => (
                  <div key={roleKey} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {roleKey} PIN
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={pins[roleKey] || ''}
                      onChange={(e) => setPins({ ...pins, [roleKey]: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-center font-mono font-bold text-sm bg-white"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agent 3 Display Name
                </label>
                <input
                  type="text"
                  value={customAgent3Name}
                  onChange={(e) => setCustomAgent3Name(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  💾 Save PINs to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
