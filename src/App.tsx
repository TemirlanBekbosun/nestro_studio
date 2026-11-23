/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { DEFAULT_STUDIO_DATA } from './data/defaultStudioData.ts';
import type {
  ProjectCase,
  SiteFormatId,
  StudioDatabaseContent,
} from './types/studio.ts';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { PortfolioSection } from './components/PortfolioSection.tsx';
import { ProjectCaseModal } from './components/ProjectCaseModal.tsx';
import { ServicesAndBenefitsSection } from './components/ServicesAndBenefitsSection.tsx';
import { ProcessAndTechSection } from './components/ProcessAndTechSection.tsx';
import { FaqAndContactSection } from './components/FaqAndContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { LiquidGlassBackground } from './components/LiquidGlassBackground.tsx';
import { Reveal } from './components/Reveal.tsx';

export default function App() {
  const [content, setContent] = useState<StudioDatabaseContent>(DEFAULT_STUDIO_DATA);
  const [selectedProject, setSelectedProject] = useState<ProjectCase | null>(null);
  const [selectedFormatId, setSelectedFormatId] =
    useState<SiteFormatId>('multi-page');
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StudioDatabaseContent | null) => {
        if (active && data && data.studio && Array.isArray(data.projects)) {
          setContent(data);
        }
      })
      .catch(() => {
        // Keep seeded defaults if offline
      });
    return () => {
      active = false;
    };
  }, []);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectServiceFormat = (formatId: SiteFormatId) => {
    setSelectedFormatId(formatId);
    scrollToElement('contact');
  };

  const handleDiscussSimilarProject = (project: ProjectCase) => {
    setSelectedFormatId(
      project.category === 'single-page' ? 'single-page' : 'multi-page',
    );
    scrollToElement('contact');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F8] text-[#171919] flex flex-col overflow-x-clip">
      <LiquidGlassBackground />
      <Header
        brandName={content.studio.brandName}
        onDiscussClick={() => scrollToElement('contact')}
      />

      <main className="flex-1">
        <HeroSection
          pageRateKgs={content.studio.pageRateKgs}
          projectsCount={content.projects.length}
          onDiscussClick={() => scrollToElement('contact')}
          onViewProjectsClick={() => scrollToElement('projects')}
        />

        <Reveal>
          <PortfolioSection
            projects={content.projects}
            onSelectProject={setSelectedProject}
          />
        </Reveal>

        <Reveal>
          <ServicesAndBenefitsSection
            services={content.services}
            onSelectService={handleSelectServiceFormat}
          />
        </Reveal>

        <Reveal>
          <ProcessAndTechSection />
        </Reveal>

        <Reveal>
          <AboutSection studio={content.studio} />
        </Reveal>

        <Reveal>
          <FaqAndContactSection
            faq={content.faq}
            studio={content.studio}
            selectedFormatId={selectedFormatId}
            onSelectFormatId={setSelectedFormatId}
          />
        </Reveal>
      </main>

      <Footer
        studio={content.studio}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <ProjectCaseModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onDiscussSimilar={handleDiscussSimilarProject}
      />

      <AdminModal
        open={adminOpen}
        content={content}
        onClose={() => setAdminOpen(false)}
        onContentUpdated={setContent}
      />
    </div>
  );
}
