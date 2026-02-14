"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [markedForReview, setMarkedForReview] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      setMarkedForReview(new Array(quizData.length).fill(false));
      setTimeRemaining(quizData.length * 60); // 1 minutes per question
    }
  }, [quizData]);

  // Timer countdown
  useEffect(() => {
    if (!quizData || resultData) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizData, resultData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    if (markedForReview[index]) return 'marked';
    if (answers[index] !== null) return 'answered';
    if (index === currentQuestion) return 'current';
    return 'unanswered';
  };

  const toggleMarkForReview = () => {
    const newMarked = [...markedForReview];
    newMarked[currentQuestion] = !newMarked[currentQuestion];
    setMarkedForReview(newMarked);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setMarkedForReview([]);
    generateQuizFn();
    setResultData(null);
  };

  if (generatingQuiz) {
    return <BarLoader className="mt-4" width={"100%"} color="gray" />;
  }

  // Show loading screen while saving results
  if (savingResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Submitting Your Quiz...</h2>
          <p className="text-muted-foreground text-lg">Please wait while we calculate your results</p>
        </div>
        <BarLoader width={300} color="#3b82f6" />
      </div>
    );
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];
  const answeredCount = answers.filter(a => a !== null).length;
  const unansweredCount = quizData.length - answeredCount;
  const markedCount = markedForReview.filter(m => m === true).length;

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Main Question Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Mock Interview Test</h2>
            <span className="text-sm opacity-90">Question {currentQuestion + 1} of {quizData.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Question Content */}
        <Card className="flex-1 rounded-t-none border-t-0">
          <CardContent className="p-8 space-y-6">
            <div>
              <p className="text-xl font-medium leading-relaxed">{question.question}</p>
            </div>

            <RadioGroup
              onValueChange={handleAnswer}
              value={answers[currentQuestion]}
              className="space-y-3 mt-8"
            >
              {question.options.map((option, index) => {
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted/50 ${
                      answers[currentQuestion] === option
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-border'
                    }`}
                    onClick={() => handleAnswer(option)}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                    <Label htmlFor={`option-${index}`} className="text-lg cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>

          {/* Navigation Buttons */}
          <CardFooter className="border-t p-4 flex justify-between items-center bg-muted/30">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestion] = null;
                  setAnswers(newAnswers);
                }}
              >
                Clear Response
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleMarkForReview}
                className={markedForReview[currentQuestion] ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" : ""}
              >
                {markedForReview[currentQuestion] ? "Unmark Review" : "Mark for Review"}
              </Button>
              
              {currentQuestion < quizData.length - 1 ? (
                <Button onClick={handleNext}>
                  Save & Next
                </Button>
              ) : (
                <Button onClick={finishQuiz} disabled={savingResult} className="text-gray-100 bg-green-600 hover:bg-green-700">
                  {savingResult ? (
                    <BarLoader width={"100%"} color="white" />
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right Sidebar - Question Palette */}
      <Card className="w-80 flex-shrink-0 h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Question Palette</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Legend */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 text-black dark:text-white rounded-full bg-green-100 dark:bg-green-600 border-2 border-green-500 flex items-center justify-center">
                {answeredCount}
              </div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8  text-black dark:text-white rounded-full bg-red-100 dark:bg-red-600 border-2 border-red-500 flex items-center justify-center">
                {unansweredCount}
              </div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 text-black dark:text-white rounded-full bg-yellow-100 dark:bg-yellow-600 border-2 border-yellow-500 flex items-center justify-center font-semibold">
                {markedCount}
              </div>
              <span>Marked for Review</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">All Questions</p>
            <div className="grid grid-cols-5 gap-2">
              {quizData.map((_, index) => {
                const status = getQuestionStatus(index);
                const isCurrent = index === currentQuestion;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all border-2
                      ${status === 'marked'
                        ? 'bg-yellow-100 dark:bg-yellow-600 border-yellow-500 text-yellow-700 dark:text-white'
                        : status === 'answered' 
                        ? 'bg-green-100 dark:bg-green-600 border-green-500 text-green-700 dark:text-white' 
                        : 'bg-red-100 dark:bg-red-600 border-red-500 text-red-700 dark:text-white'
                      }
                      ${isCurrent ? 'border-2 border-black dark:border-white' : ''}
                      hover:scale-110
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
