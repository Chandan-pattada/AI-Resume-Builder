import mongoose from 'mongoose';
import Resume from '../models/Resume.model.js';

// --------------------------------------------------
// Strip invalid _id fields from subdocument arrays
// --------------------------------------------------
const sanitizeSections = (sections) => {
  if (!sections) return sections;

  const cleaned = { ...sections };

  const arrayFields = [
    'experience',
    'education',
    'projects',
    'certifications',
  ];

  for (const field of arrayFields) {
    if (Array.isArray(cleaned[field])) {
      cleaned[field] = cleaned[field].map(({ _id, ...rest }) => {
        if (_id && mongoose.Types.ObjectId.isValid(_id)) {
          return { _id, ...rest };
        }

        return rest;
      });
    }
  }

  return cleaned;
};

// --------------------------------------------------
// Normalize sections returned by Gemini
// --------------------------------------------------
const normalizeUploadedSections = (sections = {}) => {
  const normalized = { ...sections };

  // -----------------------------
  // Personal Info
  // -----------------------------
  if (
    normalized.personalInfo &&
    typeof normalized.personalInfo === 'object'
  ) {
    normalized.personalInfo = {
      fullName: normalized.personalInfo.fullName || '',
      email: normalized.personalInfo.email || '',
      phone: normalized.personalInfo.phone || '',
      location: normalized.personalInfo.location || '',
      linkedIn: normalized.personalInfo.linkedIn || '',
      portfolio: normalized.personalInfo.portfolio || '',
    };
  }

  // -----------------------------
  // Summary
  // -----------------------------
  if (typeof normalized.summary === 'object') {
    normalized.summary =
      normalized.summary?.text || '';
  }

  if (typeof normalized.summary !== 'string') {
    normalized.summary = '';
  }

  // -----------------------------
  // Experience
  // -----------------------------
  if (Array.isArray(normalized.experience)) {
    normalized.experience = normalized.experience.map((item) => ({
      company: item?.company || '',
      role: item?.role || '',
      startDate: item?.startDate || '',
      endDate: item?.endDate || '',
      current: Boolean(item?.current),
      bullets: Array.isArray(item?.bullets)
        ? item.bullets
        : [],
    }));
  } else {
    normalized.experience = [];
  }

  // -----------------------------
  // Education
  // -----------------------------
  if (Array.isArray(normalized.education)) {
    normalized.education = normalized.education.map((item) => ({
      institution: item?.institution || '',
      degree: item?.degree || '',
      field: item?.field || '',
      startDate: item?.startDate || '',
      endDate: item?.endDate || '',
      gpa: item?.gpa || '',
    }));
  } else {
    normalized.education = [];
  }

  // -----------------------------
  // Skills
  // -----------------------------
  if (
    normalized.skills &&
    typeof normalized.skills === 'object' &&
    !Array.isArray(normalized.skills)
  ) {
    normalized.skills = {
      technical: Array.isArray(normalized.skills.technical)
        ? normalized.skills.technical
        : [],

      soft: Array.isArray(normalized.skills.soft)
        ? normalized.skills.soft
        : [],

      languages: Array.isArray(normalized.skills.languages)
        ? normalized.skills.languages
        : [],
    };
  } else {
    normalized.skills = {
      technical: [],
      soft: [],
      languages: [],
    };
  }

  // -----------------------------
  // Projects
  // -----------------------------
  if (Array.isArray(normalized.projects)) {
    normalized.projects = normalized.projects.map((item) => ({
      name: item?.name || '',
      description: item?.description || '',

      technologies: Array.isArray(item?.technologies)
        ? item.technologies
        : [],

      link: item?.link || '',

      bullets: Array.isArray(item?.bullets)
        ? item.bullets
        : [],
    }));
  } else {
    normalized.projects = [];
  }

  // -----------------------------
  // Certifications
  // -----------------------------
  if (typeof normalized.certifications === 'string') {
    normalized.certifications = [
      {
        name: normalized.certifications,
        issuer: '',
        date: '',
        link: '',
      },
    ];
  } else if (Array.isArray(normalized.certifications)) {
    normalized.certifications = normalized.certifications.map(
      (item) => {
        // Gemini sometimes returns a plain string
        if (typeof item === 'string') {
          return {
            name: item,
            issuer: '',
            date: '',
            link: '',
          };
        }

        // Gemini returns an object
        return {
          name: item?.name || '',
          issuer: item?.issuer || '',
          date: item?.date || '',
          link: item?.link || '',
        };
      }
    );
  } else if (
    normalized.certifications &&
    typeof normalized.certifications === 'object'
  ) {
    normalized.certifications = [
      {
        name: normalized.certifications.name || '',
        issuer: normalized.certifications.issuer || '',
        date: normalized.certifications.date || '',
        link: normalized.certifications.link || '',
      },
    ];
  } else {
    normalized.certifications = [];
  }

  return sanitizeSections(normalized);
};

// --------------------------------------------------
// Create empty resume
// --------------------------------------------------
export const createResume = async (userId, data = {}) => {
  const resume = await Resume.create({
    userId,
    title: data.title || 'Untitled Resume',
    templateId: data.templateId || 'classic',
    targetRole: data.targetRole || '',
  });

  return resume;
};

// --------------------------------------------------
// Get all resumes
// --------------------------------------------------
export const getResumesByUser = async (userId) => {
  const resumes = await Resume.find({ userId })
    .sort({ updatedAt: -1 })
    .select('-__v');

  return resumes;
};

// --------------------------------------------------
// Get single resume
// --------------------------------------------------
export const getResumeById = async (resumeId, userId) => {
  const resume = await Resume.findOne({
    _id: resumeId,
    userId,
  }).select('-__v');

  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  return resume;
};

// --------------------------------------------------
// Update complete resume
// --------------------------------------------------
export const updateResume = async (
  resumeId,
  userId,
  updateData
) => {
  if (updateData.sections) {
    updateData.sections = sanitizeSections(
      updateData.sections
    );
  }

  const resume = await Resume.findOneAndUpdate(
    {
      _id: resumeId,
      userId,
    },
    {
      $set: updateData,
    },
    {
      returnDocument: 'after',
    }
  );

  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  return resume;
};

// --------------------------------------------------
// Update individual section
// --------------------------------------------------
export const updateSection = async (
  resumeId,
  userId,
  sectionName,
  sectionData
) => {
  const arrayFields = [
    'experience',
    'education',
    'projects',
    'certifications',
  ];

  let cleanData = sectionData;

  if (
    arrayFields.includes(sectionName) &&
    Array.isArray(sectionData)
  ) {
    cleanData = sectionData.map(
      ({ _id, ...rest }) => {
        if (
          _id &&
          mongoose.Types.ObjectId.isValid(_id)
        ) {
          return {
            _id,
            ...rest,
          };
        }

        return rest;
      }
    );
  }

  const updateKey = `sections.${sectionName}`;

  const resume = await Resume.findOneAndUpdate(
    {
      _id: resumeId,
      userId,
    },
    {
      $set: {
        [updateKey]: cleanData,
      },
    },
    {
      returnDocument: 'after',
    }
  );

  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  return resume;
};

// --------------------------------------------------
// Update template
// --------------------------------------------------
export const updateTemplate = async (
  resumeId,
  userId,
  templateId
) => {
  const resume = await Resume.findOneAndUpdate(
    {
      _id: resumeId,
      userId,
    },
    {
      $set: {
        templateId,
      },
    },
    {
      returnDocument: 'after',
    }
  );

  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  return resume;
};

// --------------------------------------------------
// Create resume from uploaded PDF
// --------------------------------------------------
export const createFromUpload = async (
  userId,
  parsedSections,
  title = 'Uploaded Resume'
) => {
  const normalizedSections =
    normalizeUploadedSections(parsedSections);

  console.log(
    '📄 Normalized uploaded sections:',
    JSON.stringify(normalizedSections, null, 2)
  );

  const resume = await Resume.create({
    userId,
    title,
    templateId: 'classic',
    sections: normalizedSections,
  });

  return resume;
};

// --------------------------------------------------
// Delete resume
// --------------------------------------------------
export const deleteResume = async (
  resumeId,
  userId
) => {
  const resume = await Resume.findOneAndDelete({
    _id: resumeId,
    userId,
  });

  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  return resume;
};