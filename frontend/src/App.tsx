import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginSpread } from './components/auth/LoginSpread';
import { RegisterSpread } from './components/auth/RegisterSpread';
import { BookShell } from './components/book/BookShell';

// Chapters
import { Frontispiece } from './components/chapters/Frontispiece';
import { IntakeChapter } from './components/chapters/IntakeChapter';
import { PatternsChapter } from './components/chapters/PatternsChapter';
import { ModelsChapter } from './components/chapters/ModelsChapter';
import { ExplainChapter } from './components/chapters/ExplainChapter';
import { SubgroupsChapter } from './components/chapters/SubgroupsChapter';
import { MonitorChapter } from './components/chapters/MonitorChapter';
import { ReviewChapter } from './components/chapters/ReviewChapter';
import { ExportChapter } from './components/chapters/ExportChapter';
import { AppendixChapter } from './components/chapters/AppendixChapter';

const CHAPTER_METADATA = [
  { chapter: 0, title: 'Frontispiece', pageStart: 1 },
  { chapter: 1, title: 'Intake & Ledger', pageStart: 3 },
  { chapter: 2, title: 'Patterns', pageStart: 7 },
  { chapter: 3, title: 'Models & Calibration', pageStart: 11 },
  { chapter: 4, title: 'Explanations (SHAP)', pageStart: 15 },
  { chapter: 5, title: 'Subgroups & Fairness', pageStart: 19 },
  { chapter: 6, title: 'Monitoring & Drift', pageStart: 21 },
  { chapter: 7, title: 'Clinical Review', pageStart: 23 },
  { chapter: 8, title: 'Export & Colophon', pageStart: 25 },
  { chapter: 9, title: 'Appendix', pageStart: 27 },
];

const MainBookApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentChapter, setCurrentChapter] = useState<number>(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-desk flex items-center justify-center font-mono text-xs text-ink">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-lime rounded-full animate-ping" />
          <span>Opening the ReadmitExplain AI Dossier...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterSpread onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginSpread onSwitchToRegister={() => setAuthView('register')} />;
  }

  const meta = CHAPTER_METADATA.find(c => c.chapter === currentChapter) || CHAPTER_METADATA[0];

  const handleNextPage = () => {
    if (currentChapter < CHAPTER_METADATA.length - 1) {
      setCurrentChapter(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1);
    }
  };

  const renderChapterContent = () => {
    switch (currentChapter) {
      case 0:
        return (
          <Frontispiece
            onOpenChapter={(ch) => setCurrentChapter(ch)}
            onOpenUpload={() => setCurrentChapter(1)}
          />
        );
      case 1:
        return <IntakeChapter onNextChapter={() => setCurrentChapter(2)} />;
      case 2:
        return <PatternsChapter onNextChapter={() => setCurrentChapter(3)} />;
      case 3:
        return <ModelsChapter onNextChapter={() => setCurrentChapter(4)} />;
      case 4:
        return <ExplainChapter onNextChapter={() => setCurrentChapter(5)} />;
      case 5:
        return <SubgroupsChapter onNextChapter={() => setCurrentChapter(6)} />;
      case 6:
        return <MonitorChapter onNextChapter={() => setCurrentChapter(7)} />;
      case 7:
        return <ReviewChapter onNextChapter={() => setCurrentChapter(8)} />;
      case 8:
        return <ExportChapter />;
      case 9:
        return <AppendixChapter />;
      default:
        return <div>Chapter {currentChapter}</div>;
    }
  };

  return (
    <BookShell
      currentChapter={currentChapter}
      chapterTitle={meta.title}
      leftPageNumber={meta.pageStart}
      rightPageNumber={meta.pageStart + 1}
      totalPages={28}
      onNavigateChapter={(ch) => setCurrentChapter(ch)}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
      onOpenUpload={() => setCurrentChapter(1)}
    >
      {renderChapterContent()}
    </BookShell>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainBookApp />
    </AuthProvider>
  );
};

export default App;
