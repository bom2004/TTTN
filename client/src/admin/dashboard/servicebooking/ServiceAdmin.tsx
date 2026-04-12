import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import { useAppDispatch, useAppSelector } from '../../../lib/redux/store';
import {
  fetchCategoriesThunk,
  fetchServicesThunk,
  createCategoryThunk,
  updateCategoryThunk,
  deleteCategoryThunk,
  createServiceThunk,
  updateServiceThunk,
  deleteServiceThunk,
  selectAllCategories,
  selectAllServices,
  selectServiceLoading,
  ServiceCategory as Category,
  ServiceItem
} from '../../../lib/redux/reducers/service';

const emptyCategory = { name: '', description: '' };
const emptyItem = { name: '', price: '', unit: 'Phần', image: '', isAvailable: true };

// ─── Reusable Modal Shell ───────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden shadow-blue-500/10">
      <div className="flex justify-between items-center px-8 py-5 border-b border-[#e5e9eb] dark:border-slate-700">
        <h2 className="text-xl font-black text-[#2c2f31] dark:text-slate-100">{title}</h2>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f7f9] dark:hover:bg-slate-700 text-2xl text-[#747779] transition-all">&times;</button>
      </div>
      <div className="p-8">{children}</div>
    </div>
  </div>
);

// ─── Field component ────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-semibold text-[#2c2f31] dark:text-slate-100 focus:outline-none focus:border-[#0050d4] transition-all";

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const ServiceAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAllCategories);
  const items = useAppSelector(selectAllServices);
  const loading = useAppSelector(selectServiceLoading);

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [catEdit, setCatEdit] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(emptyCategory);

  // Item modal
  const [itemModal, setItemModal] = useState(false);
  const [itemEdit, setItemEdit] = useState<ServiceItem | null>(null);
  const [itemForm, setItemForm] = useState(emptyItem);

  // Delete confirm
  const [delTarget, setDelTarget] = useState<{ type: 'cat' | 'item'; id: string; name: string } | null>(null);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (activeCategory) {
      dispatch(fetchServicesThunk(activeCategory._id));
    } else {
      dispatch(fetchServicesThunk()); // Tải tất cả dịch vụ khi ở chế độ xem danh mục
    }
  }, [activeCategory, dispatch]);

  // ─── Thống kê ───
  const globalStats = {
    totalCats: categories.length,
    totalItems: items.length,
    activeItems: items.filter((i: ServiceItem) => i.isAvailable).length,
    inactiveItems: items.filter((i: ServiceItem) => !i.isAvailable).length,
  };

  // ─── Category CRUD ────────────────────────────────────────────────────────
  const openCatModal = (cat?: Category) => {
    setCatEdit(cat || null);
    setCatForm(cat ? { name: cat.name, description: cat.description || '' } : emptyCategory);
    setCatModal(true);
  };

  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (catEdit) {
        await dispatch(updateCategoryThunk({ id: catEdit._id, data: catForm })).unwrap();
        toast.success('Cập nhật danh mục thành công');
      } else {
        await dispatch(createCategoryThunk(catForm)).unwrap();
        toast.success('Thêm danh mục thành công');
      }
      setCatModal(false);
    } catch (err: any) { toast.error(err || 'Lỗi'); }
  };

  // ─── Item CRUD ────────────────────────────────────────────────────────────
  const openItemModal = (item?: ServiceItem) => {
    setItemEdit(item || null);
    setItemForm(item
      ? { name: item.name, price: String(item.price), unit: item.unit, image: item.image || '', isAvailable: item.isAvailable }
      : emptyItem
    );
    setItemModal(true);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) return;
    const payload = { ...itemForm, price: Number(itemForm.price), categoryId: activeCategory._id };
    try {
      if (itemEdit) {
        await dispatch(updateServiceThunk({ id: itemEdit._id, data: payload })).unwrap();
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        await dispatch(createServiceThunk(payload)).unwrap();
        toast.success('Thêm dịch vụ thành công');
      }
      setItemModal(false);
    } catch (err: any) { toast.error(err || 'Lỗi'); }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    try {
      if (delTarget.type === 'cat') {
        await dispatch(deleteCategoryThunk(delTarget.id)).unwrap();
        setActiveCategory(null);
      } else {
        await dispatch(deleteServiceThunk(delTarget.id)).unwrap();
      }
      toast.success(`Đã xóa "${delTarget.name}"`);
      setDelTarget(null);
    } catch (err: any) { toast.error(err || 'Lỗi khi xóa'); }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const availableCount = items.filter((i: ServiceItem) => i.isAvailable).length;

  useEffect(() => { setCurrentPage(1); }, [activeCategory]);

  return (
    <div className="p-6 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100">Quản lý dịch vụ</h2>
            <p className="text-[#595c5e] dark:text-slate-400 mt-1 text-sm">
              {activeCategory
                ? <span className="flex items-center gap-2">
                  <button onClick={() => setActiveCategory(null)} className="text-[#0050d4] hover:underline font-bold">Tất cả danh mục</button>
                  <span className="text-[#abadaf]">/</span>
                  <span className="font-bold">{activeCategory.name}</span>
                </span>
                : 'Quản lý danh mục và dịch vụ tiêu dùng trong phòng'
              }
            </p>
          </div>
          <button
            onClick={() => activeCategory ? openItemModal() : openCatModal()}
            className="bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            {activeCategory ? 'Thêm món dịch vụ' : 'Thêm danh mục'}
          </button>
        </div>

        {/* ── VIEW 1: Category List ── */}
        {!activeCategory && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Tổng danh mục', value: globalStats.totalCats, icon: 'category', color: 'text-[#0050d4] bg-blue-50' },
                { label: 'Tổng dịch vụ', value: globalStats.totalItems, icon: 'room_service', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Đang hoạt động', value: globalStats.activeItems, icon: 'check_circle', color: 'text-green-600 bg-green-50' },
                { label: 'Tạm ngưng', value: globalStats.inactiveItems, icon: 'pause_circle', color: 'text-amber-600 bg-amber-50' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${s.color}`}>
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">{s.label}</p>
                    <p className="text-2xl font-black text-[#2c2f31] dark:text-slate-100">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Cards */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-[#e5e9eb] dark:border-slate-700">
                <h3 className="font-black text-[#2c2f31] dark:text-slate-100">Danh sách danh mục</h3>
                <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5">Nhấn vào một danh mục để quản lý các món dịch vụ bên trong</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-[#abadaf]">
                  <span className="material-symbols-outlined animate-spin text-4xl mr-3">progress_activity</span>
                  <span className="font-semibold">Đang tải...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#abadaf] dark:text-slate-500 gap-3">
                  <span className="material-symbols-outlined text-5xl">category</span>
                  <p className="font-semibold">Chưa có danh mục nào. Hãy thêm mới!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {categories.map((cat: Category) => (
                    <div
                      key={cat._id}
                      onClick={() => setActiveCategory(cat)}
                      className="group relative bg-[#f5f7f9] dark:bg-slate-900 border-2 border-transparent hover:border-[#0050d4] rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-[#0050d4]/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0050d4]/10 to-[#0050d4]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0050d4]" style={{ fontVariationSettings: "'FILL' 1" }}>room_service</span>
                          </div>
                          <div>
                            <p className="font-black text-[#2c2f31] dark:text-slate-100">{cat.name}</p>
                            <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 line-clamp-1">{cat.description || 'Không có mô tả'}</p>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openCatModal(cat)}
                            className="p-1.5 rounded-lg hover:bg-[#eef1f3] dark:hover:bg-slate-700 text-[#747779] hover:text-[#0050d4] transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => setDelTarget({ type: 'cat', id: cat._id, name: cat.name })}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#747779] hover:text-red-600 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                      {/* Arrow indicator */}
                      <div className="mt-4 flex items-center justify-end text-xs font-bold text-[#0050d4] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Xem & quản lý món</span>
                        <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── VIEW 2: Item List for selected category ── */}
        {activeCategory && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Tổng món', value: items.length, icon: 'restaurant_menu', color: 'text-[#0050d4] bg-blue-50' },
                { label: 'Đang bán', value: availableCount, icon: 'check_circle', color: 'text-green-600 bg-green-50' },
                { label: 'Tạm hết', value: items.length - availableCount, icon: 'remove_circle', color: 'text-red-500 bg-red-50' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${s.color}`}>
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">{s.label}</p>
                    <p className="text-2xl font-black text-[#2c2f31] dark:text-slate-100">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Item Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-[#e5e9eb] dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#2c2f31] dark:text-slate-100">Danh sách món — <span className="text-[#0050d4]">{activeCategory.name}</span></h3>
                  <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5">Hiển thị {currentItems.length} trên tổng số {items.length} món</p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#abadaf] dark:text-slate-500 gap-3">
                  <span className="material-symbols-outlined text-5xl">restaurant_menu</span>
                  <p className="font-semibold">Chưa có món nào. Thêm món đầu tiên!</p>
                  <button onClick={() => openItemModal()} className="mt-2 px-5 py-2.5 bg-[#0050d4] text-white rounded-xl font-bold text-sm hover:bg-[#0046bb] transition-all">
                    + Thêm món ngay
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#eef1f3]/50 dark:bg-slate-900/50">
                          {['Tên dịch vụ', 'Đơn giá', 'Đơn vị', 'Trạng thái', 'Hành động'].map(h => (
                            <th key={h} className="px-6 py-4 text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                        {currentItems.map((item: ServiceItem) => (
                          <tr key={item._id} className="hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#eef1f3] dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-[#abadaf]">
                                  {item.image
                                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    : <span className="material-symbols-outlined text-xl">restaurant</span>
                                  }
                                </div>
                                <span className="font-bold text-[#2c2f31] dark:text-slate-100 text-sm">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-black text-[#0050d4] dark:text-blue-400">
                                {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-[#595c5e] dark:text-slate-400 font-semibold">{item.unit}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${item.isAvailable
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                {item.isAvailable ? 'Đang bán' : 'Tạm hết'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <button onClick={() => openItemModal(item)} className="p-2 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg text-[#747779] hover:text-[#0050d4] transition-all">
                                  <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button onClick={() => setDelTarget({ type: 'item', id: item._id, name: item.name })} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#747779] hover:text-red-600 transition-all">
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[#e5e9eb] dark:border-slate-700 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-700 text-[#747779] disabled:opacity-30 hover:bg-[#f5f7f9] transition-all"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${currentPage === i + 1
                              ? 'bg-[#0050d4] text-white'
                              : 'bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-700 text-[#747779] hover:bg-[#f5f7f9]'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-700 text-[#747779] disabled:opacity-30 hover:bg-[#f5f7f9] transition-all"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Category Modal ── */}
      {catModal && (
        <Modal title={catEdit ? 'Sửa danh mục' : 'Thêm danh mục mới'} onClose={() => setCatModal(false)}>
          <form onSubmit={saveCat} className="space-y-4">
            <Field label="Tên danh mục *">
              <input required className={inputCls} placeholder="Vd: Đồ ăn" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Mô tả">
              <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Mô tả ngắn..." value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCatModal(false)} className="flex-1 py-3 bg-[#f5f7f9] dark:bg-slate-700 text-[#4e5c71] dark:text-slate-200 font-black rounded-xl hover:bg-[#eef1f3] transition-all border border-slate-200 dark:border-slate-600">Hủy</button>
              <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white font-black rounded-xl shadow-lg shadow-[#0050d4]/20 hover:scale-[1.01] active:scale-[0.98] transition-all">
                {catEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Item Modal ── */}
      {itemModal && (
        <Modal title={itemEdit ? 'Sửa dịch vụ' : `Thêm món vào "${activeCategory?.name}"`} onClose={() => setItemModal(false)}>
          <form onSubmit={saveItem} className="space-y-4">
            <Field label="Tên món *">
              <input required className={inputCls} placeholder="Vd: Mì xào bò" value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Đơn giá (₫) *">
                <input required type="number" min={0} className={inputCls} placeholder="50000" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} />
              </Field>
              <Field label="Đơn vị *">
                <select className={inputCls} value={itemForm.unit} onChange={e => setItemForm(p => ({ ...p, unit: e.target.value }))}>
                  {['Phần', 'Lon', 'Chai', 'Cái', 'Bộ', 'Gói', 'Tô', 'Đĩa'].map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Ảnh (URL)">
              <input className={inputCls} placeholder="https://..." value={itemForm.image} onChange={e => setItemForm(p => ({ ...p, image: e.target.value }))} />
            </Field>
            <Field label="Trạng thái">
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => setItemForm(p => ({ ...p, isAvailable: val }))}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${itemForm.isAvailable === val ? (val ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600') : 'border-[#d9dde0] dark:border-slate-600 text-[#747779]'}`}>
                    {val ? '✓ Đang bán' : '✕ Tạm hết'}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setItemModal(false)} className="flex-1 py-3 bg-[#f5f7f9] dark:bg-slate-700 text-[#4e5c71] dark:text-slate-200 font-black rounded-xl hover:bg-[#eef1f3] transition-all border border-slate-200 dark:border-slate-600">Hủy</button>
              <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white font-black rounded-xl shadow-lg shadow-[#0050d4]/20 hover:scale-[1.01] active:scale-[0.98] transition-all">
                {itemEdit ? 'Lưu thay đổi' : 'Thêm món'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        isOpen={!!delTarget}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa "${delTarget?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
};

export default ServiceAdmin;
