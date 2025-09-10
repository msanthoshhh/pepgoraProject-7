'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { getPaginationRange } from '@/components/GetPage';
import axiosInstance from '../../lib/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { MdImageNotSupported } from 'react-icons/md';
import { TbEdit } from 'react-icons/tb';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { LuSave, LuPlus } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import ReactTextEditor from '@/components/RichTextEditor';
import { ListVideo } from 'lucide-react';

// ---- Types ----

type Category = {
  _id: string;
  main_cat_name: string;
  metaTitle?: string;
  metaKeyword?: string;
  metaDescription?: string;
  imageUrl?: string;
  liveUrl?: string;
  metaChildren?: string[];
  description?: string;
};

type TokenPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

export default function CategoriesPage() {
  // Sidebar collapse state for responsive layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // ---- Data & Auth ----
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // ---- Modal + Selection State ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // ---- Create form ----
  const [name, setName] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaKeyword, setMetaKeyword] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [freeText, setFreeText] = useState('');


  // ---- Edit form ----
  const [editForm, setEditForm] = useState({
    name: '',
    metaTitle: '',
    metaKeyword: '',
    metaDescription: '',
    description: '',
    liveUrl: ''
  });
  // ---- AI Rewrite Loading State ----
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingCreate, setAiLoadingCreate] = useState(false);
  const [aiFieldLoading, setAiFieldLoading] = useState({ metaTitle: false, metaKeyword: false, metaDescription: false, description: false });
  const [aiFieldLoadingCreate, setAiFieldLoadingCreate] = useState({ metaTitle: false, metaKeyword: false, metaDescription: false, description: false });

  // ---- DeepSeek Field Rewrite Handler (Edit) ----
  const handleAIFieldRewrite = async (field: keyof typeof editForm) => {
    if (!editForm.name) {
      toast.error('Please enter a category name first.');
      return;
    }
    setAiFieldLoading((prev) => ({ ...prev, [field]: true }));
    try {
      // SYSTEM/USER prompt for DeepSeek
      const prompt = `USER: Create content for:\n- Page type: Category\n- Name: ${editForm.name}\n- URL: ${editForm.liveUrl}\n- Markets: INDIA/GCC COUNTRIES/AFRICA\n- Trust signals: https://www.pepagora.com/en/s/trust\n- Languages: {LANGS}\n\nData sources (use in priority order):\nKeywords: {KEYWORDS_JSON}\n\nOUTPUT (return VALID JSON):\n{\n  "keywords": { "head": ["..."], "long_tail": ["..."], "variants": ["..."] },\n  "by_lang": {\n    "<lang>": {\n      "intro_html": "<h1>{PAGE_NAME}</h1><p>120-180 words covering what it is, key use-cases, core specs. Weave 2-3 head terms + long-tails naturally.</p>",\n      "faqs": [{"question": "?", "answer_html": "<p>2-3 sentences</p>"}], // 5-8 items\n      "llm_text": "50-70 words factual 
      // summary",\n      "meta": {"title": "≤60 chars", "description": "150-160 chars"},\n      "schema": {"faqpage_jsonld": {...}, "breadcrumb_jsonld": {...}, "itemlist_or_product_jsonld": {...}},\n      "links_html": "<nav aria-label=\"Related\">...</nav>"\n    }\n  }\n}\n\nRULES: Prefer supplied data. Weave keywords naturally. Clean HTML. Vendor-neutral. One H1 only.`;
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert B2B content strategist for Pepagora.com. Create SEO + LLM-optimized content for a Category / subcategory / product category page. Write concise, factual, globally readable copy. Use supplied data first; only generalize with industry knowledge if data is missing. Avoid unverified claims.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 256
        },
        {
          headers: {
            'Authorization': `Bearer sk-25f236c2be3a42d49914b903ff908670`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiText = response.data.choices?.[0]?.message?.content || '';
      setEditForm((prev) => ({ ...prev, [field]: aiText.trim() }));
      toast.success(`${field} rewritten with AI!`);
    } catch (err) {
      toast.error('AI rewrite failed.');
      console.error('AI error:', err);
    } finally {
      setAiFieldLoading((prev) => ({ ...prev, [field]: false }));
    }
  };

  // ---- DeepSeek Field Rewrite Handler (Add) ----
  const handleAIFieldRewriteCreate = async (field: 'metaTitle' | 'metaKeyword' | 'metaDescription' | 'description') => {
    if (!name) {
      toast.error('Please enter a category name first.');
      return;
    }
    setAiFieldLoadingCreate((prev) => ({ ...prev, [field]: true }));
    try {
      // SYSTEM/USER prompt for DeepSeek
      const prompt = `USER: Create content for:\n- Page type: Category\n- Name: ${name}\n- URL: ${imageUrl || ''}\n- Markets: INDIA/GCC COUNTRIES/AFRICA\n- Trust signals: https://www.pepagora.com/en/s/trust\n- Languages: {LANGS}\n\nData sources (use in priority order):\nKeywords: {KEYWORDS_JSON}\n\nOUTPUT (return VALID JSON):\n{\n  "keywords": { "head": ["..."], "long_tail": ["..."], "variants": ["..."] },\n  "by_lang": {\n    "<lang>": {\n      "intro_html": "<h1>{PAGE_NAME}</h1><p>120-180 words covering what it is, key use-cases, core specs. Weave 2-3 head terms + long-tails naturally.</p>",\n      "faqs": [{"question": "?", "answer_html": "<p>2-3 sentences</p>"}], // 5-8 items\n      "llm_text": "50-70 words factual summary",\n      "meta": {"title": "≤60 chars", "description": "150-160 chars"},\n      "schema": {"faqpage_jsonld": {...}, "breadcrumb_jsonld": {...}, "itemlist_or_product_jsonld": {...}},\n      "links_html": "<nav aria-label=\"Related\">...</nav>"\n    }\n  }\n}\n\nRULES: Prefer supplied data. Weave keywords naturally. Clean HTML. Vendor-neutral. One H1 only.`;
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert B2B content strategist for Pepagora.com. Create SEO + LLM-optimized content for a Category / subcategory / product category page. Write concise, factual, globally readable copy. Use supplied data first; only generalize with industry knowledge if data is missing. Avoid unverified claims.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 256
        },
        {
          headers: {
            'Authorization': `Bearer sk-25f236c2be3a42d49914b903ff908670`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiText = response.data.choices?.[0]?.message?.content || '';
      if (field === 'metaTitle') setMetaTitle(aiText.trim());
      if (field === 'metaKeyword') setMetaKeyword(aiText.trim());
      if (field === 'metaDescription') setMetaDescription(aiText.trim());
      if (field === 'description') setFreeText(aiText.trim());
      toast.success(`${field} rewritten with AI!`);
    } catch (err) {
      toast.error('AI rewrite failed.');
      console.error('AI error:', err);
    } finally {
      setAiFieldLoadingCreate((prev) => ({ ...prev, [field]: false }));
    }
  };
  // ---- AI Rewrite Handler for Edit ----
  const handleAIRewrite = async () => {
    if (!editForm.name) {
      toast.error('Please enter a category name first.');
      return;
    }
    setAiLoading(true);
    try {
      const prompt = `Rewrite the following category details for SEO.\nCategory Name: ${editForm.name}\nGenerate:\n- Meta Title\n- Meta Keywords\n- Meta Description\n- Description (short paragraph)`;
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert SEO content writer.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 512
        },
        {
          headers: {
            'Authorization': `Bearer sk-25f236c2be3a42d49914b903ff908670`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiText = response.data.choices?.[0]?.message?.content || '';
      const metaTitleMatch = aiText.match(/Meta Title\s*[:\-]?\s*(.*)/i);
      const metaKeywordMatch = aiText.match(/Meta Keywords?\s*[:\-]?\s*(.*)/i);
      const metaDescriptionMatch = aiText.match(/Meta Description\s*[:\-]?\s*(.*)/i);
      const descriptionMatch = aiText.match(/Description\s*[:\-]?\s*([\s\S]*)/i);
      setEditForm((prev) => ({
        ...prev,
        metaTitle: metaTitleMatch ? metaTitleMatch[1].trim() : prev.metaTitle,
        metaKeyword: metaKeywordMatch ? metaKeywordMatch[1].trim() : prev.metaKeyword,
        metaDescription: metaDescriptionMatch ? metaDescriptionMatch[1].trim() : prev.metaDescription,
        description: descriptionMatch ? descriptionMatch[1].trim() : prev.description
      }));
      toast.success('Fields rewritten with AI!');
    } catch (err) {
      toast.error('AI rewrite failed.');
      console.error('AI error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // ---- AI Rewrite Handler for Add ----
  const handleAIRewriteCreate = async () => {
    if (!name) {
      toast.error('Please enter a category name first.');
      return;
    }
    setAiLoadingCreate(true);
    try {
      const prompt = `Rewrite the following category details for SEO.\nCategory Name: ${name}\nGenerate:\n- Meta Title\n- Meta Keywords\n- Meta Description\n- Description (short paragraph)`;
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert SEO content writer.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 512
        },
        {
          headers: {
            'Authorization': `Bearer sk-25f236c2be3a42d49914b903ff908670`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiText = response.data.choices?.[0]?.message?.content || '';
      const metaTitleMatch = aiText.match(/Meta Title\s*[:\-]?\s*(.*)/i);
      const metaKeywordMatch = aiText.match(/Meta Keywords?\s*[:\-]?\s*(.*)/i);
      const metaDescriptionMatch = aiText.match(/Meta Description\s*[:\-]?\s*(.*)/i);
      const descriptionMatch = aiText.match(/Description\s*[:\-]?\s*([\s\S]*)/i);
      setMetaTitle(metaTitleMatch ? metaTitleMatch[1].trim() : metaTitle);
      setMetaKeyword(metaKeywordMatch ? metaKeywordMatch[1].trim() : metaKeyword);
      setMetaDescription(metaDescriptionMatch ? metaDescriptionMatch[1].trim() : metaDescription);
      setFreeText(descriptionMatch ? descriptionMatch[1].trim() : freeText);
      toast.success('Fields rewritten with AI!');
    } catch (err) {
      toast.error('AI rewrite failed.');
      console.error('AI error:', err);
    } finally {
      setAiLoadingCreate(false);
    }
  };

  // ---- Pagination ----
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const router = useRouter();

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


  useEffect(() => {
    fetchCategories(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ---- API calls ----
  const fetchCategories = async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/categories', {
        params: { page: currentPage, limit },
      });
      const data = Array.isArray(res.data.data.data) ? res.data.data.data : [];
      setCategories(data);
      console.log(data);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/categories/${id}`);
      if (res.status === 200) {
        toast.success('Category deleted successfully!');
      }
      if (categories.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchCategories(page);
      }
    } catch (err) {
      toast.error('Failed to delete category');
      console.error('Delete failed:', err);
    }
  };

  const openEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setEditForm({
      name: cat.main_cat_name,
      metaTitle: cat.metaTitle || '',
      metaKeyword: cat.metaKeyword || '',
      metaDescription: cat.metaDescription || '',
      description: cat.description || '',
      liveUrl: cat.liveUrl || ''
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!selectedCategory) return;
    try {
      const payload = {
        main_cat_name: editForm.name,
        metaTitle: editForm.metaTitle,
        metaDescription: editForm.metaDescription,
        metaKeyword: editForm.metaKeyword,
        description: editForm.description,

      };
      const res = await axiosInstance.put(`/categories/${selectedCategory._id}`, payload);
      if (res.status === 200) {
        toast.success(`Category ${editForm.name} updated successfully!`);
        setShowEditModal(false);
        setSelectedCategory(null);
        fetchCategories(page);
      } else {
        toast.error('Failed to update category');
      }
    } catch (err) {
      toast.error('Failed to update category');
      console.error('Update failed:', err);
    }
  };

  const resetCreateForm = () => {
    setName('');
    setMetaTitle('');
    setMetaKeyword('');
    setMetaDescription('');
    setImageUrl('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        main_cat_name: name,
        metaTitle,
        metaDescription,
        metaKeyword,
        imageUrl,
        description: freeText

      };
      const res = await axiosInstance.post('/categories', payload);
      if (res.status === 201) {
        toast.success('Category created successfully!');
        setShowCreateModal(false);
        resetCreateForm();
        fetchCategories(page);
      } else {
        toast.error('Failed to create category');
      }
    } catch (err) {
      console.error('Failed to create category', err);
      toast.error('Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isManagerViewOnly = useMemo(() => userRole === 'pepagora_manager', [userRole]);

  // ---- UI helpers ----
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[140px]">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );

  const HeaderBar = (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Categories</h1>
        <p className="text-gray-500 text-sm">Create, edit and manage your product categories.</p>
      </div>
      {!isManagerViewOnly && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <LuPlus className="text-lg" />
          Add Category
        </button>
      )}
    </div>
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-3">
        <div className="h-12 w-12 rounded-lg bg-gray-200" />
      </td>
      {[...Array(4)].map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 w-48 rounded bg-gray-200" />
        </td>
      ))}
      {!isManagerViewOnly && (
        <td className="p-3">
          <div className="h-8 w-32 rounded bg-gray-200" />
        </td>
      )}
    </tr>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-60'} p-6 md:p-8`}>
        <div className="mx-auto max-w-7xl space-y-6">
          {HeaderBar}

          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            <Stat label="Total Categories" value={categories.length} />
            <Stat label="Page" value={`${page} / ${totalPages}`} />
          </div>

          {/* Table Card */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <tr>
                    <th className="p-3">Image</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Meta Title</th>
                    <th className="p-3">Meta Keywords</th>
                    <th className="p-3">Meta Description</th>
                    {!isManagerViewOnly && <th className="p-3 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <>
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <SkeletonRow key={idx} />
                      ))}
                    </>
                  )}

                  {!loading && categories.length === 0 && (
                    <tr>
                      <td colSpan={isManagerViewOnly ? 5 : 6} className="p-10 text-center text-gray-500">
                        No categories found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    categories.map((cat, index) => (
                      <tr
                        key={cat._id}
                        className={`border-t transition-colors hover:bg-blue-50/40 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* Image */}
                        <td className="p-3 align-top">
                          {cat.imageUrl ? (
                            <a href={cat.imageUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={cat.imageUrl}
                                alt={cat.main_cat_name}
                                className="h-14 w-14 rounded-lg object-cover shadow-sm"
                              />
                            </a>
                          ) : (
                            <MdImageNotSupported className="h-14 w-14 text-gray-300" />
                          )}
                        </td>

                        {/* Category */}
                        <td className="p-3 align-top">
                          <div className="font-medium text-gray-900">{cat.main_cat_name}</div>
                          {cat.metaChildren && cat.metaChildren.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">{cat.metaChildren.length} sub items</div>
                          )}
                        </td>

                        {/* Meta Title - Scrollable */}
                        <td className="p-3 align-top">
                          <div
                            className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md p-2 text-xs text-blue-900 break-words transition-all duration-200 hover:shadow-lg hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-300"
                            style={{ minWidth: '120px', maxWidth: '220px' }}
                          >
                            <span className="font-semibold text-blue-700">{cat.metaTitle || '-'}</span>
                          </div>
                        </td>

                        {/* Meta Keywords - Scrollable */}
                        <td className="p-3 align-top">
                          <div
                            className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-white shadow-md p-2 text-xs text-purple-900 break-words transition-all duration-200 hover:shadow-lg hover:border-purple-400 focus-within:ring-2 focus-within:ring-purple-300"
                            style={{ minWidth: '100px', maxWidth: '180px' }}
                          >
                            <span className="font-semibold text-purple-700">{cat.metaKeyword || '-'}</span>
                          </div>
                        </td>

                        {/* Meta Description - Scrollable */}
                        <td className="p-3 align-top max-w-sm">
                          <div
                            className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-white shadow-md p-2 text-xs text-green-900 break-words transition-all duration-200 hover:shadow-lg hover:border-green-400 focus-within:ring-2 focus-within:ring-green-300"
                            style={{ minWidth: '100px', maxWidth: '180px' }}
                          >
                            <span className="font-semibold text-green-700">{cat.metaDescription || '-'}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        {!isManagerViewOnly && (
                          <td className="p-3 align-top">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEdit(cat)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white shadow-sm hover:bg-emerald-700"
                              >
                                <TbEdit /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCategory(cat);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-white shadow-sm hover:bg-rose-700"
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

            {/* Footer / Pagination */}
            <div className="flex items-center justify-between gap-3 border-t bg-white p-3 flex-wrap">
              <p className="text-sm text-gray-600">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => page > 1 && setPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                {getPaginationRange(page, totalPages, 1).map((p: number | string, idx: number) =>
                  p === '...' ? (
                    <span key={idx} className="px-2 text-gray-500">…</span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => setPage(Number(p))}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${p === page ? 'bg-blue-600 text-white' : ''}`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => page < totalPages && setPage(page + 1)}
                  disabled={page === totalPages}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---- Modals ---- */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)} title="Add Category">
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Category Name" value={name} onChange={setName} required />
                <Input label="Image URL" value={imageUrl} onChange={setImageUrl} />
                {/* Meta Title Scrollable Box */}
                <div className="relative mb-4 col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                  <div className="border rounded-xl bg-white shadow-sm p-2 max-h-16 overflow-x-auto flex items-center">
                    <input
                      value={metaTitle}
                      onChange={e => setMetaTitle(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-base"
                      type="text"
                      placeholder="Meta Title"
                    />
                    <button
                      type="button"
                      title="Let AI rewrite this field for SEO"
                      onClick={() => handleAIFieldRewriteCreate('metaTitle')}
                      className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoadingCreate.metaTitle ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={aiFieldLoadingCreate.metaTitle}
                    >
                      {aiFieldLoadingCreate.metaTitle ? 'Rewriting...' : 'Rewrite with AI'}
                    </button>
                  </div>
                </div>
                {/* Meta Keywords Scrollable Box */}
                <div className="relative mb-4 col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                  <div className="border rounded-xl bg-white shadow-sm p-2 max-h-16 overflow-x-auto flex items-center">
                    <input
                      value={metaKeyword}
                      onChange={e => setMetaKeyword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-base"
                      type="text"
                      placeholder="Meta Keywords"
                    />
                    <button
                      type="button"
                      title="Let AI rewrite this field for SEO"
                      onClick={() => handleAIFieldRewriteCreate('metaKeyword')}
                      className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoadingCreate.metaKeyword ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={aiFieldLoadingCreate.metaKeyword}
                    >
                      {aiFieldLoadingCreate.metaKeyword ? 'Rewriting...' : 'Rewrite with AI'}
                    </button>
                  </div>
                </div>
              </div>
              {/* Meta Description Scrollable Box */}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <div className="border rounded-xl bg-white shadow-sm p-2 max-h-32 overflow-y-auto">
                  <textarea
                    value={metaDescription}
                    onChange={e => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent outline-none resize-none text-base"
                    placeholder="Meta Description"
                  />
                  <button
                    type="button"
                    title="Let AI rewrite this field for SEO"
                    onClick={() => handleAIFieldRewriteCreate('metaDescription')}
                    className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoadingCreate.metaDescription ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={aiFieldLoadingCreate.metaDescription}
                  >
                    {aiFieldLoadingCreate.metaDescription ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
              </div>
              {/* Description Scrollable Box */}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="border rounded-xl bg-white shadow-sm p-2 max-h-40 overflow-y-auto">
                  <ReactTextEditor value={freeText} onChange={setFreeText} />
                  <button
                    type="button"
                    title="Let AI rewrite this field for SEO"
                    onClick={() => handleAIFieldRewriteCreate('description')}
                    className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoadingCreate.description ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={aiFieldLoadingCreate.description}
                  >
                    {aiFieldLoadingCreate.description ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
              </div>
              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border px-4 py-2 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700"
                >
                  <LuPlus /> Create
                </button>
              </div>
            </form>


          </Modal>
        )}

        {showEditModal && selectedCategory && (
          <Modal onClose={() => setShowEditModal(false)} title="Edit Category">
            <div className="space-y-4">
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-xl bg-white shadow-sm p-2 outline-none text-base"
                  type="text"
                  placeholder="Category Name"
                />
              </div>
              {/* Meta Title Scrollable Box */}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <div className="border rounded-xl bg-white shadow-sm p-2 max-h-16 overflow-x-auto flex items-center">
                  <input
                    value={editForm.metaTitle}
                    onChange={e => setEditForm({ ...editForm, metaTitle: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-base"
                    type="text"
                    placeholder="Meta Title"
                  />
                  <button
                    type="button"
                    title="Let AI rewrite this field for SEO"
                    onClick={() => handleAIFieldRewrite('metaTitle')}
                    className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoading.metaTitle ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={aiFieldLoading.metaTitle}
                  >
                    {aiFieldLoading.metaTitle ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
              </div>
              {/* Meta Keywords Scrollable Box */}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                <div className="border rounded-xl bg-white shadow-sm p-2 max-h-16 overflow-x-auto flex items-center">
                  <input
                    value={editForm.metaKeyword}
                    onChange={e => setEditForm({ ...editForm, metaKeyword: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-base"
                    type="text"
                    placeholder="Meta Keywords"
                  />
                  <button
                    type="button"
                    title="Let AI rewrite this field for SEO"
                    onClick={() => handleAIFieldRewrite('metaKeyword')}
                    className={`ml-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoading.metaKeyword ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={aiFieldLoading.metaKeyword}
                  >
                    {aiFieldLoading.metaKeyword ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
              </div>
              {/* Meta Description Scrollable Box */}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <div className="border rounded-xl bg-white shadow-sm p-2 max-h-32 overflow-y-auto">
                  <textarea
                    value={editForm.metaDescription}
                    onChange={e => setEditForm({ ...editForm, metaDescription: e.target.value })}
                    rows={3}
                    className="w-full bg-transparent outline-none resize-none text-base"
                    placeholder="Meta Description"
                  />
                  <button
                    type="button"
                    title="Let AI rewrite this field for SEO"
                    onClick={() => handleAIFieldRewrite('metaDescription')}
                    className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoading.metaDescription ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={aiFieldLoading.metaDescription}
                  >
                    {aiFieldLoading.metaDescription ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
              </div>
              {/* Description Scrollable Box */}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="border rounded-xl bg-white shadow-sm p-2 max-h-40 overflow-y-auto">
                  <ReactTextEditor value={editForm.description} onChange={v => setEditForm({ ...editForm, description: v })} />
                  <button
                    type="button"
                    title="Let AI rewrite this field for SEO"
                    onClick={() => handleAIFieldRewrite('description')}
                    className={`absolute top-2 right-2 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 ${aiFieldLoading.description ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={aiFieldLoading.description}
                  >
                    {aiFieldLoading.description ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowEditModal(false)} className="rounded-lg border px-4 py-2">
                  Cancel
                </button>
                <button onClick={saveEdit} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
                  <LuSave /> Save
                </button>
              </div>
            </div>
          </Modal>

        )}

        {showDeleteModal && selectedCategory && (
          <Modal onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
            <p className="text-gray-600">Are you sure you want to delete <span className="font-medium text-gray-900">{selectedCategory.main_cat_name}</span>? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="rounded-lg border px-4 py-2">Cancel</button>
              <button
                onClick={async () => {
                  await handleDelete(selectedCategory._id);
                  setShowDeleteModal(false);
                  setSelectedCategory(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
              >
                <RiDeleteBin6Line /> Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Reusable UI bits ----

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-[101] w-full max-w-2xl rounded-2xl border bg-white shadow-xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}


function Input({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">{label}{required && <span className="text-rose-600"> *</span>}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        type="text"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-y rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
      />
    </label>
  );
}