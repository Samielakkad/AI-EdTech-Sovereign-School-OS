import { LessonPlan } from '../types.ts';

const TEMPLATES_KEY = 'lessonPlanTemplates';

export interface LessonPlanTemplate {
  id: string;
  name: string;
  plan: LessonPlan;
}

// Initialize with empty array if not present
const initializeTemplates = (): void => {
    const existing = localStorage.getItem(TEMPLATES_KEY);
    if (!existing) {
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify([]));
    }
};

initializeTemplates();

export const getTemplates = (): LessonPlanTemplate[] => {
    try {
        const templatesJson = localStorage.getItem(TEMPLATES_KEY);
        return templatesJson ? JSON.parse(templatesJson) : [];
    } catch (error) {
        console.error("Failed to parse lesson plan templates from localStorage", error);
        return [];
    }
};

const saveAllTemplates = (templates: LessonPlanTemplate[]): void => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const saveTemplate = (name: string, plan: LessonPlan): LessonPlanTemplate => {
    const templates = getTemplates();
    const newTemplate: LessonPlanTemplate = {
        id: `template-${Date.now()}`,
        name,
        plan,
    };
    templates.unshift(newTemplate);
    saveAllTemplates(templates);
    return newTemplate;
};

export const deleteTemplate = (templateId: string): void => {
    let templates = getTemplates();
    templates = templates.filter(t => t.id !== templateId);
    saveAllTemplates(templates);
};
