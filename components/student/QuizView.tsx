import React, { useState } from 'react';
import { StudentProfile, Quiz } from '../../types.ts';
import Button from '../common/Button.tsx';
import QuizResultView from './QuizResultView.tsx';
import * as studentDataService from '../../services/studentDataService.ts';

interface QuizViewProps {
    student: StudentProfile;
    quiz: Quiz;
    onFinish: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ student, quiz, onFinish }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;
    const progress = ((currentQuestionIndex) / totalQuestions) * 100;
    
    const handleAnswerSelect = (questionId: string, answer: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            let correctCount = 0;
            const finalAnswers = quiz.questions.map(q => {
                const studentAnswer = selectedAnswers[q.id] || '';
                const isCorrect = studentAnswer === q.correctAnswer;
                if (isCorrect) correctCount++;
                return { questionId: q.id, studentAnswer, isCorrect };
            });

            const score = Math.round((correctCount / totalQuestions) * 100);
            
            studentDataService.addQuizAttemptToStudent(student.id, {
                quizId: quiz.id,
                quizTitle: quiz.title,
                score,
                answers: finalAnswers,
            });
            setIsFinished(true);
        }
    };
    
    if (isFinished) {
        return <QuizResultView student={student} quiz={quiz} answers={selectedAnswers} onFinish={onFinish} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl p-8">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                         <h1 className="text-xl font-bold text-indigo-300">{quiz.title}</h1>
                         <p className="text-sm font-semibold text-gray-400">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="my-8">
                    <h2 className="text-2xl font-semibold text-white mb-6">{currentQuestion.question}</h2>
                    <div className="space-y-4">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-lg
                                    ${selectedAnswers[currentQuestion.id] === option 
                                        ? 'bg-indigo-500 border-indigo-400 text-white font-semibold shadow-lg' 
                                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'}`
                                }
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button 
                        onClick={handleNext} 
                        disabled={!selectedAnswers[currentQuestion.id]}
                        className="!text-lg !px-8 !py-3"
                    >
                        {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Finish Quiz'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QuizView;