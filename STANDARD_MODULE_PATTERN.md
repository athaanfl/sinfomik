# 📐 Standard Pattern untuk Semua Modul

## Template Standar yang Harus Diikuti

### 1. **Import Statements**
```javascript
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin'; // atau guruApi
import Button from '../../components/Button';
import Table from '../../components/Table';
import ModuleContainer from '../../components/ModuleContainer';
import PageHeader from '../../components/PageHeader';
import FormSection from '../../components/FormSection';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import EmptyState from '../../components/EmptyState';
```

### 2. **Structure Modul**
```javascript
const ModuleName = () => {
  // States
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAdd = async (e) => {
    e.preventDefault();
    // Add logic
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item) => {
    setDeleteConfirm({ show: true, item });
  };

  const confirmDelete = async () => {
    // Delete logic
    setDeleteConfirm({ show: false, item: null });
  };

  return (
    <ModuleContainer>
      <PageHeader
        icon="icon-name"
        title="Module Title"
        subtitle="Module description"
        badge={`${data.length} Items`}
      />

      <StatusMessage
        type={messageType}
        message={message}
        onClose={() => setMessage('')}
      />

      {/* Form Add Section */}
      <FormSection title="Add New" icon="plus" variant="success">
        <form onSubmit={handleAdd}>
          {/* Form fields */}
          <Button type="submit" variant="success" fullWidth>
            Add
          </Button>
        </form>
      </FormSection>

      {/* Data List Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-list mr-2 text-indigo-600"></i>
          Data List
        </h2>

        {loading && <LoadingSpinner text="Loading..." />}
        {error && <StatusMessage type="error" message={error} autoClose={false} />}
        
        {!loading && !error && data.length === 0 && (
          <EmptyState
            icon="inbox"
            title="No Data"
            description="No data available"
          />
        )}

        {!loading && !error && data.length > 0 && (
          <Table
            columns={[
              { key: 'id', label: 'ID', sortable: true },
              { key: 'name', label: 'Name', sortable: true },
            ]}
            data={data}
            actions={(item) => (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" variant="primary" icon="edit" onClick={() => handleEdit(item)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" icon="trash-alt" onClick={() => handleDelete(item)}>
                  Delete
                </Button>
              </div>
            )}
          />
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <EditModal
          item={selectedItem}
          onClose={() => setShowEditModal(false)}
          onSave={fetchData}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Item"
        message={`Are you sure you want to delete this item?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, item: null })}
      />
    </ModuleContainer>
  );
};
```

### 3. **Edit Modal Pattern**
```javascript
const EditModal = ({ item, onClose, onSave }) => {
  const [edited, setEdited] = useState({ ...item });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.updateItem(edited.id, edited);
      setMessage('Success!');
      setMessageType('success');
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slideInUp">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Edit Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <StatusMessage type={messageType} message={message} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form fields with form-group class */}
          <div className="form-group">
            <label>Field Name</label>
            <input
              type="text"
              value={edited.field}
              onChange={(e) => setEdited({ ...edited, field: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🎨 Styling Guidelines

### Form Fields
```jsx
<div className="form-group">
  <label>
    <i className="fas fa-icon mr-2 text-gray-500"></i>
    Label Text
  </label>
  <input type="text" placeholder="Placeholder" />
</div>
```

### Button Actions (Mobile Responsive)
```jsx
<div className="flex flex-col sm:flex-row gap-2">
  <Button size="sm" variant="primary">Edit</Button>
  <Button size="sm" variant="danger">Delete</Button>
</div>
```

### Sections with Spacing
```jsx
<div className="mb-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Section Title
  </h2>
  {/* Content */}
</div>
```

---

## 📱 Responsive Classes

### Grid Layouts
```jsx
// 1 column mobile, 2 columns tablet+
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 1 column mobile, 3 columns desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
```

### Flex Direction
```jsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">
```

### Hide/Show Elements
```jsx
// Hide on mobile
<span className="hidden md:inline">Text</span>

// Show only on mobile
<span className="md:hidden">Mobile Text</span>
```

---

## 🎯 Icons to Use

- **User**: `fa-user`, `fa-user-graduate`, `fa-users`
- **Teacher**: `fa-chalkboard-teacher`, `fa-user-tie`
- **Class**: `fa-door-open`, `fa-school`
- **Course**: `fa-book`, `fa-book-open`
- **Grade**: `fa-star`, `fa-chart-bar`
- **Calendar**: `fa-calendar-alt`, `fa-clock`
- **Edit**: `fa-edit`, `fa-pen`
- **Delete**: `fa-trash-alt`, `fa-times`
- **Add**: `fa-plus`, `fa-plus-circle`
- **Save**: `fa-save`, `fa-check`
- **Analytics**: `fa-chart-line`, `fa-chart-pie`
- **Settings**: `fa-cog`, `fa-sliders-h`

---

## 📝 Checklist untuk Setiap Modul

- [ ] Import semua komponen yang dibutuhkan
- [ ] Gunakan ModuleContainer sebagai wrapper
- [ ] PageHeader dengan icon, title, subtitle, badge
- [ ] StatusMessage untuk feedback
- [ ] FormSection dengan variant yang sesuai
- [ ] LoadingSpinner saat loading
- [ ] EmptyState jika data kosong
- [ ] Table dengan kolom sortable
- [ ] Action buttons responsive (flex-col sm:flex-row)
- [ ] ConfirmDialog untuk delete
- [ ] Edit modal dengan loading state
- [ ] Semua form menggunakan class "form-group"
- [ ] Mobile-friendly dengan breakpoints yang tepat

---

## 🎨 Color Variants

- **Success**: Green - untuk add/create actions
- **Primary**: Indigo - untuk edit/update actions
- **Danger**: Red - untuk delete actions
- **Warning**: Yellow - untuk caution actions
- **Info**: Blue - untuk informational content

---

## ✅ Contoh Lengkap

Lihat file `student.js` yang sudah di-refactor sebagai contoh implementasi lengkap!

