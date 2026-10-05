import React, { useState, useMemo } from 'react';
import { useCUCOM } from '../../context/CUCOMContext';
import { UserAccount } from '../../types/cucom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Lock, 
  Sparkles 
} from 'lucide-react';

export const AdminUserManagementView: React.FC = () => {
  const { 
    users, 
    departments, 
    designations, 
    createUser, 
    updateUser, 
    deleteUser 
  } = useCUCOM();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // Password visibility map
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Creating New Staff User
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    email: '',
    password: 'Cocum@2026',
    department: '',
    isCustomDept: false,
    customDept: '',
    designation: '',
    isCustomRole: false,
    customRole: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    username: '',
    email: '',
    password: 'Cocum@2026',
    department: '',
    isCustomDept: false,
    customDept: '',
    designation: '',
    isCustomRole: false,
    customRole: '',
    isActive: true,
  });

  // Staff-only users list (strictly excludes Admin: Admin is the manager, not staff)
  const staffOnlyUsers = useMemo(() => {
    return users.filter(u => u.role !== 'ADMIN');
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return staffOnlyUsers.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'ALL' || u.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [staffOnlyUsers, searchTerm, selectedDept]);

  // Auto-generate username from name
  const handleNameChange = (nameVal: string) => {
    const autoUsername = nameVal
      .toLowerCase()
      .replace(/^dr\s+/, '')
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.');

    setCreateForm(prev => ({
      ...prev,
      name: nameVal,
      username: prev.username ? prev.username : autoUsername,
      email: prev.email ? prev.email : (autoUsername ? `${autoUsername}@cucom.edu.ag` : ''),
    }));
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      name: '',
      username: '',
      email: '',
      password: 'Cocum@2026',
      department: departments[0] || 'Administration',
      isCustomDept: false,
      customDept: '',
      designation: designations[0] || 'Staff',
      isCustomRole: false,
      customRole: '',
    });
    setFeedbackMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const finalDept = createForm.isCustomDept ? createForm.customDept.trim() : createForm.department;
    const finalRole = createForm.isCustomRole ? createForm.customRole.trim() : createForm.designation;

    if (!finalDept) {
      setFeedbackMsg({ type: 'error', text: 'Please enter or select a valid department.' });
      return;
    }
    if (!finalRole) {
      setFeedbackMsg({ type: 'error', text: 'Please enter or select a valid designation / role.' });
      return;
    }

    const res = await createUser({
      name: createForm.name,
      username: createForm.username,
      email: createForm.email,
      password: createForm.password || 'Cocum@2026',
      department: finalDept,
      designation: finalRole,
    });

    if (res.success) {
      setIsCreateModalOpen(false);
      setFeedbackMsg({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleOpenEditModal = (user: UserAccount) => {
    const isCustomD = !departments.includes(user.department);
    const isCustomR = !designations.includes(user.designation);

    setEditingUser(user);
    setEditForm({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password || 'Cocum@2026',
      department: isCustomD ? '__CUSTOM__' : user.department,
      isCustomDept: isCustomD,
      customDept: isCustomD ? user.department : '',
      designation: isCustomR ? '__CUSTOM__' : user.designation,
      isCustomRole: isCustomR,
      customRole: isCustomR ? user.designation : '',
      isActive: user.isActive !== false,
    });
    setFeedbackMsg(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const finalDept = editForm.isCustomDept ? editForm.customDept.trim() : editForm.department;
    const finalRole = editForm.isCustomRole ? editForm.customRole.trim() : editForm.designation;

    const res = await updateUser(editingUser.id, {
      name: editForm.name.trim(),
      username: editForm.username.trim().toLowerCase(),
      email: editForm.email.trim().toLowerCase(),
      password: editForm.password.trim() || 'Cocum@2026',
      department: finalDept,
      designation: finalRole,
      isActive: editForm.isActive,
    });

    if (res.success) {
      setIsEditModalOpen(false);
      setFeedbackMsg({ type: 'success', text: `Updated '${editForm.name}' successfully in Supabase!` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id);
    setIsDeleteModalOpen(false);
    setFeedbackMsg({ type: 'success', text: `User '${deletingUser.name}' removed from portal authority.` });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCopyCredentials = (user: UserAccount) => {
    const pass = user.password || 'Cocum@2026';
    const text = `CUCOM Daily Reporting Portal Credentials:\nName: ${user.name}\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${pass}\nDepartment: ${user.department}\nRole: ${user.designation}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HERO BANNER: TOTAL ADMIN AUTHORITY */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-rose-100">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Dean's Central Authority Panel</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase">
              Staff & User Access Authority
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
              Create, configure, and manage employee login accounts with custom departments, institutional roles, and passwords. Staff members log in using the credentials you define here.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="self-start md:self-center px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-rose-50 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-98 transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4 text-red-700" />
            <span>Create New Staff Account</span>
          </button>
        </div>

        {/* Metric Badges Strip */}
        <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-black/15 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-rose-200 text-[11px] font-bold uppercase">Registered Staff</div>
            <div className="text-2xl font-black mt-0.5">{staffOnlyUsers.length}</div>
          </div>
          <div className="bg-black/15 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-rose-200 text-[11px] font-bold uppercase">Active Submitting</div>
            <div className="text-2xl font-black mt-0.5">
              {staffOnlyUsers.filter(u => u.isActive !== false).length}
            </div>
          </div>
          <div className="bg-black/15 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-rose-200 text-[11px] font-bold uppercase">Active Departments</div>
            <div className="text-2xl font-black mt-0.5">
              {new Set(staffOnlyUsers.map(u => u.department)).size}
            </div>
          </div>
          <div className="bg-black/15 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-rose-200 text-[11px] font-bold uppercase">Admin Authority</div>
            <div className="text-xs font-black mt-2 text-rose-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Total Control</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST / BANNER */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by candidate name, username, email, department, role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none transition shadow-2xs"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. STAFF ROSTER TABLE / EMPTY STATE */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/60">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {staffOnlyUsers.length === 0 ? 'No Staff Accounts Created Yet' : 'No Matching Staff Found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {staffOnlyUsers.length === 0
                  ? 'All previous static accounts have been cleared. As Admin, you have total authority to create candidate accounts with custom names, departments, roles, and passwords.'
                  : 'Try adjusting your search criteria or department filter.'}
              </p>
            </div>
            {filteredUsers.length === 0 && (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-red-600/30 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create First Staff Account</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Role / Designation</th>
                  <th className="py-3.5 px-4">Login Password</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map((user, idx) => {
                  const pass = user.password || 'Cocum@2026';
                  const isPassVisible = Boolean(showPasswordMap[user.id]);
                  const isCopied = copiedId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                              <span>@{user.username}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                          <Building2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <span>{user.department}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.designation}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>{isPassVisible ? pass : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 hover:text-red-600 cursor-pointer text-slate-400"
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            user.isActive !== false
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                          }`}
                          title="Click to toggle active status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{user.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyCredentials(user)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer"
                            title="Copy Full Login Credentials to Clipboard"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer"
                            title="Edit User Details, Role, or Password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => { setDeletingUser(user); setIsDeleteModalOpen(true); }}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                            title="Remove User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL: CREATE NEW STAFF USER ACCOUNT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Create New Staff Account
                  </h3>
                  <p className="text-[11px] text-rose-100">Provision candidate login with custom department & role</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/20 text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharon Dowdy or Dr. John Smith"
                  value={createForm.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sharon.dowdy"
                    value={createForm.username}
                    onChange={e => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cocum@2026"
                    value={createForm.password}
                    onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. sharon.dowdy@cucom.edu.ag"
                  value={createForm.email}
                  onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Institutional Department *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({ ...prev, isCustomDept: !prev.isCustomDept }))}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    {createForm.isCustomDept ? '← Choose Existing Department' : '+ Enter New Custom Department'}
                  </button>
                </div>

                {createForm.isCustomDept ? (
                  <input
                    type="text"
                    required
                    placeholder="Type new department name (e.g. Cardiology, Pathology Lab, Security)..."
                    value={createForm.customDept}
                    onChange={e => setCreateForm(prev => ({ ...prev, customDept: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white font-semibold focus:outline-none"
                  />
                ) : (
                  <select
                    value={createForm.department}
                    onChange={e => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none cursor-pointer"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Designation / Role Title *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({ ...prev, isCustomRole: !prev.isCustomRole }))}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    {createForm.isCustomRole ? '← Choose Existing Role' : '+ Enter New Custom Role'}
                  </button>
                </div>

                {createForm.isCustomRole ? (
                  <input
                    type="text"
                    required
                    placeholder="Type new role title (e.g. Senior Surgeon, Lab Technician, Security Supervisor)..."
                    value={createForm.customRole}
                    onChange={e => setCreateForm(prev => ({ ...prev, customRole: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white font-semibold focus:outline-none"
                  />
                ) : (
                  <select
                    value={createForm.designation}
                    onChange={e => setCreateForm(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none cursor-pointer"
                  >
                    {designations.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT USER ACCOUNT */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Edit Staff Profile: {editingUser.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Modify login details, departmental assignment, or password</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/20 text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.password}
                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Department
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isCustomDept: !prev.isCustomDept }))}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    {editForm.isCustomDept ? '← Choose Existing' : '+ Enter Custom'}
                  </button>
                </div>
                {editForm.isCustomDept ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom department name"
                    value={editForm.customDept}
                    onChange={e => setEditForm(prev => ({ ...prev, customDept: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border-2 border-red-500 bg-red-50/20 text-slate-900 dark:text-white font-semibold"
                  />
                ) : (
                  <select
                    value={editForm.department}
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold cursor-pointer"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Role / Designation
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isCustomRole: !prev.isCustomRole }))}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    {editForm.isCustomRole ? '← Choose Existing' : '+ Enter Custom'}
                  </button>
                </div>
                {editForm.isCustomRole ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom role title"
                    value={editForm.customRole}
                    onChange={e => setEditForm(prev => ({ ...prev, customRole: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border-2 border-red-500 bg-red-50/20 text-slate-900 dark:text-white font-semibold"
                  />
                ) : (
                  <select
                    value={editForm.designation}
                    onChange={e => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold cursor-pointer"
                  >
                    {designations.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Account Active Status</div>
                  <div className="text-[11px] text-slate-400">Inactive accounts cannot sign in or submit reports</div>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={e => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: DELETE CONFIRMATION */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/60">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base uppercase text-slate-900 dark:text-white">
                Delete Staff Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingUser.name}</strong> ({deletingUser.username})? This user will no longer be able to log in to the reporting system.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
