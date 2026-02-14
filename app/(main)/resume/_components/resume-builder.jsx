"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  useForm,
  useFieldArray,
  Controller,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown,
  ArrowRight,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  Send,
  Loader2,
  Circle,
  ArrowLeft,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { createResume, updateResume, improveWithAI } from '@/actions/resume';

// --- Zod Schema for Validation ---
const contactsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const experienceSchema = z.object({
  id: z.string().optional(),
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Skill name is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
});

const summarySchema = z.object({
  summary: z.string().min(20, 'Summary should be at least 20 characters'),
});

// Main schema combines all parts
const resumeSchema = z.object({
  contacts: contactsSchema,
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillSchema),
  summary: summarySchema,
});

// --- BLANK Default Values ---
const blankDefaultValues = {
  contacts: {
    firstName: '',
    lastName: '',
    jobTitle: '',
    phone: '',
    email: '',
    linkedin: '',
    github: '',
  },
  summary: {
    summary: '',
  },
  experience: [],
  education: [],
  skills: [],
};


// --- Utility Components ---

// Input field component
const Input = ({
  label,
  name,
  register,
  errors,
  placeholder,
  type = 'text',
  isTouched,
  isValid,
}) => (
  <div className="flex-1">
    <label
      htmlFor={name}
      className="block text-sm font-medium text-neutral-300 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          errors[name]
            ? 'border-red-500 focus:ring-red-500'
            : isValid && isTouched
            ? 'border-green-500'
            : 'border-neutral-700'
        }`}
      />
      {isValid && isTouched && (
        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
      )}
    </div>
    {errors[name] && (
      <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
    )}
  </div>
);

// Textarea field component with AI improvement
const Textarea = ({
  label,
  name,
  register,
  errors,
  placeholder,
  isTouched,
  isValid,
  onImprove,
  isImproving,
  canImprove = false,
  currentValue = "",
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-neutral-300"
      >
        {label}
      </label>
      {canImprove && onImprove && (
        <button
          type="button"
          onClick={onImprove}
          disabled={isImproving}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          {isImproving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wand2 className="w-3 h-3" />
          )}
          {isImproving 
            ? (currentValue && currentValue.trim() ? 'Improving...' : 'Generating...') 
            : (currentValue && currentValue.trim() ? 'Improve with AI' : 'Generate with AI')
          }
        </button>
      )}
    </div>
    <div className="relative">
      <textarea
        id={name}
        rows="5"
        placeholder={placeholder}
        {...register(name)}
        className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
          errors[name]
            ? 'border-red-500 focus:ring-red-500'
            : isValid && isTouched
            ? 'border-green-500'
            : 'border-neutral-700'
        }`}
      />
      {isValid && isTouched && (
        <CheckCircle className="absolute right-3 top-4 w-5 h-5 text-green-500" />
      )}
    </div>
    {errors[name] && (
      <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
    )}
  </div>
);

// Select field component
const Select = ({
  label,
  name,
  control,
  errors,
  options,
  placeholder,
  isTouched,
  isValid,
}) => (
  <div className="flex-1">
    <label
      htmlFor={name}
      className="block text-sm font-medium text-neutral-300 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors[name]
                ? 'border-red-500 focus:ring-red-500'
                : isValid && isTouched
                ? 'border-green-500'
                : 'border-neutral-700'
            }`}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
      {isValid && isTouched && (
        <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
      )}
    </div>
    {errors[name] && (
      <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
    )}
  </div>
);

// --- Form Section Components ---

const ContactsForm = ({ register, errors, touchedFields, dirtyFields }) => {
  const [showAdditional, setShowAdditional] = useState(false);
  const fields = errors.contacts || {};
  const touched = touchedFields.contacts || {};
  const dirty = dirtyFields.contacts || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Contacts</h2>
        <p className="text-neutral-400 mt-1">
          Add your up-to-date contact information so employers can reach you.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        <Input
          label="First name"
          name="contacts.firstName"
          register={register}
          errors={fields}
          placeholder="e.g. John"
          isTouched={touched.firstName}
          isValid={!fields.firstName && dirty.firstName}
        />
        <Input
          label="Last name"
          name="contacts.lastName"
          register={register}
          errors={fields}
          placeholder="e.g. Doe"
          isTouched={touched.lastName}
          isValid={!fields.lastName && dirty.lastName}
        />
      </div>
      <Input
        label="Desired job title"
        name="contacts.jobTitle"
        register={register}
        errors={fields}
        placeholder="e.g. Software Engineer"
        isTouched={touched.jobTitle}
        isValid={!fields.jobTitle && dirty.jobTitle}
      />
      <div className="flex flex-col sm:flex-row gap-6">
        <Input
          label="Phone"
          name="contacts.phone"
          register={register}
          errors={fields}
          placeholder="e.g. (123) 456-7890"
          isTouched={touched.phone}
          isValid={!fields.phone && dirty.phone}
        />
        <Input
          label="Email"
          name="contacts.email"
          register={register}
          errors={fields}
          type="email"
          placeholder="e.g. john.doe@email.com"
          isTouched={touched.email}
          isValid={!fields.email && dirty.email}
        />
      </div>
      <button
        type="button"
        onClick={() => setShowAdditional(!showAdditional)}
        className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
      >
        Additional information
        <ChevronDown
          className={`w-4 h-4 ml-1 transition-transform ${
            showAdditional ? 'rotate-180' : ''
          }`}
        />
      </button>
      {showAdditional && (
        <div className="space-y-6 pt-4 border-t border-neutral-800">
          <Input
            label="LinkedIn"
            name="contacts.linkedin"
            register={register}
            errors={fields}
            placeholder="e.g. https://linkedin.com/in/johndoe"
            isTouched={touched.linkedin}
            isValid={!fields.linkedin && dirty.linkedin}
          />
          <Input
            label="GitHub"
            name="contacts.github"
            register={register}
            errors={fields}
            placeholder="e.g. https://github.com/johndoe"
            isTouched={touched.github}
            isValid={!fields.github && dirty.github}
          />
        </div>
      )}
    </div>
  );
};

const ExperienceForm = ({ 
  control, 
  register, 
  errors, 
  touchedFields, 
  dirtyFields, 
  formData, 
  onImproveField, 
  isImprovingFields 
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experience',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Work Experience</h2>
        <p className="text-neutral-400 mt-1">
          List your relevant work experience, starting with the most recent.
        </p>
      </div>
      <div className="space-y-8">
        {fields.map((item, index) => {
          const fieldErrors = errors.experience?.[index] || {};
          const touched = touchedFields.experience?.[index] || {};
          const dirty = dirtyFields.experience?.[index] || {};

          return (
            <div
              key={item.id}
              className="p-6 rounded-lg bg-neutral-900 border border-neutral-800 relative"
            >
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Input
                    label="Job Title"
                    name={`experience.${index}.jobTitle`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. Software Engineer Intern"
                    isTouched={touched.jobTitle}
                    isValid={!fieldErrors.jobTitle && dirty.jobTitle}
                  />
                  <Input
                    label="Company"
                    name={`experience.${index}.company`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. Tech Solutions Inc."
                    isTouched={touched.company}
                    isValid={!fieldErrors.company && dirty.company}
                  />
                </div>
                <Input
                  label="Location"
                  name={`experience.${index}.location`}
                  register={register}
                  errors={fieldErrors}
                  placeholder="e.g. New York, NY (Optional)"
                  isTouched={touched.location}
                  isValid={!fieldErrors.location && dirty.location}
                />
                <div className="flex flex-col sm:flex-row gap-6">
                  <Input
                    label="Start Date"
                    name={`experience.${index}.startDate`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. Jan 2023"
                    isTouched={touched.startDate}
                    isValid={!fieldErrors.startDate && dirty.startDate}
                  />
                  <Input
                    label="End Date"
                    name={`experience.${index}.endDate`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. Present (or Aug 2023)"
                    isTouched={touched.endDate}
                    isValid={!fieldErrors.endDate && dirty.endDate}
                  />
                </div>
                <Textarea
                  label="Description"
                  name={`experience.${index}.description`}
                  register={register}
                  errors={fieldErrors}
                  placeholder="- Developed and maintained web applications using React and Node.js..."
                  isTouched={touched.description}
                  isValid={!fieldErrors.description && dirty.description}
                  canImprove={true}
                  currentValue={formData.experience?.[index]?.description || ""}
                  onImprove={() => onImproveField(`experience.${index}.description`, formData.experience?.[index]?.description)}
                  isImproving={isImprovingFields[`experience.${index}.description`]}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            jobTitle: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: '',
          })
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Experience
      </button>
    </div>
  );
};

const EducationForm = ({ 
  control, 
  register, 
  errors, 
  touchedFields, 
  dirtyFields, 
  formData, 
  onImproveField, 
  isImprovingFields 
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Education</h2>
        <p className="text-neutral-400 mt-1">
          Add your educational background.
        </p>
      </div>
      <div className="space-y-8">
        {fields.map((item, index) => {
          const fieldErrors = errors.education?.[index] || {};
          const touched = touchedFields.education?.[index] || {};
          const dirty = dirtyFields.education?.[index] || {};

          return (
            <div
              key={item.id}
              className="p-6 rounded-lg bg-neutral-900 border border-neutral-800 relative"
            >
              <div className="space-y-6">
                <Input
                  label="Institution"
                  name={`education.${index}.institution`}
                  register={register}
                  errors={fieldErrors}
                  placeholder="e.g. State University"
                  isTouched={touched.institution}
                  isValid={!fieldErrors.institution && dirty.institution}
                />
                <div className="flex flex-col sm:flex-row gap-6">
                  <Input
                    label="Degree"
                    name={`education.${index}.degree`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. Bachelor of Science"
                    isTouched={touched.degree}
                    isValid={!fieldErrors.degree && dirty.degree}
                  />
                   <Input
                    label="Field of Study"
                    name={`education.${index}.fieldOfStudy`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. Computer Science"
                    isTouched={touched.fieldOfStudy}
                    isValid={!fieldErrors.fieldOfStudy && dirty.fieldOfStudy}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Input
                    label="Start Date"
                    name={`education.${index}.startDate`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. 2020"
                    isTouched={touched.startDate}
                    isValid={!fieldErrors.startDate && dirty.startDate}
                  />
                  <Input
                    label="End Date"
                    name={`education.${index}.endDate`}
                    register={register}
                    errors={fieldErrors}
                    placeholder="e.g. 2024 (Expected)"
                    isTouched={touched.endDate}
                    isValid={!fieldErrors.endDate && dirty.endDate}
                  />
                </div>
                 <Textarea
                  label="Description (Optional)"
                  name={`education.${index}.description`}
                  register={register}
                  errors={fieldErrors}
                  placeholder="e.g. Relevant coursework, honors, GPA, etc."
                  isTouched={touched.description}
                  isValid={!fieldErrors.description && dirty.description}
                  canImprove={true}
                  currentValue={formData.education?.[index]?.description || ""}
                  onImprove={() => onImproveField(`education.${index}.description`, formData.education?.[index]?.description)}
                  isImproving={isImprovingFields[`education.${index}.description`]}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            institution: '',
            degree: '',
            fieldOfStudy: '',
            startDate: '',
            endDate: '',
            description: '',
          })
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Education
      </button>
    </div>
  );
};

const SkillsForm = ({ control, register, errors, touchedFields, dirtyFields }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Skills</h2>
        <p className="text-neutral-400 mt-1">
          Highlight your relevant skills.
        </p>
      </div>
      <div className="space-y-8">
        {fields.map((item, index) => {
          const fieldErrors = errors.skills?.[index] || {};
          const touched = touchedFields.skills?.[index] || {};
          const dirty = dirtyFields.skills?.[index] || {};

          return (
            <div
              key={item.id}
              className="p-6 rounded-lg bg-neutral-900 border border-neutral-800 relative"
            >
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Input
                  label="Skill"
                  name={`skills.${index}.name`}
                  register={register}
                  errors={fieldErrors}
                  placeholder="e.g. React"
                  isTouched={touched.name}
                  isValid={!fieldErrors.name && dirty.name}
                />
                <Select
                  label="Level"
                  name={`skills.${index}.level`}
                  control={control}
                  errors={fieldErrors}
                  options={['Beginner', 'Intermediate', 'Advanced', 'Expert']}
                  placeholder="Select level"
                  isTouched={touched.level}
                  isValid={!fieldErrors.level && dirty.level}
                />
                 <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-8 w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            name: '',
            level: 'Intermediate',
          })
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Skill
      </button>
    </div>
  );
};

const SummaryForm = ({ 
  register, 
  errors, 
  touchedFields, 
  dirtyFields, 
  formData, 
  onImproveField, 
  isImprovingFields 
}) => {
  const fieldErrors = errors.summary || {};
  const touched = touchedFields.summary || {};
  const dirty = dirtyFields.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Professional Summary</h2>
        <p className="text-neutral-400 mt-1">
          Write a brief summary of your career objectives and qualifications.
        </p>
      </div>
      <Textarea
        label="Summary"
        name="summary.summary"
        register={register}
        errors={fieldErrors}
        placeholder="e.g. Driven Software Engineer with 3+ years of experience in..."
        isTouched={touched.summary}
        isValid={!fieldErrors.summary && dirty.summary}
        canImprove={true}
        currentValue={formData.summary?.summary || ""}
        onImprove={() => onImproveField('summary.summary', formData.summary?.summary)}
        isImproving={isImprovingFields['summary.summary']}
      />
    </div>
  );
};

const FinalizeStep = ({ formData, onDownload, isDownloading, isSaving }) => {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-3xl font-semibold text-white">
        Your Resume is Ready!
      </h2>
      <p className="text-neutral-400 mt-2 max-w-lg mx-auto">
        Congratulations, {formData.contacts?.firstName || 'User'}! You've
        completed your resume. You can now download it as a PDF or save it to
        your dashboard.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 w-full sm:w-48 px-6 py-3 rounded-lg bg-neutral-700 text-white font-semibold hover:bg-neutral-600 transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center gap-2 w-full sm:w-48 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {isSaving ? 'Saving...' : 'Save to Dashboard'}
        </button>
      </div>
    </div>
  );
};

// --- Resume Preview Component ---

// NEW: Live Resume Score Calculator
const calculateResumeScore = (data) => {
  let score = 0;
  const weights = {
    contacts: { base: 20, items: { firstName: 3, lastName: 3, jobTitle: 4, phone: 3, email: 3, linkedin: 4 } },
    summary: { base: 15, length: [
      { min: 20, points: 5 },
      { min: 100, points: 10 }
    ]},
    experience: { base: 25, items: [
      { min: 1, points: 15 },
      { min: 2, points: 10 }
    ]},
    education: { base: 15, items: [{ min: 1, points: 15 }] },
    skills: { base: 25, items: [
      { min: 3, points: 10 },
      { min: 6, points: 15 }
    ]}
  };

  // Contacts
  if (data.contacts) {
    for (const [key, points] of Object.entries(weights.contacts.items)) {
      if (data.contacts[key]) score += points;
    }
  }
  // Summary
  if (data.summary?.summary) {
    const len = data.summary.summary.length;
    for (const rule of weights.summary.length) {
      if (len >= rule.min) score += rule.points;
    }
  }
  // Experience
  if (data.experience) {
    const count = data.experience.length;
    for (const rule of weights.experience.items) {
      if (count >= rule.min) score += rule.points;
    }
  }
  // Education
  if (data.education) {
    const count = data.education.length;
    for (const rule of weights.education.items) {
      if (count >= rule.min) score += rule.points;
    }
  }
  // Skills
  if (data.skills) {
    const count = data.skills.length;
    for (const rule of weights.skills.items) {
      if (count >= rule.min) score += rule.points;
    }
  }
  
  return Math.min(score, 100); // Cap at 100
};

// UPDATED: ResumeScore component is now LIVE
const ResumeScore = ({ formData }) => {
  // Calculate score live
  const score = useMemo(() => calculateResumeScore(formData), [formData]);
  const scoreColor = score > 80 ? "bg-green-500" : score > 60 ? "bg-yellow-500" : "bg-red-500";
  const scoreTextColor = score > 80 ? "text-green-400" : score > 60 ? "text-yellow-400" : "text-red-400";


  return (
    <div className="mb-6 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-neutral-100">
          Your resume score
        </span>
        <span className={`text-lg font-bold ${scoreTextColor}`}>{score}%</span>
      </div>
      <div className="w-full bg-neutral-700 rounded-full h-2.5">
        <div
          className={`${scoreColor} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
};

const ResumePreview = ({ formData, previewRef }) => {
  const { contacts, summary, experience, education, skills } = formData;

  const skillLevelToDots = (level) => {
    switch (level) {
      case 'Beginner':
        return 2;
      case 'Intermediate':
        return 3;
      case 'Advanced':
        return 4;
      case 'Expert':
        return 5;
      default:
        return 3;
    }
  };

  return (
    // Removed sticky positioning - now scrolls naturally with the page
    <div className="space-y-6">
      {/* Pass formData to ResumeScore */}
      <ResumeScore formData={formData} />
      
      {/* This is the div that will be downloaded - removed internal scrolling */}
      <div ref={previewRef} className="bg-white text-black p-10 rounded-lg shadow-2xl font-sans">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold uppercase text-gray-900">
            {contacts?.firstName || 'John'} {contacts?.lastName || 'Doe'}
          </h1>
          <p className="text-md font-medium text-gray-700 mt-1">
            {contacts?.jobTitle ||
              'Your Job Title'}
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-600 mt-2">
            <span>{contacts?.email || 'john.doe@email.com'}</span>
            <span>|</span>
            <span>{contacts?.phone || '(123) 456-7890'}</span>
          </div>
          {(contacts?.linkedin || contacts?.github) && (
             <div className="flex justify-center gap-4 text-xs text-blue-600 mt-1">
             {contacts.linkedin && <a href={contacts.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
             {contacts.github && <a href={contacts.github} target="_blank" rel="noopener noreferrer">GitHub</a>}
           </div>
          )}
        </div>

        {/* Summary */}
        {summary?.summary && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-300 pb-1 mb-2">
              Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {summary.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {experience?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-300 pb-1 mb-3">
              Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id || exp.jobTitle}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold text-gray-800">
                      {exp.jobTitle || 'Job Title'}
                    </h3>
                    <span className="text-xs font-medium text-gray-600">
                      {exp.startDate || 'Start Date'} - {exp.endDate || 'End Date'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center -mt-1">
                    <p className="text-sm font-medium text-gray-700">
                      {exp.company || 'Company'}
                    </p>
                     <span className="text-xs font-medium text-gray-600">
                       {exp.location || 'Location'}
                     </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1">
                    {exp.description || 'Description of responsibilities...'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education?.length > 0 && (
           <div className="mb-6">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-300 pb-1 mb-3">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id || edu.institution}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold text-gray-800">
                      {edu.institution || 'Institution'}
                    </h3>
                    <span className="text-xs font-medium text-gray-600">
                      {edu.startDate || 'Start Date'} - {edu.endDate || 'End Date'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 -mt-1">
                    {edu.degree || 'Degree'} in {edu.fieldOfStudy || 'Field of Study'}
                  </p>
                  {edu.description && <p className="text-sm text-gray-700 leading-relaxed mt-1">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Skills */}
        {skills?.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-300 pb-1 mb-3">
              Skills
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {skills.map((skill) => (
                <div key={skill.id || skill.name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-800">{skill.name || 'Skill Name'}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Circle key={i} className={`w-3 h-3 ${i < skillLevelToDots(skill.level) ? 'text-black fill-current' : 'text-gray-400'}`}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Step Navigation ---
const steps = [
  {
    id: 'contacts',
    name: 'Contacts',
    icon: FileText,
    fields: ['contacts'],
  },
  {
    id: 'experience',
    name: 'Experience',
    icon: Briefcase,
    fields: ['experience'],
  },
  {
    id: 'education',
    name: 'Education',
    icon: GraduationCap,
    fields: ['education'],
  },
  { id: 'skills', name: 'Skills', icon: Sparkles, fields: ['skills'] },
  { id: 'summary', name: 'Summary', icon: LayoutGrid, fields: ['summary'] },
  { id: 'finalize', name: 'Finalize', icon: Send, fields: [] },
];

const StepNavigation = ({ currentStep, setStep, validateStep, errors }) => {
  const getStepStatus = (stepId) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    if (stepIndex < currentIndex) {
      const step = steps[stepIndex];
      // Check for errors in the specific step's fields
      const hasError = step.fields.some(field => {
        const fieldParts = field.split('.');
        let errorObj = errors;
        for (const part of fieldParts) {
          if (!errorObj) return false;
          errorObj = errorObj[part];
        }
        return !!errorObj;
      });
      return hasError ? 'error' : 'complete';
    }
    if (stepIndex === currentIndex) return 'current';
    return 'incomplete';
  };

  const handleStepClick = async (stepId) => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    const targetIndex = steps.findIndex((s) => s.id === stepId);

    if (targetIndex < currentIndex) {
      setStep(stepId);
      return;
    }

    // Validate all steps up to the one clicked
    let canNavigate = true;
    for (let i = 0; i < targetIndex; i++) {
      const step = steps[i];
      const isValid = await validateStep(step.fields);
      if (!isValid) {
        setStep(step.id); // Go to the first invalid step
        canNavigate = false;
        break;
      }
    }
    
    if (canNavigate) {
      setStep(stepId);
    }
  };

  return (
    // This navigation is styled to match the bettercv screenshot
    <nav className="w-full py-4 mb-10">
      <div className="flex items-center justify-between relative">
        {/* The line */}
        <div className="absolute left-0 top-3 w-full h-0.5 bg-neutral-700" />
        
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isCurrent = status === 'current';
          const isComplete = status === 'complete';
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center" style={{ width: '80px' }}>
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center bg-black border-2 transition-all duration-300 ${
                  isCurrent || isComplete ? 'border-blue-500' : 'border-neutral-600'
                }`}
              >
                {/* Inner dot for current step */}
                {isCurrent && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                {/* Checkmark for completed step */}
                {isComplete && <CheckCircle className="w-4 h-4 text-blue-500" />}
              </button>
              <span className={`mt-2 text-xs sm:text-sm text-center whitespace-nowrap transition-colors ${
                isCurrent ? 'text-white font-medium' : 'text-neutral-400'
              }`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

// --- Main Builder Component ---

export default function ResumeBuilder({ mode = "create", initialResume = null }) {
  const [currentStep, setCurrentStep] = useState(steps[0].id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImprovingFields, setIsImprovingFields] = useState({});
  const { user } = useAuth();
  const router = useRouter();
  const previewRef = useRef();

  // FIX: Load blank data for "create" mode, or initialResume data for "edit" mode.
  const defaultValues = useMemo(() => {
    if (mode === 'edit' && initialResume) {
      // Deep merge to ensure all keys are present even if initialResume.content is partial
      return {
        contacts: { ...blankDefaultValues.contacts, ...initialResume.content?.contacts },
        summary: { ...blankDefaultValues.summary, ...initialResume.content?.summary },
        experience: initialResume.content?.experience || blankDefaultValues.experience,
        education: initialResume.content?.education || blankDefaultValues.education,
        skills: initialResume.content?.skills || blankDefaultValues.skills,
      };
    }
    return blankDefaultValues;
  }, [mode, initialResume]);


  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    mode: 'onBlur',
    defaultValues: defaultValues,
  });

  const formData = watch();

  // NEW: Effect to load html2pdf.js
  useEffect(() => {
    const scriptId = 'html2pdf-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => console.log('html2pdf.js loaded');
      document.body.appendChild(script);
    }
    // No cleanup needed, we want it available globally
  }, []);

  const validateStep = async (fields) => {
    return await trigger(fields);
  };

  const handleNext = async () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      const currentStepFields = steps[currentIndex].fields;
      const isValid = await validateStep(currentStepFields);
      
      if (isValid) {
        setCurrentStep(steps[currentIndex + 1].id);
        window.scrollTo(0, 0); // Scroll form panel to top
      }
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
      window.scrollTo(0, 0); // Scroll form panel to top
    }
  };

  // Handle AI improvement for text fields
  const handleImproveField = async (fieldPath, currentValue) => {
    // Allow generation even if empty, but prevent if already improving
    if (isImprovingFields[fieldPath]) return;

    setIsImprovingFields(prev => ({ ...prev, [fieldPath]: true }));

    try {
      let type = 'experience'; // default
      if (fieldPath.includes('summary')) {
        type = 'summary';
      } else if (fieldPath.includes('education')) {
        type = 'education';
      } else if (fieldPath.includes('experience')) {
        type = 'experience';
      }

      const improvedContent = await improveWithAI({
        current: currentValue || "", // Pass empty string if no current value
        type: type,
        jobTitle: formData.contacts?.jobTitle,
      });

      setValue(fieldPath, improvedContent, { shouldValidate: true, shouldDirty: true });
      const actionText = currentValue && currentValue.trim() ? 'improved' : 'generated';
      toast.success(`Content ${actionText} with AI!`);
    } catch (error) {
      console.error('Improvement error:', error);
      toast.error(error.message || 'Failed to improve content');
    } finally {
      setIsImprovingFields(prev => ({ ...prev, [fieldPath]: false }));
    }
  };

  // NEW: Simplified Download Handler
  const handleDownload = () => {
    setIsDownloading(true);
    const element = previewRef.current;
    
    if (!element) {
      toast.error('Preview element not found.');
      setIsDownloading(false);
      return;
    }
    
    if (typeof window.html2pdf === 'undefined') {
      toast.error('PDF library is still loading. Please try again in a moment.');
      setIsDownloading(false);
      return;
    }

    const opt = {
      margin:       0.5,
      filename:     `Resume_${formData.contacts?.firstName || 'User'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsDownloading(false);
      toast.success('PDF downloaded successfully!');
    }).catch(err => {
      setIsDownloading(false);
      toast.error('Failed to download PDF.');
      console.error(err);
    });
  };

  // Save resume to database
  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Please sign in to save your resume');
      return;
    }

    setIsSaving(true);
    try {
      let result;
      
      if (mode === 'edit' && initialResume?.id) {
        result = await updateResume(initialResume.id, data);
        toast.success('Resume updated successfully!');
      } else {
        result = await createResume(data);
        toast.success('Resume saved successfully!');
      }

      if (result && result.id) {
        // Redirect to my resumes page
        router.push('/resume/my-resumes');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'save'} resume. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'contacts':
        return (
          <ContactsForm
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            dirtyFields={dirtyFields}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            control={control}
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            dirtyFields={dirtyFields}
            formData={formData}
            onImproveField={handleImproveField}
            isImprovingFields={isImprovingFields}
          />
        );
      case 'education':
        return (
          <EducationForm
            control={control}
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            dirtyFields={dirtyFields}
            formData={formData}
            onImproveField={handleImproveField}
            isImprovingFields={isImprovingFields}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            control={control}
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            dirtyFields={dirtyFields}
          />
        );
      case 'summary':
        return (
          <SummaryForm
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            dirtyFields={dirtyFields}
            formData={formData}
            onImproveField={handleImproveField}
            isImprovingFields={isImprovingFields}
          />
        );
      case 'finalize':
        return (
          <FinalizeStep
            formData={formData}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            isSaving={isSaving} // Pass isSaving
          />
        );
      default:
        return null;
    }
  };
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const nextStep = steps[currentStepIndex + 1];

  return (
    // Main layout container - full width, no side margins
    <div className="flex flex-col lg:flex-row min-h-screen bg-black text-neutral-100">
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          // Complete full width - no padding at all for edge-to-edge layout
          className="h-full py-6 px-4"
        >
          <StepNavigation
            currentStep={currentStep}
            setStep={setCurrentStep}
            validateStep={validateStep}
            errors={errors}
          />
          {/* Step content */}
          <div className="mt-6">{renderStep()}</div>

          {/* Navigation Buttons - Part of Form */}
          {currentStep !== 'finalize' && (
            <div className="mt-8 pt-6 border-t border-neutral-800">
              <div className="flex justify-between gap-4">
                {currentStep !== steps[0].id ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                ) : (
                  <div /> // Placeholder to keep "Next" on the right
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Next: {nextStep?.name || 'Finalize'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation for Finalize step */}
          {currentStep === 'finalize' && (
            <div className="mt-8 pt-6 border-t border-neutral-800">
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Right Panel: Preview */}
      {/* Removed sticky positioning and internal scrolling - now scrolls with page */}
      <div className="w-full lg:w-1/2 bg-neutral-900 hidden lg:block">{/* Complete edge-to-edge preview */}
        <ResumePreview formData={formData} previewRef={previewRef} />
      </div>
    </div>
  );
}
