import { pb } from '../pocketbase';
import type { Submission } from '@/types';
import { validateSubmissionStatus, validateRecordId } from '../validation';
import { sanitizeError } from '../error-handler';
import { validateImageFile, createFormDataWithImage, getImageFileFromRecord } from '../pocketbase-images';
import { mosquesApi } from './mosques';

export const submissionsApi = {
  // List submissions (admin only)
  async list(status?: 'pending' | 'approved' | 'rejected'): Promise<Submission[]> {
    let filter = '';
    if (status) {
      // Validate status against allowlist to prevent filter injection
      if (!validateSubmissionStatus(status)) {
        throw new Error('Invalid status parameter');
      }
      filter = `status = "${status}"`;
    }
    
    const result = await pb.collection('submissions').getList(1, 100, {
      filter,
      sort: '-submitted_at',
    });
    return result.items as unknown as Submission[];
  },

  // List current user's submissions
  async listMySubmissions(status?: 'pending' | 'approved' | 'rejected'): Promise<Submission[]> {
    if (!pb.authStore.model) {
      throw new Error('User not authenticated');
    }
    
    let filter = `submitted_by = "${pb.authStore.model.id}"`;
    if (status) {
      // Validate status against allowlist to prevent filter injection
      if (!validateSubmissionStatus(status)) {
        throw new Error('Invalid status parameter');
      }
      filter += ` && status = "${status}"`;
    }
    
    const result = await pb.collection('submissions').getList(1, 100, {
      filter,
      sort: '-submitted_at',
    });
    return result.items as unknown as Submission[];
  },

  // Get single submission
  async get(id: string): Promise<Submission> {
    // Validate ID format to prevent injection
    if (!validateRecordId(id)) {
      throw new Error('Invalid submission ID format');
    }
    return await pb.collection('submissions').getOne(id) as unknown as Submission;
  },

  // Create submission
  async create(data: Partial<Submission> & { imageFile?: File }): Promise<Submission> {
    // Extract imageFile from data if present
    const { imageFile, ...submissionData } = data;
    
    // If image file is provided, validate it first
    if (imageFile) {
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        throw new Error(validationError);
      }
    }

    // If we have an image file, use FormData to upload
    if (imageFile) {
      // Ensure data is an object and remove any image reference from it
      const submissionDataObj = (submissionData.data as Record<string, any>) || {};
      const { image, ...dataWithoutImage } = submissionDataObj;
      
      // Create FormData - build it similar to createFormDataWithImage but adapted for submissions
      const formData = new FormData();
      
      // Add all submission top-level fields (excluding data)
      // These are: type, mosque_id, status, submitted_by, submitted_at, etc.
      Object.entries(submissionData).forEach(([key, value]) => {
        if (key !== 'data' && value !== null && value !== undefined) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (typeof value === 'string') {
            // Strings (including relation IDs) should be sent as-is
            formData.append(key, value);
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            formData.append(key, String(value));
          } else if (typeof value === 'object' && !(value instanceof File)) {
            // For objects/arrays, stringify them
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Add the data field as JSON string (PocketBase JSON field type requires stringified JSON)
      // This contains the mosque data (name, address, lat, lng, etc.) without the image
      formData.append('data', JSON.stringify(dataWithoutImage));
      
      // Add the image file - must be appended as a File object
      // PocketBase will handle the file upload automatically
      formData.append('image', imageFile);
      
      return await pb.collection('submissions').create(formData) as unknown as Submission;
    }

    // Otherwise, create normally without image
    return await pb.collection('submissions').create(submissionData) as unknown as Submission;
  },

  // Update submission (approve/reject)
  async update(id: string, data: Partial<Submission>): Promise<Submission> {
    return await pb.collection('submissions').update(id, data) as unknown as Submission;
  },

  // Approve submission
  async approve(id: string, reviewedBy: string): Promise<Submission> {
    const submission = await this.get(id);
    
    // Whitelist of allowed fields for mosque creation/update
    // This prevents mass assignment attacks where malicious fields could be injected
    const ALLOWED_MOSQUE_FIELDS = [
      'name',
      'name_bm',
      'address',
      'state',
      'lat',
      'lng',
      'description',
      'description_bm',
      'status',
    ] as const;
    
    // Sanitize submission data - only allow whitelisted fields (excluding image)
    const sanitizedData: Record<string, any> = {};
    for (const field of ALLOWED_MOSQUE_FIELDS) {
      if (field in submission.data && submission.data[field] !== undefined) {
        sanitizedData[field] = submission.data[field];
      }
    }
    
    // When approving a submission, create the mosque with approved status
    // For edits, preserve existing status unless explicitly changed
    if (submission.type === 'new_mosque') {
      sanitizedData.status = 'approved'; // Mosque is approved when admin approves the submission
      sanitizedData.created_by = submission.submitted_by;
    }
    
    // Handle image from submission
    // Check if submission has an image field (file field in PocketBase)
    let imageFile: File | undefined;
    const submissionRecord = submission as any;
    
    // If submission has an image file field, fetch it
    if (submissionRecord.image) {
      try {
        const fetchedImageFile = await getImageFileFromRecord(
          submissionRecord,
          submissionRecord.image,
          'submissions'
        );
        if (fetchedImageFile) {
          // Validate the fetched image file for security
          const validationError = validateImageFile(fetchedImageFile);
          if (!validationError) {
            imageFile = fetchedImageFile;
          } else {
            console.warn('Image from submission failed validation:', validationError);
          }
        }
      } catch (error) {
        console.error('Error fetching image from submission:', error);
        // Continue without image if fetch fails
      }
    }
    
    if (submission.type === 'new_mosque') {
      // Create the mosque with sanitized data and image
      // Use mosquesApi.create which handles image upload securely
      await mosquesApi.create(sanitizedData, imageFile);
    } else if (submission.type === 'edit_mosque' && submission.mosque_id) {
      // Validate mosque ID format
      if (!validateRecordId(submission.mosque_id)) {
        throw new Error('Invalid mosque ID format');
      }
      // Update the mosque with sanitized data and image (only allowed fields)
      await mosquesApi.update(submission.mosque_id, sanitizedData, imageFile);
    }
    
    // Update submission status
    return await this.update(id, {
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    });
  },

  // Reject submission
  async reject(id: string, reviewedBy: string, reason: string): Promise<Submission> {
    return await this.update(id, {
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    });
  },
};

