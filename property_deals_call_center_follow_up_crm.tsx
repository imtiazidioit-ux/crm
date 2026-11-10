import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
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
// FIREBASE INITIALIZATION
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config
  ? JSON.parse(__firebase_config)
  : { apiKey: "demo-key", authDomain: "demo.firebaseapp.com", projectId: "demo-project" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'propertydealbd-crm-v1';

// ==========================================
// CONSTANTS & BUSINESS FUNNEL CONFIGURATION
// ==========================================
const DEFAULT_AGENTS = [
  { id: 'nusrat', name: 'Nusrat', pin: '1111', role: 'agent', avatarColor: 'bg-emerald-600', campaignDefault: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD' },
  { id: 'jannat', name: 'Jannat', pin: '2222', role: 'agent', avatarColor: 'bg-indigo-600', campaignDefault: 'PD -Jabia-Sniper-$10--NOV8' },
  { id: 'agent3', name: 'Tanvir', pin: '3333', role: 'agent', avatarColor: 'bg-amber-600', campaignDefault: 'PD_DHAKA_EXEC_SECOND_INNINGS_NOV' },
  { id: 'admin', name: 'Imtiaz & Boss (Admin)', pin: '9999', role: 'admin', avatarColor: 'bg-slate-900', campaignDefault: 'ALL' }
];

const LEAD_STATUSES = [
  { id: 'New Lead', label: 'New Lead', queue: 'new', badge: 'bg-blue-100 text-blue-800 border-blue-200', icon: Sparkles },
  { id: 'Not Answered', label: 'Not Answered', queue: 'retry', badge: 'bg-orange-100 text-orange-800 border-orange-200', icon: PhoneMissed },
  { id: 'Busy', label: 'Busy Right Now', queue: 'followup', badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  { id: 'Asked to Call Later', label: 'Asked to Call Later', queue: 'followup', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: Calendar },
  { id: 'Needs Follow-Up', label: 'Needs Follow-Up', queue: 'followup', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: RefreshCw },
  { id: 'Said Yes to Join Seminar', label: 'Said Yes to Join Seminar', queue: 'seminar', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  { id: 'Attended Seminar', label: 'Joined Seminar (Attended)', queue: 'converted', badge: 'bg-teal-100 text-teal-900 border-teal-300', icon: UserCheck },
  { id: 'Converted Partner', label: 'Converted as Paying Partner', queue: 'converted', badge: 'bg-yellow-100 text-yellow-900 border-yellow-400', icon: Award },
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
  'PD_DHAKA_EXEC_SECOND_INNINGS_NOV',
  'PD_UTTARA_BANANI_INVESTOR_RETARGET'
];

// Helper to get relative ISO timestamps for realistic overdue/today follow-ups
const getRelativeDateTime = (hoursOffset) => {
  const d = new Date(Date.now() + hoursOffset * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ==========================================
// INITIAL REALISTIC SEED LEADS (DHAKA COHORT)
// ==========================================
const INITIAL_SEED_LEADS = [
  // NUSRAT LEADS
  {
    id: 'lead-101',
    name: 'Mahmudul Hasan',
    phone: '+8801711234501',
    profession: 'AGM, Garments Buying House (Gulshan)',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'Asked to Call Later',
    attempts: 1,
    nextFollowUp: getRelativeDateTime(-2.5), // OVERDUE!
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'In board meeting at Gulshan-2 office. Asked to call back today afternoon without fail.',
    history: [
      { time: 'Yesterday, 4:15 PM', actor: 'Nusrat', action: 'Marked as Asked to Call Later', note: 'In board meeting at Gulshan-2 office. Asked to call back today afternoon.' }
    ],
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'lead-102',
    name: 'Shafiqur Rahman',
    phone: '+8801819445566',
    profession: 'Senior Banker, Banani Branch',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'Needs Follow-Up',
    attempts: 2,
    nextFollowUp: getRelativeDateTime(1.5), // DUE TODAY
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Sent seminar brochure & Mintu Sir video on WhatsApp. Wants to confirm Friday slot after checking family schedule.',
    history: [
      { time: 'Yesterday, 11:30 AM', actor: 'Nusrat', action: 'Marked as Needs Follow-Up', note: 'Very interested in 2nd innings real estate commission model. Sent WhatsApp details.' }
    ],
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'lead-103',
    name: 'Engr. Kamrul Islam',
    phone: '+8801715998877',
    profession: 'Civil Consultant, Bashundhara',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'Said Yes to Join Seminar',
    attempts: 1,
    nextFollowUp: getRelativeDateTime(18),
    rejectionReason: '',
    seminarReminder24h: true,
    seminarMorningConfirm: false,
    lastNote: 'Confirmed seat for this week\'s seminar. Sent Google Maps pin on WhatsApp.',
    history: [
      { time: 'Yesterday, 2:10 PM', actor: 'Nusrat', action: 'Marked as Said Yes to Join Seminar', note: 'Booked seat for upcoming seminar. Sent location pin.' }
    ],
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'lead-104',
    name: 'Tariqul Alam',
    phone: '+8801911223344',
    profession: 'Pharma Sales Manager, Dhanmondi',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'New Lead',
    attempts: 0,
    nextFollowUp: '',
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Fresh lead from Meta Lead Form.',
    history: [],
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'lead-105',
    name: 'Ashraful Haque',
    phone: '+8801677889900',
    profession: 'IT Project Lead, Mohakhali DOHS',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'Not Answered',
    attempts: 2,
    nextFollowUp: getRelativeDateTime(2),
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Ringing, no response twice. Sent missed-call SMS/WhatsApp.',
    history: [
      { time: 'Today, 10:30 AM', actor: 'Nusrat', action: 'Attempt #2: Not Answered', note: 'No answer on 2nd dial.' },
      { time: 'Yesterday, 5:00 PM', actor: 'Nusrat', action: 'Attempt #1: Not Answered', note: 'Phone rang out.' }
    ],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'lead-106',
    name: 'Zahirul Kaiyum',
    phone: '+8801713456789',
    profession: 'Retired Defense Officer, Baridhara',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'Converted Partner',
    attempts: 3,
    nextFollowUp: '',
    rejectionReason: '',
    seminarReminder24h: true,
    seminarMorningConfirm: true,
    lastNote: 'Attended seminar, met Mintu Sir, and paid Partner Package Fee!',
    history: [
      { time: 'Last Seminar', actor: 'Nusrat', action: 'Converted as Paying Partner', note: 'Completed registration and paid full partner package fee.' }
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'lead-107',
    name: 'Mehedi Hasan',
    phone: '+8801552334455',
    profession: 'Fresh Graduate, Mirpur',
    campaign: 'PD_LEAD_CRORE-BIZ_ABO_GULSHAN-3MI_NOV1_30USD',
    assignedTo: 'nusrat',
    status: 'Not Interested',
    attempts: 1,
    nextFollowUp: '',
    rejectionReason: 'Expecting a Salaried Job Opportunity',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Thought the ad was for a fixed-salary office job.',
    history: [
      { time: 'Yesterday, 3:05 PM', actor: 'Nusrat', action: 'Marked Not Interested', note: 'Reason: Expecting a Salaried Job Opportunity' }
    ],
    createdAt: Date.now() - 86400000 * 2
  },

  // JANNAT LEADS
  {
    id: 'lead-201',
    name: 'Farhana Yasmin',
    phone: '+8801712987654',
    profession: 'HR Director, Uttara Sector 7',
    campaign: 'PD -Jabia-Sniper-$10--NOV8',
    assignedTo: 'jannat',
    status: 'Busy',
    attempts: 1,
    nextFollowUp: getRelativeDateTime(-1.2), // OVERDUE!
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Was driving on Airport Road. Asked to call back in 2 hours.',
    history: [
      { time: 'Today, 11:00 AM', actor: 'Jannat', action: 'Marked as Busy Right Now', note: 'Driving, requested callback after reaching office.' }
    ],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'lead-202',
    name: 'Monirul Islam Chowdhury',
    phone: '+8801811334499',
    profession: 'Importer & Trader, Motijheel',
    campaign: 'PD -Jabia-Sniper-$10--NOV8',
    assignedTo: 'jannat',
    status: 'Said Yes to Join Seminar',
    attempts: 2,
    nextFollowUp: getRelativeDateTime(20),
    rejectionReason: '',
    seminarReminder24h: true,
    seminarMorningConfirm: true,
    lastNote: '100% confirmed for seminar. Bringing a colleague along.',
    history: [
      { time: 'Yesterday, 6:00 PM', actor: 'Jannat', action: 'Marked as Said Yes to Join Seminar', note: 'Confirmed attendance and received venue address.' }
    ],
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'lead-203',
    name: 'Dr. Touhidul Anwar',
    phone: '+8801714009988',
    profession: 'Private Practitioner, Panthapath',
    campaign: 'PD -Jabia-Sniper-$10--NOV8',
    assignedTo: 'jannat',
    status: 'Asked to Call Later',
    attempts: 1,
    nextFollowUp: getRelativeDateTime(3), // Due Today
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'In chamber with patients. Call after 8:00 PM tonight.',
    history: [
      { time: 'Today, 12:15 PM', actor: 'Jannat', action: 'Marked as Asked to Call Later', note: 'In chamber, requested evening call.' }
    ],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'lead-204',
    name: 'Rezaul Karim',
    phone: '+8801914556677',
    profession: 'Telecom Manager, Tejgaon',
    campaign: 'PD -Jabia-Sniper-$10--NOV8',
    assignedTo: 'jannat',
    status: 'New Lead',
    attempts: 0,
    nextFollowUp: '',
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Fresh lead assigned to Jannat.',
    history: [],
    createdAt: Date.now() - 1800000
  },
  {
    id: 'lead-205',
    name: 'Syed Nazmul Huda',
    phone: '+8801716778899',
    profession: 'Supply Chain Head, Banani',
    campaign: 'PD -Jabia-Sniper-$10--NOV8',
    assignedTo: 'jannat',
    status: 'Attended Seminar',
    attempts: 2,
    nextFollowUp: getRelativeDateTime(4),
    rejectionReason: '',
    seminarReminder24h: true,
    seminarMorningConfirm: true,
    lastNote: 'Attended full seminar session. Following up to close Partner Package fee.',
    history: [
      { time: 'Last Seminar', actor: 'Jannat', action: 'Marked as Attended Seminar', note: 'Checked in at seminar registration desk.' }
    ],
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: 'lead-206',
    name: 'Anisur Rahman',
    phone: '+8801718990011',
    profession: 'Corporate Trainer, Niketan',
    campaign: 'PD -Jabia-Sniper-$10--NOV8',
    assignedTo: 'jannat',
    status: 'Converted Partner',
    attempts: 2,
    nextFollowUp: '',
    rejectionReason: '',
    seminarReminder24h: true,
    seminarMorningConfirm: true,
    lastNote: 'Joined seminar & enrolled as Paying Partner immediately.',
    history: [
      { time: 'Last Seminar', actor: 'Jannat', action: 'Converted as Paying Partner', note: 'Paid partner onboarding package.' }
    ],
    createdAt: Date.now() - 86400000 * 5
  },

  // AGENT 3 (TANVIR) LEADS
  {
    id: 'lead-301',
    name: 'Khaled Mahmud',
    phone: '+8801717665544',
    profession: 'Merchandising Manager, Uttara',
    campaign: 'PD_DHAKA_EXEC_SECOND_INNINGS_NOV',
    assignedTo: 'agent3',
    status: 'Needs Follow-Up',
    attempts: 1,
    nextFollowUp: getRelativeDateTime(-3), // OVERDUE!
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Very keen on earning side commission from his corporate network. Need to lock seminar seat today.',
    history: [
      { time: 'Yesterday, 1:40 PM', actor: 'Tanvir', action: 'Marked as Needs Follow-Up', note: 'Has 3 colleagues buying apartments in Dhaka. Wants seminar pass.' }
    ],
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'lead-302',
    name: 'Nasir Uddin Bhuiyan',
    phone: '+8801817223311',
    profession: 'Branch Manager, Insurance Co.',
    campaign: 'PD_DHAKA_EXEC_SECOND_INNINGS_NOV',
    assignedTo: 'agent3',
    status: 'Said Yes to Join Seminar',
    attempts: 1,
    nextFollowUp: getRelativeDateTime(24),
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Said Yes to join this week\'s seminar. Needs 24h reminder call tomorrow.',
    history: [
      { time: 'Today, 10:15 AM', actor: 'Tanvir', action: 'Marked as Said Yes to Join Seminar', note: 'Confirmed seat for seminar.' }
    ],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'lead-303',
    name: 'Hasanul Banna',
    phone: '+8801611445522',
    profession: 'Senior Accountant, Mirpur DOHS',
    campaign: 'PD_DHAKA_EXEC_SECOND_INNINGS_NOV',
    assignedTo: 'agent3',
    status: 'Not Answered',
    attempts: 3,
    nextFollowUp: getRelativeDateTime(12),
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: '3 unanswered attempts across 2 days. 3-Strike threshold reached.',
    history: [
      { time: 'Today, 11:45 AM', actor: 'Tanvir', action: 'Attempt #3: Not Answered', note: 'No answer for 3rd time.' }
    ],
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'lead-304',
    name: 'Sazzad Hossain',
    phone: '+8801719001122',
    profession: 'Marketing Lead, Badda',
    campaign: 'PD_DHAKA_EXEC_SECOND_INNINGS_NOV',
    assignedTo: 'agent3',
    status: 'New Lead',
    attempts: 0,
    nextFollowUp: '',
    rejectionReason: '',
    seminarReminder24h: false,
    seminarMorningConfirm: false,
    lastNote: 'Fresh lead from Second Innings campaign.',
    history: [],
    createdAt: Date.now() - 900000
  }
];

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [currentAccount, setCurrentAccount] = useState(DEFAULT_AGENTS[3]); // Start on Boss/Admin view with 1-click switcher
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Leads state (synced with Firestore + fallback in-memory)
  const [leads, setLeads] = useState(INITIAL_SEED_LEADS);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Agent Workspace Filters
  const [activeAgentTab, setActiveAgentTab] = useState('priority'); // 'priority' | 'new' | 'retry' | 'seminar' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('ALL');

  // Admin Workspace Tabs
  const [activeAdminTab, setActiveAdminTab] = useState('scoreboard'); // 'scoreboard' | 'overdue' | 'campaigns' | 'import' | 'bossreport'

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalNextFollowUp, setModalNextFollowUp] = useState('');
  const [modalRejectionReason, setModalRejectionReason] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalError, setModalError] = useState('');

  // Bulk Import / New Lead Modal
  const [bulkText, setBulkText] = useState('');
  const [bulkCampaign, setBulkCampaign] = useState(CAMPAIGNS_LIST[0]);
  const [bulkAssignMode, setBulkAssignMode] = useState('round-robin'); // 'round-robin' | 'nusrat' | 'jannat' | 'agent3'
  const [importFeedback, setImportFeedback] = useState('');

  // Cloudflare Guide & Settings Modal
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customAgent3Name, setCustomAgent3Name] = useState('Tanvir');
  const [copiedReport, setCopiedReport] = useState(false);

  // ==========================================
  // FIREBASE AUTH & REAL-TIME SYNC
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Running in local preview mode:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const leadsRef = collection(db, 'artifacts', appId, 'public', 'data', 'crm_leads_v1');

    const unsubscribe = onSnapshot(
      leadsRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial Dhaka leads so the portal works out of the box
          for (const item of INITIAL_SEED_LEADS) {
            try {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_leads_v1', item.id), {
                ...item,
                historyJson: JSON.stringify(item.history || [])
              });
            } catch (e) {
              // Ignore write error in restricted mode
            }
          }
          setIsCloudSynced(true);
        } else {
          const loaded = snapshot.docs.map((d) => {
            const data = d.data();
            let parsedHistory = [];
            try {
              parsedHistory = data.historyJson ? JSON.parse(data.historyJson) : (data.history || []);
            } catch (e) {
              parsedHistory = [];
            }
            return { ...data, id: d.id, history: parsedHistory };
          });
          loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setLeads(loaded);
          setIsCloudSynced(true);
        }
      },
      (err) => {
        console.warn('Using local state fallback:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const isOverdue = (dateStr, status) => {
    if (!dateStr) return false;
    if (!['Asked to Call Later', 'Busy', 'Needs Follow-Up', 'Not Answered'].includes(status)) return false;
    const due = new Date(dateStr).getTime();
    return !isNaN(due) && due < Date.now();
  };

  const isDueToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const formatDateTimeReadable = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAgentName = (agentId) => {
    const found = agents.find((a) => a.id === agentId);
    return found ? found.name : agentId;
  };

  const getStatusMeta = (statusId) => {
    return LEAD_STATUSES.find((s) => s.id === statusId) || LEAD_STATUSES[0];
  };

  // ==========================================
  // LEAD UPDATE & FUNNEL RULES ENGINE
  // ==========================================
  const openLeadModal = (lead, presetStatus = null) => {
    setSelectedLead(lead);
    const targetStatus = presetStatus || lead.status;
    setModalStatus(targetStatus);
    setModalNextFollowUp(lead.nextFollowUp || getRelativeDateTime(3));
    setModalRejectionReason(lead.rejectionReason || DISQUALIFICATION_REASONS[0]);
    setModalNote('');
    setModalError('');
  };

  const saveLeadDisposition = async () => {
    if (!selectedLead) return;

    // MANDATORY VALIDATION 1: Follow-Up states require Next Follow-Up Date/Time & Call Note
    if (['Asked to Call Later', 'Busy', 'Needs Follow-Up'].includes(modalStatus)) {
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

    // 3-Strike Auto-Logic for "Not Answered"
    let updatedAttempts = selectedLead.attempts || 0;
    let updatedFollowUp = modalNextFollowUp;

    if (modalStatus === 'Not Answered') {
      updatedAttempts += 1;
      if (!updatedFollowUp) {
        updatedFollowUp = getRelativeDateTime(3); // Auto-schedule +3h retry
      }
    } else if (selectedLead.status === 'New Lead' && modalStatus !== 'New Lead') {
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

    const updatedLead = {
      ...selectedLead,
      status: modalStatus,
      attempts: updatedAttempts,
      nextFollowUp: ['Not Interested', 'Converted Partner', 'New Lead'].includes(modalStatus)
        ? ''
        : updatedFollowUp,
      rejectionReason: modalStatus === 'Not Interested' ? modalRejectionReason : '',
      lastNote: noteSummary,
      history: updatedHistory
    };

    // Optimistic local state update
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setSelectedLead(null);

    // Persist to Firestore
    if (user) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_leads_v1', updatedLead.id), {
          ...updatedLead,
          historyJson: JSON.stringify(updatedHistory)
        });
      } catch (e) {
        console.warn('Firestore update fallback:', e);
      }
    }
  };

  const toggleSeminarCheck = async (lead, field) => {
    const newVal = !lead[field];
    const nowFormatted = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const label =
      field === 'seminarReminder24h'
        ? '24h Reminder Call & WhatsApp Location Pin Sent'
        : 'Seminar Morning Final Attendance Confirmed';

    const newHistoryEntry = {
      time: nowFormatted,
      actor: currentAccount.name,
      action: newVal ? `Checked: ${label}` : `Unchecked: ${label}`,
      note: `Pre-seminar verification checklist updated.`
    };

    const updatedHistory = [newHistoryEntry, ...(lead.history || [])];
    const updatedLead = {
      ...lead,
      [field]: newVal,
      history: updatedHistory
    };

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));

    if (user) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_leads_v1', lead.id), {
          ...updatedLead,
          historyJson: JSON.stringify(updatedHistory)
        });
      } catch (e) {
        console.warn('Checklist sync error:', e);
      }
    }
  };

  // ==========================================
  // BULK LEAD IMPORT & ROUND-ROBIN ASSIGNER
  // ==========================================
  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const callerIds = ['nusrat', 'jannat', 'agent3'];
    const createdLeads = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/,|\t|\|/).map((p) => p.trim());
      const name = parts[0] || `Prospect #${leads.length + idx + 1}`;
      const rawPhone = parts[1] || '+8801700000000';
      const phone = rawPhone.startsWith('+') ? rawPhone : `+88${rawPhone.replace(/^88/, '')}`;
      const profession = parts[2] || 'Working Professional (Dhaka)';

      let assignedAgent = bulkAssignMode;
      if (bulkAssignMode === 'round-robin') {
        assignedAgent = callerIds[idx % callerIds.length];
      }

      const newLead = {
        id: `lead-${Date.now()}-${idx}`,
        name,
        phone,
        profession,
        campaign: bulkCampaign,
        assignedTo: assignedAgent,
        status: 'New Lead',
        attempts: 0,
        nextFollowUp: '',
        rejectionReason: '',
        seminarReminder24h: false,
        seminarMorningConfirm: false,
        lastNote: 'Imported & assigned via Admin Bulk Assigner.',
        history: [
          {
            time: 'Just now',
            actor: 'Admin',
            action: `Assigned to ${getAgentName(assignedAgent)}`,
            note: `Campaign: ${bulkCampaign}`
          }
        ],
        createdAt: Date.now() + idx
      };
      createdLeads.push(newLead);
    });

    setLeads((prev) => [...createdLeads, ...prev]);
    setBulkText('');
    setImportFeedback(`Successfully imported & assigned ${createdLeads.length} leads!`);
    setTimeout(() => setImportFeedback(''), 4000);

    if (user) {
      for (const item of createdLeads) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_leads_v1', item.id), {
            ...item,
            historyJson: JSON.stringify(item.history)
          });
        } catch (e) {
          // Fallback
        }
      }
    }
  };

  // Export CSV for Google Sheets
  const exportToCSV = () => {
    const headers = [
      'Lead ID',
      'Name',
      'Phone',
      'Profession/Area',
      'Campaign',
      'Assigned Agent',
      'Status',
      'Call Attempts',
      'Next Follow-Up',
      '24h Seminar Reminder',
      'Morning Seminar Confirm',
      'Rejection Reason',
      'Last Call Note'
    ];
    const rows = leads.map((l) => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      l.phone,
      `"${(l.profession || '').replace(/"/g, '""')}"`,
      `"${l.campaign}"`,
      getAgentName(l.assignedTo),
      l.status,
      l.attempts,
      l.nextFollowUp || '',
      l.seminarReminder24h ? 'YES' : 'NO',
      l.seminarMorningConfirm ? 'YES' : 'NO',
      `"${(l.rejectionReason || '').replace(/"/g, '""')}"`,
      `"${(l.lastNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PropertyDeals_CallCenter_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // COMPUTED METRICS FOR SCOREBOARD & QUEUES
  // ==========================================
  const calculateStatsForList = (list) => {
    const total = list.length;
    const newLeads = list.filter((l) => l.status === 'New Lead').length;
    const notAnswered = list.filter((l) => l.status === 'Not Answered').length;
    const notInterested = list.filter((l) => l.status === 'Not Interested').length;
    const callLater = list.filter((l) => l.status === 'Asked to Call Later').length;
    const busy = list.filter((l) => l.status === 'Busy').length;
    const needsFollowUp = list.filter((l) => l.status === 'Needs Follow-Up').length;

    const saidYesOnly = list.filter((l) => l.status === 'Said Yes to Join Seminar').length;
    const attendedOnly = list.filter((l) => l.status === 'Attended Seminar').length;
    const convertedPartner = list.filter((l) => l.status === 'Converted Partner').length;

    // Cumulative funnel math: Anyone who attended or converted also said yes to the seminar & was contacted
    const totalSaidYesCumulative = saidYesOnly + attendedOnly + convertedPartner;
    const totalAttendedCumulative = attendedOnly + convertedPartner;

    // Contacted = everyone spoken to on the phone (excludes Untouched New Leads and Not Answered)
    const contacted =
      notInterested + callLater + busy + needsFollowUp + totalSaidYesCumulative;

    // Active Follow-Up Pool
    const activeFollowUpPool = callLater + busy + needsFollowUp;

    // Overdue count
    const overdueCount = list.filter((l) => isOverdue(l.nextFollowUp, l.status)).length;
    const dueTodayCount = list.filter(
      (l) =>
        ['Asked to Call Later', 'Busy', 'Needs Follow-Up'].includes(l.status) &&
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

  const scoreboard = useMemo(() => {
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

  // Filtered Leads for Current Logged-In Agent
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
        ['Asked to Call Later', 'Busy', 'Needs Follow-Up'].includes(l.status)
      );
      // Sort by earliest / most overdue follow-up first
      list.sort((a, b) => {
        const tA = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : Infinity;
        const tB = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : Infinity;
        return tA - tB;
      });
    } else if (activeAgentTab === 'new') {
      list = list.filter((l) => l.status === 'New Lead');
    } else if (activeAgentTab === 'retry') {
      list = list.filter((l) => l.status === 'Not Answered');
    } else if (activeAgentTab === 'seminar') {
      list = list.filter((l) =>
        ['Said Yes to Join Seminar', 'Attended Seminar', 'Converted Partner'].includes(l.status)
      );
    }
    return list;
  }, [agentLeads, activeAgentTab]);

  // Plain-English Boss Report Text
  const plainLanguageBossReport = useMemo(() => {
    const t = scoreboard.total;
    const n = scoreboard.nusrat;
    const j = scoreboard.jannat;
    const a3 = scoreboard.agent3;
    const agent3Name = getAgentName('agent3');

    return `📊 *DAILY CALL CENTER & SEMINAR FOLLOW-UP REPORT*
📅 Date: ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}

*1. OVERALL TEAM SUMMARY (3 AGENTS)*
• Total Leads Assigned: ${t.total}
• Spoke on Phone (Contacted): ${t.contacted} (${t.contactRate}% Contact Rate)
• Did Not Answer Phone: ${t.notAnswered}
• *Said "YES" to Join Seminar:* ${t.totalSaidYesCumulative} People
• *Active Follow-Up Pool:* ${t.activeFollowUpPool} Warm Leads (${t.callLater} Asked to Call Later, ${t.busy} Busy, ${t.needsFollowUp} Need Follow-Up)
• Not Interested: ${t.notInterested}
• *Joined Seminar & Paid Partner Package:* ${t.totalAttendedCumulative} Attended → ${t.convertedPartner} Paying Partners

*2. AGENT-BY-AGENT BREAKDOWN*
👤 *Nusrat:*
• Assigned: ${n.total} | Contacted: ${n.contacted} | Not Answered: ${n.notAnswered}
• Follow-Up Pool: ${n.activeFollowUpPool} (Call Later: ${n.callLater}, Busy: ${n.busy}, Follow-Up: ${n.needsFollowUp})
• Said Yes to Seminar: ${n.totalSaidYesCumulative} | Paying Partners: ${n.convertedPartner}

👤 *Jannat:*
• Assigned: ${j.total} | Contacted: ${j.contacted} | Not Answered: ${j.notAnswered}
• Follow-Up Pool: ${j.activeFollowUpPool} (Call Later: ${j.callLater}, Busy: ${j.busy}, Follow-Up: ${j.needsFollowUp})
• Said Yes to Seminar: ${j.totalSaidYesCumulative} | Paying Partners: ${j.convertedPartner}

👤 *${agent3Name}:*
• Assigned: ${a3.total} | Contacted: ${a3.contacted} | Not Answered: ${a3.notAnswered}
• Follow-Up Pool: ${a3.activeFollowUpPool} (Call Later: ${a3.callLater}, Busy: ${a3.busy}, Follow-Up: ${a3.needsFollowUp})
• Said Yes to Seminar: ${a3.totalSaidYesCumulative} | Paying Partners: ${a3.convertedPartner}

*3. FOLLOW-UP DISCIPLINE CHECK*
• Urgent / Overdue Callbacks Being Cleared Now: ${t.overdueCount} leads
• Pre-Seminar Reminder Calls Completed: ${leads.filter((l) => l.seminarReminder24h).length} guests verified`;
  }, [scoreboard, leads, agents]);

  const copyBossReport = () => {
    navigator.clipboard.writeText(plainLanguageBossReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  // Role switching handler
  const handleRoleSwitch = (account) => {
    setCurrentAccount(account);
    setIsUnlocked(true);
    setPinInput('');
    setPinError('');
  };

  // WhatsApp pre-filled message generator
  const getWhatsAppUrl = (lead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const text = `আসসালামু আলাইকুম ${lead.name} স্যার, আমি Property Deals BD থেকে ${currentAccount.name} বলছি। চাকরি বা ব্যবসার পাশাপাশি রিয়েল এস্টেট রেফারেল কমিশনের মাধ্যমে মাসিক বাড়তি আয়ের ফ্রি সেমিনারে আপনার আসনটি নিশ্চিত করার জন্য মেসেজ দিচ্ছি।`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Update Agent 3 Name
  const saveCustomAgentName = () => {
    if (!customAgent3Name.trim()) return;
    setAgents((prev) =>
      prev.map((a) => (a.id === 'agent3' ? { ...a, name: customAgent3Name.trim() } : a))
    );
    if (currentAccount.id === 'agent3') {
      setCurrentAccount((prev) => ({ ...prev, name: customAgent3Name.trim() }));
    }
    setShowSettingsModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ==========================================
          TOP NAVIGATION & INSTANT ROLE SWITCHER BAR
          ========================================== */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Subdomain Badge */}
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
                  Call Center & Follow-Up CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Cloudflare Subdomain Ready</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Sync Active
                </span>
              </p>
            </div>
          </div>

          {/* 4-Account Switcher (Nusrat, Jannat, Agent 3, Boss/Admin) */}
          <div className="flex items-center flex-wrap gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 px-2 font-medium hidden md:inline">
              Switch Portal Account:
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
                  onClick={() => handleRoleSwitch(acc)}
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
                      title={`${accStats.overdueCount} Overdue Follow-Ups`}
                    >
                      {accStats.overdueCount}!
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Cloudflare Guide & Settings) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5"
              title="Manage Agent Names & PINs"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </button>
            <button
              onClick={() => setShowCloudflareModal(true)}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Free Cloudflare Setup</span>
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
            {/* Admin Banner & Navigation */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                    BOSS & ADMIN VIEW
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Zero Cost Focus • 100% Agent Follow-Up & Seminar Conversion Accountability
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  3-Agent Call Center & Follow-Up Funnel Monitor
                </h2>
                <p className="text-sm text-slate-600">
                  Track every lead assigned to <strong>Nusrat</strong>, <strong>Jannat</strong>, and{' '}
                  <strong>{getAgentName('agent3')}</strong> across your 8 call outcomes and overdue callbacks.
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
                  onClick={() => setActiveAdminTab('import')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign New Leads</span>
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
                <span className="text-xs font-medium text-slate-500">Total Leads Assigned</span>
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
                <span className="text-xs font-bold text-emerald-800">Said "Yes" to Seminar</span>
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
                { id: 'import', label: '📥 Bulk Assign Leads to Agents' },
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
                      Tracks the exact 8 call statuses requested—Click any agent button at the top to jump into their personal calling queue.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Updated live across all 3 agent accounts
                  </span>
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
                          1. Total Leads Assigned
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
                        <td className="py-3 px-4 text-blue-700 font-medium">{scoreboard.nusrat.newLeads}</td>
                        <td className="py-3 px-4 text-blue-700 font-medium">{scoreboard.jannat.newLeads}</td>
                        <td className="py-3 px-4 text-blue-700 font-medium">{scoreboard.agent3.newLeads}</td>
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
                          {scoreboard.nusrat.contacted}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({scoreboard.nusrat.contactRate}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {scoreboard.jannat.contacted}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({scoreboard.jannat.contactRate}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {scoreboard.agent3.contacted}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({scoreboard.agent3.contactRate}%)
                          </span>
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
                          {scoreboard.nusrat.overdueCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-[11px] rounded-full bg-rose-600 text-white">
                              {scoreboard.nusrat.overdueCount} Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-950">
                          {scoreboard.jannat.activeFollowUpPool}
                          {scoreboard.jannat.overdueCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-[11px] rounded-full bg-rose-600 text-white">
                              {scoreboard.jannat.overdueCount} Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-950">
                          {scoreboard.agent3.activeFollowUpPool}
                          {scoreboard.agent3.overdueCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-[11px] rounded-full bg-rose-600 text-white">
                              {scoreboard.agent3.overdueCount} Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-amber-950 bg-amber-100/70">
                          {scoreboard.total.activeFollowUpPool} ({scoreboard.total.overdueCount} Overdue)
                        </td>
                      </tr>

                      <tr className="bg-emerald-50/70">
                        <td className="py-3.5 px-5 font-extrabold text-emerald-950">
                          5. Said "YES" to Join Seminar (Cumulative)
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          {scoreboard.nusrat.totalSaidYesCumulative}{' '}
                          <span className="text-xs font-normal text-emerald-700">
                            ({scoreboard.nusrat.yesRateFromContacted}% of contacted)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          {scoreboard.jannat.totalSaidYesCumulative}{' '}
                          <span className="text-xs font-normal text-emerald-700">
                            ({scoreboard.jannat.yesRateFromContacted}% of contacted)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          {scoreboard.agent3.totalSaidYesCumulative}{' '}
                          <span className="text-xs font-normal text-emerald-700">
                            ({scoreboard.agent3.yesRateFromContacted}% of contacted)
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-emerald-900 bg-emerald-100/80">
                          {scoreboard.total.totalSaidYesCumulative} ({scoreboard.total.yesRateFromContacted}%)
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-bold text-teal-900">
                          6. Actually Walked into Seminar (Attended)
                        </td>
                        <td className="py-3 px-4 font-bold text-teal-800">{scoreboard.nusrat.totalAttendedCumulative}</td>
                        <td className="py-3 px-4 font-bold text-teal-800">{scoreboard.jannat.totalAttendedCumulative}</td>
                        <td className="py-3 px-4 font-bold text-teal-800">{scoreboard.agent3.totalAttendedCumulative}</td>
                        <td className="py-3 px-5 font-extrabold text-teal-900 bg-slate-50">{scoreboard.total.totalAttendedCumulative}</td>
                      </tr>

                      <tr className="bg-yellow-50/90">
                        <td className="py-3.5 px-5 font-extrabold text-yellow-950">
                          7. Converted as Paying Partner (Paid Package Fee)
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-rose-600" />
                      <span>Active & Overdue Follow-Up Monitor Across All 3 Agents</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Every lead marked <em>Asked to Call Later</em>, <em>Busy</em>, or <em>Needs Follow-Up</em> is tracked here until the agent calls them back and moves them to Seminar Yes or Not Interested.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {leads
                    .filter((l) =>
                      ['Asked to Call Later', 'Busy', 'Needs Follow-Up'].includes(l.status)
                    )
                    .sort((a, b) => {
                      const tA = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : Infinity;
                      const tB = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : Infinity;
                      return tA - tB;
                    })
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
                              {overdue && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                                  OVERDUE CALLBACK!
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">
                              <strong>Last Agent Note:</strong> {lead.lastNote}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Campaign: <span className="font-mono">{lead.campaign}</span> • Scheduled Callback:{' '}
                              <strong className={overdue ? 'text-rose-700' : 'text-slate-800'}>
                                {formatDateTimeReadable(lead.nextFollowUp)}
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openLeadModal(lead)}
                              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                            >
                              Update / Inspect Log
                            </button>
                          </div>
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
                    Which Campaign Is Producing Seminar Guests & Paying Partners?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Shows your boss exactly which campaign leads are saying "Yes" to join the seminar and converting into paying partners.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-xs uppercase border-b border-slate-200">
                        <th className="py-3.5 px-5 font-bold">Campaign Name</th>
                        <th className="py-3.5 px-4 font-bold">Total Leads</th>
                        <th className="py-3.5 px-4 font-bold">Contacted</th>
                        <th className="py-3.5 px-4 font-bold text-amber-800">In Follow-Up Pool</th>
                        <th className="py-3.5 px-4 font-bold text-emerald-800">Said "Yes" to Seminar</th>
                        <th className="py-3.5 px-4 font-bold text-teal-800">Joined Seminar</th>
                        <th className="py-3.5 px-4 font-bold text-yellow-900">Paying Partners</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {CAMPAIGNS_LIST.map((camp) => {
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
                              {st.totalSaidYesCumulative} ({st.yesRateFromContacted}%)
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

            {/* TAB 4: BULK LEAD ASSIGNER */}
            {activeAdminTab === 'import' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bulk Assign Campaign Leads to Nusrat, Jannat, or {getAgentName('agent3')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste rows directly from your Meta Lead CSV or Google Sheet (Format: <code>Name, Phone, Area/Profession</code> — one lead per line).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Select Source Campaign
                    </label>
                    <select
                      value={bulkCampaign}
                      onChange={(e) => setBulkCampaign(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      {CAMPAIGNS_LIST.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Assign To Call Center Agent
                    </label>
                    <select
                      value={bulkAssignMode}
                      onChange={(e) => setBulkAssignMode(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      <option value="round-robin">
                        ⚡ Auto-Split Equally (Round-Robin across all 3 Agents)
                      </option>
                      <option value="nusrat">🎧 Assign All to Agent 1: Nusrat</option>
                      <option value="jannat">🎧 Assign All to Agent 2: Jannat</option>
                      <option value="agent3">🎧 Assign All to Agent 3: {getAgentName('agent3')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Paste Leads (Name, Phone, Profession/Location)
                  </label>
                  <textarea
                    rows={5}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`Example:\nTanvir Ahmed, +8801711002233, Banker Gulshan\nRafiqul Islam, 01819556677, Garments Director Uttara\nSyed Humayun, 01911443322, Business Owner Dhanmondi`}
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-sm font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  {importFeedback ? (
                    <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {importFeedback}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Leads will immediately appear in the assigned agent&apos;s &quot;New Leads&quot; tab.
                    </span>
                  )}

                  <button
                    onClick={handleBulkImport}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import & Assign Leads Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: PLAIN-ENGLISH BOSS REPORT GENERATOR */}
            {activeAdminTab === 'bossreport' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      1-Click Plain-Language Boss Report (WhatsApp Ready)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Zero technical jargon. Shows your boss exact call counts, follow-up pools, seminar confirmations, and partner conversions by agent.
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

                <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
                  {plainLanguageBossReport}
                </pre>
              </div>
            )}
          </div>
        ) : (
          /* ==========================================
             CALL CENTER AGENT WORKSPACE VIEW (NUSRAT / JANNAT / AGENT 3)
             ========================================== */
          <div className="space-y-6">
            {/* Agent Welcome Header & Personal KPI Strip */}
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
                      Active Shift
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rule: Always clear your <strong>Overdue & Due Today Follow-Ups</strong> first before dialing untouched leads.
                  </p>
                </div>
              </div>

              {/* Agent Personal KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-700 block">Due / Overdue</span>
                  <span className="text-lg font-extrabold text-rose-700">
                    {agentStats.dueTodayCount}{' '}
                    <span className="text-[11px] font-normal">({agentStats.overdueCount} late)</span>
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
                    id: 'priority',
                    label: '🔥 1. Priority Follow-Up Queue',
                    count: agentStats.activeFollowUpPool,
                    badgeColor: 'bg-rose-600 text-white'
                  },
                  {
                    id: 'new',
                    label: '🆕 2. New Leads (To Call)',
                    count: agentStats.newLeads,
                    badgeColor: 'bg-blue-600 text-white'
                  },
                  {
                    id: 'retry',
                    label: '🔄 3. Not Answered (3-Strike Retry)',
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

              {/* Search Box */}
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
                    No leads waiting in this bucket right now. Switch to another funnel queue tab above to continue calling.
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
                        {/* Left Column: Lead Identity & Status */}
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

                            {lead.attempts > 0 && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  lead.status === 'Not Answered' && lead.attempts >= 3
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {lead.status === 'Not Answered'
                                  ? `Retry Strike ${lead.attempts}/3`
                                  : `${lead.attempts} Call(s)`}
                              </span>
                            )}

                            {overdue && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                OVERDUE: {formatDateTimeReadable(lead.nextFollowUp)}
                              </span>
                            )}

                            {!overdue && dueToday && lead.nextFollowUp && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
                                Due Today: {formatDateTimeReadable(lead.nextFollowUp)}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{lead.profession}</span> •{' '}
                            Campaign: <span className="font-mono text-[11px]">{lead.campaign}</span>
                          </p>

                          {/* Last Call Note & Next Action Box */}
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

                          {/* Pre-Seminar Verification Checklist (Only shown if Said Yes / Attended) */}
                          {['Said Yes to Join Seminar', 'Attended Seminar', 'Converted Partner'].includes(
                            lead.status
                          ) && (
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold text-emerald-900">
                                Seminar Show-Up Protection Checklist:
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

                        {/* Right Column: 1-Click Call, WhatsApp & Fast Status Marking */}
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

                          {/* Quick 1-Click Outcome Pills */}
                          <div className="flex flex-wrap items-center gap-1">
                            {[
                              { label: 'No Answer', status: 'Not Answered', style: 'hover:bg-orange-100 text-orange-800 border-orange-200' },
                              { label: 'Busy', status: 'Busy', style: 'hover:bg-amber-100 text-amber-800 border-amber-200' },
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
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                  Update Call Outcome & Follow-Up Funnel
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
              {/* Step 1: Select Exact Call Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Select Call Outcome (The 8 Exact Funnel Parameters)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LEAD_STATUSES.filter((s) => s.id !== 'New Lead').map((st) => {
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

              {/* Dynamic Mandatory Fields Based on Status */}
              {['Asked to Call Later', 'Busy', 'Needs Follow-Up', 'Not Answered', 'Said Yes to Join Seminar'].includes(
                modalStatus
              ) && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-950">
                      ⏰ Next Follow-Up / Reminder Date & Time{' '}
                      {['Asked to Call Later', 'Busy', 'Needs Follow-Up'].includes(modalStatus) && (
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

              {/* Mandatory Disqualification Dropdown if "Not Interested" */}
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

              {/* Call Notes Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Call Summary / Conversation Note{' '}
                  {['Asked to Call Later', 'Busy', 'Needs Follow-Up'].includes(modalStatus) && (
                    <span className="text-rose-600">* (Required for Follow-Up)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Write what the prospect said (e.g., 'In office meeting, asked to call at 7 PM', or 'Confirmed Friday seminar, wants WhatsApp location')..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Call Touchpoint History Log */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Lead Audit & Touchpoint History</span>
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {(selectedLead.history || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No previous call logs yet.</p>
                  ) : (
                    selectedLead.history.map((h, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{h.actor}</span> —{' '}
                          <span className="font-semibold text-indigo-700">{h.action}</span>
                          <p className="text-slate-600 mt-0.5">{h.note}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{h.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
                Save Call Outcome & Update Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: FREE CLOUDFLARE SUBDOMAIN DEPLOYMENT GUIDE
          ========================================== */}
      {showCloudflareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  How to Host This Portal on Your Free Cloudflare Subdomain ($0/Month)
                </h3>
              </div>
              <button
                onClick={() => setShowCloudflareModal(false)}
                className="text-slate-300 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                ✅ <strong>100% Free Forever:</strong> Cloudflare Pages gives you unlimited bandwidth, free SSL, and instant custom subdomains (like <code>crm.propertydealbd.com</code>) at $0 cost.
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900">
                    Step 1: Push This Single-File React App to a Free GitHub Repo (or Direct Upload)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    In your Cloudflare Dashboard, go to <strong>Workers & Pages → Create Application → Pages → Upload Assets</strong> (or connect a free GitHub repository containing this React file).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900">
                    Step 2: Connect Your Subdomain (<code>crm.propertydealbd.com</code>)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Inside your Cloudflare Pages project, click <strong>Custom Domains → Set up a custom domain</strong> and type <code>crm.propertydealbd.com</code>. Cloudflare automatically creates the DNS CNAME record and issues a free SSL certificate in 30 seconds.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900">
                    Step 3: Share Logins with Nusrat, Jannat, {getAgentName('agent3')} & Your Boss
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    All 3 agents can open <code>crm.propertydealbd.com</code> on their phone or office PC. Every status change, callback time, and note updates in real time on your Boss Dashboard, and you can export to your Google Sheet with 1 click anytime.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowCloudflareModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: CUSTOMIZE 3RD AGENT NAME & SETTINGS
          ========================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Call Center Agent Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agent 1 Name (Fixed)
                </label>
                <input
                  type="text"
                  disabled
                  value="Nusrat (PIN: 1111)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agent 2 Name (Fixed)
                </label>
                <input
                  type="text"
                  disabled
                  value="Jannat (PIN: 2222)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agent 3 Name (Editable — PIN: 3333)
                </label>
                <input
                  type="text"
                  value={customAgent3Name}
                  onChange={(e) => setCustomAgent3Name(e.target.value)}
                  placeholder="Enter 3rd Agent Name"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomAgentName}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Save Agent Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}