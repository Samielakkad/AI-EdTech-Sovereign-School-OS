import React, { useState, useEffect } from 'react';
import { StudentProfile, Quiz, QuizQuestion } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { BrainCircuitIcon } from '../icons/StudentIcons.tsx';

interface QuizResultViewProps {
    student: StudentProfile;
    quiz: Quiz;
    answers: { [key: string]: string };
    onFinish: () => void;
}

const ExplanationBox: React.FC<{ explanation: string; isLoading: boolean }> = ({ explanation, isLoading }) => (
    <div className="mt-4 p-4 bg-gray-900/50 border border-indigo-500/30 rounded-lg">
        <div className="flex items-start gap-3">
            <BrainCircuitIcon className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {explanation}
                {isLoading && <span className="inline-block w-2 h-2 ml-1 bg-white rounded-full animate-pulse"></span>}
            </p>
        </div>
    </div>
);


const ResultItem: React.FC<{ question: QuizQuestion; studentAnswer: string; explanation?: { text: string; isLoading: boolean } }> = ({ question, studentAnswer, explanation }) => {
    const isCorrect = studentAnswer === question.correctAnswer;

    return (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <p className="font-semibold text-gray-200">{question.question}</p>
            <div className="mt-2 text-sm">
                <p className={isCorrect ? 'text-green-300' : 'text-red-300'}>
                    Your answer: <span className="font-bold">{studentAnswer || 'No answer'}</span>
                    {!isCorrect && ` • Correct answer: ${question.correctAnswer}`}
                </p>
            </div>
            {!isCorrect && (explanation?.isLoading || explanation?.text) && (
                 <ExplanationBox explanation={explanation.text} isLoading={explanation.isLoading} />
            )}
        </div>
    );
};


const QuizResultView: React.FC<QuizResultViewProps> = ({ student, quiz, answers, onFinish }) => {
    const [explanations, setExplanations] = useState<Record<string, { text: string; isLoading: boolean }>>({});
    
    const totalQuestions = quiz.questions.length;
    const correctCount = quiz.questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const pointsEarned = Math.round(score / 10);

    useEffect(() => {
        const generateExplanations = async () => {
            const incorrectAnswers = quiz.questions.filter(q => answers[q.id] !== q.correctAnswer);

            for (const question of incorrectAnswers) {
                // Set initial loading state for this question
                setExplanations(prev => ({ ...prev, [question.id]: { text: '', isLoading: true } }));

                try {
                    const stream = await geminiService.explainQuizMistake(
                        student,
                        question.question,
                        answers[question.id] || "No answer",
                        question.correctAnswer,
                        question.topic
                    );

                    let fullText = '';
                    for await (const chunk of stream) {
                        fullText += chunk;
                        setExplanations(prev => ({
                            ...prev,
                            [question.id]: { text: fullText, isLoading: true }
                        }));
                    }
                    // Mark as not loading once done
                    setExplanations(prev => ({
                        ...prev,
                        [question.id]: { text: fullText, isLoading: false }
                    }));

                } catch (error) {
                    console.error("Explanation generation failed:", error);
                    setExplanations(prev => ({
                        ...prev,
                        [question.id]: { text: "Sorry, an error occurred while generating an explanation.", isLoading: false }
                    }));
                }
            }
        };

        generateExplanations();
    }, [quiz, answers, student]);


    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Quiz Complete!</h1>
                    <p className="text-gray-400 mt-1">Here's how you did on the "{quiz.title}" quiz.</p>
                    <div className="my-6">
                        <p className="text-6xl font-bold text-indigo-400">{score}%</p>
                        <p className="font-semibold text-yellow-400">+{pointsEarned} Points Earned!</p>
                    </div>
                </div>
                
                <div className="my-8 max-h-80 overflow-y-auto pr-2 space-y-4">
                     <h2 className="text-xl font-bold mb-4">Review Your Answers</h2>
                     {quiz.questions.map(q => (
                        <ResultItem 
                            key={q.id}
                            question={q}
                            studentAnswer={answers[q.id]}
                            explanation={explanations[q.id]}
                        />
                     ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <Button onClick={onFinish} className="!text-lg !px-8 !py-3">
                        Back to Learning Hub
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QuizResultView;
