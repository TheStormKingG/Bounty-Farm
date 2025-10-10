import React, { useState } from 'react';
import { Flock } from '../types';

interface Breed {
  breed_name: string;
  breed_code: string;
}

interface AddFlockFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (flockData: Partial<Flock>) => Promise<void>;
  breeds: Breed[];
}

const AddFlockForm: React.FC<AddFlockFormProps> = ({ isVisible, onClose, onSave, breeds }) => {
  const [formData, setFormData] = useState<Partial<Flock>>({
    flockNumber: '',
    flockName: '',
    supplier: '',
    breed: '',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      // Reset form after successful save
      setFormData({
        flockNumber: '',
        flockName: '',
        supplier: '',
        breed: '',
        remarks: '',
      });
      onClose();
    } catch (error) {
      console.error('Error saving flock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      flockNumber: '',
      flockName: '',
      supplier: '',
      breed: '',
      remarks: '',
    });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="modern-modal fixed inset-0 flex items-center justify-center z-50">
      <div className="modern-modal-content p-8 w-full max-w-md">
        <h3 className="heading-tertiary text-[#333333] mb-6">Add New Flock</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-2">Flock Number *</label>
            <input
              type="text"
              name="flockNumber"
              value={formData.flockNumber || ''}
              onChange={handleInputChange}
              className="modern-input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-2">Flock Name</label>
            <input
              type="text"
              name="flockName"
              value={formData.flockName || ''}
              onChange={handleInputChange}
              className="modern-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-2">Supplier *</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier || ''}
              onChange={handleInputChange}
              className="modern-input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-2">Breed</label>
            <select
              name="breed"
              value={formData.breed || ''}
              onChange={handleInputChange}
              className="modern-select w-full"
            >
              <option value="">Select Breed</option>
              {breeds.map((breed) => (
                <option key={breed.breed_code} value={breed.breed_name}>
                  {breed.breed_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-2">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks || ''}
              onChange={handleInputChange}
              className="modern-input w-full"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t border-[#F5F0EE]">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary px-6 py-3"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Flock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFlockForm;
