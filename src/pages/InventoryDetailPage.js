import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemsByList, createItems, updateItem, addQty, addUsed, deleteItem } from '../services/inventoryService';
import { getAllLists } from '../services/inventoryService';

function InventoryDetailPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [qtyForm, setQtyForm] = useState({ quantity: 0, notes: '' });
  const [usedForm, setUsedForm] = useState({ quantity: 0, notes: '' });
  const [editForm, setEditForm] = useState({});

  // Excel-like rows for adding multiple items
  const emptyRow = { name: '', category: '', qtyIn: 0, unit: '', unitCost: 0, supplier: '', photoUrl: '', notes: '', condition: 'Good' };
  const [rows, setRows] = useState([{ ...emptyRow }]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchData = async () => {
    try {
      const [itemsRes, listsRes] = await Promise.all([
        getItemsByList(listId),
        getAllLists(),
      ]);
      setItems(itemsRes.data);
      const found = listsRes.data.find(l => l._id === listId);
      setList(found);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] = value;
    setRows(updated);
  };

  const handleSaveItems = async () => {
    try {
      const validRows = rows.filter(r => r.name.trim() !== '');
      const itemsToSave = validRows.map(r => ({ ...r, inventoryList: listId }));
      await createItems({ items: itemsToSave });
      setShowAddModal(false);
      setRows([{ ...emptyRow }]);
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddQty = async () => {
    try {
      await addQty(selectedItem._id, qtyForm);
      setShowQtyModal(false);
      setQtyForm({ quantity: 0, notes: '' });
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddUsed = async () => {
    try {
      await addUsed(selectedItem._id, usedForm);
      setShowUsedModal(false);
      setUsedForm({ quantity: 0, notes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating usage');
    }
  };

  const handleEdit = async () => {
    try {
      await updateItem(editForm._id, editForm);
      setShowEditModal(false);
      setEditForm({});
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      await deleteItem(id);
      fetchData();
    }
  };

  const remainingColor = (item) => {
    const pct = item.qtyIn === 0 ? 100 : ((item.qtyIn - item.used) / item.qtyIn) * 100;
    return pct <= 20 ? '#c62828' : pct <= 50 ? '#f57f17' : '#2e7d32';
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={styles.backBtn} onClick={() => navigate('/inventory')}>← Back</button>
          <div>
            <h1 style={styles.title}>{list?.projectName || 'Inventory Detail'}</h1>
            <p style={styles.subtitle}>{list?.location} · {items.length} items</p>
          </div>
        </div>
        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Add Items</button>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Items', value: items.length, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Total Qty In', value: items.reduce((s, i) => s + i.qtyIn, 0), color: '#1565c0', bg: '#e3f2fd' },
          { label: 'Total Used', value: items.reduce((s, i) => s + i.used, 0), color: '#c62828', bg: '#fce4ec' },
          { label: 'Total Remaining', value: items.reduce((s, i) => s + (i.qtyIn - i.used), 0), color: '#2e7d32', bg: '#e8f5e9' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Items Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Item', 'Photo', 'Category', 'Qty In', 'Used', 'Remaining', 'Unit', 'Unit Cost', 'Supplier', 'Notes', 'Actions'].map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                  No items yet — click "+ Add Items" to get started
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={item._id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#2d1b4e' }}>{item.name}</td>
                  <td style={styles.td}>
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={item.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: '#ede8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                    )}
                  </td>
                  <td style={{ ...styles.td, color: '#888' }}>{item.category || '—'}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#1565c0' }}>{item.qtyIn}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#c62828' }}>{item.used}</td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 700, color: remainingColor(item) }}>{item.qtyIn - item.used}</span>
                  </td>
                  <td style={{ ...styles.td, color: '#888' }}>{item.unit || '—'}</td>
                  <td style={{ ...styles.td, color: '#c9a84c', fontWeight: 600 }}>GH₵ {item.unitCost?.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#888' }}>{item.supplier || '—'}</td>
                  <td style={{ ...styles.td, color: '#888', fontSize: 13, maxWidth: 150 }}>{item.notes || '—'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={styles.qtyBtn} onClick={() => { setSelectedItem(item); setShowQtyModal(true); }}>+ Qty</button>
                        <button style={styles.usedBtn} onClick={() => { setSelectedItem(item); setShowUsedModal(true); }}>+ Used</button>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={styles.editBtn} onClick={() => { setEditForm(item); setShowEditModal(true); }}>Edit</button>
                        <button style={styles.removeBtn} onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Items Modal - Excel Style */}
      {showAddModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 900 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Items to {list?.projectName}</h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Item Name', 'Category', 'Qty In', 'Unit', 'Unit Cost', 'Supplier', 'Photo URL', 'Notes', 'Condition', ''].map(col => (
                      <th key={col} style={{ ...styles.th, background: '#f5f0eb', padding: '10px 8px', fontSize: 10 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.cellTd}><input style={styles.cellInput} value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder='e.g. Cement' /></td>
                      <td style={styles.cellTd}><input style={styles.cellInput} value={row.category} onChange={e => updateRow(i, 'category', e.target.value)} placeholder='e.g. Materials' /></td>
                      <td style={styles.cellTd}><input type='number' style={styles.cellInput} value={row.qtyIn} onChange={e => updateRow(i, 'qtyIn', e.target.value)} /></td>
                      <td style={styles.cellTd}><input style={styles.cellInput} value={row.unit} onChange={e => updateRow(i, 'unit', e.target.value)} placeholder='e.g. Bags' /></td>
                      <td style={styles.cellTd}><input type='number' style={styles.cellInput} value={row.unitCost} onChange={e => updateRow(i, 'unitCost', e.target.value)} /></td>
                      <td style={styles.cellTd}><input style={styles.cellInput} value={row.supplier} onChange={e => updateRow(i, 'supplier', e.target.value)} /></td>
                      <td style={styles.cellTd}><input style={styles.cellInput} value={row.photoUrl} onChange={e => updateRow(i, 'photoUrl', e.target.value)} placeholder='https://...' /></td>
                      <td style={styles.cellTd}><input style={styles.cellInput} value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} /></td>
                      <td style={styles.cellTd}>
                        <select style={styles.cellInput} value={row.condition} onChange={e => updateRow(i, 'condition', e.target.value)}>
                          {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={styles.cellTd}>
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button style={styles.addRowBtn} onClick={addRow}>+ Add Row</button>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSaveItems}>Save All Items</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Qty Modal */}
      {showQtyModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add to Qty — {selectedItem?.name}</h2>
              <button style={styles.closeBtn} onClick={() => setShowQtyModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Quantity to Add</label>
              <input type='number' style={styles.input} value={qtyForm.quantity} onChange={e => setQtyForm({ ...qtyForm, quantity: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes (e.g. New delivery from supplier)</label>
              <input style={styles.input} value={qtyForm.notes} onChange={e => setQtyForm({ ...qtyForm, notes: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowQtyModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleAddQty}>Add Quantity</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Used Modal */}
      {showUsedModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Record Usage — {selectedItem?.name}</h2>
              <button style={styles.closeBtn} onClick={() => setShowUsedModal(false)}>✕</button>
            </div>
            <div style={{ background: '#fff8e1', borderRadius: 8, padding: '10px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#f57f17' }}>Remaining: </span>
              <span style={{ fontWeight: 700, color: '#f57f17' }}>{selectedItem?.qtyIn - selectedItem?.used} {selectedItem?.unit}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Quantity Used</label>
              <input type='number' style={styles.input} value={usedForm.quantity} onChange={e => setUsedForm({ ...usedForm, quantity: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes (e.g. Foundation work - Block A)</label>
              <input style={styles.input} value={usedForm.notes} onChange={e => setUsedForm({ ...usedForm, notes: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowUsedModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleAddUsed}>Record Usage</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Item</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>Item Name</label>
                <input style={styles.input} value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Category</label>
                <input style={styles.input} value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Unit</label>
                <input style={styles.input} value={editForm.unit || ''} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Unit Cost (GH₵)</label>
                <input type='number' style={styles.input} value={editForm.unitCost || ''} onChange={e => setEditForm({ ...editForm, unitCost: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Supplier</label>
                <input style={styles.input} value={editForm.supplier || ''} onChange={e => setEditForm({ ...editForm, supplier: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Condition</label>
                <select style={styles.input} value={editForm.condition || 'Good'} onChange={e => setEditForm({ ...editForm, condition: e.target.value })}>
                  {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Photo URL</label>
              <input style={styles.input} value={editForm.photoUrl || ''} onChange={e => setEditForm({ ...editForm, photoUrl: e.target.value })} placeholder='https://...' />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes</label>
              <textarea rows={2} style={{ ...styles.input, resize: 'vertical' }} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f0eb', padding: '40px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#5c3d8f' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  subtitle: { color: '#999', marginTop: 4, fontSize: 13 },
  backBtn: { background: '#ede8f5', color: '#5c3d8f', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  addBtn: { background: '#5c3d8f', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { padding: '20px 24px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', borderBottom: '1px solid #f0eaf8', background: '#faf8ff' },
  td: { padding: '14px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle', fontSize: 14 },
  cellTd: { padding: '4px' },
  cellInput: { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e0d8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  addRowBtn: { background: '#ede8f5', color: '#5c3d8f', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 16 },
  qtyBtn: { padding: '5px 10px', borderRadius: 6, border: 'none', background: '#e3f2fd', color: '#1565c0', fontWeight: 600, fontSize: 11, cursor: 'pointer' },
  usedBtn: { padding: '5px 10px', borderRadius: 6, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 11, cursor: 'pointer' },
  editBtn: { padding: '5px 10px', borderRadius: 6, border: '1px solid #ede8f5', background: '#fff', color: '#5c3d8f', fontWeight: 600, fontSize: 11, cursor: 'pointer' },
  removeBtn: { padding: '5px 10px', borderRadius: 6, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 11, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formLabel: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c3d8f', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default InventoryDetailPage;