'use client';
export const dynamic = "force-dynamic";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getPaginationRange } from '@/components/GetPage';
import axiosInstance from '../../lib/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import RichTextEditor from '@/components/RichTextEditor';
import { MdImageNotSupported } from 'react-icons/md';
import { TbEdit } from 'react-icons/tb';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { LuPlus } from 'react-icons/lu';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import FilterSidebar from '@/components/FilterSideBar';
import Loader from "@/components/Loader";

type Product = {
  _id: string;
  name: string;
  metaTitle?: string;
  metaKeyword?: string;
  metaDescription?: string;
  imageUrl?: string;
  description?: string;
  mappedParent?: {         // subcategory
    _id: string;
    sub_cat_name: string;
    mappedParent?: {      // category
      _id: string;
      main_cat_name: string;
    };
  };

};

type Category = {
  _id: string;
  main_cat_name: string;
  metaTitle?: string;
  metaKeyword?: string;
  metaDescription?: string;
  imageUrl?: string;
  description?: string;
}
type Subcategory = {
  _id: string;
  sub_cat_name: string;
  mappedParent?: string;

};

type TokenPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

function SkeletonRow() {
  return (
    <tr className="border-t">
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-8" /></td>
      <td className="p-3"><div className="h-10 w-10 bg-gray-200 rounded" /></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-80" /></td>
      <td className="p-3" />
    </tr>
  );
}

export default function ProductsPage() {
  const router = useRouter();

  // data
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // filter selections
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);


  // paging & search
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [goToPageInput, setGoToPageInput] = useState<string>('');

  // auth/role
  const [userRole, setUserRole] = useState<string | null>(null);
  const isManagerViewOnly = useMemo(() => userRole === 'pepagora_manager', [userRole]);

  // modals & editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // form states (add/edit)
  const [formName, setFormName] = useState('');
  const [formMappedParent, setFormMappedParent] = useState<string | null>(null);
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaKeyword, setFormMetaKeyword] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // DeepSeek AI loading state
  const [aiLoadingField, setAiLoadingField] = useState<string | null>(null);

  // DeepSeek AI handler
  async function handleRewriteAI(field: 'metaTitle' | 'metaKeyword' | 'metaDescription' | 'description') {
    setAiLoadingField(field);
    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
      const apiUrl = process.env.NEXT_PUBLIC_DEEPSEEK_URL || 'https://api.deepseek.com/v1/chat/completions';
      let prompt = '';
      switch (field) {
        case 'metaTitle':
          prompt = `Rewrite a professional SEO meta title for product: ${formName}`;
          break;
        case 'metaKeyword':
          prompt = `Generate SEO meta keywords for product: ${formName}`;
          break;
        case 'metaDescription':
          prompt = `Rewrite a professional SEO meta description for product: ${formName}`;
          break;
        case 'description':
          prompt = `Rewrite a professional product description for: ${formName}`;
          break;
      }
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const aiText = data.choices?.[0]?.message?.content || '';
      if (field === 'metaTitle') setFormMetaTitle(aiText);
      if (field === 'metaKeyword') setFormMetaKeyword(aiText);
      if (field === 'metaDescription') setFormMetaDescription(aiText);
      if (field === 'description') setFormDescription(aiText);
    } catch (err) {
      toast.error('AI rewrite failed');
    } finally {
      setAiLoadingField(null);
    }
  }


  // const searchParams = useSearchParams();
    // const [token, setToken] = useState<string | null>(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;



  // const categoryId = searchParams.get("category");
  // const subcategoryId = searchParams.get("subcategory");
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);



  // when categories change, update filtered subcategories
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredSubcategories(subcategories);
    } else {
      setFilteredSubcategories(
        subcategories.filter(s => selectedCategories.includes(s.mappedParent || ''))
      );
    }

    // clear selected subcategories if not in filtered
    setSelectedSubcategories(prev => prev.filter(sid =>
      filteredSubcategories.some(s => s._id === sid)
    ));
  }, [selectedCategories, subcategories]);

  useEffect(() => {
  if (typeof window !== "undefined") {
    // const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded: TokenPayload = jwtDecode(token);
        setUserRole(decoded.role);
      } catch {
        console.error("Invalid token");
      }
    }
  }
}, []);


  // fetch subcategories for dropdown
  useEffect(()=>{
    const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);   
      const res = await axiosInstance.get('/categories', { params: { limit: 1000 } }); // fetch list for dropdown
      const items = Array.isArray(res.data.data.data) ? res.data.data.data : [];
      setCategories(items);
    } catch (err) {
      console.error('fetchCategories', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }; fetchCategories();
}, []);


useEffect(()=>{
  const fetchSubcategories = async () => {
    try {
      const res = await axiosInstance.get('/subcategories', { params: { limit: 1000 } }); // fetch list for dropdown
      const items = Array.isArray(res.data.data.data) ? res.data.data.data : [];
      setSubcategories(items);
    } catch (err) {
      console.error('fetchSubcategories', err);
      setSubcategories([]);
    }
  };
  fetchSubcategories();

},[])

  // fetch products (server-side search + pagination)
  const fetchProducts = async (pageToFetch = page) => {
    setLoading(true);
    try {
      setProductsLoading(true);
      let endpoint = "/products"; // default
      const params: any = {
        page: pageToFetch,
        limit,
        search: searchQuery || undefined,
      };

      if (selectedCategories.length > 0 || selectedSubcategories.length > 0) {
        endpoint = "/products/filter"; // use filter route
        // if (selectedCategories.length > 0) {
        //   params.categories = selectedCategories.join(",");
        // }
        if (selectedSubcategories.length > 0) {
          params.subcategories = selectedSubcategories.join(",");
        }
      }

      const res = await axiosInstance.get(endpoint, { params });

      const items = Array.isArray(res.data.data.data) ? res.data.data.data : [];
      const pagination = res.data.data.pagination || {};

      console.log("vgbhjn", res.data.data.data);

      setProducts(items);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.totalItems || items.length || 0);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setProductsLoading(false);

    }
  };



  // effects
  useEffect(() => { fetchProducts(page); /* eslint-disable-next-line */ }, [page, searchQuery]);

  // create
  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    try {
      setLoading(true);
      await axiosInstance.post('/products', {
        name: formName, // required
        mappedParent: formMappedParent || undefined, // only send if selected
        imageUrl: formImageUrl || undefined,         // only send if not empty
        metaTitle: formMetaTitle || undefined,
        metaKeyword: formMetaKeyword || undefined,
        metaDescription: formMetaDescription || undefined,
        description: formDescription || undefined,
      });

      toast.success('Product created');
      setShowAddModal(false);

      // reset form
      setFormName('');
      setFormMappedParent(''); // <-- use empty string instead of null
      setFormMetaTitle('');
      setFormMetaKeyword('');
      setFormMetaDescription('');
      setFormImageUrl('');
      setFormDescription('');

      // reload
      setPage(1);
      fetchProducts(1);
    } catch (err: any) {
      console.error("Error adding product:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  // start edit
  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setFormName(p.name || '');
    setFormMappedParent(
      typeof p.mappedParent === 'string'
        ? p.mappedParent
        : p.mappedParent?._id || null
    );
    setFormMetaTitle(p.metaTitle || '');
    setFormMetaKeyword(p.metaKeyword || '');
    setFormMetaDescription(p.metaDescription || '');
    setFormImageUrl(p.imageUrl || '');
    setFormDescription(p.description || '');
    setShowEditModal(true);
  };

  // save edit
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setLoading(true);

      const payload = {
        name: formName, // Always include name for update
        mappedParent: formMappedParent || undefined,
        imageUrl: formImageUrl || undefined,
        metaTitle: formMetaTitle || undefined,
        metaKeyword: formMetaKeyword || undefined,
        metaDescription: formMetaDescription || undefined,
        description: formDescription || undefined,
      };

      await axiosInstance.put(`/products/${editingId}`, payload);

      toast.success("Product updated successfully!");
      setShowEditModal(false);
      setEditingId(null);
      fetchProducts(page);
    } catch (err: any) {
      console.error("Update failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };


  // delete
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/products/${deletingId}`);
      toast.success('Deleted');
      setShowDeleteModal(false);
      setDeletingId(null);
      // if last item on page was deleted, move back page
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
        fetchProducts(page - 1);
      } else {
        fetchProducts(page);
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // search handler (server-side)
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
    fetchProducts(p);
  };

  const tooLong = (s?: string) => (s ? s.length > 120 : false);

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main className={collapsed ? "ml-20 p-6 md:p-8" : "ml-60 p-6 md:p-8"}>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-500 text-sm">Create, edit and manage products (matches Subcategories UI).</p>

            </div>
            <div className="flex gap-2">
              {!isManagerViewOnly && (
                <button
                  onClick={() => {
                    setFormName(''); setFormMappedParent(null); setFormMetaTitle(''); setFormMetaKeyword(''); setFormMetaDescription(''); setFormImageUrl(''); setFormDescription('');
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
                >
                  <LuPlus /> Add Product
                </button>


              )}

              <FilterSidebar
                categories={categories.map(cat => ({
                  _id: cat._id,
                  main_cat_name: cat.main_cat_name,
                  subcategories: subcategories
                    .filter(sub => sub.mappedParent === cat._id)
                    .map(sub => ({
                      _id: sub._id,
                      name: sub.sub_cat_name,
                    })),
                }))}
                selectedCategories={selectedCategories}
                selectedSubcategories={selectedSubcategories}
                setSelectedCategories={setSelectedCategories}
                setSelectedSubcategories={setSelectedSubcategories}
                onApply={() => fetchProducts(1)} // apply filters
                onReset={() => {
                  setSelectedCategories([]);
                  setSelectedSubcategories([]);
                  fetchProducts(1);
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[140px]">
              <p className="text-xs text-gray-500">Total Products</p>
              <p className="text-xl font-semibold text-gray-800">{totalItems}</p>
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-4 min-w-[140px]">
              <p className="text-xs text-gray-500">Page</p>
              <p className="text-xl font-semibold text-gray-800">{page} / {totalPages}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {/* Search */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="🔍 Search products..."
                className="w-64 rounded-lg border px-3 py-1.5 text-sm"
              />
            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <tr>
                    <th className="p-3">S. NO</th>
                    <th className="p-3">Image</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Meta Title</th>
                    <th className="p-3">Meta Keywords</th>
                    <th className="p-3">Meta Description</th>
                    {!isManagerViewOnly && <th className="p-3 text-center">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                  {!loading && products.length === 0 && (
                    <tr>
                      <td colSpan={isManagerViewOnly ? 6 : 7} className="p-6 text-center text-gray-500">No products found.</td>
                    </tr>
                  )}

                  {!loading && products.map((prod, idx) => (
                    <tr key={prod._id} className={`border-t hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-3 align-top">{(page - 1) * limit + idx + 1}</td>
                      <td className="p-3 align-top">
                        {prod.imageUrl ? (
                          <a href={prod.imageUrl} target="_blank" rel="noreferrer">
                            <img src={prod.imageUrl} alt={prod.name} className="h-14 w-14 rounded-lg object-cover shadow-sm" />
                          </a>
                        ) : (
                          <MdImageNotSupported className="h-14 w-14 text-gray-300" />
                        )}
                      </td>
                      <td>{prod.mappedParent?.mappedParent?.main_cat_name || '-'}</td>
                      <td>{prod.mappedParent?.sub_cat_name || '-'}</td>
                      <td className="p-3 align-top font-medium text-gray-900">{prod.name}</td>
                      <td className="p-3 align-top">
                        {prod.metaTitle ? (
                          <div
                            className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md p-2 text-xs text-blue-900 break-words transition-all duration-200 hover:shadow-lg hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-300"
                            style={{ minWidth: '120px', maxWidth: '220px' }}
                          >
                            <span className="font-semibold text-blue-700">{prod.metaTitle}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        {prod.metaKeyword ? (
                          <div
                            className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-white shadow-md p-2 text-xs text-purple-900 break-words transition-all duration-200 hover:shadow-lg hover:border-purple-400 focus-within:ring-2 focus-within:ring-purple-300"
                            style={{ minWidth: '100px', maxWidth: '180px' }}
                          >
                            <span className="font-semibold text-purple-700">{prod.metaKeyword}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 align-top max-w-sm">
                        {prod.metaDescription ? (
                          <div
                            className="max-h-12 min-h-[2.5rem] overflow-y-auto border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-white shadow-md p-2 text-xs text-green-900 break-words transition-all duration-200 hover:shadow-lg hover:border-green-400 focus-within:ring-2 focus-within:ring-green-300"
                            style={{ minWidth: '100px', maxWidth: '180px' }}
                          >
                            <span className="font-semibold text-green-700">{tooLong(prod.metaDescription) ? prod.metaDescription.slice(0, 120) + '...' : prod.metaDescription}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {!isManagerViewOnly && (
                        <td className="p-3 align-top text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => startEdit(prod)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"><TbEdit /> Edit</button>
                            <button onClick={() => { setDeletingId(prod._id); setShowDeleteModal(true); }} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"><RiDeleteBin6Line /> Delete</button>
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
              <p className="text-sm text-gray-600">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></p>

              <div className="flex items-center gap-2">
                <button onClick={() => page > 1 && setPage(page - 1)} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>

                {getPaginationRange(page, totalPages, 1).map((p, i) =>
                  p === '...' ? <span key={i} className="px-2">…</span> : (
                    <button key={i} onClick={() => setPage(Number(p))} className={`rounded-lg border px-3 py-1.5 text-sm ${p === page ? 'bg-blue-600 text-white' : ''}`}>{p}</button>
                  )
                )}

                <button onClick={() => page < totalPages && setPage(page + 1)} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>

                <div className="flex items-center gap-1 ml-2">
                  <input type="number" value={goToPageInput} onChange={(e) => setGoToPageInput(e.target.value)} className="w-16 rounded-lg border px-2 py-1 text-sm" placeholder="Go to" />
                  <button onClick={() => goToPage(goToPageInput)} className="rounded-lg border px-3 py-1.5 text-sm">Go</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- Modals ---------- */}
      <AnimatePresence>
        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Add Product</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="Product Name" />
                <select value={formMappedParent ?? ''} onChange={(e) => setFormMappedParent(e.target.value || null)} className="w-full rounded-lg border px-3 py-2">
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.map(s => <option key={s._id} value={s._id}>{s.sub_cat_name}</option>)}
                </select>
                <div className="relative">
                  <input value={formMetaTitle} onChange={(e) => setFormMetaTitle(e.target.value)} placeholder="Meta Title" className="w-full rounded-lg border px-3 py-2 pr-32" />
                  <button type="button" onClick={() => handleRewriteAI('metaTitle')} className="absolute right-2 top-2 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='metaTitle'}>
                    {aiLoadingField==='metaTitle' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
                <div className="relative">
                  <input value={formMetaKeyword} onChange={(e) => setFormMetaKeyword(e.target.value)} placeholder="Meta Keywords" className="w-full rounded-lg border px-3 py-2 pr-32" />
                  <button type="button" onClick={() => handleRewriteAI('metaKeyword')} className="absolute right-2 top-2 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='metaKeyword'}>
                    {aiLoadingField==='metaKeyword' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
                <div className="relative">
                  <textarea value={formMetaDescription} onChange={(e) => setFormMetaDescription(e.target.value)} placeholder="Meta Description" className="w-full rounded-lg border px-3 py-2 pr-32" rows={3} />
                  <button type="button" onClick={() => handleRewriteAI('metaDescription')} className="absolute right-2 top-2 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='metaDescription'}>
                    {aiLoadingField==='metaDescription' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
                <input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="Image URL" className="w-full rounded-lg border px-3 py-2" />
                <label className="block text-sm relative">
                  <span className="block text-gray-700 mb-1">Description</span>
                  <RichTextEditor value={formDescription} onChange={setFormDescription} />
                  <button type="button" onClick={() => handleRewriteAI('description')} className="absolute right-2 top-0 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='description'}>
                    {aiLoadingField==='description' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-4 py-2">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="Product Name" />
                <select value={formMappedParent ?? ''} onChange={(e) => setFormMappedParent(e.target.value || null)} className="w-full rounded-lg border px-3 py-2">
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.map(s => <option key={s._id} value={s._id}>{s.sub_cat_name}</option>)}
                </select>

                <div className="relative">
                  <input value={formMetaTitle} onChange={(e) => setFormMetaTitle(e.target.value)} placeholder="Meta Title" className="w-full rounded-lg border px-3 py-2 pr-32" />
                  <button type="button" onClick={() => handleRewriteAI('metaTitle')} className="absolute right-2 top-2 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='metaTitle'}>
                    {aiLoadingField==='metaTitle' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
                <div className="relative">
                  <input value={formMetaKeyword} onChange={(e) => setFormMetaKeyword(e.target.value)} placeholder="Meta Keywords" className="w-full rounded-lg border px-3 py-2 pr-32" />
                  <button type="button" onClick={() => handleRewriteAI('metaKeyword')} className="absolute right-2 top-2 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='metaKeyword'}>
                    {aiLoadingField==='metaKeyword' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
                <div className="relative">
                  <textarea value={formMetaDescription} onChange={(e) => setFormMetaDescription(e.target.value)} placeholder="Meta Description" className="w-full rounded-lg border px-3 py-2 pr-32" rows={3} />
                  <button type="button" onClick={() => handleRewriteAI('metaDescription')} className="absolute right-2 top-2 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='metaDescription'}>
                    {aiLoadingField==='metaDescription' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </div>
                {/* <input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="Image URL" className="w-full rounded-lg border px-3 py-2" /> */}
                <label className="block text-sm relative">
                  <span className="block text-gray-700 mb-1">Description</span>
                  <RichTextEditor value={formDescription} onChange={setFormDescription} />
                  <button type="button" onClick={() => handleRewriteAI('description')} className="absolute right-2 top-0 bg-gray-100 text-xs px-3 py-1 rounded-lg border hover:bg-blue-100" disabled={aiLoadingField==='description'}>
                    {aiLoadingField==='description' ? 'Rewriting...' : 'Rewrite with AI'}
                  </button>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingId(null); }} className="rounded-lg border px-4 py-2">Cancel</button>
                  <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
              <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
              <p className="mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => { setShowDeleteModal(false); setDeletingId(null); }} className="rounded-lg border px-4 py-2">Cancel</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
