'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  DEMO_ADMIN_USERS,
  DEMO_ADMIN_PLANS,
  formatINR,
  formatRelativeTime,
} from '@/components/dashboard/DemoPreviewData';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Crown,
  Users,
  Building2,
  Layers,
  BadgeIndianRupee,
  Search,
  Plus,
  Settings2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trash2,
  Edit3,
  ShieldCheck,
  MessageSquare,
  Megaphone,
  Workflow,
  RefreshCw,
} from 'lucide-react';

function AdminConsoleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'users';
  const { impersonateUser } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState(DEMO_ADMIN_USERS);
  const [plans, setPlans] = useState(DEMO_ADMIN_PLANS);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Filters for Users & Workspaces
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [roleFilter, setRoleFilter] = useState('all'); // all | superadmin | owner | admin | agent
  const [planFilter, setPlanFilter] = useState('all'); // all | free | starter | growth | pro | business

  // Filters for All Subscriptions
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subPlanFilter, setSubPlanFilter] = useState('all');

  // Create / Edit User Settings Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uBusinessName, setUBusinessName] = useState('');
  const [uIndustry, setUIndustry] = useState('Apparel & Ethnic Retail');
  const [uRole, setURole] = useState('owner');
  const [uPlanCode, setUPlanCode] = useState('growth');
  const [uSubStatus, setUSubStatus] = useState('active');
  const [uBillingCycle, setUBillingCycle] = useState('monthly');
  const [uIsActive, setUIsActive] = useState(true);
  const [uIsSuperAdmin, setUIsSuperAdmin] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Create / Edit Plan Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPriceMonthly, setPPriceMonthly] = useState('499');
  const [pPriceYearly, setPPriceYearly] = useState('4990');
  const [pContactsLimit, setPContactsLimit] = useState('5000');
  const [pTeamLimit, setPTeamLimit] = useState('5');
  const [pMessagesLimit, setPMessagesLimit] = useState('10000');
  const [pAiLimit, setPAiLimit] = useState('500');
  const [pWorkflowsLimit, setPWorkflowsLimit] = useState('10');
  const [pFeaturesText, setPFeaturesText] = useState('');
  const [pIsPublic, setPIsPublic] = useState(true);
  const [pSortOrder, setPSortOrder] = useState('3');
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['overview', 'users', 'visit', 'plans', 'subscriptions', 'settings'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const selectAdminTab = (tabKey) => {
    setActiveTab(tabKey);
    router.replace(`/dashboard/admin?tab=${tabKey}`, { scroll: false });
  };

  const showNotice = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3600);
  };

  const buildSubscriptionsFromUsers = useCallback((userList) => {
    const seenBiz = new Set();
    const list = [];
    for (const u of userList) {
      if (!u.business || seenBiz.has(u.business.id)) continue;
      seenBiz.add(u.business.id);
      list.push({
        id: u.subscription?.id || u.business.id,
        businessId: u.business.id,
        businessName: u.business.name,
        industry: u.business.industry || 'SMB',
        isDemo: u.business.isDemo,
        ownerName: u.name,
        ownerEmail: u.email,
        ownerUserId: u.id,
        status: u.subscription?.status || 'active',
        billingCycle: u.subscription?.billingCycle || 'monthly',
        currentPeriodEnd: u.subscription?.currentPeriodEnd || '2026-12-01T00:00:00.000Z',
        plan: u.subscription?.plan || { id: 1, code: 'free', name: 'Free', priceMonthly: '0.00' },
      });
    }
    return list;
  }, []);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, plansRes, subsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/plans'),
        api.get('/admin/subscriptions'),
      ]);
      const uList = usersRes?.data || usersRes;
      const pList = plansRes?.data || plansRes;
      const sList = subsRes?.data || subsRes;

      if (Array.isArray(uList) && uList.length) setUsers(uList);
      if (Array.isArray(pList) && pList.length) setPlans(pList);
      if (Array.isArray(sList) && sList.length) {
        setSubscriptions(sList);
      } else if (Array.isArray(uList)) {
        setSubscriptions(buildSubscriptionsFromUsers(uList));
      }
    } catch {
      setSubscriptions((prev) => (prev.length ? prev : buildSubscriptionsFromUsers(DEMO_ADMIN_USERS)));
    } finally {
      setLoading(false);
    }
  }, [buildSubscriptionsFromUsers]);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  // Derived filter counts for Users
  const userCounts = useMemo(() => {
    const counts = {
      all: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      superAdmins: users.filter((u) => u.isSuperAdmin).length,
      owners: users.filter((u) => u.role === 'owner').length,
      admins: users.filter((u) => u.role === 'admin').length,
      agents: users.filter((u) => u.role === 'agent').length,
      totalContacts: users.reduce((acc, u) => acc + (u.counts?.contacts || 0), 0),
      totalConversations: users.reduce((acc, u) => acc + (u.counts?.conversations || 0), 0),
    };
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'inactive' && u.isActive) return false;
      if (roleFilter === 'superadmin' && !u.isSuperAdmin) return false;
      if (roleFilter !== 'all' && roleFilter !== 'superadmin' && u.role !== roleFilter) return false;
      const uPlanCode = u.subscription?.plan?.code || 'free';
      if (planFilter !== 'all' && uPlanCode !== planFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchBiz = u.business?.name?.toLowerCase().includes(q);
        const matchInd = u.business?.industry?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchBiz && !matchInd) return false;
      }
      return true;
    });
  }, [users, statusFilter, roleFilter, planFilter, searchQuery]);

  const filteredSubscriptions = useMemo(() => {
    const base = subscriptions.length ? subscriptions : buildSubscriptionsFromUsers(users);
    return base.filter((s) => {
      if (subStatusFilter !== 'all' && s.status !== subStatusFilter) return false;
      if (subPlanFilter !== 'all' && s.plan?.code !== subPlanFilter) return false;
      return true;
    });
  }, [subscriptions, users, subStatusFilter, subPlanFilter, buildSubscriptionsFromUsers]);

  const estimatedMrr = useMemo(() => {
    const base = subscriptions.length ? subscriptions : buildSubscriptionsFromUsers(users);
    return base.reduce((sum, s) => {
      if (s.status !== 'active') return sum;
      const p = plans.find((pl) => pl.code === s.plan?.code) || s.plan;
      const monthly = Number(p?.priceMonthly || 0);
      return sum + monthly;
    }, 0);
  }, [subscriptions, users, plans, buildSubscriptionsFromUsers]);

  // Impersonate / Visit any user dashboard
  const handleVisitUserDashboard = async (targetUser) => {
    try {
      await impersonateUser({
        userId: targetUser.id,
        businessId: targetUser.business?.id,
        fallbackTarget: targetUser,
      });
      router.push('/dashboard');
    } catch (err) {
      showNotice(err?.message || 'Unable to switch into user dashboard');
    }
  };

  // Open Create User Modal
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUName('');
    setUEmail('');
    setUPassword('');
    setUBusinessName('');
    setUIndustry('Apparel & Ethnic Retail');
    setURole('owner');
    setUPlanCode('growth');
    setUSubStatus('active');
    setUBillingCycle('monthly');
    setUIsActive(true);
    setUIsSuperAdmin(false);
    setUserModalOpen(true);
  };

  // Open Edit User Settings Modal
  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUName(u.name || '');
    setUEmail(u.email || '');
    setUPassword('');
    setUBusinessName(u.business?.name || '');
    setUIndustry(u.business?.industry || 'Retail & SMB');
    setURole(u.role || 'owner');
    setUPlanCode(u.subscription?.plan?.code || 'free');
    setUSubStatus(u.subscription?.status || 'active');
    setUBillingCycle(u.subscription?.billingCycle || 'monthly');
    setUIsActive(Boolean(u.isActive));
    setUIsSuperAdmin(Boolean(u.isSuperAdmin));
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!uName.trim() || !uEmail.trim()) return;
    setSavingUser(true);

    const selectedPlanObj =
      plans.find((p) => p.code === uPlanCode) || { id: 1, code: uPlanCode, name: uPlanCode.toUpperCase() };

    try {
      if (editingUser) {
        await api.patch(`/admin/users/${editingUser.id}`, {
          name: uName.trim(),
          email: uEmail.trim(),
          password: uPassword.trim() ? uPassword.trim() : undefined,
          isActive: uIsActive,
          isSuperAdmin: uIsSuperAdmin,
          role: uRole,
          businessName: uBusinessName.trim() || undefined,
          industry: uIndustry.trim() || undefined,
          planCode: uPlanCode,
          subscriptionStatus: uSubStatus,
          billingCycle: uBillingCycle,
        });
      } else {
        await api.post('/admin/users', {
          name: uName.trim(),
          email: uEmail.trim(),
          password: uPassword.trim() || 'Welcome@123',
          businessName: uBusinessName.trim() || `${uName.trim()}'s Workspace`,
          industry: uIndustry.trim() || 'Retail & SMB',
          role: uRole,
          planCode: uPlanCode,
          isActive: uIsActive,
          isSuperAdmin: uIsSuperAdmin,
        });
      }
      await loadAllAdminData();
      setUserModalOpen(false);
      showNotice(editingUser ? `Updated settings for ${uName}` : `Created new user & workspace for ${uName}`);
    } catch {
      // Fallback update in local state so preview mode works seamlessly
      if (editingUser) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === editingUser.id
              ? {
                  ...item,
                  name: uName.trim(),
                  email: uEmail.trim(),
                  isActive: uIsActive,
                  isSuperAdmin: uIsSuperAdmin,
                  role: uRole,
                  business: item.business
                    ? {
                        ...item.business,
                        name: uBusinessName.trim() || item.business.name,
                        industry: uIndustry.trim() || item.business.industry,
                      }
                    : null,
                  subscription: {
                    ...(item.subscription || { id: Date.now() }),
                    status: uSubStatus,
                    billingCycle: uBillingCycle,
                    plan: {
                      id: selectedPlanObj.id,
                      code: selectedPlanObj.code,
                      name: selectedPlanObj.name,
                      priceMonthly: selectedPlanObj.priceMonthly,
                    },
                  },
                }
              : item
          )
        );
      } else {
        const newId = Date.now();
        setUsers((prev) => [
          {
            id: newId,
            name: uName.trim(),
            email: uEmail.trim().toLowerCase(),
            isSuperAdmin: uIsSuperAdmin,
            isActive: uIsActive,
            role: uRole,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            business: {
              id: newId + 1,
              name: uBusinessName.trim() || `${uName.trim()}'s Business`,
              slug: 'new-business',
              industry: uIndustry.trim() || 'Retail & SMB',
              isDemo: false,
            },
            subscription: {
              id: newId + 2,
              status: uSubStatus,
              billingCycle: uBillingCycle,
              currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
              plan: {
                id: selectedPlanObj.id,
                code: selectedPlanObj.code,
                name: selectedPlanObj.name,
                priceMonthly: selectedPlanObj.priceMonthly,
              },
            },
            counts: { contacts: 0, conversations: 0, campaigns: 0, workflows: 0 },
          },
          ...prev,
        ]);
      }
      setUserModalOpen(false);
      showNotice(editingUser ? `Saved user settings for ${uName}` : `Created new user & workspace for ${uName}`);
    } finally {
      setSavingUser(false);
    }
  };

  const handleQuickToggleUserActive = async (u) => {
    const nextActive = !u.isActive;
    try {
      await api.patch(`/admin/users/${u.id}`, { isActive: nextActive });
    } catch {
      // fallback
    }
    setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isActive: nextActive } : item)));
    showNotice(`${u.name} is now ${nextActive ? 'Active' : 'Suspended'}`);
  };

  // Open Create / Edit Plan Modal
  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPCode('');
    setPName('');
    setPDescription('');
    setPPriceMonthly('799');
    setPPriceYearly('7990');
    setPContactsLimit('15000');
    setPTeamLimit('8');
    setPMessagesLimit('25000');
    setPAiLimit('1000');
    setPWorkflowsLimit('25');
    setPFeaturesText('Up to 15,000 contacts\n8 team members\n1,000 AI requests/month\n25 automation workflows');
    setPIsPublic(true);
    setPSortOrder(String(plans.length + 1));
    setPlanModalOpen(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPCode(plan.code);
    setPName(plan.name);
    setPDescription(plan.description || '');
    setPPriceMonthly(plan.priceMonthly !== null && plan.priceMonthly !== undefined ? String(Number(plan.priceMonthly)) : '');
    setPPriceYearly(plan.priceYearly !== null && plan.priceYearly !== undefined ? String(Number(plan.priceYearly)) : '');
    setPContactsLimit(String(plan.limits?.contacts ?? 1000));
    setPTeamLimit(String(plan.limits?.teamMembers ?? 2));
    setPMessagesLimit(String(plan.limits?.messagesPerMonth ?? 5000));
    setPAiLimit(String(plan.limits?.aiRequestsPerMonth ?? 100));
    setPWorkflowsLimit(String(plan.limits?.workflows ?? 5));
    setPFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setPIsPublic(Boolean(plan.isPublic));
    setPSortOrder(String(plan.sortOrder ?? 1));
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!pName.trim() || (!editingPlan && !pCode.trim())) return;
    setSavingPlan(true);

    const payload = {
      code: (editingPlan ? editingPlan.code : pCode).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: pName.trim(),
      description: pDescription.trim() || null,
      priceMonthly: pPriceMonthly.trim() === '' ? null : Number(pPriceMonthly),
      priceYearly: pPriceYearly.trim() === '' ? null : Number(pPriceYearly),
      currency: 'INR',
      limits: {
        contacts: Number(pContactsLimit || 0),
        teamMembers: Number(pTeamLimit || 1),
        messagesPerMonth: Number(pMessagesLimit || 0),
        aiRequestsPerMonth: Number(pAiLimit || 0),
        workflows: Number(pWorkflowsLimit || 0),
      },
      features: pFeaturesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isPublic: pIsPublic,
      sortOrder: Number(pSortOrder || 1),
    };

    try {
      if (editingPlan) {
        await api.patch(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      await loadAllAdminData();
      setPlanModalOpen(false);
      showNotice(editingPlan ? `Updated "${payload.name}" plan` : `Created new "${payload.name}" subscription plan`);
    } catch {
      if (editingPlan) {
        setPlans((prev) =>
          prev.map((pl) =>
            pl.id === editingPlan.id
              ? {
                  ...pl,
                  ...payload,
                  priceMonthly: payload.priceMonthly !== null ? payload.priceMonthly.toFixed(2) : null,
                  priceYearly: payload.priceYearly !== null ? payload.priceYearly.toFixed(2) : null,
                }
              : pl
          )
        );
      } else {
        setPlans((prev) => [
          ...prev,
          {
            id: Date.now(),
            ...payload,
            priceMonthly: payload.priceMonthly !== null ? payload.priceMonthly.toFixed(2) : null,
            priceYearly: payload.priceYearly !== null ? payload.priceYearly.toFixed(2) : null,
            subscriberCount: 0,
          },
        ]);
      }
      setPlanModalOpen(false);
      showNotice(editingPlan ? `Updated "${payload.name}" plan` : `Created new "${payload.name}" subscription plan`);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!deletePlanTarget) return;
    try {
      await api.del(`/admin/plans/${deletePlanTarget.id}`);
    } catch {
      // fallback
    }
    setPlans((prev) => prev.filter((p) => p.id !== deletePlanTarget.id));
    showNotice(`Deleted plan "${deletePlanTarget.name}"`);
    setDeletePlanTarget(null);
  };

  const handleUpdateSubscriptionInline = async (sub, patch) => {
    const targetPlan = patch.planCode ? plans.find((p) => p.code === patch.planCode) : sub.plan;
    try {
      await api.patch(`/admin/subscriptions/${sub.id}`, patch);
      await loadAllAdminData();
    } catch {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                status: patch.status || s.status,
                billingCycle: patch.billingCycle || s.billingCycle,
                plan: targetPlan
                  ? {
                      id: targetPlan.id,
                      code: targetPlan.code,
                      name: targetPlan.name,
                      priceMonthly: targetPlan.priceMonthly,
                    }
                  : s.plan,
              }
            : s
        )
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.business?.id === sub.businessId
            ? {
                ...u,
                subscription: {
                  ...(u.subscription || {}),
                  status: patch.status || u.subscription?.status || 'active',
                  billingCycle: patch.billingCycle || u.subscription?.billingCycle || 'monthly',
                  plan: targetPlan
                    ? {
                        id: targetPlan.id,
                        code: targetPlan.code,
                        name: targetPlan.name,
                        priceMonthly: targetPlan.priceMonthly,
                      }
                    : u.subscription?.plan,
                },
              }
            : u
        )
      );
    }
    showNotice(`Updated subscription for ${sub.businessName}`);
  };

  return (
    <>
      {/* Top Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="icon-tile tile-purple" style={{ width: 42, height: 42 }}>
              <Crown size={22} />
            </span>
            <div>
              <h1>Super Admin Control Center</h1>
              <p>
                Manage all platform users, inspect any user’s live dashboard in one click, configure user settings, and
                manage subscription plans &amp; billing lists.
              </p>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={loadAllAdminData}>
            <RefreshCw size={15} /> Refresh Data
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={openCreatePlanModal}>
            <Layers size={15} /> + Create Subscription Plan
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateUserModal}>
            <Plus size={16} /> + Add User &amp; Workspace
          </button>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Platform KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Platform Users</span>
            <span className="icon-tile tile-green" style={{ width: 38, height: 38 }}>
              <Users size={19} />
            </span>
          </div>
          <div className="kpi-card-value">{userCounts.all}</div>
          <div className="kpi-card-sub">
            <span className="badge badge-green">{userCounts.active} Active</span>
            <span>• {userCounts.superAdmins} Super Admins</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Active Business Workspaces</span>
            <span className="icon-tile tile-blue" style={{ width: 38, height: 38 }}>
              <Building2 size={19} />
            </span>
          </div>
          <div className="kpi-card-value">
            {new Set(users.map((u) => u.business?.id).filter(Boolean)).size}
          </div>
          <div className="kpi-card-sub">Multi-tenant isolated workspaces</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Subscription Plans</span>
            <span className="icon-tile tile-purple" style={{ width: 38, height: 38 }}>
              <Layers size={19} />
            </span>
          </div>
          <div className="kpi-card-value">{plans.length}</div>
          <div className="kpi-card-sub">
            {plans.filter((p) => p.isPublic).length} public tiers configured
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Est. Monthly Recurring (MRR)</span>
            <span className="icon-tile tile-yellow" style={{ width: 38, height: 38 }}>
              <BadgeIndianRupee size={19} />
            </span>
          </div>
          <div className="kpi-card-value">{formatINR(estimatedMrr)}</div>
          <div className="kpi-card-sub">Across active workspace subscriptions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Contacts &amp; Chats</span>
            <span className="icon-tile tile-coral" style={{ width: 38, height: 38 }}>
              <MessageSquare size={19} />
            </span>
          </div>
          <div className="kpi-card-value">{userCounts.totalContacts}</div>
          <div className="kpi-card-sub">{userCounts.totalConversations} total conversations</div>
        </div>
      </div>

      {/* Main Section Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => selectAdminTab('overview')}
          >
            <Building2 size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            Platform Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => selectAdminTab('users')}
          >
            <Users size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            Users &amp; Workspaces ({userCounts.all})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'visit'}
            className={`tab-btn ${activeTab === 'visit' ? 'active' : ''}`}
            onClick={() => selectAdminTab('visit')}
          >
            <Eye size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            Visit User Dashboard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'plans'}
            className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => selectAdminTab('plans')}
          >
            <Layers size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            Subscription Plans ({plans.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'subscriptions'}
            className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => selectAdminTab('subscriptions')}
          >
            <BadgeIndianRupee size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            All Subscriptions ({filteredSubscriptions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => selectAdminTab('settings')}
          >
            <Settings2 size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            User Access &amp; Settings
          </button>
        </div>
      </div>

      {/* ==================== TAB 0: PLATFORM OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="dash-grid-2">
          <section className="panel-card">
            <div className="panel-head">
              <div>
                <h3>Plan Subscriber Distribution</h3>
                <p>Active workspaces grouped by subscription tier and monthly revenue contribution.</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => selectAdminTab('plans')}>
                Manage Plans →
              </button>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
              {plans.map((p) => {
                const count = subscriptions.filter((s) => (s.plan?.code || 'free') === p.code).length;
                return (
                  <div
                    key={p.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{p.name} Plan</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {p.priceMonthly !== null ? `${formatINR(p.priceMonthly)} / month` : 'Custom Enterprise'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge-purple">{count} Workspaces</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditPlanModal(p)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-head">
              <div>
                <h3>Quick Tenant Workspace Launcher</h3>
                <p>Enter any user’s live dashboard with one click to inspect their CRM, inbox, or campaigns.</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => selectAdminTab('users')}>
                Full Directory →
              </button>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
              {users.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {u.business?.name || `${u.name}'s Workspace`}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {u.name} ({u.email}) • {u.subscription?.plan?.name || 'Free'} Plan
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVisitUserDashboard(u)}
                    >
                      <Eye size={14} /> Visit Dashboard
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditUserModal(u)}
                    >
                      <Settings2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB: VISIT USER DASHBOARD (VISUAL LAUNCHER) ==================== */}
      {activeTab === 'visit' && (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Visit Any User’s Live Dashboard</h3>
              <p>
                Select any tenant workspace below to switch into their User Dashboard with their full User Menu,
                CRM contacts, inbox conversations, and automation flows.
              </p>
            </div>
          </div>
          <div className="panel-body">
            <div className="dash-grid-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--r-xl)',
                    padding: 20,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span className="badge badge-green" style={{ marginBottom: 6 }}>
                          {u.subscription?.plan?.name || 'Free'} Plan
                        </span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                          {u.business?.name || `${u.name}'s Workspace`}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {u.business?.industry || 'Indian SMB'}
                        </div>
                      </div>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--surface-2)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <strong>User:</strong> {u.name}
                      </div>
                      <div style={{ color: 'var(--muted)' }}>{u.email}</div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span className="badge">
                        <Users size={11} /> {u.counts?.contacts ?? 0} Contacts
                      </span>
                      <span className="badge">
                        <MessageSquare size={11} /> {u.counts?.conversations ?? 0} Chats
                      </span>
                      <span className="badge">
                        <Megaphone size={11} /> {u.counts?.campaigns ?? 0} Campaigns
                      </span>
                      <span className="badge">
                        <Workflow size={11} /> {u.counts?.workflows ?? 0} Flows
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleVisitUserDashboard(u)}
                    >
                      <Eye size={15} /> Visit User Dashboard →
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditUserModal(u)}
                      title="User Settings"
                    >
                      <Settings2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== TAB: USER ACCESS & SETTINGS ==================== */}
      {activeTab === 'settings' && (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Global User Access, Roles &amp; Account Settings ({users.length})</h3>
              <p>
                Configure user permissions, toggle active/suspended status, grant Super Admin access, or open full
                account &amp; password settings.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateUserModal}>
              <Plus size={15} /> Add New User
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Business Workspace</th>
                  <th>Workspace Role</th>
                  <th>Account Status</th>
                  <th>Super Admin Access</th>
                  <th style={{ textAlign: 'right' }}>Configure</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{u.email}</div>
                    </td>
                    <td>{u.business?.name || '—'}</td>
                    <td>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-green">Active</span>
                      ) : (
                        <span className="badge badge-coral">Suspended</span>
                      )}
                    </td>
                    <td>
                      {u.isSuperAdmin ? (
                        <span className="badge badge-purple">
                          <Crown size={11} /> Super Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Standard User</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditUserModal(u)}
                        >
                          <Settings2 size={14} /> Edit Settings &amp; Plan
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: u.isActive ? 'var(--danger)' : 'var(--green-deep)' }}
                          onClick={() => handleQuickToggleUserActive(u)}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== TAB 1: USERS & WORKSPACES LIST ==================== */}
      {activeTab === 'users' && (
        <>
          {/* Filter Pills with Counts + Search + Dropdowns */}
          <div className="toolbar">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {[
                { key: 'all', label: 'All Users', count: userCounts.all },
                { key: 'active', label: 'Active', count: userCounts.active },
                { key: 'inactive', label: 'Suspended', count: userCounts.inactive },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  className={`btn btn-sm ${statusFilter === pill.key ? 'btn-dark' : 'btn-outline'}`}
                  onClick={() => setStatusFilter(pill.key)}
                >
                  {pill.label}
                  <span
                    className="badge"
                    style={{
                      background: statusFilter === pill.key ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
                      color: statusFilter === pill.key ? '#fff' : 'var(--text)',
                    }}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <div className="toolbar-search">
                <Search />
                <input
                  type="search"
                  className="input"
                  style={{ paddingLeft: 38, minHeight: 38 }}
                  placeholder="Search user name, email, business, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="select"
                style={{ width: 'auto', minHeight: 38, padding: '6px 12px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="all">All Roles ({userCounts.all})</option>
                <option value="superadmin">Super Admins ({userCounts.superAdmins})</option>
                <option value="owner">Workspace Owners ({userCounts.owners})</option>
                <option value="admin">Admins ({userCounts.admins})</option>
                <option value="agent">Agents ({userCounts.agents})</option>
              </select>

              <select
                className="select"
                style={{ width: 'auto', minHeight: 38, padding: '6px 12px' }}
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                aria-label="Filter by subscription plan"
              >
                <option value="all">All Plans</option>
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} Plan
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="panel-card">
            <div className="panel-head">
              <div>
                <h3>Platform Users &amp; Workspaces Directory ({filteredUsers.length})</h3>
                <p>
                  Click <strong>Visit Dashboard</strong> on any row to immediately enter that user’s workspace, or{' '}
                  <strong>User Settings</strong> to change their plan, role, or status.
                </p>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User &amp; Role</th>
                    <th>Business Workspace</th>
                    <th>Subscription Plan</th>
                    <th>Workspace Usage Counts</th>
                    <th>Status &amp; Last Login</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="skeleton" style={{ height: 56 }} />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                        No users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const planName = u.subscription?.plan?.name || 'Free';
                      const planCode = u.subscription?.plan?.code || 'free';
                      const subStatus = u.subscription?.status || 'active';
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="dash-avatar" style={{ width: 36, height: 36, fontSize: '0.78rem' }}>
                                {(u.name || 'U')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '0.92rem' }}>{u.name}</strong>
                                  {u.isSuperAdmin && (
                                    <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                                      <Crown size={11} /> Super Admin
                                    </span>
                                  )}
                                  <span className="badge" style={{ textTransform: 'capitalize', fontSize: '0.68rem' }}>
                                    {u.role}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            {u.business ? (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {u.business.name}
                                  {u.business.isDemo && (
                                    <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>
                                      Demo
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                  {u.business.industry || 'SMB'} • ID #{u.business.id}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>No workspace</span>
                            )}
                          </td>

                          <td>
                            <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
                              <span
                                className={`badge ${
                                  planCode === 'pro' || planCode === 'business'
                                    ? 'badge-purple'
                                    : planCode === 'growth'
                                    ? 'badge-green'
                                    : 'badge-blue'
                                }`}
                              >
                                <Sparkles size={11} /> {planName} Plan
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                                {subStatus} • {u.subscription?.billingCycle || 'monthly'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span className="badge" title="Total Contacts">
                                <Users size={11} /> {u.counts?.contacts ?? 0} Contacts
                              </span>
                              <span className="badge" title="Conversations">
                                <MessageSquare size={11} /> {u.counts?.conversations ?? 0} Chats
                              </span>
                              <span className="badge" title="Campaigns">
                                <Megaphone size={11} /> {u.counts?.campaigns ?? 0} Camp.
                              </span>
                              <span className="badge" title="Workflows">
                                <Workflow size={11} /> {u.counts?.workflows ?? 0} Flows
                              </span>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
                              {u.isActive ? (
                                <span className="badge badge-green">
                                  <CheckCircle2 size={11} /> Active
                                </span>
                              ) : (
                                <span className="badge badge-coral">
                                  <XCircle size={11} /> Suspended
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                {u.lastLoginAt ? `Active ${formatRelativeTime(u.lastLoginAt)}` : 'Never logged in'}
                              </span>
                            </div>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleVisitUserDashboard(u)}
                                title={`Visit ${u.business?.name || u.name}'s Dashboard`}
                              >
                                <Eye size={14} /> Visit Dashboard
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => openEditUserModal(u)}
                                title="Configure user settings, plan & permissions"
                              >
                                <Settings2 size={14} /> Settings
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleQuickToggleUserActive(u)}
                                style={{ color: u.isActive ? 'var(--danger)' : 'var(--green-deep)' }}
                              >
                                {u.isActive ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ==================== TAB 2: SUBSCRIPTION PLANS BUILDER ==================== */}
      {activeTab === 'plans' && (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Subscription Plans &amp; Tier Builder</h3>
              <p>
                Create new subscription tiers or customize monthly/yearly INR pricing, contact limits, AI allowances,
                and included features.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreatePlanModal}>
              <Plus size={15} /> Create New Plan
            </button>
          </div>

          <div className="panel-body">
            <div className="dash-grid-3">
              {plans.map((plan) => (
                <div
                  key={plan.id || plan.code}
                  style={{
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--r-xl)',
                    padding: 22,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <span className="badge badge-green" style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                          Code: {plan.code}
                        </span>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>{plan.name}</h4>
                      </div>
                      <span className="badge badge-purple">{plan.subscriberCount ?? 0} Workspaces</span>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>
                      {plan.description || 'Custom subscription tier'}
                    </p>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--surface-2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Monthly</span>
                        <strong style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                          {plan.priceMonthly !== null && plan.priceMonthly !== undefined
                            ? `${formatINR(plan.priceMonthly)}/mo`
                            : 'Contact Sales'}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Yearly</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--green-deep)' }}>
                          {plan.priceYearly !== null && plan.priceYearly !== undefined
                            ? `${formatINR(plan.priceYearly)}/yr`
                            : 'Custom'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 6, fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Contacts Limit:</span>
                        <strong>{plan.limits?.contacts === -1 ? 'Unlimited' : plan.limits?.contacts ?? '—'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Team Members:</span>
                        <strong>{plan.limits?.teamMembers === -1 ? 'Unlimited' : plan.limits?.teamMembers ?? '—'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Messages / Month:</span>
                        <strong>
                          {plan.limits?.messagesPerMonth === -1 ? 'Unlimited' : plan.limits?.messagesPerMonth ?? '—'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>AI Requests / Month:</span>
                        <strong>
                          {plan.limits?.aiRequestsPerMonth === -1 ? 'Unlimited' : plan.limits?.aiRequestsPerMonth ?? '—'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Automation Workflows:</span>
                        <strong>{plan.limits?.workflows === -1 ? 'Unlimited' : plan.limits?.workflows ?? '—'}</strong>
                      </div>
                    </div>

                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul style={{ display: 'grid', gap: 5, fontSize: '0.8rem', color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        {plan.features.map((feat) => (
                          <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={13} style={{ color: 'var(--green-deep)', flexShrink: 0 }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => openEditPlanModal(plan)}
                    >
                      <Edit3 size={14} /> Edit Plan
                    </button>
                    {!['free', 'starter', 'growth', 'pro', 'business'].includes(plan.code) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeletePlanTarget(plan)}
                        title="Delete custom plan"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== TAB 3: ALL SUBSCRIPTIONS LIST ==================== */}
      {activeTab === 'subscriptions' && (
        <>
          <div className="toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All Subscriptions' },
                { key: 'active', label: 'Active' },
                { key: 'trialing', label: 'Trialing' },
                { key: 'past_due', label: 'Past Due' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  className={`btn btn-sm ${subStatusFilter === st.key ? 'btn-dark' : 'btn-outline'}`}
                  onClick={() => setSubStatusFilter(st.key)}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                className="select"
                style={{ width: 'auto', minHeight: 38 }}
                value={subPlanFilter}
                onChange={(e) => setSubPlanFilter(e.target.value)}
                aria-label="Filter subscriptions by plan"
              >
                <option value="all">All Plan Tiers</option>
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="panel-card">
            <div className="panel-head">
              <div>
                <h3>All Workspace Subscriptions ({filteredSubscriptions.length})</h3>
                <p>Assign or upgrade any workspace’s plan tier, billing cycle, or subscription status immediately.</p>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Workspace</th>
                    <th>Owner</th>
                    <th>Assigned Plan</th>
                    <th>Billing Cycle</th>
                    <th>Subscription Status</th>
                    <th style={{ textAlign: 'right' }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{sub.businessName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {sub.industry} • Workspace #{sub.businessId}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sub.ownerName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{sub.ownerEmail}</div>
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ width: 'auto', minHeight: 36, padding: '4px 10px', fontWeight: 700 }}
                          value={sub.plan?.code || 'free'}
                          onChange={(e) => handleUpdateSubscriptionInline(sub, { planCode: e.target.value })}
                        >
                          {plans.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name} ({p.priceMonthly !== null ? `${formatINR(p.priceMonthly)}/mo` : 'Custom'})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ width: 'auto', minHeight: 36, padding: '4px 10px' }}
                          value={sub.billingCycle || 'monthly'}
                          onChange={(e) => handleUpdateSubscriptionInline(sub, { billingCycle: e.target.value })}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly (2 mo free)</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ width: 'auto', minHeight: 36, padding: '4px 10px' }}
                          value={sub.status || 'active'}
                          onChange={(e) => handleUpdateSubscriptionInline(sub, { status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="trialing">Trialing</option>
                          <option value="past_due">Past Due</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            handleVisitUserDashboard({
                              id: sub.ownerUserId || 1,
                              name: sub.ownerName,
                              email: sub.ownerEmail,
                              business: {
                                id: sub.businessId,
                                name: sub.businessName,
                                industry: sub.industry,
                                isDemo: sub.isDemo,
                              },
                              subscription: sub,
                            })
                          }
                        >
                          <Eye size={14} /> Visit Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ==================== MODAL: USER & WORKSPACE SETTINGS ==================== */}
      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `User & Workspace Settings — ${editingUser.name}` : 'Create New User & Business Workspace'}
        subtitle="Configure user account details, role permissions, workspace profile, and assigned subscription plan."
      >
        <form onSubmit={handleSaveUser} style={{ display: 'grid', gap: 14 }}>
          <div className="dash-grid-equal">
            <div className="field">
              <label className="label" htmlFor="adm-u-name">
                Full Name *
              </label>
              <input
                id="adm-u-name"
                type="text"
                className="input"
                value={uName}
                onChange={(e) => setUName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-u-email">
                Email Address *
              </label>
              <input
                id="adm-u-email"
                type="email"
                className="input"
                value={uEmail}
                onChange={(e) => setUEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="dash-grid-equal">
            <div className="field">
              <label className="label" htmlFor="adm-u-biz">
                Business / Workspace Name *
              </label>
              <input
                id="adm-u-biz"
                type="text"
                className="input"
                placeholder="e.g. Kapoor Retail Store"
                value={uBusinessName}
                onChange={(e) => setUBusinessName(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-u-ind">
                Industry
              </label>
              <input
                id="adm-u-ind"
                type="text"
                className="input"
                placeholder="e.g. Retail, Coaching, Salon"
                value={uIndustry}
                onChange={(e) => setUIndustry(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-grid-3">
            <div className="field">
              <label className="label" htmlFor="adm-u-role">
                Workspace Role
              </label>
              <select
                id="adm-u-role"
                className="select"
                value={uRole}
                onChange={(e) => setURole(e.target.value)}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-u-plan">
                Subscription Plan
              </label>
              <select
                id="adm-u-plan"
                className="select"
                value={uPlanCode}
                onChange={(e) => setUPlanCode(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.priceMonthly !== null ? `${formatINR(p.priceMonthly)}/mo` : 'Custom'})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-u-cycle">
                Billing Cycle
              </label>
              <select
                id="adm-u-cycle"
                className="select"
                value={uBillingCycle}
                onChange={(e) => setUBillingCycle(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="dash-grid-equal">
            <div className="field">
              <label className="label" htmlFor="adm-u-pass">
                {editingUser ? 'Reset Password (leave blank to keep current)' : 'Initial Password *'}
              </label>
              <input
                id="adm-u-pass"
                type="password"
                className="input"
                placeholder={editingUser ? '••••••••' : 'At least 8 characters'}
                value={uPassword}
                onChange={(e) => setUPassword(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-u-substatus">
                Subscription Status
              </label>
              <select
                id="adm-u-substatus"
                className="select"
                value={uSubStatus}
                onChange={(e) => setUSubStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              padding: '12px 14px',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
            }}
          >
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={uIsActive}
                onChange={(e) => setUIsActive(e.target.checked)}
              />
              Account Active (allow login)
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={uIsSuperAdmin}
                onChange={(e) => setUIsSuperAdmin(e.target.checked)}
              />
              <ShieldCheck size={16} color="#6d3fd8" /> Grant Super Admin Privileges
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setUserModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingUser}>
              {savingUser ? 'Saving...' : editingUser ? 'Save User Settings' : 'Create User & Workspace'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: CREATE / EDIT SUBSCRIPTION PLAN ==================== */}
      <Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? `Edit Subscription Plan — ${editingPlan.name}` : 'Create New Subscription Plan'}
        subtitle="Define pricing in INR, monthly resource limits (-1 for unlimited), and included feature bullets."
      >
        <form onSubmit={handleSavePlan} style={{ display: 'grid', gap: 14 }}>
          <div className="dash-grid-equal">
            <div className="field">
              <label className="label" htmlFor="adm-p-name">
                Plan Display Name *
              </label>
              <input
                id="adm-p-name"
                type="text"
                className="input"
                placeholder="e.g. Scale Plus"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-p-code">
                Unique Plan Code *
              </label>
              <input
                id="adm-p-code"
                type="text"
                className="input"
                placeholder="e.g. scale_plus"
                value={pCode}
                onChange={(e) => setPCode(e.target.value)}
                disabled={Boolean(editingPlan)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="adm-p-desc">
              Short Tagline / Description
            </label>
            <input
              id="adm-p-desc"
              type="text"
              className="input"
              placeholder="For multi-outlet stores scaling WhatsApp broadcasts..."
              value={pDescription}
              onChange={(e) => setPDescription(e.target.value)}
            />
          </div>

          <div className="dash-grid-3">
            <div className="field">
              <label className="label" htmlFor="adm-p-monthly">
                Monthly Price (₹ INR)
              </label>
              <input
                id="adm-p-monthly"
                type="number"
                className="input"
                placeholder="Leave blank for Custom"
                value={pPriceMonthly}
                onChange={(e) => setPPriceMonthly(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-p-yearly">
                Yearly Price (₹ INR)
              </label>
              <input
                id="adm-p-yearly"
                type="number"
                className="input"
                placeholder="e.g. 10x monthly"
                value={pPriceYearly}
                onChange={(e) => setPPriceYearly(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-p-sort">
                Display Order
              </label>
              <input
                id="adm-p-sort"
                type="number"
                className="input"
                value={pSortOrder}
                onChange={(e) => setPSortOrder(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-grid-3">
            <div className="field">
              <label className="label" htmlFor="adm-p-contacts">
                Max Contacts (-1 = Unlimited)
              </label>
              <input
                id="adm-p-contacts"
                type="number"
                className="input"
                value={pContactsLimit}
                onChange={(e) => setPContactsLimit(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-p-team">
                Team Members Limit
              </label>
              <input
                id="adm-p-team"
                type="number"
                className="input"
                value={pTeamLimit}
                onChange={(e) => setPTeamLimit(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-p-workflows">
                Max Workflows
              </label>
              <input
                id="adm-p-workflows"
                type="number"
                className="input"
                value={pWorkflowsLimit}
                onChange={(e) => setPWorkflowsLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-grid-equal">
            <div className="field">
              <label className="label" htmlFor="adm-p-msgs">
                Messages / Month Allowance
              </label>
              <input
                id="adm-p-msgs"
                type="number"
                className="input"
                value={pMessagesLimit}
                onChange={(e) => setPMessagesLimit(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="adm-p-ai">
                AI Requests / Month Allowance
              </label>
              <input
                id="adm-p-ai"
                type="number"
                className="input"
                value={pAiLimit}
                onChange={(e) => setPAiLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="adm-p-features">
              Plan Features List (one per line)
            </label>
            <textarea
              id="adm-p-features"
              className="textarea"
              style={{ minHeight: 92 }}
              value={pFeaturesText}
              onChange={(e) => setPFeaturesText(e.target.value)}
              placeholder={'Up to 15,000 contacts\n8 team members\nPriority WhatsApp onboarding'}
            />
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.88rem' }}>
            <input
              type="checkbox"
              checked={pIsPublic}
              onChange={(e) => setPIsPublic(e.target.checked)}
            />
            Show this plan publicly on pricing lists
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingPlan}>
              {savingPlan ? 'Saving...' : editingPlan ? 'Save Plan Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletePlanTarget)}
        onClose={() => setDeletePlanTarget(null)}
        onConfirm={handleConfirmDeletePlan}
        title="Delete Subscription Plan"
        description={`Are you sure you want to delete the "${deletePlanTarget?.name}" plan?`}
        confirmLabel="Delete Plan"
      />
    </>
  );
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 420 }} />}>
      <AdminConsoleInner />
    </Suspense>
  );
}

