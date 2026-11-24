import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Languages,
  Award,
  Zap,
} from 'lucide-react';
import {
  GRAMMAR_COURSES,
  GrammarLesson,
  QuizQuestion,
  LanguageGrammarCourse,
} from '../services/grammarData.ts';
import { speakText } from '../services/translatorService.ts';
import { useI18n } from '../services/i18nContext.tsx';

export const GrammarHub: React.FC = () => {
  const { appLang, t, getLangName } = useI18n();
  const g = t.grammarTab;

  const [selectedCourse, setSelectedCourse] = useState<LanguageGrammarCourse>(GRAMMAR_COURSES[0]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'tenses' | 'structure' | 'quiz'>('all');
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson>(selectedCourse.lessons[0]);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleSelectCourse = (course: LanguageGrammarCourse) => {
    setSelectedCourse(course);
    setSelectedLesson(course.lessons[0]);
    setUserAnswers({});
    setQuizSubmitted(false);
  };

  const handleSelectQuizAnswer = (questionId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    selectedCourse.quizzes.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const filteredLessons = selectedCourse.lessons.filter((l) => {
    if (activeCategory === 'all') return true;
    return l.category === activeCategory;
  });

  const selectedCourseName = getLangName(selectedCourse.langCode, selectedCourse.langNameAr);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {g.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
                {g.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {g.subtitle}
            </p>
          </div>

          {/* Language Selector Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {GRAMMAR_COURSES.map((course) => (
              <button
                key={course.langCode}
                onClick={() => handleSelectCourse(course)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  selectedCourse.langCode === course.langCode
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{course.flag}</span>
                <span>{getLangName(course.langCode, course.langNameAr)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-400 me-1">{g.sectionsLabel}</span>
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {g.catAll}
          </button>
          <button
            onClick={() => setActiveCategory('tenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeCategory === 'tenses'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {g.catTenses}
          </button>
          <button
            onClick={() => setActiveCategory('structure')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeCategory === 'structure'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {g.catStructure}
          </button>
          <button
            onClick={() => setActiveCategory('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              activeCategory === 'quiz'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {g.catQuiz} ({selectedCourse.quizzes.length})
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeCategory !== 'quiz' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lessons Navigation Sidebar */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
            <h4 className="font-bold text-xs text-slate-400 pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>
                {g.lessonsListTitle} ({selectedCourseName})
              </span>
            </h4>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
              {filteredLessons.map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                const displayTitle = appLang === 'ar' ? lesson.title : lesson.titleEn;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-start p-3 rounded-2xl border transition text-xs space-y-1 block ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-xs">{displayTitle}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        {lesson.level}
                      </span>
                    </div>
                    {appLang === 'ar' ? (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{lesson.summary}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{lesson.formula || lesson.titleEn}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Lesson Details Card */}
          {selectedLesson && (
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{selectedCourse.flag}</span>
                    <h3 className="font-bold text-lg text-white">
                      {appLang === 'ar' ? selectedLesson.title : selectedLesson.titleEn}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {selectedLesson.titleEn} • {selectedLesson.level}
                  </span>
                </div>

                {selectedLesson.formula && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-inner">
                    {g.rulePrefix} {selectedLesson.formula}
                  </div>
                )}
              </div>

              {/* Explanation Text */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed">
                {selectedLesson.explanation}
              </div>

              {/* Examples with Audio Speech */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{g.examplesHeading}</span>
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {selectedLesson.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-cyan-300 text-sm">{ex.target}</p>
                        <p className="text-slate-300 font-medium">{ex.translation}</p>
                        {ex.note && (
                          <span className="text-[10px] text-slate-500 font-mono italic block">
                            {g.notePrefix} {ex.note}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => speakText(ex.target, selectedCourse.langCode)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition shrink-0"
                        title={t.common.listen}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Tips */}
              {selectedLesson.keyTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                  <h5 className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{g.tipsHeading}</span>
                  </h5>
                  <ul className="space-y-1 text-xs text-emerald-100">
                    {selectedLesson.keyTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Interactive Quiz Arena */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>
                  {g.quizTitle} ({selectedCourseName})
                </span>
              </h3>
              <p className="text-xs text-slate-400">{g.quizSubtitle}</p>
            </div>

            {quizSubmitted && (
              <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-2">
                <span>{g.scoreLabel}</span>
                <span className="font-mono text-base">
                  {calculateScore()} / {selectedCourse.quizzes.length}
                </span>
                <span>
                  {calculateScore() === selectedCourse.quizzes.length ? g.excellent : g.great}
                </span>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-5">
            {selectedCourse.quizzes.map((quiz, qIdx) => {
              const selectedOpt = userAnswers[quiz.id];
              const isCorrect = selectedOpt === quiz.correctIndex;

              return (
                <div
                  key={quiz.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {qIdx + 1}
                    </span>
                    <h4 className="font-bold text-sm text-white">{quiz.question}</h4>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ps-7">
                    {quiz.options.map((opt, optIdx) => {
                      const isChosen = selectedOpt === optIdx;
                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';

                      if (quizSubmitted) {
                        if (optIdx === quiz.correctIndex) {
                          btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400';
                        } else if (isChosen && !isCorrect) {
                          btnStyle = 'bg-red-950 border-red-500 text-red-200';
                        }
                      } else if (isChosen) {
                        btnStyle = 'bg-indigo-950 border-indigo-500 text-indigo-200 ring-1 ring-indigo-400';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectQuizAnswer(quiz.id, optIdx)}
                          className={`p-3 rounded-xl border text-start text-xs font-semibold transition ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {quizSubmitted && (
                    <div
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        isCorrect
                          ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
                          : 'bg-red-950/40 border border-red-800/60 text-red-200'
                      }`}
                    >
                      <p className="font-bold">
                        {isCorrect ? g.correctAnswer : g.wrongAnswer}
                      </p>
                      <p className="text-slate-300 text-[11px]">{quiz.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit / Retake Button */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            {!quizSubmitted ? (
              <button
                onClick={() => setQuizSubmitted(true)}
                disabled={Object.keys(userAnswers).length === 0}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{g.submitQuiz}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setUserAnswers({});
                  setQuizSubmitted(false);
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{g.retakeQuiz}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
