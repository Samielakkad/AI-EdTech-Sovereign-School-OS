import { StudentProfile, Incident, IEPGoal, Quest, Reflection, QuestStatus, Assignment, Quiz, StudentQuizAttempt, LearningRecommendation, AdventureModule, AssignmentSubmission, Student, Teacher, AdventureHistoryEntry } from '../types.ts';
import { HEROES } from './heroData.ts';
import * as archiveService from './archiveService.ts';

declare const jspdf: any;

const PROFILES_KEY = 'studentProfiles';
const ADVENTURE_MODULES_KEY = 'adventureModules';
const QUIZZES_KEY = 'schoolQuizzes';
const TEACHERS_KEY = 'schoolTeachers';

// --- MOCK DATA (used for initial seeding) ---
const mockStudentsData: Omit<Student, 'id'>[] = [
  { name: 'Alia Garcia', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s1' },
  { name: 'Ben Carter', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s2' },
  { name: 'Chloe Davis', status: 'distracted', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s3' },
  { name: 'David Evans', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s4' },
  { name: 'Emily White', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s5' },
  { name: 'Frank Green', status: 'needs_help', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s6' },
  { name: 'Grace Hall', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s7' },
  { name: 'Henry King', status: 'absent', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s8' },
  { name: 'Isla Lewis', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s9' },
  { name: 'Jack Miller', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s10' },
  { name: 'Katherine Reed', status: 'focused', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s11' },
  { name: 'Leo Taylor', status: 'distracted', gradeLevel: 5, avatarUrl: 'https://i.pravatar.cc/40?u=s12' },
];

const mockTeacherData: Teacher = {
    id: 't1',
    name: 'Ms. Peterson',
    email: 'teacher@school.edu',
    classId: 'Grade 5 - Room 201'
};

// --- MOCK ACADEMIC DATA ---

const scienceQuiz: Quiz = {
    id: 'quiz-sci-1',
    title: 'Plant Biology Basics',
    topic: 'Photosynthesis',
    questions: [
        { id: 'q1', question: 'What is the name of the process plants use to make their own food?', options: ['Photosynthesis', 'Respiration', 'Transpiration', 'Germination'], correctAnswer: 'Photosynthesis', topic: 'Photosynthesis' },
        { id: 'q2', question: 'What gas do plants absorb from the atmosphere for this process?', options: ['Carbon Dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], correctAnswer: 'Carbon Dioxide', topic: 'Photosynthesis' },
        { id: 'q3', question: 'What is the green pigment in leaves that captures sunlight?', options: ['Chlorophyll', 'Melanin', 'Carotene', 'Xanthophyll'], correctAnswer: 'Chlorophyll', topic: 'Photosynthesis' },
    ]
};

const romeQuiz: Quiz = {
    id: 'quiz-hist-1',
    title: 'Ancient Rome: Republic to Empire',
    topic: 'Ancient Rome',
    questions: [
        { id: 'rq1', question: 'Who was the first Roman Emperor?', options: ['Augustus', 'Julius Caesar', 'Nero', 'Constantine'], correctAnswer: 'Augustus', topic: 'Ancient Rome' },
        { id: 'rq2', question: 'What was the large amphitheater in the center of Rome called?', options: ['The Colosseum', 'The Pantheon', 'The Forum', 'The Circus Maximus'], correctAnswer: 'The Colosseum', topic: 'Ancient Rome' },
        { id: 'rq3', question: 'Which river was central to the city of Rome?', options: ['Tiber', 'Nile', 'Danube', 'Po'], correctAnswer: 'Tiber', topic: 'Ancient Rome' },
        { id: 'rq4', question: 'What were the two main social classes in ancient Rome?', options: ['Patricians and Plebeians', 'Romans and Gauls', 'Senators and Gladiators', 'Consuls and Tribunes'], correctAnswer: 'Patricians and Plebeians', topic: 'Ancient Rome' },
    ]
};

const fractionsQuiz: Quiz = {
    id: 'quiz-math-1',
    title: 'Introduction to Fractions',
    topic: 'Mathematics',
    questions: [
        { id: 'mq1', question: 'What is 1/2 + 1/4?', options: ['3/4', '2/6', '1/8', '2/4'], correctAnswer: '3/4', topic: 'Mathematics' },
        { id: 'mq2', question: 'Which fraction is equivalent to 2/3?', options: ['4/6', '3/4', '2/5', '1/3'], correctAnswer: '4/6', topic: 'Mathematics' },
        { id: 'mq3', question: 'What is the top number in a fraction called?', options: ['Numerator', 'Denominator', 'Quotient', 'Dividend'], correctAnswer: 'Numerator', topic: 'Mathematics' },
    ]
};

const solarSystemQuiz: Quiz = {
    id: 'quiz-sci-2',
    title: 'Our Solar System',
    topic: 'Astronomy',
    questions: [
        { id: 'ssq1', question: 'Which is the largest planet in our solar system?', options: ['Jupiter', 'Saturn', 'Earth', 'Neptune'], correctAnswer: 'Jupiter', topic: 'Astronomy' },
        { id: 'ssq2', question: 'What is the name of the second planet from the Sun?', options: ['Venus', 'Mars', 'Mercury', 'Earth'], correctAnswer: 'Venus', topic: 'Astronomy' },
        { id: 'ssq3', question: 'Which planet is known as the "Red Planet"?', options: ['Mars', 'Jupiter', 'Venus', 'Saturn'], correctAnswer: 'Mars', topic: 'Astronomy' },
    ]
};

const defaultQuests: Omit<Quest, 'id' | 'completedAt' | 'proof'>[] = [
    { title: 'Read for 15 minutes', description: 'Find a quiet spot and read a book of your choice.', points: 20, status: 'active' },
    { title: 'Morning Math Puzzle', description: 'Complete the daily math challenge on the board.', points: 15, status: 'active' },
    { title: 'Help a Classmate', description: 'Offer help to someone who is stuck on a problem.', points: 25, status: 'active' },
    { title: 'Reading Summary', description: 'Write one paragraph summarizing what you read today.', points: 30, status: 'active', requiresProof: true },
    { title: 'Tidy Up Your Desk', description: 'Make sure your desk area is clean before recess.', points: 10, status: 'completed' },
];

// =================================================================
// ALL FUNCTION DEFINITIONS
// =================================================================

// --- QUIZZES ---
export const getQuizzes = (): Quiz[] => {
    try {
        const quizzesJson = localStorage.getItem(QUIZZES_KEY);
        return quizzesJson ? JSON.parse(quizzesJson) : [];
    } catch (error) {
        console.error("Failed to parse quizzes from localStorage", error);
        return [];
    }
};

const saveAllQuizzes = (quizzes: Quiz[]): void => {
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
};

export const saveQuiz = (quiz: Quiz): void => {
    const quizzes = getQuizzes();
    const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
    if (existingIndex > -1) {
        quizzes[existingIndex] = quiz;
    } else {
        quizzes.unshift(quiz);
    }
    saveAllQuizzes(quizzes);

    archiveService.addItem({
        type: 'Quiz',
        title: quiz.title,
        topic: quiz.topic,
        authorId: getTeachers()[0]?.id || 't1',
        content: quiz,
    });
};

// --- TEACHER CRUD ---
export const getTeachers = (): Teacher[] => {
    try {
        const teachersJson = localStorage.getItem(TEACHERS_KEY);
        return teachersJson ? JSON.parse(teachersJson) : [];
    } catch (e) {
        console.error("Failed to parse teachers", e);
        return [];
    }
};

const saveTeachers = (teachers: Teacher[]): void => {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
};

export const addTeacher = (teacherData: Omit<Teacher, 'id'>): Teacher => {
    const teachers = getTeachers();
    const newTeacher: Teacher = { ...teacherData, id: `t-${Date.now()}` };
    teachers.push(newTeacher);
    saveTeachers(teachers);
    return newTeacher;
};

export const updateTeacher = (teacherId: string, updates: Partial<Omit<Teacher, 'id'>>): Teacher | undefined => {
    const teachers = getTeachers();
    const index = teachers.findIndex(t => t.id === teacherId);
    if (index > -1) {
        teachers[index] = { ...teachers[index], ...updates };
        saveTeachers(teachers);
        return teachers[index];
    }
    return undefined;
};

export const deleteTeacher = (teacherId: string): void => {
    const teachers = getTeachers().filter(t => t.id !== teacherId);
    saveTeachers(teachers);
};

// --- STUDENT PROFILES / CRUD ---
export const getStudentProfiles = (): StudentProfile[] => {
    try {
        const profilesJson = localStorage.getItem(PROFILES_KEY);
        return profilesJson ? JSON.parse(profilesJson) : [];
    } catch (error) {
        console.error("Failed to parse student profiles from localStorage", error);
        return [];
    }
};

const saveStudentProfiles = (profiles: StudentProfile[]): void => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const getStudentProfile = (studentId: string): StudentProfile | undefined => {
    const profiles = getStudentProfiles();
    return profiles.find(p => p.id === studentId);
};

export const addStudent = (studentData: Omit<Student, 'id' | 'avatarUrl' | 'status'>): StudentProfile => {
    const profiles = getStudentProfiles();
    const studentId = `s-${Date.now()}`;
    const newProfile: StudentProfile = {
        ...studentData,
        id: studentId,
        avatarUrl: `https://i.pravatar.cc/40?u=${studentId}`,
        status: 'focused',
        incidents: [],
        iepGoals: [],
        points: 100,
        focusStreak: 0,
        readingStreak: 0,
        attendancePercentage: 100,
        quests: defaultQuests.map((q, i) => ({ ...q, id: `q-${studentId}-${i}`, completedAt: q.status === 'completed' ? new Date().toISOString() : undefined })),
        reflections: [],
        assignments: [],
        quizAttempts: [],
        learningPath: [],
        adventureModuleIds: ['advm-1', 'advm-2', 'advm-3', 'advm-4'],
        adventureHistory: [],
        selectedHero: HEROES[Math.floor(Math.random() * HEROES.length)].name,
        pronouns: 'they/them',
        interests: ['space'],
    };
    profiles.push(newProfile);
    saveStudentProfiles(profiles);
    return newProfile;
};

export const updateStudent = (studentId: string, updates: Partial<Omit<Student, 'id' | 'avatarUrl' | 'status'>>): StudentProfile | undefined => {
    const profiles = getStudentProfiles();
    const index = profiles.findIndex(p => p.id === studentId);
    if (index > -1) {
        profiles[index] = { ...profiles[index], ...updates };
        saveStudentProfiles(profiles);
        return profiles[index];
    }
    return undefined;
};

export const updateStudentPersonalization = (studentId: string, updates: { pronouns?: string; interests?: string[] }): void => {
    const profiles = getStudentProfiles();
    const index = profiles.findIndex(p => p.id === studentId);
    if (index > -1) {
        if(updates.pronouns) profiles[index].pronouns = updates.pronouns;
        if(updates.interests) profiles[index].interests = updates.interests;
        saveStudentProfiles(profiles);
    }
};

export const deleteStudent = (studentId: string): void => {
    const profiles = getStudentProfiles().filter(p => p.id !== studentId);
    saveStudentProfiles(profiles);
};

// --- ADVENTURE MODULES ---
export const getAdventureModules = (): AdventureModule[] => {
    try {
        const modulesJson = localStorage.getItem(ADVENTURE_MODULES_KEY);
        return modulesJson ? JSON.parse(modulesJson) : [];
    } catch (error) {
        console.error("Failed to parse adventure modules from localStorage", error);
        return [];
    }
};

const saveModules = (modules: AdventureModule[]): void => {
    localStorage.setItem(ADVENTURE_MODULES_KEY, JSON.stringify(modules));
};

export const saveAdventureModule = (moduleData: Omit<AdventureModule, 'id'>): AdventureModule => {
    const modules = getAdventureModules();
    const mockTeacher = getTeachers()[0] || mockTeacherData;
    const newModule: AdventureModule = {
        ...moduleData,
        teacherId: mockTeacher.id,
        teacherName: mockTeacher.name,
        id: `advm-${Date.now()}`,
    };
    modules.unshift(newModule); // Add to the top
    saveModules(modules);
    
    archiveService.addItem({
        type: 'AdventureModule',
        title: newModule.prompt,
        topic: newModule.topic,
        authorId: newModule.teacherId,
        content: newModule,
    });
    
    return newModule;
};

export const assignAdventureModuleToAllStudents = (moduleId: string): void => {
    const profiles = getStudentProfiles();
    profiles.forEach(profile => {
        if (!profile.adventureModuleIds) {
            profile.adventureModuleIds = [];
        }
        if (!profile.adventureModuleIds.includes(moduleId)) {
            profile.adventureModuleIds.push(moduleId);
        }
    });
    saveStudentProfiles(profiles);
};

export const addAdventureToHistory = (studentId: string, historyEntry: Omit<AdventureHistoryEntry, 'completedAt'>): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const newEntry: AdventureHistoryEntry = {
            ...historyEntry,
            completedAt: new Date().toISOString(),
        };
        if (!profiles[profileIndex].adventureHistory) {
            profiles[profileIndex].adventureHistory = [];
        }
        profiles[profileIndex].adventureHistory.unshift(newEntry);
        saveStudentProfiles(profiles);
    }
};


export const updateStudentHero = (studentId: string, hero: string): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);
    if (profileIndex !== -1) {
        profiles[profileIndex].selectedHero = hero;
        saveStudentProfiles(profiles);
    }
};

export const addIncidentToStudent = (studentId: string, incidentData: Omit<Incident, 'id' | 'timestamp'>): Incident | null => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const newIncident: Incident = {
            ...incidentData,
            id: `inc-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
        profiles[profileIndex].incidents.push(newIncident);

        // Adjust points based on incident type
        switch (incidentData.incidentType) {
            case 'Positive Behavior':
                profiles[profileIndex].points += 15;
                break;
            case 'Disruption':
            case 'Off-task':
                profiles[profileIndex].points -= 5;
                break;
            case 'Conflict':
            case 'Safety Concern':
                profiles[profileIndex].points -= 10;
                break;
        }
        if (profiles[profileIndex].points < 0) {
            profiles[profileIndex].points = 0;
        }

        saveStudentProfiles(profiles);
        return newIncident;
    }
    return null;
};

export const addIEPGoalToStudent = (studentId: string, goalData: Omit<IEPGoal, 'id' | 'dateCreated' | 'status'>): IEPGoal | null => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const newGoal: IEPGoal = {
            ...goalData,
            id: `goal-${Date.now()}`,
            dateCreated: new Date().toISOString(),
            status: 'pending_approval',
        };
        profiles[profileIndex].iepGoals.push(newGoal);
        saveStudentProfiles(profiles);
        return newGoal;
    }
    return null;
};

export const updateIEPGoalForStudent = (studentId: string, goalId: string, updates: Partial<IEPGoal>): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const goalIndex = profiles[profileIndex].iepGoals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
            profiles[profileIndex].iepGoals[goalIndex] = {
                ...profiles[profileIndex].iepGoals[goalIndex],
                ...updates
            };
            saveStudentProfiles(profiles);
        }
    }
};

export const deleteIEPGoalForStudent = (studentId: string, goalId: string): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        profiles[profileIndex].iepGoals = profiles[profileIndex].iepGoals.filter(goal => goal.id !== goalId);
        saveStudentProfiles(profiles);
    }
};

export const addReflectionToStudent = (studentId: string, reflectionData: Omit<Reflection, 'id' | 'date'>): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const newReflection: Reflection = {
            ...reflectionData,
            id: `ref-${Date.now()}`,
            date: new Date().toISOString(),
        };
        profiles[profileIndex].reflections.push(newReflection);
        saveStudentProfiles(profiles);
    }
};

export const updateQuestForStudent = (studentId: string, questId: string, status: QuestStatus, points: number): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const questIndex = profiles[profileIndex].quests.findIndex(q => q.id === questId);
        if (questIndex !== -1) {
            const quest = profiles[profileIndex].quests[questIndex];
            const originalStatus = quest.status;
            if (originalStatus !== status) {
                 quest.status = status;
                 if (status === 'completed') {
                    profiles[profileIndex].points += points;
                    quest.completedAt = new Date().toISOString();
                 } else {
                    profiles[profileIndex].points -= points;
                    quest.completedAt = undefined;
                 }
            }
        }
        saveStudentProfiles(profiles);
    }
};

export const submitAssignment = (studentId: string, assignmentId: string, submission: Omit<AssignmentSubmission, 'submittedDate'>): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const assignmentIndex = profiles[profileIndex].assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
            const fullSubmission = {
                ...submission,
                submittedDate: new Date().toISOString(),
            };
            profiles[profileIndex].assignments[assignmentIndex].status = 'submitted';
            profiles[profileIndex].assignments[assignmentIndex].submission = fullSubmission;
            saveStudentProfiles(profiles);

            archiveService.addItem({
                type: 'StudentWork',
                title: `Assignment: ${profiles[profileIndex].assignments[assignmentIndex].title}`,
                studentId: studentId,
                content: {
                    assignment: profiles[profileIndex].assignments[assignmentIndex],
                    submission: fullSubmission
                }
            });
        }
    }
};


export const submitQuestProof = (studentId: string, questId: string, proof: { type: 'text', content: string }): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const questIndex = profiles[profileIndex].quests.findIndex(q => q.id === questId);
        if (questIndex !== -1) {
            profiles[profileIndex].quests[questIndex].status = 'pending_review';
            profiles[profileIndex].quests[questIndex].proof = proof;
            saveStudentProfiles(profiles);
        }
    }
};

export const reviewQuestProof = (studentId: string, questId: string, isApproved: boolean): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const questIndex = profiles[profileIndex].quests.findIndex(q => q.id === questId);
        if (questIndex !== -1) {
            const quest = profiles[profileIndex].quests[questIndex];
            if (isApproved) {
                quest.status = 'completed';
                quest.completedAt = new Date().toISOString();
                profiles[profileIndex].points += quest.points;
            } else {
                quest.status = 'active'; // Send it back to the student
                quest.proof = undefined; // Clear previous attempt
            }
            saveStudentProfiles(profiles);
        }
    }
};

export const addQuizAttemptToStudent = (studentId: string, attemptData: Omit<StudentQuizAttempt, 'id' | 'timestamp' | 'studentId'>): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        const newAttempt: StudentQuizAttempt = {
            ...attemptData,
            id: `attempt-${Date.now()}`,
            studentId: studentId,
            timestamp: new Date().toISOString(),
        };
        
        profiles[profileIndex].quizAttempts.push(newAttempt);

        const pointsEarned = Math.round(attemptData.score / 10);
        profiles[profileIndex].points += pointsEarned;
        
        saveStudentProfiles(profiles);

        archiveService.addItem({
            type: 'StudentWork',
            title: `Quiz: ${attemptData.quizTitle}`,
            studentId: studentId,
            content: newAttempt
        });
    }
};

export const updateStudentLearningPath = (studentId: string, path: LearningRecommendation[]): void => {
    const profiles = getStudentProfiles();
    const profileIndex = profiles.findIndex(p => p.id === studentId);

    if (profileIndex !== -1) {
        profiles[profileIndex].learningPath = path;
        saveStudentProfiles(profiles);
    }
};

const generateWorksheetPdf = (worksheet: any, topic: string, title: string): string => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    let yPos = 60;
    const maxWidth = doc.internal.pageSize.getWidth() - 80;

    doc.setFontSize(22);
    doc.text(title, 40, yPos);
    yPos += 20;

    doc.setFontSize(12);
    doc.setTextColor(156, 163, 175);
    doc.text(`Topic: ${topic} | Name: ___________________________`, 40, yPos);
    yPos += 40;

    doc.setTextColor(229, 231, 235);

    const addSection = (sectionTitle: string, questions: any[], renderFn: (item: any, index: number) => void) => {
        if (questions && questions.length > 0) {
            doc.setFontSize(16);
            doc.text(sectionTitle, 40, yPos);
            yPos += 25;
            questions.forEach(renderFn);
            yPos += 20;
        }
    };

    addSection("Multiple Choice", worksheet.multipleChoice, (mc, index) => {
        doc.setFontSize(12);
        const qText = doc.splitTextToSize(`${index + 1}. ${mc.question}`, maxWidth);
        doc.text(qText, 40, yPos);
        yPos += (qText.length * 15);
        mc.options.forEach((opt: string) => {
            doc.text(`  ◯  ${opt}`, 50, yPos);
            yPos += 20;
        });
        yPos += 10;
    });
    
    addSection("Fill in the Blank", worksheet.fillInTheBlank, (fitb, index) => {
        doc.setFontSize(12);
        const sentence = fitb.sentence.replace('__BLANK__', '_________________');
        const qText = doc.splitTextToSize(`${index + 1}. ${sentence}`, maxWidth);
        doc.text(qText, 40, yPos);
        yPos += (qText.length * 15) + 20;
    });

    addSection("Short Answer", worksheet.shortAnswer, (sa, index) => {
        doc.setFontSize(12);
        const saText = doc.splitTextToSize(`${index + 1}. ${sa.question}`, maxWidth);
        doc.text(saText, 40, yPos);
        yPos += (saText.length * 15) + 80;
    });

    return doc.output('datauristring');
};

export const addAssignmentToAllStudents = (assignmentData: any): void => {
    const profiles = getStudentProfiles();
    const mockTeacher = getTeachers()[0] || mockTeacherData;
    let finalAssignmentData = { ...assignmentData };

    if (finalAssignmentData.type === 'worksheet' && finalAssignmentData.worksheetData) {
        const pdfDataUrl = generateWorksheetPdf(finalAssignmentData.worksheetData, finalAssignmentData.topic, finalAssignmentData.title);
        finalAssignmentData.pdfUrl = pdfDataUrl;
        finalAssignmentData.pdfName = `${finalAssignmentData.title.replace(/\s+/g, '_')}.pdf`;
        delete finalAssignmentData.worksheetData;
        delete finalAssignmentData.type;
    }

    profiles.forEach(profile => {
        const newAssignment: Assignment = {
            ...finalAssignmentData,
            id: `assign-${profile.id}-${Date.now()}`,
            assignedDate: new Date().toISOString(),
            status: 'pending',
            teacherId: mockTeacher.id,
        };
        profile.assignments.unshift(newAssignment);
    });
    saveStudentProfiles(profiles);
};

// =================================================================
// INITIALIZATION FUNCTION DEFINITIONS
// =================================================================

const initializeQuizzes = (): void => {
    const existingQuizzes = localStorage.getItem(QUIZZES_KEY);
    if (!existingQuizzes || JSON.parse(existingQuizzes).length < 4) {
        localStorage.setItem(QUIZZES_KEY, JSON.stringify([scienceQuiz, romeQuiz, fractionsQuiz, solarSystemQuiz]));
    }
};

const initializeTeachers = (): void => {
    const existing = localStorage.getItem(TEACHERS_KEY);
    if (!existing) {
        localStorage.setItem(TEACHERS_KEY, JSON.stringify([mockTeacherData]));
    }
};

const initializeProfiles = (): void => {
    const existingProfiles = localStorage.getItem(PROFILES_KEY);
    if (!existingProfiles) {
        const mockTeacher = getTeachers()[0] || mockTeacherData;
        const initialProfiles: StudentProfile[] = mockStudentsData.map((student, i) => {
            const studentId = `s${i + 1}`;
            let points = 150 + Math.floor(Math.random() * 50);
            let quizAttempts: StudentQuizAttempt[] = [];
            let incidents: Incident[] = [];
            let iepGoals: IEPGoal[] = [];
            let adventureHistory: AdventureHistoryEntry[] = [];
            
            const studentAssignments: Assignment[] = [
                 { id: `assign-${studentId}-1`, title: 'Chapter 3 Reading Summary', description: 'Read chapter 3 of the Ancient Rome textbook and write a one-page summary of the key events.', dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], topic: 'Ancient Rome', assignedDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], teacherId: mockTeacher.id, status: 'pending' },
                 { id: `assign-${studentId}-2`, title: 'Photosynthesis Diagram', description: 'Draw and label a diagram explaining the process of photosynthesis. Use the attached guide.', dueDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], topic: 'Biology', pdfName: 'photosynthesis_guide.pdf', pdfUrl: '#', assignedDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], teacherId: mockTeacher.id, status: 'pending' },
            ];
            
            // --- Create varied demo data for different students ---
            switch(student.name) {
                case 'Alia Garcia': // Excelling student
                    points = 250;
                    quizAttempts.push({ id: `att-s1-1`, quizId: 'quiz-sci-1', quizTitle: scienceQuiz.title, studentId, timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), score: 95, answers: [{questionId: 'q1', studentAnswer: 'Photosynthesis', isCorrect: true}, {questionId: 'q2', studentAnswer: 'Carbon Dioxide', isCorrect: true}, {questionId: 'q3', studentAnswer: 'Melanin', isCorrect: false}] });
                    quizAttempts.push({ id: `att-s1-2`, quizId: 'quiz-hist-1', quizTitle: romeQuiz.title, studentId, timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), score: 100, answers: [{questionId: 'rq1', studentAnswer: 'Augustus', isCorrect: true}, {questionId: 'rq2', studentAnswer: 'The Colosseum', isCorrect: true}, {questionId: 'rq3', studentAnswer: 'Tiber', isCorrect: true}, {questionId: 'rq4', studentAnswer: 'Patricians and Plebeians', isCorrect: true}] });
                    incidents.push({ id: 'inc-s1-1', studentId, studentName: student.name, timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), incidentType: 'Positive Behavior', summary: 'Helped a classmate understand a difficult math problem.', severity: 'low' });
                    adventureHistory.push({ moduleId: 'advm-1', title: 'The Journey of a Water Droplet', completedAt: new Date(Date.now() - 3 * 86400000).toISOString(), score: 100 });
                    break;
                
                case 'Chloe Davis': // Needs attention (academically)
                    points = 90;
                    quizAttempts.push({ id: `att-s3-1`, quizId: 'quiz-sci-1', quizTitle: scienceQuiz.title, studentId, timestamp: new Date(Date.now() - 11 * 86400000).toISOString(), score: 67, answers: [{questionId: 'q1', studentAnswer: 'Photosynthesis', isCorrect: true}, {questionId: 'q2', studentAnswer: 'Oxygen', isCorrect: false}, {questionId: 'q3', studentAnswer: 'Chlorophyll', isCorrect: true}] });
                    quizAttempts.push({ id: `att-s3-2`, quizId: 'quiz-math-1', quizTitle: fractionsQuiz.title, studentId, timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), score: 33, answers: [{questionId: 'mq1', studentAnswer: '3/4', isCorrect: true}, {questionId: 'mq2', studentAnswer: '3/4', isCorrect: false}, {questionId: 'mq3', studentAnswer: 'Denominator', isCorrect: false}] });
                    incidents.push({ id: 'inc-s3-1', studentId, studentName: student.name, timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), incidentType: 'Off-task', summary: 'Was looking out the window during the lesson.', severity: 'low' });
                    studentAssignments[1].status = 'submitted'; // Mark one assignment as submitted
                    studentAssignments[1].submission = { type: 'text', content: 'This is my diagram description.', submittedDate: new Date(Date.now() - 4 * 86400000).toISOString() };
                    break;

                case 'Frank Green': // Needs attention (behaviorally)
                    points = 50;
                    incidents.push({ id: 'inc-s6-1', studentId, studentName: student.name, timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), incidentType: 'Disruption', summary: 'Talking during quiet reading time.', severity: 'medium' });
                    incidents.push({ id: 'inc-s6-2', studentId, studentName: student.name, timestamp: new Date(Date.now() - 8 * 86400000).toISOString(), incidentType: 'Safety Concern', summary: 'Was running in the classroom.', severity: 'high' });
                    iepGoals.push({ id: 'goal-s6-1', studentId, goal: 'Will use coping strategies to manage frustration in 4 out of 5 observed instances.', focusArea: 'Social-Emotional Regulation', dateCreated: new Date(Date.now() - 30 * 86400000).toISOString(), status: 'active' });
                    break;
                
                 case 'Ben Carter':
                    adventureHistory.push({ moduleId: 'advm-2', title: "Mystery of the Pharaoh's Tomb", completedAt: new Date(Date.now() - 7 * 86400000).toISOString(), score: 75 });
                    break;
            }

            return {
                ...student,
                id: studentId,
                incidents,
                iepGoals,
                points,
                focusStreak: Math.floor(Math.random() * 10),
                readingStreak: Math.floor(Math.random() * 20),
                attendancePercentage: student.name === 'Henry King' ? 85 : 90 + Math.floor(Math.random() * 11), // Make Henry have lower attendance
                quests: defaultQuests.map((q, idx) => ({ ...q, id: `q-${studentId}-${idx}`, completedAt: q.status === 'completed' ? new Date(Date.now() - idx * 3600000).toISOString() : undefined })),
                reflections: [],
                assignments: studentAssignments,
                quizAttempts,
                learningPath: [],
                adventureModuleIds: ['advm-1', 'advm-2', 'advm-3', 'advm-4'],
                adventureHistory,
                selectedHero: HEROES[i % HEROES.length].name, // Cycle through heroes for variety
                pronouns: ['he/him', 'she/her', 'they/them'][i % 3],
                interests: [['dinosaurs', 'space'], ['art', 'music'], ['video games', 'sports']][i % 3],
            };
        });
        localStorage.setItem(PROFILES_KEY, JSON.stringify(initialProfiles));
    }
};

const initializeAdventureModules = (): void => {
    const existingModules = localStorage.getItem(ADVENTURE_MODULES_KEY);
    if (!existingModules || JSON.parse(existingModules).length < 4) {
        const mockTeacher = getTeachers()[0] || mockTeacherData;
        const initialModules: AdventureModule[] = [
            {
                id: 'advm-1', topic: 'The Water Cycle', prompt: 'The Journey of a Water Droplet', ageGroup: '8-10', stages: 4,
                learningObjectives: ['Identify the stages of the water cycle.', 'Understand the role of the sun in evaporation.'],
                finalAssessmentQuestion: { question: 'What is it called when water turns from a gas back into a liquid?', answer: 'Condensation' },
                teacherId: mockTeacher.id, teacherName: mockTeacher.name,
            },
            {
                id: 'advm-2', topic: 'Ancient Egypt', prompt: 'Mystery of the Pharaoh\'s Tomb', ageGroup: '8-10', stages: 5,
                learningObjectives: ['Learn about the purpose of pyramids.', 'Understand the cultural significance of pharaohs.'],
                finalAssessmentQuestion: { question: 'What were ancient Egyptian rulers called?', answer: 'Pharaohs' },
                teacherId: mockTeacher.id, teacherName: mockTeacher.name,
            },
            {
                id: 'advm-3', topic: 'Radioactivity', prompt: 'Marie Curie\'s Discovery', ageGroup: '11-13', stages: 3,
                learningObjectives: ['Understand the concept of radioactivity.', 'Learn about Marie Curie\'s major scientific achievements.'],
                finalAssessmentQuestion: { question: 'What was one of the elements Marie Curie discovered?', answer: 'Radium' },
                teacherId: mockTeacher.id, teacherName: mockTeacher.name,
            },
            {
                id: 'advm-4',
                topic: 'Our Solar System',
                prompt: 'An adventure to correct common myths about space!',
                ageGroup: '8-10',
                stages: 4,
                learningObjectives: ['Understand the heliocentric model of the solar system.', 'Differentiate between rotation and revolution.'],
                finalAssessmentQuestion: { question: 'What is the name for the path a planet takes around the sun?', answer: 'Orbit' },
                teacherId: mockTeacher.id,
                teacherName: mockTeacher.name,
            }
        ];
        localStorage.setItem(ADVENTURE_MODULES_KEY, JSON.stringify(initialModules));
    }
};

// =================================================================
// TOP-LEVEL SCRIPT EXECUTION
// =================================================================

initializeTeachers();
initializeQuizzes();
initializeProfiles();
initializeAdventureModules();