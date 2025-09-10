'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getPaginationRange } from '@/components/GetPage';
import axiosInstance from '../../lib/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

import { MdImageNotSupported } from 'react-icons/md';
import { TbEdit } from 'react-icons/tb';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { LuSave, LuPlus } from 'react-icons/lu';
import { AnimatePresence, motion } from 'framer-motion';
import ReactTextEditor from '@/components/RichTextEditor';

type Subcategory = {
  _id: string;
  sub_cat_name: string;
  metaTitle?: string;
  metaKeyword?: string;
  metaDescription?: string;
  mappedParent: string; 
  sub_cat_img_url?: string;
};
type Category = {
  _id: string;
  main_cat_name: string;
  metaTitle?: string;
  metaKeyword?: string;
  metaDescription?: string;
  main_cat_image?: string;
};

type TokenPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

export default function SubcategoriesPage() {
  // Sidebar collapse state for responsive layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // DeepSeek API integration
  const DEEPSEEK_API_KEY = 'sk-25f236c2be3a42d49914b903ff908670';
  const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

  // AI loading states
  const [aiLoading, setAiLoading] = useState({
    metaTitle: false,
    metaKeyword: false,
    metaDescription: false,
    description: false,
  });

  // Helper to call DeepSeek API
  async function rewriteWithAI(field: 'metaTitle' | 'metaKeyword' | 'metaDescription' | 'description', value: string, setter: (v: string) => void) {
    setAiLoading((prev) => ({ ...prev, [field]: true }));
    try {
      const promptMap = {
        metaTitle: `Generate an SEO meta title for: ${value}`,
        metaKeyword: `Generate SEO meta keywords for: ${value}`,
        metaDescription: `Generate an SEO meta description for: ${value}`,
        description: `Generate a product subcategory description for: ${value}`,
      };
      const res = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: promptMap[field] }],
        }),
      });
      const data = await res.json();
      const aiText = data.choices?.[0]?.message?.content?.trim() || '';
      if (aiText) setter(aiText);
      else toast.error('AI did not return a result');
    } catch (err) {
      toast.error('AI rewrite failed');
    } finally {
      setAiLoading((prev) => ({ ...prev, [field]: false }));
    }
  }
  const router = useRouter();

  // --- data
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- pagination & search
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [goToPageInput, setGoToPageInput] = useState<string>('');

  // --- auth/role
  const [userRole, setUserRole] = useState<string | null>(null);
  const isManagerViewOnly = useMemo(() => userRole === 'pepagora_manager', [userRole]);

  // --- modals & editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- form states
  const [formName, setFormName] = useState('');
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaKeyword, setFormMetaKeyword] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [mappedParent, setMappedParent] = useState<string | null>(null);
  const [formDescription, setFormDescription] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded: TokenPayload = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }
}, []);


  // fetch sub
  // categories
  const fetchSubcategories = async (pageToFetch = page) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/subcategories', {
        params: { page: pageToFetch, limit, search: searchQuery || undefined },
      });
      const items = Array.isArray(res.data.data.data) ? res.data.data.data : [];
      console.log(items)
      const pagination = res.data.data.pagination || {};
      setSubcategories(items);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.totalItems || items.length || 0);
    } catch (err) {
      console.error(err);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/categories');
      const items = Array.isArray(res.data.data.data) ? res.data.data.data : [];
      setCategories(items);
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubcategories(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  // Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/subcategories', {
        sub_cat_name: formName,
        metaTitle: formMetaTitle,
        metaKeyword: formMetaKeyword,
        metaDescription: formMetaDescription,
        imageUrl: formImageUrl,
        mappedParent: mappedParent,
        description: formDescription,
      });
      toast.success('Subcategory created');
      setShowAddModal(false);
      fetchSubcategories(1);
      setPage(1);
    } catch {
      toast.error('Create failed');
    }
  };

  // Start edit
  const startEdit = (s: Subcategory) => {
    setEditingId(s._id);
    setFormName(s.sub_cat_name);
    setFormMetaTitle(s.metaTitle || '');
    setFormMetaKeyword(s.metaKeyword || '');
    setFormMetaDescription(s.metaDescription || '');
    setFormImageUrl(s.sub_cat_img_url || '');
    setMappedParent(s.mappedParent || null);
    setFormDescription((s as any).description || '');
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await axiosInstance.put(`/subcategories/${editingId}`, {
        sub_cat_name: formName,
        metaTitle: formMetaTitle,
        metaKeyword: formMetaKeyword,
        metaDescription: formMetaDescription,
        imageUrl: formImageUrl,
        mappedParent: mappedParent,
        description: formDescription,
      });
      toast.success('Subcategory updated');
      setShowEditModal(false);
      setEditingId(null);
      fetchSubcategories(page);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await axiosInstance.delete(`/subcategories/${deletingId}`);
      toast.success('Deleted');
      setShowDeleteModal(false);
      setDeletingId(null);
      if (subcategories.length === 1 && page > 1) {
        setPage(page - 1);
        fetchSubcategories(page - 1);
      } else {
        fetchSubcategories(page);
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const onSearchChange = (v: string) => {
    setSearchQuery(v);
    setPage(1);
  };

  const goToPage = (input: string) => {
    const p = Number(input);
    if (!Number.isFinite(p) || p < 1 || p > totalPages) {
      toast.error(`Page must be between 1 and ${totalPages}`);
      return;
    }
    setPage(p);
    setGoToPageInput('');
    fetchSubcategories(p);
  };
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[140px]">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );

  const tooLong = (s?: string) => (s ? s.length > 120 : false);

  // Sidebar collapsed state
  // (Removed duplicate declaration)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-60'} p-6 md:p-8`}>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subcategories</h1>
              <p className="text-gray-500 text-sm">Create, edit and manage product subcategories.</p>
            </div>
            {!isManagerViewOnly && (
              <button
                onClick={() => {
                  setFormName('');
                  setFormMetaTitle('');
                  setFormMetaKeyword('');
                  setFormMetaDescription('');
                  setFormImageUrl('');
                  setFormDescription('');
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
              >
                <LuPlus /> Add Subcategory
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            <Stat label="Total Subcategories" value={totalItems} />
            <Stat label="Page" value={`${page} / ${totalPages}`} />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {/* Search */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="🔍 Search subcategories..."
                className="w-64 rounded-lg border px-3 py-1.5 text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <tr>
                    <th className="p-3">Image</th>
                    <th className="p-3">Subcategory</th>
                    <th className="p-3">Meta Title</th>
                    <th className="p-3">Meta Keywords</th>
                    <th className="p-3">Meta Description</th>
                    {!isManagerViewOnly && <th className="p-3 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                  {!loading && subcategories.length === 0 && (
                    <tr>
                      <td colSpan={isManagerViewOnly ? 5 : 6} className="p-6 text-center text-gray-500">
                        No subcategories found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    subcategories.map((s) => (
                      <tr key={s._id} className="border-t hover:bg-blue-50/40">
                        {/* Image */}
                        <td className="p-3 align-top">
                          {s.sub_cat_img_url ? (
                            <a href={s.sub_cat_img_url} target="_blank" rel="noreferrer">
                              <img src={s.sub_cat_img_url} alt={s.sub_cat_name} className="h-14 w-14 rounded-lg object-cover shadow-sm" />
                            </a>
                          ) : (
                            <MdImageNotSupported className="h-14 w-14 text-gray-300" />
                          )}
                        </td>

                        {/* Name */}
                        <td className="p-3 align-top font-medium text-gray-900">{s.sub_cat_name}</td>

                        <td className="p-3 align-top">
                          {s.metaTitle ? (
                            <div
                              className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md p-2 text-xs text-blue-900 break-words transition-all duration-200 hover:shadow-lg hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-300"
                              style={{ minWidth: '120px', maxWidth: '220px' }}
                            >
                              <span className="font-semibold text-blue-700">{s.metaTitle}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        <td className="p-3 align-top">
                            {s.metaKeyword ? (
                              <div
                                className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-white shadow-md p-2 text-xs text-purple-900 break-words transition-all duration-200 hover:shadow-lg hover:border-purple-400 focus-within:ring-2 focus-within:ring-purple-300"
                                style={{ minWidth: '100px', maxWidth: '180px' }}
                              >
                                <span className="font-semibold text-purple-700">{s.metaKeyword}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                        </td>

                        <td className="p-3 align-top max-w-sm">
                          {s.metaDescription ? (
                            <div
                              className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-white shadow-md p-2 text-xs text-green-900 break-words transition-all duration-200 hover:shadow-lg hover:border-green-400 focus-within:ring-2 focus-within:ring-green-300"
                              style={{ minWidth: '100px', maxWidth: '180px' }}
                            >
                              <span className="font-semibold text-green-700">{s.metaDescription}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {!isManagerViewOnly && (
                          <td className="p-3 align-top text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => startEdit(s)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
                              >
                                <TbEdit /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingId(s._id);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                              >
                                <RiDeleteBin6Line /> Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t bg-white p-3 flex-wrap">
              <p className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => page > 1 && setPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                {getPaginationRange(page, totalPages, 1).map((p, i) =>
                  p === '...' ? (
                    <span key={i} className="px-2 text-gray-500">…</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPage(Number(p))}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${p === page ? 'bg-blue-600 text-white' : ''}`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => page < totalPages && setPage(page + 1)}
                  disabled={page === totalPages}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    value={goToPageInput}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                    className="w-16 rounded-lg border px-2 py-1 text-sm"
                    placeholder="Go to"
                  />
                  <button
                    onClick={() => goToPage(goToPageInput)}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
     
      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <Modal title="Add Subcategory" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Subcategory Name" value={formName} onChange={setFormName} required />
              <Input label="Image URL" value={formImageUrl} onChange={setFormImageUrl} />
              <select name="mappedParent" required className="w-full rounded-lg border px-3 py-2">
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.main_cat_name}</option>
                ))}
              </select>
              {/* Meta Title with AI & scrollable */}
              <div className="relative max-h-16 overflow-y-auto border rounded-xl bg-white shadow-sm p-2 flex items-center">
                <input
                  value={formMetaTitle}
                  onChange={e => setFormMetaTitle(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  type="text"
                  placeholder="Meta Title"
                />
                <button
                  type="button"
                  className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.metaTitle ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.metaTitle}
                  onClick={() => rewriteWithAI('metaTitle', formName, setFormMetaTitle)}
                >{aiLoading.metaTitle ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              {/* Meta Keywords with AI & scrollable */}
              <div className="relative max-h-16 overflow-y-auto border rounded-xl bg-white shadow-sm p-2 flex items-center">
                <input
                  value={formMetaKeyword}
                  onChange={e => setFormMetaKeyword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  type="text"
                  placeholder="Meta Keywords"
                />
                <button
                  type="button"
                  className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.metaKeyword ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.metaKeyword}
                  onClick={() => rewriteWithAI('metaKeyword', formName, setFormMetaKeyword)}
                >{aiLoading.metaKeyword ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              {/* Meta Description with AI & scrollable */}
              <div className="relative max-h-32 overflow-y-auto border rounded-xl bg-white shadow-sm p-2">
                <textarea
                  value={formMetaDescription}
                  onChange={e => setFormMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent outline-none resize-none text-base"
                  placeholder="Meta Description"
                />
                <button
                  type="button"
                  className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.metaDescription ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.metaDescription}
                  onClick={() => rewriteWithAI('metaDescription', formName, setFormMetaDescription)}
                >{aiLoading.metaDescription ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              {/* Description with AI & scrollable */}
              <div className="relative max-h-40 overflow-y-auto border rounded-xl bg-white shadow-sm p-2">
                <ReactTextEditor value={formDescription} onChange={setFormDescription} />
                <button
                  type="button"
                  className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.description ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.description}
                  onClick={() => rewriteWithAI('description', formName, setFormDescription)}
                >{aiLoading.description ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-4 py-2">Cancel</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  <LuPlus /> Create
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showEditModal && (
          <Modal title="Edit Subcategory" onClose={() => setShowEditModal(false)}>
            <div className="space-y-4">
              <Input label="Subcategory Name" value={formName} onChange={setFormName} />
              <select name="mappedParent" required className="w-full rounded-lg border px-3 py-2">
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.main_cat_name}</option>
                ))}
              </select>
              {/* Meta Title with AI & scrollable */}
              <div className="relative max-h-16 overflow-y-auto border rounded-xl bg-white shadow-sm p-2 flex items-center">
                <input
                  value={formMetaTitle}
                  onChange={e => setFormMetaTitle(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  type="text"
                  placeholder="Meta Title"
                />
                <button
                  type="button"
                  className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.metaTitle ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.metaTitle}
                  onClick={() => rewriteWithAI('metaTitle', formName, setFormMetaTitle)}
                >{aiLoading.metaTitle ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              {/* Meta Keywords with AI & scrollable */}
              <div className="relative max-h-16 overflow-y-auto border rounded-xl bg-white shadow-sm p-2 flex items-center">
                <input
                  value={formMetaKeyword}
                  onChange={e => setFormMetaKeyword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  type="text"
                  placeholder="Meta Keywords"
                />
                <button
                  type="button"
                  className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.metaKeyword ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.metaKeyword}
                  onClick={() => rewriteWithAI('metaKeyword', formName, setFormMetaKeyword)}
                >{aiLoading.metaKeyword ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              {/* Meta Description with AI & scrollable */}
              <div className="relative max-h-32 overflow-y-auto border rounded-xl bg-white shadow-sm p-2">
                <textarea
                  value={formMetaDescription}
                  onChange={e => setFormMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent outline-none resize-none text-base"
                  placeholder="Meta Description"
                />
                <button
                  type="button"
                  className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.metaDescription ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.metaDescription}
                  onClick={() => rewriteWithAI('metaDescription', formName, setFormMetaDescription)}
                >{aiLoading.metaDescription ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              {/* Description with AI & scrollable */}
              <div className="relative max-h-40 overflow-y-auto border rounded-xl bg-white shadow-sm p-2">
                <ReactTextEditor value={formDescription} onChange={setFormDescription} />
                <button
                  type="button"
                  className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiLoading.description ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={aiLoading.description}
                  onClick={() => rewriteWithAI('description', formName, setFormDescription)}
                >{aiLoading.description ? 'Rewriting...' : 'Rewrite with AI'}</button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg border px-4 py-2">Cancel</button>
                <button onClick={saveEdit} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
                  <LuSave /> Save
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showDeleteModal && (
          <Modal title="Delete Subcategory" onClose={() => setShowDeleteModal(false)}>
            <p className="mb-4 text-gray-600">Are you sure you want to delete this subcategory?</p>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={() => setShowDeleteModal(false)} className="rounded-lg border px-4 py-2">Cancel</button>
              <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">
                <RiDeleteBin6Line /> Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------- Reusable components -----------------
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  >
    <div className="relative bg-white rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-y-auto p-6 flex-1">{children}</div>
    </div>
  </motion.div>
);

const Input = ({ label, value, onChange, required = false }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) => (
  <label className="block text-sm">
    <span className="block text-gray-700 mb-1">{label}</span>
    <input
      required={required}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
    />
  </label>
);

const Textarea = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="block text-sm">
    <span className="block text-gray-700 mb-1">{label}</span>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
      rows={4}
    />
  </label>
);

const SkeletonRow = () => (
  <tr className="animate-pulse border-t">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="p-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
    ))}
  </tr>
);
