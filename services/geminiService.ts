import { GoogleGenAI, Type, LiveServerMessage, Modality, Blob as GenAI_Blob, GenerateContentResponse } from "@google/genai";
// FIX: Import Quiz type and remove non-exported LiveSession
import { Incident, IEPGoalRequest, ParentCommunicationRequest, IncidentType, StudentProfile, LearningRecommendation, Quiz, ChatMessage, LessonPlanRequest, LessonPlan, AdventureModule, InteractiveAdventure, SmartSuggestion, SupportRecommendation, Message, CommunicationTopic, communicationTopicLabels, AdventureNode, InteractionFindMistakePayload } from "../types.ts";
import * as studentDataService from './studentDataService.ts';
import * as archiveService from './archiveService.ts';
import { HEROES } from './heroData.ts';


const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will be mocked.");
}

// FIX: Defined a named interface `AIStudio` and used it for `window.aistudio` to resolve a global type declaration conflict.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface Flashcard {
    word: string;
    definition: string;
}

// Locally defined to avoid modifying types.ts
export interface Slide {
    title: string;
    points: string[];
    imagePrompt: string | null;
}

const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});


/**
 * Transcribes an audio blob using the Gemini API.
 */
export const transcribeAudio = async (blob: Blob): Promise<string> => {
    if (!ai) {
        console.warn("API_KEY not available, using mock transcription.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return "This is a mock transcription because no API key is available. In a real scenario, this audio would be sent to the Gemini API for transcription. The user mentioned the water cycle, so the summary should be about that.";
    }

    try {
        const base64Audio = await blobToBase64(blob);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: blob.type || 'audio/webm', data: base64Audio } },
                    { text: 'Transcribe this audio recording.' }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio with Gemini:", error);
        return "Sorry, there was an error with transcription.";
    }
};

export const analyzeVideo = async (frames: string[], fileName: string): Promise<{ summary: string; suggestedTopic: string }> => {
    console.log(`Analyzing video ${fileName} with ${frames.length} frames...`);

    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 2500));
        return {
            summary: `This is a mock analysis of the video "${fileName}". It appears to be about the water cycle, showing clouds, rain, and rivers. Key points include evaporation, condensation, and precipitation.`,
            suggestedTopic: "The Water Cycle"
        };
    }

    try {
        const model = 'gemini-2.5-pro'; // As requested for video understanding
        const systemInstruction = `You are an expert educational content analyst. Your task is to analyze a sequence of video frames and provide a concise summary and a suggested lesson topic. The output MUST be a valid JSON object.`;

        const imageParts = frames.map(frame => ({
            inlineData: { mimeType: 'image/jpeg', data: frame }
        }));
        
        const textPart = { text: 'Analyze these frames from a video and provide a summary and topic suitable for a K-12 lesson plan.' };

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [textPart, ...imageParts] },
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: "A detailed summary of the video's content, highlighting key educational points."
                        },
                        suggestedTopic: {
                            type: Type.STRING,
                            description: "A concise, relevant lesson topic based on the video."
                        }
                    },
                    required: ['summary', 'suggestedTopic']
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing video:", error);
        throw new Error("Failed to analyze video with AI.");
    }
};


const getPerformanceLevel = (student: StudentProfile): 'Struggling' | 'Average' | 'Advanced' => {
    if (student.quizAttempts.length === 0) return 'Average'; // Default if no data
    const totalScore = student.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const avgScore = totalScore / student.quizAttempts.length;

    if (avgScore < 70) return 'Struggling';
    if (avgScore > 90) return 'Advanced';
    return 'Average';
};

export const explainQuizMistake = async (
    student: StudentProfile,
    question: string,
    studentAnswer: string,
    correctAnswer: string,
    topic: string
): Promise<AsyncGenerator<string>> => {
    console.log("Generating AI explanation for quiz mistake...", { gradeLevel: student.gradeLevel, question, studentAnswer, correctAnswer, topic });

    if (!ai) {
        async function* mockStream() {
            const text = `Great try on that question! Let's break it down. The correct answer is "${correctAnswer}". Here's a mock explanation about why. Keep up the great work!`;
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 100));
                yield word + ' ';
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-flash-lite';
        const performanceLevel = getPerformanceLevel(student);
        let performanceInstruction = '';
        switch (performanceLevel) {
            case 'Struggling':
                performanceInstruction = `This student is in ${student.gradeLevel}th grade and is currently struggling with the topic. Your persona should be exceptionally patient, warm, and encouraging.
- Your primary goal is to build confidence and correct the misunderstanding without causing discouragement.
- The explanation must be very simple and age-appropriate. Use a relatable analogy for a ${student.gradeLevel}th grader.
- Focus on the single, most important foundational concept they missed.
- Break down the explanation into clear, step-by-step logic.
- Acknowledge that the student's answer was a "good thought" or a "common mistake" before correcting it.`;
                break;
            case 'Advanced':
                performanceInstruction = "This student is performing well. Provide a more nuanced explanation that clarifies the specific mistake and potentially introduces a related, more advanced concept to challenge them.";
                break;
            default: // Average
                performanceInstruction = "This student has a basic understanding. Focus on clarifying the specific misconception and reinforcing the correct logic.";
                break;
        }

        const systemInstruction = `You are a friendly, encouraging, and expert AI tutor for a ${student.gradeLevel}th-grade student. Your goal is to explain why a student's answer to a quiz question was incorrect and to clarify the concept without making them feel bad.
- ${performanceInstruction}
- Your response MUST be tailored to a ${student.gradeLevel}th-grade reading level.
- Start with encouragement (e.g., "Great try!", "That's a common mistake, let's look closer!").
- Clearly state the student's answer and the correct answer.
- Explain the correct concept using the provided topic as context, as if you are referencing class materials.
- Gently explain why the student's answer was incorrect, perhaps acknowledging why they might have thought it was right.
- End with a positive and motivating closing statement.
- Do NOT just give the answer. Explain the 'why'.
- Keep the explanation concise and easy to understand.`;

        const contents = `Here is the quiz question and the student's response. Please explain their mistake based on the system instructions.
- Topic of the lesson: ${topic}
- Question: "${question}"
- Student's Incorrect Answer: "${studentAnswer}"
- Correct Answer: "${correctAnswer}"`;

        const responseStream = await ai.models.generateContentStream({
            model,
            contents: { parts: [{ text: contents }] },
            config: {
                systemInstruction,
                temperature: 0.7,
            }
        });

        async function* stream() {
            for await (const chunk of responseStream) {
                yield chunk.text;
            }
        }
        return stream();

    } catch (error) {
        console.error("Error generating explanation:", error);
        async function* errorStream() {
            yield "I had a little trouble generating an explanation right now. Please ask your teacher for help, and we can try again later!";
        }
        return errorStream();
    }
};

export const generateLearningPath = async (student: StudentProfile): Promise<LearningRecommendation[]> => {
    console.log(`Generating learning path for ${student.name}...`);
    
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return [
            { type: 'lesson', topic: 'Photosynthesis', title: 'Review: What Plants Eat', description: 'Let\'s go over the key ingredients plants use to make their own food. We\'ll look at sunlight, water, and that special gas they breathe.', difficulty: 'easy' },
            { type: 'practice', topic: 'Photosynthesis', title: 'Practice: Label the Plant Parts', description: 'You\'ll get a picture of a plant. Can you label the parts that help it make food, like the leaves and roots?', difficulty: 'easy' },
            { type: 'lesson', topic: 'Ancient Rome', title: 'Lesson: The Roman Senate', description: 'A quick refresher on who was in the Roman Senate and what their job was.', difficulty: 'medium' },
        ];
    }

    const recentMistakes = student.quizAttempts
        .flatMap(attempt => attempt.answers.filter(a => !a.isCorrect))
        .slice(-5); // Look at last 5 mistakes
    
    if (recentMistakes.length === 0) {
        return []; // No mistakes to analyze
    }

    const quizzes = studentDataService.getQuizzes();
    const topicsForReview = [...new Set(recentMistakes.map(m => {
        const quizAttempt = student.quizAttempts.find(att => att.answers.some(ans => ans.questionId === m.questionId));
        const quiz = quizzes.find(q => q.id === quizAttempt?.quizId);
        const question = quiz?.questions.find(q => q.id === m.questionId);
        return question?.topic;
    }))].filter(Boolean);

    if (topicsForReview.length === 0) {
        return [];
    }

    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are an expert curriculum designer and adaptive learning AI for K-12 students. Your task is to create a short, personalized learning path for a student based on their recent performance.
- You will be given the student's grade level and the topics of questions they answered incorrectly.
- You MUST generate 2-3 specific, actionable recommendations.
- Each recommendation should be either a 'lesson' (a concept to review) or a 'practice' (a small task to complete).
- All recommendations must be tailored to the student's grade level in terms of complexity and tone.
- The output MUST be a valid JSON array of objects, adhering to the provided schema. Do not output anything else.`;

        const contents = `Generate a learning path for the following student:
- Grade Level: ${student.gradeLevel}
- Topics of Recent Incorrect Answers: ${topicsForReview.join(', ')}

Please generate 2-3 learning recommendations based on these topics.`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: contents }] },
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['lesson', 'practice'] },
                            topic: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING, description: 'A brief, student-friendly description of the task.' },
                            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
                        },
                        required: ['type', 'topic', 'title', 'description', 'difficulty'],
                    }
                },
                temperature: 0.8,
            }
        });
        
        // The response text is a JSON string, so we parse it.
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as LearningRecommendation[];

    } catch (error) {
        console.error("Error generating learning path:", error);
        // Fallback to a mock-style response on error
        return [{ type: 'lesson', topic: 'General', title: 'AI Helper Error', description: 'The AI had trouble creating a path. Please ask your teacher for help!', difficulty: 'easy' }];
    }
};

export const askAITeacher = async (student: StudentProfile, question: string, history: ChatMessage[]): Promise<AsyncGenerator<GenerateContentResponse>> => {
    console.log(`Asking AI Teacher for ${student.name}: "${question}"`);
    
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const mockResponses = [
                "That's a great question! Let's think about it. The water cycle is like a big journey for water. First, the sun warms it up and it floats into the sky. That's evaporation! [IMAGE: A smiling sun warming up the ocean, with wavy lines going up to a cloud]",
                "I can definitely help with that! Photosynthesis is how plants make their own food. They use sunlight, water, and a gas called carbon dioxide. It's like they're little chefs! [MULTIPLE_CHOICE:What gas do plants breathe in?|Carbon Dioxide|Oxygen|Nitrogen]",
                "Excellent question! A verb is an action word. It's something you can DO! Like 'jump', 'run', or... The word 'run' is an [FILL_IN_BLANK:action word, also known as a {verb}].",
                "Let's test your knowledge! [MATCHING:Match the planet to its feature|Mars=The Red Planet|Jupiter=The Largest Planet|Saturn=Has famous rings]",
                "Let's see if you can put these historical events in order! [ORDERING:Order these events from oldest to newest.|The founding of Rome|The start of the Roman Empire|The fall of the Western Roman Empire]"
            ];
            const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
            const words = responseText.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 100));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-flash';
        const performanceLevel = getPerformanceLevel(student);
        let performanceInstruction = '';

        switch (performanceLevel) {
            case 'Struggling':
                performanceInstruction = `The student's performance level is 'Struggling'. Your persona should be exceptionally patient, warm, and encouraging. Your primary goal is to build their confidence.
- Use very simple, clear language, avoiding complex vocabulary.
- Break down concepts into small, easy-to-understand steps.
- Use relatable analogies and examples that a ${student.gradeLevel}th-grade child would understand.`;
                break;
            case 'Advanced':
                performanceInstruction = `The student's performance level is 'Advanced'. You can introduce more complex ideas or connections to other topics, but you must still explain them clearly in a way a ${student.gradeLevel}th grader can understand. Challenge them with a follow-up thought or question.`;
                break;
            default: // Average
                performanceInstruction = `The student's performance level is 'Average'. Provide a clear, straightforward explanation tailored to a ${student.gradeLevel}th grader. Reinforce the core concepts.`;
                break;
        }

        const hero = HEROES.find(h => h.name === student.selectedHero) || HEROES[0];

        const systemInstruction = `You are an educational AI assistant who embodies a specific character to make learning fun for a ${student.gradeLevel}th grade student.

YOUR CURRENT PERSONA:
- Character: ${hero.name}
- Description: ${hero.description}
- You MUST speak, act, and respond in the voice and personality of this character. Stay in character at all times. Use their catchphrases or style if they have any.

YOUR TEACHING STYLE:
- Your goal is to explain concepts clearly and engagingly, using your character's personality.
- You MUST use interactive teaching methods when appropriate to check for understanding. Use the following formats EXACTLY:

1.  **Fill-in-the-Blank:** To ask for a specific term. The blank should contain only one or two key words.
    - Format: This is a sentence with a [FILL_IN_BLANK:The answer is {correct_answer} here].
    - The text inside the curly braces {} is the correct answer.
    - OPTIONAL WORD BANK: You can provide a word bank. The first word MUST be the correct answer. Format: [FILL_IN_BLANK:The process is called {photosynthesis}|photosynthesis|respiration|transpiration]

2.  **Multiple Choice Question:** To ask a question with several options.
    - Format: [MULTIPLE_CHOICE:What is the capital of France?|Paris|London|Berlin]
    - The question is first, followed by a pipe |. The FIRST option after the question is ALWAYS the correct answer. The options are separated by pipes. Provide 3-4 options in total.

3.  **Matching Exercise:** To test connections between concepts. Provide 3-4 pairs.
    - Format: [MATCHING:Match the term to its definition.|Term A=Definition A|Term B=Definition B|Term C=Definition C]
    - The instruction is first. Items and their correct matches are separated by '='. Each pair is separated by a pipe '|'.

4.  **Ordering Exercise:** To test sequences.
    - Format: [ORDERING:Put these in order.|First Item|Second Item|Third Item]
    - The instruction is first. The items are listed in the CORRECT order, separated by pipes. The UI will shuffle them.
    
5.  **Find the Mistake:** To test critical thinking. The mistake should be wrapped in curly braces. The correction comes after a pipe.
    - Format: [FIND_THE_MISTAKE:The sun revolves around the {Earth}.|The Earth revolves around the Sun.]

6.  **Categorization/Sorting:** To test grouping concepts.
    - Format: [CATEGORIZATION:Sort these animals.|Mammals|Reptiles|Dolphin=Mammals|Snake=Reptiles|Dog=Mammals|Lizard=Reptiles]
    - The instruction is first, then the category names, then each item with its correct category separated by '='. All parts are separated by pipes '|'.

- Use a variety of these widgets to make the conversation interactive and fun. Don't just lecture.
- Tailor your explanations to the student's grade level and performance level. ${performanceInstruction}
- Keep responses concise.
- If a visual explanation would be very helpful, embed a description for an AI image generation AI in your response. The description should be enclosed in special tags like this: [IMAGE: A simple diagram of the water cycle with labels for evaporation, condensation, and precipitation]. The image should be educational and easy for a child to understand.
`;
        
        const contents: ChatMessage[] = [...history, { role: 'user', parts: [{ text: question }] }];

        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: { systemInstruction },
        });
        
        return responseStream;

    } catch (error) {
        console.error("Error asking AI Teacher:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble thinking right now. Maybe we can try a different question?" } as GenerateContentResponse;
        }
        return errorStream();
    }
};

export const askSpecializedTutor = async (
    question: string,
    history: ChatMessage[],
    systemInstruction: string
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const text = "This is a mock response from a specialized tutor. Based on your question and my special instructions, here is a detailed answer.";
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 80));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-flash';
        const contents: ChatMessage[] = [...history, { role: 'user', parts: [{ text: question }] }];

        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: { systemInstruction, temperature: 0.7 },
        });

        return responseStream;

    } catch (error) {
        console.error("Error with Specialized Tutor:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble connecting right now. Please try again." } as GenerateContentResponse;
        }
        return errorStream();
    }
};

export const solveMathProblem = async (problem: string, gradeLevel: number): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const text = `**Answer:** x = 5\n\n### Step-by-step solution:\n\n1.  **Start with the equation:**\n    \`2x + 5 = 15\`\n\n2.  **Isolate the x term.** To do this, we need to get rid of the +5 on the left side. We do the opposite operation, which is subtracting 5. We must do this to both sides of the equation to keep it balanced.\n    \`2x + 5 - 5 = 15 - 5\`\n    \`2x = 10\`\n\n3.  **Solve for x.** Now, x is being multiplied by 2. To undo this, we do the opposite operation: division. Divide both sides by 2.\n    \`2x / 2 = 10 / 2\`\n    \`x = 5\`[MULTIPLE_CHOICE:In step 2, why did we subtract 5 from both sides?|To keep the equation balanced|To make the numbers smaller|Because it's the first step]`;
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 50));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-pro'; // Good for reasoning
        const systemInstruction = `You are an expert math tutor AI, similar to Symbolab. Your goal is to help a ${gradeLevel}th-grade student understand how to solve math problems.
- First, state the final answer clearly and bold it (e.g., **Answer: x = 5**).
- Then, provide a section titled "### Step-by-step solution:".
- Under this section, break down the solution into numbered, easy-to-follow steps.
- Explain the logic for each step in simple, age-appropriate language.
- Use markdown for formatting. Use code blocks (\` \`) for equations within steps to make them stand out.
- If the problem is a function that can be graphed (e.g., contains 'y =' or 'f(x) ='), add a "### Graph Analysis:" section. In this section, describe key features like the x-intercepts, y-intercept, slope, or vertex.
- After the full solution, add ONE simple multiple-choice question to check for understanding of a key concept from the solution. Use the format: [MULTIPLE_CHOICE:Question?|Correct Answer|Incorrect Answer|Incorrect Answer].`;

        const contents = `Solve the following math problem: "${problem}"`;

        const responseStream = await ai.models.generateContentStream({
            model,
            contents: { parts: [{ text: contents }] },
            config: { systemInstruction },
        });

        return responseStream;

    } catch (error) {
        console.error("Error solving math problem:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble with my calculations right now. Please check the problem and try again." } as GenerateContentResponse;
        }
        return errorStream();
    }
};

export const solveCodeProblem = async (problem: string, language: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const text = `This is a mock response.\n\n\`\`\`${language.toLowerCase()}\n// Your code solution would appear here.\nconsole.log("Hello, World!");\n\`\`\`\n\n### Explanation:\n\n1.  **This is step one.** The code does this.\n2.  **This is step two.** Then, the code does this.[MULTIPLE_CHOICE:What does console.log do?|It prints a message to the console|It creates a new variable|It stops the program]`;
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 50));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-pro';
        const systemInstruction = `You are an expert coding tutor for a K-12 student. Your goal is to provide a complete, correct code solution and then explain it in a way a beginner can understand.
- Provide only the code first, inside a single markdown code block.
- Then, under a "### Explanation:" heading, break down how the code works into simple, numbered steps.
- After the explanation, add ONE interactive widget to test understanding. It can be a multiple-choice question about the code's purpose or a fill-in-the-blank about a keyword. Use the formats [MULTIPLE_CHOICE:...?|...|...] or [FILL_IN_BLANK:...?{...}].
- Do not add any conversational text before the code block or after the explanation. The response must start with the code block.`;

        const contents = `Provide a code solution and explanation for the following problem in the language "${language}":\n\n${problem}`;

        const responseStream = await ai.models.generateContentStream({
            model,
            contents: { parts: [{ text: contents }] },
            config: { systemInstruction },
        });

        return responseStream;

    } catch (error) {
        console.error("Error solving code problem:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble with my code right now. Please check the problem and try again." } as GenerateContentResponse;
        }
        return errorStream();
    }
};


export const converseWithLanguageTutor = async (question: string, history: ChatMessage[], language: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const responses: Record<string, string> = {
                'Spanish': '¡Hola! Claro, podemos practicar español. ¿De qué te gustaría hablar? The Spanish word for apple is [FILL_IN_BLANK:una {manzana} roja].',
                'French': 'Bonjour! Bien sûr, nous pouvons pratiquer le français. De quoi aimerais-tu parler?',
                'Mandarin Chinese': '你好！当然，我们可以练习普通话。你想聊点什么？'
            }
            const text = responses[language] || `Hello! Let's practice ${language}. What would you like to talk about?`;
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 100));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are a friendly, patient, and encouraging language tutor. The student wants to practice speaking and writing in ${language}.
- Your primary goal is to facilitate a conversation in ${language}.
- Converse with the student almost exclusively in ${language} to promote immersion.
- If the student makes a mistake in ${language}, gently correct them and briefly explain the correction in ${language}. For example: "Casi, se dice 'estoy' en vez de 'soy'. ¡Buen intento!"
- If the student asks a question in English (e.g., "how do I say..."), you can provide the translation and then seamlessly continue the conversation in ${language}.
- Occasionally, test vocabulary by using a fill-in-the-blank format like: 'The word for apple is [FILL_IN_BLANK:una {manzana} roja].' You can also use multiple choice questions. Use these widgets sparingly to keep the conversation natural.
- Keep your responses friendly, natural, and not overly long to encourage back-and-forth conversation.
- Your persona is that of a helpful peer, not a formal teacher.`;

        const contents: ChatMessage[] = [...history, { role: 'user', parts: [{ text: question }] }];

        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: { systemInstruction },
        });

        return responseStream;

    } catch (error) {
        console.error("Error with Language Tutor:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble connecting right now. Please try again." } as GenerateContentResponse;
        }
        return errorStream();
    }
};

export const getTtsAudio = async (text: string, language: string): Promise<string> => {
    if (!ai) {
        console.warn("API_KEY not available, using mock TTS.");
        await new Promise(resolve => setTimeout(resolve, 500));
        return ''; // Return empty string for mock
    }
    
    // The TTS model infers language from the text content. No special prompt is needed.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              // Using a versatile voice. Specific language voices can be chosen for more nuance.
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return base64Audio;
    }
    throw new Error("AI did not return audio data.");
};


// FIX: Added 'askSimpleChat' function for the general chatbot component.
export const askSimpleChat = async (question: string, history: ChatMessage[]): Promise<AsyncGenerator<string>> => {
    if (!ai) {
        async function* mockStream() {
            const text = "This is a mock stream response as the API key is not configured.";
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(resolve => setTimeout(resolve, 100));
                yield word + ' ';
            }
        }
        return mockStream();
    }
    try {
        const model = 'gemini-2.5-flash-lite';
        
        const chat = ai.chats.create({
          model,
          history: history,
        });

        const responseStream = await chat.sendMessageStream({ message: question });

        async function* stream() {
            for await (const chunk of responseStream) {
                yield chunk.text;
            }
        }
        return stream();
    } catch (error) {
        console.error("Error in askSimpleChat:", error);
        async function* errorStream() {
            yield "Sorry, I encountered an error.";
        }
        return errorStream();
    }
};

// FIX: Modified 'askAstraForTeachers' to return an object with 'text' and 'sources' to match component usage.
export const askAstraForTeachers = async (question: string, history: ChatMessage[], lessonPlanContext: LessonPlan | null): Promise<AsyncGenerator<GenerateContentResponse>> => {
    console.log(`Asking Astra for Teachers: "${question}"`);
    
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const mockResponses = [
                "That's an excellent question for this lesson plan. Based on your objective about 'The Roman Senate', you could try a 'Jigsaw' activity. Divide students into groups, each researching one aspect of the Senate (e.g., who could be a senator, what their powers were, a famous senator). Then, they can regroup and teach their peers. This promotes collaboration and deeper understanding.",
                "For differentiation, consider providing a vocabulary list with definitions for students who need support. For a challenge, you could ask advanced students to compare the Roman Senate to a modern-day legislative body.",
            ];
            const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
            const words = responseText.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 100));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-flash-lite';

        const systemInstruction = `You are "Professor Astra", an expert AI instructional coach and curriculum designer for K-12 teachers. Your goal is to provide insightful, practical, and evidence-based advice on lesson planning, teaching strategies, differentiation, assessment, and curriculum standards.
- Your tone must be encouraging, professional, collaborative, and helpful.
- Provide concrete, actionable suggestions that a teacher could realistically implement in their classroom.
- If the teacher provides context from their current lesson plan, use it to make your suggestions highly relevant and specific.
- Keep responses concise and well-structured, using bullet points or numbered lists where appropriate for clarity.`;
        
        let contextualizedQuestion = question;
        if (lessonPlanContext) {
            contextualizedQuestion = `
Here is my current lesson plan context:
- Title: ${lessonPlanContext.title}
- Topic: ${lessonPlanContext.topic}
- Learning Objectives: ${lessonPlanContext.learningObjectives.join(', ')}

With that in mind, here is my question: ${question}
`;
        }

        const contents: ChatMessage[] = [...history, { role: 'user', parts: [{ text: contextualizedQuestion }] }];

        let userLocation: { latitude: number, longitude: number } | undefined = undefined;
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
        } catch (error) {
            console.warn("Could not get user's location for teacher query:", error);
        }

        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
                systemInstruction,
                tools: [{ googleMaps: {} }],
                toolConfig: userLocation ? { retrievalConfig: { latLng: userLocation } } : undefined,
            }
        });

        return responseStream;

    } catch (error) {
        console.error("Error asking Astra for Teachers:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble thinking right now. Could you please rephrase your question?" } as GenerateContentResponse;
        }
        return errorStream();
    }
};

// FIX: Added `askAstraWithThinking` function for the AI Coach feature.
export const askAstraWithThinking = async (question: string, history: ChatMessage[], lessonPlanContext: LessonPlan | null): Promise<AsyncGenerator<GenerateContentResponse>> => {
    console.log(`Asking Astra for Teachers (Thinking Mode): "${question}"`);
    
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const text = "This is a deeper, more thoughtful mock response because Thinking Mode is active. I would suggest integrating project-based learning to address your question about student engagement. For example, have students create a diorama of the Roman Forum.";
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 100));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }

    try {
        const model = 'gemini-2.5-pro'; // Using Pro for more complex tasks

        const systemInstruction = `You are "Professor Astra", an expert AI instructional coach and curriculum designer for K-12 teachers. You are in "Thinking Mode", which means you should provide deeper, more pedagogical insights. Your goal is to provide insightful, practical, and evidence-based advice on lesson planning, teaching strategies, differentiation, assessment, and curriculum standards.
- Your tone must be encouraging, professional, collaborative, and helpful.
- Provide concrete, actionable suggestions that a teacher could realistically implement in their classroom.
- Go beyond surface-level answers. Connect suggestions to pedagogical theories (e.g., Bloom's Taxonomy, Universal Design for Learning) when relevant.
- If the teacher provides context from their current lesson plan, use it to make your suggestions highly relevant and specific.`;
        
        let contextualizedQuestion = question;
        if (lessonPlanContext) {
            contextualizedQuestion = `
Here is my current lesson plan context:
- Title: ${lessonPlanContext.title}
- Topic: ${lessonPlanContext.topic}
- Learning Objectives: ${lessonPlanContext.learningObjectives.join(', ')}

With that in mind, here is my question: ${question}
`;
        }

        const contents: ChatMessage[] = [...history, { role: 'user', parts: [{ text: contextualizedQuestion }] }];

        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 32768 } // Max budget for 2.5 Pro
            }
        });

        return responseStream;

    } catch (error) {
        console.error("Error asking Astra with Thinking:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I'm having a little trouble with deep thinking right now. Could you please rephrase your question?" } as GenerateContentResponse;
        }
        return errorStream();
    }
};

export const askAdminCopilot = async (
    question: string,
    history: ChatMessage[]
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    console.log(`Asking Admin Copilot: "${question}"`);

    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            const text = "This is a mock response from the Admin Copilot. Based on your query, I would recommend reviewing incident logs for student Chloe Davis.";
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 100));
                yield { text: word + ' ' } as GenerateContentResponse;
            }
        }
        return mockStream();
    }
    
    try {
        const model = 'gemini-2.5-pro'; // Pro for more complex admin tasks
        const systemInstruction = `You are an expert school administrator AI Copilot. Your primary functions are to analyze school data, identify trends, and draft communications based on the contextual data provided in the prompt. 
        - When asked for a "fairness report," analyze the provided incident data for potential biases and summarize your findings in a professional, non-accusatory tone.
        - When asked to "identify students for support," analyze the provided student data summaries to find patterns suggesting a student may be struggling and recommend supportive actions.
        - When asked to "draft an announcement," create a clear, professional message suitable for the specified audience.
        - Your tone is professional, data-driven, and supportive. 
        - Use markdown for formatting, especially lists.
        - If the provided data is insufficient to answer the user's question, state that and specify what data is missing.`;
        
        let contextualizedQuestion = question;
        const lowerCaseQuestion = question.toLowerCase();
        
        // Inject context based on keywords
        if (lowerCaseQuestion.includes('fairness') || lowerCaseQuestion.includes('equity') || lowerCaseQuestion.includes('incident')) {
            const allProfiles = studentDataService.getStudentProfiles();
            const allIncidents = allProfiles.flatMap(p => p.incidents);
            const summary = allIncidents.map(i => `Student: ${i.studentName}, Type: ${i.incidentType}, Severity: ${i.severity}, Timestamp: ${i.timestamp}`).join('\n');
            contextualizedQuestion = `
            Here is the raw incident data from the school:
            ---
            ${summary}
            ---
            Now, please answer my original question: "${question}"`;
        } else if (lowerCaseQuestion.includes('support') && lowerCaseQuestion.includes('student')) {
            const allProfiles = studentDataService.getStudentProfiles();
            const getAvgScore = (p: StudentProfile) => {
                if (p.quizAttempts.length === 0) return null;
                return Math.round(p.quizAttempts.reduce((acc, curr) => acc + curr.score, 0) / p.quizAttempts.length);
            };
            const studentDataSummary = allProfiles.map(p => ({
                id: p.id,
                name: p.name,
                incidentCount: p.incidents.length,
                avgScore: getAvgScore(p),
                attendance: p.attendancePercentage
            }));
            contextualizedQuestion = `
            Here is a summary of all student data:
            ---
            ${JSON.stringify(studentDataSummary, null, 2)}
            ---
            Now, please answer my original question: "${question}"`;
        }

        const contents: ChatMessage[] = [...history, { role: 'user', parts: [{ text: contextualizedQuestion }] }];

        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: { systemInstruction }
        });

        return responseStream;

    } catch (error) {
        console.error("Error asking Admin Copilot:", error);
        async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "I encountered an error trying to process your request. Please try again." } as GenerateContentResponse;
        }
        return errorStream();
    }
};


// FIX: Modified 'generateImage' to accept an 'aspectRatio' parameter.
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '16:9'): Promise<string> => {
    console.log("Generating image with prompt:", prompt);
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `https://placehold.co/512x512/3730a3/e0e7ff/png?text=${encodeURIComponent(prompt.substring(0, 50))}`;
    }

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A simple, clear, friendly, educational 2D illustration for a K-12 student's interactive game, with a vibrant background. ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return '';
    } catch (error) {
        console.error("Error generating image:", error);
        return '';
    }
};

export const generateHeroBio = async (heroName: string, heroDescription: string): Promise<string> => {
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `${heroDescription} This is a slightly longer, mock explanation about what makes ${heroName} an interesting character, generated because no API key is available. This detailed bio would normally be created by the AI to be engaging for a 5th-grade student.`;
    }

    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = `You are a helpful assistant for a 5th-grade student. Your task is to provide an interesting and slightly more detailed, age-appropriate biography for a hero character. The student has selected this hero to be their avatar in learning games.
- Keep it concise (2-3 short paragraphs).
- Make it engaging and exciting for a 10-year-old.
- Focus on what makes the hero cool, important, or inspiring.
- Do not use overly complex vocabulary.`;

        const contents = `Hero Name: ${heroName}
Brief Description: ${heroDescription}

Please provide the expanded biography below.`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: contents }] },
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating hero bio:", error);
        // Fallback to a simpler description on error
        return heroDescription;
    }
};


// ... (rest of the file is unchanged) ...

// FIX: Added missing functions
export const generateIEPGoal = async (request: IEPGoalRequest): Promise<{ goal: string, focusArea: string }> => {
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            goal: "By the end of the semester, the student will improve their reading comprehension skills from a 4th-grade level to a 5th-grade level, as measured by a standardized reading assessment.",
            focusArea: "Reading Comprehension"
        };
    }

    try {
        const { student } = request;
        const model = 'gemini-2.5-pro';
        const systemInstruction = `You are an expert special education teacher. Your task is to analyze a student's profile and generate one S.M.A.R.T. (Specific, Measurable, Achievable, Relevant, Time-bound) IEP goal.
- Analyze the student's incident reports, quiz scores, and existing goals.
- Identify a key area for improvement.
- The output MUST be a valid JSON object with 'goal' and 'focusArea' properties.`;

        const studentData = `
        - Name: ${student.name}
        - Grade: ${student.gradeLevel}
        - Recent Incidents: ${student.incidents.slice(-3).map(i => `${i.incidentType}: ${i.summary}`).join('; ')}
        - Recent Quiz Scores: ${student.quizAttempts.slice(-3).map(q => `${q.quizTitle}: ${q.score}%`).join('; ')}
        - Active IEP Goals: ${student.iepGoals.filter(g => g.status === 'active').map(g => g.goal).join('; ')}
        `;

        const contents = `Based on the following student data, generate one S.M.A.R.T. IEP goal:\n${studentData}`;
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: contents }] },
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        goal: { type: Type.STRING, description: "The full text of the S.M.A.R.T. goal." },
                        focusArea: { type: Type.STRING, description: "A short phrase for the goal's focus area (e.g., 'Reading Fluency', 'Social-Emotional Regulation')." }
                    },
                    required: ['goal', 'focusArea']
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating IEP Goal:", error);
        throw new Error("Failed to generate IEP goal.");
    }
};

export const draftFormalResponse = async (topic: CommunicationTopic, keyPoints: string, studentName: string, parentName: string, teacherName: string): Promise<string> => {
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `Dear ${parentName},\n\nThis is a mock draft regarding ${studentName} about the topic: ${communicationTopicLabels[topic]}.\n\nKey points:\n${keyPoints}\n\nSincerely,\n${teacherName}`;
    }

    const systemInstruction = `You are a helpful assistant for a teacher. Your task is to draft a formal, professional, and friendly email to a parent.
- The tone should be collaborative and supportive.
- Address the parent by name.
- Mention the student by name.
- The subject should be clear and concise.
- Structure the email based on the provided key points.`;

    const contents = `Draft an email to ${parentName} about their child, ${studentName}.
- Teacher's Name: ${teacherName}
- Topic: ${communicationTopicLabels[topic]}
- Key Points to include:\n${keyPoints}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: { systemInstruction }
    });

    return response.text;
};

export const translateMessage = async (textToTranslate: string, targetLanguage: string): Promise<string> => {
    if (!ai) return `(Mock translation to ${targetLanguage}) ${textToTranslate}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: `Translate the following text to ${targetLanguage}: "${textToTranslate}"` }] }
    });
    return response.text;
};

export const summarizeConversation = async (messages: Message[]): Promise<string> => {
    if (!ai) return "This is a mock summary of the conversation.";
    const conversationText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: `Summarize the key points of this conversation between a teacher and a parent:\n\n${conversationText}` }] }
    });
    return response.text;
};

export const generateAdventureModuleConfig = async (topic: string, prompt: string, ageGroup: string): Promise<{ learningObjectives: string[], finalAssessmentQuestion: { question: string, answer: string } }> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1500));
        return {
            learningObjectives: ["Understand the concept of photosynthesis.", "Identify the key components needed for photosynthesis."],
            finalAssessmentQuestion: { question: "What is the most important gas plants need for photosynthesis?", answer: "Carbon Dioxide" }
        };
    }
    const systemInstruction = `You are an expert curriculum designer. Your task is to generate learning objectives and a final assessment question for an interactive learning adventure for students.
- The output MUST be a valid JSON object.
- Create 2-3 clear, age-appropriate learning objectives.
- Create one final multiple-choice or short-answer question to assess understanding.`;
    const contents = `Topic: ${topic}\nAdventure Prompt: ${prompt}\nAge Group: ${ageGroup}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    finalAssessmentQuestion: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING }
                        },
                        required: ['question', 'answer']
                    }
                },
                required: ['learningObjectives', 'finalAssessmentQuestion']
            }
        }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

const adventureNodeSchema = {
    type: Type.OBJECT,
    properties: {
        stage: { type: Type.INTEGER },
        sceneDescription: { type: Type.STRING },
        sceneVisualPrompt: { type: Type.STRING },
        interaction: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['CHOICE', 'FILL_IN_THE_BLANK', 'MATCHING', 'FIND_THE_MISTAKE', 'ORDERING', 'CATEGORIZATION'] },
                choices: { type: Type.ARRAY, items: { 
                    type: Type.OBJECT, 
                    properties: {
                        text: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ['text', 'isCorrect', 'feedback']
                }},
                sentenceWithAnswer: { 
                    type: Type.STRING,
                    description: "For FILL_IN_THE_BLANK type. The sentence MUST contain the answer enclosed in curly braces. For example: 'The green pigment in leaves is called {chlorophyll}.'"
                },
                wordBank: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional word bank for FILL_IN_THE_BLANK. The first item MUST be the correct answer."},
                instruction: { type: Type.STRING },
                pairs: { type: Type.ARRAY, items: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ['term', 'definition']
                }},
                statement: { type: Type.STRING },
                correction: { type: Type.STRING },
                feedback: { type: Type.STRING },
                orderingItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                categories: { type: Type.ARRAY, items: { type: Type.STRING } },
                categorizationItems: { type: Type.ARRAY, items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING },
                        category: { type: Type.STRING }
                    },
                    required: ['item', 'category']
                }},
            },
            required: ['type']
        }
    },
    required: ['stage', 'sceneDescription', 'sceneVisualPrompt', 'interaction']
};


export const generateAdventureInitialNode = async (module: AdventureModule, student: StudentProfile, language: string): Promise<AdventureNode> => {
     if (!ai) {
        await new Promise(r => setTimeout(r, 500));
        return {
            stage: 1,
            sceneDescription: `This is the first stage of the adventure about ${module.topic}. ${student.selectedHero} must make a choice. This is a mock response.`,
            sceneVisualPrompt: `A vibrant 2D illustration of ${student.selectedHero} in a scene about ${module.topic}`,
            interaction: {
                type: 'CHOICE',
                choices: [
                    { text: "Correct Choice", isCorrect: true, feedback: "Great job!" },
                    { text: "Incorrect Choice", isCorrect: false, feedback: "Not quite." },
                ]
            }
        };
    }

    const systemInstruction = `You are a master storyteller and educator. Your task is to generate ONLY THE FIRST STAGE (stage: 1) of an interactive adventure for a student.
- The output MUST be a valid JSON object adhering to the schema for a single adventure node.
- Create a compelling opening scene that introduces the story based on the module prompt.
- The interaction should be a relatively simple introductory challenge.
- All content must be in the specified language and appropriate for the student's age.`;
    
    const contents = `
    - Student's Selected Hero: ${student.selectedHero}
    - Adventure Module Topic: ${module.topic}
    - Adventure Module Prompt: ${module.prompt}
    - Total Number of Stages planned: ${module.stages}
    - Target Language: ${language}
    - Learning Objectives: ${module.learningObjectives.join(', ')}
    - Source Text Context (if available): ${module.sourceText || 'N/A'}
    Please generate ONLY the first node of this adventure.`;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: adventureNodeSchema
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateAdventureNextNode = async (
    module: AdventureModule,
    student: StudentProfile,
    language: string,
    previousNodes: AdventureNode[],
    answers: { stage: number, isCorrect: boolean }[]
): Promise<AdventureNode> => {
     if (!ai) {
        await new Promise(r => setTimeout(r, 800));
        const nextStage = previousNodes.length + 1;
        return {
            stage: nextStage,
            sceneDescription: `This is the mock response for stage ${nextStage}. Based on your previous answers, here is a new challenge.`,
            sceneVisualPrompt: `${student.selectedHero} facing a new puzzle related to ${module.topic}`,
            interaction: {
                type: 'FILL_IN_THE_BLANK',
                sentenceWithAnswer: "The green pigment in plant leaves is called {chlorophyll}.",
                feedback: "Exactly! Chlorophyll is what helps plants absorb sunlight."
            }
        };
    }

    const systemInstruction = `You are a master storyteller and adaptive educator. Your task is to generate the NEXT STAGE of an ongoing interactive adventure.
- The output MUST be a valid JSON object adhering to the schema for a single adventure node.
- The new stage number MUST be ${previousNodes.length + 1}.
- Analyze the student's previous answers. If they answered a question incorrectly, the new interaction should be designed to REINFORCE that concept in a different, creative way.
- Continue the story logically from the previous scene.
- Do not repeat interaction types too often. Try to use a variety of types like CHOICE, FILL_IN_THE_BLANK (with and without wordBank), MATCHING, ORDERING, FIND_THE_MISTAKE, and CATEGORIZATION.
- All content must be in the specified language and appropriate for the student's age.`;

    const incorrectAnswers = answers.filter(a => !a.isCorrect);
    let performanceContext = "The student has answered all questions correctly so far. Introduce a new aspect of the topic or increase the difficulty slightly.";
    if (incorrectAnswers.length > 0) {
        const lastWrongAnswer = incorrectAnswers[incorrectAnswers.length - 1];
        const questionNode = previousNodes[lastWrongAnswer.stage - 1];
        performanceContext = `The student previously answered a question related to stage ${lastWrongAnswer.stage} incorrectly. The scene was: "${questionNode.sceneDescription}". Your new interaction should gently reteach or test that concept again from a new angle.`;
    }
    
    const contents = `
    - Student's Selected Hero: ${student.selectedHero}
    - Adventure Module Topic: ${module.topic}
    - Adventure Module Prompt: ${module.prompt}
    - Target Language: ${language}
    - Total Number of Stages planned: ${module.stages}
    - Student Performance Notes: ${performanceContext}
    - Story So Far (previous nodes): ${JSON.stringify(previousNodes)}
    
    Please generate ONLY the next adventure node (stage ${previousNodes.length + 1}).`;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: adventureNodeSchema
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateAdventureFeedback = async (
    student: StudentProfile,
    node: AdventureNode,
    isCorrect: boolean,
    userAnswerString: string
): Promise<AsyncGenerator<string>> => {
    if (!ai) {
        async function* mockStream() {
            const text = isCorrect 
                ? `Huzzah, brave adventurer! You are correct! That was a brilliant move.` 
                : `A valiant effort, but that wasn't quite it. Even the greatest heroes stumble! Let's look closer.`;
            const words = text.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 50));
                yield word + ' ';
            }
        }
        return mockStream();
    }

    const hero = HEROES.find(h => h.name === student.selectedHero) || HEROES[0];
    
    if (node.interaction.type === 'FIND_THE_MISTAKE') {
        const interaction = node.interaction as InteractionFindMistakePayload;
        const systemInstruction = `You are an educational AI assistant who embodies a specific character to make learning fun for a ${student.gradeLevel}th grade student.

YOUR CURRENT PERSONA IS CRITICAL:
- Character: ${hero.name}
- Description: ${hero.description}
- You MUST speak, act, and respond FLAWLESSLY in the voice and personality of this character.

YOUR TASK:
Provide feedback for a "find the mistake" puzzle. The student clicked the "reveal" button.

CONTEXT:
- The incorrect statement was: "${interaction.statement}"

YOUR RESPONSE STYLE:
- Start with an in-character exclamation like "Good eye, explorer!" or "You've spotted the error!".
- Then, present the provided correction and feedback clearly.
- You MUST incorporate the following text into your response, phrasing it in your own voice:
  - The Correction is: "${interaction.correction}"
  - The Explanation is: "${interaction.feedback}"
- Keep the response concise and in character. Do not use any special formatting or interactive widgets.`;
        
        const contents = `The student has revealed the answer. Present the correction and feedback in character.`;
        
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [{ text: contents }] },
            config: { systemInstruction, temperature: 0.8 },
        });
        
        async function* stream() {
            for await (const chunk of responseStream) {
                yield chunk.text;
            }
        }
        return stream();
    }
    
    const outcome = isCorrect ? "correct" : "incorrect";
    const interactionDescription = `The challenge was about "${node.sceneDescription}". The student's answer was "${userAnswerString}".`;

    const systemInstruction = `You are an educational AI assistant who embodies a specific character to make learning fun for a ${student.gradeLevel}th grade student.

YOUR CURRENT PERSONA IS CRITICAL:
- Character: ${hero.name}
- Description: ${hero.description}
- You MUST speak, act, and respond FLAWLESSLY in the voice and personality of this character. Stay in character at all times. Use their unique style.

YOUR TASK:
Provide short, encouraging feedback to the student on their answer to an interactive challenge in a learning adventure.

CONTEXT:
- The student just answered a question. Their answer was ${outcome}.
- ${interactionDescription}

YOUR RESPONSE STYLE:
- The response MUST start with an in-character reaction to the student's answer before any explanation.
- If the answer was correct: Start with a heroic, in-character celebration. For example, if you are Socrates, say "A brilliant deduction, young philosopher!". Then, briefly explain WHY the answer was correct to reinforce the concept, in one or two simple sentences.
- If the answer was incorrect: Start with an encouraging, in-character remark that fits the persona. For example, if you are Hua Mulan, say "A valiant effort, warrior, but that strategy was flawed. A true strategist knows...". Gently explain why their answer wasn't right and then clarify the correct concept in a simple, easy-to-understand way.
- Keep the response concise (2-4 sentences max).
- Address the student with a fitting title like "adventurer", "explorer", "scholar", etc., depending on your persona.
- Your response MUST be a simple string. Do not use any special formatting or interactive widgets.`;

    const contents = `The student's answer was ${outcome}. Please provide feedback in character.`;
    
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
        contents: { parts: [{ text: contents }] },
        config: { systemInstruction, temperature: 0.8 },
    });
    
    async function* stream() {
        for await (const chunk of responseStream) {
            yield chunk.text;
        }
    }
    return stream();
};


const handleVeoApiKey = async () => {
    if (window.aistudio) {
        try {
            let hasApiKey = await window.aistudio.hasSelectedApiKey();
            if (!hasApiKey) {
                await window.aistudio.openSelectKey();
                // Assume success after prompt
            }
        } catch (e) {
            console.error("API key selection error:", e);
            if (e instanceof Error && e.message.includes("Requested entity was not found")) {
                throw new Error("API key not found or invalid. Please select a valid key.");
            }
            throw e;
        }
    }
};

const generateVideo = async (payload: any): Promise<string> => {
     if (!process.env.API_KEY) {
        console.warn("API_KEY not available, using mock video.");
        await new Promise(r => setTimeout(r, 3000));
        return 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }

    await handleVeoApiKey();
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await localAi.models.generateVideos(payload);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        } catch(e) {
             if (e instanceof Error && e.message.includes("Requested entity was not found")) {
                 throw new Error("API key not found or invalid. Please select a valid key via the prompt.");
             }
             throw e;
        }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    }
    
    throw new Error("Video generation completed, but no download link was found.");
};


export const generateVideoFromPrompt = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    return generateVideo({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio
        }
    });
};

export const generateVideoFromImage = async (prompt: string, image: { imageBytes: string; mimeType: string }, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    return generateVideo({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio
        }
    });
};

export const generateLessonPlan = async (request: LessonPlanRequest): Promise<LessonPlan> => {
    if(!ai) {
        await new Promise(r => setTimeout(r, 2000));
        return {
            title: `Mock Lesson: ${request.topic}`,
            topic: request.topic,
            learningObjectives: ["Objective 1", "Objective 2"],
            keyVocabulary: ["Vocab 1", "Vocab 2"],
            materials: ["Material 1", "Material 2"],
            lessonActivities: [{duration: 15, activity: "Intro", description: "Introduction to topic", imagePrompt: null}],
            assessment: { method: "Quiz", description: "A short quiz" },
            differentiation: { support: "Provide hints", challenge: "Ask extension questions" }
        }
    }
    const systemInstruction = `You are an expert curriculum designer for K-12 education. Your task is to generate a comprehensive, age-appropriate lesson plan based on the provided source text and parameters. The output must be a valid JSON object.`;
    const contents = `Generate a lesson plan based on this request:\n${JSON.stringify(request)}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    keyVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
                    materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lessonActivities: { 
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                duration: { type: Type.INTEGER },
                                activity: { type: Type.STRING },
                                description: { type: Type.STRING },
                                imagePrompt: { type: Type.STRING }
                            },
                            required: ['duration', 'activity', 'description']
                        }
                    },
                    assessment: {
                        type: Type.OBJECT,
                        properties: {
                            method: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ['method', 'description']
                    },
                    differentiation: {
                        type: Type.OBJECT,
                        properties: {
                            support: { type: Type.STRING },
                            challenge: { type: Type.STRING }
                        },
                        required: ['support', 'challenge']
                    }
                },
                required: ['title', 'topic', 'learningObjectives', 'keyVocabulary', 'materials', 'lessonActivities', 'assessment', 'differentiation']
            }
        }
    });

    return JSON.parse(response.text.trim());
};

export const analyzeSourceText = async (sourceText: string): Promise<{ suggestedTopic: string, suggestedObjectives: string[] }> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return {
            suggestedTopic: "Mock Suggested Topic",
            suggestedObjectives: ["Mock objective 1", "Mock objective 2"]
        };
    }
    const systemInstruction = `You are an educational assistant. Analyze the provided text and suggest a lesson topic and 2-3 learning objectives. The output must be a valid JSON object.`;
    const contents = `Analyze this text:\n\n${sourceText}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestedTopic: { type: Type.STRING },
                    suggestedObjectives: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['suggestedTopic', 'suggestedObjectives']
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const generateFlashcards = async (keyVocabulary: string[], topic: string, ageGroup: string): Promise<Flashcard[]> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return keyVocabulary.map(word => ({ word, definition: `Mock definition for ${word}`}));
    }
    const systemInstruction = `You are a teacher's assistant. Generate simple, age-appropriate definitions for a list of vocabulary words in the context of a specific topic. The output must be a valid JSON array of objects.`;
    const contents = `Topic: ${topic}\nAge Group: ${ageGroup}\nVocabulary: ${keyVocabulary.join(', ')}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ['word', 'definition']
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const generateLessonKit = async (plan: LessonPlan): Promise<any> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 2000));
        return {
            slides: [], // Mock data is complex here
            exercises: { multipleChoice: [], trueFalse: [], fillInTheBlank: [], shortAnswer: [] },
            rubric: { title: "Mock Rubric", criteria: [] }
        };
    }
    const systemInstruction = `You are an expert curriculum developer. Based on the provided lesson plan, generate a complete lesson kit including slideshow content, student exercises, and a grading rubric. The output must be valid JSON.`;
    const contents = `Lesson Plan:\n${JSON.stringify(plan)}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    slides: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                points: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ['title', 'points']
                        }
                    },
                    exercises: {
                        type: Type.OBJECT,
                        properties: {
                            multipleChoice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING } }, required: ['question', 'options', 'answer'] } },
                            trueFalse: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.BOOLEAN } }, required: ['question', 'answer'] } },
                            fillInTheBlank: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { sentence: { type: Type.STRING, description: "Use __BLANK__ for the blank space." }, answer: { type: Type.STRING } }, required: ['sentence', 'answer'] } },
                            shortAnswer: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ['question', 'answer'] } },
                        }
                    },
                    rubric: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            criteria: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        criterion: { type: Type.STRING },
                                        level1: { type: Type.STRING, description: "Beginning" },
                                        level2: { type: Type.STRING, description: "Developing" },
                                        level3: { type: Type.STRING, description: "Proficient" },
                                        level4: { type: Type.STRING, description: "Exemplary" },
                                    },
                                    required: ['criterion', 'level1', 'level2', 'level3', 'level4']
                                }
                            }
                        },
                        required: ['title', 'criteria']
                    }
                },
                required: ['slides', 'exercises', 'rubric']
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const generateSmartSuggestions = async (): Promise<SmartSuggestion[]> => {
    if(!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return [
            { type: 'individual', studentName: 'Chloe Davis', suggestion: 'Chloe seems to be struggling with focus. Consider a short brain break or a check-in.' },
            { type: 'academic', suggestion: 'Several students made the same mistake on the science quiz. A quick review of chlorophyll might be helpful.' }
        ];
    }
    const profiles = studentDataService.getStudentProfiles();
    const systemInstruction = "You are a helpful AI teaching assistant. Analyze the provided class data and generate 2-3 actionable suggestions for the teacher. Focus on individual student needs or whole-class academic trends. The output MUST be a valid JSON array.";
    const contents = `Class Data:\n${JSON.stringify(profiles)}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['academic', 'individual'] },
                        studentName: { type: Type.STRING },
                        suggestion: { type: Type.STRING }
                    },
                    required: ['type', 'suggestion']
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const analyzeFairnessData = async (incidents: Incident[]): Promise<string> => {
    if (!ai) return "This is a mock fairness analysis. No significant disparities were found in the mock data.";
    const systemInstruction = "You are a data analyst specializing in educational equity. Analyze the list of behavioral incidents and provide a neutral, data-driven summary of any potential disparities or patterns. Do not make accusations. Use markdown for lists.";
    const contents = `Incident Data:\n${JSON.stringify(incidents)}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: contents }] },
        config: { systemInstruction }
    });
    return response.text;
};

export const generateSupportRecommendations = async (profiles: StudentProfile[]): Promise<SupportRecommendation[]> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return [{ studentId: 's3', studentName: 'Chloe Davis', reason: 'Low quiz scores and multiple incidents.', suggestedAction: 'Schedule a check-in with the student and consider contacting parents.', keyMetrics: { incidents: 2, avgScore: 67, attendance: 95 } }];
    }
    const systemInstruction = `You are a school counselor AI. Analyze the student profiles to identify students who may need academic or behavioral support. For each student, provide a brief reason, a suggested action, and key metrics. The output MUST be a valid JSON array.`;
    const contents = `Student Profiles:\n${JSON.stringify(profiles)}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        studentId: { type: Type.STRING },
                        studentName: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        suggestedAction: { type: Type.STRING },
                        keyMetrics: {
                            type: Type.OBJECT,
                            properties: {
                                incidents: { type: Type.INTEGER },
                                avgScore: { type: Type.NUMBER },
                                attendance: { type: Type.INTEGER }
                            },
                            required: ['incidents', 'avgScore', 'attendance']
                        }
                    },
                    required: ['studentId', 'studentName', 'reason', 'suggestedAction', 'keyMetrics']
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const summarizeTranscription = async (transcribedText: string, topic: string): Promise<string> => {
    if(!ai) return `This is a mock summary of the lecture on ${topic}.`;
    const systemInstruction = `You are an expert summarizer. Your task is to take a raw lecture transcription and a topic, and create a concise, easy-to-understand summary suitable for K-12 students.`;
    const contents = `Topic: ${topic}\n\nTranscription:\n${transcribedText}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: { systemInstruction }
    });
    return response.text;
};

export const generateFlashcardsFromText = async (transcription: string, topic: string, ageGroup: string): Promise<Flashcard[]> => {
    if(!ai) return [{word: 'Mock Word', definition: 'This is a mock definition.'}];
    const systemInstruction = `You are an expert educator. Your task is to identify key vocabulary from a lecture transcription and generate flashcards (word and simple definition) suitable for a given age group. The output MUST be a valid JSON array.`;
    const contents = `Topic: ${topic}\nAge Group: ${ageGroup}\nTranscription:\n${transcription}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ['word', 'definition']
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const answerFromSummary = async (question: string, context: string, history: ChatMessage[]): Promise<string> => {
    if(!ai) return "This is a mock answer based on the provided summary.";
    const systemInstruction = `You are a helpful AI assistant for a student. Your task is to answer questions based ONLY on the provided context (a lesson summary and transcription). If the answer is not in the context, say so.`;
    const contents = `Context:\n${context}\n\nPrevious conversation:\n${history.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}\n\nQuestion: ${question}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: { systemInstruction }
    });
    return response.text;
};

export const editImage = async (prompt: string, image: { imageBytes: string; mimeType: string }): Promise<string> => {
    if(!ai) {
        await new Promise(r => setTimeout(r, 1500));
        return `https://placehold.co/512x512/a78bfa/e0e7ff/png?text=Edited!`;
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.imageBytes, mimeType: image.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    throw new Error("AI did not return an image.");
};

export const generateQuiz = async (topic: string, sourceText: string, numQuestions: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<Quiz> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1500));
        return {
            id: `quiz-${Date.now()}`,
            title: `Mock Quiz: ${topic}`,
            topic: topic,
            questions: Array.from({length: numQuestions}, (_, i) => ({ id: `q${i}`, question: `Mock question ${i+1}?`, options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', topic: topic }))
        };
    }
    const systemInstruction = `You are an expert educator. Generate a multiple-choice quiz based on the provided source text, topic, and difficulty. The output MUST be a valid JSON object. The first option in the 'options' array must always be the correct answer.`;
    const contents = `Topic: ${topic}\nDifficulty: ${difficulty}\nNumber of Questions: ${numQuestions}\n\nSource Text:\n${sourceText}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: contents }] },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswer: { type: Type.STRING },
                                topic: { type: Type.STRING },
                            },
                            required: ['id', 'question', 'options', 'correctAnswer', 'topic']
                        }
                    }
                },
                required: ['id', 'title', 'topic', 'questions']
            }
        }
    });
    return JSON.parse(response.text.trim());
};